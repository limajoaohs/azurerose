import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { StudyEditor } from './components/editor/StudyEditor';
import { MindmapCanvas } from './components/canvas/MindmapCanvas';
import { DeadlinesTimeline } from './components/calendar/DeadlinesTimeline';
import { SyllabusViewer } from './components/syllabus/SyllabusViewer';
import { AzureCopilotDrawer } from './components/copilot/AzureCopilotDrawer';
import { LoginScreen } from './components/auth/LoginScreen';
import { useFocusTimer } from './hooks/useFocusTimer';

import {
  Subject,
  Note,
  StudyTask,
  Flashcard,
  MindmapResponse,
  NoteSummaryResponse,
  AIStatus,
  User,
} from './types';
import { api, getStoredToken, clearStoredToken } from './services/api';

export function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [activeTab, setActiveTab] = useState('editor');
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | undefined>(undefined);

  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | undefined>(undefined);

  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);

  const [mindmapData, setMindmapData] = useState<MindmapResponse | null>(null);
  const [noteSummary, setNoteSummary] = useState<NoteSummaryResponse | null>(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);

  const focusTimer = useFocusTimer();

  useEffect(() => {
    const validateSession = async () => {
      if (!getStoredToken()) {
        setAuthChecked(true);
        return;
      }
      try {
        const me = await api.auth.me();
        setUser(me);
      } catch (e) {
        clearStoredToken();
      } finally {
        setAuthChecked(true);
      }
    };
    validateSession();
  }, []);

  const handleLogout = () => {
    clearStoredToken();
    setUser(null);
    setSubjects([]);
    setSelectedSubjectId(undefined);
    setNotes([]);
    setSelectedNoteId(undefined);
    setTasks([]);
    setFlashcards([]);
    setMindmapData(null);
    setNoteSummary(null);
    setActiveTab('editor');
  };

  useEffect(() => {
    if (!user) return;

    const initData = async () => {
      try {
        const config = await api.getAIConfig();
        setAiStatus(config);
      } catch (e) {
        console.warn('API de IA offline ou usando fallback.');
      }

      try {
        let subs = await api.getSubjects();
        if (subs.length === 0) {
          const defaultSub = await api.createSubject('Cálculo Diferencial e Integral', 'Limites, Derivadas e Integrais', '#3b82f6');
          subs = [defaultSub];
        }
        setSubjects(subs);

        let initialNotes = await api.getNotes();
        if (initialNotes.length === 0) {
          const sampleNote = await api.createNote({
            title: 'Teorema Fundamental do Cálculo & Derivadas',
            content: `# Fundamentos de Cálculo I\n\n## 1. Definição Formal de Derivada\nA derivada de uma função $f(x)$ em um ponto $x = a$ é a taxa de variação instantânea:\n\n$$f'(a) = \\lim_{h \\to 0} \\frac{f(a + h) - f(a)}{h}$$\n\n## 2. Regra da Cadeia\nPara funções compostas $f(g(x))$, temos:\n$$\\frac{d}{dx}[f(g(x))] = f'(g(x)) \\cdot g'(x)$$\n\n- [ ] Resolver 5 exercícios de fixação\n- [ ] Conectar ao mapa mental de Mecânica Clássica\n- [x] Ler capítulo 2 do Stewart`,
            subject_id: subs[0]?.id,
          });
          initialNotes = [sampleNote];
        }
        setNotes(initialNotes);
        setSelectedNoteId(initialNotes[0]?.id);

        const initialTasks = await api.getTasks();
        if (initialTasks.length === 0) {
          const t1 = await api.createTask({ title: 'Revisar lista 1 de Cálculo', priority: 'high', estimated_minutes: 45 });
          const t2 = await api.createTask({ title: 'Estudar conservação de energia em Física', priority: 'medium', estimated_minutes: 30 });
          setTasks([t1, t2]);
        } else {
          setTasks(initialTasks);
        }

        const cards = await api.getFlashcards();
        setFlashcards(cards);
      } catch (e) {
        console.error('Erro ao carregar dados do workspace:', e);
      }
    };

    initData();
  }, [user]);

  const activeNote = notes.find((n) => n.id === selectedNoteId) || null;

  const activeNoteFlashcards = useMemo(
    () => (activeNote ? flashcards.filter((f) => f.note_id === activeNote.id) : []),
    [flashcards, activeNote?.id]
  );

  const handleCreateSubject = async (name: string, description?: string) => {
    try {
      const newSub = await api.createSubject(name, description);
      setSubjects((prev) => [...prev, newSub]);
      setSelectedSubjectId(newSub.id);
    } catch (e) {
      alert('Erro ao criar disciplina');
    }
  };

  const handleCreateNote = async (title: string, subjectId?: string) => {
    try {
      const newNote = await api.createNote({
        title,
        content: '# Nova Anotação\n\nComece a registrar suas ideias aqui...',
        subject_id: subjectId || subjects[0]?.id,
      });
      setNotes((prev) => [newNote, ...prev]);
      setSelectedNoteId(newNote.id);
      setActiveTab('editor');
    } catch (e) {
      alert('Erro ao criar nota');
    }
  };

  const handleSaveNote = async (id: string, title: string, content: string) => {
    try {
      const updated = await api.updateNote(id, { title, content });
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
    } catch (e) {
      alert('Erro ao salvar nota');
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta anotação?')) return;
    try {
      await api.deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (selectedNoteId === id) {
        setSelectedNoteId(notes.find((n) => n.id !== id)?.id);
      }
    } catch (e) {
      alert('Erro ao excluir nota');
    }
  };

  const handleGenerateMindmap = async (content: string, title: string) => {
    try {
      const res = await api.generateMindmap(content, title);
      setMindmapData(res);
      setActiveTab('canvas');
    } catch (e) {
      alert('Erro ao gerar mapa mental');
    }
  };

  const handleGenerateFlashcards = async (content: string, title: string) => {
    try {
      const res = await api.generateFlashcards(content, title, 4);
      for (const c of res.flashcards) {
        const saved = await api.saveFlashcard({
          front: c.front,
          back: c.back,
          difficulty: c.difficulty,
          tags: c.tags,
          subject_id: activeNote?.subject_id,
          note_id: activeNote?.id,
        });
        setFlashcards((prev) => [...prev, saved]);
      }
    } catch (e) {
      alert('Erro ao gerar flashcards');
    }
  };

  const handleSummarizeNote = async (content: string) => {
    setIsCopilotOpen(true);
    setIsCopilotLoading(true);
    try {
      const res = await api.summarizeNote(content);
      setNoteSummary(res);
    } catch (e) {
      alert('Erro ao resumir anotação');
    } finally {
      setIsCopilotLoading(false);
    }
  };

  const handleReviewCard = async (cardId: string, rating: number) => {
    try {
      await api.reviewFlashcard(cardId, rating);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleTask = async (taskId: string, isCompleted: boolean) => {
    try {
      const updated = await api.toggleTask(taskId, isCompleted);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTask = async (title: string, priority: string, minutes: number) => {
    try {
      const newTask = await api.createTask({
        title,
        priority,
        estimated_minutes: minutes,
        subject_id: selectedSubjectId,
      });
      setTasks((prev) => [newTask, ...prev]);
    } catch (e) {
      alert('Erro ao criar tarefa');
    }
  };

  const handleImportTasksFromSyllabus = async (
    tasksToImport: { title: string; priority: string; estimated_minutes: number }[]
  ) => {
    for (const t of tasksToImport) {
      const created = await api.createTask({
        title: t.title,
        priority: t.priority,
        estimated_minutes: t.estimated_minutes,
        subject_id: selectedSubjectId,
      });
      setTasks((prev) => [...prev, created]);
    }
    setActiveTab('calendar');
  };

  if (!authChecked) {
    return <div className="min-h-screen bg-[#0b101b]" />;
  }

  if (!user) {
    return <LoginScreen onAuthenticated={setUser} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0b101b] text-slate-100 selection:bg-blue-500/30 selection:text-blue-200">
      <Navbar
        aiStatus={aiStatus}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
        focusSecondsLeft={focusTimer.secondsLeft}
        isFocusRunning={focusTimer.isRunning}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          subjects={subjects}
          notes={notes}
          selectedSubjectId={selectedSubjectId}
          setSelectedSubjectId={setSelectedSubjectId}
          selectedNoteId={selectedNoteId}
          setSelectedNoteId={setSelectedNoteId}
          onCreateSubject={handleCreateSubject}
          onCreateNote={handleCreateNote}
          onDeleteNote={handleDeleteNote}
        />

        <main className="flex-1 flex overflow-hidden">
          {activeTab === 'editor' && (
            <StudyEditor
              note={activeNote}
              noteFlashcards={activeNoteFlashcards}
              onSaveNote={handleSaveNote}
              onGenerateMindmap={handleGenerateMindmap}
              onGenerateFlashcards={handleGenerateFlashcards}
              onSummarizeNote={handleSummarizeNote}
              onReviewCard={handleReviewCard}
              focusTimer={focusTimer}
            />
          )}

          {activeTab === 'canvas' && (
            <MindmapCanvas mindmapData={mindmapData} />
          )}

          {activeTab === 'calendar' && (
            <DeadlinesTimeline
              tasks={tasks}
              onToggleTask={handleToggleTask}
              onCreateTask={handleCreateTask}
            />
          )}

          {activeTab === 'syllabus' && (
            <SyllabusViewer onImportTasks={handleImportTasksFromSyllabus} />
          )}
        </main>

        <AzureCopilotDrawer
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
          summary={noteSummary}
          isLoading={isCopilotLoading}
          onAddTasksToTimeline={handleImportTasksFromSyllabus}
        />
      </div>
    </div>
  );
}
export default App;
