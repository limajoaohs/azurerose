import { useCallback, useEffect, useRef, useState } from 'react';

export type FocusPhase = 'focus' | 'short_break' | 'long_break';

export interface FocusDurations {
  focus: number;
  short_break: number;
  long_break: number;
}

const DEFAULT_DURATIONS: FocusDurations = { focus: 25, short_break: 5, long_break: 15 };
const CYCLES_BEFORE_LONG_BREAK = 4;
const STORAGE_KEY = 'azurerose_hiperfoco';

interface PersistedState {
  phase: FocusPhase;
  secondsLeft: number;
  isRunning: boolean;
  cyclesCompleted: number;
  sessionGoal: string;
  durations: FocusDurations;
  lastTickAt: number | null;
}

const loadState = (): PersistedState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error('empty');
    const parsed = JSON.parse(raw) as PersistedState;

    if (parsed.isRunning && parsed.lastTickAt) {
      const elapsed = Math.floor((Date.now() - parsed.lastTickAt) / 1000);
      parsed.secondsLeft = Math.max(0, parsed.secondsLeft - elapsed);
    }
    return parsed;
  } catch {
    return {
      phase: 'focus',
      secondsLeft: DEFAULT_DURATIONS.focus * 60,
      isRunning: false,
      cyclesCompleted: 0,
      sessionGoal: '',
      durations: DEFAULT_DURATIONS,
      lastTickAt: null,
    };
  }
};

export function useFocusTimer() {
  const [state, setState] = useState<PersistedState>(loadState);
  const notifiedRef = useRef(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, lastTickAt: Date.now() }));
  }, [state]);

  useEffect(() => {
    if (!state.isRunning) return;
    const interval = setInterval(() => {
      setState((prev) => {
        if (prev.secondsLeft > 1) {
          return { ...prev, secondsLeft: prev.secondsLeft - 1 };
        }
        const justFinishedFocus = prev.phase === 'focus';
        const cyclesCompleted = justFinishedFocus ? prev.cyclesCompleted + 1 : prev.cyclesCompleted;
        const nextPhase: FocusPhase = justFinishedFocus
          ? cyclesCompleted % CYCLES_BEFORE_LONG_BREAK === 0
            ? 'long_break'
            : 'short_break'
          : 'focus';

        return {
          ...prev,
          phase: nextPhase,
          secondsLeft: prev.durations[nextPhase] * 60,
          cyclesCompleted,
          isRunning: false,
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [state.isRunning]);

  useEffect(() => {
    if (state.secondsLeft === 0 && !state.isRunning && !notifiedRef.current) {
      notifiedRef.current = true;
      const label = state.phase === 'focus' ? 'Hora de uma pausa.' : 'De volta ao foco!';
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('AzureRose — Hiperfoco', { body: label });
      }
    } else if (state.secondsLeft > 0) {
      notifiedRef.current = false;
    }
  }, [state.secondsLeft, state.isRunning, state.phase]);

  const start = useCallback(() => setState((prev) => ({ ...prev, isRunning: true })), []);
  const pause = useCallback(() => setState((prev) => ({ ...prev, isRunning: false })), []);

  const reset = useCallback(() => {
    setState((prev) => ({ ...prev, isRunning: false, secondsLeft: prev.durations[prev.phase] * 60 }));
  }, []);

  const skip = useCallback(() => {
    setState((prev) => {
      const justFinishedFocus = prev.phase === 'focus';
      const cyclesCompleted = justFinishedFocus ? prev.cyclesCompleted + 1 : prev.cyclesCompleted;
      const nextPhase: FocusPhase = justFinishedFocus
        ? cyclesCompleted % CYCLES_BEFORE_LONG_BREAK === 0
          ? 'long_break'
          : 'short_break'
        : 'focus';
      return {
        ...prev,
        phase: nextPhase,
        secondsLeft: prev.durations[nextPhase] * 60,
        cyclesCompleted,
        isRunning: false,
      };
    });
  }, []);

  const setSessionGoal = useCallback((sessionGoal: string) => setState((prev) => ({ ...prev, sessionGoal })), []);

  const setDurations = useCallback((durations: FocusDurations) => {
    setState((prev) => ({
      ...prev,
      durations,
      secondsLeft: prev.isRunning ? prev.secondsLeft : durations[prev.phase] * 60,
    }));
  }, []);

  return {
    phase: state.phase,
    secondsLeft: state.secondsLeft,
    isRunning: state.isRunning,
    cyclesCompleted: state.cyclesCompleted,
    sessionGoal: state.sessionGoal,
    durations: state.durations,
    start,
    pause,
    reset,
    skip,
    setSessionGoal,
    setDurations,
  };
}
