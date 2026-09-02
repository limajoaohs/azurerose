import React, { useState } from 'react';
import { Calendar, Clock, CheckCircle2, Circle, AlertCircle, Plus, Sparkles } from 'lucide-react';
import { StudyTask } from '../../types';

interface DeadlinesTimelineProps {
  tasks: StudyTask[];
  onToggleTask: (taskId: string, isCompleted: boolean) => void;
  onCreateTask: (title: string, priority: string, minutes: number) => void;
}

export const DeadlinesTimeline: React.FC<DeadlinesTimelineProps> = ({
  tasks,
  onToggleTask,
  onCreateTask,
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [minutes, setMinutes] = useState(30);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onCreateTask(newTaskTitle.trim(), priority, Number(minutes));
    setNewTaskTitle('');
    setShowAddModal(false);
  };

  const completedCount = tasks.filter((t) => t.is_completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const upcomingExams = [
    { title: 'Prova P1: Física Clássica', daysLeft: 6, weight: '30%', date: 'Próxima Terça' },
    { title: 'Entrega Trabalho: Bioquímica', daysLeft: 12, weight: '20%', date: 'Em 2 semanas' },
    { title: 'Exame de Cálculo Diferencial', daysLeft: 24, weight: '50%', date: 'Mês que vem' },
  ];

  return (
    <div className="flex-1 p-6 bg-[#080d1a] h-[calc(100vh-3.5rem)] overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="text-blue-400" size={20} />
              Cronograma de Prazos & Exames
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Acompanhe contagens regressivas e micro-tarefas diárias de estudo.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all"
          >
            <Plus size={14} />
            Nova Tarefa
          </button>
        </div>

        {showAddModal && (
          <form onSubmit={handleAddTask} className="p-4 rounded-xl bg-slate-900 border border-slate-700 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-slate-200">Criar Nova Meta de Estudo</h3>
            <input
              type="text"
              placeholder="Ex: Resolver 5 exercícios da lista 2 de Cálculo..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full text-xs bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200 outline-none focus:border-blue-500"
              autoFocus
            />
            <div className="flex items-center gap-3">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="text-xs bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
              >
                <option value="low">Prioridade Baixa</option>
                <option value="medium">Prioridade Média</option>
                <option value="high">Prioridade Alta</option>
              </select>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>Tempo:</span>
                <input
                  type="number"
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                  className="w-16 text-xs bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-center"
                />
                <span>min</span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-blue-600 text-white text-xs font-semibold"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {upcomingExams.map((exam, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md relative overflow-hidden group hover:border-blue-500/40 transition-all shadow-lg"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-all" />
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-slate-400">{exam.date}</span>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold text-[10px]">
                  Peso {exam.weight}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-100">{exam.title}</h3>
              <div className="mt-4 flex items-center gap-2">
                <div className="text-xl font-extrabold text-blue-400 font-mono">
                  {exam.daysLeft}
                </div>
                <span className="text-xs text-slate-400 font-medium">dias restantes</span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-200">Plano de Estudos Diário</h2>
              <span className="text-xs text-slate-400">
                {completedCount} de {tasks.length} concluídas ({progressPercent}%)
              </span>
            </div>

            <div className="w-36 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-sky-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            {tasks.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                Nenhuma tarefa ativa. Use o botão "+ Nova Tarefa" ou a ferramenta de Ementa para importar o cronograma!
              </p>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onToggleTask(task.id, !task.is_completed)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    task.is_completed
                      ? 'bg-slate-950/40 border-slate-800/40 text-slate-500'
                      : 'bg-slate-850/60 border-slate-800 text-slate-200 hover:border-blue-500/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {task.is_completed ? (
                      <CheckCircle2 size={16} className="text-sky-400" />
                    ) : (
                      <Circle size={16} className="text-slate-500" />
                    )}
                    <span className={`text-xs font-medium ${task.is_completed ? 'line-through' : ''}`}>
                      {task.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> {task.estimated_minutes} min
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                        task.priority === 'high'
                          ? 'bg-white/90 text-slate-900'
                          : task.priority === 'medium'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
