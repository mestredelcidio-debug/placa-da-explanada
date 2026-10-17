/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CasaLegislativa = 'camara' | 'senado' | 'ambas';

export type TipoVoto = 
  | 'Sim' 
  | 'Não' 
  | 'Abstenção' 
  | 'Obstrução' 
  | 'Ausente' 
  | 'Artigo 17' 
  | 'Não informado';

export interface Parlamentar {
  id: string | number;
  nome: string;
  nomeCivil?: string;
  casa: 'camara' | 'senado';
  siglaPartido?: string;
  siglaUf: string;
  urlFoto?: string;
  email?: string;
  idLegislatura?: number;
  uri?: string;
  gabinete?: {
    nome?: string;
    predio?: string;
    sala?: string;
    andar?: string;
    telefone?: string;
    email?: string;
  };
}

export interface VotacaoResumo {
  id: string;
  casa: 'camara' | 'senado';
  data: string;
  dataHoraRegistro?: string;
  siglaOrgao?: string;
  descricao: string;
  proposicaoTitulo?: string;
  proposicaoObjeto?: string;
  proposicaoEmenta?: string;
  aprovacao?: number | boolean | null; // 1 = aprovado, 0 = rejeitado, null = outros/informado no texto
  resultado?: string;
  uri?: string;
  uriVotacao?: string;
  linkOficial?: string;
  totalVotos?: number;
  isNominal?: boolean;
}

export interface VotoRegistro {
  idParlamentar: string | number;
  nomeParlamentar: string;
  siglaPartido?: string;
  siglaUf: string;
  urlFoto?: string;
  casa: 'camara' | 'senado';
  voto: TipoVoto;
  dataHora?: string;
}

export interface DespesaItem {
  ano: number;
  mes: number;
  tipoDespesa: string;
  codDocumento?: string;
  tipoDocumento?: string;
  dataDocumento?: string;
  numDocumento?: string;
  valorDocumento: number;
  urlDocumento?: string;
  nomeFornecedor: string;
  cnpjCpfFornecedor?: string;
  valorLiquido: number;
  valorGlosa?: number;
  idParlamentar?: string | number;
  nomeParlamentar?: string;
  casa?: 'camara' | 'senado';
}

export interface DespesaRankingItem {
  posicao: number;
  id: string | number;
  nome: string;
  casa: 'camara' | 'senado';
  siglaPartido?: string;
  siglaUf: string;
  urlFoto?: string;
  valorTotal: number;
  quantidadeDespesas: number;
  maiorCategoria?: string;
  variacaoAnterior?: number | null; // Variação % se comparável
}

export interface EmendaItem {
  codigoEmenda?: string;
  ano?: number;
  tipoEmenda?: string;
  autor?: string;
  partidoAutor?: string;
  ufAutor?: string;
  casa?: 'camara' | 'senado' | 'mista';
  localidade?: string;
  funcao?: string;
  subfuncao?: string;
  orgaoResponsavel?: string;
  valorPrevisto?: number;
  valorEmpenhado?: number;
  valorLiquidado?: number;
  valorPago?: number;
  situacao?: string;
  beneficiario?: string;
  linkOficial?: string;
}

export interface StatusFonte {
  nome: string;
  sigla: string;
  urlBase: string;
  status: 'online' | 'degradado' | 'indisponivel' | 'sem_chave';
  tempoRespostaMs?: number;
  ultimaConsulta: string;
  detalhes: string;
  itensEmCache?: number;
}

export interface EstatisticasGerais {
  totalDeputados: number;
  totalSenadores: number;
  totalVotacoesNominaisRecentes: number;
  totalDespesasPeriodo: number;
  periodoAtivo: {
    ano: number;
    mes?: number;
  };
  ultimaAtualizacao: string;
}

export interface EnqueteAlternativa {
  id: string;
  texto: string;
  votos: number;
}

export interface Enquete {
  id: string;
  pergunta: string;
  contexto: string;
  dataPublicacao: string;
  dataEncerramento?: string;
  status: 'publicada' | 'encerrada' | 'programada';
  alternativas: EnqueteAlternativa[];
  totalVotos: number;
  fontesOficiais: Array<{
    nome: string;
    url: string;
  }>;
  porUf?: Record<string, Record<string, number>>; // uf -> alternativaId -> count
  comentarios?: ComentarioEnquete[];
}

export interface ComentarioEnquete {
  id: string;
  enqueteId: string;
  autorNome: string;
  uf?: string;
  texto: string;
  dataHora: string;
  denuncias?: number;
}

