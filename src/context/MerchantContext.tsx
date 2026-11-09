import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { CategoryStats, DatasetSummary, MerchantRecord } from '../types';
import { loadDefaultDataset, parseCsvFile } from '../utils/csvLoader';
import { computeCategoryStatsMap, computeDatasetSummary } from '../utils/stats';

export interface CounterpartyMeta {
  counterpartyId: string;
  type: 'payer' | 'payout';
  connectedMerchants: string[]; // merchant_ids
  totalTxnCount: number;
  totalVolumeInr: number;
}

interface MerchantContextValue {
  merchants: MerchantRecord[];
  selectedMerchant: MerchantRecord | null;
  selectedMerchantId: string | null;
  selectMerchant: (merchantId: string) => void;
  resetSelection: () => void;
  categoryStatsMap: Map<string, CategoryStats>;
  datasetSummary: DatasetSummary;
  counterpartyMap: Map<string, CounterpartyMeta>;
  isLoading: boolean;
  error: string | null;
  activeTab: 'profile' | 'twin' | 'network';
  setActiveTab: (tab: 'profile' | 'twin' | 'network') => void;
  loadCsvFile: (file: File) => Promise<void>;
  reloadDefaultDataset: () => Promise<void>;
  dismissError: () => void;
}

const MerchantContext = createContext<MerchantContextValue | null>(null);

export const MerchantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [merchants, setMerchants] = useState<MerchantRecord[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'twin' | 'network'>('profile');

  // Load default dataset on mount
  const loadDefault = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await loadDefaultDataset();
      setMerchants(data);
      if (data.length > 0) {
        setSelectedMerchantId(data[0].merchant_id);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load merchant dataset');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDefault();
  }, []);

  const handleLoadFile = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await parseCsvFile(file);
      setMerchants(data);
      if (data.length > 0) {
        setSelectedMerchantId(data[0].merchant_id);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to parse custom CSV file');
    } finally {
      setIsLoading(false);
    }
  };

  const selectMerchant = (id: string) => {
    setSelectedMerchantId(id);
  };

  const resetSelection = () => {
    if (merchants.length > 0) {
      setSelectedMerchantId(merchants[0].merchant_id);
    }
  };

  // Selected merchant object
  const selectedMerchant = useMemo(() => {
    if (!selectedMerchantId || merchants.length === 0) return null;
    return merchants.find(m => m.merchant_id === selectedMerchantId) || merchants[0];
  }, [selectedMerchantId, merchants]);

  // Dynamic category stats
  const categoryStatsMap = useMemo(() => {
    return computeCategoryStatsMap(merchants);
  }, [merchants]);

  // Dataset summary
  const datasetSummary = useMemo(() => {
    return computeDatasetSummary(merchants);
  }, [merchants]);

  // Index counterparties dynamically across the entire loaded dataset
  const counterpartyMap = useMemo(() => {
    const map = new Map<string, CounterpartyMeta>();

    for (const m of merchants) {
      // Payer flows (inflow)
      if (Array.isArray(m.payer_flows_json)) {
        for (const flow of m.payer_flows_json) {
          if (!flow.counterparty_id) continue;
          const id = flow.counterparty_id;
          const existing = map.get(id);
          if (existing) {
            if (!existing.connectedMerchants.includes(m.merchant_id)) {
              existing.connectedMerchants.push(m.merchant_id);
            }
            existing.totalTxnCount += flow.transaction_count || 0;
            existing.totalVolumeInr += flow.flow_volume_inr || 0;
          } else {
            map.set(id, {
              counterpartyId: id,
              type: 'payer',
              connectedMerchants: [m.merchant_id],
              totalTxnCount: flow.transaction_count || 0,
              totalVolumeInr: flow.flow_volume_inr || 0,
            });
          }
        }
      }

      // Payout flows (outflow)
      if (Array.isArray(m.payout_flows_json)) {
        for (const flow of m.payout_flows_json) {
          if (!flow.counterparty_id) continue;
          const id = flow.counterparty_id;
          const existing = map.get(id);
          if (existing) {
            if (!existing.connectedMerchants.includes(m.merchant_id)) {
              existing.connectedMerchants.push(m.merchant_id);
            }
            existing.totalTxnCount += flow.transaction_count || 0;
            existing.totalVolumeInr += flow.flow_volume_inr || 0;
          } else {
            map.set(id, {
              counterpartyId: id,
              type: 'payout',
              connectedMerchants: [m.merchant_id],
              totalTxnCount: flow.transaction_count || 0,
              totalVolumeInr: flow.flow_volume_inr || 0,
            });
          }
        }
      }
    }

    return map;
  }, [merchants]);

  return (
    <MerchantContext.Provider
      value={{
        merchants,
        selectedMerchant,
        selectedMerchantId,
        selectMerchant,
        resetSelection,
        categoryStatsMap,
        datasetSummary,
        counterpartyMap,
        isLoading,
        error,
        activeTab,
        setActiveTab,
        loadCsvFile: handleLoadFile,
        reloadDefaultDataset: loadDefault,
        dismissError: () => setError(null),
      }}
    >
      {children}
    </MerchantContext.Provider>
  );
};

export const useMerchant = (): MerchantContextValue => {
  const context = useContext(MerchantContext);
  if (!context) {
    throw new Error('useMerchant must be used within a MerchantProvider');
  }
  return context;
};

