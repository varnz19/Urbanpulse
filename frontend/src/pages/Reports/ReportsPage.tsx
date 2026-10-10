import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { LoadingSkeleton, ErrorAlert } from '../../components/common/Feedback';
import { fetchReportSummary } from '../../services/api';

interface ReportsPageProps {
  datasetId: string;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ datasetId }) => {
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!datasetId) return;
    setLoading(true);
    setError(null);

    fetchReportSummary(datasetId)
      .then(setReport)
      .catch((err) => setError(err.message || 'Failed to generate report'))
      .finally(() => setLoading(false));
  }, [datasetId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadMarkdown = () => {
    window.open(`/api/reports/${datasetId}/export-markdown`, '_blank');
  };

  if (loading) return <LoadingSkeleton message="Synthesizing computed findings and generating executive report..." />;
  if (error) return <ErrorAlert message={error} />;
  if (!report) return null;

  return (
    <div>
      <PageHeader
        title="Urban Mobility Intelligence Report"
        description="Synthesized analytical brief generated directly from computed historical traffic observations, clustering profiles, and spatial risk indices."
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={handleDownloadMarkdown}>
              <span>Export Markdown</span>
            </button>
            <button className="btn btn-primary" onClick={handlePrint}>
              <span>Print / Save PDF</span>
            </button>
          </div>
        }
      />

      <div className="card" style={{ padding: '28px', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="badge badge-mod" style={{ marginBottom: '6px' }}>Executive Briefing</span>
              <h2 style={{ fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                {report.title}
              </h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Dataset: {report.dataset_meta.name} ({report.dataset_meta.format.toUpperCase()}) • Generated: {report.generated_at ? new Date(report.generated_at).toLocaleDateString() : 'Current Session'}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              <div>UrbanPulse Engine</div>
              <div style={{ color: 'var(--accent-cyan)' }}>Verified Computation</div>
            </div>
          </div>
        </div>

        <section style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '0.98rem', color: 'var(--text-main)', marginBottom: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
            1. Investigation Scope & Data Hygiene
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', background: 'var(--bg-surface-elevated)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Total Observations:</span>
              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{report.dataset_meta.total_records.toLocaleString()}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Monitored Corridors:</span>
              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{report.dataset_meta.unique_corridors} Corridors</div>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Coverage Period:</span>
              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{report.dataset_meta.date_coverage}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Data Completeness:</span>
              <div style={{ fontWeight: 700, color: '#059669' }}>{report.dataset_meta.data_completeness}</div>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '0.98rem', color: 'var(--text-main)', marginBottom: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
            2. System-Wide Network Performance
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px', lineHeight: 1.5 }}>
            The monitored network exhibited an average velocity of <strong>{report.network_performance.average_speed_kmh} km/h</strong> alongside a mean hourly corridor volume of <strong>{report.network_performance.average_volume_veh_hr?.toLocaleString()} veh/h</strong>. Congestion classification breakdown:
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {Object.entries(report.network_performance.congestion_distribution).map(([c, count]: any) => (
              <div key={c} style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                <span className={`badge badge-${c.toLowerCase()}`} style={{ marginBottom: '3px' }}>{c}</span>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)' }}>{count}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '0.98rem', color: '#F8FAFC', marginBottom: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
            3. Priority Bottleneck Corridors
          </h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Corridor Location</th>
                  <th>Mean Speed</th>
                  <th>Mean Volume</th>
                  <th>Severe Rate</th>
                  <th>Dominant State</th>
                  <th>Risk Score</th>
                </tr>
              </thead>
              <tbody>
                {report.priority_corridors.map((p: any) => (
                  <tr key={p.segment_id}>
                    <td><strong>{p.segment_name}</strong></td>
                    <td>{p.avg_speed} km/h</td>
                    <td>{p.avg_volume.toLocaleString()} veh/h</td>
                    <td>{p.congestion_rate}%</td>
                    <td><span className={`badge badge-${p.dominant_congestion.toLowerCase()}`}>{p.dominant_congestion}</span></td>
                    <td><strong style={{ color: p.risk_score > 40 ? '#DC2626' : '#D97706' }}>{p.risk_score}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h3 style={{ fontSize: '0.98rem', color: 'var(--text-main)', marginBottom: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
            4. Methodological Provenance & Caveats
          </h3>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            <p style={{ marginBottom: '6px' }}>
              <strong>Dataset Provenance:</strong> {report.provenance?.notes || 'Observations drawn from verified historical traffic sensors.'}
            </p>
            <p>
              <strong>Analytical Caveat:</strong> Calculations reflect historical observations. Weather-induced congestion peaks reflect measured speed drops rather than predictive simulations.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
