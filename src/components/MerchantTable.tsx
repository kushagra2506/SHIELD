import React, { useMemo, useState } from 'react';
import { useMerchant } from '../context/MerchantContext';
import { formatINR, formatNumber, formatPercent, formatHours } from '../utils/formatters';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, FileText } from 'lucide-react';
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
      return <ArrowUpDown className="w-3 h-3 text-[#9CA3AF] inline ml-1 opacity-50 group-hover:opacity-100" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-[#C8102E] inline ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#C8102E] inline ml-1" />
    );
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'Elevated':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Moderate':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E8EAF0] shadow-card flex flex-col overflow-hidden transition-colors duration-150">
      {/* Section Header Row */}
      <div className="p-4 lg:p-5 border-b border-[#F3F4F6] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#FDF2F2] text-[#C8102E] flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#111827] tracking-tight">Merchant Directory</h3>
            <span className="text-[11px] text-[#6B7280]">
              Total: <strong className="text-[#111827]">{totalItems.toLocaleString()}</strong> merchants
            </span>
          </div>
        </div>

        {/* Filters and Search toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search ID..."
              className="w-36 sm:w-44 bg-[#F4F5F8] border border-[#E8EAF0] text-xs text-[#111827] pl-8 pr-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#C8102E] placeholder-[#9CA3AF] font-mono"
            />
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-1">
            <select
              value={selectedCategory}
              onChange={e => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white border border-[#E8EAF0] text-xs text-[#374151] px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#C8102E] cursor-pointer"
            >
              <option value="ALL">All Categories ({merchants.length})</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Risk Level Dropdown */}
          <select
            value={selectedRisk}
            onChange={e => {
              setSelectedRisk(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-white border border-[#E8EAF0] text-xs text-[#374151] px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#C8102E] cursor-pointer"
          >
            <option value="ALL">All Risk Tiers</option>
            <option value="Elevated">Elevated Risk</option>
            <option value="Moderate">Moderate Risk</option>
            <option value="Low">Low Risk</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="overflow-x-auto min-h-[460px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#E8EAF0] bg-[#F9FAFB] text-[#6B7280] uppercase text-[10px] tracking-wider font-semibold select-none">
              <th
                onClick={() => handleSort('merchant_id')}
                className="py-3 px-4 cursor-pointer hover:text-[#111827] group"
              >
                Merchant ID {renderSortIcon('merchant_id')}
              </th>
              <th
                onClick={() => handleSort('declared_category')}
                className="py-3 px-4 cursor-pointer hover:text-[#111827] group"
              >
                Category {renderSortIcon('declared_category')}
              </th>
              <th
                onClick={() => handleSort('monthly_volume_inr')}
                className="py-3 px-4 cursor-pointer hover:text-[#111827] text-right group"
              >
                Monthly Vol {renderSortIcon('monthly_volume_inr')}
              </th>
              <th
                onClick={() => handleSort('monthly_txn_count')}
                className="py-3 px-4 cursor-pointer hover:text-[#111827] text-right group"
              >
                Txn Count {renderSortIcon('monthly_txn_count')}
              </th>
              <th
                onClick={() => handleSort('avg_txn_value_inr')}
                className="py-3 px-4 cursor-pointer hover:text-[#111827] text-right group"
              >
                Avg Ticket {renderSortIcon('avg_txn_value_inr')}
              </th>
              <th
                onClick={() => handleSort('dispute_rate_pct')}
                className="py-3 px-4 cursor-pointer hover:text-[#111827] text-right group"
              >
                Dispute % {renderSortIcon('dispute_rate_pct')}
              </th>
              <th
                onClick={() => handleSort('payout_velocity_hrs')}
                className="py-3 px-4 cursor-pointer hover:text-[#111827] text-right group"
              >
                Velocity {renderSortIcon('payout_velocity_hrs')}
              </th>
              <th
                onClick={() => handleSort('riskScore')}
                className="py-3 px-4 cursor-pointer hover:text-[#111827] text-center group"
              >
                Risk Status {renderSortIcon('riskScore')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F4F6]">
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-[#9CA3AF]">
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
                    className={`cursor-pointer transition-colors duration-150 ${isSelected
                        ? 'bg-[#FFF5F5] border-l-4 border-l-[#C8102E] text-[#111827] font-medium'
                        : 'hover:bg-[#F9FAFB] text-[#374151]'
                      }`}
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-[#111827]">
                      {m.merchant_id}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[#4B5563] truncate max-w-[150px] inline-block" title={m.declared_category}>
                        {m.declared_category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-[#111827]">
                      {formatINR(m.monthly_volume_inr, true)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#4B5563]">
                      {formatNumber(m.monthly_txn_count)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#4B5563]">
                      {formatINR(m.avg_txn_value_inr)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      <span className={m.dispute_rate_pct > 0.5 ? 'text-[#C8102E] font-semibold' : 'text-[#4B5563]'}>
                        {formatPercent(m.dispute_rate_pct, true)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#4B5563]">
                      {formatHours(m.payout_velocity_hrs)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${getRiskBadge(
                          m.riskLevel
                        )}`}
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
      <div className="p-3 border-t border-[#E8EAF0] bg-[#FAFAFC] flex items-center justify-between text-xs text-[#6B7280]">
        <div>
          Showing <span className="font-mono text-[#111827] font-medium">{totalItems > 0 ? startIndex + 1 : 0}</span> to{' '}
          <span className="font-mono text-[#111827] font-medium">{Math.min(startIndex + pageSize, totalItems)}</span> of{' '}
          <span className="font-mono text-[#111827] font-medium">{formatNumber(totalItems)}</span> merchants
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentSafePage === 1}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#E8EAF0] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-[#374151] transition-colors shadow-2xs"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>

          <span className="px-2 font-mono text-[#374151]">
            Page {currentSafePage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentSafePage === totalPages}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#E8EAF0] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-[#374151] transition-colors shadow-2xs"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};