import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { MetricCard } from '../../components/common/MetricCard';
import { LoadingSkeleton, ErrorAlert } from '../../components/common/Feedback';
import { TrafficMap } from '../../components/maps/TrafficMap';
import { fetchOverview, fetchCorridorsGeo } from '../../services/api';
import { OverviewMetrics, CorridorGeoItem } from '../../types';
import {
  ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis,
  Tooltip, Legend, CartesianGrid, PieChart, Pie, Cell
} from 'recharts';

interface OverviewPageProps {
  datasetId: string;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ datasetId }) => {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [corridors, setCorridors] = useState<CorridorGeoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!datasetId) return;
    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      fetchOverview(datasetId),
      fetchCorridorsGeo(datasetId)
    ])
      .then(([overviewData, geoData]) => {
        if (isMounted) {
          setMetrics(overviewData);
          setCorridors(geoData);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load command center data');
          setLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, [datasetId]);

  if (loading) return <LoadingSkeleton message="Aggregating mobility metrics across corridors..." />;
  if (error) return <ErrorAlert message={error} onRetry={() => window.location.reload()} />;
  if (!metrics) return null;

  // Disciplined congestion state colors: green, blue, amber, red
  const pieColors: Record<string, string> = {
    Low: '#059669',
    Moderate: '#0284C7',
    High: '#D97706',
    Severe: '#DC2626'
  };

  const pieData = Object.entries(metrics.congestion_breakdown).map(([name, value]) => ({
    name,
    value,
    color: pieColors[name] || '#64748B'
  }));

  return (
    <div>
      <PageHeader
        title="Mobility Command Center"
        description="Spatial and temporal traffic performance metrics computed across monitored urban corridors."
      />

      {/* KPI Metrics: 5-column functional telemetry strip */}
      <div className="metrics-grid">
        <MetricCard
          label="Observations"
          value={metrics.total_observations.toLocaleString()}
          detail={metrics.date_start ? `${metrics.date_start.slice(0, 10)} to ${metrics.date_end?.slice(0, 10)}` : 'Dataset period'}
        />
        <MetricCard
          label="Corridors"
          value={metrics.unique_segments}
          detail="Monitored sectors"
        />
        <MetricCard
          label="Network Avg Speed"
          value={metrics.avg_speed_kmh ? `${metrics.avg_speed_kmh} km/h` : 'N/A'}
          badge={<span className="badge badge-mod">Observed Flow</span>}
        />
        <MetricCard
          label="Avg Hourly Volume"
          value={metrics.avg_vehicle_volume ? `${metrics.avg_vehicle_volume.toLocaleString()} veh/h` : 'N/A'}
          detail="Per corridor window"
        />
        <MetricCard
          label="Completeness"
          value={`${metrics.completeness_pct}%`}
          badge={<span className="badge badge-low">Verified</span>}
        />
      </div>

      {/* Geospatial Map & Congestion Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Corridor Spatial Locations</div>
              <div className="card-subtitle">
                Geospatial coordinates with measured speed and volume parameters
              </div>
            </div>
            <span className="badge badge-neutral">{corridors.length} Corridors</span>
          </div>
          <TrafficMap corridors={corridors} height="400px" />
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div>
              <div className="card-title">Congestion Distribution</div>
              <div className="card-subtitle">Observed network congestion states</div>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: '230px' }}>
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#111C2E" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#111C2E', borderColor: '#24344D', borderRadius: '2px', color: '#F8FAFC' }}
                  itemStyle={{ color: '#F8FAFC' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
            {pieData.map(item => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
                <span style={{ width: '8px', height: '8px', backgroundColor: item.color }} />
                <span style={{ color: 'var(--text-muted)' }}>{item.name}:</span>
                <strong style={{ color: '#F8FAFC' }}>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hourly Trend Profile */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <div>
            <div className="card-title">24-Hour Diurnal Speed vs Volume Profile</div>
            <div className="card-subtitle">
              Average speed (km/h) plotted against volume (veh/h) across time of day
            </div>
          </div>
        </div>
        <div style={{ height: '280px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={metrics.hourly_trend}>
              <CartesianGrid stroke="#1C2B40" strokeDasharray="2 2" vertical={false} />
              <XAxis dataKey="hour" stroke="#64748B" tickFormatter={(h) => `${h}:00`} />
              <YAxis yAxisId="left" stroke="#0D9488" label={{ value: 'Speed (km/h)', angle: -90, position: 'insideLeft', fill: '#0D9488' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#64748B" label={{ value: 'Volume (veh/h)', angle: 90, position: 'insideRight', fill: '#64748B' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111C2E', borderColor: '#24344D', borderRadius: '2px', color: '#F8FAFC' }}
                formatter={(val: any, name: any) => [val, name === 'avg_speed' ? 'Speed (km/h)' : 'Volume (veh/h)']}
                labelFormatter={(h) => `Time: ${h}:00`}
              />
              <Legend wrapperStyle={{ paddingTop: '8px' }} />
              <Bar yAxisId="right" dataKey="avg_volume" fill="#24344D" name="Volume" />
              <Line yAxisId="left" type="monotone" dataKey="avg_speed" stroke="#0D9488" strokeWidth={2} dot={{ r: 3, fill: '#0D9488' }} name="Speed" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekday vs Weekend & Priority Bottleneck Corridors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Weekday vs Weekend Profile</div>
              <div className="card-subtitle">Commute divergence comparison</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {metrics.weekday_vs_weekend.map((d) => (
              <div
                key={d.day_type}
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <strong style={{ color: '#F8FAFC', fontSize: '0.88rem' }}>{d.day_type}</strong>
                  <span className={`badge ${d.severe_congestion_pct > 20 ? 'badge-high' : 'badge-low'}`}>
                    {d.severe_congestion_pct}% Severe/High
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.8rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Mean Speed:</span>
                    <div style={{ color: '#F8FAFC', fontWeight: 600 }}>{d.avg_speed} km/h</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Avg Volume:</span>
                    <div style={{ color: '#F8FAFC', fontWeight: 600 }}>{d.avg_volume.toLocaleString()} veh/h</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Priority Bottleneck Corridors</div>
              <div className="card-subtitle">
                Ranked by composite risk score (severe congestion frequency and speed deficit)
              </div>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Corridor</th>
                  <th>Avg Speed</th>
                  <th>Avg Volume</th>
                  <th>Severe Rate</th>
                  <th>Dominant State</th>
                  <th>Risk Score</th>
                </tr>
              </thead>
              <tbody>
                {metrics.top_priority_corridors.map((p) => (
                  <tr key={p.segment_id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#F8FAFC' }}>{p.segment_name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{p.segment_id}</div>
                    </td>
                    <td>
                      <strong style={{ color: p.avg_speed < 20 ? '#DC2626' : (p.avg_speed < 32 ? '#D97706' : '#059669') }}>
                        {p.avg_speed} km/h
                      </strong>
                    </td>
                    <td>{p.avg_volume.toLocaleString()} veh/h</td>
                    <td>{p.congestion_rate}%</td>
                    <td>
                      <span className={`badge badge-${p.dominant_congestion.toLowerCase()}`}>
                        {p.dominant_congestion}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: p.risk_score > 40 ? '#DC2626' : '#D97706' }}>
                        {p.risk_score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
