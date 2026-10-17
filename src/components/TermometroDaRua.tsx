/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  CheckCircle2,
  ExternalLink,
  MapPin,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Calendar,
  Users,
  AlertCircle,
  Send,
  HelpCircle,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import {
  fetchEnqueteAtiva,
  fetchHistoricoEnquetes,
  votarEnquete,
  comentarEnquete,
  gerarEnqueteIA,
} from '../services/api';
import { Enquete, ComentarioEnquete } from '../types';
import { AdSlot } from './AdSlot';

const ESTADOS_BRASIL = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR',
  'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
];

export const TermometroDaRua: React.FC = () => {
  const [enqueteAtiva, setEnqueteAtiva] = useState<Enquete | null>(null);
  const [historico, setHistorico] = useState<Enquete[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Voting state
  const [alternativaSelecionada, setAlternativaSelecionada] = useState<string>('');
  const [ufSelecionada, setUfSelecionada] = useState<string>('');
  const [jaVotou, setJaVotou] = useState(false);
  const [enviandoVoto, setEnviandoVoto] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  // Regional view tab
  const [modoRegional, setModoRegional] = useState(false);

  // Comments state
  const [comentarios, setComentarios] = useState<ComentarioEnquete[]>([]);
  const [novoAutor, setNovoAutor] = useState('');
  const [novoTexto, setNovoTexto] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);

  // AI Generator state
  const [gerandoIA, setGerandoIA] = useState(false);

  const carregarDados = async () => {
    setCarregando(true);
    setErro(null);
    try {
      const [resAtiva, resHist] = await Promise.all([
        fetchEnqueteAtiva(),
        fetchHistoricoEnquetes(),
      ]);
      setEnqueteAtiva(resAtiva.enquete);
      setComentarios(resAtiva.enquete.comentarios || []);
      setHistorico(resHist.enquetes.filter((e) => e.id !== resAtiva.enquete.id));

      // Check if already voted in localStorage for this poll
      if (resAtiva.enquete) {
        const votedKey = `voceon_voted_${resAtiva.enquete.id}`;
        if (localStorage.getItem(votedKey)) {
          setJaVotou(true);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar enquetes:', err);
      setErro('Não foi possível carregar as enquetes do Termômetro da Rua.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleVotar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enqueteAtiva || !alternativaSelecionada) return;

    setEnviandoVoto(true);
    setErro(null);
    try {
      let voterToken = localStorage.getItem('voceon_voter_token');
      if (!voterToken) {
        voterToken = 'voter_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem('voceon_voter_token', voterToken);
      }

      const res = await votarEnquete({
        enqueteId: enqueteAtiva.id,
        alternativaId: alternativaSelecionada,
        uf: ufSelecionada || undefined,
        voterToken,
      });

      setEnqueteAtiva(res.enquete);
      setJaVotou(true);
      localStorage.setItem(`voceon_voted_${enqueteAtiva.id}`, 'true');
      setMensagemSucesso('Seu voto foi registrado com sucesso e computado no painel!');
    } catch (err: any) {
      setErro(err.message || 'Erro ao registrar voto.');
    } finally {
      setEnviandoVoto(false);
    }
  };

  const handleComentar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enqueteAtiva || !novoTexto.trim()) return;

    setEnviandoComentario(true);
    try {
      const res = await comentarEnquete({
        enqueteId: enqueteAtiva.id,
        autorNome: novoAutor.trim() || 'Cidadão Verificado',
        uf: ufSelecionada || undefined,
        texto: novoTexto.trim(),
      });
      setComentarios(res.comentarios);
      setNovoTexto('');
      setNovoAutor('');
    } catch (err: any) {
      setErro(err.message || 'Erro ao enviar comentário.');
    } finally {
      setEnviandoComentario(false);
    }
  };

  const handleGerarIA = async () => {
    setGerandoIA(true);
    try {
      await gerarEnqueteIA();
      await carregarDados();
      alert('Nova enquete gerada e programada com sucesso via inteligência artificial!');
    } catch (err: any) {
      alert(err.message || 'Erro ao gerar enquete via IA.');
    } finally {
      setGerandoIA(false);
    }
  };

  const calcularPercentual = (votos: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((votos / total) * 100);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-900 uppercase tracking-wide">
                Painel Cidadão Diário
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Termômetro da Rua
            </h1>
            <p className="mt-1 text-sm text-slate-600 max-w-3xl">
              Participe da enquete diária sobre temas fundamentais em debate no Congresso Nacional. Resposta anônima, segura e auditada.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleGerarIA}
              disabled={gerandoIA}
              className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-semibold text-blue-900 hover:bg-blue-100 transition cursor-pointer"
              title="Gerar sugestão de enquete via inteligência artificial (Gemini API)"
            >
              <Sparkles className={`h-4 w-4 text-blue-700 ${gerandoIA ? 'animate-spin' : ''}`} />
              <span>Sugerir Enquete via IA</span>
            </button>
          </div>
        </div>
      </div>

      {carregando && (
        <div className="py-20 text-center text-sm text-slate-500">
          <RefreshCw className="mx-auto h-6 w-6 animate-spin text-blue-900 mb-2" />
          Carregando enquete ativa do Termômetro da Rua...
        </div>
      )}

      {erro && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
          {erro}
        </div>
      )}

      {!carregando && enqueteAtiva && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Main Poll Card (Left 8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-900" />
                  <span>Publicado em {new Date(enqueteAtiva.dataPublicacao).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Enquete Ativa</span>
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                {enqueteAtiva.pergunta}
              </h2>

              <p className="mt-3 text-sm text-slate-600 leading-relaxed bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                {enqueteAtiva.contexto}
              </p>

              {/* Fontes oficiais da pauta */}
              {enqueteAtiva.fontesOficiais && enqueteAtiva.fontesOficiais.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Fontes Oficiais:</span>
                  {enqueteAtiva.fontesOficiais.map((f, idx) => (
                    <a
                      key={idx}
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-blue-900 hover:underline font-medium"
                    >
                      <span>{f.nome}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ))}
                </div>
              )}

              {/* VOTE FORM or RESULTS VIEW */}
              {!jaVotou ? (
                <form onSubmit={handleVotar} className="mt-8 space-y-6 border-t border-slate-100 pt-6">
                  <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Selecione sua resposta:
                    </label>
                    {enqueteAtiva.alternativas.map((alt) => (
                      <label
                        key={alt.id}
                        className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition ${
                          alternativaSelecionada === alt.id
                            ? 'border-blue-900 bg-blue-50/50 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="alternativa"
                            value={alt.id}
                            checked={alternativaSelecionada === alt.id}
                            onChange={() => setAlternativaSelecionada(alt.id)}
                            className="h-4 w-4 text-blue-900 focus:ring-blue-900"
                          />
                          <span className="text-sm font-medium text-slate-900">{alt.texto}</span>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Optional UF selector */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <MapPin className="h-4 w-4 text-blue-900" />
                      <span>Deseja informar seu estado para participar do panorama regional? (Opcional)</span>
                    </div>
                    <select
                      value={ufSelecionada}
                      onChange={(e) => setUfSelecionada(e.target.value)}
                      className="w-full sm:w-64 rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-900"
                    >
                      <option value="">Não informar estado</option>
                      {ESTADOS_BRASIL.map((uf) => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                  </div>

                  {mensagemSucesso && (
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
                      {mensagemSucesso}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-slate-500">
                      * Votação anônima protegida contra duplicidade.
                    </span>
                    <button
                      type="submit"
                      disabled={!alternativaSelecionada || enviandoVoto}
                      className="rounded-xl bg-blue-900 px-6 py-3 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-50 cursor-pointer shadow-md"
                    >
                      {enviandoVoto ? 'Registrando...' : 'Registrar meu voto'}
                    </button>
                  </div>
                </form>
              ) : (
                /* RESULTS PANEL */
                <div className="mt-8 space-y-6 border-t border-slate-100 pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <h3 className="text-base font-bold text-slate-900">
                        Resultados do Termômetro da Rua
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Users className="h-4 w-4" />
                      <span><strong>{enqueteAtiva.totalVotos.toLocaleString('pt-BR')}</strong> votos válidos</span>
                    </div>
                  </div>

                  {/* Bars */}
                  <div className="space-y-4">
                    {enqueteAtiva.alternativas.map((alt) => {
                      const pct = calcularPercentual(alt.votos, enqueteAtiva.totalVotos);
                      return (
                        <div key={alt.id} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-medium text-slate-800">
                            <span>{alt.texto}</span>
                            <span className="font-mono font-bold tabular-nums">
                              {pct}% ({alt.votos.toLocaleString('pt-BR')} votos)
                            </span>
                          </div>
                          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full bg-blue-900 transition-all duration-1000"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Regional Breakdown toggle */}
                  {enqueteAtiva.porUf && Object.keys(enqueteAtiva.porUf).length > 0 && (
                    <div className="pt-4 border-t border-slate-100">
                      <button
                        onClick={() => setModoRegional(!modoRegional)}
                        className="text-xs font-semibold text-blue-900 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{modoRegional ? 'Ocultar panorama regional por UF' : 'Ver panorama por Estado (UF)'}</span>
                      </button>

                      {modoRegional && (
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {Object.entries(enqueteAtiva.porUf).map(([uf, votosAlt]) => {
                            const totalUf = Object.values(votosAlt).reduce((a, b) => a + b, 0);
                            return (
                              <div key={uf} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                                <div className="font-bold text-slate-900 mb-1">Estado: {uf} ({totalUf} votos)</div>
                                {Object.entries(votosAlt).map(([altId, qtd]) => {
                                  const altObj = enqueteAtiva.alternativas.find((a) => a.id === altId);
                                  const pUf = calcularPercentual(qtd, totalUf);
                                  return (
                                    <div key={altId} className="flex justify-between text-[11px] text-slate-600">
                                      <span className="truncate max-w-[120px]">{altObj?.texto || altId}:</span>
                                      <span className="font-mono font-semibold">{pUf}%</span>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mandatory Disclaimer */}
                  <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-xs text-blue-900 leading-relaxed">
                    <strong className="font-semibold">Nota Metodológica: </strong>
                    Resultado entre os participantes desta enquete. Não representa necessariamente a opinião científica de toda a população brasileira.
                  </div>
                </div>
              )}
            </div>

            {/* COMMENTS SECTION */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <MessageSquare className="h-5 w-5 text-blue-900" />
                <h3 className="text-base font-bold text-slate-900">
                  Debate Cidadão ({comentarios.length} comentários)
                </h3>
              </div>

              <p className="text-xs text-slate-500">
                Espaço moderado para reflexão cívica. O envio de comentários é totalmente opcional e não interfere na votação.
              </p>

              {/* Comment Form */}
              <form onSubmit={handleComentar} className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={novoAutor}
                    onChange={(e) => setNovoAutor(e.target.value)}
                    placeholder="Seu nome ou apelido cívico"
                    maxLength={40}
                    className="rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-blue-900"
                  />
                  <select
                    value={ufSelecionada}
                    onChange={(e) => setUfSelecionada(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-blue-900"
                  >
                    <option value="">UF (Opcional)</option>
                    {ESTADOS_BRASIL.map((uf) => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                </div>

                <textarea
                  value={novoTexto}
                  onChange={(e) => setNovoTexto(e.target.value)}
                  placeholder="Escreva seu comentário de forma respeitosa (máx. 500 caracteres)..."
                  maxLength={500}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-900"
                />

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Sujeito à moderação automática contra spam e ofensas.
                  </span>
                  <button
                    type="submit"
                    disabled={!novoTexto.trim() || enviandoComentario}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-900 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="h-3 w-3" />
                    <span>Publicar Comentário</span>
                  </button>
                </div>
              </form>

              {/* Comments list */}
              <div className="space-y-3">
                {comentarios.map((c) => (
                  <div key={c.id} className="rounded-xl border border-slate-100 bg-white p-4 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">
                        {c.autorNome} {c.uf ? `(${c.uf})` : ''}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {new Date(c.dataHora).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {c.texto}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar / Archive (Right 4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
                Enquetes Anteriores (Histórico)
              </h3>

              {historico.length === 0 && (
                <p className="text-xs text-slate-500">Nenhuma outra enquete encerrada no momento.</p>
              )}

              <div className="space-y-4">
                {historico.map((past) => (
                  <div key={past.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{new Date(past.dataPublicacao).toLocaleDateString('pt-BR')}</span>
                      <span className="font-semibold text-slate-700">{past.totalVotos.toLocaleString('pt-BR')} votos</span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-900 leading-snug">
                      {past.pergunta}
                    </h4>
                    <div className="space-y-1 pt-1">
                      {past.alternativas.map((alt) => {
                        const pct = calcularPercentual(alt.votos, past.totalVotos);
                        return (
                          <div key={alt.id} className="flex justify-between text-[11px] text-slate-600">
                            <span className="truncate max-w-[180px]">{alt.texto}</span>
                            <span className="font-mono font-bold">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <AdSlot slot="content_middle" />
          </div>
        </div>
      )}
    </div>
  );
};
