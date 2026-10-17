/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Landmark, ExternalLink, ShieldCheck, HeartHandshake } from 'lucide-react';
import { NavTab } from './Navbar';

interface FooterProps {
  onSelectTab: (tab: NavTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab }) => {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Col 1: Brand & Commitment */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-900 text-white">
                <Landmark className="h-4 w-4" />
              </div>
              <span className="text-base font-bold text-slate-900">
                VOCÊ ON
              </span>
            </div>
            <p className="mt-3 max-w-md text-sm text-slate-600 leading-relaxed">
              Plataforma cidadã independente voltada à democratização do acesso a dados oficiais da Esplanada dos Ministérios e do Congresso Nacional. Transformamos registros públicos de votações, cotas parlamentares e emendas orçamentárias em informações claras e acessíveis.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Compromisso estrito com a neutralidade político-partidária e a integridade factual.</span>
            </div>
          </div>

          {/* Col 2: Ferramentas */}
          <div>
            <h3 className="text-xs font-semibold tracking-wider text-slate-900 uppercase">
              Ferramentas Cidadãs
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                <button
                  onClick={() => onSelectTab('votacoes')}
                  className="hover:text-blue-900 cursor-pointer"
                >
                  Como votou? (Votações Nominais)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('gastos')}
                  className="hover:text-blue-900 cursor-pointer"
                >
                  Gastos Parlamentares (CEAP)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('emendas')}
                  className="hover:text-blue-900 cursor-pointer"
                >
                  Emendas Parlamentares
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('sobre')}
                  className="hover:text-blue-900 cursor-pointer"
                >
                  Metodologia & Sobre os dados
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Fontes Oficiais */}
          <div>
            <h3 className="text-xs font-semibold tracking-wider text-slate-900 uppercase">
              Fontes Oficiais da União
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                <a
                  href="https://dadosabertos.camara.leg.br"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-blue-900"
                >
                  <span>Câmara dos Deputados API</span>
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://www12.senado.leg.br/dados-abertos"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-blue-900"
                >
                  <span>Senado Federal Dados Abertos</span>
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://portaldatransparencia.gov.br"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-blue-900"
                >
                  <span>Portal da Transparência (CGU)</span>
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row">
          <p>
            VOCÊ ON · Dados abertos regidos pela Lei de Acesso à Informação (Lei nº 12.527/2011).
          </p>
          <div className="flex items-center gap-1 text-slate-400">
            <HeartHandshake className="h-3.5 w-3.5" />
            <span>Desenvolvido para fortalecer a cidadania e o controle social.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
