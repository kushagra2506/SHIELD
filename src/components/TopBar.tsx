import React, { useState } from 'react';
import { useMerchant } from '../context/MerchantContext';
import {
  Menu,
  Search,
  RotateCcw,
  Users,
  Layers,
  GitFork,
} from 'lucide-react';

interface TopBarProps {
  onOpenMobileSidebar: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenMobileSidebar }) => {
  const {
    activeTab,
    selectedMerchant,
    selectMerchant,
    resetSelection,
    merchants,
  } = useMerchant();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const screenMetadata = {
    profile: {
      title: 'Merchant Profile',
      subtitle: 'Portfolio directory & operational audit',
      icon: Users,
    },
    twin: {
      title: 'Behaviour Twin',
      subtitle: 'Category-relative benchmarking',
      icon: Layers,
    },
    network: {
      title: 'Network Intelligence',
      subtitle: 'Directed flow graph & counterparty clustering',
      icon: GitFork,
    },
  }[activeTab];

  const CurrentIcon = screenMetadata.icon;

  // Search filter
  const searchResults = searchQuery.trim()
    ? merchants
        .filter(m => m.merchant_id.toLowerCase().includes(searchQuery.trim().toLowerCase()))
        .slice(0, 6)
    : [];

  return (
    <header className="bg-white border-b border-[#E8EAF0] px-4 lg:px-8 py-3.5 sticky top-0 z-30 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-1.5 rounded-lg border border-[#E8EAF0] text-slate-600 hover:bg-slate-50"
            title="Open navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FDF2F2] border border-[#FEE2E2] flex items-center justify-center text-[#C8102E] shrink-0">
              <CurrentIcon className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base lg:text-lg font-medium text-[#111827] leading-tight tracking-tight">
                {screenMetadata.title}
              </h1>
              <p className="text-[11px] text-[#6B7280] hidden sm:block">
                {screenMetadata.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Search, Selected Merchant Chip */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Quick Search */}
          <div className="relative">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                placeholder="Find merchant ID..."
                className="w-36 sm:w-48 bg-[#F4F5F8] border border-[#E8EAF0] text-xs text-[#111827] pl-8 pr-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#C8102E] focus:bg-white transition-colors font-mono placeholder-[#9CA3AF]"
              />
            </div>

            {/* Search Dropdown Results */}
            {showSearchResults && searchResults.length > 0 && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowSearchResults(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-[#E8EAF0] rounded-xl shadow-lg z-50 overflow-hidden py-1">
                  <div className="px-3 py-1 text-[10px] uppercase font-semibold text-[#9CA3AF] tracking-wider border-b border-[#F3F4F6]">
                    Matching Merchants
                  </div>
                  {searchResults.map(m => (
                    <button
                      key={m.merchant_id}
                      onClick={() => {
                        selectMerchant(m.merchant_id);
                        setSearchQuery('');
                        setShowSearchResults(false);
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs hover:bg-[#FDF2F2] flex items-center justify-between transition-colors"
                    >
                      <span className="font-mono font-medium text-[#111827]">{m.merchant_id}</span>
                      <span className="text-[10px] text-[#6B7280] truncate max-w-[100px]">
                        {m.declared_category}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Selected Merchant Chip */}
          {selectedMerchant && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F4F5F8] border border-[#E8EAF0] text-xs">
              <span className="text-[#6B7280] text-[11px]">Selected:</span>
              <span className="font-mono font-semibold text-[#111827]">
                {selectedMerchant.merchant_id}
              </span>
              <button
                onClick={resetSelection}
                title="Reset selection to default"
                className="text-[#9CA3AF] hover:text-[#C8102E] p-0.5 rounded transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
