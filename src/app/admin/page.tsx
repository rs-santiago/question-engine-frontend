'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ImportPdfModal } from '../components/admin/ImportPdfModal';
import { fetchApi } from '@/lib/api';

export interface Alternative {
  id: string;
  letter: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  statement: string;
  source?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  isTrick: boolean;
  explanation?: string;
  alternatives: Alternative[];
  createdAt: string;
}

export default function AdminDashboardPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Busca o acervo de questões usando o fetchApi
  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchApi('/admin/questions');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Erro ${response.status}: Falha ao carregar as questões do acervo.`
        );
      }

      const data = await response.json();
      setQuestions(data);
    } catch (err: any) {
      console.error('Erro ao carregar questões:', err);
      setError(err.message || 'Erro ao conectar com o servidor.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      fetchQuestions();
    }
  }, [fetchQuestions, isMounted]);

  // Exclui uma questão usando o fetchApi
  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta questão?')) return;

    setDeletingId(id);

    try {
      const response = await fetchApi(`/admin/questions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Não foi possível excluir a questão.');
      }

      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir questão.');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-6xl">
        {/* Cabeçalho */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Painel do Professor</h1>
            <p className="text-sm text-slate-500 mt-1">
              Gestão do acervo de questões e importação automatizada via IA
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              <span>✨</span>
              <span>Importar PDF com IA</span>
            </button>
          </div>
        </div>

        {/* Métricas */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total de Questões
            </p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{questions.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Questões com Pegadinha
            </p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {questions.filter((q) => q.isTrick).length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Status do Banco
            </p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">Ativo & Sincronizado</p>
          </div>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        {/* Acervo */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Acervo de Questões</h2>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
              <p className="mt-4 text-sm text-slate-500">Carregando acervo de questões...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <p className="text-base font-semibold text-slate-700">
                Nenhuma questão cadastrada ainda.
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Clique em &quot;Importar PDF com IA&quot; para começar a gerar questões
                automaticamente.
              </p>
            </div>
          ) : (
            questions.map((question) => (
              <div
                key={question.id}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      Fonte: {question.source || 'Não informada'}
                    </span>
                    <span
                      className={`rounded px-2.5 py-1 text-xs font-semibold ${
                        question.difficulty === 'EASY'
                          ? 'bg-emerald-50 text-emerald-700'
                          : question.difficulty === 'MEDIUM'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {question.difficulty}
                    </span>
                    {question.isTrick && (
                      <span className="rounded bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
                        ⚡ Pegadinha
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteQuestion(question.id)}
                    disabled={deletingId === question.id}
                    className="text-xs font-medium text-rose-600 hover:text-rose-800 disabled:opacity-50"
                  >
                    {deletingId === question.id ? 'Excluindo...' : 'Excluir'}
                  </button>
                </div>

                <p className="mb-4 text-base font-medium text-slate-800 leading-relaxed">
                  {question.statement}
                </p>

                <div className="space-y-2 mb-4">
                  {question.alternatives?.map((alt) => (
                    <div
                      key={alt.id}
                      className={`flex items-start gap-3 rounded-lg border p-3 text-sm transition-colors ${
                        alt.isCorrect
                          ? 'border-emerald-300 bg-emerald-50/50 text-emerald-900 font-medium'
                          : 'border-slate-200 bg-slate-50/50 text-slate-700'
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          alt.isCorrect
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {alt.letter}
                      </span>
                      <span className="pt-0.5">{alt.text}</span>
                    </div>
                  ))}
                </div>

                {question.explanation && (
                  <div className="rounded-lg bg-blue-50/60 p-3.5 border border-blue-100 text-xs text-blue-900">
                    <span className="font-bold">Resolução/Explicação: </span>
                    {question.explanation}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <ImportPdfModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchQuestions}
      />
    </div>
  );
}