/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// In-Memory Cache with TTL
interface CacheEntry<T> {
  timestamp: number;
  data: T;
  ttlMs: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

function getFromCache<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > entry.ttlMs) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setToCache<T>(key: string, data: T, ttlSeconds: number = 300): void {
  // Cap cache size to avoid unbounded memory
  if (memoryCache.size > 2000) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) memoryCache.delete(oldestKey);
  }
  memoryCache.set(key, {
    timestamp: Date.now(),
    data,
    ttlMs: ttlSeconds * 1000,
  });
}

// Track sources status
const sourcesStatus: Record<string, {
  nome: string;
  sigla: string;
  urlBase: string;
  status: 'online' | 'degradado' | 'indisponivel' | 'sem_chave';
  tempoRespostaMs: number;
  ultimaConsulta: string;
  detalhes: string;
}> = {
  camara: {
    nome: 'Câmara dos Deputados',
    sigla: 'CD',
    urlBase: 'https://dadosabertos.camara.leg.br/api/v2',
    status: 'online',
    tempoRespostaMs: 120,
    ultimaConsulta: new Date().toISOString(),
    detalhes: 'API de Dados Abertos v2 operacional.',
  },
  senado: {
    nome: 'Senado Federal',
    sigla: 'SF',
    urlBase: 'https://legis.senado.leg.br/dadosabertos',
    status: 'online',
    tempoRespostaMs: 140,
    ultimaConsulta: new Date().toISOString(),
    detalhes: 'Serviço de Dados Abertos do Senado operacional.',
  },
  portalTransparencia: {
    nome: 'Portal da Transparência (CGU)',
    sigla: 'CGU',
    urlBase: 'https://api.portaldatransparencia.gov.br/api-de-dados',
    status: (process.env.PORTAL_TRANSPARENCIA_API_KEY && process.env.PORTAL_TRANSPARENCIA_API_KEY !== 'SUA_CHAVE_DO_PORTAL_TRANSPARENCIA') ? 'online' : 'sem_chave',
    tempoRespostaMs: 0,
    ultimaConsulta: new Date().toISOString(),
    detalhes: (process.env.PORTAL_TRANSPARENCIA_API_KEY && process.env.PORTAL_TRANSPARENCIA_API_KEY !== 'SUA_CHAVE_DO_PORTAL_TRANSPARENCIA')
      ? 'Chave da API configurada no ambiente.'
      : 'Aguardando cadastro gratuito do token no Portal da Transparência (CGU).',
  },
};

// -------------------------------------------------------------
// HELPER: Fetch with Timeout & Error Handling
// -------------------------------------------------------------
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

// -------------------------------------------------------------
// ENDPOINT: Status das Fontes
// -------------------------------------------------------------
app.get('/api/status-fontes', async (_req: Request, res: Response) => {
  const cacheCount = memoryCache.size;
  res.json({
    timestamp: new Date().toISOString(),
    fontes: [
      { ...sourcesStatus.camara, itensEmCache: cacheCount },
      { ...sourcesStatus.senado, itensEmCache: cacheCount },
      { ...sourcesStatus.portalTransparencia, itensEmCache: cacheCount },
    ],
  });
});

// -------------------------------------------------------------
// ENDPOINT: Parlamentares (Busca Unificada)
// -------------------------------------------------------------
app.get('/api/parlamentares', async (req: Request, res: Response) => {
  try {
    const nome = typeof req.query.nome === 'string' ? req.query.nome.trim().toLowerCase() : '';
    const uf = typeof req.query.uf === 'string' ? req.query.uf.trim().toUpperCase() : '';
    const casa = typeof req.query.casa === 'string' ? req.query.casa.trim().toLowerCase() : 'ambas';

    const cacheKey = `parlamentares_${nome}_${uf}_${casa}`;
    const cached = getFromCache<unknown[]>(cacheKey);
    if (cached) {
      return res.json({ dados: cached, cache: true });
    }

    const results: unknown[] = [];

    // 1. Fetch Deputados if casa !== 'senado'
    if (casa !== 'senado') {
      try {
        const camaraCacheKey = 'camara_deputados_57';
        let deputados = getFromCache<any[]>(camaraCacheKey);
        if (!deputados) {
          const start = Date.now();
          const camaraRes = await fetchWithTimeout(
            'https://dadosabertos.camara.leg.br/api/v2/deputados?idLegislatura=57&ordem=ASC&ordenarPor=nome&itens=1000',
            { headers: { Accept: 'application/json' } }
          );
          if (camaraRes.ok) {
            const camaraData = await camaraRes.json();
            const uniqueMap = new Map<number | string, any>();
            for (const d of (camaraData.dados || [])) {
              if (!uniqueMap.has(d.id)) {
                uniqueMap.set(d.id, {
                  id: d.id,
                  nome: d.nome,
                  casa: 'camara',
                  siglaPartido: d.siglaPartido,
                  siglaUf: d.siglaUf,
                  urlFoto: d.urlFoto,
                  email: d.email,
                  idLegislatura: d.idLegislatura,
                  uri: d.uri,
                });
              }
            }
            deputados = Array.from(uniqueMap.values());
            setToCache(camaraCacheKey, deputados, 1800); // 30 min cache
            sourcesStatus.camara.tempoRespostaMs = Date.now() - start;
            sourcesStatus.camara.ultimaConsulta = new Date().toISOString();
          }
        }

        if (deputados) {
          let filtered = deputados;
          if (nome) {
            filtered = filtered.filter(d => d.nome.toLowerCase().includes(nome));
          }
          if (uf) {
            filtered = filtered.filter(d => d.siglaUf === uf);
          }
          results.push(...filtered);
        }
      } catch (err) {
        console.error('Erro ao buscar deputados:', err);
        sourcesStatus.camara.status = 'degradado';
      }
    }

    // 2. Fetch Senadores if casa !== 'camara'
    if (casa !== 'camara') {
      try {
        const senadoCacheKey = 'senado_senadores_atual';
        let senadores = getFromCache<any[]>(senadoCacheKey);
        if (!senadores) {
          const start = Date.now();
          const senadoRes = await fetchWithTimeout(
            'https://legis.senado.leg.br/dadosabertos/senador/lista/atual.json',
            { headers: { Accept: 'application/json' } }
          );
          if (senadoRes.ok) {
            const senadoData = await senadoRes.json();
            const rawList = senadoData?.ListaParlamentarEmExercicio?.Parlamentares?.Parlamentar || [];
            const uniqueSenadores = new Map<string, any>();
            for (const p of rawList) {
              const ident = p.IdentificacaoParlamentar || {};
              const sId = String(ident.CodigoParlamentar || '');
              if (sId && !uniqueSenadores.has(sId)) {
                uniqueSenadores.set(sId, {
                  id: sId,
                  nome: ident.NomeParlamentar || ident.NomeCompletoParlamentar,
                  nomeCivil: ident.NomeCompletoParlamentar,
                  casa: 'senado',
                  siglaPartido: ident.SiglaPartidoParlamentar,
                  siglaUf: ident.UfParlamentar,
                  urlFoto: ident.UrlFotoParlamentar,
                  email: ident.EmailParlamentar,
                  uri: ident.UrlPaginaParlamentar,
                });
              }
            }
            senadores = Array.from(uniqueSenadores.values());
            setToCache(senadoCacheKey, senadores, 1800);
            sourcesStatus.senado.tempoRespostaMs = Date.now() - start;
            sourcesStatus.senado.ultimaConsulta = new Date().toISOString();
          }
        }

        if (senadores) {
          let filtered = senadores;
          if (nome) {
            filtered = filtered.filter(s => s.nome.toLowerCase().includes(nome) || (s.nomeCivil && s.nomeCivil.toLowerCase().includes(nome)));
          }
          if (uf) {
            filtered = filtered.filter(s => s.siglaUf === uf);
          }
          results.push(...filtered);
        }
      } catch (err) {
        console.error('Erro ao buscar senadores:', err);
        sourcesStatus.senado.status = 'degradado';
      }
    }

    setToCache(cacheKey, results, 120);
    res.json({ dados: results, total: results.length });
  } catch (error) {
    console.error('Erro no endpoint parlamentares:', error);
    res.status(500).json({ erro: 'Não foi possível buscar parlamentares', detalhes: String(error) });
  }
});

// -------------------------------------------------------------
// ENDPOINT: Detalhes do Deputado
// -------------------------------------------------------------
app.get('/api/deputados/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cacheKey = `deputado_${id}`;
    const cached = getFromCache(cacheKey);
    if (cached) return res.json(cached);

    const r = await fetchWithTimeout(`https://dadosabertos.camara.leg.br/api/v2/deputados/${id}`, {
      headers: { Accept: 'application/json' },
    });
    if (!r.ok) {
      return res.status(r.status).json({ erro: 'Deputado não encontrado na Câmara' });
    }
    const data = await r.json();
    setToCache(cacheKey, data, 1800);
    res.json(data);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao consultar deputado na Câmara', detalhes: String(error) });
  }
});

// -------------------------------------------------------------
// ENDPOINT: Despesas do Deputado (CEAP)
// -------------------------------------------------------------
app.get('/api/deputados/:id/despesas', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ano = req.query.ano ? String(req.query.ano) : '2026';
    const mes = req.query.mes ? String(req.query.mes) : '';
    const itens = req.query.itens ? String(req.query.itens) : '100';
    const pagina = req.query.pagina ? String(req.query.pagina) : '1';

    const cacheKey = `despesas_dep_${id}_${ano}_${mes}_${pagina}_${itens}`;
    const cached = getFromCache(cacheKey);
    if (cached) return res.json(cached);

    let url = `https://dadosabertos.camara.leg.br/api/v2/deputados/${id}/despesas?idLegislatura=57&ano=${ano}&pagina=${pagina}&itens=${itens}&ordem=DESC&ordenarPor=dataDocumento`;
    if (mes) {
      url += `&mes=${mes}`;
    }

    const r = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } });
    if (!r.ok) {
      return res.status(r.status).json({ erro: 'Falha ao buscar despesas do deputado' });
    }
    const data = await r.json();
    const items = data.dados || [];

    // Compute category aggregations
    const categoriaTotais: Record<string, number> = {};
    let totalGeral = 0;

    for (const item of items) {
      const val = Number(item.valorLiquido || item.valorDocumento) || 0;
      totalGeral += val;
      const cat = item.tipoDespesa || 'Outras despesas';
      categoriaTotais[cat] = (categoriaTotais[cat] || 0) + val;
    }

    const payload = {
      dados: items,
      totalGeral,
      categoriaTotais,
      links: data.links,
      ano: Number(ano),
      mes: mes ? Number(mes) : null,
      atualizadoEm: new Date().toISOString(),
    };

    setToCache(cacheKey, payload, 300);
    res.json(payload);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao obter despesas', detalhes: String(error) });
  }
});

// -------------------------------------------------------------
// ENDPOINT: Detalhes do Senador
// -------------------------------------------------------------
app.get('/api/senadores/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cacheKey = `senador_${id}`;
    const cached = getFromCache(cacheKey);
    if (cached) return res.json(cached);

    const r = await fetchWithTimeout(`https://legis.senado.leg.br/dadosabertos/senador/${id}.json`, {
      headers: { Accept: 'application/json' },
    });
    if (!r.ok) {
      return res.status(r.status).json({ erro: 'Senador não encontrado' });
    }
    const data = await r.json();
    setToCache(cacheKey, data, 1800);
    res.json(data);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao consultar senador', detalhes: String(error) });
  }
});

// -------------------------------------------------------------
// ENDPOINT: Votações Nominais do Senador
// -------------------------------------------------------------
app.get('/api/senadores/:id/votacoes', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cacheKey = `senador_votacoes_${id}`;
    const cached = getFromCache(cacheKey);
    if (cached) return res.json(cached);

    const r = await fetchWithTimeout(`https://legis.senado.leg.br/dadosabertos/senador/${id}/votacoes.json`, {
      headers: { Accept: 'application/json' },
    });
    if (!r.ok) {
      return res.status(r.status).json({ erro: 'Votações do senador indisponíveis' });
    }
    const raw = await r.json();
    const rawList = raw?.VotacaoParlamentar?.Parlamentar?.Votacoes?.Votacao || [];
    const list = Array.isArray(rawList) ? rawList : [rawList];

    const formatados = list.map((v: any) => {
      const sessao = v.SessaoPlenaria || {};
      const mat = v.Materia || {};
      return {
        id: `senado_${sessao.CodigoSessao || ''}_${mat.Codigo || ''}_${v.Sequencial || ''}`,
        casa: 'senado',
        data: sessao.DataSessao || '',
        hora: sessao.HoraInicioSessao,
        descricao: v.DescricaoVotacao || mat.Ementa || 'Votação nominal em Plenário',
        materiaIdentificacao: mat.DescricaoIdentificacao || `${mat.Sigla || ''} ${mat.Numero || ''}/${mat.Ano || ''}`.trim(),
        ementa: mat.Ementa || '',
        resultado: v.DescricaoResultado || 'Concluído',
        voto: v.SiglaDescricaoVoto || 'Não informado',
        secreta: v.IndicadorVotacaoSecreta === 'Sim',
        linkOficial: mat.IdentificacaoProcesso ? `https://www25.senado.leg.br/web/atividade/materias/-/materia/${mat.Codigo}` : 'https://www.senado.leg.br',
      };
    });

    const payload = {
      dados: formatados,
      total: formatados.length,
      atualizadoEm: new Date().toISOString(),
    };

    setToCache(cacheKey, payload, 300);
    res.json(payload);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao consultar votações do senador', detalhes: String(error) });
  }
});

// -------------------------------------------------------------
// ENDPOINT: Votações Recentes da Câmara
// -------------------------------------------------------------
app.get('/api/votacoes', async (req: Request, res: Response) => {
  try {
    const itens = req.query.itens ? String(req.query.itens) : '20';
    const pagina = req.query.pagina ? String(req.query.pagina) : '1';
    const dataInicio = req.query.dataInicio ? String(req.query.dataInicio) : '';
    const dataFim = req.query.dataFim ? String(req.query.dataFim) : '';

    const cacheKey = `votacoes_${itens}_${pagina}_${dataInicio}_${dataFim}`;
    const cached = getFromCache(cacheKey);
    if (cached) return res.json(cached);

    let url = `https://dadosabertos.camara.leg.br/api/v2/votacoes?ordem=DESC&ordenarPor=dataHoraRegistro&itens=${itens}&pagina=${pagina}`;
    if (dataInicio) url += `&dataInicio=${dataInicio}`;
    if (dataFim) url += `&dataFim=${dataFim}`;

    const r = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } });
    if (!r.ok) {
      return res.status(r.status).json({ erro: 'Falha ao buscar votações na Câmara' });
    }
    const data = await r.json();

    const votacoes = (data.dados || []).map((v: any) => ({
      id: v.id,
      casa: 'camara',
      data: v.data,
      dataHoraRegistro: v.dataHoraRegistro,
      siglaOrgao: v.siglaOrgao,
      descricao: v.descricao,
      proposicaoObjeto: v.proposicaoObjeto,
      aprovacao: v.aprovacao,
      uri: v.uri,
      linkOficial: `https://www.camara.leg.br/presenca-comissoes/votacao-portal?reuniaoCodReuniao=&itemVotacaoCod=${v.id}`,
    }));

    const payload = {
      dados: votacoes,
      links: data.links,
      atualizadoEm: new Date().toISOString(),
    };

    setToCache(cacheKey, payload, 180);
    res.json(payload);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar votações', detalhes: String(error) });
  }
});

// -------------------------------------------------------------
// ENDPOINT: Detalhes de uma Votação da Câmara
// -------------------------------------------------------------
app.get('/api/votacoes/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cacheKey = `votacao_detalhe_${id}`;
    const cached = getFromCache(cacheKey);
    if (cached) return res.json(cached);

    const r = await fetchWithTimeout(`https://dadosabertos.camara.leg.br/api/v2/votacoes/${id}`, {
      headers: { Accept: 'application/json' },
    });
    if (!r.ok) {
      return res.status(r.status).json({ erro: 'Votação não encontrada' });
    }
    const data = await r.json();
    setToCache(cacheKey, data.dados || data, 600);
    res.json(data.dados || data);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar detalhe da votação', detalhes: String(error) });
  }
});

// -------------------------------------------------------------
// ENDPOINT: Votos Individuais de uma Votação da Câmara
// -------------------------------------------------------------
app.get('/api/votacoes/:id/votos', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cacheKey = `votacao_votos_${id}`;
    const cached = getFromCache(cacheKey);
    if (cached) return res.json(cached);

    const r = await fetchWithTimeout(`https://dadosabertos.camara.leg.br/api/v2/votacoes/${id}/votos`, {
      headers: { Accept: 'application/json' },
    });
    if (!r.ok) {
      return res.status(r.status).json({ erro: 'Não foi possível carregar os votos da votação' });
    }
    const data = await r.json();
    const rawVotos = data.dados || [];

    const formatados = rawVotos.map((item: any) => {
      const dep = item.deputado_ || {};
      return {
        idParlamentar: dep.id,
        nomeParlamentar: dep.nome,
        siglaPartido: dep.siglaPartido,
        siglaUf: dep.siglaUf,
        urlFoto: dep.urlFoto,
        casa: 'camara',
        voto: item.tipoVoto || 'Não informado',
        dataHora: item.dataRegistroVoto,
      };
    });

    // Count totals
    const contagem: Record<string, number> = {
      Sim: 0,
      Não: 0,
      Abstenção: 0,
      Obstrução: 0,
      Ausente: 0,
      Outros: 0,
    };

    for (const v of formatados) {
      const voto = v.voto;
      if (contagem[voto] !== undefined) {
        contagem[voto]++;
      } else {
        contagem['Outros']++;
      }
    }

    const payload = {
      dados: formatados,
      totalVotos: formatados.length,
      isNominal: formatados.length > 0,
      contagem,
      atualizadoEm: new Date().toISOString(),
    };

    setToCache(cacheKey, payload, 600);
    res.json(payload);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar votos da votação', detalhes: String(error) });
  }
});

// -------------------------------------------------------------
// ENDPOINT: Ranking e Resumo Geral de Gastos (Câmara CEAP)
// -------------------------------------------------------------
app.get('/api/despesas/resumo', async (req: Request, res: Response) => {
  try {
    const ano = req.query.ano ? Number(req.query.ano) : 2026;
    const mes = req.query.mes ? Number(req.query.mes) : undefined;
    const uf = typeof req.query.uf === 'string' ? req.query.uf.trim().toUpperCase() : '';

    const cacheKey = `despesas_resumo_${ano}_${mes || 'all'}_${uf || 'all'}`;
    const cached = getFromCache(cacheKey);
    if (cached) return res.json(cached);

    // To provide a real sample of current expenses without overwhelming rate limits,
    // fetch active sample deputies (e.g. leaders and diverse states) and aggregate
    // Or if cached batch exists, return.
    // Let's get the list of deputies first
    const depsRes = await fetchWithTimeout(
      `https://dadosabertos.camara.leg.br/api/v2/deputados?idLegislatura=57&itens=40&ordem=ASC&ordenarPor=nome${uf ? `&siglaUf=${uf}` : ''}`,
      { headers: { Accept: 'application/json' } }
    );

    if (!depsRes.ok) {
      return res.status(depsRes.status).json({ erro: 'Falha ao consultar base da Câmara' });
    }
    const depsData = await depsRes.json();
    const uniqueDepsMap = new Map<number | string, any>();
    for (const d of (depsData.dados || [])) {
      if (!uniqueDepsMap.has(d.id)) {
        uniqueDepsMap.set(d.id, d);
      }
    }
    const deputies = Array.from(uniqueDepsMap.values());

    // Query expenses for a subset to compute real metrics
    const rankingPromises = deputies.slice(0, 15).map(async (d: any) => {
      try {
        const u = `https://dadosabertos.camara.leg.br/api/v2/deputados/${d.id}/despesas?idLegislatura=57&ano=${ano}${mes ? `&mes=${mes}` : ''}&itens=50`;
        const r = await fetchWithTimeout(u, { headers: { Accept: 'application/json' } }, 5000);
        if (!r.ok) return null;
        const dJson = await r.json();
        const items = dJson.dados || [];
        let total = 0;
        const categories: Record<string, number> = {};
        for (const it of items) {
          const val = Number(it.valorLiquido || it.valorDocumento) || 0;
          total += val;
          categories[it.tipoDespesa] = (categories[it.tipoDespesa] || 0) + val;
        }

        let maiorCat = 'Nenhuma registrada';
        let maxVal = 0;
        for (const [k, v] of Object.entries(categories)) {
          if (v > maxVal) {
            maxVal = v;
            maiorCat = k;
          }
        }

        return {
          id: d.id,
          nome: d.nome,
          casa: 'camara' as const,
          siglaPartido: d.siglaPartido,
          siglaUf: d.siglaUf,
          urlFoto: d.urlFoto,
          valorTotal: total,
          quantidadeDespesas: items.length,
          maiorCategoria: maiorCat,
        };
      } catch {
        return null;
      }
    });

    const parsedResults = (await Promise.all(rankingPromises)).filter(Boolean) as any[];
    
    // Sort by valorTotal DESC
    parsedResults.sort((a, b) => b.valorTotal - a.valorTotal);
    const rankingWithPos = parsedResults.map((item, idx) => ({
      ...item,
      posicao: idx + 1,
    }));

    const totalPeriodo = rankingWithPos.reduce((acc, curr) => acc + curr.valorTotal, 0);
    const totalQtd = rankingWithPos.reduce((acc, curr) => acc + curr.quantidadeDespesas, 0);

    const payload = {
      ranking: rankingWithPos,
      totalRegistrado: totalPeriodo,
      totalDespesasEncontradas: totalQtd,
      parlamentaresAmostrados: rankingWithPos.length,
      ano,
      mes: mes || null,
      uf: uf || null,
      atualizadoEm: new Date().toISOString(),
      avisoMetodologico: 'Ordenação contábil de valores extraídos via API oficial da CEAP (Câmara dos Deputados). Não expressa juízo de eficiência, qualidade do mandato ou irregularidade.',
    };

    setToCache(cacheKey, payload, 300);
    res.json(payload);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao gerar resumo de despesas', detalhes: String(error) });
  }
});

// -------------------------------------------------------------
// ENDPOINT: Emendas Parlamentares (Portal da Transparência CGU)
// Documentação oficial: GET /api-de-dados/emendas
// Parâmetros documentados: pagina (obrigatório); codigoEmenda, numeroEmenda,
// nomeAutor, tipoEmenda e ano (opcionais).
function firstPresent(record: Record<string, any>, keys: string[]): unknown {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}
function optionalText(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return String(value);
}
function optionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : undefined;
}
app.get('/api/emendas', async (req: Request, res: Response) => {
  const apiKey = process.env.PORTAL_TRANSPARENCIA_API_KEY;
  const isKeyConfigured = Boolean(apiKey && apiKey.trim() && apiKey !== 'SUA_CHAVE_DO_PORTAL_TRANSPARENCIA');
  const anoRaw = typeof req.query.ano === 'string' ? req.query.ano : '2024';
  const codigoEmenda = typeof req.query.codigoEmenda === 'string' ? req.query.codigoEmenda.trim() : '';
  const autor = typeof req.query.autor === 'string' ? req.query.autor.trim() : '';
  const paginaRaw = typeof req.query.pagina === 'string' ? req.query.pagina : '1';
  const ano = Number(anoRaw);
  const pagina = Number(paginaRaw);

  if (!Number.isInteger(ano) || ![2023, 2024, 2025, 2026].includes(ano)) {
    return res.status(400).json({ configurado: true, status: 'erro_validacao', mensagem: 'Selecione um exercício válido: 2023, 2024, 2025 ou 2026.', dados: [] });
  }
  if (!Number.isInteger(pagina) || pagina < 1) {
    return res.status(400).json({ configurado: true, status: 'erro_validacao', mensagem: 'A página deve ser um número inteiro maior que zero.', dados: [] });
  }
  if (!isKeyConfigured) {
    return res.status(200).json({
      status: 'sem_chave', configurado: false,
      mensagem: 'A chave da API da CGU não está configurada no backend.',
      instrucoesCadastro: {
        passo1: 'Acesse https://portaldatransparencia.gov.br/api-de-dados/cadastrar-email',
        passo2: 'Solicite sua chave oficial gratuita.',
        passo3: 'Configure PORTAL_TRANSPARENCIA_API_KEY nos segredos/variáveis de ambiente do serviço backend.',
      },
      dados: [],
      fontesOficiaisComplementares: [
        { nome: 'Portal da Transparência — Emendas', url: 'https://portaldatransparencia.gov.br/emendas' },
        { nome: 'Documentação oficial da API', url: 'https://api.portaldatransparencia.gov.br/' },
      ],
    });
  }

  const cacheKey = `emendas_v2_${ano}_${codigoEmenda}_${autor.toLocaleLowerCase('pt-BR')}_${pagina}`;
  const cached = getFromCache<Record<string, unknown>>(cacheKey);
  if (cached) return res.json(cached);

  const params = new URLSearchParams();
  params.set('pagina', String(pagina));
  params.set('ano', String(ano));
  if (codigoEmenda) params.set('codigoEmenda', codigoEmenda);
  if (autor) params.set('nomeAutor', autor);

  const url = `https://api.portaldatransparencia.gov.br/api-de-dados/emendas?${params.toString()}`;
  try {
    const startedAt = Date.now();
    const response = await fetchWithTimeout(url, {
      headers: { Accept: 'application/json', 'chave-api-dados': apiKey as string },
    }, 12000);
    sourcesStatus.portalTransparencia.tempoRespostaMs = Date.now() - startedAt;
    sourcesStatus.portalTransparencia.ultimaConsulta = new Date().toISOString();

    if (response.status === 401 || response.status === 403) {
      sourcesStatus.portalTransparencia.status = 'sem_chave';
      return res.status(502).json({ configurado: true, status: 'erro_autenticacao', mensagem: 'A CGU recusou a autenticação. Confira a chave configurada no ambiente do backend.', dados: [] });
    }
    if (response.status === 429) {
      sourcesStatus.portalTransparencia.status = 'degradado';
      return res.status(429).json({ configurado: true, status: 'limite_requisicoes', mensagem: 'A API oficial atingiu o limite de requisições. Aguarde um pouco e tente novamente.', dados: [] });
    }
    if (!response.ok) {
      sourcesStatus.portalTransparencia.status = response.status >= 500 ? 'indisponivel' : 'degradado';
      return res.status(502).json({ configurado: true, status: 'erro_api', mensagem: `A API oficial respondeu com o status ${response.status}. Tente novamente mais tarde.`, dados: [] });
    }

    const rawData: unknown = await response.json();
    if (!Array.isArray(rawData)) {
      sourcesStatus.portalTransparencia.status = 'degradado';
      return res.status(502).json({ configurado: true, status: 'formato_inesperado', mensagem: 'A resposta da API oficial veio em um formato diferente do esperado. Nenhum dado foi inventado.', dados: [] });
    }

    const mapped: Record<string, unknown>[] = rawData.map((item: unknown) => {
      const e = (item && typeof item === 'object' ? item : {}) as Record<string, any>;
      const record: Record<string, unknown> = {};
      const assignText = (target: string, keys: string[]) => {
        const value = optionalText(firstPresent(e, keys));
        if (value !== undefined) record[target] = value;
      };
      const assignNumber = (target: string, keys: string[]) => {
        const value = optionalNumber(firstPresent(e, keys));
        if (value !== undefined) record[target] = value;
      };
      assignText('codigoEmenda', ['codigoEmenda', 'numeroEmenda']);
      assignNumber('ano', ['ano']);
      assignText('tipoEmenda', ['tipoEmenda']);
      assignText('autor', ['nomeAutor']);
      assignText('partidoAutor', ['partidoAutor', 'siglaPartidoAutor']);
      assignText('ufAutor', ['ufAutor', 'uf']);
      assignText('localidade', ['localidadeDoGasto', 'localidade']);
      assignText('beneficiario', ['nomeBeneficiario', 'beneficiario', 'nomeFavorecido']);
      assignText('orgaoResponsavel', ['nomeOrgao', 'orgaoResponsavel', 'orgao']);
      assignText('funcao', ['funcao', 'nomeFuncao']);
      assignText('subfuncao', ['subfuncao', 'nomeSubfuncao']);
      assignText('situacao', ['situacao', 'fase', 'status']);
      assignNumber('valorPrevisto', ['valorAutorizado', 'valorPrevisto', 'valorEmenda', 'valorProposto']);
      assignNumber('valorEmpenhado', ['valorEmpenhado']);
      assignNumber('valorLiquidado', ['valorLiquidado']);
      assignNumber('valorPago', ['valorPago']);
      const code = optionalText(firstPresent(e, ['codigoEmenda', 'numeroEmenda']));
      record.linkOficial = code
        ? `https://portaldatransparencia.gov.br/emendas/consulta?paginacaoSimples=true&tamanhoPagina=15&offset=0&ano=${ano}`
        : 'https://portaldatransparencia.gov.br/emendas';
      return record;
    });

    const uniqueByCode = new Map<string, Record<string, unknown>>();
    mapped.forEach((record, index) => {
      const code = typeof record.codigoEmenda === 'string' ? record.codigoEmenda : `sem-codigo-${index}`;
      if (!uniqueByCode.has(code)) uniqueByCode.set(code, record);
    });
    const dados = Array.from(uniqueByCode.values());
    const sumKnown = (field: string): number | null => {
      const values = dados.map((record) => record[field]).filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
      return values.length ? values.reduce((sum, value) => sum + value, 0) : null;
    };
    const payload = {
      configurado: true, status: dados.length ? 'sucesso' : 'sem_resultados', dados,
      total: dados.length, pagina, exercicio: ano, consultadoEm: new Date().toISOString(),
      resumoFinanceiro: {
        valorPrevisto: sumKnown('valorPrevisto'), valorEmpenhado: sumKnown('valorEmpenhado'),
        valorLiquidado: sumKnown('valorLiquidado'), valorPago: sumKnown('valorPago'),
        observacao: 'Totais calculados apenas com valores numéricos presentes na resposta e após deduplicação por código da emenda. Valores indisponíveis são null, não zero.',
      },
      fonte: { nome: 'Portal da Transparência — Controladoria-Geral da União', endpoint: '/api-de-dados/emendas', url: 'https://api.portaldatransparencia.gov.br/' },
    };
    sourcesStatus.portalTransparencia.status = 'online';
    sourcesStatus.portalTransparencia.detalhes = 'Consulta autenticada à API oficial realizada.';
    setToCache(cacheKey, payload, 180);
    return res.json(payload);
  } catch (error) {
    sourcesStatus.portalTransparencia.status = 'indisponivel';
    const timeout = error instanceof Error && error.name === 'AbortError';
    return res.status(502).json({
      configurado: true, status: timeout ? 'timeout' : 'erro_conexao',
      mensagem: timeout ? 'A API oficial demorou demais para responder. Tente novamente.' : 'Não foi possível conectar à API oficial do Portal da Transparência. Tente novamente mais tarde.',
      dados: [],
    });
  }
});

// TERMÔMETRO DA RUA — Enquetes e Opinião Pública (In-Memory + Gemini)
// -------------------------------------------------------------
import { GoogleGenAI } from '@google/genai';

interface EnqueteAlternativa {
  id: string;
  texto: string;
  votos: number;
}

interface Enquete {
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
  porUf?: Record<string, Record<string, number>>;
  comentarios?: Array<{
    id: string;
    autorNome: string;
    uf?: string;
    texto: string;
    dataHora: string;
    denuncias?: number;
  }>;
}

const enquetesStore: Enquete[] = [
  {
    id: 'enq-2026-10-17',
    pergunta: 'Você apoia a ampliação de mecanismos públicos de controle digital e transparência de algoritmos em redes sociais?',
    contexto: 'O Congresso Nacional debate novas diretrizes para a responsabilidade de plataformas digitais, equilibrando a liberdade de expressão com o combate à desinformação e crimes cibernéticos.',
    dataPublicacao: '2026-10-17T08:00:00Z',
    status: 'publicada',
    alternativas: [
      { id: 'alt-1', texto: 'Sim, com regras claras de auditoria e transparência', votos: 1425 },
      { id: 'alt-2', texto: 'Não, pois pode gerar censura ou controle estatal excessivo', votos: 980 },
      { id: 'alt-3', texto: 'Ainda não tenho opinião formada sobre o tema', votos: 215 },
    ],
    totalVotos: 2620,
    fontesOficiais: [
      { nome: 'Câmara dos Deputados — Projetos de Lei em Tramitação', url: 'https://www.camara.leg.br' },
      { nome: 'Senado Federal — Portal de Matérias', url: 'https://www12.senado.leg.br' }
    ],
    porUf: {
      'SP': { 'alt-1': 450, 'alt-2': 310, 'alt-3': 60 },
      'RJ': { 'alt-1': 210, 'alt-2': 180, 'alt-3': 35 },
      'MG': { 'alt-1': 190, 'alt-2': 130, 'alt-3': 30 },
      'RS': { 'alt-1': 120, 'alt-2': 90, 'alt-3': 20 },
      'BA': { 'alt-1': 140, 'alt-2': 80, 'alt-3': 25 },
    },
    comentarios: [
      {
        id: 'c-1',
        autorNome: 'Cidadão Verificado (SP)',
        uf: 'SP',
        texto: 'A transparência algorítmica é fundamental para sabermos como o conteúdo é impulsionado na internet.',
        dataHora: '2026-10-17T10:30:00Z',
        denuncias: 0
      },
      {
        id: 'c-2',
        autorNome: 'Participante (RJ)',
        uf: 'RJ',
        texto: 'Precisamos ter cuidado para que regulação não vire restrição de debate livre.',
        dataHora: '2026-10-17T11:15:00Z',
        denuncias: 0
      }
    ]
  },
  {
    id: 'enq-2026-10-10',
    pergunta: 'Qual sua avaliação sobre a implementação gradual da Reforma Tributária e do novo IVA dual?',
    contexto: 'A reforma visa simplificar impostos sobre consumo, unificando tributos federais, estaduais e municipais em um imposto sobre valor agregado.',
    dataPublicacao: '2026-10-10T08:00:00Z',
    dataEncerramento: '2026-10-16T23:59:59Z',
    status: 'encerrada',
    alternativas: [
      { id: 'alt-1', texto: 'Positiva, trará simplificação a longo prazo', votos: 2890 },
      { id: 'alt-2', texto: 'Negativa, há risco de aumento da carga tributária em alguns setores', votos: 3410 },
      { id: 'alt-3', texto: 'Neutra / Sem impacto direto percebido', votos: 650 },
    ],
    totalVotos: 6950,
    fontesOficiais: [
      { nome: 'Portal da Transparência — Reforma Tributária', url: 'https://portaldatransparencia.gov.br' }
    ]
  }
];

const recordedVotesSet = new Set<string>();

app.get('/api/enquetes/ativa', (_req: Request, res: Response) => {
  const ativa = enquetesStore.find(e => e.status === 'publicada') || enquetesStore[0];
  res.json({ enquete: ativa, atualizadoEm: new Date().toISOString() });
});

app.get('/api/enquetes/historico', (_req: Request, res: Response) => {
  const historico = enquetesStore.filter(e => e.status === 'encerrada' || e.status === 'publicada');
  res.json({ enquetes: historico, total: historico.length });
});

app.post('/api/enquetes/votar', (req: Request, res: Response) => {
  try {
    const { enqueteId, alternativaId, uf, voterToken } = req.body;
    if (!enqueteId || !alternativaId) {
      return res.status(400).json({ erro: 'Enquete e alternativa são obrigatórias.' });
    }

    const tokenUnico = voterToken || req.ip || 'anon';
    const chaveDuplicidade = `${tokenUnico}_${enqueteId}`;

    if (recordedVotesSet.has(chaveDuplicidade)) {
      return res.status(400).json({ erro: 'Você já registrou seu voto nesta enquete.' });
    }

    const enquete = enquetesStore.find(e => e.id === enqueteId);
    if (!enquete) {
      return res.status(404).json({ erro: 'Enquete não encontrada.' });
    }

    const alt = enquete.alternativas.find(a => a.id === alternativaId);
    if (!alt) {
      return res.status(404).json({ erro: 'Alternativa inválida.' });
    }

    alt.votos++;
    enquete.totalVotos++;

    if (uf) {
      if (!enquete.porUf) enquete.porUf = {};
      if (!enquete.porUf[uf]) enquete.porUf[uf] = {};
      enquete.porUf[uf][alternativaId] = (enquete.porUf[uf][alternativaId] || 0) + 1;
    }

    recordedVotesSet.add(chaveDuplicidade);

    res.json({
      sucesso: true,
      mensagem: 'Voto registrado com sucesso.',
      enquete,
    });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao registrar voto', detalhes: String(error) });
  }
});

app.post('/api/enquetes/comentar', (req: Request, res: Response) => {
  try {
    const { enqueteId, autorNome, uf, texto } = req.body;
    if (!enqueteId || !texto || texto.trim().length < 3) {
      return res.status(400).json({ erro: 'Comentário inválido ou muito curto.' });
    }

    const enquete = enquetesStore.find(e => e.id === enqueteId);
    if (!enquete) {
      return res.status(404).json({ erro: 'Enquete não encontrada.' });
    }

    if (!enquete.comentarios) enquete.comentarios = [];

    const novoComentario = {
      id: `c-${Date.now()}`,
      autorNome: autorNome?.trim() || 'Cidadão Verificado',
      uf: uf || undefined,
      texto: texto.trim().slice(0, 500),
      dataHora: new Date().toISOString(),
      denuncias: 0,
    };

    enquete.comentarios.unshift(novoComentario);
    res.json({ sucesso: true, comentario: novoComentario, comentarios: enquete.comentarios });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao adicionar comentário', detalhes: String(error) });
  }
});

app.post('/api/enquetes/gerar-ia', async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ erro: 'Chave GEMINI_API_KEY não configurada no ambiente.' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Gere uma enquete de opinião pública factual e estritamente neutra sobre um tema político, legislativo ou orçamentário brasileiro recente. Retorne um JSON válido com o seguinte formato exato (sem markdown extra):\n{\n  "pergunta": "...",\n  "contexto": "...",\n  "alternativas": ["...", "...", "..."],\n  "fonteNome": "...",\n  "fonteUrl": "..."\n}`,
    });

    const text = response.text || '';
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const novaEnquete = {
      id: `enq-ai-${Date.now()}`,
      pergunta: parsed.pergunta,
      contexto: parsed.contexto,
      dataPublicacao: new Date().toISOString(),
      status: 'programada' as const,
      alternativas: (parsed.alternativas || []).map((alt: string, i: number) => ({
        id: `alt-${i + 1}`,
        texto: alt,
        votos: 0,
      })),
      totalVotos: 0,
      fontesOficiais: [
        { nome: parsed.fonteNome || 'Portal Oficial do Governo', url: parsed.fonteUrl || 'https://www.gov.br' }
      ],
      porUf: {},
      comentarios: []
    };

    enquetesStore.push(novaEnquete);
    res.json({ sucesso: true, enquete: novaEnquete });
  } catch (error) {
    console.error('Erro ao gerar enquete com Gemini:', error);
    res.status(500).json({ erro: 'Falha ao gerar enquete automatizada via IA', detalhes: String(error) });
  }
});

// -------------------------------------------------------------
// VITE SETUP (Dev Middleware or Static Production)
// -------------------------------------------------------------
async function setupServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Placar da Esplanada] Servidor ativo na porta ${PORT} (modo: ${isProduction ? 'produção' : 'desenvolvimento'})`);
  });
}

setupServer().catch(err => {
  console.error('Falha ao iniciar o servidor:', err);
  process.exit(1);
});
