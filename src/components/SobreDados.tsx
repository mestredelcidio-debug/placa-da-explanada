/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ShieldCheck,
  Database,
  HelpCircle,
  FileText,
  AlertTriangle,
  Scale,
  Mail,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { AdSlot } from './AdSlot';

export const SobreDados: React.FC = () => {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Sobre os Dados e Metodologia
        </h1>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          O VOCÊ ON é uma iniciativa independente orientada pelo princípio do controle social e pela Lei de Acesso à Informação (Lei Federal nº 12.527/2011). Não emitimos opiniões partidárias, não atribuímos conceitos de eficiência ou desonestidade e não alteramos dados contábeis oficiais.
        </p>
      </div>

      <div className="mt-8 space-y-10">
        {/* 1. Origem das Informações */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-900" />
            <h2 className="text-lg font-bold text-slate-900">
              1. De onde vêm as informações?
            </h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Todas as informações exibidas nesta plataforma são extraídas diretamente dos canais oficiais mantidos pelos órgãos federais:
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mt-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-xs font-bold text-blue-900 uppercase">Câmara dos Deputados</span>
              <p className="mt-1 text-xs text-slate-600">
                API RESTful de Dados Abertos (v2). Fornece lista de deputados em exercício, votações nominais e despesas da CEAP com links para recibos.
              </p>
              <a
                href="https://dadosabertos.camara.leg.br"
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-900 hover:underline"
              >
                <span>dadosabertos.camara.leg.br</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-xs font-bold text-blue-900 uppercase">Senado Federal</span>
              <p className="mt-1 text-xs text-slate-600">
                Serviço de Dados Abertos e Legislação do Senado. Fornece lista dos 81 senadores, matérias legislativas e votações nominais individuais.
              </p>
              <a
                href="https://www12.senado.leg.br/dados-abertos"
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-900 hover:underline"
              >
                <span>senado.leg.br/dados-abertos</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-xs font-bold text-blue-900 uppercase">CGU / Portal da Transparência</span>
              <p className="mt-1 text-xs text-slate-600">
                API de Dados Abertos da Controladoria-Geral da União. Fornece execução orçamentária de emendas parlamentares (valores empenhados, liquidados e pagos).
              </p>
              <a
                href="https://portaldatransparencia.gov.br"
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-900 hover:underline"
              >
                <span>portaldatransparencia.gov.br</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </section>

        {/* 2. Por que nem toda votação tem registro individual? */}
        <section className="space-y-3 border-t border-slate-200 pt-8">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-blue-900" />
            <h2 className="text-lg font-bold text-slate-900">
              2. Por que nem toda votação possui o voto individual de cada parlamentar?
            </h2>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 leading-relaxed space-y-2">
            <p>
              No processo legislativo brasileiro existem dois tipos principais de votação:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>
                <strong>Votação Nominal:</strong> Os parlamentares registram eletronicamente seu voto individual no painel (Sim, Não, Abstenção ou Obstrução). Essa votação gera um registro individual nominal que é indexado nesta plataforma.
              </li>
              <li>
                <strong>Votação Simbólica:</strong> Utilizada pela Presidência da sessão para matérias com amplo consenso ou redações finais. O presidente convida os parlamentares favoráveis a permanecerem sentados. <em>Não há registro de votos individuais no sistema eletrônico</em>.
              </li>
            </ul>
            <p>
              O Placar da Esplanada <strong>nunca presume</strong> que a ausência de registro nominal equivale a voto contrário ou abstenção deliberada. Apresentamos estritamente o que foi oficialmente registrado no banco de dados da respectiva Casa.
            </p>
          </div>
        </section>

        {/* 3. Como funciona a Cota Parlamentar (CEAP) e o Ranking? */}
        <section className="space-y-3 border-t border-slate-200 pt-8">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-blue-900" />
            <h2 className="text-lg font-bold text-slate-900">
              3. Como as despesas da CEAP são calculadas e por que o ranking não é um julgamento moral?
            </h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            A Cota para o Exercício da Atividade Parlamentar (CEAP) é uma verba indenizatória prevista no Ato da Mesa nº 43/2009 da Câmara dos Deputados, destinada a custear passagens aéreas, combustível, locação de escritório de apoio, consultoria técnica, telefonia e divulgação de atos do mandato.
          </p>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-700 leading-relaxed space-y-2 shadow-xs">
            <div className="font-semibold text-slate-900">Regras e Variáveis Relevantes:</div>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Diferença de tetos por estado:</strong> Parlamentares de estados mais distantes de Brasília (como Acre, Roraima, Amapá) possuem cotas mensais maiores (até R$ 51.406,33) do que parlamentares do DF (R$ 36.582,46) devido ao custo histórico de passagens aéreas.
              </li>
              <li>
                <strong>Reembolsos retroativos:</strong> O parlamentar tem até 90 dias após a emissão do documento para solicitar o reembolso. Uma nota fiscal de janeiro pode ser contabilizada em março no sistema.
              </li>
              <li>
                <strong>Ordenação contábil:</strong> O "Ranking de Gastos" apresentado no Placar da Esplanada é exclusivamente uma ordenação numérica contábil para facilitar a localização de dados. Ele <em>não</em> avalia a moralidade, a eficiência ou a legalidade das despesas, as quais são auditadas administrativamente pela Câmara dos Deputados e pelo Tribunal de Contas da União (TCU).
              </li>
            </ul>
          </div>
        </section>

        {/* 4. Emendas: Previsto vs Empenhado vs Pago */}
        <section className="space-y-3 border-t border-slate-200 pt-8">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-900" />
            <h2 className="text-lg font-bold text-slate-900">
              4. Emendas Parlamentares: Entendendo a Execução Financeira
            </h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Frequentemente confunde-se a destinação orçamentária da emenda com o repasse financeiro efetivo. No Orçamento Geral da União (OGU), as etapas são distintas:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <span className="font-bold text-slate-900 block">1. Previsto</span>
              <p className="mt-1 text-slate-600">Valor aprovado na Lei Orçamentária Anual. Trata-se de uma autorização de despesa, não de dinheiro transferido.</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <span className="font-bold text-blue-950 block">2. Empenhado</span>
              <p className="mt-1 text-slate-600">O governo federal reserva formalmente o crédito no Tesouro Nacional para o convênio ou órgão executor.</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <span className="font-bold text-slate-700 block">3. Liquidado</span>
              <p className="mt-1 text-slate-600">A obra, serviço ou material foi verificado e comprovado tecnicamente pelo fiscal público.</p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
              <span className="font-bold text-emerald-800 block">4. Efetivamente Pago</span>
              <p className="mt-1 text-slate-600">A ordem bancária foi emitida e os recursos foram depositados na conta do município ou entidade executora.</p>
            </div>
          </div>
        </section>

        {/* 5. Como comunicar erro ou sugestão */}
        <section className="space-y-3 border-t border-slate-200 pt-8">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-900" />
            <h2 className="text-lg font-bold text-slate-900">
              5. Comunicação de Erros ou Inconsistências
            </h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Se você identificar qualquer divergência entre os números desta plataforma e os registros nos diários oficiais da Câmara dos Deputados, do Senado Federal ou da Controladoria-Geral da União, utilize os canais de contato para reporte imediato:
          </p>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs text-xs space-y-2">
            <p className="text-slate-700">
              <strong>Equipe de Integridade de Dados:</strong> <span className="font-mono text-blue-900">transparencia@voceon.gov.br</span> (endereço conceitual para o protótipo funcional)
            </p>
            <p className="text-slate-500">
              Todas as correções de sincronização de cache são processadas automaticamente a cada ciclo de atualização das fontes governamentais.
            </p>
          </div>
        </section>

        <AdSlot slot="page_bottom" />
      </div>
    </div>
  );
};
