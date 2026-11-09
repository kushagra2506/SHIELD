import React, { useRef } from 'react';
import { useMerchant } from '../context/MerchantContext';
import { Shield, Upload, RefreshCw, Layers, GitFork, Users, AlertCircle } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    datasetSummary,
    selectedMerchant,
    activeTab,
    setActiveTab,
    loadCsvFile,
    reloadDefaultDataset,
    isLoading,
    resetSelection,
  } = useMerchant();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadCsvFile(file);
      // reset file input value so re-uploading the same file triggers change
      e.target.value = '';
    }
  };

  return (
    <header className="border-b border-[#243049] bg-[#0E1526]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-[1720px] mx-auto px-4 lg:px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3 gap-3">
          {/* Logo & Product info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/30 to-cyan-500/10 border border-blue-500/40 flex items-center justify-center shadow-lg shadow-blue-900/20">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-wider text-xl text-white font-mono">SHIELD</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 tracking-wider">
                  PayU Edition
                </span>
              </div>
              <p className="text-xs text-slate-400">Merchant Risk Intelligence Platform</p>
            </div>
          </div>

          {/* Three Screen Tabs */}
          <nav className="flex items-center bg-[#090D16] p-1 rounded-xl border border-[#243049]">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'profile'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-700/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#151F33]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>1. Merchant Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('twin')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'twin'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-700/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#151F33]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>2. Behaviour Twin</span>
            </button>

            <button
              onClick={() => setActiveTab('network')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'network'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-700/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#151F33]'
              }`}
            >
              <GitFork className="w-4 h-4" />
              <span>3. Network Intelligence</span>
            </button>
          </nav>

          {/* Controls: Dataset Status, Upload, Reset */}
          <div className="flex items-center gap-2.5">
            {/* Status indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141C2E] border border-[#243049] text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-mono">
                {isLoading ? 'Parsing dataset...' : `${datasetSummary.totalMerchants.toLocaleString()} merchants`}
              </span>
            </div>

            {/* Selected merchant chip */}
            {selectedMerchant && (
              <div
                title="Currently selected merchant"
                className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141C2E] border border-[#243049] text-xs"
              >
                <span className="text-slate-400">Selected:</span>
                <span className="font-mono text-cyan-400 font-semibold">{selectedMerchant.merchant_id}</span>
                <button
                  onClick={resetSelection}
                  title="Reset to default selection"
                  className="text-slate-500 hover:text-slate-300 ml-1 text-[11px]"
                >
                  ↺
                </button>
              </div>
            )}

            {/* Upload CSV */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E293B] hover:bg-[#2B3B55] border border-[#334155] text-xs font-medium text-slate-200 transition-colors cursor-pointer"
              title="Upload new merchant dataset CSV"
            >
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              <span>Import CSV</span>
            </button>

            {/* Reload demo */}
            <button
              onClick={reloadDefaultDataset}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-[#1E293B] hover:bg-[#2B3B55] border border-[#334155] text-slate-300 transition-colors"
              title="Reload default PayU demo dataset"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

