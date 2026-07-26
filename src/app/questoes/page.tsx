'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from '../components/ui/Navbar';
import { fetchApi } from '@/lib/api';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Award, 
  ArrowRight, 
  RotateCcw,
  Sparkles,
  Filter,
} from 'lucide-react';

export interface Alternative {
  id: string;
  letter: string;
  text: string;
}

export interface StudentQuestion {
  id: string;
  statement: string;
  source?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  isTrick: boolean;
  alternatives: Alternative[];
}

export interface AnswerResult {
  answerId: string;
  isCorrect: boolean;
  explanation?: string;
  correctAlternativeId: string;
  justification?: string;
}

export interface Performance {
  totalAnswered: number;
  correctCount: number;
  accuracyPercentage: number;
  averageTimeInSeconds: number;
}

export default function StudentQuestionsPage() {
  const [questions, setQuestions] = useState<StudentQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAltId, setSelectedAltId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<AnswerResult | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const [timer, setTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimer(0);
    timerRef.current = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const fetchPerformance = async () => {
    try {
      const res = await fetchApi('/student-engine/performance');
      if (res.ok) {
        const data = await res.json();
        setPerformance(data);
      }
    } catch (err) {
      console.error('Erro ao buscar métricas:', err);
    }
  };

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    setFeedback(null);
    setSelectedAltId(null);
    setCurrentIndex(0);

    try {
      const endpoint = difficultyFilter
        ? `/student-engine/questions?difficulty=${difficultyFilter}&limit=10`
        : '/student-engine/questions?limit=10';

      const response = await fetchApi(endpoint);

      if (!response.ok) throw new Error('Falha ao buscar questões.');

      const data = await response.json();
      setQuestions(data);
      if (data.length > 0) startTimer();
    } catch (err) {
      console.error('Erro ao buscar questões:', err);
    } finally {
      setIsLoading(false);
    }
  }, [difficultyFilter, startTimer]);

  useEffect(() => {
    if (isMounted) {
      fetchQuestions();
      fetchPerformance();
    }
    return () => stopTimer();
  }, [fetchQuestions, isMounted, stopTimer]);

  const handleSubmitAnswer = async () => {
    if (!selectedAltId || isSubmitting || feedback) return;

    setIsSubmitting(true);
    stopTimer();

    const currentQuestion = questions[currentIndex];

    try {
      const response = await fetchApi('/student-engine/answer', {
        method: 'POST',
        body: JSON.stringify({
          questionId: currentQuestion.id,
          alternativeId: selectedAltId,
          timeSpentInSeconds: timer,
        }),
      });

      if (!response.ok) throw new Error('Erro ao submeter resposta.');

      const result: AnswerResult = await response.json();
      setFeedback(result);
      fetchPerformance();
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar resposta.');
      startTimer();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAltId(null);
      setFeedback(null);
      startTimer();
    } else {
      fetchQuestions();
    }
  };

  if (!isMounted) return null;

  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
        <section className="lg:col-span-3 space-y-6">
          {/* Barra de Filtro de Dificuldade */}
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-5 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Filter className="w-4 h-4 text-blue-400" />
              <span>Filtrar por Dificuldade:</span>
            </div>

            <div className="flex gap-2">
              {['', 'EASY', 'MEDIUM', 'HARD'].map((diff) => (
                <button
                  key={diff}
                  onClick={() => setDifficultyFilter(diff)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    difficultyFilter === diff
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {diff === '' ? 'Todas' : diff === 'EASY' ? 'Fácil' : diff === 'MEDIUM' ? 'Média' : 'Difícil'}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-sm text-slate-400">Carregando caderno de questões...</p>
            </div>
          ) : currentQuestion ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div 
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: 'var(--primary-color, #2563eb)' }} 
              />

              {/* Topo do Card */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    Questão {currentIndex + 1} de {questions.length}
                  </span>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                    {currentQuestion.source || 'Banca Padrão'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{Math.floor(timer / 60)}m {timer % 60}s</span>
                  </div>

                  <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                    currentQuestion.difficulty === 'EASY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    currentQuestion.difficulty === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {currentQuestion.difficulty}
                  </span>
                  {currentQuestion.isTrick && (
                    <span className="text-xs font-bold px-2 py-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Pegadinha
                    </span>
                  )}
                </div>
              </div>

              {/* Enunciado */}
              <div className="text-slate-200 text-base leading-relaxed mb-8 font-medium">
                {currentQuestion.statement}
              </div>

              {/* Alternativas */}
              <div className="space-y-3 mb-8">
                {currentQuestion.alternatives.map((alt) => {
                  const isSelected = selectedAltId === alt.id;
                  const isCorrectAlt = feedback?.correctAlternativeId === alt.id;
                  const isUserSelected = feedback && isSelected;

                  let optionStyle = 'bg-slate-950/50 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50';

                  if (feedback) {
                    if (isCorrectAlt) {
                      optionStyle = 'bg-emerald-500/15 border-emerald-500 text-emerald-200 font-semibold';
                    } else if (isUserSelected && !feedback.isCorrect) {
                      optionStyle = 'bg-rose-500/15 border-rose-500 text-rose-200';
                    } else {
                      optionStyle = 'bg-slate-950/20 border-slate-800/40 text-slate-500 opacity-50';
                    }
                  } else if (isSelected) {
                    optionStyle = 'bg-blue-600/10 border-blue-500 text-white shadow-md ring-1 ring-blue-500/50';
                  }

                  return (
                    <button
                      key={alt.id}
                      disabled={!!feedback}
                      onClick={() => setSelectedAltId(alt.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-4 ${optionStyle}`}
                    >
                      <span className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        feedback
                          ? isCorrectAlt
                            ? 'bg-emerald-500 text-white'
                            : isUserSelected
                            ? 'bg-rose-500 text-white'
                            : 'bg-slate-800 text-slate-500'
                          : isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {alt.letter}
                      </span>
                      <span className="text-sm pt-0.5 leading-relaxed">{alt.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Ação / Feedback */}
              {!feedback ? (
                <button
                  disabled={!selectedAltId || isSubmitting}
                  onClick={handleSubmitAnswer}
                  style={{ backgroundColor: 'var(--primary-color, #2563eb)' }}
                  className="w-full py-3.5 rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-40 text-white transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Verificando...' : 'Responder Questão'} <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <div className={`p-4 rounded-xl flex items-start gap-3 border ${
                    feedback.isCorrect 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}>
                    {feedback.isCorrect ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm">
                        {feedback.isCorrect ? 'Parabéns, você acertou!' : 'Resposta Incorreta'}
                      </h4>
                      {feedback.justification && (
                        <p className="text-xs text-slate-300 font-medium">{feedback.justification}</p>
                      )}
                      {feedback.explanation && (
                        <p className="text-xs opacity-90 pt-1 border-t border-slate-700/50 mt-2">
                          <span className="font-semibold text-white">Gabarito Comentado: </span>
                          {feedback.explanation}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleNextQuestion}
                    className="w-full py-3.5 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-white transition-all flex items-center justify-center gap-2"
                  >
                    Próxima Questão <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
              <p className="text-slate-300 font-semibold">Nenhuma questão encontrada para este filtro.</p>
              <button
                onClick={() => setDifficultyFilter('')}
                className="mt-3 text-xs text-blue-400 font-bold hover:underline"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </section>

        {/* Sidebar Direita: Painel de Estatísticas */}
        <aside className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Award className="w-4 h-4 text-amber-400" /> Meu Desempenho
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">Resolvidas</span>
                <span className="text-lg font-bold text-white">{performance?.totalAnswered || 0}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">Acertos (%)</span>
                <span className="text-lg font-bold text-emerald-400">{performance?.accuracyPercentage || 0}%</span>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-400">Tempo Médio</span>
              <span className="text-sm font-bold text-white">{performance?.averageTimeInSeconds || 0}s / quest.</span>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}