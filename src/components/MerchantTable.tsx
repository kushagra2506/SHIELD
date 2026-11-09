import React, { useMemo, useState } from 'react';
import { useMerchant } from '../context/MerchantContext';
import { formatINR, formatNumber, formatPercent, formatHours } from '../utils/formatters';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import { MerchantRecord } from '../types';

type SortField =
  | 'merchant_id'
  | 'declared_category'
  | 'monthly_volume_inr'
  | 'monthly_txn_count'
  | 'avg_txn_value_inr'
  | 'dispute_rate_pct'
  | 'payout_velocity_hrs'
  | 'riskScore';

export const MerchantTable: React.FC = () => {
  const { merchants, selectedMerchantId, selectMerchant } = useMerchant();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('monthly_volume_inr');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  // Distinct categories
  const categories = useMemo(() => {
    return Array.from(new Set(merchants.map(m => m.declared_category))).sort();
  }, [merchants]);

  // Filtered and sorted merchants
  const filteredMerchants = useMemo(() => {
    let list = merchants;

    // Search
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter(m => m.merchant_id.toLowerCase().includes(q));
    }

    // Category filter
    if (selectedCategory !== 'ALL') {
      list = list.filter(m => m.declared_category === selectedCategory);
    }

    // Risk level filter
    if (selectedRisk !== 'ALL') {
      list = list.filter(m => m.riskLevel === selectedRisk);
    }

    // Sort
    return [...list].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB as string).toLowerCase();
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return sortOrder === 'asc' ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
    });
  }, [merchants, searchTerm, selectedCategory, selectedRisk, sortField, sortOrder]);

  // Pagination calculation
  const totalItems = filteredMerchants.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentSafePage = Math.min(currentPage, totalPages);
  const startIndex = (currentSafePage - 1) * pageSize;
  const pageItems = filteredMerchants.slice(startIndex, startIndex + pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-500 inline ml-1 opacity-40 group-hover:opacity-100" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-cyan-400 inline ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 text-cyan-400 inline ml-1" />
    );
  };

  return (
    <div className="bg-[#111827] border border-[#243049] rounded-xl flex flex-col shadow-lg overflow-hidden">
      {/* Table Controls: Search, Filters, Counts */}
      <div className="p-4 border-b border-[#243049] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#0E1526]">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search merchant ID (e.g. MCH_1001)..."
            className="w-full bg-[#162032] border border-[#2B3B55] text-xs text-white pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 placeholder-slate-500 font-mono"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
          </div>
          <select
            value={selectedCategory}
            onChange={e => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#162032] border border-[#2B3B55] text-xs text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">All Categories ({merchants.length})</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={selectedRisk}
            onChange={e => {
              setSelectedRisk(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#162032] border border-[#2B3B55] text-xs text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">All Risk Tiers</option>
            <option value="Elevated">Elevated Risk</option>
            <option value="Moderate">Moderate Risk</option>
            <option value="Low">Low Risk</option>
          </select>
        </div>
      </div>

      {/* Table Data */}
      <div className="overflow-x-auto min-h-[460px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#243049] bg-[#0C1220] text-slate-400 uppercase text-[10px] tracking-wider font-semibold select-none">
              <th
                onClick={() => handleSort('merchant_id')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 group"
              >
                Merchant ID {renderSortIcon('merchant_id')}
              </th>
              <th
                onClick={() => handleSort('declared_category')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 group"
              >
                Category {renderSortIcon('declared_category')}
              </th>
              <th
                onClick={() => handleSort('monthly_volume_inr')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 text-right group"
              >
                Monthly Vol {renderSortIcon('monthly_volume_inr')}
              </th>
              <th
                onClick={() => handleSort('monthly_txn_count')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 text-right group"
              >
                Txn Count {renderSortIcon('monthly_txn_count')}
              </th>
              <th
                onClick={() => handleSort('avg_txn_value_inr')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 text-right group"
              >
                Avg Ticket {renderSortIcon('avg_txn_value_inr')}
              </th>
              <th
                onClick={() => handleSort('dispute_rate_pct')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 text-right group"
              >
                Dispute % {renderSortIcon('dispute_rate_pct')}
              </th>
              <th
                onClick={() => handleSort('payout_velocity_hrs')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 text-right group"
              >
                Velocity {renderSortIcon('payout_velocity_hrs')}
              </th>
              <th
                onClick={() => handleSort('riskScore')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 text-center group"
              >
                Risk Status {renderSortIcon('riskScore')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A253A]">
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  No merchants match the selected filters or search query.
                </td>
              </tr>
            ) : (
              pageItems.map((m: MerchantRecord) => {
                const isSelected = m.merchant_id === selectedMerchantId;
                return (
                  <tr
                    key={m.merchant_id}
                    onClick={() => selectMerchant(m.merchant_id)}
                    className={`cursor-pointer transition-colors duration-150 ${
                      isSelected
                        ? 'bg-blue-600/15 border-l-4 border-l-blue-500 text-white'
                        : 'hover:bg-[#162032]/70 text-slate-300'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-cyan-400">
                      {m.merchant_id}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-300 truncate max-w-[150px] inline-block" title={m.declared_category}>
                        {m.declared_category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-white">
                      {formatINR(m.monthly_volume_inr, true)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {formatNumber(m.monthly_txn_count)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-300">
                      {formatINR(m.avg_txn_value_inr)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      <span className={m.dispute_rate_pct > 0.5 ? 'text-red-400 font-semibold' : 'text-slate-300'}>
                        {formatPercent(m.dispute_rate_pct, true)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-300">
                      {formatHours(m.payout_velocity_hrs)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          m.riskLevel === 'Elevated'
                            ? 'bg-red-500/10 text-red-400 border-red-500/30'
                            : m.riskLevel === 'Moderate'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {m.riskLevel}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-[#243049] bg-[#0C1220] flex items-center justify-between text-xs text-slate-400">
        <div>
          Showing <span className="font-mono text-slate-200">{totalItems > 0 ? startIndex + 1 : 0}</span> to{' '}
          <span className="font-mono text-slate-200">{Math.min(startIndex + pageSize, totalItems)}</span> of{' '}
          <span className="font-mono text-slate-200">{formatNumber(totalItems)}</span> merchants
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentSafePage === 1}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#162032] border border-[#2B3B55] hover:bg-[#202C45] disabled:opacity-40 disabled:cursor-not-allowed text-slate-200"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>

          <span className="px-2 font-mono text-slate-300">
            Page {currentSafePage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentSafePage === totalPages}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#162032] border border-[#2B3B55] hover:bg-[#202C45] disabled:opacity-40 disabled:cursor-not-allowed text-slate-200"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

