import Papa from 'papaparse';
import { FlowItem, MerchantRecord } from '../types';
import { computeCategoryStatsMap, evaluateMerchantRisk } from './stats';

function parseJsonSafe(val: any): FlowItem[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val.trim());
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // Sometimes quotes might be escaped or double wrapped
      try {
        const cleaned = val.replace(/^["']|["']$/g, '').replace(/""/g, '"');
        const parsed = JSON.parse(cleaned);
        return Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        console.warn('Failed to parse flow JSON:', val, err);
        return [];
      }
    }
  }
  return [];
}

export function processParsedRows(rows: any[]): MerchantRecord[] {
  // First, parse into preliminary records
  const preliminary = rows
    .filter(row => row && row.merchant_id && typeof row.merchant_id === 'string' && row.merchant_id.trim() !== '')
    .map(row => {
      const payerFlows = parseJsonSafe(row.payer_flows_json);
      const payoutFlows = parseJsonSafe(row.payout_flows_json);

      return {
        merchant_id: String(row.merchant_id).trim(),
        declared_category: String(row.declared_category || 'Uncategorized').trim(),
        monthly_volume_inr: Number(row.monthly_volume_inr) || 0,
        monthly_txn_count: Number(row.monthly_txn_count) || 0,
        avg_txn_value_inr: Number(row.avg_txn_value_inr) || 0,
        off_hours_ratio: Number(row.off_hours_ratio) || 0,
        round_amount_ratio: Number(row.round_amount_ratio) || 0,
        payout_velocity_hrs: Number(row.payout_velocity_hrs) || 0,
        unique_payer_ratio: Number(row.unique_payer_ratio) || 0,
        high_val_txn_ratio: Number(row.high_val_txn_ratio) || 0,
        dispute_rate_pct: Number(row.dispute_rate_pct) || 0,
        is_gambling_front: Number(row.is_gambling_front) || 0,
        payer_cluster_ids: String(row.payer_cluster_ids || ''),
        payer_flows_json: payerFlows,
        payout_destination_ids: String(row.payout_destination_ids || ''),
        payout_flows_json: payoutFlows,
        network_data_status: String(row.network_data_status || ''),
      };
    });

  // Calculate peer medians first so risk calculation can measure relative category deviation
  const dummyMerchants: MerchantRecord[] = preliminary.map(p => ({
    ...p,
    riskScore: 0,
    riskLevel: 'Low',
    riskFactors: [],
  }));

  const categoryMap = computeCategoryStatsMap(dummyMerchants);

  // Evaluate risk score for each merchant (strictly without using is_gambling_front)
  return preliminary.map(p => {
    const catStats = categoryMap.get(p.declared_category);
    const risk = evaluateMerchantRisk(p, catStats);
    return {
      ...p,
      riskScore: risk.riskScore,
      riskLevel: risk.riskLevel,
      riskFactors: risk.riskFactors,
    };
  });
}

export async function loadDefaultDataset(): Promise<MerchantRecord[]> {
  const url = '/payu_merchant_fraud_dataset_enhanced.csv';
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load default dataset from ${url} (HTTP ${response.status})`);
  }
  const text = await response.text();
  return parseCsvString(text);
}

export function parseCsvString(csvText: string): Promise<MerchantRecord[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          if (!results.data || results.data.length === 0) {
            reject(new Error('CSV file appears to be empty or has no rows.'));
            return;
          }
          const records = processParsedRows(results.data);
          if (records.length === 0) {
            reject(new Error('No valid merchant rows found in CSV. Please verify column headers.'));
            return;
          }
          resolve(records);
        } catch (err: any) {
          reject(new Error(`Error parsing dataset: ${err.message}`));
        }
      },
      error: (error: any) => {
        reject(new Error(`PapaParse Error: ${error.message}`));
      },
    });
  });
}

export function parseCsvFile(file: File): Promise<MerchantRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        reject(new Error('File is empty.'));
        return;
      }
      parseCsvString(text).then(resolve).catch(reject);
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file from disk.'));
    };
    reader.readAsText(file);
  });
}
