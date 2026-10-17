/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertTriangle, RefreshCw, ExternalLink, KeyRound } from 'lucide-react';
import { fetchStatusFontes, RespostaStatusFontes } from '../services/api';
import { StatusFonte } from '../types';

interface StatusFontesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StatusFontesModal: React.FC<StatusFontesModalProps> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<RespostaStatusFontes | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregarStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchStatusFontes();
      setData(res);
    } catch (err) {
      setError('Falha ao verificar status das fontes no momento.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      carregarStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const renderBadge = (fonte: StatusFonte) => {
    if (fonte.status === 'online') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Operacional
        </span>
      );
    }
    if (fonte.status === 'sem_chave') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
          <KeyRound className="h-4 w-4 text-amber-600" />
          Chave Pendente
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        Instabilidade
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Integridade e Status das Fontes Governamentais
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            O Placar da Esplanada realiza consultas diretas aos repositórios oficiais e canais de dados abertos do Governo Federal e do Congresso Nacional. Veja abaixo o estado de conexão de cada provedor:
          </p>

          {loading && (
            <div className="py-8 text-center text-sm text-slate-500">
              <RefreshCw className="mx-auto h-5 w-5 animate-spin text-blue-900 mb-2" />
              Testando conexões oficiais com a Esplanada...
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-800">
              {error}
            </div>
          )}

          {data && !loading && (
            <div className="space-y-4">
              {data.fontes.map((fonte) => (
                <div
                  key={fonte.sigla}
                  className="rounded-lg border border-slate-200 bg-slate-50/50 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                          {fonte.sigla}
                        </span>
                        <span className="text-sm font-semibold text-slate-900">
                          {fonte.nome}
                        </span>
                      </div>
                      <a
                        href={fonte.urlBase}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-blue-900"
                      >
                        <span className="font-mono">{fonte.urlBase}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <div>{renderBadge(fonte)}</div>
                  </div>

                  <p className="mt-2 text-xs text-slate-600">{fonte.detalhes}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-slate-500 border-t border-slate-200/60 pt-2 font-mono">
                    {fonte.tempoRespostaMs !== undefined && fonte.tempoRespostaMs > 0 && (
                      <span>Latência: {fonte.tempoRespostaMs}ms</span>
                    )}
                    <span>
                      Última verificação:{' '}
                      {new Date(fonte.ultimaConsulta).toLocaleTimeString('pt-BR')}
                    </span>
                    {fonte.itensEmCache !== undefined && (
                      <span>Objetos em cache: {fonte.itensEmCache}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="text-[11px] text-slate-400">
              Políticas de cache respeitam limites oficiais de requisições.
            </span>
            <div className="flex gap-2">
              <button
                onClick={carregarStatus}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Atualizar agora
              </button>
              <button
                onClick={onClose}
                className="rounded-lg bg-blue-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
