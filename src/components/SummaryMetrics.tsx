import React from 'react';
import { useMerchant } from '../context/MerchantContext';
import { formatINR, formatNumber, formatPercent } from '../utils/formatters';
import { Users, IndianRupee, Activity, AlertTriangle, Layers } from 'lucide-react';

export const SummaryMetrics: React.FC = () => {
  const { datasetSummary } = useMerchant();

  const cards = [
    {
      title: 'Total Merchants',
      value: formatNumber(datasetSummary.totalMerchants),
      subtext: 'Active in portfolio',
      icon: Users,
    },
    {
      title: 'Monthly Volume',
      value: formatINR(datasetSummary.totalMonthlyVolume, true),
      subtext: formatINR(datasetSummary.totalMonthlyVolume),
      icon: IndianRupee,
    },
    {
      title: 'Monthly Transactions',
      value: formatNumber(datasetSummary.totalMonthlyTxns),
      subtext: 'Observed gross throughput',
      icon: Activity,
    },
    {
      title: 'Average Dispute Rate',
      value: formatPercent(datasetSummary.avgDisputeRate, true),
      subtext: 'Across all portfolio tiers',
      icon: AlertTriangle,
    },
    {
      title: 'Declared Categories',
      value: datasetSummary.categoryCount.toString(),
      subtext: datasetSummary.categories.slice(0, 2).join(', ') + (datasetSummary.categories.length > 2 ? '...' : ''),
      icon: Layers,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#E8EAF0] shadow-card p-5 mb-6 transition-colors duration-150">
      {/* Section Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-4 border-b border-[#F3F4F6] gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#FDF2F2] text-[#C8102E] flex items-center justify-center shrink-0">
            <Users className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-sm font-semibold text-[#111827] tracking-tight">
            Portfolio Overview
          </h2>
        </div>

        {/* Inline summary stats pattern */}
        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-[#6B7280]">
          <span>
            Total Merchants: <strong className="text-[#111827] font-semibold">{formatNumber(datasetSummary.totalMerchants)}</strong>
          </span>
          <span className="text-[#D1D5DB]">•</span>
          <span>
            Total Volume: <strong className="text-[#111827] font-semibold">{formatINR(datasetSummary.totalMonthlyVolume, true)}</strong>
          </span>
          <span className="text-[#D1D5DB]">•</span>
          <span>
            Avg Dispute: <strong className="text-[#111827] font-semibold">{formatPercent(datasetSummary.avgDisputeRate, true)}</strong>
          </span>
        </div>
      </div>

      {/* Row of 5 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              className="p-3.5 rounded-xl bg-[#F9FAFB] border border-[#E8EAF0] hover:border-[#D1D5DB] transition-all duration-150"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">{c.title}</span>
                <div className="w-6 h-6 rounded-md bg-white border border-[#E8EAF0] flex items-center justify-center text-[#C8102E]">
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-medium text-[#111827] tracking-tight [font-variant-numeric:tabular-nums]">
                {c.value}
              </div>
              <p className="text-[11px] text-[#6B7280] mt-1 truncate" title={c.subtext}>
                {c.subtext}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};