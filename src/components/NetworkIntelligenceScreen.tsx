import React, { useState, useMemo, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useMerchant } from '../context/MerchantContext';
import { MerchantNode, PayerClusterNode, PayoutDestinationNode, SharedMerchantNode } from './network/CustomNodes';
import { formatINR, formatNumber, formatPercent } from '../utils/formatters';
import {
  GitFork,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Share2,
  Info,
  SlidersHorizontal,
  X,
  ExternalLink,
  Shield,
  Layers,
} from 'lucide-react';

const nodeTypes = {
  merchantNode: MerchantNode,
  payerClusterNode: PayerClusterNode,
  payoutDestinationNode: PayoutDestinationNode,
  sharedMerchantNode: SharedMerchantNode,
};

type FlowFilter = 'ALL' | 'INFLOW' | 'OUTFLOW';

export const NetworkIntelligenceScreen: React.FC = () => {
  const { selectedMerchant, merchants, selectMerchant, counterpartyMap, setActiveTab } = useMerchant();

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
      <div className="bg-[#111827] border border-[#243049] rounded-xl p-8 text-center text-slate-400">
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
      const verticalSpacing = 90;
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
          style: { stroke: '#10B981', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#10B981',
            width: 16,
            height: 16,
          },
          label: `${formatINR(flow.flow_volume_inr, true)} (${formatNumber(flow.transaction_count)} txns)`,
          labelStyle: { fill: '#6EE7B7', fontSize: 10, fontFamily: 'monospace', fontWeight: 600 },
          labelBgStyle: { fill: '#064E3B', fillOpacity: 0.85 },
          labelBgPadding: [6, 3],
          labelBgBorderRadius: 4,
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
          style: { stroke: '#A855F7', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#A855F7',
            width: 16,
            height: 16,
          },
          label: `${formatINR(flow.flow_volume_inr, true)} (${formatNumber(flow.transaction_count)} txns)`,
          labelStyle: { fill: '#E9D5FF', fontSize: 10, fontFamily: 'monospace', fontWeight: 600 },
          labelBgStyle: { fill: '#581C87', fillOpacity: 0.85 },
          labelBgPadding: [6, 3],
          labelBgBorderRadius: 4,
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

    // 4. Expanded Shared Hubs: Co-connected merchants
    if (expandShared && sharedMerchantsInfo.length > 0) {
      const topShared = sharedMerchantsInfo.slice(0, 5); // display up to 5 key shared peers to preserve readability
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

        // Link shared merchant to the corresponding shared counterparty
        for (const cpId of item.counterparties) {
          const payerNode = generatedNodes.find(n => n.id === `payer_${cpId}`);
          const payoutNode = generatedNodes.find(n => n.id === `payout_${cpId}`);

          if (payerNode) {
            generatedEdges.push({
              id: `edge_shared_${payerNode.id}_${sharedNodeId}`,
              source: payerNode.id,
              target: sharedNodeId,
              targetHandle: 'shared-target',
              style: { stroke: '#F59E0B', strokeDasharray: '5,5', strokeWidth: 1.5 },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#F59E0B' },
              label: 'Shared Inflow Hub',
              labelStyle: { fill: '#FDE68A', fontSize: 9, fontFamily: 'monospace' },
              labelBgStyle: { fill: '#78350F', fillOpacity: 0.8 },
            });
          }

          if (payoutNode) {
            generatedEdges.push({
              id: `edge_shared_${sharedNodeId}_${payoutNode.id}`,
              source: sharedNodeId,
              sourceHandle: 'shared-source',
              target: payoutNode.id,
              style: { stroke: '#F59E0B', strokeDasharray: '5,5', strokeWidth: 1.5 },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#F59E0B' },
              label: 'Shared Payout Hub',
              labelStyle: { fill: '#FDE68A', fontSize: 9, fontFamily: 'monospace' },
              labelBgStyle: { fill: '#78350F', fillOpacity: 0.8 },
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
            type: node.type === 'payerClusterNode' ? 'Inflow Payer Cluster' : 'Payout Destination Hub',
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
      {/* Critical Mandatory Transparency Banner */}
      <div className="bg-[#1C1322] border-l-4 border-l-amber-500 border border-amber-500/30 rounded-xl p-3.5 flex items-start gap-3 shadow-md">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs">
          <div className="font-bold text-amber-300 font-mono tracking-wide uppercase flex items-center gap-2">
            SYNTHETIC NETWORK DATA — DEMONSTRATION ONLY
            <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded text-amber-200 normal-case border border-amber-500/30">
              Not observed real-world payment rails
            </span>
          </div>
          <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
            Payer clusters and payout counterparties in this network graph are synthetically generated demo entities.
            Some shared network hubs were synthetically assigned to illustrate graph topology. They do not represent
            actual bank accounts, beneficiaries, or verified illicit money trails.
          </p>
        </div>
      </div>

      {/* Network Summary Metrics Header */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-[#111827] border border-[#243049] p-3 rounded-xl">
          <span className="text-[10px] font-semibold uppercase text-slate-400 block">Payer Clusters (Inflow)</span>
          <span className="text-base font-bold font-mono text-emerald-400">{payerFlows.length} clusters</span>
          <span className="text-[10px] text-slate-400 block font-mono">{formatINR(totalInflowVolume, true)}</span>
        </div>

        <div className="bg-[#111827] border border-[#243049] p-3 rounded-xl">
          <span className="text-[10px] font-semibold uppercase text-slate-400 block">Payout Hubs (Outflow)</span>
          <span className="text-base font-bold font-mono text-purple-400">{payoutFlows.length} hubs</span>
          <span className="text-[10px] text-slate-400 block font-mono">{formatINR(totalOutflowVolume, true)}</span>
        </div>

        <div className="bg-[#111827] border border-[#243049] p-3 rounded-xl">
          <span className="text-[10px] font-semibold uppercase text-slate-400 block">Total Inflow Volume</span>
          <span className="text-base font-bold font-mono text-white">{formatINR(totalInflowVolume, true)}</span>
          <span className="text-[10px] text-slate-400 block truncate">{formatINR(totalInflowVolume)}</span>
        </div>

        <div className="bg-[#111827] border border-[#243049] p-3 rounded-xl">
          <span className="text-[10px] font-semibold uppercase text-slate-400 block">Total Outflow Volume</span>
          <span className="text-base font-bold font-mono text-white">{formatINR(totalOutflowVolume, true)}</span>
          <span className="text-[10px] text-slate-400 block truncate">{formatINR(totalOutflowVolume)}</span>
        </div>

        <div className="bg-[#111827] border border-[#243049] p-3 rounded-xl">
          <span className="text-[10px] font-semibold uppercase text-slate-400 block">Shared Counterparties</span>
          <span className="text-base font-bold font-mono text-amber-400">
            {sharedMerchantsInfo.length} peer merchants
          </span>
          <span className="text-[10px] text-slate-400 block">Co-connected across dataset</span>
        </div>
      </div>

      {/* Network Filter Bar */}
      <div className="bg-[#111827] border border-[#243049] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Merchant selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Focus Merchant:</span>
            <select
              value={selectedMerchant.merchant_id}
              onChange={e => selectMerchant(e.target.value)}
              className="bg-[#162032] border border-[#2B3B55] text-xs text-white px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-blue-500 font-mono font-semibold"
            >
              {merchants.map(m => (
                <option key={m.merchant_id} value={m.merchant_id}>
                  {m.merchant_id} — {m.declared_category}
                </option>
              ))}
            </select>
          </div>

          {/* Direction Filter */}
          <div className="flex items-center gap-1 bg-[#0A0E17] p-1 rounded-lg border border-[#243049]">
            <button
              onClick={() => setFlowFilter('ALL')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                flowFilter === 'ALL' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Flows
            </button>
            <button
              onClick={() => setFlowFilter('INFLOW')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                flowFilter === 'INFLOW' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Incoming (Inflow)
            </button>
            <button
              onClick={() => setFlowFilter('OUTFLOW')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                flowFilter === 'OUTFLOW' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Outgoing (Payout)
            </button>
          </div>

          {/* Min volume filter */}
          <div className="flex items-center gap-2 text-slate-400 bg-[#0A0E17] px-3 py-1.5 rounded-lg border border-[#243049]">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Min Flow:</span>
            <input
              type="range"
              min={0}
              max={150000}
              step={10000}
              value={minVolume}
              onChange={e => setMinVolume(Number(e.target.value))}
              className="w-20 accent-blue-500 cursor-pointer"
            />
            <span className="font-mono text-white text-[11px]">{formatINR(minVolume, true)}</span>
            {minVolume > 0 && (
              <button
                onClick={() => setMinVolume(0)}
                className="text-[10px] text-slate-400 hover:text-white ml-1"
                title="Reset min volume"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Toggle Shared Hubs Expansion */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpandShared(!expandShared)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              expandShared
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-900/30'
                : 'bg-[#162032] text-slate-300 border-[#2B3B55] hover:bg-[#202C45]'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-amber-400" />
            <span>{expandShared ? 'Collapse Shared Hubs' : 'Expand Shared Counterparty Network'}</span>
            {sharedMerchantsInfo.length > 0 && (
              <span className="ml-1 text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded-full font-mono">
                {sharedMerchantsInfo.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Interactive Network Graph Canvas + Node/Edge Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Canvas (8 or 12 cols depending on inspector) */}
        <div
          className={`${
            inspectedEntity ? 'lg:col-span-8 xl:col-span-9' : 'lg:col-span-12'
          } h-[600px] bg-[#0A0E17] border border-[#243049] rounded-xl overflow-hidden relative shadow-2xl transition-all`}
        >
          {/* Flow Direction Indicator Guide */}
          <div className="absolute top-3 left-4 z-10 flex items-center gap-2 bg-[#0E1526]/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#243049] text-[11px] text-slate-300 select-none pointer-events-none">
            <span className="text-emerald-400 font-bold">Payer Clusters</span>
            <span className="text-slate-500">➔</span>
            <span className="text-blue-400 font-bold">Merchant</span>
            <span className="text-slate-500">➔</span>
            <span className="text-purple-400 font-bold">Payout Destinations</span>
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
            <Background color="#1E293B" gap={24} size={1} />
            <Controls className="!m-3" />
            <MiniMap
              nodeColor={node => {
                if (node.type === 'merchantNode') return '#38BDF8';
                if (node.type === 'payerClusterNode') return '#10B981';
                if (node.type === 'payoutDestinationNode') return '#A855F7';
                return '#F59E0B';
              }}
              maskColor="rgba(10, 14, 23, 0.7)"
              className="!m-3 !border !border-[#243049] !bg-[#0E1526] !rounded-lg"
            />
          </ReactFlow>
        </div>

        {/* Entity Inspector Side Panel */}
        {inspectedEntity && (
          <div className="lg:col-span-4 xl:col-span-3 bg-[#111827] border border-[#243049] rounded-xl p-4 shadow-xl flex flex-col justify-between max-h-[600px] overflow-y-auto">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#243049] mb-3">
                <div className="flex items-center gap-2">
                  <GitFork className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    {inspectedEntity.type === 'merchant'
                      ? 'Merchant Intelligence'
                      : inspectedEntity.type === 'counterparty'
                      ? 'Counterparty Entity'
                      : 'Directed Flow Detail'}
                  </h4>
                </div>
                <button
                  onClick={() => setInspectedEntity(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-[#1E293B]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Merchant Node Inspection */}
              {inspectedEntity.type === 'merchant' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="font-mono text-base font-bold text-cyan-400 block">
                      {inspectedEntity.data.merchant_id}
                    </span>
                    <span className="text-slate-400 text-[11px]">{inspectedEntity.data.declared_category}</span>
                  </div>

                  <div className="bg-[#0C1220] p-2.5 rounded-lg border border-[#1E293B] space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Monthly Volume:</span>
                      <span className="text-white font-semibold">
                        {formatINR(inspectedEntity.data.monthly_volume_inr)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Monthly Txns:</span>
                      <span className="text-white font-semibold">
                        {formatNumber(inspectedEntity.data.monthly_txn_count)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Avg Txn Value:</span>
                      <span className="text-white font-semibold">
                        {formatINR(inspectedEntity.data.avg_txn_value_inr)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Dispute Rate:</span>
                      <span className="text-red-400 font-semibold">
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
                      className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
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
                    <span className="font-mono text-sm font-bold text-emerald-400 block break-all">
                      {inspectedEntity.data.counterpartyId}
                    </span>
                    <span className="text-slate-400 text-[11px]">{inspectedEntity.data.type}</span>
                  </div>

                  <div className="bg-[#0C1220] p-2.5 rounded-lg border border-[#1E293B] space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Connected Merchants:</span>
                      <span className="text-amber-300 font-bold">
                        {inspectedEntity.data.connectedMerchants.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Throughput:</span>
                      <span className="text-white font-semibold">
                        {formatINR(inspectedEntity.data.totalVolumeInr, true)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Txns:</span>
                      <span className="text-white font-semibold">
                        {formatNumber(inspectedEntity.data.totalTxnCount)}
                      </span>
                    </div>
                  </div>

                  {/* Connected Merchants List */}
                  <div>
                    <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-1.5">
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
                          className={`p-1.5 rounded flex items-center justify-between text-[11px] font-mono cursor-pointer transition-colors ${
                            mId === selectedMerchant.merchant_id
                              ? 'bg-blue-600/20 text-cyan-300 font-bold border border-blue-500/30'
                              : 'bg-[#151F33] hover:bg-[#1E2C4A] text-slate-300'
                          }`}
                        >
                          <span>{mId}</span>
                          <span className="text-[10px] text-blue-400 flex items-center gap-0.5">
                            Focus ➔
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
                    <span className="text-xs uppercase font-semibold text-blue-400 block">
                      {inspectedEntity.data.direction === 'inflow_to_merchant'
                        ? 'Incoming Payer Flow'
                        : 'Outgoing Payout Flow'}
                    </span>
                    <div className="font-mono text-[11px] text-slate-300 mt-1 flex items-center gap-1.5">
                      <span className="text-cyan-400 font-bold">{inspectedEntity.data.sourceName}</span>
                      <span>➔</span>
                      <span className="text-purple-400 font-bold">{inspectedEntity.data.targetName}</span>
                    </div>
                  </div>

                  <div className="bg-[#0C1220] p-2.5 rounded-lg border border-[#1E293B] space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Flow Volume:</span>
                      <span className="text-white font-bold">{formatINR(inspectedEntity.data.volume)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Txn Count:</span>
                      <span className="text-white">{formatNumber(inspectedEntity.data.txnCount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Flow Direction:</span>
                      <span className="text-cyan-300">{inspectedEntity.data.direction}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#243049] text-[10px] text-slate-400">
              Click any node or link in the graph to inspect structural details.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

