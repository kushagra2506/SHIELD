import React from 'react';
import { SummaryMetrics } from './SummaryMetrics';
import { MerchantTable } from './MerchantTable';
import { MerchantDetailPanel } from './MerchantDetailPanel';

export const MerchantProfileScreen: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Portfolio overview summary cards */}
      <SummaryMetrics />

      {/* Main Grid: Directory Table (7 cols) + Detail Panel (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 xl:col-span-8">
          <MerchantTable />
        </div>
        <div className="lg:col-span-5 xl:col-span-4">
          <MerchantDetailPanel />
        </div>
      </div>
    </div>
  );
};

