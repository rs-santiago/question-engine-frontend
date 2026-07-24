'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { fetchApi } from '@/lib/api';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Award, 
  ArrowRight, 
  RotateCcw,
  Sparkles,
  LogOut,
  User as UserIcon,
} from 'lucide-react';

interface Alternative {
  id: string;
  letter: string;
  text: string;
}

interface Question {
  id: string;
  statement: string;
  difficulty: string;
  isTrick: boolean;
  source: string;
  alternatives: Alternative[];
}

interface Performance {
  totalAnswered: number;
  correctCount: number;
  accuracyPercentage: number;
  averageTimeInSeconds: number;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAltId, setSelectedAltId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<any | null>(null);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Executa a verificação de autenticação e busca de dados apenas após a montagem no cliente
    const email = Cookies.get('userEmail');
    const token = Cookies.get('token');

    if (!token) {
      router.push('/login');
      return;
    }

    if (email) {
      setUserEmail(email);
    }

    fetchQuestions();
    fetchPerformance();
  }, [mounted, router]);

  // Cronômetro da questão atual
  useEffect(() => {
    let interval: any;
    if (!feedback && mounted) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [feedback, mounted]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/student-engine/questions?limit=5');
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        setQuestions(data);
      } else {
        // Fallback visual com UUIDs válidos para passar na validação do DTO do NestJS
        setQuestions([
          {
            id: 'd1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', // UUID válido
            statement: 'De acordo com a Constituição Federal de 1988, o prazo de validade do concurso público é de até:',
            difficulty: 'EASY',
            isTrick: false,
            source: 'Banca CESPE / Sebraspe',
            alternatives: [
              { id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', letter: 'A', text: '1 ano, prorrogável uma única vez por igual período.' },
              { id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', letter: 'B', text: '2 anos, prorrogável uma vez por igual período.' },
              { id: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', letter: 'C', text: '3 anos, sem possibilidade de prorrogação.' },
              { id: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a', letter: 'D', text: '4 anos, a critério da administração pública.' },
            ],
          },
        ]);
      }
    } catch (err) {
      console.error('Erro ao buscar questões:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformance = async () => {
    try {
      const res = await fetchApi('/student-engine/performance');
      const data = await res.json();
      setPerformance(data);
    } catch (err) {
      console.error('Erro ao buscar métricas:', err);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAltId || !currentQuestion) return;

    try {
      const res = await fetchApi('/student-engine/answer', {
        method: 'POST',
        body: JSON.stringify({
          questionId: currentQuestion.id,
          alternativeId: selectedAltId,
          timeSpentInSeconds: timer,
        }),
      });

      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.message);
      }

      setFeedback(result);
      fetchPerformance();
    } catch (err) {
      // Fallback local caso a questão de teste não esteja gravada no banco
      setFeedback({
        isCorrect: selectedAltId === 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', // ID da alternativa B
        explanation: 'Conforme o Art. 37, III da CF/88, o prazo é de até 2 anos, prorrogável uma vez por igual período.',
        justification: 'Resposta fundamentada na Carta Magna.',
      });
    }
  };

  const handleNextQuestion = () => {
    setSelectedAltId(null);
    setFeedback(null);
    setTimer(0);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      fetchQuestions();
      setCurrentIndex(0);
    }
  };

  const handleLogout = () => {
    Cookies.remove('token');
    Cookies.remove('userRole');
    Cookies.remove('userEmail');
    router.push('/login');
  };

  const currentQuestion = questions[currentIndex];

  if (!mounted) {
    return (
      <div suppressHydrationWarning className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header White-Label */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-brand-primary flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-brand-primary/20">
            QE
          </div>
          <div>
            <h1 className="font-bold text-lg text-white leading-tight">Question Engine</h1>
            <p className="text-xs text-slate-400">Ambiente de Treinamento Intensivo</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700">
            <Clock className="w-4 h-4 text-brand-secondary" />
            <span>Tempo: {Math.floor(timer / 60)}m {timer % 60}s</span>
          </div>

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
            <UserIcon className="w-4 h-4 text-brand-primary" />
            <span>{userEmail || 'Aluno'}</span>
          </div>

          <button
            onClick={handleLogout}
            title="Sair da Conta"
            className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Área Principal da Questão */}
        <section className="lg:col-span-3 space-y-6">
          {currentQuestion && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-brand-primary" />

              {/* Topo da Questão */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                  {currentQuestion.source}
                </span>

                <div className="flex items-center gap-2">
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
                {currentQuestion.alternatives?.map((alt) => {
                  const isSelected = selectedAltId === alt.id;
                  return (
                    <button
                      key={alt.id}
                      disabled={!!feedback}
                      onClick={() => setSelectedAltId(alt.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-4 ${
                        isSelected
                          ? 'bg-brand-primary/10 border-brand-primary text-white shadow-md'
                          : 'bg-slate-950/50 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                      }`}
                    >
                      <span className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected ? 'bg-brand-primary text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {alt.letter}
                      </span>
                      <span className="text-sm pt-0.5 leading-relaxed">{alt.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Envio / Ação */}
              {!feedback ? (
                <button
                  disabled={!selectedAltId}
                  onClick={handleSubmitAnswer}
                  className="w-full py-3.5 rounded-xl font-bold text-sm bg-brand-primary hover:opacity-90 disabled:opacity-40 text-white transition-all shadow-lg shadow-brand-primary/25 flex items-center justify-center gap-2"
                >
                  Responder Questão <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                /* Feedback com Gabarito */
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
                    <div>
                      <h4 className="font-bold text-sm">
                        {feedback.isCorrect ? 'Parabéns, você acertou!' : 'Resposta Incorreta'}
                      </h4>
                      <p className="text-xs opacity-90 mt-1">{feedback.explanation}</p>
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
          )}
        </section>

        {/* Sidebar Direita: Painel de Estatísticas */}
        <aside className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Award className="w-4 h-4 text-brand-secondary" /> Meu Desempenho
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