'use client';

import React from 'react';

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  /**
   * Tamanho da amostra por trás do valor ("0 de 4 fechadas").
   * Percentual sem denominador é propaganda, não estatística.
   */
  amostra?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'green' | 'red' | 'yellow' | 'accent';
}

export default function StatsCard({ icon, label, value, amostra, trend, color = 'accent' }: StatsCardProps) {
  return (
    <div className="card stat-card p-6 flex items-center gap-4">
      <div className={`stat-icon text-${color} p-3 rounded-full bg-${color}/10`}>
        {icon}
      </div>
      <div>
        <div className="stat-label text-sm text-text-secondary uppercase tracking-wider">{label}</div>
        <div className="stat-value text-2xl font-bold text-white mt-1">{value}</div>
        {amostra && (
          <div className="text-xs text-text-muted mt-1">{amostra}</div>
        )}
        {trend && (
          <div className={`text-sm mt-1 flex items-center gap-1 ${trend === 'up' ? 'text-green' : trend === 'down' ? 'text-red' : 'text-text-muted'}`}>
            {trend === 'up' && <span>▲</span>}
            {trend === 'down' && <span>▼</span>}
            {trend === 'neutral' && <span>—</span>}
          </div>
        )}
      </div>
    </div>
  );
}
