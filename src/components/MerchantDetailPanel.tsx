import React from 'react';
import { useMerchant } from '../context/MerchantContext';
import { formatINR, formatNumber, formatPercent, formatHours } from '../utils/formatters';
import {
  AlertCircle,
  GitFork,
  Layers,
  Clock,
  Coins,
  TrendingUp,
  Info,
} from 'lucide-react';

export const MerchantDetailPanel: React.FC = () => {
  const { selectedMerchant, setActiveTab, categoryStatsMap } = useMerchant();

  if (!selectedMerchant) {
    return (
      <div className="bg-white border border-[#E8EAF0] rounded-2xl p-6 text-center text-[#6B7280] shadow-card">
        <Info className="w-8 h-8 mx-auto text-[#9CA3AF] mb-2" />
        <p className="text-sm">Select a merchant from the directory to view complete operational intelligence.</p>
      </div>
    );
  }

  const categoryMedians = categoryStatsMap.get(selectedMerchant.declared_category);

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'Elevated':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-600',
          color: '#C8102E',
        };
      case 'Moderate':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
          color: '#F59E0B',
        };
      default:
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          color: '#10B981',
        };
    }
  };

  const riskBadge = getRiskBadge(selectedMerchant.riskLevel);

  // SVG Gauge calculations
  const score = selectedMerchant.riskScore;
  const radius = 64;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white border border-[#E8EAF0] rounded-2xl p-5 shadow-card sticky top-20 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between pb-4 border-b border-[#F3F4F6]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xl font-medium text-[#111827] tracking-tight">
              {selectedMerchant.merchant_id}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${riskBadge.bg}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${riskBadge.dot}`} />
              {selectedMerchant.riskLevel} Risk
            </span>
          </div>
          <span className="text-xs text-[#6B7280] bg-[#F4F5F8] px-2 py-0.5 rounded-md border border-[#E8EAF0] mt-1.5 inline-block">
            {selectedMerchant.declared_category}
          </span>
        </div>

        {/* Quick jump navigation actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('twin')}
            title="Inspect in Behaviour Twin"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#FDF2F2] hover:text-[#C8102E] border border-[#E8EAF0] text-xs font-medium text-[#374151] transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-[#C8102E]" />
            <span className="hidden sm:inline">Twin</span>
          </button>
          <button
            onClick={() => setActiveTab('network')}
            title="Explore in Network Graph"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-[#E8EAF0] text-xs font-medium text-[#374151] transition-colors"
          >
            <GitFork className="w-3.5 h-3.5 text-[#111827]" />
            <span className="hidden sm:inline">Network</span>
          </button>
        </div>
      </div>

      {/* Risk Gauge */}
      <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E8EAF0] flex flex-col items-center justify-center relative">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] mb-1">
          Divergence Risk Gauge
        </span>

        <div className="relative w-44 h-24 flex items-end justify-center overflow-hidden">
          <svg className="w-44 h-44 absolute -top-4" viewBox="0 0 160 160">
            {/* Background track arc */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="#E8EAF0"
              strokeWidth="12"
              strokeDasharray={`${circumference} ${circumference}`}
              transform="rotate(180 80 80)"
              strokeLinecap="round"
            />
            {/* Progress gauge fill */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={riskBadge.color}
              strokeWidth="12"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(180 80 80)"
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          {/* Centered Score */}
          <div className="text-center z-10 mb-1">
            <span className="text-2xl font-medium text-[#111827] [font-variant-numeric:tabular-nums]">
              {score}
            </span>
            <span className="text-xs text-[#9CA3AF]">/100</span>
          </div>
        </div>

        <p className="text-[11px] text-[#6B7280] mt-1 text-center">
          Operational divergence index computed without ground truth
        </p>
      </div>

      {/* Core Financial Volume Metrics */}
      <div>
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] mb-2">
          Core Financial Volume
        </h4>
        <div className="grid grid-cols-3 gap-2 bg-[#F9FAFB] p-3 rounded-xl border border-[#E8EAF0]">
          <div>
            <span className="text-[10px] text-[#6B7280] block">Monthly Vol</span>
            <span className="font-mono text-sm font-semibold text-[#111827]">
              {formatINR(selectedMerchant.monthly_volume_inr, true)}
            </span>
            <span className="text-[9px] text-[#9CA3AF] block truncate">
              {formatINR(selectedMerchant.monthly_volume_inr)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#6B7280] block">Txn Count</span>
            <span className="font-mono text-sm font-semibold text-[#111827]">
              {formatNumber(selectedMerchant.monthly_txn_count)}
            </span>
            <span className="text-[9px] text-[#9CA3AF] block">Settled txns</span>
          </div>
          <div>
            <span className="text-[10px] text-[#6B7280] block">Avg Ticket</span>
            <span className="font-mono text-sm font-semibold text-[#111827]">
              {formatINR(selectedMerchant.avg_txn_value_inr)}
            </span>
            <span className="text-[9px] text-[#9CA3AF] block">Per txn</span>
          </div>
        </div>
      </div>

      {/* Behavioural Metric Breakdown */}
      <div>
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] mb-2.5 flex items-center justify-between">
          <span>Operational Behaviour Profile</span>
          <span className="text-[10px] text-[#9CA3AF] normal-case font-normal">Peer Median Comparison</span>
        </h4>

        <div className="space-y-2.5 text-xs">
          {/* Off-hours ratio */}
          <div className="p-2.5 rounded-xl bg-[#F9FAFB] border border-[#E8EAF0]">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[#374151] flex items-center gap-1.5 text-[11px] font-medium">
                <Clock className="w-3.5 h-3.5 text-[#6B7280]" />
                Off-Hours Ratio
              </span>
              <div className="text-right">
                <span className="font-mono font-semibold text-[#111827]">
                  {formatPercent(selectedMerchant.off_hours_ratio)}
                </span>
                {categoryMedians && (
                  <span className="text-[10px] text-[#9CA3AF] ml-1.5">
                    (med: {formatPercent(categoryMedians.medianOffHoursRatio)})
                  </span>
                )}
              </div>
            </div>
            <div className="w-full h-1.5 bg-[#E8EAF0] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  selectedMerchant.off_hours_ratio > 0.25 ? 'bg-[#C8102E]' : 'bg-[#111827]'
                }`}
                style={{ width: `${Math.min(100, selectedMerchant.off_hours_ratio * 100)}%` }}
              />
            </div>
          </div>

          {/* Round Amount Ratio */}
          <div className="p-2.5 rounded-xl bg-[#F9FAFB] border border-[#E8EAF0]">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[#374151] flex items-center gap-1.5 text-[11px] font-medium">
                <Coins className="w-3.5 h-3.5 text-[#6B7280]" />
                Round Amount Ratio
              </span>
              <div className="text-right">
                <span className="font-mono font-semibold text-[#111827]">
                  {formatPercent(selectedMerchant.round_amount_ratio)}
                </span>
                {categoryMedians && (
                  <span className="text-[10px] text-[#9CA3AF] ml-1.5">
                    (med: {formatPercent(categoryMedians.medianRoundAmountRatio)})
                  </span>
                )}
              </div>
            </div>
            <div className="w-full h-1.5 bg-[#E8EAF0] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  selectedMerchant.round_amount_ratio > 0.45 ? 'bg-amber-500' : 'bg-[#111827]'
                }`}
                style={{ width: `${Math.min(100, selectedMerchant.round_amount_ratio * 100)}%` }}
              />
            </div>
          </div>

          {/* Payout Velocity */}
          <div className="p-2.5 rounded-xl bg-[#F9FAFB] border border-[#E8EAF0]">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[#374151] flex items-center gap-1.5 text-[11px] font-medium">
                <TrendingUp className="w-3.5 h-3.5 text-[#6B7280]" />
                Payout Velocity
              </span>
              <div className="text-right">
                <span className="font-mono font-semibold text-[#111827]">
                  {formatHours(selectedMerchant.payout_velocity_hrs)}
                </span>
                {categoryMedians && (
                  <span className="text-[10px] text-[#9CA3AF] ml-1.5">
                    (med: {formatHours(categoryMedians.medianPayoutVelocity)})
                  </span>
                )}
              </div>
            </div>
            <div className="w-full h-1.5 bg-[#E8EAF0] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  selectedMerchant.payout_velocity_hrs < 8 ? 'bg-[#C8102E]' : 'bg-emerald-600'
                }`}
                style={{ width: `${Math.min(100, (selectedMerchant.payout_velocity_hrs / 72) * 100)}%` }}
              />
            </div>
          </div>

          {/* Unique Payer Ratio & Dispute Rate */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-[#F9FAFB] border border-[#E8EAF0]">
              <span className="text-[10px] text-[#6B7280] block">Unique Payer Ratio</span>
              <span className="font-mono font-semibold text-[#111827] text-xs">
                {formatPercent(selectedMerchant.unique_payer_ratio)}
              </span>
              {categoryMedians && (
                <span className="text-[9px] text-[#9CA3AF] block mt-0.5">
                  Peer med: {formatPercent(categoryMedians.medianUniquePayerRatio)}
                </span>
              )}
            </div>

            <div className="p-2.5 rounded-xl bg-[#F9FAFB] border border-[#E8EAF0]">
              <span className="text-[10px] text-[#6B7280] block">Dispute Rate</span>
              <span
                className={`font-mono font-semibold text-xs ${
                  selectedMerchant.dispute_rate_pct > 0.5 ? 'text-[#C8102E]' : 'text-[#111827]'
                }`}
              >
                {formatPercent(selectedMerchant.dispute_rate_pct, true)}
              </span>
              {categoryMedians && (
                <span className="text-[9px] text-[#9CA3AF] block mt-0.5">
                  Peer med: {formatPercent(categoryMedians.medianDisputeRate, true)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contributing Risk Factors */}
      <div className="p-3.5 rounded-xl bg-[#FDF2F2] border border-[#FEE2E2]">
        <div className="flex items-center gap-1.5 mb-2">
          <AlertCircle className="w-4 h-4 text-[#C8102E]" />
          <h5 className="text-xs font-semibold text-[#111827]">Contributing Factors</h5>
        </div>

        <div className="space-y-1.5">
          {selectedMerchant.riskFactors.map((f, idx) => (
            <div key={idx} className="text-[11px] flex items-start gap-1.5 text-[#374151] bg-white p-2 rounded-lg border border-[#FEE2E2]">
              <span className="text-[#C8102E] font-bold mt-0.5">•</span>
              <div className="flex-1">
                <span className="font-medium text-[#111827]">{f.factor}: </span>
                <span className="text-[#6B7280]">{f.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Offline Ground Truth Isolation Tag */}
      <div className="border border-[#E8EAF0] rounded-xl p-2.5 bg-[#F9FAFB] text-[10px] text-[#6B7280] space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-medium text-[#4B5563]">Offline Evaluation Tag:</span>
          <span
            className={`font-mono px-1.5 rounded text-[9px] font-medium ${
              selectedMerchant.is_gambling_front === 1
                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            is_gambling_front = {selectedMerchant.is_gambling_front}
          </span>
        </div>
        <p className="text-[9px] text-[#9CA3AF] leading-tight">
          Strictly isolated for offline evaluation. Not used as a scoring input.
        </p>
      </div>
    </div>
  );
};
