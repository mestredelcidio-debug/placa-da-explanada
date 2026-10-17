/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  Info,
  DollarSign,
  KeyRound,
  Building,
} from 'lucide-react';
import { fetchEmendas, RespostaEmendas } from '../services/api';
import { EmendaItem } from '../types';
import { AdSlot } from './AdSlot';

export const EmendasParlamentares: React.FC = () => {
  const [ano, setAno] = useState<number>(2024);
  const [codigoEmenda, setCodigoEmenda] = useState<string>('');
  const [autor, setAutor] = useState<string>('');
  const [dados, setDados] = useState<EmendaItem[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [respostaStatus, setRespostaStatus] = useState<RespostaEmendas | null>(null);

  const consultarEmendas = async () => {
    setCarregando(true);
    setRespostaStatus(null);
    setDados([]);
    try {
      const res = await fetchEmendas({
        ano,
        codigoEmenda: codigoEmenda || undefined,
        autor: autor || undefined,
      });
      setRespostaStatus(res);
      setDados(res.dados || []);
    } catch (err) {
      console.error('Erro ao consultar emendas:', err);
      setRespostaStatus({
        configurado: true,
        status: 'erro',
        mensagem: 'Erro de conexão ao buscar emendas.',
        dados: [],
      });
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    consultarEmendas();
  }, [ano]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Emendas Parlamentares
        </h1>
        <p className="mt-1 text-sm text-slate-600 max-w-4xl">
          Acompanhe a destinação de recursos do Orçamento Geral da União (OGU) por meio de emendas individuais, de bancada e de comissão, fiscalizando o valor previsto, empenhado e efetivamente pago.
        </p>
      </div>

      {/* Alerta de Token / Status de Conexão com CGU */}
      {respostaStatus && !respostaStatus.configurado && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/70 p-6 text-xs text-amber-900 shadow-xs">
          <div className="flex items-start gap-3">
            <KeyRound className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-amber-900">
                  Integração Oficial com a API do Portal da Transparência (CGU)
                </h3>
                <p className="mt-1 leading-relaxed text-amber-800">
                  Para realizar consultas automatizadas à API de Dados Abertos da Controladoria-Geral da União (CGU), é necessário informar uma chave oficial na variável de ambiente <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-semibold">PORTAL_TRANSPARENCIA_API_KEY</code>.
                </p>
              </div>

              <div className="rounded-lg bg-white/80 p-4 border border-amber-200/60 space-y-2">
                <div className="font-semibold text-slate-900">Como habilitar em 3 passos gratuitos:</div>
                <ol className="list-decimal list-inside space-y-1 text-slate-700">
                  <li>
                    Acesse a página de cadastro do Governo Federal:{' '}
                    <a
                      href="https://portaldatransparencia.gov.br/api-de-dados/cadastrar-email"
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-blue-900 underline inline-flex items-center gap-1"
                    >
                      <span>Cadastro Oficial da API da CGU</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                  <li>Insira seu e-mail para receber a chave oficial gerada pelo sistema federal.</li>
                  <li>Insira a chave no arquivo <span className="font-mono">.env</span> do servidor.</li>
                </ol>
              </div>

              {/* Direct links to public portals */}
              <div>
                <div className="font-semibold text-amber-900 mb-1">
                  Enquanto isso, consulte em tempo real nos portais públicos governamentais:
                </div>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="https://portaldatransparencia.gov.br/emendas"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 font-medium text-amber-950 hover:bg-amber-50"
                  >
                    <span>Portal da Transparência (Web)</span>
                    <ExternalLink className="h-3.5 w-3.5 text-amber-700" />
                  </a>
                  <a
                    href="https://www.siop.planejamento.gov.br/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 font-medium text-amber-950 hover:bg-amber-50"
                  >
                    <span>SIOP (Planejamento e Orçamento)</span>
                    <ExternalLink className="h-3.5 w-3.5 text-amber-700" />
                  </a>
                  <a
                    href="https://www.camara.leg.br/transparencia/gastos-parlamentares/emendas"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 font-medium text-amber-950 hover:bg-amber-50"
                  >
                    <span>Painel de Emendas da Câmara</span>
                    <ExternalLink className="h-3.5 w-3.5 text-amber-700" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {respostaStatus && respostaStatus.status === 'erro' && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6 text-xs text-red-900 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-700 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-red-900">Erro na Consulta</h3>
              <p className="mt-1">{respostaStatus.mensagem}</p>
            </div>
          </div>
        </div>
      )}

      {/* Regra de Ouro: Diferença entre Destinado, Empenhado e Pago */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-900 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="font-semibold text-slate-900">
              Guia Pedagógico do Ciclo Orçamentário:
            </strong>
            <p>
              <strong>Valor Previsto (Autorizado):</strong> O montante aprovado na Lei Orçamentária Anual (LOA). Não significa que o dinheiro foi transferido.
            </p>
            <p>
              <strong>Valor Empenhado:</strong> O Estado reservou o orçamento para o beneficiário específico; o compromisso formal foi assumido.
            </p>
            <p>
              <strong>Valor Liquidado:</strong> O bem foi entregue ou a obra/serviço foi atestado tecnicamente pelo órgão executor.
            </p>
            <p>
              <strong>Valor Pago:</strong> O recurso financeiro foi efetivamente transferido para a conta bancária do município, estado ou entidade conveniada.
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Exercício (Ano)
            </label>
            <select
              value={ano}
              onChange={(e) => setAno(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-medium text-slate-900"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
              <option value={2023}>2023</option>
            </select>
          </div>

          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Código da Emenda
            </label>
            <input
              type="text"
              value={codigoEmenda}
              onChange={(e) => setCodigoEmenda(e.target.value)}
              placeholder="Ex: 202440010001"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-blue-900"
            />
          </div>

          <div className="md:col-span-5 flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nome do Autor / Parlamentar
              </label>
              <input
                type="text"
                value={autor}
                onChange={(e) => setAutor(e.target.value)}
                placeholder="Ex: Bancada de São Paulo, Senador X..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-blue-900"
              />
            </div>
            <button
              onClick={consultarEmendas}
              disabled={carregando}
              className="rounded-lg bg-blue-900 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 cursor-pointer shrink-0"
            >
              {carregando ? 'Buscando...' : 'Pesquisar'}
            </button>
          </div>
        </div>
      </div>

      {/* Results View */}
      <div className="mt-6 space-y-4">
        {carregando && (
          <div className="py-16 text-center text-sm text-slate-500">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-blue-900 border-t-transparent mb-2" />
            Consultando registros oficiais de emendas...
          </div>
        )}

        {!carregando && dados.length === 0 && respostaStatus?.configurado && (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-500">
            Nenhuma emenda localizada para os critérios pesquisados. Verifique o ano e o código informado.
          </div>
        )}

        {!carregando && dados.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            {dados.map((emenda, idx) => (
              <div
                key={`${emenda.codigoEmenda}_${idx}`}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono font-bold text-blue-900">
                        Emenda nº {emenda.codigoEmenda}
                      </span>
                      <span>·</span>
                      <span>Ano: <strong>{emenda.ano}</strong></span>
                      <span>·</span>
                      <span>{emenda.tipoEmenda}</span>
                    </div>

                    <h3 className="text-base font-semibold text-slate-900">
                      Autor: {emenda.autor}
                    </h3>

                    <p className="text-xs text-slate-600">
                      Localidade beneficiada: <strong>{emenda.localidade}</strong>
                    </p>
                  </div>

                  {emenda.linkOficial && (
                    <a
                      href={emenda.linkOficial}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-900 hover:underline shrink-0"
                    >
                      <span>Auditar na CGU</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>

                {/* Progress & Values */}
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-lg bg-slate-50 p-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Valor Previsto</span>
                    <strong className="font-mono text-slate-900 tabular-nums text-sm">
                      {formatCurrency(emenda.valorPrevisto)}
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">Valor Empenhado</span>
                    <strong className="font-mono text-blue-950 tabular-nums text-sm">
                      {formatCurrency(emenda.valorEmpenhado)}
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">Valor Liquidado</span>
                    <strong className="font-mono text-slate-700 tabular-nums text-sm">
                      {formatCurrency(emenda.valorLiquidado)}
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">Valor Efetivamente Pago</span>
                    <strong className="font-mono text-emerald-700 tabular-nums text-sm">
                      {formatCurrency(emenda.valorPago)}
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AdSlot slot="page_bottom" />
    </div>
  );
};
