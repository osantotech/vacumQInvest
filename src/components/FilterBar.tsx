'use client';

import React from 'react';

interface FilterBarProps {
  filters: {
    indicador?: string;
    ativo?: string;
    direcao?: string;
    status?: string;
  };
  onFilterChange: (key: string, value: string) => void;
}

export default function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  return (
    <div className="filter-bar flex flex-wrap gap-4 mb-4">
      <div className="filter-group form-group mb-0">
        <label>Indicador</label>
        <select 
          value={filters.indicador || ''} 
          onChange={(e) => onFilterChange('indicador', e.target.value)}
        >
          <option value="">Todos</option>
          <option value="Entrada e Saída v1.16">Entrada e Saída v1.16</option>
          <option value="VacumQ Grécia v1.5">VacumQ Grécia v1.5</option>
          <option value="VQ Pullback v1.7">VQ Pullback v1.7</option>
        </select>
      </div>

      <div className="filter-group form-group mb-0">
        <label>Ativo</label>
        <input 
          type="text" 
          placeholder="Buscar ativo..." 
          value={filters.ativo || ''}
          onChange={(e) => onFilterChange('ativo', e.target.value)}
        />
      </div>

      <div className="filter-group form-group mb-0">
        <label>Direção</label>
        <select 
          value={filters.direcao || ''}
          onChange={(e) => onFilterChange('direcao', e.target.value)}
        >
          <option value="">Todas</option>
          <option value="LONG">LONG</option>
          <option value="SHORT">SHORT</option>
          <option value="SCALP_LONG">SCALP_LONG</option>
          <option value="SCALP_SHORT">SCALP_SHORT</option>
        </select>
      </div>

      <div className="filter-group form-group mb-0">
        <label>Status</label>
        <select 
          value={filters.status || ''}
          onChange={(e) => onFilterChange('status', e.target.value)}
        >
          <option value="">Todos</option>
          <option value="open">Aberto</option>
          <option value="closed">Fechado</option>
        </select>
      </div>
    </div>
  );
}
