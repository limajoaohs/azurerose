import React, { useState } from 'react';
import { Check, X, RotateCw, Sparkles, Brain } from 'lucide-react';
import { InlineMath, BlockMath } from 'react-katex';
import { Flashcard } from '../../types';

interface FlashcardDeckProps {
  cards: Flashcard[];
  onReviewCard: (cardId: string, rating: number) => void;
  onGenerateMore: () => void;
  variant?: 'page' | 'panel';
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ cards, onReviewCard, onGenerateMore, variant = 'page' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const isPanel = variant === 'panel';

  const currentCard = cards[currentIndex];

  const handleRating = (rating: number) => {
    if (!currentCard) return;
    onReviewCard(currentCard.id, rating);
    setIsFlipped(false);
    setCompletedCount((prev) => prev + 1);

    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const renderMathOrText = (text: string) => {
    if (text.includes('$$')) {
      const parts = text.split('$$');
      return (
        <div>
          {parts[0] && <p className="mb-2">{parts[0]}</p>}
          {parts[1] && <BlockMath math={parts[1]} />}
          {parts[2] && <p className="mt-2">{parts[2]}</p>}
        </div>
      );
    }
    return <p className={`leading-relaxed text-slate-100 font-medium ${isPanel ? 'text-sm' : 'text-base'}`}>{text}</p>;
  };

  if (!cards || cards.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center text-slate-400 ${
          isPanel ? 'p-6' : 'flex-1 p-8 bg-[#080d1a] h-[calc(100vh-3.5rem)]'
        }`}
      >
        <div className={`rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3 ${isPanel ? 'w-10 h-10' : 'w-14 h-14'}`}>
          <Brain className="text-blue-400" size={isPanel ? 20 : 28} />
        </div>
        <h3 className={`font-bold text-slate-200 text-center ${isPanel ? 'text-xs' : 'text-base'}`}>
          {isPanel ? 'Nenhum flashcard nesta nota' : 'Nenhum Flashcard para revisar hoje!'}
        </h3>
        <p className={`text-slate-500 text-center mb-4 ${isPanel ? 'text-[11px] mt-1' : 'text-xs mt-1 max-w-sm'}`}>
          {isPanel
            ? 'Gere flashcards a partir do conteúdo desta nota.'
            : 'Crie flashcards a partir das suas anotações para ativar o algoritmo de repetição espaçada (SRS).'}
        </p>
        <button
          onClick={onGenerateMore}
          className={`rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all ${
            isPanel ? 'px-3 py-1.5 text-[11px]' : 'px-4 py-2 text-xs'
          }`}
        >
          <Sparkles size={isPanel ? 12 : 14} />
          {isPanel ? 'Gerar Flashcards' : 'Gerar Flashcards de Demonstração'}
        </button>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center select-none ${
        isPanel ? 'p-4' : 'flex-1 justify-center p-6 bg-[#080d1a] h-[calc(100vh-3.5rem)]'
      }`}
    >
      <div className={`w-full flex items-center justify-between text-slate-400 ${isPanel ? 'text-[10px] mb-3' : 'max-w-lg text-xs mb-4'}`}>
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-200">{currentIndex + 1}/{cards.length}</span>
          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 uppercase font-semibold">
            {currentCard.difficulty}
          </span>
        </div>
        <span>Revisados: <b className="text-sky-400">{completedCount}</b></span>
      </div>

      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className={`w-full bg-slate-900/90 border border-slate-800 hover:border-slate-700 backdrop-blur-xl shadow-2xl flex flex-col justify-between cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 ${
          isPanel ? 'rounded-xl p-4 min-h-[160px]' : 'max-w-lg rounded-2xl p-8 min-h-[300px]'
        }`}
      >
        <div>
          <div className={`flex items-center justify-between text-slate-500 border-b border-slate-800 ${isPanel ? 'text-[10px] mb-2 pb-1.5' : 'text-xs mb-4 pb-2'}`}>
            <span className="font-semibold uppercase tracking-wider text-blue-400">
              {isFlipped ? 'Resposta' : 'Pergunta'}
            </span>
            <span className="flex items-center gap-1">
              <RotateCw size={isPanel ? 10 : 11} /> {isPanel ? 'Virar' : 'Clique para virar'}
            </span>
          </div>

          <div className={isPanel ? 'py-2 text-center' : 'py-4 text-center'}>
            {isFlipped ? renderMathOrText(currentCard.back) : renderMathOrText(currentCard.front)}
          </div>
        </div>

        {currentCard.tags && currentCard.tags.length > 0 && (
          <div className={`flex flex-wrap gap-1.5 border-t border-slate-800/60 ${isPanel ? 'pt-2' : 'pt-4'}`}>
            {currentCard.tags.map((tag, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className={`w-full flex items-center justify-between gap-2 ${isPanel ? 'mt-3' : 'max-w-lg mt-6 gap-3'}`}>
        <button
          onClick={() => handleRating(1)}
          className={`flex-1 rounded-xl bg-slate-950/60 hover:bg-slate-900/80 border border-slate-600/40 text-slate-300 font-bold flex items-center justify-center gap-1 transition-all shadow-sm ${
            isPanel ? 'py-2 px-1 text-[10px]' : 'py-2.5 px-3 text-xs gap-1.5'
          }`}
        >
          <X size={isPanel ? 12 : 14} />
          {isPanel ? '1d' : 'Errei (1d)'}
        </button>

        <button
          onClick={() => handleRating(3)}
          className={`flex-1 rounded-xl bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/30 text-blue-300 font-bold flex items-center justify-center gap-1 transition-all shadow-sm ${
            isPanel ? 'py-2 px-1 text-[10px]' : 'py-2.5 px-3 text-xs gap-1.5'
          }`}
        >
          <RotateCw size={isPanel ? 12 : 14} />
          {isPanel ? '3d' : 'Bom (3d)'}
        </button>

        <button
          onClick={() => handleRating(5)}
          className={`flex-1 rounded-xl bg-sky-950/40 hover:bg-sky-900/60 border border-sky-500/30 text-sky-300 font-bold flex items-center justify-center gap-1 transition-all shadow-sm ${
            isPanel ? 'py-2 px-1 text-[10px]' : 'py-2.5 px-3 text-xs gap-1.5'
          }`}
        >
          <Check size={isPanel ? 12 : 14} />
          {isPanel ? '7d' : 'Fácil (7d)'}
        </button>
      </div>
    </div>
  );
};
