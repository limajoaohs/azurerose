import React, { useState, useEffect } from 'react';
import { Sparkles, Eye, BookMarked, CheckSquare, Save, Variable, Timer, X } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { Note, Flashcard } from '../../types';
import { FlashcardDeck } from '../srs/FlashcardDeck';
import { HiperfocoMode } from '../focus/HiperfocoMode';
import { useFocusTimer } from '../../hooks/useFocusTimer';

interface StudyEditorProps {
  note: Note | null;
  noteFlashcards: Flashcard[];
  onSaveNote: (id: string, title: string, content: string) => void;
  onGenerateMindmap: (content: string, title: string) => void;
  onGenerateFlashcards: (content: string, title: string) => void;
  onSummarizeNote: (content: string) => void;
  onReviewCard: (cardId: string, rating: number) => void;
  focusTimer: ReturnType<typeof useFocusTimer>;
}

type SidePanel = 'flashcards' | 'hiperfoco' | null;

export const StudyEditor: React.FC<StudyEditorProps> = ({
  note,
  noteFlashcards,
  onSaveNote,
  onGenerateMindmap,
  onGenerateFlashcards,
  onSummarizeNote,
  onReviewCard,
  focusTimer,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [isSaving, setIsSaving] = useState(false);
  const [sidePanel, setSidePanel] = useState<SidePanel>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    } else {
      setTitle('');
      setContent('');
    }
    setSidePanel(null);
  }, [note?.id]);

  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
          <BookMarked className="text-blue-400" size={24} />
        </div>
        <h3 className="text-sm font-semibold text-slate-300">Nenhuma nota selecionada</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm text-center">
          Selecione uma anotação na barra lateral ou crie uma nova para começar seus estudos.
        </p>
      </div>
    );
  }

  const handleSave = () => {
    setIsSaving(true);
    onSaveNote(note.id, title, content);
    setTimeout(() => setIsSaving(false), 500);
  };

  const handleGenerateFlashcards = () => {
    setSidePanel('flashcards');
    onGenerateFlashcards(content, title);
  };

  const togglePanel = (panel: SidePanel) => {
    setSidePanel((prev) => {
      const next = prev === panel ? null : panel;
      if (next === 'hiperfoco' && !focusTimer.sessionGoal && title) {
        focusTimer.setSessionGoal(title);
      }
      return next;
    });
  };

  const renderFormattedContent = (text: string) => {
    if (!text) return <p className="text-slate-500 italic text-sm">Comece a digitar sua anotação ou cole um texto de aula...</p>;

    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('# ')) {
        return <h1 key={idx} className="text-xl font-bold text-slate-100 mt-4 mb-2 pb-1 border-b border-slate-800">{line.replace('# ', '')}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} className="text-lg font-semibold text-blue-300 mt-3 mb-1.5">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-sm font-semibold text-blue-200 mt-2 mb-1">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('$$') && line.endsWith('$$') && line.length > 4) {
        const mathExpr = line.substring(2, line.length - 2);
        return (
          <div key={idx} className="my-3 p-3 rounded-lg bg-blue-950/30 border border-blue-500/20 text-center overflow-x-auto">
            <BlockMath math={mathExpr} />
          </div>
        );
      }
      if (line.startsWith('- [ ] ') || line.startsWith('- [x] ')) {
        const checked = line.startsWith('- [x] ');
        return (
          <div key={idx} className="flex items-center gap-2 text-sm text-slate-300 my-1">
            <input type="checkbox" checked={checked} readOnly className="rounded bg-slate-800 border-slate-700 text-blue-500" />
            <span className={checked ? 'line-through text-slate-500' : ''}>{line.replace(/- \[[ x]\] /, '')}</span>
          </div>
        );
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={idx} className="text-sm text-slate-300 ml-4 list-disc my-0.5">
            {renderInlineMath(line.replace(/^[-*]\s+/, ''))}
          </li>
        );
      }
      return (
        <p key={idx} className="text-sm text-slate-300 leading-relaxed my-1 min-h-[1.2rem]">
          {renderInlineMath(line)}
        </p>
      );
    });
  };

  const renderInlineMath = (str: string) => {
    const parts = str.split(/(\$[^$]+\$)/g);
    return parts.map((part, i) => {
      if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
        const expr = part.substring(1, part.length - 1);
        try {
          return <InlineMath key={i} math={expr} />;
        } catch {
          return <span key={i} className="font-mono text-blue-300">{part}</span>;
        }
      }
      return part;
    });
  };

  const insertFormulaTemplate = () => {
    const template = `\n$$f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$$\n`;
    setContent((prev) => prev + template);
  };

  return (
    <div className="flex-1 flex h-[calc(100vh-3.5rem)] bg-[#0b101b] overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-3 border-b border-slate-800/80 bg-slate-900/50 flex items-center justify-between gap-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título da anotação..."
            className="flex-1 text-base font-bold bg-transparent text-slate-100 border-none outline-none focus:ring-0 placeholder:text-slate-600"
          />

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-xs">
              <button
                onClick={() => setViewMode('edit')}
                className={`px-2.5 py-1 rounded ${viewMode === 'edit' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Código
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-2.5 py-1 rounded ${viewMode === 'split' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Split
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`px-2.5 py-1 rounded ${viewMode === 'preview' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Preview
              </button>
            </div>

            <button
              onClick={insertFormulaTemplate}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 border border-slate-700"
              title="Inserir Fórmula KaTeX"
            >
              <Variable size={13} className="text-blue-400" />
              <span>LaTeX</span>
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Save size={13} />
              <span>{isSaving ? 'Salvo!' : 'Salvar'}</span>
            </button>
          </div>
        </div>

        <div className="px-4 py-2 border-b border-slate-800/60 bg-blue-950/20 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-blue-300/80 flex items-center gap-1.5">
            <Sparkles size={13} className="text-blue-400" /> Ações Rápidas de IA:
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onGenerateMindmap(content, title)}
              className="text-xs px-2.5 py-1 rounded-md bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 flex items-center gap-1.5 transition-all"
            >
              <Eye size={12} />
              Ver no Mapa ("O Olho")
            </button>

            <button
              onClick={handleGenerateFlashcards}
              className="text-xs px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white border border-white/30 flex items-center gap-1.5 transition-all"
            >
              <BookMarked size={12} />
              Gerar Flashcards (SRS)
            </button>

            <button
              onClick={() => onSummarizeNote(content)}
              className="text-xs px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <CheckSquare size={12} />
              Resumo & Tarefas
            </button>

            <div className="w-px h-4 bg-slate-700 mx-0.5" />

            <button
              onClick={() => togglePanel('flashcards')}
              className={`text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-all ${
                sidePanel === 'flashcards'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
              title="Revisar flashcards desta nota"
            >
              <BookMarked size={12} />
              {noteFlashcards.length > 0 ? `Revisar (${noteFlashcards.length})` : 'Flashcards'}
            </button>

            <button
              onClick={() => togglePanel('hiperfoco')}
              className={`text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-all ${
                sidePanel === 'hiperfoco'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
              title="Sessão de foco para esta nota"
            >
              <Timer size={12} className={focusTimer.isRunning ? 'text-sky-400 animate-pulse' : ''} />
              Hiperfoco
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {(viewMode === 'split' || viewMode === 'edit') && (
            <div className={`h-full flex flex-col ${viewMode === 'split' ? 'w-1/2 border-r border-slate-800' : 'w-full'}`}>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escreva com suporte a Markdown e KaTeX...&#10;Exemplo de fórmula: $$E = mc^2$$ ou $f(x) = \sin(x)$"
                className="w-full flex-1 p-5 bg-[#0a0f1d] text-slate-200 font-mono text-sm leading-relaxed outline-none resize-none placeholder:text-slate-700"
              />
            </div>
          )}

          {(viewMode === 'split' || viewMode === 'preview') && (
            <div className={`h-full overflow-y-auto p-6 bg-[#0c1222] ${viewMode === 'split' ? 'w-1/2' : 'w-full'}`}>
              <div className="max-w-2xl mx-auto">
                {renderFormattedContent(content)}
              </div>
            </div>
          )}
        </div>
      </div>

      {sidePanel && (
        <div className="w-80 shrink-0 border-l border-slate-800 bg-[#0c1222] overflow-y-auto">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-800 sticky top-0 bg-[#0c1222] z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {sidePanel === 'flashcards' ? 'Flashcards da nota' : 'Hiperfoco'}
            </span>
            <button
              onClick={() => setSidePanel(null)}
              className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {sidePanel === 'flashcards' && (
            <FlashcardDeck
              key={note.id}
              cards={noteFlashcards}
              onReviewCard={onReviewCard}
              onGenerateMore={handleGenerateFlashcards}
              variant="panel"
            />
          )}

          {sidePanel === 'hiperfoco' && <HiperfocoMode {...focusTimer} variant="panel" />}
        </div>
      )}
    </div>
  );
};
