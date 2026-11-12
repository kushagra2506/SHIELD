import React, { useState } from 'react';
import { useMerchant } from './context/MerchantContext';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { MerchantProfileScreen } from './components/MerchantProfileScreen';
import { BehaviourTwinScreen } from './components/BehaviourTwinScreen';
import { NetworkIntelligenceScreen } from './components/NetworkIntelligenceScreen';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    activeTab,
    isLoading,
    error,
    reloadDefaultDataset,
    dismissError,
    successMessage,
    dismissSuccessMessage,
  } = useMerchant();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#10131C] text-[#111827] font-sans antialiased">
      {/* Fixed Left Sidebar */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen bg-[#F4F5F8]">
        {/* Top Bar */}
        <TopBar onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />

        {/* Content Body */}
        <main className="flex-1 px-4 lg:px-8 py-6 max-w-[1720px] w-full mx-auto">
          {/* Success State Banner */}
          {successMessage && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-emerald-900">Dataset Imported Successfully</h4>
                  <p className="text-xs text-emerald-800 mt-0.5">{successMessage}</p>
                </div>
              </div>
              <button
                onClick={dismissSuccessMessage}
                className="px-2.5 py-1 rounded-lg text-xs text-emerald-700 hover:text-emerald-950 hover:bg-emerald-100/60 transition-colors"
              >
                ✕
              </button>
            </div>
          )}

          {/* Error State Banner */}
          {error && (
            <div className="mb-6 bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#C8102E] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-rose-900">Dataset Loading Error</h4>
                  <p className="text-xs text-rose-800 mt-1 leading-relaxed">{error}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={reloadDefaultDataset}
                  className="px-3 py-1.5 rounded-lg bg-[#C8102E] hover:bg-[#A50D25] text-xs font-medium text-white transition-colors shadow-xs"
                >
                  Reload Default
                </button>
                <button
                  onClick={dismissError}
                  className="px-2 py-1.5 rounded-lg text-xs text-rose-600 hover:text-rose-900"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Loading State Spinner */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-28 space-y-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-4 border-[#E8EAF0] border-t-[#C8102E] animate-spin" />
                <div className="w-4 h-4 rounded-[2px] bg-[#C8102E] rotate-45 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-[#111827]">Ingesting Merchant Dataset</p>
                <p className="text-xs text-[#6B7280] mt-1 font-mono">
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

        {/* Footer */}
        <footer className="border-t border-[#E8EAF0] bg-white py-4 text-xs text-[#6B7280]">
          <div className="max-w-[1720px] mx-auto px-4 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#111827] tracking-wider">SATYA</span>
              <span className="text-[#D1D5DB]">•</span>
              <span>Merchant Risk Intelligence Platform</span>
              <span className="text-[#D1D5DB]">•</span>
              <span className="text-[#C8102E] font-medium">PayU Innovation Challenge</span>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-[#9CA3AF]">
              <span>Regulatory Context: Ground-truth strictly isolated for offline validation</span>
              <span className="font-mono">v2.0.0</span>
            </div>
          </div>
        </footer>
      </div>
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
