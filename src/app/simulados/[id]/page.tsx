'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { Navbar } from '../../components/ui/Navbar';
import { Clock, Save, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

interface Alternative {
  id: string;
  letter: string;
  text: string;
}

interface Question {
  id: string;
  statement: string;
  source?: string;
  difficulty: string;
  alternatives: Alternative[];
}

interface SimulationData {
  id: string;
  title: string;
  durationMinutes: number;
  questions: Question[];
  savedAnswers?: Record<string, string>; // questionId -> alternativeId
}

export default function SimulationPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const simulationId = params?.id as string;

  const [simulation, setSimulation] = useState<SimulationData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // questionId -> alternativeId
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Cronômetro Regressivo (em segundos)
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Carrega os dados do simulado
  const loadSimulation = useCallback(async () => {
    if (!simulationId) return;
    setIsLoading(true);

    try {
      const res = await fetchApi(`/simulations/${simulationId}/start`);
      if (!res.ok) throw new Error('Falha ao carregar simulado.');

      const data: SimulationData = await res.json();
      setSimulation(data);
      if (data.savedAnswers) {
        setAnswers(data.savedAnswers);
      }
      setTimeLeft(data.durationMinutes * 60);
    } catch (err) {
      console.error('Erro ao carregar simulado:', err);
    } finally {
      setIsLoading(false);
    }
  }, [simulationId]);

  useEffect(() => {
    if (isMounted) {
      loadSimulation();
    }
  }, [isMounted, loadSimulation]);

  // Função de Finalizar
  const handleFinish = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      await fetchApi(`/simulations/${simulationId}/finish`, { method: 'POST' });
      alert('Simulado finalizado com sucesso!');
      router.push('/questoes');
    } catch (err) {
      console.error('Erro ao finalizar simulado:', err);
    }
  }, [simulationId, router]);

  // Regressão do Cronômetro
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev !== null && prev <= 1) {
          clearInterval(timerRef.current!);
          handleFinish(); // Encerramento automático ao zerar
          return 0;
        }
        return prev !== null ? prev - 1 : 0;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft, handleFinish]);

  // Auto-Save ao clicar em uma alternativa
  const handleSelectAlternative = async (questionId: string, alternativeId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: alternativeId }));
    setIsSaving(true);

    try {
      await fetchApi('/simulations/auto-save', {
        method: 'POST',
        body: JSON.stringify({
          simulationId,
          questionId,
          alternativeId,
          timeSpentInSeconds: 0,
        }),
      });
    } catch (err) {
      console.error('Erro no Auto-Save:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center">
        <div 
          className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent mb-4"
          style={{ borderColor: 'var(--primary-color, #2563eb)', borderTopColor: 'transparent' }}
        />
        <p className="text-sm text-slate-400">Preparando folha de respostas do simulado...</p>
      </div>
    );
  }

  if (!simulation || !simulation.questions.length) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full">
            <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-200">Simulado não encontrado ou sem questões.</p>
            <p className="text-xs text-slate-400 mt-1 mb-6">
              Verifique o link ou retorne para o seu caderno de questões.
            </p>
            <button
              onClick={() => router.push('/questoes')}
              style={{ backgroundColor: 'var(--primary-color, #2563eb)' }}
              className="w-full rounded-xl py-2.5 text-xs font-bold text-white shadow-lg transition-opacity hover:opacity-90"
            >
              Voltar ao Caderno de Questões
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = simulation.questions[currentIndex];
  const minutes = timeLeft !== null ? Math.floor(timeLeft / 60) : 0;
  const seconds = timeLeft !== null ? timeLeft % 60 : 0;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      {/* Topo / Barra Secundária de Controle do Simulado */}
      <div className="border-b border-slate-800 bg-slate-900/60 px-6 py-3 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-sm text-white">{simulation.title}</h2>
          <p className="text-[11px] text-slate-400">
            {answeredCount} de {simulation.questions.length} questões marcadas
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Indicador de Auto-Save */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Save className={`w-3.5 h-3.5 ${isSaving ? 'animate-pulse text-amber-400' : 'text-emerald-400'}`} />
            <span className="hidden sm:inline">{isSaving ? 'Salvando...' : 'Respostas salvas'}</span>
          </div>

          {/* Cronômetro Regressivo */}
          <div
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold border ${
              timeLeft !== null && timeLeft < 300
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>

          <button
            onClick={() => {
              if (confirm('Tem certeza que deseja entregar a prova agora?')) {
                handleFinish();
              }
            }}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20"
          >
            Entregar Simulado
          </button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Questão Ativa */}
        <section className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div 
              className="absolute top-0 left-0 right-0 h-1" 
              style={{ backgroundColor: 'var(--primary-color, #2563eb)' }}
            />

            {/* Topo do Card */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <span 
                className="text-xs font-bold border px-3 py-1 rounded-full"
                style={{ 
                  backgroundColor: 'rgba(37, 99, 235, 0.1)', 
                  borderColor: 'rgba(37, 99, 235, 0.2)',
                  color: 'var(--primary-color, #60a5fa)'
                }}
              >
                Questão {currentIndex + 1}
              </span>
              <span className="text-xs text-slate-400">{currentQuestion.source || 'Banca Padrão'}</span>
            </div>

            {/* Enunciado */}
            <p className="text-slate-200 text-base font-medium leading-relaxed mb-8">
              {currentQuestion.statement}
            </p>

            {/* Alternativas */}
            <div className="space-y-3 mb-8">
              {currentQuestion.alternatives.map((alt) => {
                const isSelected = answers[currentQuestion.id] === alt.id;
                return (
                  <button
                    key={alt.id}
                    onClick={() => handleSelectAlternative(currentQuestion.id, alt.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-4 ${
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500 text-white font-medium ring-1 ring-blue-500/50'
                        : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <span
                      className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                      style={isSelected ? { backgroundColor: 'var(--primary-color, #2563eb)' } : {}}
                    >
                      {alt.letter}
                    </span>
                    <span className="text-sm pt-0.5 leading-relaxed">{alt.text}</span>
                  </button>
                );
              })}
            </div>

            {/* Navegação entre Questões */}
            <div className="flex justify-between items-center border-t border-slate-800 pt-4">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => prev - 1)}
                className="flex items-center gap-1 px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>

              <button
                disabled={currentIndex === simulation.questions.length - 1}
                onClick={() => setCurrentIndex((prev) => prev + 1)}
                style={{ backgroundColor: 'var(--primary-color, #2563eb)' }}
                className="flex items-center gap-1 px-4 py-2 text-xs font-semibold text-white rounded-lg disabled:opacity-40 transition-opacity hover:opacity-90 shadow-md"
              >
                Próxima <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Grade de Questões (Sidebar Lateral) */}
        <aside className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="font-bold text-sm text-white border-b border-slate-800 pb-3 mb-4">
              Grade de Respostas
            </h3>

            <div className="grid grid-cols-5 gap-2">
              {simulation.questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-lg text-xs font-bold transition-all ${
                      isCurrent
                        ? 'ring-2 ring-blue-400 text-white'
                        : isAnswered
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800'
                    }`}
                    style={isCurrent ? { backgroundColor: 'var(--primary-color, #2563eb)' } : {}}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}