'use client';

import React, { useEffect, useRef } from 'react';
import type { AlertWithResult } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import { formatPrice, formatPct, formatDateTimeBR, formatDuration } from '@/lib/calculations';

interface AlertModalProps {
  alert: AlertWithResult | null;
  onClose: () => void;
  onRegisterResult: (alertId: string) => void;
}

export default function AlertModal({ alert, onClose, onRegisterResult }: AlertModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (alert && dialogRef.current) {
      dialogRef.current.showModal();
    } else if (!alert && dialogRef.current) {
      dialogRef.current.close();
    }
  }, [alert]);

  if (!alert) return null;

  return (
    <dialog ref={dialogRef} onClose={onClose} className="bg-glass border-glass-border">
      <div className="dialog-header">
        <h2>{alert.ativo} · {alert.timeframe}m</h2>
        <button className="btn-close" onClick={onClose}>✕</button>
      </div>
      <div className="dialog-body space-y-4">
        
        <div className="grid grid-cols-2 gap-4 bg-bg-secondary p-4 rounded-radius-sm border border-border">
          <div>
            <div className="text-xs text-text-secondary uppercase mb-1">Indicador</div>
            <div className="font-semibold">{alert.indicador}</div>
          </div>
          <div>
            <div className="text-xs text-text-secondary uppercase mb-1">Direção</div>
            <StatusBadge type="direction" value={alert.direcao} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="card p-4">
            <div className="text-xs text-text-secondary uppercase mb-2">Entrada & Stop</div>
            <div className="space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-text-muted">Entrada:</span>
                <span className="text-white">{formatPrice(alert.preco_entrada)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Stop:</span>
                <span className="text-red">{formatPrice(alert.stop)}</span>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="text-xs text-text-secondary uppercase mb-2">Alvos (TP)</div>
            <div className="space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-text-muted">TP1:</span>
                <span className="text-green">{formatPrice(alert.tp1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">TP2:</span>
                <span className="text-green">{formatPrice(alert.tp2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">TP3:</span>
                <span className="text-green">{formatPrice(alert.tp3)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="bg-bg-input p-3 rounded text-center border border-border">
            <div className="text-xs text-text-secondary mb-1">Confiança</div>
            {alert.confianca_nota ? <StatusBadge type="confidence" value={alert.confianca_nota} /> : '—'}
          </div>
          <div className="bg-bg-input p-3 rounded text-center border border-border">
            <div className="text-xs text-text-secondary mb-1">Mercado</div>
            <span className={alert.mercado_nota === 'FORTE' ? 'text-green font-semibold' : alert.mercado_nota === 'FRACO' ? 'text-red font-semibold' : 'text-yellow font-semibold'}>
              {alert.mercado_nota || '—'}
            </span>
          </div>
          <div className="bg-bg-input p-3 rounded text-center border border-border">
            <div className="text-xs text-text-secondary mb-1">Via Entrada</div>
            <span className="font-semibold">{alert.via_entrada || '—'}</span>
          </div>
        </div>

        {alert.veredito && (
          <div className="bg-bg-input p-3 rounded text-sm border border-border">
            <span className="text-xs text-text-secondary block mb-1">Veredito</span>
            <span className="italic text-text-primary">&quot;{alert.veredito}&quot;</span>
          </div>
        )}

        {alert.result && (
          <div className="mt-4 p-4 rounded-radius-sm border bg-bg-secondary border-accent">
            <h3 className="text-sm font-semibold text-accent mb-3 uppercase tracking-wider">Resultado Registrado</h3>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm font-mono">
              <div className="flex justify-between">
                <span className="text-text-secondary font-sans">Saída:</span>
                <span className="text-white">{formatPrice(alert.result.preco_saida)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary font-sans">Data:</span>
                <span className="text-text-primary">{formatDateTimeBR(alert.result.data_saida)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary font-sans">Duração:</span>
                <span className="text-text-primary">{alert.result.duracao_minutos ? formatDuration(alert.result.duracao_minutos) : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary font-sans">Status:</span>
                <span className="font-sans"><StatusBadge type="status" value={alert.result.status} /></span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary font-sans">P&L:</span>
                <span className={alert.result.resultado_pct && alert.result.resultado_pct > 0 ? 'text-green' : 'text-red'}>
                  {formatPct(alert.result.resultado_pct)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary font-sans">Spread (20x):</span>
                <span className={alert.result.resultado_marg && alert.result.resultado_marg > 0 ? 'text-green font-bold' : 'text-red font-bold'}>
                  {formatPct(alert.result.resultado_marg)}
                </span>
              </div>
            </div>
            {alert.result.observacao && (
              <div className="mt-3 pt-3 border-t border-border text-sm">
                <span className="text-text-secondary">Obs:</span> {alert.result.observacao}
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-text-muted text-right mt-2">
          Criado em: {formatDateTimeBR(alert.created_at)} · {alert.origem}
        </div>

        {alert.webhook_raw && (
          <details className="text-xs text-text-muted mt-2 cursor-pointer">
            <summary className="mb-2 hover:text-text-primary transition-colors">Ver JSON original (Webhook)</summary>
            <pre className="bg-[#0d1117] p-3 rounded overflow-x-auto border border-border">
              {JSON.stringify(alert.webhook_raw, null, 2)}
            </pre>
          </details>
        )}
      </div>
      <div className="dialog-footer">
        <button className="btn btn-secondary" onClick={onClose}>Fechar</button>
        {!alert.result && (
          <button className="btn btn-primary" onClick={() => onRegisterResult(alert.id)}>
            Registrar Resultado
          </button>
        )}
      </div>
    </dialog>
  );
}
