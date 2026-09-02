import React, { useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  Node,
  Edge,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { InlineMath, BlockMath } from 'react-katex';
import { Sparkles, AlertTriangle, Lightbulb, FunctionSquare, Layers } from 'lucide-react';
import { MindmapResponse, MindmapNodeData } from '../../types';

const CustomMindmapNode = ({ data }: { data: MindmapNodeData }) => {
  const getCategoryStyles = () => {
    switch (data.category) {
      case 'core_topic':
        return 'bg-gradient-to-r from-blue-600 to-blue-900 text-white border-blue-400/50 shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/30';
      case 'formula':
        return 'bg-slate-900/90 text-cyan-200 border-cyan-500/40 shadow-md shadow-cyan-950/40';
      case 'warning':
        return 'bg-black text-white border-white/30 shadow-md shadow-black/40';
      case 'example':
        return 'bg-sky-950/80 text-sky-200 border-sky-500/40 shadow-md shadow-sky-950/30';
      default:
        return 'bg-slate-900/90 text-slate-100 border-slate-700 hover:border-blue-500/50';
    }
  };

  const getIcon = () => {
    switch (data.category) {
      case 'core_topic':
        return <Layers size={14} className="text-blue-200" />;
      case 'formula':
        return <FunctionSquare size={14} className="text-cyan-400" />;
      case 'warning':
        return <AlertTriangle size={14} className="text-white" />;
      case 'example':
        return <Lightbulb size={14} className="text-sky-400" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-blue-400" />;
    }
  };

  return (
    <div className={`p-3.5 rounded-xl border min-w-[200px] max-w-[300px] backdrop-blur-md transition-all ${getCategoryStyles()}`}>
      <Handle type="target" position={Position.Top} className="!bg-blue-400 !w-2 !h-2" />
      
      <div className="flex items-center gap-2 mb-1">
        {getIcon()}
        <span className="text-xs font-bold tracking-tight">{data.label}</span>
      </div>

      {data.description && (
        <p className="text-[11px] opacity-85 leading-relaxed mt-1">
          {data.description}
        </p>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-blue-400 !w-2 !h-2" />
    </div>
  );
};

interface MindmapCanvasProps {
  mindmapData: MindmapResponse | null;
  onRefreshMindmap?: () => void;
}

export const MindmapCanvas: React.FC<MindmapCanvasProps> = ({ mindmapData, onRefreshMindmap }) => {
  const nodeTypes = useMemo(() => ({ mindmapNode: CustomMindmapNode }), []);

  const nodes: Node[] = useMemo(() => {
    if (!mindmapData || !mindmapData.nodes) return [];

    const totalNodes = mindmapData.nodes.length;
    const centerX = 450;
    const centerY = 280;
    const radius = 220;

    return mindmapData.nodes.map((n, index) => {
      let x = centerX;
      let y = centerY;

      if (n.category === 'core_topic' || index === 0) {
        x = centerX;
        y = centerY;
      } else {
        const angle = ((index - 1) / (totalNodes - 1)) * 2 * Math.PI;
        x = centerX + Math.cos(angle) * (radius + (index % 2) * 50);
        y = centerY + Math.sin(angle) * (radius + (index % 2) * 40);
      }

      return {
        id: n.id,
        type: 'mindmapNode',
        position: { x, y },
        data: n,
      };
    });
  }, [mindmapData]);

  const edges: Edge[] = useMemo(() => {
    if (!mindmapData || !mindmapData.edges) return [];

    return mindmapData.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.relation || '',
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 2 },
      labelStyle: { fill: '#93c5fd', fontSize: 10, fontWeight: 600 },
      labelBgStyle: { fill: '#0f172a', fillOpacity: 0.85 },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 4,
    }));
  }, [mindmapData]);

  if (!mindmapData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 bg-[#080d1a] h-[calc(100vh-3.5rem)]">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
          <Sparkles className="text-blue-400" size={28} />
        </div>
        <h3 className="text-sm font-semibold text-slate-300">"O Olho" — Visualizador de Mapas Mentais</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm text-center">
          Abra uma anotação e clique em <b>Ver no Mapa ("O Olho")</b> para a IA gerar automaticamente o grafo de conexões conceituais.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 h-[calc(100vh-3.5rem)] relative bg-[#080d1a]">
      <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800 shadow-xl">
        <h2 className="text-xs font-bold text-slate-100 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          {mindmapData.title}
        </h2>
        <span className="text-[10px] text-slate-400">
          Tópico Central: <b className="text-blue-300">{mindmapData.central_topic}</b>
        </span>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        className="bg-[#080d1a]"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e293b" />
        <Controls className="!bg-slate-900 !border-slate-800 !text-slate-300 !fill-slate-300" />
        <MiniMap
          nodeColor={(n) => (n.data?.category === 'core_topic' ? '#3b82f6' : '#64748b')}
          className="!bg-slate-900 !border-slate-800 !rounded-xl !overflow-hidden"
          maskColor="rgba(15, 23, 42, 0.7)"
        />
      </ReactFlow>
    </div>
  );
};
