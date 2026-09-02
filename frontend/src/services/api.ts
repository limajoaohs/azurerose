import {
  Subject,
  Note,
  StudyTask,
  Flashcard,
  MindmapResponse,
  SyllabusParseResponse,
  NoteSummaryResponse,
  AIStatus,
  User,
  AuthResponse,
} from '../types';

const API_BASE = '/api/v1';
const TOKEN_KEY = 'azurerose_token';

export const getStoredToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setStoredToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearStoredToken = () => localStorage.removeItem(TOKEN_KEY);

const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getStoredToken();
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(url, { ...options, headers });
};

export const api = {
  auth: {
    register: async (email: string, password: string, name?: string): Promise<AuthResponse> => {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Erro ao criar conta' }));
        throw new Error(err.detail || 'Erro ao criar conta');
      }
      return res.json();
    },

    login: async (email: string, password: string): Promise<AuthResponse> => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'E-mail ou senha incorretos' }));
        throw new Error(err.detail || 'E-mail ou senha incorretos');
      }
      return res.json();
    },

    me: async (): Promise<User> => {
      const res = await authFetch(`${API_BASE}/auth/me`);
      if (!res.ok) throw new Error('Sessão inválida');
      return res.json();
    },
  },

  getAIConfig: async (): Promise<AIStatus> => {
    const res = await authFetch(`${API_BASE}/ai/config`);
    if (!res.ok) throw new Error('Falha ao obter status da IA');
    return res.json();
  },

  parseSyllabusPdf: async (file: File, courseHint?: string): Promise<SyllabusParseResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    if (courseHint) formData.append('course_hint', courseHint);

    const res = await authFetch(`${API_BASE}/ai/syllabus/upload-pdf`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Erro no servidor' }));
      throw new Error(err.detail || 'Erro ao processar PDF da ementa');
    }
    return res.json();
  },

  parseSyllabusText: async (content: string, courseHint?: string): Promise<SyllabusParseResponse> => {
    const formData = new FormData();
    formData.append('content', content);
    if (courseHint) formData.append('course_hint', courseHint);

    const res = await authFetch(`${API_BASE}/ai/syllabus/parse-text`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Erro ao processar texto da ementa');
    return res.json();
  },

  generateMindmap: async (content: string, title?: string): Promise<MindmapResponse> => {
    const res = await authFetch(`${API_BASE}/ai/mindmap/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, title }),
    });
    if (!res.ok) throw new Error('Erro ao gerar mapa mental com IA');
    return res.json();
  },

  generateFlashcards: async (content: string, subject?: string, quantity: number = 5): Promise<{ flashcards: any[] }> => {
    const res = await authFetch(`${API_BASE}/ai/flashcards/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, subject, quantity }),
    });
    if (!res.ok) throw new Error('Erro ao gerar flashcards');
    return res.json();
  },

  summarizeNote: async (content: string): Promise<NoteSummaryResponse> => {
    const formData = new FormData();
    formData.append('content', content);

    const res = await authFetch(`${API_BASE}/ai/notes/summarize`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Erro ao resumir anotação');
    return res.json();
  },

  getSubjects: async (): Promise<Subject[]> => {
    const res = await authFetch(`${API_BASE}/workspace/subjects`);
    if (!res.ok) return [];
    return res.json();
  },

  createSubject: async (name: string, description?: string, color: string = '#3b82f6'): Promise<Subject> => {
    const res = await authFetch(`${API_BASE}/workspace/subjects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, color }),
    });
    if (!res.ok) throw new Error('Erro ao criar disciplina');
    return res.json();
  },

  getNotes: async (subjectId?: string): Promise<Note[]> => {
    const url = subjectId ? `${API_BASE}/workspace/notes?subject_id=${subjectId}` : `${API_BASE}/workspace/notes`;
    const res = await authFetch(url);
    if (!res.ok) return [];
    return res.json();
  },

  createNote: async (payload: { title: string; content: string; subject_id?: string }): Promise<Note> => {
    const res = await authFetch(`${API_BASE}/workspace/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Erro ao criar nota');
    return res.json();
  },

  updateNote: async (id: string, payload: Partial<Note>): Promise<Note> => {
    const res = await authFetch(`${API_BASE}/workspace/notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Erro ao salvar nota');
    return res.json();
  },

  deleteNote: async (id: string): Promise<void> => {
    await authFetch(`${API_BASE}/workspace/notes/${id}`, { method: 'DELETE' });
  },

  getTasks: async (subjectId?: string): Promise<StudyTask[]> => {
    const url = subjectId ? `${API_BASE}/calendar/tasks?subject_id=${subjectId}` : `${API_BASE}/calendar/tasks`;
    const res = await authFetch(url);
    if (!res.ok) return [];
    return res.json();
  },

  createTask: async (payload: { title: string; priority?: string; estimated_minutes?: number; subject_id?: string }): Promise<StudyTask> => {
    const res = await authFetch(`${API_BASE}/calendar/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Erro ao criar tarefa');
    return res.json();
  },

  toggleTask: async (id: string, is_completed: boolean): Promise<StudyTask> => {
    const res = await authFetch(`${API_BASE}/calendar/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_completed }),
    });
    return res.json();
  },

  getFlashcards: async (subjectId?: string, noteId?: string): Promise<Flashcard[]> => {
    const params = new URLSearchParams();
    if (subjectId) params.set('subject_id', subjectId);
    if (noteId) params.set('note_id', noteId);
    const qs = params.toString();
    const res = await authFetch(`${API_BASE}/flashcards/cards${qs ? `?${qs}` : ''}`);
    if (!res.ok) return [];
    return res.json();
  },

  saveFlashcard: async (card: { front: string; back: string; subject_id?: string; note_id?: string; difficulty?: string; tags?: string[] }): Promise<Flashcard> => {
    const res = await authFetch(`${API_BASE}/flashcards/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(card),
    });
    return res.json();
  },

  reviewFlashcard: async (cardId: string, rating: number): Promise<Flashcard> => {
    const res = await authFetch(`${API_BASE}/flashcards/cards/${cardId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating }),
    });
    return res.json();
  },
};
