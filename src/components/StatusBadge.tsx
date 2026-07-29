import React from 'react';
import type { DirecaoType, ConfiancaNota } from '@/lib/types';

interface StatusBadgeProps {
  type: 'direction' | 'status' | 'confidence';
  value: string;
}

export default function StatusBadge({ type, value }: StatusBadgeProps) {
  if (type === 'direction') {
    switch (value as DirecaoType) {
      case 'LONG':
        return <span className="badge badge-long">LONG</span>;
      case 'SHORT':
        return <span className="badge badge-short">SHORT</span>;
      case 'SCALP_LONG':
        return <span className="badge badge-scalp">SCALP LONG</span>;
      case 'SCALP_SHORT':
        return <span className="badge badge-scalp">SCALP SHORT</span>;
      default:
        return <span className="badge border border-border">{value}</span>;
    }
  }

  if (type === 'status') {
    switch (value) {
      case 'Aberto':
        return <span className="badge badge-open">🟡 Aberto</span>;
      case 'Fechado':
        return <span className="badge badge-closed">✅ Fechado</span>;
      case 'STOP':
        return <span className="badge badge-stop">🔴 Stop</span>;
      case 'TP1':
      case 'TP2':
      case 'TP3':
        return <span className="badge badge-closed">✅ {value}</span>;
      case 'MANUAL':
        return <span className="badge badge-open" style={{ borderColor: 'var(--yellow)' }}>🟡 Manual</span>;
      case '3X':
        return <span className="badge" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>3X</span>;
      default:
        return <span className="badge border border-border">{value}</span>;
    }
  }

  if (type === 'confidence') {
    switch (value as ConfiancaNota) {
      case 'A+':
        return <span className="badge badge-a-plus">{value}</span>;
      case 'A':
        return <span className="badge badge-a">{value}</span>;
      case 'B':
        return <span className="badge badge-b">{value}</span>;
      case 'C':
        return <span className="badge badge-c">{value}</span>;
      case 'D':
        return <span className="badge badge-d">{value}</span>;
      default:
        return <span className="badge border border-border">{value}</span>;
    }
  }

  return <span className="badge border border-border">{value}</span>;
}
