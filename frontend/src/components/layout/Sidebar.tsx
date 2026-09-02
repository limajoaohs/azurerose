import React, { useState } from 'react';
import { BookOpen, Plus, Folder, FileText, Star, Trash2, Layers } from 'lucide-react';
import { Subject, Note } from '../../types';

interface SidebarProps {
  subjects: Subject[];
  notes: Note[];
  selectedSubjectId?: string;
  setSelectedSubjectId: (id?: string) => void;
  selectedNoteId?: string;
  setSelectedNoteId: (id?: string) => void;
  onCreateSubject: (name: string, description?: string) => void;
  onCreateNote: (title: string, subjectId?: string) => void;
  onDeleteNote: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  subjects,
  notes,
  selectedSubjectId,
  setSelectedSubjectId,
  selectedNoteId,
  setSelectedNoteId,
  onCreateSubject,
  onCreateNote,
  onDeleteNote,
}) => {
  const [newSubjectName, setNewSubjectName] = useState('');
  const [showSubjectInput, setShowSubjectInput] = useState(false);

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    onCreateSubject(newSubjectName.trim());
    setNewSubjectName('');
    setShowSubjectInput(false);
  };

  const filteredNotes = selectedSubjectId
    ? notes.filter((n) => n.subject_id === selectedSubjectId)
    : notes;

  return (
    <aside className="w-64 border-r border-slate-800 bg-[#0c1222] flex flex-col h-[calc(100vh-3.5rem)] select-none">
      <div className="p-3 border-b border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
            <Layers size={13} className="text-blue-400" /> Disciplinas & Cadernos
          </span>
          <button
            onClick={() => setShowSubjectInput(true)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Adicionar Disciplina"
          >
            <Plus size={14} />
          </button>
        </div>

        {showSubjectInput && (
          <form onSubmit={handleAddSubject} className="mb-2">
            <input
              type="text"
              placeholder="Ex: Cálculo I, Bioquímica..."
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              autoFocus
              className="w-full text-xs bg-slate-900 border border-blue-500/50 rounded px-2 py-1 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </form>
        )}

        <div className="space-y-0.5 max-h-36 overflow-y-auto">
          <button
            onClick={() => setSelectedSubjectId(undefined)}
            className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-2 transition-colors ${
              selectedSubjectId === undefined
                ? 'bg-blue-600/20 text-blue-300 font-medium border border-blue-500/30'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <BookOpen size={13} />
            <span>Todas as Matérias</span>
            <span className="ml-auto text-[10px] text-slate-500">{notes.length}</span>
          </button>

          {subjects.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubjectId(sub.id)}
              className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-2 transition-colors ${
                selectedSubjectId === sub.id
                  ? 'bg-blue-600/20 text-blue-300 font-medium border border-blue-500/30'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: sub.color || '#3b82f6' }}
              />
              <span className="truncate">{sub.name}</span>
              <span className="ml-auto text-[10px] text-slate-500">
                {notes.filter((n) => n.subject_id === sub.id).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 pb-2 flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          Anotações ({filteredNotes.length})
        </span>
        <button
          onClick={() => onCreateNote('Nova Nota de Estudo', selectedSubjectId)}
          className="flex items-center gap-1 text-[11px] font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30 transition-all"
        >
          <Plus size={12} />
          Nova Nota
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-8 px-4 text-xs text-slate-500">
            Nenhuma anotação encontrada. Clique em <b>+ Nova Nota</b> para começar!
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => setSelectedNoteId(note.id)}
              className={`group px-2.5 py-2 rounded-lg text-xs cursor-pointer flex items-center justify-between transition-all ${
                selectedNoteId === note.id
                  ? 'bg-blue-600 text-white font-medium shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 truncate pr-2">
                <FileText
                  size={14}
                  className={selectedNoteId === note.id ? 'text-white' : 'text-slate-400'}
                />
                <span className="truncate">{note.title || 'Sem título'}</span>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNote(note.id);
                  }}
                  className="p-1 hover:text-white transition-colors"
                  title="Excluir nota"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
};
