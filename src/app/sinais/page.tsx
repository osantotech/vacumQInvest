'use client';

import { useEffect, useState } from 'react';
import FilterBar from '@/components/FilterBar';
import StatusBadge from '@/components/StatusBadge';
import AlertModal from '@/components/AlertModal';
import ResultForm from '@/components/ResultForm';
import ManualAlertForm from '@/components/ManualAlertForm';
import { formatPrice, formatDateTimeBR } from '@/lib/calculations';
import type { AlertWithResult } from '@/lib/types';

export default function Sinais() {
  const [alerts, setAlerts] = useState<AlertWithResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [filters, setFilters] = useState({
    indicador: '',
    ativo: '',
    direcao: '',
    status: ''
  });

  const [selectedAlert, setSelectedAlert] = useState<AlertWithResult | null>(null);
  const [showResultFormFor, setShowResultFormFor] = useState<string | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      query.append('page', page.toString());
      if (filters.indicador) query.append('indicador', filters.indicador);
      if (filters.ativo) query.append('ativo', filters.ativo);
      if (filters.direcao) query.append('direcao', filters.direcao);
      if (filters.status) query.append('status', filters.status);

      const res = await fetch(`/api/alerts?${query.toString()}`);
      if (!res.ok) throw new Error('Falha ao carregar sinais');
      
      const data = await res.json();
      setAlerts(data.data || []);
      setTotalPages(Math.ceil((data.pagination?.total || 0) / (data.pagination?.limit || 20)) || 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleRegisterResult = (alertId: string) => {
    setSelectedAlert(null);
    setShowResultFormFor(alertId);
  };

  const onResultSaved = () => {
    setShowResultFormFor(null);
    fetchAlerts();
  };

  const onManualAlertSaved = () => {
    setShowManualForm(false);
    fetchAlerts();
  };

  return (
    <div className="animate-in">
      <div className="page-header flex-between mb-6">
        <div>
          <h1>Sinais ao Vivo</h1>
          <p className="page-subtitle">Acompanhe e gerencie todos os alertas recebidos</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowManualForm(true)}>+ Novo Sinal</button>
      </div>

      <FilterBar filters={filters} onFilterChange={handleFilterChange} />

      {error && <div className="text-red p-4 bg-red-bg rounded border border-red/20 mb-4">{error}</div>}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Ativo</th>
              <th>TF</th>
              <th>Indicador</th>
              <th>Direção</th>
              <th>Entrada</th>
              <th>Stop</th>
              <th>TP1</th>
              <th>TP2</th>
              <th>TP3</th>
              <th>Confiança</th>
              <th>Mercado</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i}>
                  <td colSpan={13}><div className="skeleton h-8 w-full rounded"></div></td>
                </tr>
              ))
            ) : alerts.length === 0 ? (
              <tr>
                <td colSpan={13} className="text-center text-text-muted py-8">Nenhum sinal encontrado com os filtros atuais</td>
              </tr>
            ) : (
              alerts.map(alert => (
                <tr 
                  key={alert.id} 
                  className="cursor-pointer hover:bg-bg-card-hover"
                  onClick={() => setSelectedAlert(alert)}
                >
                  <td>{formatDateTimeBR(alert.created_at)}</td>
                  <td className="font-bold">{alert.ativo}</td>
                  <td>{alert.timeframe}m</td>
                  <td className="text-xs">{alert.indicador.replace('Entrada e Saída', 'E&S').replace('VacumQ Grécia', 'Grécia').replace('VQ Pullback', 'VQ PB')}</td>
                  <td><StatusBadge type="direction" value={alert.direcao} /></td>
                  <td className="font-mono">{formatPrice(alert.preco_entrada)}</td>
                  <td className="font-mono text-red">{formatPrice(alert.stop)}</td>
                  <td className="font-mono text-green">{formatPrice(alert.tp1)}</td>
                  <td className="font-mono text-green">{formatPrice(alert.tp2)}</td>
                  <td className="font-mono text-green">{formatPrice(alert.tp3)}</td>
                  <td>{alert.confianca_nota ? <StatusBadge type="confidence" value={alert.confianca_nota} /> : '—'}</td>
                  <td className={alert.mercado_nota === 'FORTE' ? 'text-green' : alert.mercado_nota === 'FRACO' ? 'text-red' : 'text-yellow'}>
                    {alert.mercado_nota || '—'}
                  </td>
                  <td><StatusBadge type="status" value={alert.result ? alert.result.status : 'Aberto'} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex-between mt-4">
        <button 
          className="btn btn-secondary btn-sm" 
          disabled={page === 1 || loading}
          onClick={() => setPage(p => p - 1)}
        >
          Anterior
        </button>
        <span className="text-sm text-text-muted">Página {page} de {totalPages || 1}</span>
        <button 
          className="btn btn-secondary btn-sm" 
          disabled={page >= totalPages || loading}
          onClick={() => setPage(p => p + 1)}
        >
          Próxima
        </button>
      </div>

      <AlertModal 
        alert={selectedAlert} 
        onClose={() => setSelectedAlert(null)} 
        onRegisterResult={handleRegisterResult} 
      />

      <ResultForm 
        alertId={showResultFormFor} 
        alert={alerts.find(a => a.id === showResultFormFor) || null}
        onClose={() => setShowResultFormFor(null)} 
        onSaved={onResultSaved} 
      />

      {showManualForm && (
        <ManualAlertForm 
          onClose={() => setShowManualForm(false)} 
          onSaved={onManualAlertSaved} 
        />
      )}
    </div>
  );
}
