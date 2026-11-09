import React from 'react';
import { useMerchant } from '../context/MerchantContext';
import { formatINR, formatNumber, formatPercent, formatHours } from '../utils/formatters';
import {
  ShieldAlert,
  ShieldCheck,
  ShieldAlert as ShieldWarn,
  ExternalLink,
  GitFork,
  Layers,
  Clock,
  Coins,
  Users2,
  TrendingUp,
  AlertTriangle,
  Info,
} from 'lucide-react';

export const MerchantDetailPanel: React.FC = () => {
  const { selectedMerchant, setActiveTab, categoryStatsMap } = useMerchant();

  if (!selectedMerchant) {
    return (
      <div className="bg-[#111827] border border-[#243049] rounded-xl p-6 text-center text-slate-400">
        <Info className="w-8 h-8 mx-auto text-slate-500 mb-2" />
        <p className="text-sm">Select a merchant from the directory to view complete operational intelligence.</p>
      </div>
    );
  }

  const categoryMedians = categoryStatsMap.get(selectedMerchant.declared_category);

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'Elevated':
        return {
          icon: ShieldAlert,
          bg: 'bg-red-500/10 text-red-400 border-red-500/30',
          dot: 'bg-red-400',
        };
      case 'Moderate':
        return {
          icon: ShieldWarn,
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          dot: 'bg-amber-400',
        };
      default:
        return {
          icon: ShieldCheck,
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-400',
        };
    }
  };

  const riskBadge = getRiskBadge(selectedMerchant.riskLevel);
  const RiskIcon = riskBadge.icon;

  return (
    <div className="bg-[#111827] border border-[#243049] rounded-xl p-5 shadow-xl sticky top-20 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between pb-4 border-b border-[#243049]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xl font-bold text-white tracking-wide">
              {selectedMerchant.merchant_id}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${riskBadge.bg}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${riskBadge.dot}`} />
              {selectedMerchant.riskLevel} Risk
            </span>
          </div>
          <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 mt-1.5 inline-block">
            {selectedMerchant.declared_category}
          </span>
        </div>

        {/* Quick jump actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('twin')}
            title="Inspect in Behaviour Twin"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1E293B] hover:bg-[#2B3B55] border border-[#334155] text-xs font-medium text-slate-200 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Twin</span>
          </button>
          <button
            onClick={() => setActiveTab('network')}
            title="Explore in Network Graph"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1E293B] hover:bg-[#2B3B55] border border-[#334155] text-xs font-medium text-slate-200 transition-colors"
          >
            <GitFork className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Network</span>
          </button>
        </div>
      </div>

      {/* Core Operational Financial Metrics */}
      <div>
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
          Core Financial Volume
        </h4>
        <div className="grid grid-cols-3 gap-2 bg-[#0C1220] p-3 rounded-lg border border-[#1E293B]">
          <div>
            <span className="text-[10px] text-slate-400 block">Monthly Vol</span>
            <span className="font-mono text-sm font-semibold text-white">
              {formatINR(selectedMerchant.monthly_volume_inr, true)}
            </span>
            <span className="text-[9px] text-slate-400 block truncate">
              {formatINR(selectedMerchant.monthly_volume_inr)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Txn Count</span>
            <span className="font-mono text-sm font-semibold text-white">
              {formatNumber(selectedMerchant.monthly_txn_count)}
            </span>
            <span className="text-[9px] text-slate-400 block">Settled txns</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Avg Ticket</span>
            <span className="font-mono text-sm font-semibold text-white">
              {formatINR(selectedMerchant.avg_txn_value_inr)}
            </span>
            <span className="text-[9px] text-slate-400 block">Per transaction</span>
          </div>
        </div>
      </div>

      {/* Behavioural Metric Breakdown with Progress Bars */}
      <div>
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
          <span>Operational Behaviour Profile</span>
          <span className="text-[10px] text-slate-400 normal-case font-normal">Peer Median Comparison</span>
        </h4>

        <div className="space-y-2.5 text-xs">
          {/* Off-hours ratio */}
          <div className="bg-[#0C1220] p-2.5 rounded-lg border border-[#1E293B]">
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-300 flex items-center gap-1.5 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Off-Hours Ratio
              </span>
              <div className="text-right">
                <span className="font-mono font-semibold text-white">
                  {formatPercent(selectedMerchant.off_hours_ratio)}
                </span>
                {categoryMedians && (
                  <span className="text-[10px] text-slate-400 ml-1.5">
                    (med: {formatPercent(categoryMedians.medianOffHoursRatio)})
                  </span>
                )}
              </div>
            </div>
            <div className="w-full h-1.5 bg-[#1F293D] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  selectedMerchant.off_hours_ratio > 0.25 ? 'bg-red-400' : 'bg-blue-400'
                }`}
                style={{ width: `${Math.min(100, selectedMerchant.off_hours_ratio * 100)}%` }}
              />
            </div>
          </div>

          {/* Round Amount Ratio */}
          <div className="bg-[#0C1220] p-2.5 rounded-lg border border-[#1E293B]">
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-300 flex items-center gap-1.5 text-[11px]">
                <Coins className="w-3.5 h-3.5 text-slate-400" />
                Round Amount Ratio
              </span>
              <div className="text-right">
                <span className="font-mono font-semibold text-white">
                  {formatPercent(selectedMerchant.round_amount_ratio)}
                </span>
                {categoryMedians && (
                  <span className="text-[10px] text-slate-400 ml-1.5">
                    (med: {formatPercent(categoryMedians.medianRoundAmountRatio)})
                  </span>
                )}
              </div>
            </div>
            <div className="w-full h-1.5 bg-[#1F293D] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  selectedMerchant.round_amount_ratio > 0.45 ? 'bg-amber-400' : 'bg-blue-400'
                }`}
                style={{ width: `${Math.min(100, selectedMerchant.round_amount_ratio * 100)}%` }}
              />
            </div>
          </div>

          {/* Payout Velocity */}
          <div className="bg-[#0C1220] p-2.5 rounded-lg border border-[#1E293B]">
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-300 flex items-center gap-1.5 text-[11px]">
                <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                Payout Velocity
              </span>
              <div className="text-right">
                <span className="font-mono font-semibold text-white">
                  {formatHours(selectedMerchant.payout_velocity_hrs)}
                </span>
                {categoryMedians && (
                  <span className="text-[10px] text-slate-400 ml-1.5">
                    (med: {formatHours(categoryMedians.medianPayoutVelocity)})
                  </span>
                )}
              </div>
            </div>
            <div className="w-full h-1.5 bg-[#1F293D] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  selectedMerchant.payout_velocity_hrs < 8 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(100, (selectedMerchant.payout_velocity_hrs / 72) * 100)}%` }}
              />
            </div>
          </div>

          {/* Unique Payer Ratio & Dispute Rate */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#0C1220] p-2 rounded-lg border border-[#1E293B]">
              <span className="text-[10px] text-slate-400 block">Unique Payer Ratio</span>
              <span className="font-mono font-semibold text-white text-xs">
                {formatPercent(selectedMerchant.unique_payer_ratio)}
              </span>
              {categoryMedians && (
                <span className="text-[9px] text-slate-400 block">
                  Peer med: {formatPercent(categoryMedians.medianUniquePayerRatio)}
                </span>
              )}
            </div>

            <div className="bg-[#0C1220] p-2 rounded-lg border border-[#1E293B]">
              <span className="text-[10px] text-slate-400 block">Dispute Rate</span>
              <span
                className={`font-mono font-semibold text-xs ${
                  selectedMerchant.dispute_rate_pct > 0.5 ? 'text-red-400' : 'text-white'
                }`}
              >
                {formatPercent(selectedMerchant.dispute_rate_pct, true)}
              </span>
              {categoryMedians && (
                <span className="text-[9px] text-slate-400 block">
                  Peer med: {formatPercent(categoryMedians.medianDisputeRate, true)}
                </span>
              )}
            </div>
          </div>

          {/* High Value Txn Ratio */}
          <div className="bg-[#0C1220] p-2 rounded-lg border border-[#1E293B] flex items-center justify-between">
            <span className="text-[11px] text-slate-300">High-Value Txn Ratio</span>
            <div className="text-right">
              <span className="font-mono font-semibold text-white text-xs">
                {formatPercent(selectedMerchant.high_val_txn_ratio)}
              </span>
              {categoryMedians && (
                <span className="text-[10px] text-slate-400 ml-1.5">
                  (med: {formatPercent(categoryMedians.medianHighValRatio)})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Explainable Risk Assessment (Transparent Heuristic) */}
      <div className="bg-[#0D1526] p-3.5 rounded-lg border border-blue-500/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <RiskIcon className="w-4 h-4 text-blue-400" />
            <h5 className="text-xs font-semibold text-white">Operational Risk Indicator</h5>
          </div>
          <span className="text-xs font-mono font-bold text-cyan-400">
            {selectedMerchant.riskScore}/100
          </span>
        </div>

        <p className="text-[11px] text-slate-400 mb-2.5 leading-relaxed">
          Transparent multi-factor divergence index calculated from operational features. Does not use ground-truth labels.
        </p>

        <div className="space-y-1.5">
          {selectedMerchant.riskFactors.map((f, idx) => (
            <div key={idx} className="text-[11px] flex items-start gap-1.5 text-slate-300 bg-[#141F35] p-2 rounded border border-[#23314D]">
              <span className="text-amber-400 font-bold mt-0.5">•</span>
              <div className="flex-1">
                <span className="font-medium text-slate-200">{f.factor}: </span>
                <span className="text-slate-400">{f.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ground Truth Isolation & Synthetic Disclaimer */}
      <div className="border border-slate-700/50 rounded-lg p-2.5 bg-[#0A0E17]/60 text-[10px] text-slate-400 space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-400">Offline Evaluation Tag:</span>
          <span
            className={`font-mono px-1.5 py-0.5 rounded text-[9px] ${
              selectedMerchant.is_gambling_front === 1
                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                : 'bg-slate-700/50 text-slate-300'
            }`}
          >
            is_gambling_front = {selectedMerchant.is_gambling_front}
          </span>
        </div>
        <p className="text-[9px] text-slate-400 leading-tight">
          Strictly isolated for offline evaluation. Not used as a scoring input.
        </p>
      </div>
    </div>
  );
};

