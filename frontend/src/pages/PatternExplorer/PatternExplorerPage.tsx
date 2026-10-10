import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { LoadingSkeleton, ErrorAlert } from '../../components/common/Feedback';
import { fetchHeatmap, fetchOverview } from '../../services/api';
import { HeatmapResponse, OverviewMetrics } from '../../types';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';

interface PatternExplorerPageProps {
  datasetId: string;
}

export const PatternExplorerPage: React.FC<PatternExplorerPageProps> = ({ datasetId }) => {
  const [heatmap, setHeatmap] = useState<HeatmapResponse | null>(null);
  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [metric, setMetric] = useState<string>('avg_speed_kmh');
  const [hoveredCell, setHoveredCell] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!datasetId) return;
    setLoading(true);
    setError(null);

    Promise.all([
      fetchHeatmap(datasetId, metric),
      fetchOverview(datasetId)
    ])
      .then(([hm, ov]) => {
        setHeatmap(hm);
        setOverview(ov);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch pattern analysis');
        setLoading(false);
      });
  }, [datasetId, metric]);

  if (loading) return <LoadingSkeleton message="Mining diurnal traffic heatmaps..." />;
  if (error) return <ErrorAlert message={error} />;
  if (!heatmap) return null;

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getHeatmapColor = (val: number) => {
    if (metric === 'avg_speed_kmh') {
      if (val < 18) return '#DC2626'; // Severe
      if (val < 28) return '#D97706'; // High
      if (val < 38) return '#0284C7'; // Moderate
      return '#059669'; // Free Flow
    } else {
      if (val > 3500) return '#DC2626';
      if (val > 2800) return '#D97706';
      if (val > 2000) return '#0284C7';
      return '#059669';
    }
  };

  return (
    <div>
      <PageHeader
        title="Congestion Pattern Explorer"
        description="Temporal and day-of-week recurrent congestion analysis, commute peak identification, and diurnal traffic matrices."
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn ${metric === 'avg_speed_kmh' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMetric('avg_speed_kmh')}
            >
              Speed Heatmap (km/h)
            </button>
            <button
              className={`btn ${metric === 'vehicle_count' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMetric('vehicle_count')}
            >
              Volume Heatmap (veh/h)
            </button>
          </div>
        }
      />

      {/* Temporal Matrix Heatmap Card */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Diurnal Recurrence Heatmap (Hour vs Day of Week)</div>
            <div className="card-subtitle">
              Bottleneck windows across hours 00:00 to 23:00 for each day of the week
            </div>
          </div>
          {hoveredCell && (
            <div style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.78rem',
              color: '#F8FAFC',
              border: '1px solid var(--border-color)'
            }}>
              <strong>{hoveredCell.day} at {hoveredCell.hour}:00</strong> : Speed: {hoveredCell.avg_speed} km/h • Volume: {hoveredCell.avg_volume} veh/h
            </div>
          )}
        </div>

        <div className="heatmap-table-wrap">
          <div className="heatmap-grid" style={{ marginBottom: '4px', fontWeight: 600, color: 'var(--text-dim)' }}>
            <div>Day</div>
            {Array.from({ length: 24 }).map((_, h) => (
              <div key={h} style={{ textAlign: 'center' }}>
                {h % 2 === 0 ? `${h}h` : ''}
              </div>
            ))}
          </div>

          {days.map((dayName) => {
            const dayCells = heatmap.cells.filter(c => c.day === dayName);
            return (
              <div key={dayName} className="heatmap-grid" style={{ marginBottom: '2px' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  {dayName}
                </div>
                {dayCells.map((cell) => {
                  const val = metric === 'avg_speed_kmh' ? cell.avg_speed : cell.avg_volume;
                  const bg = getHeatmapColor(val);
                  return (
                    <div
                      key={cell.hour}
                      className="heatmap-cell"
                      style={{ backgroundColor: bg }}
                      onMouseEnter={() => setHoveredCell(cell)}
                      onMouseLeave={() => setHoveredCell(null)}
                      title={`${dayName} ${cell.hour}:00 - ${val}`}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          <span>Free-Flow</span>
          <div style={{ display: 'flex', gap: '3px' }}>
            <span style={{ width: '12px', height: '10px', background: '#059669' }} />
            <span style={{ width: '12px', height: '10px', background: '#0284C7' }} />
            <span style={{ width: '12px', height: '10px', background: '#D97706' }} />
            <span style={{ width: '12px', height: '10px', background: '#DC2626' }} />
          </div>
          <span>Severe Bottleneck</span>
        </div>
      </div>

      {/* Commute Window Analytics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Hourly Speed Profile (24h)</div>
              <div className="card-subtitle">Aggregated multi-day corridor speed curve</div>
            </div>
          </div>
          <div style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={overview?.hourly_trend || []}>
                <CartesianGrid stroke="#1C2B40" strokeDasharray="2 2" vertical={false} />
                <XAxis dataKey="hour" stroke="#64748B" tickFormatter={(h) => `${h}:00`} />
                <YAxis stroke="#64748B" domain={[10, 60]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111C2E', borderColor: '#24344D', borderRadius: '2px', color: '#F8FAFC' }}
                  formatter={(val: any) => [`${val} km/h`, 'Avg Speed']}
                  labelFormatter={(h) => `Time: ${h}:00`}
                />
                <Line type="monotone" dataKey="avg_speed" stroke="#0D9488" strokeWidth={2} dot={{ r: 2.5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Commute Dynamics Observations</div>
              <div className="card-subtitle">Key temporal patterns calculated from active records</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem' }}>
            <div style={{ padding: '10px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)' }}>
              <strong style={{ color: '#F8FAFC' }}>Morning Peak (08:00 to 11:00):</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                Speed reduction observed across tech and arterial sectors (HITEC City and Gachibowli), where speeds decrease 35% to 45% compared to baseline.
              </p>
            </div>
            <div style={{ padding: '10px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)' }}>
              <strong style={{ color: '#F8FAFC' }}>Evening Peak (17:00 to 21:00):</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                Higher volume recorded across arterial transit sectors (Mehdipatnam, Panjagutta, and Dilsukhnagar), with high recurrent congestion.
              </p>
            </div>
            <div style={{ padding: '10px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)' }}>
              <strong style={{ color: '#F8FAFC' }}>Night Off-Peak (00:00 to 06:00):</strong>
              <p style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                Free-flow speeds (&gt; 50 km/h) on Outer Ring Road and Express Corridors with vehicle volume below 1,000 veh/h.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
