import React from 'react';
import { useMerchant } from './context/MerchantContext';
import { Header } from './components/Header';
import { MerchantProfileScreen } from './components/MerchantProfileScreen';
import { BehaviourTwinScreen } from './components/BehaviourTwinScreen';
import { NetworkIntelligenceScreen } from './components/NetworkIntelligenceScreen';
import { AlertCircle, RefreshCw, Shield, Sparkles } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeTab, isLoading, error, reloadDefaultDataset, dismissError } = useMerchant();

  return (
    <div className="min-h-screen bg-[#0A0E17] text-slate-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 lg:px-6 py-6">
        {/* Error State Banner */}
        {error && (
          <div className="mb-6 bg-red-950/40 border border-red-500/50 rounded-xl p-4 flex items-start justify-between gap-3 shadow-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-red-300">Dataset Loading Error</h4>
                <p className="text-xs text-red-200/80 mt-1 leading-relaxed">{error}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={reloadDefaultDataset}
                className="px-3 py-1.5 rounded-lg bg-red-800/40 hover:bg-red-700/50 border border-red-600/40 text-xs font-medium text-red-100 transition-colors"
              >
                Reload Default
              </button>
              <button
                onClick={dismissError}
                className="px-2 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
              <Shield className="w-6 h-6 text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-white">Ingesting Merchant Dataset</p>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Calculating category peer medians and network flow topologies...
              </p>
            </div>
          </div>
        )}

        {/* Active Screen View */}
        {!isLoading && (
          <>
            {activeTab === 'profile' && <MerchantProfileScreen />}
            {activeTab === 'twin' && <BehaviourTwinScreen />}
            {activeTab === 'network' && <NetworkIntelligenceScreen />}
          </>
        )}
      </main>

      {/* Professional Fintech Footer */}
      <footer className="border-t border-[#1E293B] bg-[#090D16] py-4 text-xs text-slate-400">
        <div className="max-w-[1720px] mx-auto px-4 lg:px-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-slate-300">SHIELD</span>
            <span>•</span>
            <span>Fintech Merchant Risk Intelligence Platform</span>
            <span>•</span>
            <span className="text-blue-400 font-medium">PayU Innovation Challenge</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-slate-400">
              Regulatory Context: Ground-truth strictly isolated for offline validation
            </span>
            <span className="font-mono text-slate-400">v1.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <div className="w-full min-h-screen">
      <AppContent />
    </div>
  );
};

export default App;

