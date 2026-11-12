import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { ArrowDownLeft, ArrowUpRight, Share2, Store } from 'lucide-react';
import { formatINR, formatNumber } from '../../utils/formatters';

export const MerchantNode = memo(({ data, selected }: { data: any; selected: boolean }) => {
  return (
    <div
      className={`px-4 py-3 rounded-xl bg-[#10131C] text-white border-2 transition-all shadow-md min-w-[210px] ${
        selected ? 'border-[#C8102E] ring-2 ring-[#C8102E]/40' : 'border-[#1E2433]'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="inflow"
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white"
      />

      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-6 h-6 rounded-md bg-[#C8102E]/20 text-[#C8102E] flex items-center justify-center">
          <Store className="w-3.5 h-3.5" />
        </div>
        <div>
          <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
            Target Merchant
          </span>
          <span className="font-mono text-sm font-semibold text-white">{data.merchantId}</span>
        </div>
      </div>

      <div className="text-[11px] text-slate-300 font-medium mb-1 truncate max-w-[190px]">
        {data.category}
      </div>

      <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-[#1E2433] font-mono">
        <span className="text-slate-400">Vol:</span>
        <span className="font-semibold text-white">{formatINR(data.volume, true)}</span>
        <span className="text-slate-400">Txns:</span>
        <span className="font-semibold text-slate-200">{formatNumber(data.txnCount)}</span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="outflow"
        className="!w-3 !h-3 !bg-[#C8102E] !border-2 !border-white"
      />
    </div>
  );
});

export const PayerClusterNode = memo(({ data, selected }: { data: any; selected: boolean }) => {
  return (
    <div
      className={`px-3.5 py-2.5 rounded-xl bg-white border transition-all shadow-card min-w-[190px] ${
        selected ? 'border-emerald-600 ring-2 ring-emerald-100' : 'border-emerald-200'
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <div className="w-4 h-4 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <ArrowDownLeft className="w-3 h-3" />
        </div>
        <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-700">
          Incoming Payer Cluster
        </span>
      </div>

      <div className="font-mono text-xs font-semibold text-[#111827] truncate max-w-[170px]" title={data.counterpartyId}>
        {data.counterpartyId}
      </div>

      <div className="flex justify-between items-center text-[10px] mt-1.5 pt-1 border-t border-slate-100 font-mono">
        <span className="text-[#6B7280]">Inflow:</span>
        <span className="font-semibold text-emerald-700">{formatINR(data.flowVolume, true)}</span>
        <span className="text-[#9CA3AF]">{formatNumber(data.txnCount)} txns</span>
      </div>

      {data.sharedCount > 1 && (
        <div className="mt-1 text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-1 font-medium border border-amber-200/60">
          <Share2 className="w-2.5 h-2.5" />
          <span>Shared by {data.sharedCount} merchants</span>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        id="payer-out"
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white"
      />
    </div>
  );
});

export const PayoutDestinationNode = memo(({ data, selected }: { data: any; selected: boolean }) => {
  return (
    <div
      className={`px-3.5 py-2.5 rounded-xl bg-white border transition-all shadow-card min-w-[190px] ${
        selected ? 'border-[#C8102E] ring-2 ring-rose-100' : 'border-rose-200'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="payout-in"
        className="!w-3 !h-3 !bg-[#C8102E] !border-2 !border-white"
      />

      <div className="flex items-center gap-1.5 mb-1">
        <div className="w-4 h-4 rounded bg-rose-50 text-[#C8102E] flex items-center justify-center">
          <ArrowUpRight className="w-3 h-3" />
        </div>
        <span className="text-[9px] uppercase font-bold tracking-wider text-[#C8102E]">
          Payout Destination
        </span>
      </div>

      <div className="font-mono text-xs font-semibold text-[#111827] truncate max-w-[170px]" title={data.counterpartyId}>
        {data.counterpartyId}
      </div>

      <div className="flex justify-between items-center text-[10px] mt-1.5 pt-1 border-t border-slate-100 font-mono">
        <span className="text-[#6B7280]">Settlement:</span>
        <span className="font-semibold text-[#C8102E]">{formatINR(data.flowVolume, true)}</span>
        <span className="text-[#9CA3AF]">{formatNumber(data.txnCount)} txns</span>
      </div>

      {data.sharedCount > 1 && (
        <div className="mt-1 text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-1 font-medium border border-amber-200/60">
          <Share2 className="w-2.5 h-2.5" />
          <span>Shared by {data.sharedCount} merchants</span>
        </div>
      )}
    </div>
  );
});

export const SharedMerchantNode = memo(({ data, selected }: { data: any; selected: boolean }) => {
  return (
    <div
      className={`px-3.5 py-2.5 rounded-xl bg-white border transition-all shadow-card min-w-[180px] ${
        selected ? 'border-amber-500 ring-2 ring-amber-100' : 'border-amber-300'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="shared-target"
        className="!w-2.5 !h-2.5 !bg-amber-500 !border-2 !border-white"
      />

      <div className="flex items-center gap-1.5 mb-1">
        <div className="w-4 h-4 rounded bg-amber-50 text-amber-600 flex items-center justify-center">
          <Share2 className="w-3 h-3" />
        </div>
        <span className="text-[9px] uppercase font-bold tracking-wider text-amber-700">
          Shared Co-Merchant
        </span>
      </div>

      <div className="font-mono text-xs font-semibold text-[#111827]">{data.merchantId}</div>
      <div className="text-[10px] text-[#6B7280] truncate max-w-[160px]">{data.category}</div>

      <div className="text-[9px] text-[#6B7280] mt-1 font-mono">
        Vol: <span className="text-[#111827] font-semibold">{formatINR(data.volume, true)}</span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="shared-source"
        className="!w-2.5 !h-2.5 !bg-amber-500 !border-2 !border-white"
      />
    </div>
  );
});
