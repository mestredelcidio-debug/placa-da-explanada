/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface AdSlotProps {
  slot: 'home_top' | 'content_middle' | 'page_bottom';
  className?: string;
}

export const AdSlot: React.FC<AdSlotProps> = ({ slot, className = '' }) => {
  const labels: Record<string, string> = {
    home_top: 'Espaço Institucional Reservado · Formato Banner (728x90 / Responsivo)',
    content_middle: 'Espaço de Apoio Institucional · Formato Retângulo Médio (300x250 / Fluido)',
    page_bottom: 'Espaço de Divulgação Cidadã · Rodapé de Consulta',
  };

  return (
    <div
      className={`my-6 mx-auto w-full max-w-4xl rounded border border-dashed border-slate-200 bg-slate-50/60 p-4 text-center transition-colors ${className}`}
      aria-label="Espaço publicitário institucional reservado"
    >
      <div className="flex flex-col items-center justify-center gap-1.5 py-3">
        <span className="text-[11px] font-medium tracking-wider text-slate-400 uppercase">
          Espaço Reservado · Rede de Apoio e Sustentabilidade
        </span>
        <p className="text-xs text-slate-500">
          {labels[slot]}
        </p>
        <span className="text-[10px] text-slate-400">
          A publicidade não interfere na integridade, ordem de classificação ou neutralidade dos dados oficiais.
        </span>
      </div>
    </div>
  );
};
