/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Landmark, Menu, X, Activity } from 'lucide-react';

export type NavTab = 'inicio' | 'votacoes' | 'gastos' | 'emendas' | 'termometro' | 'sobre';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenFontesModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenFontesModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: Array<{ id: NavTab; label: string }> = [
    { id: 'inicio', label: 'Início' },
    { id: 'votacoes', label: 'Como votou?' },
    { id: 'gastos', label: 'Gastos parlamentares' },
    { id: 'emendas', label: 'Emendas parlamentares' },
    { id: 'termometro', label: 'Termômetro da Rua' },
    { id: 'sobre', label: 'Sobre os dados' },
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark (Single text element with icon) */}
        <button
          onClick={() => handleNavClick('inicio')}
          className="flex items-center gap-2.5 text-left text-slate-900 transition hover:opacity-90 focus:outline-none shrink-0"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-900 text-white shadow-xs">
            <Landmark className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
            VOCÊ ON
          </span>
        </button>

        {/* Zone 2: Navigation Links (single-line, clean text links) */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`transition-colors whitespace-nowrap cursor-pointer py-1 ${
                  isActive
                    ? 'font-semibold text-blue-900 border-b-2 border-blue-900'
                    : 'hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action (Status das Fontes / Integridade) */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenFontesModal}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 whitespace-nowrap cursor-pointer"
            title="Verificar integridade e latência das fontes oficiais"
          >
            <Activity className="h-3.5 w-3.5 text-emerald-600" />
            <span>Fontes Oficiais Ativas</span>
          </button>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none"
            aria-label="Alternar menu de navegação"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-50 font-semibold text-blue-900'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}
            <div className="mt-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenFontesModal();
                }}
                className="flex w-full items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-left text-xs font-medium text-slate-700"
              >
                <Activity className="h-3.5 w-3.5 text-emerald-600" />
                <span>Status de Conexão das Fontes Oficiais</span>
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
