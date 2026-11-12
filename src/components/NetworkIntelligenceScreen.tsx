import React, { useState, useMemo, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useMerchant } from '../context/MerchantContext';
import { MerchantNode, PayerClusterNode, PayoutDestinationNode, SharedMerchantNode } from './network/CustomNodes';
import { formatINR, formatNumber, formatPercent } from '../utils/formatters';
import {
  GitFork,
  Share2,
  Info,
  SlidersHorizontal,
  X,
  ExternalLink,
} from 'lucide-react';

const nodeTypes = {
  merchantNode: MerchantNode,
  payerClusterNode: PayerClusterNode,
  payoutDestinationNode: PayoutDestinationNode,
  sharedMerchantNode: SharedMerchantNode,
};

type FlowFilter = 'ALL' | 'INFLOW' | 'OUTFLOW';

export const NetworkIntelligenceScreen: React.FC = () => {
  const { selectedMerchant, merchants, selectMerchant, counterpartyMap } = useMerchant();

  // Filters state
  const [flowFilter, setFlowFilter] = useState<FlowFilter>('ALL');
  const [minVolume, setMinVolume] = useState<number>(0);
  const [expandShared, setExpandShared] = useState<boolean>(false);

  // Selection inspection state
  const [inspectedEntity, setInspectedEntity] = useState<{
    type: 'merchant' | 'counterparty' | 'edge';
    data: any;
  } | null>(null);

  if (!selectedMerchant) {
    return (
      <div className="bg-white border border-[#E8EAF0] rounded-2xl p-8 text-center text-[#6B7280] shadow-card">
        <p>No merchant selected. Select a merchant to inspect network graph topology.</p>
      </div>
    );
  }

  // Incoming and outgoing flows from selected merchant
  const payerFlows = useMemo(() => {
    return (selectedMerchant.payer_flows_json || []).filter(
      f => f && (f.flow_volume_inr || 0) >= minVolume
    );
  }, [selectedMerchant.payer_flows_json, minVolume]);

  const payoutFlows = useMemo(() => {
    return (selectedMerchant.payout_flows_json || []).filter(
      f => f && (f.flow_volume_inr || 0) >= minVolume
    );
  }, [selectedMerchant.payout_flows_json, minVolume]);

  // Total summary metrics
  const totalInflowVolume = useMemo(() => {
    return payerFlows.reduce((acc, f) => acc + (f.flow_volume_inr || 0), 0);
  }, [payerFlows]);

  const totalOutflowVolume = useMemo(() => {
    return payoutFlows.reduce((acc, f) => acc + (f.flow_volume_inr || 0), 0);
  }, [payoutFlows]);

  // Compute shared merchants that connect to the same counterparties
  const sharedMerchantsInfo = useMemo(() => {
    const sharedMerchantsMap = new Map<string, { merchant: typeof selectedMerchant; sharedCount: number; counterparties: string[] }>();

    const checkCounterparties = (flows: typeof payerFlows) => {
      for (const f of flows) {
        const meta = counterpartyMap.get(f.counterparty_id);
        if (meta && meta.connectedMerchants.length > 1) {
          for (const mId of meta.connectedMerchants) {
            if (mId === selectedMerchant.merchant_id) continue;
            const existing = sharedMerchantsMap.get(mId);
            if (existing) {
              existing.sharedCount += 1;
              if (!existing.counterparties.includes(f.counterparty_id)) {
                existing.counterparties.push(f.counterparty_id);
              }
            } else {
              const mObj = merchants.find(m => m.merchant_id === mId);
              if (mObj) {
                sharedMerchantsMap.set(mId, {
                  merchant: mObj,
                  sharedCount: 1,
                  counterparties: [f.counterparty_id],
                });
              }
            }
          }
        }
      }
    };

    checkCounterparties(payerFlows);
    checkCounterparties(payoutFlows);

    return Array.from(sharedMerchantsMap.values());
  }, [payerFlows, payoutFlows, counterpartyMap, selectedMerchant.merchant_id, merchants]);

  // Build React Flow Nodes & Edges dynamically
  const { nodes, edges } = useMemo(() => {
    const generatedNodes: Node[] = [];
    const generatedEdges: Edge[] = [];

    const shouldShowInflow = flowFilter === 'ALL' || flowFilter === 'INFLOW';
    const shouldShowOutflow = flowFilter === 'ALL' || flowFilter === 'OUTFLOW';

    // 1. Center: Selected Target Merchant
    generatedNodes.push({
      id: selectedMerchant.merchant_id,
      type: 'merchantNode',
      position: { x: 420, y: 180 },
      data: {
        merchantId: selectedMerchant.merchant_id,
        category: selectedMerchant.declared_category,
        volume: selectedMerchant.monthly_volume_inr,
        txnCount: selectedMerchant.monthly_txn_count,
      },
    });

    // 2. Left side: Incoming Payer Clusters
    if (shouldShowInflow) {
      const payerCount = payerFlows.length;
      const verticalSpacing = 95;
      const startY = Math.max(20, 180 - ((payerCount - 1) * verticalSpacing) / 2);

      payerFlows.forEach((flow, index) => {
        const nodeId = `payer_${flow.counterparty_id}`;
        const meta = counterpartyMap.get(flow.counterparty_id);
        const sharedCount = meta ? meta.connectedMerchants.length : 1;

        generatedNodes.push({
          id: nodeId,
          type: 'payerClusterNode',
          position: { x: 30, y: startY + index * verticalSpacing },
          data: {
            counterpartyId: flow.counterparty_id,
            flowVolume: flow.flow_volume_inr,
            txnCount: flow.transaction_count,
            sharedCount,
          },
        });

        // Directed Edge: Payer Cluster -> Target Merchant
        generatedEdges.push({
          id: `edge_${nodeId}_to_${selectedMerchant.merchant_id}`,
          source: nodeId,
          sourceHandle: 'payer-out',
          target: selectedMerchant.merchant_id,
          targetHandle: 'inflow',
          animated: true,
          style: { stroke: '#059669', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#059669',
            width: 15,
            height: 15,
          },
          label: `${formatINR(flow.flow_volume_inr, true)} (${formatNumber(flow.transaction_count)} txns)`,
          labelStyle: { fill: '#065F46', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 },
          labelBgStyle: { fill: '#FFFFFF', stroke: '#D1FAE5', strokeWidth: 1, fillOpacity: 0.95 },
          labelBgPadding: [6, 3],
          labelBgBorderRadius: 6,
          data: {
            sourceName: flow.counterparty_id,
            targetName: selectedMerchant.merchant_id,
            direction: 'inflow_to_merchant',
            volume: flow.flow_volume_inr,
            txnCount: flow.transaction_count,
          },
        });
      });
    }

    // 3. Right side: Outgoing Payout Destinations
    if (shouldShowOutflow) {
      const payoutCount = payoutFlows.length;
      const verticalSpacing = 95;
      const startY = Math.max(20, 180 - ((payoutCount - 1) * verticalSpacing) / 2);

      payoutFlows.forEach((flow, index) => {
        const nodeId = `payout_${flow.counterparty_id}`;
        const meta = counterpartyMap.get(flow.counterparty_id);
        const sharedCount = meta ? meta.connectedMerchants.length : 1;

        generatedNodes.push({
          id: nodeId,
          type: 'payoutDestinationNode',
          position: { x: 800, y: startY + index * verticalSpacing },
          data: {
            counterpartyId: flow.counterparty_id,
            flowVolume: flow.flow_volume_inr,
            txnCount: flow.transaction_count,
            sharedCount,
          },
        });

        // Directed Edge: Target Merchant -> Payout Destination
        generatedEdges.push({
          id: `edge_${selectedMerchant.merchant_id}_to_${nodeId}`,
          source: selectedMerchant.merchant_id,
          sourceHandle: 'outflow',
          target: nodeId,
          targetHandle: 'payout-in',
          animated: true,
          style: { stroke: '#C8102E', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#C8102E',
            width: 15,
            height: 15,
          },
          label: `${formatINR(flow.flow_volume_inr, true)} (${formatNumber(flow.transaction_count)} txns)`,
          labelStyle: { fill: '#991B1B', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 },
          labelBgStyle: { fill: '#FFFFFF', stroke: '#FEE2E2', strokeWidth: 1, fillOpacity: 0.95 },
          labelBgPadding: [6, 3],
          labelBgBorderRadius: 6,
          data: {
            sourceName: selectedMerchant.merchant_id,
            targetName: flow.counterparty_id,
            direction: 'outflow_from_merchant',
            volume: flow.flow_volume_inr,
            txnCount: flow.transaction_count,
          },
        });
      });
    }

    // 4. Expanded Shared Hubs
    if (expandShared && sharedMerchantsInfo.length > 0) {
      const topShared = sharedMerchantsInfo.slice(0, 5);
      topShared.forEach((item, index) => {
        const sharedNodeId = `shared_mch_${item.merchant.merchant_id}`;

        generatedNodes.push({
          id: sharedNodeId,
          type: 'sharedMerchantNode',
          position: { x: 420 + (index % 2 === 0 ? 320 : -320), y: 380 + Math.floor(index / 2) * 110 },
          data: {
            merchantId: item.merchant.merchant_id,
            category: item.merchant.declared_category,
            volume: item.merchant.monthly_volume_inr,
            sharedCount: item.sharedCount,
          },
        });

        for (const cpId of item.counterparties) {
          const payerNode = generatedNodes.find(n => n.id === `payer_${cpId}`);
          const payoutNode = generatedNodes.find(n => n.id === `payout_${cpId}`);

          if (payerNode) {
            generatedEdges.push({
              id: `edge_shared_${payerNode.id}_${sharedNodeId}`,
              source: payerNode.id,
              target: sharedNodeId,
              targetHandle: 'shared-target',
              style: { stroke: '#D97706', strokeDasharray: '4,4', strokeWidth: 1.5 },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#D97706' },
              label: 'Shared Cluster Link',
              labelStyle: { fill: '#92400E', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' },
              labelBgStyle: { fill: '#FFFFFF', stroke: '#FDE68A', fillOpacity: 0.95 },
            });
          }

          if (payoutNode) {
            generatedEdges.push({
              id: `edge_shared_${sharedNodeId}_${payoutNode.id}`,
              source: sharedNodeId,
              sourceHandle: 'shared-source',
              target: payoutNode.id,
              style: { stroke: '#D97706', strokeDasharray: '4,4', strokeWidth: 1.5 },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#D97706' },
              label: 'Shared Payout Hub',
              labelStyle: { fill: '#92400E', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' },
              labelBgStyle: { fill: '#FFFFFF', stroke: '#FDE68A', fillOpacity: 0.95 },
            });
          }
        }
      });
    }

    return { nodes: generatedNodes, edges: generatedEdges };
  }, [
    selectedMerchant,
    payerFlows,
    payoutFlows,
    flowFilter,
    counterpartyMap,
    expandShared,
    sharedMerchantsInfo,
  ]);

  // Node Click Handler
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === 'merchantNode') {
        setInspectedEntity({
          type: 'merchant',
          data: selectedMerchant,
        });
      } else if (node.type === 'sharedMerchantNode') {
        const mObj = merchants.find(m => m.merchant_id === node.data.merchantId);
        if (mObj) {
          setInspectedEntity({
            type: 'merchant',
            data: mObj,
          });
        }
      } else if (node.type === 'payerClusterNode' || node.type === 'payoutDestinationNode') {
        const meta = counterpartyMap.get(node.data.counterpartyId);
        setInspectedEntity({
          type: 'counterparty',
          data: {
            counterpartyId: node.data.counterpartyId,
            type: node.type === 'payerClusterNode' ? 'Incoming Payer Cluster' : 'Payout Destination Hub',
            flowVolume: node.data.flowVolume,
            txnCount: node.data.txnCount,
            connectedMerchants: meta ? meta.connectedMerchants : [selectedMerchant.merchant_id],
            totalVolumeInr: meta ? meta.totalVolumeInr : node.data.flowVolume,
            totalTxnCount: meta ? meta.totalTxnCount : node.data.txnCount,
          },
        });
      }
    },
    [selectedMerchant, merchants, counterpartyMap]
  );

  // Edge Click Handler
  const handleEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    if (edge.data) {
      setInspectedEntity({
        type: 'edge',
        data: edge.data,
      });
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Network Summary Metrics Header */}
      <div className="bg-white rounded-2xl border border-[#E8EAF0] shadow-card p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 mb-3 border-b border-[#F3F4F6] gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#FDF2F2] text-[#C8102E] flex items-center justify-center">
              <GitFork className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm font-semibold text-[#111827]">Network Flow Summary</h3>
          </div>
          <div className="text-xs text-[#6B7280]">
            Target: <strong className="font-mono text-[#111827]">{selectedMerchant.merchant_id}</strong> · Inflow: <strong className="font-mono text-[#111827]">{formatINR(totalInflowVolume, true)}</strong> · Outflow: <strong className="font-mono text-[#111827]">{formatINR(totalOutflowVolume, true)}</strong>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-[#F9FAFB] border border-[#E8EAF0] p-3 rounded-xl">
            <span className="text-[10px] font-semibold uppercase text-[#6B7280] block">Payer Clusters (Inflow)</span>
            <span className="text-base font-semibold font-mono text-emerald-700">{payerFlows.length} clusters</span>
            <span className="text-[10px] text-[#6B7280] block font-mono">{formatINR(totalInflowVolume, true)}</span>
          </div>

          <div className="bg-[#F9FAFB] border border-[#E8EAF0] p-3 rounded-xl">
            <span className="text-[10px] font-semibold uppercase text-[#6B7280] block">Payout Hubs (Outflow)</span>
            <span className="text-base font-semibold font-mono text-[#C8102E]">{payoutFlows.length} hubs</span>
            <span className="text-[10px] text-[#6B7280] block font-mono">{formatINR(totalOutflowVolume, true)}</span>
          </div>

          <div className="bg-[#F9FAFB] border border-[#E8EAF0] p-3 rounded-xl">
            <span className="text-[10px] font-semibold uppercase text-[#6B7280] block">Total Inflow Volume</span>
            <span className="text-base font-semibold font-mono text-[#111827]">{formatINR(totalInflowVolume, true)}</span>
            <span className="text-[10px] text-[#9CA3AF] block truncate">{formatINR(totalInflowVolume)}</span>
          </div>

          <div className="bg-[#F9FAFB] border border-[#E8EAF0] p-3 rounded-xl">
            <span className="text-[10px] font-semibold uppercase text-[#6B7280] block">Total Outflow Volume</span>
            <span className="text-base font-semibold font-mono text-[#111827]">{formatINR(totalOutflowVolume, true)}</span>
            <span className="text-[10px] text-[#9CA3AF] block truncate">{formatINR(totalOutflowVolume)}</span>
          </div>

          <div className="bg-[#F9FAFB] border border-[#E8EAF0] p-3 rounded-xl">
            <span className="text-[10px] font-semibold uppercase text-[#6B7280] block">Shared Counterparties</span>
            <span className="text-base font-semibold font-mono text-amber-700">
              {sharedMerchantsInfo.length} peer merchants
            </span>
            <span className="text-[10px] text-[#6B7280] block">Co-connected across dataset</span>
          </div>
        </div>
      </div>

      {/* Network Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-[#E8EAF0] shadow-card p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Merchant selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#6B7280] font-medium">Focus Merchant:</span>
            <select
              value={selectedMerchant.merchant_id}
              onChange={e => selectMerchant(e.target.value)}
              className="bg-white border border-[#E8EAF0] text-xs text-[#111827] px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#C8102E] font-mono font-medium cursor-pointer"
            >
              {merchants.map(m => (
                <option key={m.merchant_id} value={m.merchant_id}>
                  {m.merchant_id} – {m.declared_category}
                </option>
              ))}
            </select>
          </div>

          {/* Direction Filter */}
          <div className="flex items-center gap-1 bg-[#F4F5F8] p-1 rounded-lg border border-[#E8EAF0]">
            <button
              onClick={() => setFlowFilter('ALL')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                flowFilter === 'ALL'
                  ? 'bg-[#111827] text-white font-medium shadow-xs'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              All Flows
            </button>
            <button
              onClick={() => setFlowFilter('INFLOW')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                flowFilter === 'INFLOW' ? 'bg-emerald-700 text-white font-medium shadow-xs' : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              Incoming (Inflow)
            </button>
            <button
              onClick={() => setFlowFilter('OUTFLOW')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                flowFilter === 'OUTFLOW' ? 'bg-[#C8102E] text-white font-medium shadow-xs' : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              Outgoing (Payout)
            </button>
          </div>

          {/* Min volume filter */}
          <div className="flex items-center gap-2 text-[#6B7280] bg-[#F4F5F8] px-3 py-1.5 rounded-lg border border-[#E8EAF0]">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Min Flow:</span>
            <input
              type="range"
              min={0}
              max={150000}
              step={10000}
              value={minVolume}
              onChange={e => setMinVolume(Number(e.target.value))}
              className="w-20 accent-[#C8102E] cursor-pointer"
            />
            <span className="font-mono text-[#111827] text-[11px] font-semibold">{formatINR(minVolume, true)}</span>
            {minVolume > 0 && (
              <button
                onClick={() => setMinVolume(0)}
                className="text-[10px] text-[#9CA3AF] hover:text-[#111827] ml-1"
                title="Reset min volume"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Toggle Shared Hubs Expansion Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpandShared(!expandShared)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              expandShared
                ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-xs'
                : 'bg-white text-[#374151] border-[#E8EAF0] hover:bg-slate-50'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-amber-600" />
            <span>{expandShared ? 'Collapse Shared Hubs' : 'Expand Shared Counterparty Network'}</span>
            {sharedMerchantsInfo.length > 0 && (
              <span className="ml-1 text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-full font-mono font-semibold">
                {sharedMerchantsInfo.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Network Graph Canvas + Node/Edge Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Canvas */}
        <div
          className={`${
            inspectedEntity ? 'lg:col-span-8 xl:col-span-9' : 'lg:col-span-12'
          } h-[600px] bg-[#F8FAFC] border border-[#E8EAF0] rounded-2xl overflow-hidden relative shadow-card transition-all`}
        >
          {/* Flow Direction Indicator Guide */}
          <div className="absolute top-3 left-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-[#E8EAF0] text-[11px] text-[#4B5563] shadow-xs select-none pointer-events-none">
            <span className="text-emerald-700 font-bold">Payer Clusters</span>
            <span className="text-[#9CA3AF]">→</span>
            <span className="text-[#111827] font-bold">Target Merchant</span>
            <span className="text-[#9CA3AF]">→</span>
            <span className="text-[#C8102E] font-bold">Payout Destinations</span>
          </div>

          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            minZoom={0.2}
            maxZoom={2.5}
          >
            <Background color="#CBD5E1" gap={20} size={1} />
            <Controls className="!m-3" />
            <MiniMap
              nodeColor={node => {
                if (node.type === 'merchantNode') return '#10131C';
                if (node.type === 'payerClusterNode') return '#059669';
                if (node.type === 'payoutDestinationNode') return '#C8102E';
                return '#D97706';
              }}
              maskColor="rgba(248, 250, 252, 0.7)"
              className="!m-3 !border !border-[#E8EAF0] !bg-white !rounded-lg"
            />
          </ReactFlow>
        </div>

        {/* Entity Inspector Side Panel */}
        {inspectedEntity && (
          <div className="lg:col-span-4 xl:col-span-3 bg-white border border-[#E8EAF0] rounded-2xl p-4 shadow-card flex flex-col justify-between max-h-[600px] overflow-y-auto">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6] mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#FDF2F2] text-[#C8102E] flex items-center justify-center">
                    <GitFork className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#111827]">
                    {inspectedEntity.type === 'merchant'
                      ? 'Merchant Intelligence'
                      : inspectedEntity.type === 'counterparty'
                      ? 'Counterparty Entity'
                      : 'Directed Flow Detail'}
                  </h4>
                </div>
                <button
                  onClick={() => setInspectedEntity(null)}
                  className="p-1 rounded-md text-[#9CA3AF] hover:text-[#111827] hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Merchant Node Inspection */}
              {inspectedEntity.type === 'merchant' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="font-mono text-base font-semibold text-[#111827] block">
                      {inspectedEntity.data.merchant_id}
                    </span>
                    <span className="text-[#6B7280] text-[11px]">{inspectedEntity.data.declared_category}</span>
                  </div>

                  <div className="bg-[#F9FAFB] p-3 rounded-xl border border-[#E8EAF0] space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Monthly Volume:</span>
                      <span className="text-[#111827] font-semibold">
                        {formatINR(inspectedEntity.data.monthly_volume_inr)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Monthly Txns:</span>
                      <span className="text-[#111827] font-semibold">
                        {formatNumber(inspectedEntity.data.monthly_txn_count)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Avg Txn Value:</span>
                      <span className="text-[#111827] font-semibold">
                        {formatINR(inspectedEntity.data.avg_txn_value_inr)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Dispute Rate:</span>
                      <span className="text-[#C8102E] font-semibold">
                        {formatPercent(inspectedEntity.data.dispute_rate_pct, true)}
                      </span>
                    </div>
                  </div>

                  {inspectedEntity.data.merchant_id !== selectedMerchant.merchant_id && (
                    <button
                      onClick={() => {
                        selectMerchant(inspectedEntity.data.merchant_id);
                        setInspectedEntity(null);
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-[#C8102E] hover:bg-[#A50D25] text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                    >
                      <span>Focus on this Merchant</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Counterparty Inspection */}
              {inspectedEntity.type === 'counterparty' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="font-mono text-sm font-semibold text-emerald-700 block break-all">
                      {inspectedEntity.data.counterpartyId}
                    </span>
                    <span className="text-[#6B7280] text-[11px]">{inspectedEntity.data.type}</span>
                  </div>

                  <div className="bg-[#F9FAFB] p-3 rounded-xl border border-[#E8EAF0] space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Connected Merchants:</span>
                      <span className="text-amber-700 font-bold">
                        {inspectedEntity.data.connectedMerchants.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Total Throughput:</span>
                      <span className="text-[#111827] font-semibold">
                        {formatINR(inspectedEntity.data.totalVolumeInr, true)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Total Txns:</span>
                      <span className="text-[#111827] font-semibold">
                        {formatNumber(inspectedEntity.data.totalTxnCount)}
                      </span>
                    </div>
                  </div>

                  {/* Connected Merchants List */}
                  <div>
                    <span className="text-[11px] font-semibold uppercase text-[#6B7280] block mb-1.5">
                      Co-Connected Merchants ({inspectedEntity.data.connectedMerchants.length})
                    </span>
                    <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                      {inspectedEntity.data.connectedMerchants.map((mId: string) => (
                        <div
                          key={mId}
                          onClick={() => {
                            selectMerchant(mId);
                            setInspectedEntity(null);
                          }}
                          className={`p-1.5 rounded-lg flex items-center justify-between text-[11px] font-mono cursor-pointer transition-colors ${
                            mId === selectedMerchant.merchant_id
                              ? 'bg-[#FDF2F2] text-[#C8102E] font-bold border border-[#FEE2E2]'
                              : 'bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#374151]'
                          }`}
                        >
                          <span>{mId}</span>
                          <span className="text-[10px] text-[#C8102E] flex items-center gap-0.5">
                            Focus →
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Edge Inspection */}
              {inspectedEntity.type === 'edge' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-xs uppercase font-semibold text-[#111827] block">
                      {inspectedEntity.data.direction === 'inflow_to_merchant'
                        ? 'Incoming Payer Flow'
                        : 'Outgoing Payout Flow'}
                    </span>
                    <div className="font-mono text-[11px] text-[#4B5563] mt-1 flex items-center gap-1.5">
                      <span className="text-emerald-700 font-semibold">{inspectedEntity.data.sourceName}</span>
                      <span>→</span>
                      <span className="text-[#C8102E] font-semibold">{inspectedEntity.data.targetName}</span>
                    </div>
                  </div>

                  <div className="bg-[#F9FAFB] p-3 rounded-xl border border-[#E8EAF0] space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Flow Volume:</span>
                      <span className="text-[#111827] font-semibold">{formatINR(inspectedEntity.data.volume)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Txn Count:</span>
                      <span className="text-[#111827]">{formatNumber(inspectedEntity.data.txnCount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Flow Direction:</span>
                      <span className="text-[#111827] font-medium">{inspectedEntity.data.direction}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#F3F4F6] text-[10px] text-[#9CA3AF]">
              Click any node or link in the graph to inspect structural details.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
