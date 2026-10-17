/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  Vote,
  Receipt,
  FileSpreadsheet,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Building2,
  Calendar,
  AlertCircle,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { NavTab } from './Navbar';
import { fetchVotacoesRecentes, fetchRankingDespesas, fetchEmendas } from '../services/api';
import { VotacaoResumo, DespesaRankingItem, EmendaItem } from '../types';
import { AdSlot } from './AdSlot';

interface HomeProps {
  onSelectTab: (tab: NavTab) => void;
  onSearchSubmit: (query: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onSelectTab, onSearchSubmit }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [votacoesRecentes, setVotacoesRecentes] = useState<VotacaoResumo[]>([]);
  const [carregandoVotacoes, setCarregandoVotacoes] = useState(false);

  // Despesas agregadas
  const [totalDespesasPeriodo, setTotalDespesasPeriodo] = useState<number>(0);
  const [qtdDespesasPeriodo, setQtdDespesasPeriodo] = useState<number>(0);
  const [amostraParlamentares, setAmostraParlamentares] = useState<number>(0);
  const [carregandoDespesas, setCarregandoDespesas] = useState(false);

  // Emendas agregadas
  const [emendasStatusConfigurado, setEmendasStatusConfigurado] = useState<boolean>(false);
  const [emendasQtd, setEmendasQtd] = useState<number>(0);

  useEffect(() => {
    // Carregar votações recentes reais
    const carregarVotacoes = async () => {
      setCarregandoVotacoes(true);
      try {
        const res = await fetchVotacoesRecentes(4);
        setVotacoesRecentes(res.dados || []);
      } catch (err) {
        console.error('Erro ao carregar votações na Home:', err);
      } finally {
        setCarregandoVotacoes(false);
      }
    };

    // Carregar resumo de despesas da CEAP
    const carregarDespesas = async () => {
      setCarregandoDespesas(true);
      try {
        const res = await fetchRankingDespesas({ ano: 2026 });
        setTotalDespesasPeriodo(res.totalRegistrado || 0);
        setQtdDespesasPeriodo(res.totalDespesasEncontradas || 0);
        setAmostraParlamentares(res.parlamentaresAmostrados || 0);
      } catch (err) {
        console.error('Erro ao carregar despesas na Home:', err);
      } finally {
        setCarregandoDespesas(false);
      }
    };

    // Verificar emendas
    const carregarEmendas = async () => {
      try {
        const res = await fetchEmendas({ ano: 2024 });
        setEmendasStatusConfigurado(res.configurado);
        setEmendasQtd(res.dados ? res.dados.length : 0);
      } catch (err) {
        console.error('Erro ao checar emendas:', err);
      }
    };

    carregarVotacoes();
    carregarDespesas();
    carregarEmendas();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearchSubmit(searchQuery.trim());
      onSelectTab('votacoes');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  return (
    <div className="space-y-12">
      {/* HERO SECTION with Congress architectural photo */}
      <section className="relative overflow-hidden bg-slate-900 py-16 text-white sm:py-24">
        {/* Background image overlay */}
        <div className="absolute inset-0 z-0 opacity-25 mix-blend-luminosity">
          <img
            src="/src/assets/images/hero_esplanada_congresso_1792203602135.jpg"
            alt="Congresso Nacional em Brasília"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent" />

        <div className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-950/60 px-3.5 py-1 text-xs text-blue-200 backdrop-blur-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
            <span>Transparência Política e Fiscal Cidadã · Dados Abertos Oficiais</span>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl text-balance">
            Como atuam seus representantes em Brasília?
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-slate-300 leading-relaxed">
            Acompanhe votações nominais, despesas da cota parlamentar (CEAP) e destinação de emendas de Deputados Federais e Senadores de forma visual, neutra e auditável.
          </p>

          {/* SECTION A: Barra de pesquisa em destaque */}
          <form onSubmit={handleSearch} className="mx-auto mt-8 max-w-2xl">
            <div className="relative flex items-center shadow-xl">
              <Search className="absolute left-4 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquise um deputado ou senador pelo nome ou estado."
                className="w-full rounded-xl border border-slate-700 bg-white/95 py-4 pl-12 pr-32 text-sm text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="absolute right-2 rounded-lg bg-blue-900 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-blue-800 cursor-pointer"
              >
                Buscar
              </button>
            </div>
          </form>

          {/* DOIS BOTÕES PRINCIPAIS: CONSULTAR VOTAÇÕES e CONSULTAR GASTOS */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onSelectTab('votacoes')}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold tracking-wide text-white shadow-lg transition hover:bg-blue-500 cursor-pointer"
            >
              <Vote className="h-4 w-4" />
              <span>CONSULTAR VOTAÇÕES</span>
            </button>

            <button
              onClick={() => onSelectTab('gastos')}
              className="flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-800/80 px-6 py-3.5 text-sm font-bold tracking-wide text-white transition hover:bg-slate-700 cursor-pointer backdrop-blur-xs"
            >
              <Receipt className="h-4 w-4" />
              <span>CONSULTAR GASTOS</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        <AdSlot slot="home_top" />

        {/* SECTION B: Votações Recentes */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Votações Recentes no Plenário
              </h2>
              <p className="text-xs text-slate-500">
                Matérias deliberadas na Câmara dos Deputados em tempo real com links oficiais
              </p>
            </div>
            <button
              onClick={() => onSelectTab('votacoes')}
              className="flex items-center gap-1 text-xs font-semibold text-blue-900 hover:underline cursor-pointer"
            >
              <span>Ver todas</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {carregandoVotacoes && (
            <div className="py-8 text-center text-xs text-slate-500">
              Carregando votações mais recentes da Câmara...
            </div>
          )}

          {!carregandoVotacoes && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {votacoesRecentes.map((v, index) => (
                <div
                  key={`${v.id}_${index}`}
                  onClick={() => onSelectTab('votacoes')}
                  className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-blue-900 hover:shadow-md"
                >
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-blue-900 uppercase">
                      {v.siglaOrgao || 'PLENÁRIO'}
                    </span>
                    <span>·</span>
                    <span className="font-mono">{v.data}</span>
                    {v.aprovacao !== null && (
                      <>
                        <span>·</span>
                        <span className={v.aprovacao === 1 ? 'font-semibold text-emerald-700' : 'font-semibold text-slate-700'}>
                          {v.aprovacao === 1 ? 'Aprovado' : 'Rejeitado / Outro'}
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-slate-900 group-hover:text-blue-900 leading-snug line-clamp-2">
                    {v.descricao}
                  </h3>
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-mono text-[11px]">ID: {v.id}</span>
                    <span className="font-medium text-blue-900 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                      Ver placar e votos <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECTION C & D: Despesas Parlamentares e Emendas */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* SECTION C: Despesas Parlamentares */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                  Cota Parlamentar (CEAP)
                </span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-600">
                  Exercício 2026
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900">
                Despesas Parlamentares Auditadas
              </h2>

              <p className="text-xs text-slate-600 leading-relaxed">
                Dados contábeis das notas fiscais e reembolsos solicitados pelos deputados para manutenção de seus mandatos.
              </p>

              <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-4">
                <div>
                  <span className="text-[11px] text-slate-500 block">Total Amostrado no Período</span>
                  <span className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                    {formatCurrency(totalDespesasPeriodo)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Comprovantes Auditados</span>
                  <span className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                    {qtdDespesasPeriodo.toLocaleString('pt-BR')} notas
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => onSelectTab('gastos')}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-900 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-800 cursor-pointer"
              >
                <span>Acessar Painel Completo de Gastos</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* SECTION D: Emendas Parlamentares */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                  Orçamento Geral da União
                </span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-600">
                  CGU / SIOP
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900">
                Emendas e Execução Orçamentária
              </h2>

              <p className="text-xs text-slate-600 leading-relaxed">
                Fiscalização de emendas individuais, de bancada e de comissão. Verifique o valor previsto, empenhado e o que de fato chegou aos municípios.
              </p>

              <div className="rounded-lg bg-slate-50 p-4 text-xs text-slate-600 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Conexão Oficial com CGU:</span>
                  <span className={emendasStatusConfigurado ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                    {emendasStatusConfigurado ? 'Ativa em tempo real' : 'Chave CGU em configuração'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  O módulo de emendas integra os dados da Controladoria-Geral da União mantendo transparência irrestrita.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => onSelectTab('emendas')}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-800 transition hover:bg-slate-50 cursor-pointer"
              >
                <span>Consultar Emendas e Beneficiários</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* SECTION E: Entenda os Dados */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="h-5 w-5 text-blue-900" />
            <h2 className="text-lg font-bold text-slate-900">
              Entenda os Dados: Guia Cidadão de Interpretação
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 text-xs text-slate-600">
            <div className="space-y-1.5 rounded-lg border border-slate-100 bg-slate-50/50 p-4">
              <span className="font-bold text-slate-900 block text-sm">Voto Nominal</span>
              <p>
                Registro individual eletrônico (Sim, Não, Abstenção ou Obstrução). Permite saber com exatidão a posição do parlamentar na votação.
              </p>
            </div>

            <div className="space-y-1.5 rounded-lg border border-slate-100 bg-slate-50/50 p-4">
              <span className="font-bold text-slate-900 block text-sm">Ausência de Registro</span>
              <p>
                Nem toda deliberação gera voto nominal. Votações simbólicas ou por aclamação não registram votos individuais. Isso não é voto contrário.
              </p>
            </div>

            <div className="space-y-1.5 rounded-lg border border-slate-100 bg-slate-50/50 p-4">
              <span className="font-bold text-slate-900 block text-sm">Cota Parlamentar (CEAP)</span>
              <p>
                Verba indenizatória legal com comprovantes fiscais auditados. O valor varia por estado de origem para cobrir passagens aéreas.
              </p>
            </div>

            <div className="space-y-1.5 rounded-lg border border-slate-100 bg-slate-50/50 p-4">
              <span className="font-bold text-slate-900 block text-sm">Previsto vs Pago</span>
              <p>
                Uma emenda prevista na lei orçamentária só é efetivamente concluída quando alcança o status 'Pago', com depósito ao município.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION F: Seção de Fontes Oficiais */}
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Fontes Governamentais Oficiais
              </h3>
              <p className="mt-1 text-slate-600">
                O VOCÊ ON não hospeda banco de dados proprietário e consome diretamente os seguintes portais públicos da União:
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="https://dadosabertos.camara.leg.br"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 hover:text-blue-900"
              >
                <span>Câmara dos Deputados</span>
                <ExternalLink className="h-3 w-3 text-slate-400" />
              </a>

              <a
                href="https://www12.senado.leg.br/dados-abertos"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 hover:text-blue-900"
              >
                <span>Senado Federal</span>
                <ExternalLink className="h-3 w-3 text-slate-400" />
              </a>

              <a
                href="https://portaldatransparencia.gov.br"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 hover:text-blue-900"
              >
                <span>Portal da Transparência</span>
                <ExternalLink className="h-3 w-3 text-slate-400" />
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
