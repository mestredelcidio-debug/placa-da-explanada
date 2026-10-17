/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ExternalLink,
  Calendar,
  Building2,
  FileText,
  User,
  Info,
  ChevronRight,
  ArrowLeft,
  X,
} from 'lucide-react';
import {
  buscarParlamentares,
  fetchVotacoesSenador,
  fetchVotacoesRecentes,
  fetchVotosDaVotacao,
  fetchDetalhesVotacao,
} from '../services/api';
import { Parlamentar, VotacaoResumo, VotoRegistro, TipoVoto } from '../types';
import { AdSlot } from './AdSlot';

const ESTADOS_BRASIL = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR',
  'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
];

interface ComoVotouProps {
  initialSearchQuery?: string;
}

export const ComoVotou: React.FC<ComoVotouProps> = ({ initialSearchQuery = '' }) => {
  const [activeMode, setActiveMode] = useState<'parlamentar' | 'plenario'>('parlamentar');

  // Search & Filter state
  const [nomeQuery, setNomeQuery] = useState(initialSearchQuery);
  const [ufFiltro, setUfFiltro] = useState<string>('');
  const [casaFiltro, setCasaFiltro] = useState<'ambas' | 'camara' | 'senado'>('ambas');

  // Parliamentarians search state
  const [parlamentares, setParlamentares] = useState<Parlamentar[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [selectedParlamentar, setSelectedParlamentar] = useState<Parlamentar | null>(null);

  // Votes for selected parliamentarian
  const [votosParlamentar, setVotosParlamentar] = useState<any[]>([]);
  const [carregandoVotos, setCarregandoVotos] = useState(false);
  const [filtroAnoVotos, setFiltroAnoVotos] = useState<string>('todos');

  // Plenary votes state
  const [votacoesPlenario, setVotacoesPlenario] = useState<VotacaoResumo[]>([]);
  const [carregandoPlenario, setCarregandoPlenario] = useState(false);
  const [selectedVotacao, setSelectedVotacao] = useState<VotacaoResumo | null>(null);
  const [votosDaSessao, setVotosDaSessao] = useState<VotoRegistro[]>([]);
  const [carregandoVotosSessao, setCarregandoVotosSessao] = useState(false);
  const [filtroTipoVotoSessao, setFiltroTipoVotoSessao] = useState<string>('todos');
  const [filtroUfSessao, setFiltroUfSessao] = useState<string>('todos');

  // Project detail modal
  const [modalProjeto, setModalProjeto] = useState<any | null>(null);

  // Search parliamentarians
  const executarBusca = async () => {
    setBuscando(true);
    try {
      const res = await buscarParlamentares({
        nome: nomeQuery,
        uf: ufFiltro,
        casa: casaFiltro,
      });
      const uniqueMap = new Map<string, Parlamentar>();
      for (const p of (res.dados || [])) {
        const key = `${p.casa}_${p.id}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, p);
        }
      }
      setParlamentares(Array.from(uniqueMap.values()));
    } catch (err) {
      console.error('Erro ao buscar parlamentares:', err);
    } finally {
      setBuscando(false);
    }
  };

  useEffect(() => {
    executarBusca();
  }, [ufFiltro, casaFiltro]);

  // Load plenary votes when tab switches to 'plenario'
  useEffect(() => {
    if (activeMode === 'plenario' && votacoesPlenario.length === 0) {
      carregarVotacoesPlenario();
    }
  }, [activeMode]);

  const carregarVotacoesPlenario = async () => {
    setCarregandoPlenario(true);
    try {
      const res = await fetchVotacoesRecentes(25);
      setVotacoesPlenario(res.dados || []);
    } catch (err) {
      console.error('Erro ao carregar votações do plenário:', err);
    } finally {
      setCarregandoPlenario(false);
    }
  };

  // When a parliamentarian is clicked, load their votes
  const handleSelectParlamentar = async (parlamentar: Parlamentar) => {
    setSelectedParlamentar(parlamentar);
    setCarregandoVotos(true);
    setVotosParlamentar([]);

    try {
      if (parlamentar.casa === 'senado') {
        const res = await fetchVotacoesSenador(parlamentar.id);
        setVotosParlamentar(res.dados || []);
      } else {
        // For deputados, we query recent plenary votações and match this deputy's votes
        // Fetch recent votações and check this deputy's votes
        const votacoesRes = await fetchVotacoesRecentes(15);
        const depVotos: any[] = [];

        // Check recent votações for this deputy's vote
        for (const v of votacoesRes.dados.slice(0, 10)) {
          try {
            const vData = await fetchVotosDaVotacao(v.id);
            if (vData.isNominal && vData.dados.length > 0) {
              const depVote = vData.dados.find(
                (voto) => String(voto.idParlamentar) === String(parlamentar.id)
              );
              depVotos.push({
                id: v.id,
                casa: 'camara',
                data: v.data,
                descricao: v.descricao,
                proposicaoTitulo: v.proposicaoObjeto || 'Matéria Legislativa em Plenário',
                ementa: v.descricao,
                resultado: v.aprovacao === 1 ? 'Aprovado' : v.aprovacao === 0 ? 'Rejeitado' : 'Concluído',
                voto: depVote ? depVote.voto : 'Não informado ou não participou',
                linkOficial: v.linkOficial,
              });
            }
          } catch {
            // continue
          }
        }
        setVotosParlamentar(depVotos);
      }
    } catch (err) {
      console.error('Erro ao carregar votações do parlamentar:', err);
    } finally {
      setCarregandoVotos(false);
    }
  };

  // Inspect full session votes
  const handleSelectVotacaoSessao = async (votacao: VotacaoResumo) => {
    setSelectedVotacao(votacao);
    setCarregandoVotosSessao(true);
    setVotosDaSessao([]);
    try {
      const res = await fetchVotosDaVotacao(votacao.id);
      setVotosDaSessao(res.dados || []);
    } catch (err) {
      console.error('Erro ao buscar votos da votação:', err);
    } finally {
      setCarregandoVotosSessao(false);
    }
  };

  // Format vote pill
  const renderVoteBadge = (voto: string) => {
    const v = voto.toLowerCase().trim();
    if (v === 'sim') {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          SIM
        </span>
      );
    }
    if (v === 'não' || v === 'nao') {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800 border border-slate-300">
          <XCircle className="h-3 w-3 text-slate-600" />
          NÃO
        </span>
      );
    }
    if (v.includes('absten')) {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
          <HelpCircle className="h-3 w-3 text-amber-600" />
          ABSTENÇÃO
        </span>
      );
    }
    if (v.includes('obstru')) {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-800 border border-purple-200">
          OBSTRUÇÃO
        </span>
      );
    }
    if (v.includes('ausente')) {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 border border-slate-200">
          Ausente confirmada
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded bg-slate-50 px-2 py-0.5 text-xs text-slate-500 border border-slate-200">
        Não informado / Sem registro
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Como votou?
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Consulte as votações nominais oficiais de Deputados Federais e Senadores, com verificação individual e explicação factual das proposições.
            </p>
          </div>

          {/* Mode switch */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 shrink-0">
            <button
              onClick={() => {
                setActiveMode('parlamentar');
                setSelectedVotacao(null);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                activeMode === 'parlamentar'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pesquisar Parlamentar
            </button>
            <button
              onClick={() => {
                setActiveMode('plenario');
                setSelectedParlamentar(null);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                activeMode === 'plenario'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Votações do Plenário
            </button>
          </div>
        </div>
      </div>

      {/* MODE 1: Pesquisa de Parlamentar */}
      {activeMode === 'parlamentar' && !selectedParlamentar && (
        <div className="mt-8 space-y-6">
          {/* Search Controls */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="md:col-span-6">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nome do Deputado ou Senador
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={nomeQuery}
                    onChange={(e) => setNomeQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && executarBusca()}
                    placeholder="Ex: Rodrigo Pacheco, Arthur Lira, Tabata Amaral..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Estado (UF)
                </label>
                <select
                  value={ufFiltro}
                  onChange={(e) => setUfFiltro(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-sm text-slate-900 focus:border-blue-900 focus:bg-white focus:outline-none"
                >
                  <option value="">Todos os estados</option>
                  {ESTADOS_BRASIL.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Casa Legislativa
                </label>
                <select
                  value={casaFiltro}
                  onChange={(e) => setCasaFiltro(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-sm text-slate-900 focus:border-blue-900 focus:bg-white focus:outline-none"
                >
                  <option value="ambas">Câmara e Senado</option>
                  <option value="camara">Câmara dos Deputados</option>
                  <option value="senado">Senado Federal</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-xs text-slate-500">
                {buscando ? 'Consultando bases oficiais...' : `${parlamentares.length} parlamentares encontrados`}
              </span>
              <button
                onClick={executarBusca}
                disabled={buscando}
                className="rounded-lg bg-blue-900 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 focus:outline-none cursor-pointer"
              >
                {buscando ? 'Buscando...' : 'Filtrar Parlamentares'}
              </button>
            </div>
          </div>

          {/* Parliamentarians Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {parlamentares.map((p, index) => (
              <div
                key={`${p.casa}_${p.id}_${index}`}
                onClick={() => handleSelectParlamentar(p)}
                className="group flex cursor-pointer items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-blue-900 hover:shadow-md"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100 border border-slate-200">
                  {p.urlFoto ? (
                    <img
                      src={p.urlFoto}
                      alt={p.nome}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover object-top"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                      <User className="h-8 w-8" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-blue-900 uppercase">
                      {p.casa === 'senado' ? 'Senador(a)' : 'Deputado(a) Federal'}
                    </span>
                    <span>·</span>
                    <span>{p.siglaUf}</span>
                    {p.siglaPartido && (
                      <>
                        <span>·</span>
                        <span className="font-medium text-slate-700">{p.siglaPartido}</span>
                      </>
                    )}
                  </div>
                  <h3 className="mt-1 truncate text-base font-semibold text-slate-900 group-hover:text-blue-900">
                    {p.nome}
                  </h3>
                  <div className="mt-2 flex items-center gap-1 text-xs font-medium text-blue-900">
                    <span>Ver histórico de votos</span>
                    <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {parlamentares.length === 0 && !buscando && (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
              <Search className="mx-auto h-8 w-8 text-slate-300" />
              <h3 className="mt-3 text-base font-semibold text-slate-900">
                Nenhum parlamentar encontrado
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                Tente ajustar o termo de busca, remover o filtro de estado ou alternar entre Câmara e Senado.
              </p>
            </div>
          )}

          <AdSlot slot="content_middle" />
        </div>
      )}

      {/* PARLAMENTAR SELECIONADO: Detalhes e Votos */}
      {activeMode === 'parlamentar' && selectedParlamentar && (
        <div className="mt-6 space-y-6">
          {/* Back button */}
          <button
            onClick={() => setSelectedParlamentar(null)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-900 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para a lista de parlamentares</span>
          </button>

          {/* Parlamentar Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                {selectedParlamentar.urlFoto ? (
                  <img
                    src={selectedParlamentar.urlFoto}
                    alt={selectedParlamentar.nome}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover object-top"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                    <User className="h-10 w-10" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-blue-900 uppercase">
                    {selectedParlamentar.casa === 'senado' ? 'Senado Federal' : 'Câmara dos Deputados'}
                  </span>
                  <span>·</span>
                  <span>Estado: <strong>{selectedParlamentar.siglaUf}</strong></span>
                  {selectedParlamentar.siglaPartido && (
                    <>
                      <span>·</span>
                      <span>Partido: <strong>{selectedParlamentar.siglaPartido}</strong></span>
                    </>
                  )}
                </div>

                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  {selectedParlamentar.nome}
                </h2>

                {selectedParlamentar.email && (
                  <p className="mt-1 text-xs text-slate-500 font-mono">
                    {selectedParlamentar.email}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <Info className="h-3.5 w-3.5 text-slate-400" />
                    Votações nominais registradas nos dados abertos oficiais
                  </span>
                  {selectedParlamentar.uri && (
                    <a
                      href={selectedParlamentar.uri}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-blue-900 hover:underline"
                    >
                      <span>Perfil oficial</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Votações list */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Histórico de Votos Nominais Registrados
              </h3>
              <span className="text-xs text-slate-500">
                {carregandoVotos ? 'Carregando votações...' : `${votosParlamentar.length} registros`}
              </span>
            </div>

            {carregandoVotos && (
              <div className="py-12 text-center text-sm text-slate-500">
                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-blue-900 border-t-transparent mb-2" />
                Obtendo histórico de votações nominais diretamente da API oficial...
              </div>
            )}

            {!carregandoVotos && votosParlamentar.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 text-xs">
                Nenhuma votação nominal recente identificada para este parlamentar no período consultado.
                <p className="mt-1 text-[11px] text-slate-400">
                  Nota: Muitas deliberações ocorrem por votação simbólica ou por acordo de líderes, sem registro nominal individual de cada parlamentar no painel.
                </p>
              </div>
            )}

            {!carregandoVotos && votosParlamentar.length > 0 && (
              <div className="space-y-3">
                {votosParlamentar.map((v, index) => (
                  <div
                    key={`${v.id}_${index}`}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1.5 max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1 font-mono">
                            <Calendar className="h-3 w-3" />
                            {v.data}
                          </span>
                          {v.materiaIdentificacao && (
                            <>
                              <span>·</span>
                              <span className="font-semibold text-slate-900">
                                {v.materiaIdentificacao}
                              </span>
                            </>
                          )}
                          <span>·</span>
                          <span>Resultado: <strong>{v.resultado}</strong></span>
                        </div>

                        <h4 className="text-sm font-semibold text-slate-900 leading-snug">
                          {v.descricao}
                        </h4>

                        {v.ementa && v.ementa !== v.descricao && (
                          <p className="text-xs text-slate-600 line-clamp-2">
                            {v.ementa}
                          </p>
                        )}
                      </div>

                      {/* Voto Badge */}
                      <div className="flex flex-col sm:items-end gap-2 shrink-0">
                        <div className="text-xs text-slate-500">Voto registrado:</div>
                        {renderVoteBadge(v.voto)}
                        {v.linkOficial && (
                          <a
                            href={v.linkOficial}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-[11px] text-blue-900 hover:underline"
                          >
                            <span>Fonte oficial</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: Votações do Plenário (Roll-Call) */}
      {activeMode === 'plenario' && !selectedVotacao && (
        <div className="mt-8 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900">
              Votações Nominais Recentes no Plenário
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Selecione uma deliberação do Plenário para consultar o placar geral e como cada deputado votou individualmente.
            </p>
          </div>

          {carregandoPlenario && (
            <div className="py-12 text-center text-sm text-slate-500">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-blue-900 border-t-transparent mb-2" />
              Carregando deliberações oficiais da Câmara dos Deputados...
            </div>
          )}

          {!carregandoPlenario && (
            <div className="space-y-4">
              {votacoesPlenario.map((votacao) => (
                <div
                  key={votacao.id}
                  onClick={() => handleSelectVotacaoSessao(votacao)}
                  className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-blue-900 hover:shadow-md"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1.5 max-w-3xl">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-blue-900 uppercase">
                          {votacao.siglaOrgao || 'PLENÁRIO'}
                        </span>
                        <span>·</span>
                        <span className="font-mono">{votacao.data}</span>
                        {votacao.aprovacao !== null && (
                          <>
                            <span>·</span>
                            <span className={votacao.aprovacao === 1 ? 'font-semibold text-emerald-700' : 'font-semibold text-slate-700'}>
                              {votacao.aprovacao === 1 ? 'Aprovado' : 'Rejeitado / Outro'}
                            </span>
                          </>
                        )}
                      </div>

                      <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-900">
                        {votacao.descricao}
                      </h3>

                      {votacao.proposicaoTitulo && (
                        <p className="text-xs text-slate-600">
                          {votacao.proposicaoTitulo}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-xs font-semibold text-blue-900 shrink-0">
                      <span>Ver Votos Nominais</span>
                      <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SESSÃO DE PLENÁRIO SELECIONADA: Votos Nominais de Todos os Deputados */}
      {activeMode === 'plenario' && selectedVotacao && (
        <div className="mt-6 space-y-6">
          <button
            onClick={() => setSelectedVotacao(null)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-900 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para as votações do plenário</span>
          </button>

          {/* Votação Overview */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-bold text-blue-900 uppercase">Câmara dos Deputados</span>
              <span>·</span>
              <span className="font-mono">{selectedVotacao.data}</span>
              <span>·</span>
              <span>Órgão: <strong>{selectedVotacao.siglaOrgao || 'Plenário'}</strong></span>
            </div>
            <h2 className="mt-2 text-xl font-bold text-slate-900">
              {selectedVotacao.descricao}
            </h2>

            {/* Links and Actions */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
              <a
                href={selectedVotacao.linkOficial}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-blue-900 hover:underline"
              >
                <span>Ata e Detalhes no Portal da Câmara</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Placar e Filtros */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Placar Geral dos Votos Registrados ({votosDaSessao.length} votos)
                </h3>
                <p className="text-xs text-slate-500">
                  Filtre os deputados por voto ou por unidade da federação.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={filtroTipoVotoSessao}
                  onChange={(e) => setFiltroTipoVotoSessao(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-xs font-medium text-slate-800"
                >
                  <option value="todos">Todos os votos</option>
                  <option value="sim">Apenas SIM</option>
                  <option value="não">Apenas NÃO</option>
                  <option value="abstenção">Apenas Abstenção</option>
                  <option value="obstrução">Apenas Obstrução</option>
                </select>

                <select
                  value={filtroUfSessao}
                  onChange={(e) => setFiltroUfSessao(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-xs font-medium text-slate-800"
                >
                  <option value="todos">Todos os estados</option>
                  {ESTADOS_BRASIL.map((uf) => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>
            </div>

            {carregandoVotosSessao && (
              <div className="py-12 text-center text-sm text-slate-500">
                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-blue-900 border-t-transparent mb-2" />
                Carregando registros individuais de cada deputado...
              </div>
            )}

            {!carregandoVotosSessao && votosDaSessao.length === 0 && (
              <div className="mt-4 rounded-lg bg-slate-50 p-6 text-center text-xs text-slate-500">
                Esta deliberação foi concluída por votação simbólica ou não registrou votos nominais individuais no sistema eletrônico.
              </div>
            )}

            {!carregandoVotosSessao && votosDaSessao.length > 0 && (
              <div className="mt-6 divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200">
                <div className="grid grid-cols-12 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase">
                  <div className="col-span-6 sm:col-span-5">Deputado(a)</div>
                  <div className="col-span-3 sm:col-span-3">Partido / UF</div>
                  <div className="col-span-3 sm:col-span-4 text-right">Voto Oficial</div>
                </div>

                <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-100">
                  {votosDaSessao
                    .filter((v) => {
                      if (filtroTipoVotoSessao !== 'todos') {
                        if (!v.voto.toLowerCase().includes(filtroTipoVotoSessao.toLowerCase())) {
                          return false;
                        }
                      }
                      if (filtroUfSessao !== 'todos') {
                        if (v.siglaUf !== filtroUfSessao) return false;
                      }
                      return true;
                    })
                    .map((voto, index) => (
                      <div
                        key={`${voto.idParlamentar}_${index}`}
                        className="grid grid-cols-12 items-center px-4 py-2 text-sm hover:bg-slate-50/80"
                      >
                        <div className="col-span-6 sm:col-span-5 flex items-center gap-3">
                          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                            {voto.urlFoto ? (
                              <img
                                src={voto.urlFoto}
                                alt={voto.nomeParlamentar}
                                referrerPolicy="no-referrer"
                                className="h-full w-full object-cover object-top"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-400">
                                <User className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                          <span className="font-medium text-slate-900 truncate">
                            {voto.nomeParlamentar}
                          </span>
                        </div>

                        <div className="col-span-3 sm:col-span-3 text-xs text-slate-600">
                          <span className="font-semibold text-slate-800">{voto.siglaPartido || '—'}</span>
                          <span className="text-slate-400"> / </span>
                          <span>{voto.siglaUf}</span>
                        </div>

                        <div className="col-span-3 sm:col-span-4 text-right">
                          {renderVoteBadge(voto.voto)}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
