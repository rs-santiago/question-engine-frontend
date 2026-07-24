'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { fetchApi } from '@/lib/api';
import { 
  Plus, 
  CheckCircle2, 
  Sparkles, 
  ArrowLeft, 
  FileText,
  Upload
} from 'lucide-react';

interface Alternative {
  letter: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  statement: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  isTrick: boolean;
  source: string;
  explanation?: string;
  topic?: { name: string };
  alternatives: Alternative[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal 1: Cadastro Manual
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statement, setStatement] = useState('');
  const [source, setSource] = useState('');
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [isTrick, setIsTrick] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [alternatives, setAlternatives] = useState<Alternative[]>([
    { letter: 'A', text: '', isCorrect: true },
    { letter: 'B', text: '', isCorrect: false },
    { letter: 'C', text: '', isCorrect: false },
    { letter: 'D', text: '', isCorrect: false },
  ]);

  // Modal 2: Importação de PDF com IA
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfSource, setPdfSource] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const token = Cookies.get('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchAdminQuestions();
  }, [mounted, router]);

  const fetchAdminQuestions = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/admin/questions');
      if (!res.ok) {
        throw new Error(`Erro HTTP: ${res.status}`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setQuestions(data);
      }
    } catch (err) {
      console.error('Erro ao buscar questões do admin:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handlers do Formulário Manual
  const handleCorrectChange = (index: number) => {
    setAlternatives((prev) =>
      prev.map((alt, i) => ({
        ...alt,
        isCorrect: i === index,
      }))
    );
  };

  const handleAlternativeTextChange = (index: number, text: string) => {
    setAlternatives((prev) =>
      prev.map((alt, i) => (i === index ? { ...alt, text } : alt))
    );
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetchApi('/admin/questions', {
        method: 'POST',
        body: JSON.stringify({
          statement,
          source,
          difficulty,
          isTrick,
          explanation,
          alternatives,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(`Erro ao cadastrar: ${errorData.message || 'Verifique os dados.'}`);
        return;
      }

      setIsModalOpen(false);
      resetForm();
      fetchAdminQuestions();
    } catch (err) {
      console.error('Erro ao criar questão:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStatement('');
    setSource('');
    setDifficulty('MEDIUM');
    setIsTrick(false);
    setExplanation('');
    setAlternatives([
      { letter: 'A', text: '', isCorrect: true },
      { letter: 'B', text: '', isCorrect: false },
      { letter: 'C', text: '', isCorrect: false },
      { letter: 'D', text: '', isCorrect: false },
    ]);
  };

  // Handler do Upload de PDF com IA
  const handleUploadPdf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', pdfFile);
    formData.append('sourceName', pdfSource);

    try {
      const res = await fetchApi('/admin/questions/upload-pdf', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        alert('PDF enviado com sucesso! As questões estão sendo extraídas pela IA em segundo plano.');
        setIsPdfModalOpen(false);
        setPdfFile(null);
        setPdfSource('');
        setTimeout(() => fetchAdminQuestions(), 5000);
      } else {
        const errData = await res.json();
        alert(`Erro no upload: ${errData.message || 'Falha ao enviar arquivo.'}`);
      }
    } catch (err) {
      console.error('Erro ao enviar PDF:', err);
    } finally {
      setUploading(false);
    }
  };

  // Garante que o SSR não renderize antes da hidratação completa no browser
  if (!mounted) {
    return (
      <div suppressHydrationWarning className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header Admin */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-all"
            title="Voltar para a Visão do Aluno"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-bold text-lg text-white leading-tight">Painel do Professor</h1>
            <p className="text-xs text-slate-400">Gestão do Banco de Questões</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setIsPdfModalOpen(true)}
            className="py-2.5 px-4 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-lg shadow-purple-600/20 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Importar PDF com IA
          </button>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="py-2.5 px-4 rounded-xl font-bold text-xs bg-brand-primary hover:opacity-90 text-white transition-all shadow-lg shadow-brand-primary/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Nova Questão Manual
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
        {/* Métricas do Acervo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <span className="text-xs text-slate-400 font-medium">Total de Questões</span>
            <p className="text-2xl font-bold text-white mt-1">{questions.length}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <span className="text-xs text-slate-400 font-medium">Com Pegadinhas</span>
            <p className="text-2xl font-bold text-purple-400 mt-1">
              {questions.filter((q) => q.isTrick).length}
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <span className="text-xs text-slate-400 font-medium">Status do Banco</span>
            <p className="text-2xl font-bold text-emerald-400 mt-1">Ativo & Sincronizado</p>
          </div>
        </div>

        {/* Tabela de Questões */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-primary" /> Acervo de Questões
            </h3>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500">Carregando acervo...</div>
          ) : questions.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              Nenhuma questão cadastrada ainda. Clique em "Nova Questão Manual" ou "Importar PDF com IA" para começar.
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {questions.map((q) => (
                <div key={q.id} className="p-5 hover:bg-slate-800/30 transition-all space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                        {q.source}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        q.difficulty === 'EASY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        q.difficulty === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {q.difficulty}
                      </span>
                      {q.isTrick && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Pegadinha
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-slate-200 font-medium leading-relaxed">
                    {q.statement}
                  </p>

                  {/* Badges das Alternativas */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {q.alternatives?.map((alt) => (
                      <span
                        key={alt.letter}
                        className={`text-xs px-2.5 py-1 rounded-lg border ${
                          alt.isCorrect
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400'
                        }`}
                      >
                        {alt.letter}: {alt.text}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal 1: Cadastro Manual de Questão */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Cadastrar Nova Questão</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Enunciado da Questão</label>
                <textarea
                  required
                  rows={3}
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                  placeholder="Digite o texto principal da questão..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Banca / Fonte</label>
                  <input
                    type="text"
                    required
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="Ex: Banca CESPE / Sebraspe"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Dificuldade</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-brand-primary"
                  >
                    <option value="EASY">Fácil</option>
                    <option value="MEDIUM">Média</option>
                    <option value="HARD">Difícil</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isTrick"
                  checked={isTrick}
                  onChange={(e) => setIsTrick(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-brand-primary focus:ring-0"
                />
                <label htmlFor="isTrick" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Marcar como "Pegadinha" (Sinalizar atenção especial ao aluno)
                </label>
              </div>

              {/* Seção de Alternativas */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <label className="block text-xs font-semibold text-slate-300">
                  Alternativas (Marque o botão ao lado da alternativa CORRETA)
                </label>

                {alternatives.map((alt, idx) => (
                  <div key={alt.letter} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="correctAlternative"
                      checked={alt.isCorrect}
                      onChange={() => handleCorrectChange(idx)}
                      className="text-emerald-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="font-bold text-xs text-slate-400 w-4">{alt.letter}</span>
                    <input
                      type="text"
                      required
                      value={alt.text}
                      onChange={(e) => handleAlternativeTextChange(idx, e.target.value)}
                      placeholder={`Texto da alternativa ${alt.letter}...`}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                ))}
              </div>

              {/* Explicação do Gabarito */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Explicação do Gabarito / Fundamentação Legal
                </label>
                <textarea
                  rows={2}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Justificativa apresentada ao aluno após responder..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-brand-primary hover:opacity-90 disabled:opacity-50 text-white transition-all shadow-lg shadow-brand-primary/25"
                >
                  {submitting ? 'Salvando...' : 'Salvar Questão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Upload e Extração de PDF com IA */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" /> Extração Automática via IA
              </h3>
              <button 
                onClick={() => setIsPdfModalOpen(false)} 
                className="text-slate-500 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadPdf} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do Exame / Banca</label>
                <input
                  type="text"
                  required
                  value={pdfSource}
                  onChange={(e) => setPdfSource(e.target.value)}
                  placeholder="Ex: Prova Simulado 2026 - Polícia Civil"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Arquivo PDF</label>
                <input
                  type="file"
                  accept=".pdf"
                  required
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-600/10 file:text-purple-400 hover:file:bg-purple-600/20 cursor-pointer"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPdfModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white transition-all shadow-lg shadow-purple-600/25 flex items-center gap-2"
                >
                  {uploading ? (
                    'Enviando...'
                  ) : (
                    <>
                      <Upload className="w-4 h-4" /> Iniciar Extração
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}