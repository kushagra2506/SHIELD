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
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { MerchantRecord } from '../types';

export const BehaviourTwinScreen: React.FC = () => {
  const { selectedMerchant, merchants, selectMerchant, categoryStatsMap } = useMerchant();

  if (!selectedMerchant) {
    return (
      <div className="bg-white border border-[#E8EAF0] rounded-2xl p-8 text-center text-[#6B7280] shadow-card">
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

    const getMinMax = (extractor: (m: MerchantRecord) => number) => {
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

  // Behaviour observations
  const observations = useMemo(() => {
    if (!categoryMedians) return [];
    const obs: { title: string; desc: string; type: 'warning' | 'alert' | 'normal' }[] = [];

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

    if (selectedMerchant.round_amount_ratio > categoryMedians.medianRoundAmountRatio * 1.7) {
      obs.push({
        title: 'Elevated round-amount frequency',
        desc: `${formatPercent(selectedMerchant.round_amount_ratio)} of purchases are exact round figures (peer median: ${formatPercent(
          categoryMedians.medianRoundAmountRatio
        )}). Often indicative of arbitrary deposits or non-retail pricing patterns.`,
        type: 'warning',
      });
    }

    if (selectedMerchant.dispute_rate_pct > categoryMedians.medianDisputeRate * 2.5 && selectedMerchant.dispute_rate_pct > 0.3) {
      obs.push({
        title: 'Elevated dispute & chargeback friction',
        desc: `Dispute rate of ${formatPercent(selectedMerchant.dispute_rate_pct, true)} is significantly elevated above peer median (${formatPercent(
          categoryMedians.medianDisputeRate,
          true
        )}), highlighting consumer friction.`,
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
      {/* Screen Section Header Card */}
      <div className="bg-white rounded-2xl border border-[#E8EAF0] shadow-card p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#F3F4F6] gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#FDF2F2] text-[#C8102E] flex items-center justify-center shrink-0">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#111827] tracking-tight">
                Behaviour Twin Analysis
              </h2>
              <span className="text-xs text-[#6B7280]">
                Comparing <strong className="font-mono text-[#111827]">{selectedMerchant.merchant_id}</strong> against{' '}
                <strong className="text-[#111827]">{formatNumber(categoryPeers.length)}</strong> peers in{' '}
                <strong className="text-[#111827]">{selectedMerchant.declared_category}</strong>
              </span>
            </div>
          </div>

          {/* Quick Merchant Switcher Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6B7280]">Switch Merchant:</span>
            <select
              value={selectedMerchant.merchant_id}
              onChange={e => selectMerchant(e.target.value)}
              className="bg-white border border-[#E8EAF0] text-xs text-[#374151] px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#C8102E] font-mono cursor-pointer"
            >
              {merchants.map(m => (
                <option key={m.merchant_id} value={m.merchant_id}>
                  {m.merchant_id} ({m.declared_category})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid: 8 Comparison Metric Cards */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
            Category Peer Medians vs. Observed Merchant Behaviour
          </h3>
          <span className="text-[11px] text-[#9CA3AF]">Dynamic peer median calculation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {comparisonMetrics.map(m => {
            const isPositive = m.deltaPct >= 0;
            return (
              <div
                key={m.id}
                className={`p-4 rounded-2xl bg-white border ${
                  m.isAnomaly
                    ? 'border-rose-200 bg-[#FFFBFB]'
                    : 'border-[#E8EAF0]'
                } shadow-card transition-all`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wider truncate" title={m.label}>
                    {m.label}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${
                      m.isAnomaly
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(m.deltaPct).toFixed(1)}%
                  </span>
                </div>

                {/* Values */}
                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <span className="text-[10px] text-[#9CA3AF] block uppercase">Merchant</span>
                    <span className="text-base font-semibold font-mono text-[#111827]">{m.formattedMerchant}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#9CA3AF] block uppercase">Category Median</span>
                    <span className="text-xs font-mono text-[#6B7280]">{m.formattedMedian}</span>
                  </div>
                </div>

                {/* Thin Comparison Bar */}
                <div className="relative pt-2">
                  <div className="w-full h-1.5 bg-[#E8EAF0] rounded-full overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        m.isAnomaly ? 'bg-[#C8102E]' : 'bg-[#111827]'
                      }`}
                      style={{ width: `${m.normMerchant}%` }}
                    />
                  </div>
                  {/* Category median tick */}
                  <div
                    className="absolute top-1.5 w-0.5 h-3 bg-[#6B7280] z-10"
                    style={{ left: `${m.normMedian}%` }}
                    title={`Peer Median: ${m.formattedMedian}`}
                  />
                  <div className="flex justify-between text-[9px] text-[#9CA3AF] mt-1 font-mono">
                    <span>Min</span>
                    <span>Median</span>
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
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E8EAF0] shadow-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#F3F4F6]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#FDF2F2] text-[#C8102E] flex items-center justify-center">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-semibold text-[#111827]">Multi-Dimensional Behaviour Radar</h3>
              </div>
              <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                Normalized Scale (0-100)
              </span>
            </div>
            <p className="text-xs text-[#6B7280] mb-2">
              Merchant (<strong className="text-[#C8102E]">crimson</strong>) versus category peer median (<strong className="text-[#111827]">near-black</strong>).
            </p>
          </div>

          <div className="h-[360px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="70%">
                <PolarGrid stroke="#E8EAF0" />
                <PolarAngleAxis
                  dataKey="metric"
                  stroke="#6B7280"
                  tick={{ fill: '#4B5563', fontSize: 11, fontFamily: 'Instrument Sans, sans-serif' }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  stroke="#E8EAF0"
                  tick={{ fill: '#9CA3AF', fontSize: 9 }}
                />
                <Radar
                  name="Category Median"
                  dataKey="Category Median"
                  stroke="#111827"
                  strokeWidth={1.5}
                  fill="#111827"
                  fillOpacity={0.08}
                />
                <Radar
                  name={selectedMerchant.merchant_id}
                  dataKey="Merchant"
                  stroke="#C8102E"
                  strokeWidth={2}
                  fill="#C8102E"
                  fillOpacity={0.2}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px', fontFamily: 'Instrument Sans, sans-serif' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white border border-[#E8EAF0] p-3 rounded-xl shadow-lg text-xs space-y-1">
                          <p className="font-semibold text-[#111827] border-b border-[#F3F4F6] pb-1">
                            {data.metric}
                          </p>
                          <p className="text-[#C8102E]">
                            Merchant: <span className="font-mono font-bold">{data.rawMerchant}</span>
                          </p>
                          <p className="text-[#4B5563]">
                            Peer Median: <span className="font-mono">{data.rawMedian}</span>
                          </p>
                          <p className="text-[#6B7280] text-[11px]">
                            Deviation: <span className="font-mono font-semibold">{data.delta}</span>
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

          <div className="text-[10px] text-[#9CA3AF] border-t border-[#F3F4F6] pt-2 mt-2">
            Axes are scaled onto a normalized 0-100 peer envelope to avoid distortion between currency, ratios, and hours.
          </div>
        </div>

        {/* Explainable Behaviour Observations (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E8EAF0] shadow-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 mb-2 border-b border-[#F3F4F6]">
              <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center">
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-semibold text-[#111827]">Automated Behaviour Observations</h3>
            </div>
            <p className="text-xs text-[#6B7280] mb-4">
              Explainable divergence findings based strictly on calculated category peer deviations.
            </p>

            <div className="space-y-3">
              {observations.map((obs, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border text-xs ${
                    obs.type === 'alert'
                      ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                      : obs.type === 'warning'
                      ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                      : 'bg-[#F9FAFB] border-[#E8EAF0] text-[#374151]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {obs.type === 'normal' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle
                        className={`w-3.5 h-3.5 shrink-0 ${
                          obs.type === 'alert' ? 'text-[#C8102E]' : 'text-amber-600'
                        }`}
                      />
                    )}
                    <span className="font-semibold text-[#111827] text-[12px]">{obs.title}</span>
                  </div>
                  <p className="text-[#4B5563] text-[11px] leading-relaxed pl-5">{obs.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Critical Context & Methodology Limitation Notice */}
          <div className="mt-4 p-3 rounded-xl bg-[#F9FAFB] border border-[#E8EAF0] text-[11px] text-[#6B7280] space-y-1">
            <span className="font-medium text-[#374151] block">Methodological Scope:</span>
            <p className="text-[10px] leading-relaxed text-[#6B7280]">
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
