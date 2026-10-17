/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './components/Home';
import { ComoVotou } from './components/ComoVotou';
import { GastosParlamentares } from './components/GastosParlamentares';
import { EmendasParlamentares } from './components/EmendasParlamentares';
import { SobreDados } from './components/SobreDados';
import { TermometroDaRua } from './components/TermometroDaRua';
import { StatusFontesModal } from './components/StatusFontesModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('inicio');
  const [searchQuery, setSearchQuery] = useState('');
  const [fontesModalOpen, setFontesModalOpen] = useState(false);

  const handleSearchFromHome = (query: string) => {
    setSearchQuery(query);
    setActiveTab('votacoes');
  };

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenFontesModal={() => setFontesModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {activeTab === 'inicio' && (
          <Home
            onSelectTab={handleSelectTab}
            onSearchSubmit={handleSearchFromHome}
          />
        )}

        {activeTab === 'votacoes' && (
          <ComoVotou initialSearchQuery={searchQuery} />
        )}

        {activeTab === 'gastos' && (
          <GastosParlamentares />
        )}

        {activeTab === 'emendas' && (
          <EmendasParlamentares />
        )}

        {activeTab === 'termometro' && (
          <TermometroDaRua />
        )}

        {activeTab === 'sobre' && (
          <SobreDados />
        )}
      </main>

      {/* Footer */}
      <Footer onSelectTab={handleSelectTab} />

      {/* Government Sources Status Modal */}
      <StatusFontesModal
        isOpen={fontesModalOpen}
        onClose={() => setFontesModalOpen(false)}
      />
    </div>
  );
}
