/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Parlamentar,
  VotacaoResumo,
  VotoRegistro,
  DespesaItem,
  DespesaRankingItem,
  EmendaItem,
  StatusFonte,
  Enquete,
  ComentarioEnquete,
} from '../types';

export interface RespostaParlamentares {
  dados: Parlamentar[];
  total: number;
}

export interface RespostaDespesasDeputado {
  dados: DespesaItem[];
  totalGeral: number;
  categoriaTotais: Record<string, number>;
  ano: number;
  mes: number | null;
  atualizadoEm: string;
}

export interface RespostaVotacoesSenador {
  dados: Array<{
    id: string;
    casa: 'senado';
    data: string;
    hora?: string;
    descricao: string;
    materiaIdentificacao: string;
    ementa: string;
    resultado: string;
    voto: string;
    secreta: boolean;
    linkOficial: string;
  }>;
  total: number;
  atualizadoEm: string;
}

export interface RespostaVotosVotacao {
  dados: VotoRegistro[];
  totalVotos: number;
  isNominal: boolean;
  contagem: Record<string, number>;
  atualizadoEm: string;
}

export interface RespostaRankingGastos {
  ranking: DespesaRankingItem[];
  totalRegistrado: number;
  totalDespesasEncontradas: number;
  parlamentaresAmostrados: number;
  ano: number;
  mes: number | null;
  uf: string | null;
  atualizadoEm: string;
  avisoMetodologico: string;
}

export interface RespostaEmendas {
  status?: string;
  configurado: boolean;
  mensagem?: string;
  instrucoesCadastro?: {
    passo1: string;
    passo2: string;
    passo3: string;
  };
  dados: EmendaItem[];
  total?: number;
  pagina?: number;
  exercicio?: number;
  consultadoEm?: string;
  atualizadoEm?: string;
  resumoFinanceiro?: {
    valorPrevisto: number | null;
    valorEmpenhado: number | null;
    valorLiquidado: number | null;
    valorPago: number | null;
    observacao?: string;
  };
  fonte?: {
    nome: string;
    endpoint: string;
    url: string;
  };
  fontesOficiaisComplementares?: Array<{
    nome: string;
    url: string;
  }>;
}

export interface RespostaStatusFontes {
  timestamp: string;
  fontes: StatusFonte[];
}

export async function fetchStatusFontes(): Promise<RespostaStatusFontes> {
  const res = await fetch('/api/status-fontes');
  if (!res.ok) throw new Error('Falha ao obter status das fontes');
  return res.json();
}

export async function buscarParlamentares(params: {
  nome?: string;
  uf?: string;
  casa?: 'camara' | 'senado' | 'ambas';
}): Promise<RespostaParlamentares> {
  const query = new URLSearchParams();
  if (params.nome) query.set('nome', params.nome);
  if (params.uf) query.set('uf', params.uf);
  if (params.casa) query.set('casa', params.casa);

  const res = await fetch(`/api/parlamentares?${query.toString()}`);
  if (!res.ok) throw new Error('Falha ao consultar parlamentares');
  return res.json();
}

export async function fetchDetalhesDeputado(id: string | number) {
  const res = await fetch(`/api/deputados/${id}`);
  if (!res.ok) throw new Error('Falha ao carregar detalhes do deputado');
  return res.json();
}

export async function fetchDespesasDeputado(
  id: string | number,
  ano: number = 2026,
  mes?: number
): Promise<RespostaDespesasDeputado> {
  const query = new URLSearchParams({ ano: String(ano) });
  if (mes) query.set('mes', String(mes));

  const res = await fetch(`/api/deputados/${id}/despesas?${query.toString()}`);
  if (!res.ok) throw new Error('Falha ao carregar despesas do deputado');
  return res.json();
}

export async function fetchDetalhesSenador(id: string | number) {
  const res = await fetch(`/api/senadores/${id}`);
  if (!res.ok) throw new Error('Falha ao carregar detalhes do senador');
  return res.json();
}

export async function fetchVotacoesSenador(id: string | number): Promise<RespostaVotacoesSenador> {
  const res = await fetch(`/api/senadores/${id}/votacoes`);
  if (!res.ok) throw new Error('Falha ao carregar votações do senador');
  return res.json();
}

export async function fetchVotacoesRecentes(itens: number = 15): Promise<{
  dados: VotacaoResumo[];
  atualizadoEm: string;
}> {
  const res = await fetch(`/api/votacoes?itens=${itens}`);
  if (!res.ok) throw new Error('Falha ao carregar votações recentes');
  return res.json();
}

export async function fetchDetalhesVotacao(id: string) {
  const res = await fetch(`/api/votacoes/${id}`);
  if (!res.ok) throw new Error('Falha ao carregar informações da votação');
  return res.json();
}

export async function fetchVotosDaVotacao(id: string): Promise<RespostaVotosVotacao> {
  const res = await fetch(`/api/votacoes/${id}/votos`);
  if (!res.ok) throw new Error('Falha ao carregar votos da votação');
  return res.json();
}

export async function fetchRankingDespesas(params: {
  ano?: number;
  mes?: number;
  uf?: string;
}): Promise<RespostaRankingGastos> {
  const query = new URLSearchParams();
  if (params.ano) query.set('ano', String(params.ano));
  if (params.mes) query.set('mes', String(params.mes));
  if (params.uf) query.set('uf', params.uf);

  const res = await fetch(`/api/despesas/resumo?${query.toString()}`);
  if (!res.ok) throw new Error('Falha ao carregar ranking de despesas');
  return res.json();
}

export async function fetchEmendas(params: {
  ano?: number;
  codigoEmenda?: string;
  autor?: string;
  pagina?: number;
}): Promise<RespostaEmendas> {
  const query = new URLSearchParams();
  if (params.ano) query.set('ano', String(params.ano));
  if (params.codigoEmenda) query.set('codigoEmenda', params.codigoEmenda);
  if (params.autor) query.set('autor', params.autor);
  if (params.pagina) query.set('pagina', String(params.pagina));

  const res = await fetch(`/api/emendas?${query.toString()}`);
  const data = await res.json();
  if (!res.ok) {
    return {
      configurado: true,
      status: data.status || 'erro',
      mensagem: data.mensagem || data.erro || 'Falha ao consultar emendas',
      dados: [],
    };
  }
  return data;
}

export async function fetchEnqueteAtiva(): Promise<{ enquete: Enquete; atualizadoEm: string }> {
  const res = await fetch('/api/enquetes/ativa');
  if (!res.ok) throw new Error('Falha ao carregar enquete ativa');
  return res.json();
}

export async function fetchHistoricoEnquetes(): Promise<{ enquetes: Enquete[]; total: number }> {
  const res = await fetch('/api/enquetes/historico');
  if (!res.ok) throw new Error('Falha ao carregar histórico de enquetes');
  return res.json();
}

export async function votarEnquete(params: {
  enqueteId: string;
  alternativaId: string;
  uf?: string;
  voterToken?: string;
}): Promise<{ sucesso: boolean; mensagem: string; enquete: Enquete }> {
  const res = await fetch('/api/enquetes/votar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.erro || 'Falha ao registrar voto');
  }
  return data;
}

export async function comentarEnquete(params: {
  enqueteId: string;
  autorNome: string;
  uf?: string;
  texto: string;
}): Promise<{ sucesso: boolean; comentario: ComentarioEnquete; comentarios: ComentarioEnquete[] }> {
  const res = await fetch('/api/enquetes/comentar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.erro || 'Falha ao enviar comentário');
  }
  return data;
}

export async function gerarEnqueteIA(): Promise<{ sucesso: boolean; enquete: Enquete }> {
  const res = await fetch('/api/enquetes/gerar-ia', {
    method: 'POST',
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.erro || 'Falha ao gerar enquete via IA');
  }
  return data;
}
