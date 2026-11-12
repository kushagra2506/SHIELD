import React, { useRef } from 'react';
import { useMerchant } from '../context/MerchantContext';
import {
  Users,
  Layers,
  GitFork,
  Upload,
  RefreshCw,
  X,
  FileSpreadsheet,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const {
    activeTab,
    setActiveTab,
    datasetName,
    datasetSummary,
    loadCsvFile,
    reloadDefaultDataset,
    isLoading,
  } = useMerchant();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadCsvFile(file);
      e.target.value = '';
      setMobileOpen(false);
    }
  };

  const navItems = [
    {
      id: 'profile' as const,
      label: 'Merchant Profile',
      icon: Users,
    },
    {
      id: 'twin' as const,
      label: 'Behaviour Twin',
      icon: Layers,
    },
    {
      id: 'network' as const,
      label: 'Network Intelligence',
      icon: GitFork,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#10131C] text-white flex flex-col justify-between transition-transform duration-200 ease-in-out border-r border-[#1E2433] ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top: SATYA Wordmark & Navigation */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo & Brand Header */}
          <div className="px-5 py-5 border-b border-[#1A1F2C] flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Geometric mark: Diamond/Hexagon crimson mark */}
              <div className="w-8 h-8 rounded-lg bg-[#C8102E] flex items-center justify-center shadow-sm shrink-0">
                <div className="w-3.5 h-3.5 bg-white rotate-45 rounded-[2px]" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-sans font-semibold tracking-wider text-lg text-white leading-none">
                    SATYA
                  </span>
                  <span className="text-[9px] uppercase font-semibold px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono tracking-wider">
                    PayU
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Merchant Risk Intelligence</p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-[#1A1F2C]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Nav Section */}
          <div className="px-3 pt-6">
            <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Intelligence Modules
            </div>

            <nav className="space-y-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileOpen(false);
                    }}
                    className={`relative w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs transition-colors duration-150 text-left ${
                      isActive
                        ? 'bg-[#1A1F2C] text-white font-medium shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#151922]'
                    }`}
                  >
                    {/* Active Crimson Left Indicator Bar */}
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#C8102E] rounded-r" />
                    )}

                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-[#C8102E]' : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom: Dataset Status & Replace Dataset Button (FitPro Logout Style) */}
        <div className="p-4 border-t border-[#1A1F2C] bg-[#0D1017]">
          {/* Dataset Status Card */}
          <div className="p-3 rounded-lg bg-[#151922] border border-[#202737] mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Active Dataset
              </span>
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {datasetSummary.totalMerchants.toLocaleString()} rows
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono truncate" title={datasetName}>
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{datasetName}</span>
            </div>
          </div>

          {/* Replace Dataset Button (White card-button with crimson text, matching reference) */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv,text/csv,application/vnd.ms-excel"
            className="hidden"
          />

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white hover:bg-slate-100 text-[#C8102E] text-xs font-medium shadow-sm transition-colors cursor-pointer"
              title="Upload new CSV dataset"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Replace Dataset</span>
            </button>

            <button
              onClick={reloadDefaultDataset}
              disabled={isLoading}
              className="p-2 rounded-lg bg-[#151922] hover:bg-[#1E2433] text-slate-400 hover:text-white border border-[#202737] transition-colors"
              title="Reload default dataset"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#C8102E]' : ''}`} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

