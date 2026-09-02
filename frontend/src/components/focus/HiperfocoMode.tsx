import React, { useState } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Maximize2, Minimize2, Flame } from 'lucide-react';
import { FocusPhase, FocusDurations } from '../../hooks/useFocusTimer';

interface HiperfocoModeProps {
  phase: FocusPhase;
  secondsLeft: number;
  isRunning: boolean;
  cyclesCompleted: number;
  sessionGoal: string;
  durations: FocusDurations;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
  setSessionGoal: (goal: string) => void;
  setDurations: (durations: FocusDurations) => void;
  variant?: 'page' | 'panel';
}

const PHASE_LABEL: Record<FocusPhase, string> = {
  focus: 'Foco',
  short_break: 'Pausa curta',
  long_break: 'Pausa longa',
};

const PHASE_COLOR: Record<FocusPhase, string> = {
  focus: 'from-blue-600 to-slate-950',
  short_break: 'from-sky-600 to-blue-600',
  long_break: 'from-blue-900 to-slate-950',
};

const formatTime = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const HiperfocoMode: React.FC<HiperfocoModeProps> = ({
  phase,
  secondsLeft,
  isRunning,
  cyclesCompleted,
  sessionGoal,
  durations,
  start,
  pause,
  reset,
  skip,
  setSessionGoal,
  setDurations,
  variant = 'page',
}) => {
  const [isFocusView, setIsFocusView] = useState(false);
  const isPanel = variant === 'panel' && !isFocusView;

  const timerCard = (
    <div className="flex flex-col items-center">
      <span
        className={`uppercase tracking-[0.2em] font-bold rounded-full bg-gradient-to-r ${PHASE_COLOR[phase]} text-white ${
          isPanel ? 'text-[10px] px-2.5 py-0.5 mb-3' : 'text-[11px] px-3 py-1 mb-6'
        }`}
      >
        {PHASE_LABEL[phase]}
      </span>

      <div
        className={`font-mono font-bold text-slate-100 tabular-nums tracking-tight ${
          isPanel ? 'text-4xl' : 'text-7xl md:text-8xl'
        }`}
      >
        {formatTime(secondsLeft)}
      </div>

      {sessionGoal && (
        <p className={`text-slate-400 text-center ${isPanel ? 'mt-2 text-xs max-w-[220px]' : 'mt-4 text-sm max-w-sm'}`}>
          {isPanel ? sessionGoal : (
            <>Meta desta sessão: <span className="text-slate-200 font-medium">{sessionGoal}</span></>
          )}
        </p>
      )}

      <div className={`flex items-center gap-3 ${isPanel ? 'mt-4' : 'mt-8'}`}>
        <button
          onClick={reset}
          className={`rounded-full bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors ${isPanel ? 'p-2' : 'p-3'}`}
          title="Reiniciar ciclo"
        >
          <RotateCcw size={isPanel ? 14 : 18} />
        </button>
        <button
          onClick={isRunning ? pause : start}
          className={`rounded-full bg-gradient-to-r ${PHASE_COLOR[phase]} text-white shadow-lg shadow-blue-500/20 hover:opacity-90 transition-opacity ${
            isPanel ? 'p-3' : 'p-5'
          }`}
          title={isRunning ? 'Pausar' : 'Iniciar'}
        >
          {isRunning ? <Pause size={isPanel ? 18 : 24} /> : <Play size={isPanel ? 18 : 24} />}
        </button>
        <button
          onClick={skip}
          className={`rounded-full bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors ${isPanel ? 'p-2' : 'p-3'}`}
          title="Pular para a próxima fase"
        >
          <SkipForward size={isPanel ? 14 : 18} />
        </button>
      </div>

      <div className={`flex items-center gap-1.5 text-slate-500 ${isPanel ? 'mt-3 text-[10px]' : 'mt-6 text-xs'}`}>
        <Flame size={isPanel ? 11 : 13} className="text-sky-400" />
        {cyclesCompleted} {cyclesCompleted === 1 ? 'ciclo hoje' : 'ciclos hoje'}
      </div>

      <button
        onClick={() => setIsFocusView((v) => !v)}
        className={`flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors ${
          isPanel ? 'mt-4 text-[10px]' : 'mt-8 text-xs'
        }`}
      >
        {isFocusView ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        {isFocusView ? 'Sair do modo foco' : 'Modo foco (tela cheia)'}
      </button>
    </div>
  );

  if (isFocusView) {
    return (
      <div className="fixed inset-0 z-50 bg-[#05070d] flex items-center justify-center">
        {timerCard}
      </div>
    );
  }

  if (isPanel) {
    return (
      <div className="flex flex-col items-center p-4">
        {timerCard}

        <div className="mt-5 w-full">
          <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
            Meta deste ciclo
          </label>
          <input
            type="text"
            value={sessionGoal}
            onChange={(e) => setSessionGoal(e.target.value)}
            placeholder="O que você vai estudar"
            className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />

          <div className="grid grid-cols-3 gap-1.5 mt-3">
            {(['focus', 'short_break', 'long_break'] as FocusPhase[]).map((p) => (
              <div key={p}>
                <label className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold block mb-1 truncate">
                  {PHASE_LABEL[p]}
                </label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={durations[p]}
                  onChange={(e) =>
                    setDurations({ ...durations, [p]: Math.max(1, parseInt(e.target.value, 10) || 1) })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-1 py-1 text-xs text-slate-100 text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#080d1a] h-[calc(100vh-3.5rem)] overflow-y-auto">
      {timerCard}

      <div className="mt-10 w-full max-w-sm bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <label className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
          O que você vai estudar neste ciclo?
        </label>
        <input
          type="text"
          value={sessionGoal}
          onChange={(e) => setSessionGoal(e.target.value)}
          placeholder="Ex: terminar lista 1 de Cálculo"
          className="mt-1.5 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />

        <div className="grid grid-cols-3 gap-2 mt-4">
          {(['focus', 'short_break', 'long_break'] as FocusPhase[]).map((p) => (
            <div key={p}>
              <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block mb-1">
                {PHASE_LABEL[p]}
              </label>
              <input
                type="number"
                min={1}
                max={120}
                value={durations[p]}
                onChange={(e) =>
                  setDurations({ ...durations, [p]: Math.max(1, parseInt(e.target.value, 10) || 1) })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-sm text-slate-100 text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-600 mt-2">Minutos por fase. Após 4 ciclos de foco, a pausa vira longa.</p>
      </div>
    </div>
  );
};
