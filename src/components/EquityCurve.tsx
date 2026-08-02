'use client';

import { useEffect, useRef, useState } from 'react';

export interface EquityPoint {
  /** Rótulo do eixo X (data da operação) */
  label: string;
  /** Resultado acumulado até esta operação, em % */
  value: number;
}

interface EquityCurveProps {
  points: EquityPoint[];
  height?: number;
}

const VERDE = '#00E676';
const VERMELHO = '#FF5252';
const CINZA = '#787B86';

/**
 * Curva de capital: o acumulado operação a operação.
 *
 * Substitui o donut que estava aqui. Donut mostra composição de um todo — que
 * fatia do bolo cada categoria ocupa. Resultado acumulado é evolução no tempo,
 * e as três perguntas que se faz ao abrir o dashboard (quanto, quando, e está
 * melhorando?) nenhuma delas um donut responde.
 *
 * SVG puro, sem biblioteca de gráficos: são duas dezenas de linhas e evita
 * 40kB de dependência no primeiro carregamento.
 */
export default function EquityCurve({ points, height = 260 }: EquityCurveProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [largura, setLargura] = useState(600);
  const [revelado, setRevelado] = useState(false);

  // viewBox com preserveAspectRatio esticaria a linha e deformaria o ponto
  // final em elipse. Medir a largura real mantém a geometria honesta.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const observer = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) setLargura(w);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setRevelado(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const padTop = 16;
  const padBottom = 24;
  const padLeft = 44;
  const padRight = 12;

  const areaW = Math.max(largura - padLeft - padRight, 10);
  const areaH = Math.max(height - padTop - padBottom, 10);

  if (points.length === 0) {
    return (
      <div
        ref={wrapRef}
        className="flex items-center justify-center w-full"
        style={{ height }}
      >
        <span style={{ color: CINZA, fontSize: 13 }}>
          Nenhuma operação fechada ainda
        </span>
      </div>
    );
  }

  const valores = points.map(p => p.value);
  const bruto = { min: Math.min(0, ...valores), max: Math.max(0, ...valores) };

  // Uma curva colada no topo do quadro parece um teto. A folga de 8% dá ar e
  // impede que a linha do zero desapareça na borda quando tudo é positivo.
  const folga = (bruto.max - bruto.min) * 0.08 || 1;
  const min = bruto.min - folga;
  const max = bruto.max + folga;

  const x = (i: number) =>
    padLeft + (points.length === 1 ? areaW / 2 : (i / (points.length - 1)) * areaW);
  const y = (v: number) => padTop + areaH - ((v - min) / (max - min)) * areaH;

  const final = valores[valores.length - 1];
  const cor = final >= 0 ? VERDE : VERMELHO;

  const linha = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.value)}`).join(' ');
  const area = `${linha} L ${x(points.length - 1)} ${y(min)} L ${x(0)} ${y(min)} Z`;
  const yZero = y(0);

  const gradId = 'eq-grad';

  return (
    <div ref={wrapRef} style={{ width: '100%' }}>
      <svg width={largura} height={height} role="img" aria-label="Curva de capital acumulada">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={cor} stopOpacity="0.28" />
            <stop offset="100%" stopColor={cor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Zero: a única referência que importa — acima dela é lucro */}
        {yZero >= padTop && yZero <= padTop + areaH && (
          <>
            <line
              x1={padLeft} y1={yZero} x2={padLeft + areaW} y2={yZero}
              stroke="#2A2E39" strokeWidth="1" strokeDasharray="4 4"
            />
            <text x={padLeft - 8} y={yZero + 4} textAnchor="end" fontSize="10" fill={CINZA}>
              0%
            </text>
          </>
        )}

        <text x={padLeft - 8} y={padTop + 4} textAnchor="end" fontSize="10" fill={CINZA}>
          {max >= 0 ? '+' : ''}{max.toFixed(0)}%
        </text>
        <text x={padLeft - 8} y={padTop + areaH} textAnchor="end" fontSize="10" fill={CINZA}>
          {min >= 0 ? '+' : ''}{min.toFixed(0)}%
        </text>

        <path d={area} fill={`url(#${gradId})`} opacity={revelado ? 1 : 0} style={{ transition: 'opacity .6s ease' }} />

        <path
          d={linha}
          fill="none"
          stroke={cor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            // O traço se desenha da esquerda para a direita: a curva de capital
            // é uma história cronológica, e vê-la nascer comunica isso.
            strokeDasharray: 4000,
            strokeDashoffset: revelado ? 0 : 4000,
            transition: 'stroke-dashoffset 1.1s cubic-bezier(.22,.61,.36,1)',
          }}
        />

        <circle
          cx={x(points.length - 1)}
          cy={y(final)}
          r="4"
          fill={cor}
          opacity={revelado ? 1 : 0}
          style={{ transition: 'opacity .4s ease .9s' }}
        />

        <text x={padLeft} y={height - 6} fontSize="10" fill={CINZA}>
          {points[0].label}
        </text>
        {points.length > 1 && (
          <text x={padLeft + areaW} y={height - 6} fontSize="10" fill={CINZA} textAnchor="end">
            {points[points.length - 1].label}
          </text>
        )}
      </svg>
    </div>
  );
}
