/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  Building,
  Filter,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  User,
  Info,
  Calendar,
  X,
  FileCheck,
} from 'lucide-react';
import { fetchRankingDespesas, fetchDespesasDeputado, buscarParlamentares } from '../services/api';
import { DespesaRankingItem, DespesaItem, Parlamentar } from '../types';
import { AdSlot } from './AdSlot';

const ESTADOS_BRASIL = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR',
  'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
];

const MESES = [
  { num: 1, nome: 'Janeiro' },
  { num: 2, nome: 'Fevereiro' },
  { num: 3, nome: 'Março' },
  { num: 4, nome: 'Abril' },
  { num: 5, nome: 'Maio' },
  { num: 6, nome: 'Junho' },
  { num: 7, nome: 'Julho' },
  { num: 8, nome: 'Agosto' },
  { num: 9, nome: 'Setembro' },
  { num: 10, nome: 'Outubro' },
  { num: 11, nome: 'Novembro' },
  { num: 12, nome: 'Dezembro' },
];

export const GastosParlamentares: React.FC = () => {
  const [ano, setAno] = useState<number>(2026);
  const [mes, setMes] = useState<number | undefined>(undefined);
  const [uf, setUf] = useState<string>('');
  const [ordenacao, setOrdenacao] = useState<'valor' | 'nome' | 'quantidade'>('valor');
  const [ordemDirecao, setOrdemDirecao] = useState<'asc' | 'desc'>('desc');

  const [ranking, setRanking] = useState<DespesaRankingItem[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [totalRegistrado, setTotalRegistrado] = useState(0);
  const [totalDespesasEncontradas, setTotalDespesasEncontradas] = useState(0);
  const [atualizadoEm, setAtualizadoEm] = useState('');

  // Selected deputy details modal for expenses
  const [modalDeputado, setModalDeputado] = useState<DespesaRankingItem | null>(null);
  const [despesasDetalhes, setDespesasDetalhes] = useState<DespesaItem[]>([]);
  const [carregandoDetalhes, setCarregandoDetalhes] = useState(false);
  const [categoriaTotais, setCategoriaTotais] = useState<Record<string, number>>({});

  const carregarDados = async () => {
    setCarregando(true);
    try {
      const res = await fetchRankingDespesas({
        ano,
        mes,
        uf: uf || undefined,
      });
      setRanking(res.ranking || []);
      setTotalRegistrado(res.totalRegistrado || 0);
      setTotalDespesasEncontradas(res.totalDespesasEncontradas || 0);
      setAtualizadoEm(res.atualizadoEm || '');
    } catch (err) {
      console.error('Erro ao buscar dados de despesas:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [ano, mes, uf]);

  // Open deputy expense details
  const handleOpenDetalhes = async (dep: DespesaRankingItem) => {
    setModalDeputado(dep);
    setCarregandoDetalhes(true);
    setDespesasDetalhes([]);
    try {
      const res = await fetchDespesasDeputado(dep.id, ano, mes);
      setDespesasDetalhes(res.dados || []);
      setCategoriaTotais(res.categoriaTotais || {});
    } catch (err) {
      console.error('Erro ao carregar recibos do deputado:', err);
    } finally {
      setCarregandoDetalhes(false);
    }
  };

  // Sort ranking
  const getSortedRanking = () => {
    const list = [...ranking];
    list.sort((a, b) => {
      let valA: any = a.valorTotal;
      let valB: any = b.valorTotal;

      if (ordenacao === 'nome') {
        valA = a.nome.toLowerCase();
        valB = b.nome.toLowerCase();
      } else if (ordenacao === 'quantidade') {
        valA = a.quantidadeDespesas;
        valB = b.quantidadeDespesas;
      }

      if (valA < valB) return ordemDirecao === 'asc' ? -1 : 1;
      if (valA > valB) return ordemDirecao === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  };

  const handleToggleOrdem = (campo: 'valor' | 'nome' | 'quantidade') => {
    if (ordenacao === campo) {
      setOrdemDirecao(ordemDirecao === 'asc' ? 'desc' : 'asc');
    } else {
      setOrdenacao(campo);
      setOrdemDirecao('desc');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  // Get period title
  const getTituloPeriodo = () => {
    const mesNome = mes ? MESES.find((m) => m.num === mes)?.nome : null;
    if (mesNome) {
      return `Despesas parlamentares registradas — ${mesNome} de ${ano}`;
    }
    return `Despesas parlamentares registradas — Exercício de ${ano}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Gastos Parlamentares (CEAP)
        </h1>
        <p className="mt-1 text-sm text-slate-600 max-w-4xl">
          Acompanhamento contábil oficial dos reembolsos e notas fiscais da Cota para o Exercício da Atividade Parlamentar (CEAP), sem juízo de valor ou acusações morais.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Ano
            </label>
            <select
              value={ano}
              onChange={(e) => setAno(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs font-medium text-slate-900"
            >
              <option value={2026}>2026 (Atual)</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
              <option value={2023}>2023</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Mês
            </label>
            <select
              value={mes || ''}
              onChange={(e) => setMes(e.target.value ? Number(e.target.value) : undefined)}
              className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs font-medium text-slate-900"
            >
              <option value="">Ano Inteiro / Consolidado</option>
              {MESES.map((m) => (
                <option key={m.num} value={m.num}>
                  {m.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Estado (UF)
            </label>
            <select
              value={uf}
              onChange={(e) => setUf(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs font-medium text-slate-900"
            >
              <option value="">Todas as UFs</option>
              {ESTADOS_BRASIL.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          <div className="ml-auto flex items-end">
            <button
              onClick={carregarDados}
              disabled={carregando}
              className="rounded-lg bg-blue-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 cursor-pointer"
            >
              {carregando ? 'Atualizando...' : 'Aplicar Filtros'}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Registrado no Período</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {formatCurrency(totalRegistrado)}
          </div>
          <span className="mt-1 block text-[11px] text-slate-500">
            Valores liquidados via CEAP
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Notas e Documentos Fiscais</span>
            <Receipt className="h-4 w-4 text-blue-900" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {totalDespesasEncontradas.toLocaleString('pt-BR')}
          </div>
          <span className="mt-1 block text-[11px] text-slate-500">
            Comprovantes auditados pela Câmara
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Parlamentares na Amostra</span>
            <User className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {ranking.length}
          </div>
          <span className="mt-1 block text-[11px] text-slate-500">
            Com registros contábeis no período
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Última Sincronização</span>
            <Calendar className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-900 font-mono">
            {atualizadoEm ? new Date(atualizadoEm).toLocaleTimeString('pt-BR') : 'Tempo Real'}
          </div>
          <span className="mt-1 block text-[11px] text-slate-500">
            Base: dadosabertos.camara.leg.br
          </span>
        </div>
      </div>

      {/* Nota Metodológica Obrigatória */}
      <div className="mt-6 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 leading-relaxed">
        <Info className="h-5 w-5 text-blue-900 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold text-slate-900">Critério de Transparência e Neutralidade: </strong>
          Esta tabela reflete a ordenação estritamente contábil dos comprovantes emitidos e ressarcidos pela CEAP. O teto mensal da cota varia legalmente de R$ 36.582,46 a R$ 51.406,33 conforme o estado de origem do parlamentar, compensando passagens aéreas e deslocamentos geográficos até Brasília. Os valores podem conter reembolsos cadastrados com posterioridade. Não configuram índice de honestidade ou irregularidade.
        </div>
      </div>

      {/* Ranking Table */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-base font-bold text-slate-900">
            {getTituloPeriodo()}
          </h2>
          <span className="text-xs text-slate-500">
            Clique em qualquer linha para auditar os recibos e notas fiscais individuais
          </span>
        </div>

        {carregando && (
          <div className="py-16 text-center text-sm text-slate-500">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-blue-900 border-t-transparent mb-2" />
            Consolidando valores oficiais da CEAP...
          </div>
        )}

        {!carregando && ranking.length === 0 && (
          <div className="p-12 text-center text-xs text-slate-500">
            Nenhuma despesa localizada com os filtros selecionados para este período.
          </div>
        )}

        {!carregando && ranking.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-16 text-center">Pos.</th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-blue-900"
                    onClick={() => handleToggleOrdem('nome')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Parlamentar</span>
                      {ordenacao === 'nome' && (
                        ordemDirecao === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-4">Cargo / UF</th>
                  <th className="py-3 px-4">Partido</th>
                  <th className="py-3 px-4">Maior Categoria de Custo</th>
                  <th
                    className="py-3 px-4 text-center cursor-pointer hover:text-blue-900"
                    onClick={() => handleToggleOrdem('quantidade')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Notas</span>
                      {ordenacao === 'quantidade' && (
                        ordemDirecao === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 text-right cursor-pointer hover:text-blue-900"
                    onClick={() => handleToggleOrdem('valor')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Valor Total Registrado</span>
                      {ordenacao === 'valor' && (
                        ordemDirecao === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center w-28">Auditoria</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {getSortedRanking().map((item, index) => (
                  <tr
                    key={`${item.casa}_${item.id}_${index}`}
                    onClick={() => handleOpenDetalhes(item)}
                    className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3 px-4 text-center text-xs font-mono text-slate-500">
                      {index + 1}º
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                          {item.urlFoto ? (
                            <img
                              src={item.urlFoto}
                              alt={item.nome}
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover object-top"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-400">
                              <User className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <span className="hover:text-blue-900">{item.nome}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      <span>{item.casa === 'camara' ? 'Dep. Federal' : 'Senador'}</span>
                      <span className="text-slate-400"> · </span>
                      <strong className="text-slate-800">{item.siglaUf}</strong>
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-700">
                      {item.siglaPartido || '—'}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate">
                      {item.maiorCategoria || 'Diversas'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-xs tabular-nums text-slate-600">
                      {item.quantidadeDespesas}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-slate-900">
                      {formatCurrency(item.valorTotal)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetalhes(item);
                        }}
                        className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-blue-900 hover:bg-blue-50"
                      >
                        Recibos
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdSlot slot="page_bottom" />

      {/* MODAL: Auditoria Individual de Recibos */}
      {modalDeputado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl border border-slate-200 bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                  {modalDeputado.urlFoto && (
                    <img
                      src={modalDeputado.urlFoto}
                      alt={modalDeputado.nome}
                      className="h-full w-full object-cover object-top"
                    />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Comprovantes Fiscais: {modalDeputado.nome}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {modalDeputado.casa === 'camara' ? 'Câmara dos Deputados' : 'Senado Federal'} · {modalDeputado.siglaPartido || '—'} / {modalDeputado.siglaUf} · Exercício {ano}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalDeputado(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Category Breakdown */}
              {Object.keys(categoriaTotais).length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                    Distribuição por Categoria de Cota
                  </h4>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {Object.entries(categoriaTotais).map(([cat, val]) => (
                      <div
                        key={cat}
                        className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 p-2.5 text-xs"
                      >
                        <span className="text-slate-700 truncate max-w-[240px]">{cat}</span>
                        <span className="font-mono font-semibold text-slate-900 tabular-nums">
                          {formatCurrency(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Receipts List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Notas Fiscais e Recibos Detalhados ({despesasDetalhes.length})
                  </h4>
                </div>

                {carregandoDetalhes && (
                  <div className="py-12 text-center text-sm text-slate-500">
                    <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-blue-900 border-t-transparent mb-2" />
                    Carregando notas fiscais eletrônicas...
                  </div>
                )}

                {!carregandoDetalhes && despesasDetalhes.length === 0 && (
                  <div className="rounded-lg bg-slate-50 p-6 text-center text-xs text-slate-500">
                    Nenhum comprovante individual listado para o filtro selecionado.
                  </div>
                )}

                {!carregandoDetalhes && despesasDetalhes.length > 0 && (
                  <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 overflow-hidden">
                    {despesasDetalhes.map((item, idx) => (
                      <div
                        key={`${item.codDocumento}_${idx}`}
                        className="p-3 text-xs hover:bg-slate-50/80 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <span className="font-semibold text-slate-900">
                            {item.nomeFornecedor || 'Fornecedor não informado'}
                          </span>
                          <span className="font-mono font-bold text-slate-900 tabular-nums text-sm">
                            {formatCurrency(item.valorLiquido || item.valorDocumento)}
                          </span>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-3 text-slate-500">
                          <span>{item.tipoDespesa}</span>
                          <span>·</span>
                          {item.dataDocumento && (
                            <span>{new Date(item.dataDocumento).toLocaleDateString('pt-BR')}</span>
                          )}
                          {item.cnpjCpfFornecedor && (
                            <>
                              <span>·</span>
                              <span className="font-mono">CNPJ/CPF: {item.cnpjCpfFornecedor}</span>
                            </>
                          )}
                          {item.numDocumento && (
                            <>
                              <span>·</span>
                              <span>Doc: {item.numDocumento}</span>
                            </>
                          )}
                        </div>

                        {item.urlDocumento && (
                          <div className="mt-2">
                            <a
                              href={item.urlDocumento}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-900 hover:underline"
                            >
                              <FileCheck className="h-3 w-3" />
                              <span>Ver Nota Fiscal / Recibo Digital Oficial</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-200 px-6 py-3 flex justify-end">
              <button
                onClick={() => setModalDeputado(null)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer"
              >
                Fechar Auditoria
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
