import React from 'react';
import { X, Sparkles, CheckSquare, Variable, HelpCircle, ArrowRight, Plus } from 'lucide-react';
import { NoteSummaryResponse } from '../../types';

interface AzureCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  summary: NoteSummaryResponse | null;
  isLoading: boolean;
  onAddTasksToTimeline: (tasks: { title: string; priority: string; estimated_minutes: number }[]) => void;
}

export const AzureCopilotDrawer: React.FC<AzureCopilotDrawerProps> = ({
  isOpen,
  onClose,
  summary,
  isLoading,
  onAddTasksToTimeline,
}) => {
  if (!isOpen) return null;

  return (
    <aside className="w-80 border-l border-slate-800 bg-[#0c1222]/95 backdrop-blur-xl h-[calc(100vh-3.5rem)] flex flex-col z-40 fixed right-0 top-14 shadow-2xl">
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-slate-950 flex items-center justify-center">
            <Sparkles size={13} className="text-white" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100">Azure Copilot ("O Cérebro")</h3>
            <span className="text-[10px] text-blue-400">Síntese & Ação Cognitiva</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-blue-400 flex flex-col items-center gap-3">
            <Sparkles className="animate-spin text-blue-400" size={24} />
            <span>Processando anotação com IA...</span>
          </div>
        ) : !summary ? (
          <div className="py-12 text-center text-xs text-slate-500">
            Clique em <b>Resumo & Tarefas</b> no editor para gerar a análise inteligente desta anotação.
          </div>
        ) : (
          <>
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                <Sparkles size={12} className="text-blue-400" /> Resumo Executivo
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {summary.bullet_summary.map((b, i) => (
                  <li key={i} className="leading-relaxed flex items-start gap-1.5">
                    <span className="text-blue-400 font-bold">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {summary.key_formulas_or_definitions && summary.key_formulas_or_definitions.length > 0 && (
              <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 mb-2 flex items-center gap-1.5">
                  <Variable size={12} className="text-cyan-400" /> Fórmulas / Axiomas
                </h4>
                <ul className="space-y-1 text-xs text-cyan-200 font-mono">
                  {summary.key_formulas_or_definitions.map((f, i) => (
                    <li key={i} className="p-1.5 rounded bg-slate-950/60 border border-cyan-500/20">
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {summary.action_items && summary.action_items.length > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <CheckSquare size={12} className="text-sky-400" /> Micro-Metas Sugeridas
                  </h4>
                  <button
                    onClick={() => onAddTasksToTimeline(summary.action_items)}
                    className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-0.5"
                  >
                    <Plus size={10} /> Add Todas
                  </button>
                </div>
                <div className="space-y-2">
                  {summary.action_items.map((task, i) => (
                    <div key={i} className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-300 leading-tight pr-2">{task.title}</span>
                      <span className="text-[10px] text-slate-500 shrink-0 font-mono">{task.estimated_minutes}m</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {summary.follow_up_questions && summary.follow_up_questions.length > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/15">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-white mb-2 flex items-center gap-1.5">
                  <HelpCircle size={12} className="text-white" /> Teste Rápido de Fixação
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-200">
                  {summary.follow_up_questions.map((q, i) => (
                    <li key={i} className="leading-relaxed">
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
};
