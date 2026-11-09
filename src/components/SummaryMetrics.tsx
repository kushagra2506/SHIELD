import React from 'react';
import { useMerchant } from '../context/MerchantContext';
import { formatINR, formatNumber, formatPercent } from '../utils/formatters';
import { Users, DollarSign, Activity, AlertTriangle, Tag } from 'lucide-react';

export const SummaryMetrics: React.FC = () => {
  const { datasetSummary } = useMerchant();

  const cards = [
    {
      title: 'Total Merchants',
      value: formatNumber(datasetSummary.totalMerchants),
      subtext: 'Active in portfolio',
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
    {
      title: 'Total Monthly Volume',
      value: formatINR(datasetSummary.totalMonthlyVolume, true),
      subtext: `${formatINR(datasetSummary.totalMonthlyVolume)}`,
      icon: DollarSign,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
    },
    {
      title: 'Monthly Transactions',
      value: formatNumber(datasetSummary.totalMonthlyTxns),
      subtext: 'Observed gross throughput',
      icon: Activity,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20',
    },
    {
      title: 'Average Dispute Rate',
      value: formatPercent(datasetSummary.avgDisputeRate, true),
      subtext: 'Across all portfolio tiers',
      icon: AlertTriangle,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
    },
    {
      title: 'Merchant Categories',
      value: datasetSummary.categoryCount.toString(),
      subtext: datasetSummary.categories.slice(0, 2).join(', ') + (datasetSummary.categories.length > 2 ? '...' : ''),
      icon: Tag,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5 mb-6">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className={`p-4 rounded-xl bg-[#111827] border ${c.borderColor} hover:border-[#384869] transition-all duration-200 shadow-sm`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{c.title}</span>
              <div className={`p-1.5 rounded-lg ${c.bgColor}`}>
                <Icon className={`w-4 h-4 ${c.color}`} />
              </div>
            </div>
            <div className="text-xl font-bold font-mono text-white tracking-tight">{c.value}</div>
            <p className="text-[11px] text-slate-400 mt-1 truncate" title={c.subtext}>
              {c.subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
};

