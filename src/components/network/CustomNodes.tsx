import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Shield, ArrowDownLeft, ArrowUpRight, Share2, Store } from 'lucide-react';
import { formatINR, formatNumber } from '../../utils/formatters';

export const MerchantNode = memo(({ data, selected }: { data: any; selected: boolean }) => {
  return (
    <div
      className={`px-4 py-3 rounded-xl bg-[#0F172A] border-2 transition-all shadow-xl min-w-[210px] ${
        selected ? 'border-cyan-400 ring-2 ring-cyan-500/30' : 'border-blue-500/60'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="inflow"
        className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-[#0F172A]"
      />

      <div className="flex items-center gap-2 mb-1.5">
        <div className="p-1.5 rounded-lg bg-blue-500/20 text-cyan-400">
          <Store className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[10px] uppercase font-semibold text-blue-400 block tracking-wider">
            Target Merchant
          </span>
          <span className="font-mono text-sm font-bold text-white">{data.merchantId}</span>
        </div>
      </div>

      <div className="text-[11px] text-slate-300 font-medium mb-1 truncate max-w-[190px]">
        {data.category}
      </div>

      <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-slate-700/60 font-mono">
        <span className="text-slate-400">Vol:</span>
        <span className="font-semibold text-cyan-300">{formatINR(data.volume, true)}</span>
        <span className="text-slate-400">Txns:</span>
        <span className="font-semibold text-white">{formatNumber(data.txnCount)}</span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="outflow"
        className="!w-3 !h-3 !bg-purple-400 !border-2 !border-[#0F172A]"
      />
    </div>
  );
});

export const PayerClusterNode = memo(({ data, selected }: { data: any; selected: boolean }) => {
  return (
    <div
      className={`px-3.5 py-2.5 rounded-xl bg-[#091E1E] border transition-all shadow-lg min-w-[190px] ${
        selected ? 'border-emerald-300 ring-2 ring-emerald-500/30' : 'border-emerald-500/50'
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-400">
          Incoming Payer Cluster
        </span>
      </div>

      <div className="font-mono text-xs font-bold text-white truncate max-w-[170px]" title={data.counterpartyId}>
        {data.counterpartyId}
      </div>

      <div className="flex justify-between items-center text-[10px] mt-1.5 pt-1 border-t border-emerald-900/60 font-mono">
        <span className="text-slate-400">Flow:</span>
        <span className="font-semibold text-emerald-300">{formatINR(data.flowVolume, true)}</span>
        <span className="text-slate-400">{formatNumber(data.txnCount)} txns</span>
      </div>

      {data.sharedCount > 1 && (
        <div className="mt-1 text-[9px] text-amber-300 flex items-center gap-1 font-semibold">
          <Share2 className="w-2.5 h-2.5" />
          <span>Shared by {data.sharedCount} merchants</span>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        id="payer-out"
        className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-[#091E1E]"
      />
    </div>
  );
});

export const PayoutDestinationNode = memo(({ data, selected }: { data: any; selected: boolean }) => {
  return (
    <div
      className={`px-3.5 py-2.5 rounded-xl bg-[#1A122E] border transition-all shadow-lg min-w-[190px] ${
        selected ? 'border-purple-300 ring-2 ring-purple-500/30' : 'border-purple-500/50'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="payout-in"
        className="!w-3 !h-3 !bg-purple-400 !border-2 !border-[#1A122E]"
      />

      <div className="flex items-center gap-1.5 mb-1">
        <ArrowUpRight className="w-3.5 h-3.5 text-purple-400" />
        <span className="text-[9px] uppercase font-bold tracking-wider text-purple-400">
          Payout Destination
        </span>
      </div>

      <div className="font-mono text-xs font-bold text-white truncate max-w-[170px]" title={data.counterpartyId}>
        {data.counterpartyId}
      </div>

      <div className="flex justify-between items-center text-[10px] mt-1.5 pt-1 border-t border-purple-900/60 font-mono">
        <span className="text-slate-400">Drain:</span>
        <span className="font-semibold text-purple-300">{formatINR(data.flowVolume, true)}</span>
        <span className="text-slate-400">{formatNumber(data.txnCount)} txns</span>
      </div>

      {data.sharedCount > 1 && (
        <div className="mt-1 text-[9px] text-amber-300 flex items-center gap-1 font-semibold">
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
      className={`px-3.5 py-2.5 rounded-xl bg-[#261B0E] border transition-all shadow-lg min-w-[180px] ${
        selected ? 'border-amber-300 ring-2 ring-amber-500/30' : 'border-amber-500/50'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="shared-target"
        className="!w-2.5 !h-2.5 !bg-amber-400 !border-2 !border-[#261B0E]"
      />

      <div className="flex items-center gap-1.5 mb-1">
        <Share2 className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-[9px] uppercase font-bold tracking-wider text-amber-400">
          Shared Merchant Link
        </span>
      </div>

      <div className="font-mono text-xs font-bold text-white">{data.merchantId}</div>
      <div className="text-[10px] text-slate-300 truncate max-w-[160px]">{data.category}</div>

      <div className="text-[9px] text-slate-400 mt-1 font-mono">
        Vol: <span className="text-amber-300">{formatINR(data.volume, true)}</span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="shared-source"
        className="!w-2.5 !h-2.5 !bg-amber-400 !border-2 !border-[#261B0E]"
      />
    </div>
  );
});

