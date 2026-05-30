import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useSession } from '../auth/useSession';
import { getMetrics, type MetricsPeriod } from '../api/metrics';
import type { MetricsResponse } from '../types/api';
import { AppShell } from '../components/AppShell';
import './MetricasPage.css';

const PERIOD_OPTIONS: { value: MetricsPeriod; label: string }[] = [
  { value: '7d', label: '7 días' },
  { value: '30d', label: '30 días' },
  { value: '90d', label: '90 días' },
];

export function MetricasPage() {
  const { username } = useSession();
  const [period, setPeriod] = useState<MetricsPeriod>('30d');
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMetrics(username, period);
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las métricas');
    } finally {
      setLoading(false);
    }
  }, [username, period]);

  useEffect(() => {
    void load();
  }, [load]);

  const chartData = metrics?.trend.map((point) => ({
    ...point,
    label: new Date(point.date + 'T12:00:00').toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    }),
  })) ?? [];

  return (
    <AppShell title="Métricas">
      <div className="metricas-page card card--elevated">
        <div className="metricas-toolbar">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`metricas-period-btn ${period === opt.value ? 'is-active' : ''}`}
              onClick={() => setPeriod(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {loading && <p className="metricas-status">Cargando…</p>}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        {metrics && !loading && (
          <>
            <div className="metricas-stats">
              <article className="metricas-stat">
                <span className="metricas-stat-label">Media de ánimo</span>
                <strong className="metricas-stat-value">
                  {metrics.totalEntries > 0 ? metrics.averageMood.toFixed(1) : '—'}
                </strong>
              </article>
              <article className="metricas-stat">
                <span className="metricas-stat-label">Racha actual</span>
                <strong className="metricas-stat-value">{metrics.entryStreak} días</strong>
              </article>
              <article className="metricas-stat">
                <span className="metricas-stat-label">Entradas en el periodo</span>
                <strong className="metricas-stat-value">{metrics.totalEntries}</strong>
              </article>
            </div>

            {chartData.length > 0 ? (
              <div className="metricas-chart">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="moodScore" stroke="#6b4ce6" strokeWidth={2} dot />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="metricas-empty">
                Aún no hay entradas en este periodo.{' '}
                <Link to="/app/diario">Escribe en tu diario</Link>.
              </p>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
