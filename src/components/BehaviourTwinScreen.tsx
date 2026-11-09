import React, { useMemo } from 'react';
import { useMerchant } from '../context/MerchantContext';
import { formatINR, formatNumber, formatPercent, formatHours } from '../utils/formatters';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  Layers,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Clock,
  Coins,
  Percent,
  CheckCircle2,
  DollarSign,
  ShieldAlert,
} from 'lucide-react';

export const BehaviourTwinScreen: React.FC = () => {
  const { selectedMerchant, merchants, selectMerchant, categoryStatsMap } = useMerchant();

  if (!selectedMerchant) {
    return (
      <div className="bg-[#111827] border border-[#243049] rounded-xl p-8 text-center text-slate-400">
        <p>No merchant selected. Please select a merchant to view behaviour twin analysis.</p>
      </div>
    );
  }

  // Peers in the same declared category
  const categoryPeers = useMemo(() => {
    return merchants.filter(m => m.declared_category === selectedMerchant.declared_category);
  }, [merchants, selectedMerchant.declared_category]);

  const categoryMedians = categoryStatsMap.get(selectedMerchant.declared_category);

  // Calculate min and max for the 8 metrics within category for normalization
  const categoryRanges = useMemo(() => {
    if (categoryPeers.length === 0) return null;

    const getMinMax = (extractor: (m: import('../types').MerchantRecord) => number) => {
      const vals = categoryPeers.map(extractor).filter(v => !isNaN(v));
      return {
        min: Math.min(...vals),
        max: Math.max(...vals),
      };
    };

    return {
      monthlyVolume: getMinMax(m => m.monthly_volume_inr),
      avgTxnValue: getMinMax(m => m.avg_txn_value_inr),
      offHoursRatio: getMinMax(m => m.off_hours_ratio),
      roundAmountRatio: getMinMax(m => m.round_amount_ratio),
      uniquePayerRatio: getMinMax(m => m.unique_payer_ratio),
      highValRatio: getMinMax(m => m.high_val_txn_ratio),
      disputeRate: getMinMax(m => m.dispute_rate_pct),
      payoutVelocity: getMinMax(m => m.payout_velocity_hrs),
    };
  }, [categoryPeers]);

  // Comparison metrics definition
  const comparisonMetrics = useMemo(() => {
    if (!categoryMedians || !categoryRanges) return [];

    const calculateDeltaPct = (merchantVal: number, medianVal: number) => {
      if (medianVal === 0) return merchantVal === 0 ? 0 : 100;
      return ((merchantVal - medianVal) / medianVal) * 100;
    };

    const normalize = (val: number, range: { min: number; max: number }) => {
      if (range.max === range.min) return 50;
      const norm = ((val - range.min) / (range.max - range.min)) * 100;
      return Math.max(5, Math.min(95, norm));
    };

    return [
      {
        id: 'monthly_volume',
        label: 'Monthly Volume',
        unit: 'INR',
        merchantVal: selectedMerchant.monthly_volume_inr,
        medianVal: categoryMedians.medianVolume,
        formattedMerchant: formatINR(selectedMerchant.monthly_volume_inr, true),
        formattedMedian: formatINR(categoryMedians.medianVolume, true),
        deltaPct: calculateDeltaPct(selectedMerchant.monthly_volume_inr, categoryMedians.medianVolume),
        range: categoryRanges.monthlyVolume,
        normMerchant: normalize(selectedMerchant.monthly_volume_inr, categoryRanges.monthlyVolume),
        normMedian: normalize(categoryMedians.medianVolume, categoryRanges.monthlyVolume),
        isAnomaly: Math.abs(calculateDeltaPct(selectedMerchant.monthly_volume_inr, categoryMedians.medianVolume)) > 100,
        direction: 'higher', // neutral
      },
      {
        id: 'avg_txn_val',
        label: 'Avg Txn Value',
        unit: 'INR',
        merchantVal: selectedMerchant.avg_txn_value_inr,
        medianVal: categoryMedians.medianAvgTxnValue,
        formattedMerchant: formatINR(selectedMerchant.avg_txn_value_inr),
        formattedMedian: formatINR(categoryMedians.medianAvgTxnValue),
        deltaPct: calculateDeltaPct(selectedMerchant.avg_txn_value_inr, categoryMedians.medianAvgTxnValue),
        range: categoryRanges.avgTxnValue,
        normMerchant: normalize(selectedMerchant.avg_txn_value_inr, categoryRanges.avgTxnValue),
        normMedian: normalize(categoryMedians.medianAvgTxnValue, categoryRanges.avgTxnValue),
        isAnomaly: selectedMerchant.avg_txn_value_inr > categoryMedians.medianAvgTxnValue * 2.5,
        direction: 'higher',
      },
      {
        id: 'off_hours',
        label: 'Off-Hours Ratio',
        unit: '%',
        merchantVal: selectedMerchant.off_hours_ratio,
        medianVal: categoryMedians.medianOffHoursRatio,
        formattedMerchant: formatPercent(selectedMerchant.off_hours_ratio),
        formattedMedian: formatPercent(categoryMedians.medianOffHoursRatio),
        deltaPct: calculateDeltaPct(selectedMerchant.off_hours_ratio, categoryMedians.medianOffHoursRatio),
        range: categoryRanges.offHoursRatio,
        normMerchant: normalize(selectedMerchant.off_hours_ratio, categoryRanges.offHoursRatio),
        normMedian: normalize(categoryMedians.medianOffHoursRatio, categoryRanges.offHoursRatio),
        isAnomaly: selectedMerchant.off_hours_ratio > categoryMedians.medianOffHoursRatio * 2,
        direction: 'higher',
      },
      {
        id: 'round_amount',
        label: 'Round Amount Ratio',
        unit: '%',
        merchantVal: selectedMerchant.round_amount_ratio,
        medianVal: categoryMedians.medianRoundAmountRatio,
        formattedMerchant: formatPercent(selectedMerchant.round_amount_ratio),
        formattedMedian: formatPercent(categoryMedians.medianRoundAmountRatio),
        deltaPct: calculateDeltaPct(selectedMerchant.round_amount_ratio, categoryMedians.medianRoundAmountRatio),
        range: categoryRanges.roundAmountRatio,
        normMerchant: normalize(selectedMerchant.round_amount_ratio, categoryRanges.roundAmountRatio),
        normMedian: normalize(categoryMedians.medianRoundAmountRatio, categoryRanges.roundAmountRatio),
        isAnomaly: selectedMerchant.round_amount_ratio > categoryMedians.medianRoundAmountRatio * 1.8,
        direction: 'higher',
      },
      {
        id: 'unique_payer',
        label: 'Unique Payer Ratio',
        unit: '%',
        merchantVal: selectedMerchant.unique_payer_ratio,
        medianVal: categoryMedians.medianUniquePayerRatio,
        formattedMerchant: formatPercent(selectedMerchant.unique_payer_ratio),
        formattedMedian: formatPercent(categoryMedians.medianUniquePayerRatio),
        deltaPct: calculateDeltaPct(selectedMerchant.unique_payer_ratio, categoryMedians.medianUniquePayerRatio),
        range: categoryRanges.uniquePayerRatio,
        normMerchant: normalize(selectedMerchant.unique_payer_ratio, categoryRanges.uniquePayerRatio),
        normMedian: normalize(categoryMedians.medianUniquePayerRatio, categoryRanges.uniquePayerRatio),
        isAnomaly: selectedMerchant.unique_payer_ratio < categoryMedians.medianUniquePayerRatio * 0.6,
        direction: 'lower',
      },
      {
        id: 'high_val',
        label: 'High-Val Txn Ratio',
        unit: '%',
        merchantVal: selectedMerchant.high_val_txn_ratio,
        medianVal: categoryMedians.medianHighValRatio,
        formattedMerchant: formatPercent(selectedMerchant.high_val_txn_ratio),
        formattedMedian: formatPercent(categoryMedians.medianHighValRatio),
        deltaPct: calculateDeltaPct(selectedMerchant.high_val_txn_ratio, categoryMedians.medianHighValRatio),
        range: categoryRanges.highValRatio,
        normMerchant: normalize(selectedMerchant.high_val_txn_ratio, categoryRanges.highValRatio),
        normMedian: normalize(categoryMedians.medianHighValRatio, categoryRanges.highValRatio),
        isAnomaly: selectedMerchant.high_val_txn_ratio > categoryMedians.medianHighValRatio * 2,
        direction: 'higher',
      },
      {
        id: 'dispute_rate',
        label: 'Dispute Rate',
        unit: '%',
        merchantVal: selectedMerchant.dispute_rate_pct,
        medianVal: categoryMedians.medianDisputeRate,
        formattedMerchant: formatPercent(selectedMerchant.dispute_rate_pct, true),
        formattedMedian: formatPercent(categoryMedians.medianDisputeRate, true),
        deltaPct: calculateDeltaPct(selectedMerchant.dispute_rate_pct, categoryMedians.medianDisputeRate),
        range: categoryRanges.disputeRate,
        normMerchant: normalize(selectedMerchant.dispute_rate_pct, categoryRanges.disputeRate),
        normMedian: normalize(categoryMedians.medianDisputeRate, categoryRanges.disputeRate),
        isAnomaly: selectedMerchant.dispute_rate_pct > categoryMedians.medianDisputeRate * 2.5,
        direction: 'higher',
      },
      {
        id: 'payout_velocity',
        label: 'Payout Velocity',
        unit: 'hrs',
        merchantVal: selectedMerchant.payout_velocity_hrs,
        medianVal: categoryMedians.medianPayoutVelocity,
        formattedMerchant: formatHours(selectedMerchant.payout_velocity_hrs),
        formattedMedian: formatHours(categoryMedians.medianPayoutVelocity),
        deltaPct: calculateDeltaPct(selectedMerchant.payout_velocity_hrs, categoryMedians.medianPayoutVelocity),
        range: categoryRanges.payoutVelocity,
        normMerchant: normalize(selectedMerchant.payout_velocity_hrs, categoryRanges.payoutVelocity),
        normMedian: normalize(categoryMedians.medianPayoutVelocity, categoryRanges.payoutVelocity),
        isAnomaly: selectedMerchant.payout_velocity_hrs < categoryMedians.medianPayoutVelocity * 0.4,
        direction: 'lower',
      },
    ];
  }, [selectedMerchant, categoryMedians, categoryRanges]);

  // Radar chart normalized data
  const radarData = useMemo(() => {
    return comparisonMetrics.map(m => ({
      metric: m.label,
      Merchant: Math.round(m.normMerchant),
      'Category Median': Math.round(m.normMedian),
      rawMerchant: m.formattedMerchant,
      rawMedian: m.formattedMedian,
      delta: `${m.deltaPct >= 0 ? '+' : ''}${m.deltaPct.toFixed(1)}%`,
    }));
  }, [comparisonMetrics]);

  // Behaviour observations generated dynamically from calculations
  const observations = useMemo(() => {
    if (!categoryMedians) return [];
    const obs: { title: string; desc: string; type: 'warning' | 'alert' | 'normal' }[] = [];

    // 1. Off-hours
    if (selectedMerchant.off_hours_ratio > categoryMedians.medianOffHoursRatio * 2.2) {
      obs.push({
        title: 'Off-hours activity significantly above peers',
        desc: `${formatPercent(selectedMerchant.off_hours_ratio)} of transactions occur during off-hours, over ${(
          selectedMerchant.off_hours_ratio / (categoryMedians.medianOffHoursRatio || 1)
        ).toFixed(1)}x higher than category peers (${formatPercent(categoryMedians.medianOffHoursRatio)}).`,
        type: 'warning',
      });
    } else {
      obs.push({
        title: 'Off-hours distribution within normal peer corridor',
        desc: `Off-hours ratio of ${formatPercent(selectedMerchant.off_hours_ratio)} conforms with declared ${
          selectedMerchant.declared_category
        } habits (${formatPercent(categoryMedians.medianOffHoursRatio)}).`,
        type: 'normal',
      });
    }

    // 2. Payout velocity
    if (selectedMerchant.payout_velocity_hrs < categoryMedians.medianPayoutVelocity * 0.4) {
      obs.push({
        title: 'Payout velocity is unusually rapid',
        desc: `Withdrawals triggered in ${formatHours(selectedMerchant.payout_velocity_hrs)}, compared to peer median of ${formatHours(
          categoryMedians.medianPayoutVelocity
        )}. Rapid settlement can be an indicator of deliberate zero-balance exposure.`,
        type: 'alert',
      });
    } else if (selectedMerchant.payout_velocity_hrs > categoryMedians.medianPayoutVelocity * 1.5) {
      obs.push({
        title: 'Conservative settlement cycle',
        desc: `Payout velocity of ${formatHours(selectedMerchant.payout_velocity_hrs)} is slower than category median (${formatHours(
          categoryMedians.medianPayoutVelocity
        )}), demonstrating steady buffer balances.`,
        type: 'normal',
      });
    }

    // 3. Round amount ratio
    if (selectedMerchant.round_amount_ratio > categoryMedians.medianRoundAmountRatio * 1.7) {
      obs.push({
        title: 'Elevated round-amount frequency',
        desc: `${formatPercent(selectedMerchant.round_amount_ratio)} of purchases are exact round figures (peer median: ${formatPercent(
          categoryMedians.medianRoundAmountRatio
        )}). Often indicative of arbitrary deposits or non-retail pricing patterns.`,
        type: 'warning',
      });
    }

    // 4. Dispute rate
    if (selectedMerchant.dispute_rate_pct > categoryMedians.medianDisputeRate * 2.5 && selectedMerchant.dispute_rate_pct > 0.3) {
      obs.push({
        title: 'Elevated dispute & chargeback friction',
        desc: `Dispute rate of ${formatPercent(selectedMerchant.dispute_rate_pct, true)} is significantly elevated above peer median (${formatPercent(
          categoryMedians.medianDisputeRate,
          true
        )}), highlighting consumer dissatisfaction or unfulfilled services.`,
        type: 'alert',
      });
    } else {
      obs.push({
        title: 'Dispute rate within acceptable threshold',
        desc: `Dispute frequency of ${formatPercent(selectedMerchant.dispute_rate_pct, true)} is within expected operational tolerance for ${
          selectedMerchant.declared_category
        }.`,
        type: 'normal',
      });
    }

    // 5. Avg ticket size
    if (selectedMerchant.avg_txn_value_inr > categoryMedians.medianAvgTxnValue * 2.5) {
      obs.push({
        title: 'Average transaction value significantly exceeds category norm',
        desc: `Average ticket is ${formatINR(selectedMerchant.avg_txn_value_inr)} vs peer median ${formatINR(
          categoryMedians.medianAvgTxnValue
        )}. Unusually high ticket sizes warrant declared catalog verification.`,
        type: 'warning',
      });
    }

    return obs;
  }, [selectedMerchant, categoryMedians]);

  return (
    <div className="space-y-6">
      {/* Screen Header */}
      <div className="bg-[#111827] border border-[#243049] rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white tracking-wide">Behaviour Twin Analysis</h2>
            <span className="text-xs font-mono bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">
              {selectedMerchant.merchant_id}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Benchmarking <span className="text-slate-200 font-medium">{selectedMerchant.merchant_id}</span> against{' '}
            <span className="text-cyan-400 font-mono font-semibold">{formatNumber(categoryPeers.length)}</span> peer merchants in{' '}
            <span className="text-slate-200 font-semibold">{selectedMerchant.declared_category}</span>.
          </p>
        </div>

        {/* Quick Merchant Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Switch Merchant:</span>
          <select
            value={selectedMerchant.merchant_id}
            onChange={e => selectMerchant(e.target.value)}
            className="bg-[#162032] border border-[#2B3B55] text-xs text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
          >
            {merchants.map(m => (
              <option key={m.merchant_id} value={m.merchant_id}>
                {m.merchant_id} ({m.declared_category})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid: 8 Comparison Metric Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Category Peer Medians vs. Observed Merchant Behaviour
          </h3>
          <span className="text-[11px] text-slate-400">Calculated dynamically across category peers</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {comparisonMetrics.map(m => {
            const isPositive = m.deltaPct >= 0;
            return (
              <div
                key={m.id}
                className={`p-4 rounded-xl bg-[#111827] border ${
                  m.isAnomaly ? 'border-amber-500/40 bg-[#161D2E]' : 'border-[#243049]'
                } transition-all shadow-sm`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium text-slate-400 truncate" title={m.label}>
                    {m.label}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      m.isAnomaly
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isPositive ? '+' : ''}
                    {m.deltaPct.toFixed(1)}%
                  </span>
                </div>

                {/* Values */}
                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Merchant</span>
                    <span className="text-base font-bold font-mono text-cyan-400">{m.formattedMerchant}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Category Median</span>
                    <span className="text-sm font-semibold font-mono text-slate-400">{m.formattedMedian}</span>
                  </div>
                </div>

                {/* Visual Comparison Bar */}
                <div className="relative pt-2">
                  <div className="w-full h-2 bg-[#0C1220] rounded-full overflow-hidden border border-[#1E293B] relative">
                    {/* Merchant Fill */}
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        m.isAnomaly ? 'bg-amber-400' : 'bg-cyan-400'
                      }`}
                      style={{ width: `${m.normMerchant}%` }}
                    />
                  </div>
                  {/* Category median tick */}
                  <div
                    className="absolute top-1 w-0.5 h-4 bg-slate-400 z-10"
                    style={{ left: `${m.normMedian}%` }}
                    title={`Peer Median: ${m.formattedMedian}`}
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                    <span>Min</span>
                    <span>Median (line)</span>
                    <span>Max</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Analysis Section: Radar Chart + Explainable Observations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Radar Chart (7 cols) */}
        <div className="lg:col-span-7 bg-[#111827] border border-[#243049] rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-white">Multi-Dimensional Behaviour Radar</h3>
              <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
                Peer Normalized (0-100)
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Normalized comparative profile: Merchant (cyan) versus category peer median (slate/blue). Values mapped relative to category bounds.
            </p>
          </div>

          <div className="h-[360px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="70%">
                <PolarGrid stroke="#243049" />
                <PolarAngleAxis
                  dataKey="metric"
                  stroke="#94A3B8"
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  stroke="#1E293B"
                  tick={{ fill: '#64748B', fontSize: 9 }}
                />
                <Radar
                  name="Category Median"
                  dataKey="Category Median"
                  stroke="#64748B"
                  fill="#475569"
                  fillOpacity={0.25}
                />
                <Radar
                  name={selectedMerchant.merchant_id}
                  dataKey="Merchant"
                  stroke="#38BDF8"
                  fill="#38BDF8"
                  fillOpacity={0.4}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#0C1220] border border-[#2B3B55] p-3 rounded-lg shadow-xl text-xs space-y-1">
                          <p className="font-semibold text-white border-b border-[#243049] pb-1">
                            {data.metric}
                          </p>
                          <p className="text-cyan-400">
                            Merchant: <span className="font-mono font-bold">{data.rawMerchant}</span>
                          </p>
                          <p className="text-slate-400">
                            Peer Median: <span className="font-mono">{data.rawMedian}</span>
                          </p>
                          <p className="text-amber-400 text-[11px]">
                            Deviation: <span className="font-mono">{data.delta}</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[10px] text-slate-400 border-t border-[#1E293B] pt-2 mt-2">
            Axes are scaled onto a normalized 0-100 peer envelope to avoid distortion between currency, ratios, and hours.
          </div>
        </div>

        {/* Explainable Behaviour Observations (5 cols) */}
        <div className="lg:col-span-5 bg-[#111827] border border-[#243049] rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Automated Behaviour Observations</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Explainable divergence findings based strictly on calculated category peer deviations.
            </p>

            <div className="space-y-3">
              {observations.map((obs, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border text-xs ${
                    obs.type === 'alert'
                      ? 'bg-red-500/10 border-red-500/30'
                      : obs.type === 'warning'
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-[#151F33] border-[#243049]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {obs.type === 'normal' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <AlertCircle
                        className={`w-3.5 h-3.5 ${
                          obs.type === 'alert' ? 'text-red-400' : 'text-amber-400'
                        }`}
                      />
                    )}
                    <span className="font-semibold text-white text-[12px]">{obs.title}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed pl-5.5">{obs.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Critical Context & Methodology Limitation Notice */}
          <div className="mt-4 p-3 rounded-lg bg-[#0C1220] border border-[#243049] text-[11px] text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300 block">Methodological Scope:</span>
            <p className="text-[10px] leading-relaxed">
              The Behaviour Twin represents a category-relative comparison across monthly aggregate metrics. It does not
              represent historical daily or hourly time-series. Statistical divergence highlights operational anomalies for
              investigation and does not constitute evidence of illicit activity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
