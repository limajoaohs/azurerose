import React from 'react';
import { Sparkles, Brain, Eye, Timer, LogOut } from 'lucide-react';
import { AIStatus, User } from '../../types';

interface NavbarProps {
  aiStatus: AIStatus | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User | null;
  onLogout: () => void;
  focusSecondsLeft: number;
  isFocusRunning: boolean;
}

const formatTime = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const Navbar: React.FC<NavbarProps> = ({
  aiStatus,
  activeTab,
  setActiveTab,
  user,
  onLogout,
  focusSecondsLeft,
  isFocusRunning,
}) => {
  return (
    <header className="h-14 border-b border-slate-800 bg-[#0f172a]/90 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-slate-950 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <span className="text-white font-black text-base tracking-tighter">AR</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-100 text-sm tracking-wide">AzureRose</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Workspace of the Impossible
            </span>
          </div>
        </div>
      </div>

      <nav className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
        <button
          onClick={() => setActiveTab('editor')}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
            activeTab === 'editor'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          Notas & Editor
        </button>
        <button
          onClick={() => setActiveTab('canvas')}
          className={`px-3 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all ${
            activeTab === 'canvas'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Eye size={13} className="text-blue-300" />
          O Olho (Mapas)
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
            activeTab === 'calendar'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          Cronograma & Prazos
        </button>
        <button
          onClick={() => setActiveTab('syllabus')}
          className={`px-3 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all ${
            activeTab === 'syllabus'
              ? 'bg-gradient-to-r from-blue-600 to-slate-950 text-white shadow-sm'
              : 'text-white/70 hover:text-white hover:bg-white/10 border border-white/20'
          }`}
        >
          <Sparkles size={13} />
          Ementa Difícil
        </button>
      </nav>

      <div className="flex items-center gap-3">
        {isFocusRunning && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-950/40 border border-sky-500/30 text-sky-300 text-xs font-medium"
            title="Sessão de Hiperfoco em andamento (continue na nota para ver o painel)"
          >
            <Timer size={13} className="animate-pulse" />
            <span className="font-mono tabular-nums">{formatTime(focusSecondsLeft)}</span>
          </div>
        )}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-950/50 border border-blue-500/30 text-blue-300 text-xs font-medium"
          title={`Provedor de IA ativo: ${aiStatus?.active_provider || 'Mock Engine'}`}
        >
          <Brain size={13} className="text-blue-400 animate-pulse" />
          <span className="capitalize">{aiStatus?.active_provider || 'IA Própria'}</span>
          {aiStatus?.is_mock && <span className="text-[9px] bg-blue-500/20 px-1 py-0.2 rounded text-blue-300">Local Dev</span>}
        </div>

        {user && (
          <div className="flex items-center gap-2 bg-slate-900 pl-2.5 pr-1.5 py-1 rounded-md border border-slate-800">
            <span className="text-xs text-slate-400 max-w-[140px] truncate" title={user.email}>
              {user.name || user.email}
            </span>
            <button
              onClick={onLogout}
              className="p-1 text-slate-500 hover:text-white transition-colors"
              title="Sair da conta"
            >
              <LogOut size={13} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
