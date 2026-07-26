'use client';

import React, { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';

interface ImportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportPdfModal({ isOpen, onClose, onSuccess }: ImportPdfModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [sourceName, setSourceName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [statusError, setStatusError] = useState<string | null>(null);

  // Polling para acompanhar o processamento do BullMQ via fetchApi
  useEffect(() => {
    if (!activeJobId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetchApi(`/admin/questions/job-status/${activeJobId}`);

        if (!res.ok) return;

        const data = await res.json();

        if (data.progress) {
          setProgressPercent(data.progress.percent || 0);
          setProgressMessage(data.progress.message || 'Processando com IA...');
        }

        if (data.state === 'completed') {
          clearInterval(interval);
          setIsSubmitting(false);
          setActiveJobId(null);
          onSuccess();
          onClose();
        }

        if (data.state === 'failed') {
          clearInterval(interval);
          setIsSubmitting(false);
          setStatusError(data.failedReason || 'Erro ao processar o arquivo PDF.');
        }
      } catch (err) {
        console.error('Erro no polling do job:', err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [activeJobId, onClose, onSuccess]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsSubmitting(true);
    setStatusError(null);
    setProgressPercent(5);
    setProgressMessage('Enviando arquivo para o servidor...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('sourceName', sourceName || file.name);

    try {
      // O fetchApi identifica automaticamente que é um FormData e ajusta os cabeçalhos!
      const response = await fetchApi('/admin/questions/upload-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Falha ao iniciar o upload.');
      }

      const result = await response.json();
      setActiveJobId(result.jobId);
    } catch (err: any) {
      setIsSubmitting(false);
      setStatusError(err.message || 'Erro ao enviar o arquivo.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-slate-800 mb-4">
          Importar Prova/PDF com IA
        </h2>

        {!isSubmitting ? (
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Fonte/Origem (ex: Simulado 2026)
              </label>
              <input
                type="text"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                placeholder="Ex: Prova CESPE 2026"
                className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Arquivo PDF
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
                className="mt-1 w-full text-sm text-slate-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {statusError && (
              <div className="rounded bg-red-50 p-3 text-xs text-red-600">
                {statusError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!file}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Iniciar Extração
              </button>
            </div>
          </form>
        ) : (
          <div className="py-6 space-y-4 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>

            <div>
              <p className="text-sm font-semibold text-slate-800">{progressMessage}</p>
              <p className="text-xs text-slate-500 mt-1">{progressPercent}% concluído</p>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-blue-600 h-2.5 transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}