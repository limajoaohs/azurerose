import React, { useState } from 'react';
import { Upload, FileText, Sparkles, CheckCircle, Calendar, Award, BookOpen, Clock, ArrowRight } from 'lucide-react';
import { SyllabusParseResponse } from '../../types';
import { api } from '../../services/api';

interface SyllabusViewerProps {
  onImportTasks: (tasks: { title: string; priority: string; estimated_minutes: number }[]) => void;
}

export const SyllabusViewer: React.FC<SyllabusViewerProps> = ({ onImportTasks }) => {
  const [syllabusData, setSyllabusData] = useState<SyllabusParseResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [inputMode, setInputMode] = useState<'upload' | 'text'>('upload');
  const [isImported, setIsImported] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    processPdf(file);
  };

  const processPdf = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setIsImported(false);
    try {
      const data = await api.parseSyllabusPdf(file);
      setSyllabusData(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao processar PDF da ementa.');
    } finally {
      setIsLoading(false);
    }
  };

  const processText = async () => {
    if (!rawText.trim()) return;
    setIsLoading(true);
    setError(null);
    setIsImported(false);
    try {
      const data = await api.parseSyllabusText(rawText);
      setSyllabusData(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao processar texto.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportToCalendar = () => {
    if (!syllabusData) return;
    const tasksToImport = syllabusData.weekly_schedule.map((w) => ({
      title: `Semana ${w.week_number}: ${w.theme} (${w.topics.slice(0, 2).join(', ')})`,
      priority: w.deliverables_or_exams ? 'high' : 'medium',
      estimated_minutes: w.recommended_study_hours * 60,
    }));
    onImportTasks(tasksToImport);
    setIsImported(true);
  };

  return (
    <div className="flex-1 p-6 bg-[#080d1a] h-[calc(100vh-3.5rem)] overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/60 to-slate-950/60 border border-blue-500/20 backdrop-blur-xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[11px] font-bold uppercase tracking-wider mb-2">
              <Sparkles size={12} /> O Teste da Ementa Difícil
            </div>
            <h1 className="text-xl font-extrabold text-slate-100">
              Ingestão Inteligente de Ementas & Planos Semestrais
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Faça o upload do PDF da ementa da sua matéria ou cole o programa do curso. O AzureRose constrói o cronograma semanal, marcos de provas e tarefas diárias automaticamente.
            </p>
          </div>
        </div>

        {!syllabusData && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setInputMode('upload')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  inputMode === 'upload' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Upload de PDF
              </button>
              <button
                onClick={() => setInputMode('text')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  inputMode === 'text' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Colar Texto da Ementa
              </button>
            </div>

            {inputMode === 'upload' ? (
              <label className="border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-950/30 group">
                <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Upload size={20} className="text-blue-400" />
                </div>
                <span className="text-sm font-semibold text-slate-200">
                  {uploadedFile ? uploadedFile.name : 'Clique para selecionar o PDF da Ementa'}
                </span>
                <span className="text-xs text-slate-500 mt-1">Formatos aceitos: PDF universitário / programa de disciplina</span>
              </label>
            ) : (
              <div className="space-y-3">
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Cole aqui o texto da ementa, ementário da faculdade ou tópicos do semestre..."
                  className="w-full h-40 p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono outline-none focus:border-blue-500"
                />
                <button
                  onClick={processText}
                  disabled={isLoading || !rawText.trim()}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2"
                >
                  <Sparkles size={14} /> Analisar Ementa com IA
                </button>
              </div>
            )}

            {isLoading && (
              <div className="mt-6 text-center py-6 text-xs text-blue-400 flex items-center justify-center gap-2">
                <Sparkles size={16} className="animate-spin" />
                <span>Analisando ementa e montando cronograma semestral...</span>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-slate-950/70 border border-white/15 text-white text-xs">
                {error}
              </div>
            )}
          </div>
        )}

        {syllabusData && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-100">{syllabusData.course_name}</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Docente: {syllabusData.professor || 'Não especificado'} • Duração:{' '}
                  <b className="text-blue-300">{syllabusData.semester_weeks} semanas</b>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSyllabusData(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
                >
                  Subir Outra Ementa
                </button>
                <button
                  onClick={handleImportToCalendar}
                  disabled={isImported}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all ${
                    isImported
                      ? 'bg-blue-600 text-white'
                      : 'bg-gradient-to-r from-blue-600 to-slate-950 hover:from-blue-500 hover:to-slate-900 text-white'
                  }`}
                >
                  <CheckCircle size={14} />
                  {isImported ? 'Importado com Sucesso!' : 'Importar Cronograma para Tarefas'}
                </button>
              </div>
            </div>

            {syllabusData.exams_and_deadlines && syllabusData.exams_and_deadlines.length > 0 && (
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Award size={14} className="text-white" /> Datas de Avaliações Identificadas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {syllabusData.exams_and_deadlines.map((exam, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-white/15">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-white">{exam.title}</span>
                        {exam.weight && (
                          <span className="text-[10px] bg-white/15 text-white px-1.5 py-0.5 rounded font-bold">
                            {exam.weight}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Semana Prevista: <b>{exam.estimated_week || 'A definir'}</b>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Calendar size={14} className="text-blue-400" /> Cronograma Semanal de Estudos
              </h3>
              <div className="space-y-3">
                {syllabusData.weekly_schedule.map((week) => (
                  <div
                    key={week.week_number}
                    className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 hover:border-blue-500/30 transition-all flex items-start justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                          Semana {week.week_number}
                        </span>
                        <h4 className="text-xs font-bold text-slate-200">{week.theme}</h4>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {week.topics.map((t, idx) => (
                          <span key={idx} className="text-[10px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded">
                            • {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock size={10} /> {week.recommended_study_hours}h sugeridas
                      </span>
                      {week.deliverables_or_exams && (
                        <span className="mt-1 text-[10px] px-2 py-0.5 rounded bg-white/15 text-white font-bold">
                          {week.deliverables_or_exams}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
