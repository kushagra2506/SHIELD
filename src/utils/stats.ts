import { CategoryStats, DatasetSummary, FlowItem, MerchantRecord, RiskFactor, RiskLevel } from '../types';

export function calculateMedian(numbers: number[]): number {
  if (!numbers || numbers.length === 0) return 0;
  const sorted = [...numbers].filter(n => !isNaN(n)).sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function computeCategoryStatsMap(merchants: MerchantRecord[]): Map<string, CategoryStats> {
  const byCat = new Map<string, MerchantRecord[]>();
  for (const m of merchants) {
    const list = byCat.get(m.declared_category) || [];
    list.push(m);
    byCat.set(m.declared_category, list);
  }

  const map = new Map<string, CategoryStats>();

  byCat.forEach((list, category) => {
    map.set(category, {
      category,
      count: list.length,
      totalVolume: list.reduce((acc, m) => acc + (m.monthly_volume_inr || 0), 0),
      medianVolume: calculateMedian(list.map(m => m.monthly_volume_inr)),
      medianTxnCount: calculateMedian(list.map(m => m.monthly_txn_count)),
      medianAvgTxnValue: calculateMedian(list.map(m => m.avg_txn_value_inr)),
      medianOffHoursRatio: calculateMedian(list.map(m => m.off_hours_ratio)),
      medianRoundAmountRatio: calculateMedian(list.map(m => m.round_amount_ratio)),
      medianPayoutVelocity: calculateMedian(list.map(m => m.payout_velocity_hrs)),
      medianUniquePayerRatio: calculateMedian(list.map(m => m.unique_payer_ratio)),
      medianHighValRatio: calculateMedian(list.map(m => m.high_val_txn_ratio)),
      medianDisputeRate: calculateMedian(list.map(m => m.dispute_rate_pct)),
    });
  });

  return map;
}

export function computeDatasetSummary(merchants: MerchantRecord[]): DatasetSummary {
  if (merchants.length === 0) {
    return {
      totalMerchants: 0,
      totalMonthlyVolume: 0,
      totalMonthlyTxns: 0,
      avgDisputeRate: 0,
      categoryCount: 0,
      categories: [],
    };
  }

  const categories = Array.from(new Set(merchants.map(m => m.declared_category))).sort();
  const totalVolume = merchants.reduce((acc, m) => acc + (m.monthly_volume_inr || 0), 0);
  const totalTxns = merchants.reduce((acc, m) => acc + (m.monthly_txn_count || 0), 0);
  const avgDispute = merchants.reduce((acc, m) => acc + (m.dispute_rate_pct || 0), 0) / merchants.length;

  return {
    totalMerchants: merchants.length,
    totalMonthlyVolume: totalVolume,
    totalMonthlyTxns: totalTxns,
    avgDisputeRate: avgDispute,
    categoryCount: categories.length,
    categories,
  };
}

/**
 * Computes an EXPLAINABLE, TRANSPARENT risk indicator from operational features.
 * CRITICAL RULE: DOES NOT use is_gambling_front!
 */
export function evaluateMerchantRisk(
  merchant: Omit<MerchantRecord, 'riskScore' | 'riskLevel' | 'riskFactors'>,
  categoryMedian?: CategoryStats
): { riskScore: number; riskLevel: RiskLevel; riskFactors: RiskFactor[] } {
  let score = 10; // Baseline low risk
  const factors: RiskFactor[] = [];

  const catMedOffHours = categoryMedian?.medianOffHoursRatio ?? 0.08;
  const catMedPayout = categoryMedian?.medianPayoutVelocity ?? 28;
  const catMedRound = categoryMedian?.medianRoundAmountRatio ?? 0.30;
  const catMedDispute = categoryMedian?.medianDisputeRate ?? 0.05;

  // 1. Off-hours activity check
  if (merchant.off_hours_ratio > 0.25 || (catMedOffHours > 0 && merchant.off_hours_ratio > catMedOffHours * 2.5)) {
    const pts = merchant.off_hours_ratio > 0.35 ? 25 : 18;
    score += pts;
    factors.push({
      factor: 'High Off-Hours Activity',
      severity: pts > 20 ? 'high' : 'medium',
      points: pts,
      description: `${(merchant.off_hours_ratio * 100).toFixed(1)}% of transactions occurred outside standard commercial hours (peer median: ${(catMedOffHours * 100).toFixed(1)}%).`,
    });
  }

  // 2. Settlement velocity (Extremely fast payout velocity compared to peer median)
  if (merchant.payout_velocity_hrs < 8 || (catMedPayout > 0 && merchant.payout_velocity_hrs < catMedPayout * 0.35)) {
    const pts = merchant.payout_velocity_hrs < 4 ? 25 : 18;
    score += pts;
    factors.push({
      factor: 'Accelerated Settlement Velocity',
      severity: pts > 20 ? 'high' : 'medium',
      points: pts,
      description: `Funds swept out in ${merchant.payout_velocity_hrs.toFixed(1)} hrs post-receipt (peer median: ${catMedPayout.toFixed(1)} hrs), characteristic of rapid fund drain.`,
    });
  }

  // 3. Round amount ratio
  if (merchant.round_amount_ratio > 0.45 || (catMedRound > 0 && merchant.round_amount_ratio > catMedRound * 1.8)) {
    const pts = merchant.round_amount_ratio > 0.6 ? 20 : 14;
    score += pts;
    factors.push({
      factor: 'Elevated Round-Amount Transfers',
      severity: pts > 15 ? 'high' : 'medium',
      points: pts,
      description: `${(merchant.round_amount_ratio * 100).toFixed(1)}% of volume consists of neat round-number amounts (peer median: ${(catMedRound * 100).toFixed(1)}%).`,
    });
  }

  // 4. Dispute rate elevation
  if (merchant.dispute_rate_pct > 0.5 || (catMedDispute > 0 && merchant.dispute_rate_pct > catMedDispute * 2.5)) {
    const pts = merchant.dispute_rate_pct > 1.5 ? 25 : 15;
    score += pts;
    factors.push({
      factor: 'Elevated Dispute Rate',
      severity: pts > 20 ? 'high' : 'medium',
      points: pts,
      description: `Dispute rate is ${merchant.dispute_rate_pct.toFixed(2)}% (peer median: ${catMedDispute.toFixed(2)}%), indicating above-normal customer friction/chargebacks.`,
    });
  }

  // 5. Unique payer ratio anomalies
  if (merchant.unique_payer_ratio < 0.30) {
    const pts = 12;
    score += pts;
    factors.push({
      factor: 'Low Unique Payer Diversity',
      severity: 'medium',
      points: pts,
      description: `Only ${(merchant.unique_payer_ratio * 100).toFixed(1)}% unique payers per transaction, suggesting concentrated repeat payers.`,
    });
  }

  // Cap score at 100
  const finalScore = Math.min(100, Math.max(0, score));

  let riskLevel: RiskLevel = 'Low';
  if (finalScore >= 70) {
    riskLevel = 'Elevated';
  } else if (finalScore >= 40) {
    riskLevel = 'Moderate';
  }

  if (factors.length === 0) {
    factors.push({
      factor: 'Conforming Operational Patterns',
      severity: 'low',
      points: 0,
      description: 'Transaction frequency, payout latency, and ticket profiles align closely with declared category medians.',
    });
  }

  return { riskScore: finalScore, riskLevel, riskFactors: factors };
}

