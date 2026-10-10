import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { MetricCard } from '../../components/common/MetricCard';
import { LoadingSkeleton, ErrorAlert } from '../../components/common/Feedback';
import { TrafficMap } from '../../components/maps/TrafficMap';
import { fetchOverview, fetchCorridorsGeo } from '../../services/api';
import { OverviewMetrics, CorridorGeoItem } from '../../types';
import {
  Gauge, Car, Calendar, CheckCircle, AlertOctagon, MapPin
} from 'lucide-react';
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

  // Congestion Pie data
  const pieColors: Record<string, string> = {
    Low: '#10B981',
    Moderate: '#38BDF8',
    High: '#F59E0B',
    Severe: '#EF4444'
  };

  const pieData = Object.entries(metrics.congestion_breakdown).map(([name, value]) => ({
    name,
    value,
    color: pieColors[name] || '#94A3B8'
  }));

  return (
    <div>
      <PageHeader
        title="Mobility Command Center"
        description="Comprehensive spatial and temporal traffic performance overview computed across monitored urban corridors."
      />

      {/* KPI Metrics */}
      <div className="metrics-grid">
        <MetricCard
          label="Total Observations"
          value={metrics.total_observations.toLocaleString()}
          icon={<Calendar size={18} />}
          detail={metrics.date_start ? `${metrics.date_start.slice(0, 10)} to ${metrics.date_end?.slice(0, 10)}` : 'Dataset period'}
        />
        <MetricCard
          label="Monitored Corridors"
          value={metrics.unique_segments}
          icon={<MapPin size={18} />}
          detail="Key arterial sectors"
        />
        <MetricCard
          label="Network Avg Speed"
          value={metrics.avg_speed_kmh ? `${metrics.avg_speed_kmh} km/h` : 'N/A'}
          icon={<Gauge size={18} />}
          badge={<span className="badge badge-mod">Monitored Flow</span>}
        />
        <MetricCard
          label="Avg Hourly Volume"
          value={metrics.avg_vehicle_volume ? `${metrics.avg_vehicle_volume.toLocaleString()} veh/h` : 'N/A'}
          icon={<Car size={18} />}
          detail="Per corridor window"
        />
        <MetricCard
          label="Data Completeness"
          value={`${metrics.completeness_pct}%`}
          icon={<CheckCircle size={18} />}
          badge={<span className="badge badge-low">Verified</span>}
        />
      </div>

      {/* Geospatial Map & Congestion Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <MapPin size={18} style={{ color: 'var(--accent-teal)' }} />
                Spatial Corridor Intelligence
              </div>
              <div className="card-subtitle">
                Interactive geospatial locations with measured flow parameters
              </div>
            </div>
            <span className="badge badge-neutral">{corridors.length} Corridors Plotted</span>
          </div>
          <TrafficMap corridors={corridors} height="420px" />
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div>
              <div className="card-title">
                <AlertOctagon size={18} style={{ color: 'var(--accent-teal)' }} />
                Congestion Distribution
              </div>
              <div className="card-subtitle">Observed network congestion states</div>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: '260px' }}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#111C2E', borderColor: '#1E293B', borderRadius: '6px', color: '#F8FAFC' }}
                  itemStyle={{ color: '#F8FAFC' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
            {pieData.map(item => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: item.color }} />
                <span style={{ color: 'var(--text-muted)' }}>{item.name}:</span>
                <strong style={{ color: '#F8FAFC' }}>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hourly Trend Composed Chart */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div>
            <div className="card-title">24-Hour Diurnal Speed vs Volume Profile</div>
            <div className="card-subtitle">
              System-wide average vehicle speed (km/h) plotted against traffic volume (veh/h) across time of day
            </div>
          </div>
        </div>
        <div style={{ height: '320px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={metrics.hourly_trend}>
              <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="hour" stroke="#64748B" tickFormatter={(h) => `${h}:00`} />
              <YAxis yAxisId="left" stroke="#14B8A6" label={{ value: 'Speed (km/h)', angle: -90, position: 'insideLeft', fill: '#14B8A6' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#6366F1" label={{ value: 'Volume (veh/h)', angle: 90, position: 'insideRight', fill: '#6366F1' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111C2E', borderColor: '#1E293B', borderRadius: '6px', color: '#F8FAFC' }}
                formatter={(val: any, name: string) => [val, name === 'avg_speed' ? 'Avg Speed (km/h)' : 'Traffic Volume (veh/h)']}
                labelFormatter={(h) => `Time: ${h}:00`}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Bar yAxisId="right" dataKey="avg_volume" fill="rgba(99, 102, 241, 0.45)" name="Traffic Volume" radius={[4, 4, 0, 0]} />
              <Line yAxisId="left" type="monotone" dataKey="avg_speed" stroke="#14B8A6" strokeWidth={3} dot={{ r: 4, fill: '#14B8A6' }} name="Avg Speed" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekday vs Weekend & Priority Bottleneck Corridors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        {/* Day Comparison */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Weekday vs Weekend Profile</div>
              <div className="card-subtitle">Commute divergence comparison</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {metrics.weekday_vs_weekend.map((d) => (
              <div
                key={d.day_type}
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong style={{ color: '#F8FAFC', fontSize: '0.95rem' }}>{d.day_type}</strong>
                  <span className={`badge ${d.severe_congestion_pct > 20 ? 'badge-high' : 'badge-low'}`}>
                    {d.severe_congestion_pct}% Severe/High Congestion
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
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

        {/* Priority Bottleneck Corridors */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Highest-Priority Bottleneck Corridors</div>
              <div className="card-subtitle">
                Ranked by composite bottleneck risk score (severe congestion frequency + speed deficit)
              </div>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Corridor Name</th>
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
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{p.segment_id}</div>
                    </td>
                    <td>
                      <strong style={{ color: p.avg_speed < 20 ? '#EF4444' : (p.avg_speed < 32 ? '#F59E0B' : '#10B981') }}>
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
                      <span style={{ fontWeight: 700, color: p.risk_score > 40 ? '#EF4444' : '#F59E0B' }}>
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
