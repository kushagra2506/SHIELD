export interface FlowItem {
  counterparty_id: string;
  direction: 'inflow_to_merchant' | 'outflow_from_merchant' | string;
  transaction_count: number;
  flow_volume_inr: number;
}

export type RiskLevel = 'Low' | 'Moderate' | 'Elevated';

export interface RiskFactor {
  factor: string;
  severity: 'low' | 'medium' | 'high';
  points: number;
  description: string;
}

export interface MerchantRecord {
  merchant_id: string;
  declared_category: string;
  monthly_volume_inr: number;
  monthly_txn_count: number;
  avg_txn_value_inr: number;
  off_hours_ratio: number;
  round_amount_ratio: number;
  payout_velocity_hrs: number;
  unique_payer_ratio: number;
  high_val_txn_ratio: number;
  dispute_rate_pct: number;
  is_gambling_front: number; // Ground truth, used strictly for offline validation display
  payer_cluster_ids: string;
  payer_flows_json: FlowItem[];
  payout_destination_ids: string;
  payout_flows_json: FlowItem[];
  network_data_status: string;

  // Explainable Risk Scoring (derived without is_gambling_front)
  riskScore: number;
  riskLevel: RiskLevel;
  riskFactors: RiskFactor[];
}

export interface CategoryStats {
  category: string;
  count: number;
  totalVolume: number;
  medianVolume: number;
  medianTxnCount: number;
  medianAvgTxnValue: number;
  medianOffHoursRatio: number;
  medianRoundAmountRatio: number;
  medianPayoutVelocity: number;
  medianUniquePayerRatio: number;
  medianHighValRatio: number;
  medianDisputeRate: number;
}

export interface DatasetSummary {
  totalMerchants: number;
  totalMonthlyVolume: number;
  totalMonthlyTxns: number;
  avgDisputeRate: number;
  categoryCount: number;
  categories: string[];
}

