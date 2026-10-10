import React, { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { LoadingSkeleton, ErrorAlert } from '../../components/common/Feedback';
import { runAnomalyDetection, saveExperiment } from '../../services/api';
import { AnomalyResponse } from '../../types';
import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';

interface AnomaliesPageProps {
  datasetId: string;
}

export const AnomaliesPage: React.FC<AnomaliesPageProps> = ({ datasetId }) => {
  const [method, setMethod] = useState<string>('isolation_forest');
  const [contamination, setContamination] = useState<number>(0.04);
  const [metricCol, setMetricCol] = useState<string>('avg_speed_kmh');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [result, setResult] = useState<AnomalyResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleRunDetection = async () => {
    if (!datasetId) return;
    setLoading(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const res = await runAnomalyDetection(datasetId, {
        method,
        contamination,
        metric_column: metricCol
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Anomaly detection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExperiment = async () => {
    if (!result || !datasetId) return;
    try {
      await saveExperiment({
        dataset_id: datasetId,
        name: `Anomaly Detection (${method})`,
        task_type: 'anomaly',
        parameters: { method, contamination, metric_column: metricCol },
        metrics: { anomalies_count: result.anomalies_count, anomaly_rate_pct: result.anomaly_rate_pct },
        results_summary: `Identified ${result.anomalies_count} anomalies (${result.anomaly_rate_pct}% rate) in ${metricCol}.`
      });
      setSavedSuccess(true);
    } catch (err: any) {
      alert(`Failed to save: ${err.message}`);
    }
  };

  const filteredAnomalies = result
    ? result.anomalies.filter(a => severityFilter === 'ALL' || a.severity === severityFilter)
    : [];

  return (
    <div>
      <PageHeader
        title="Traffic Anomaly Monitor"
        description="Detect statistical outliers and abrupt velocity drops using Isolation Forest and historical rolling baseline deviation scores."
      />

      <div style={{
        backgroundColor: 'rgba(2, 132, 199, 0.1)',
        border: '1px solid #0284C7',
        borderRadius: 'var(--radius-sm)',
        padding: '10px 14px',
        color: '#7DD3FC',
        fontSize: '0.8rem',
        marginBottom: '16px'
      }}>
        <strong>Operational Distinction:</strong> Statistical deviations indicate atypical sensor patterns relative to diurnal baselines. They represent candidates for investigation, not ground-truth verified physical incidents.
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Anomaly Detection Engine Configuration</div>
            <div className="card-subtitle">Choose detection algorithm, contamination rate, and evaluated metric</div>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleRunDetection}
            disabled={loading}
          >
            <span>{loading ? 'Evaluating...' : 'Run Anomaly Detection'}</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Algorithm</label>
            <select
              className="form-select"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="isolation_forest">Isolation Forest (Tree Ensemble)</option>
              <option value="zscore">Historical Baseline Z-Score (|Z| &gt; 2.5)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Target Metric</label>
            <select
              className="form-select"
              value={metricCol}
              onChange={(e) => setMetricCol(e.target.value)}
            >
              <option value="avg_speed_kmh">Average Speed (km/h)</option>
              <option value="vehicle_count">Vehicle Count (Volume)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Contamination Limit: {(contamination * 100).toFixed(0)}%</label>
            <input
              type="range"
              min="0.01"
              max="0.10"
              step="0.01"
              value={contamination}
              onChange={(e) => setContamination(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-teal)', marginTop: '6px' }}
            />
          </div>
        </div>
      </div>

      {loading && <LoadingSkeleton message="Computing Isolation Forest and rolling baseline deviations..." />}
      {error && <ErrorAlert message={error} />}

      {result && !loading && (
        <>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px 18px',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Records Evaluated</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {result.total_records.toLocaleString()}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Anomalies Flagged</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#DC2626' }}>
                  {result.anomalies_count}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Anomaly Rate</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-teal)' }}>
                  {result.anomaly_rate_pct}%
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Method</span>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0284C7', marginTop: '2px' }}>
                  {result.method_used === 'isolation_forest' ? 'Isolation Forest' : 'Z-Score Deviation'}
                </div>
              </div>
            </div>

            <button
              className="btn btn-secondary"
              onClick={handleSaveExperiment}
              disabled={savedSuccess}
            >
              <span>{savedSuccess ? '[OK] Saved' : 'Save Experiment'}</span>
            </button>
          </div>

          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-header">
              <div>
                <div className="card-title">Anomaly Deviation Timeline</div>
                <div className="card-subtitle">
                  Deviation score across observed sequence (higher indicates stronger anomaly)
                </div>
              </div>
            </div>
            <div style={{ height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 16, bottom: 16, left: 10 }}>
                  <CartesianGrid stroke="#E2E8F0" strokeDasharray="2 2" />
                  <XAxis dataKey="index" name="Index" stroke="#64748B" />
                  <YAxis dataKey="anomaly_score" name="Anomaly Score" stroke="#64748B" domain={[0, 1]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', borderRadius: '4px', color: '#0F172A', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)' }}
                    formatter={(_val: any, _name: any, entry: any) => {
                      const p = entry.payload;
                      return [
                        `${p.segment_name} | Obs: ${p.observed_value} vs Base: ${p.baseline_value} (${p.deviation_pct}%)`,
                        p.timestamp
                      ];
                    }}
                  />
                  <Scatter data={result.anomalies} fill="#E11D48" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Flagged Outlier Records</div>
                <div className="card-subtitle">Supporting evidence and historical baseline comparisons</div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['ALL', 'Critical', 'High', 'Moderate'].map((sev) => (
                  <button
                    key={sev}
                    className={`btn ${severityFilter === sev ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                    onClick={() => setSeverityFilter(sev)}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Corridor Location</th>
                    <th>Observed</th>
                    <th>Baseline</th>
                    <th>Deviation</th>
                    <th>Score</th>
                    <th>Severity</th>
                    <th>Supporting Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAnomalies.map((anom) => (
                    <tr key={anom.index}>
                      <td style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>{anom.timestamp}</td>
                      <td>
                        <strong style={{ color: 'var(--text-main)' }}>{anom.segment_name}</strong>
                      </td>
                      <td>
                        <strong style={{ color: anom.observed_value < anom.baseline_value ? '#DC2626' : '#059669' }}>
                          {anom.observed_value}
                        </strong>
                      </td>
                      <td>{anom.baseline_value}</td>
                      <td>
                        <span style={{ color: anom.deviation_pct < 0 ? '#DC2626' : '#D97706' }}>
                          {anom.deviation_pct}%
                        </span>
                      </td>
                      <td>{anom.anomaly_score.toFixed(2)}</td>
                      <td>
                        <span className={`badge badge-${anom.severity.toLowerCase()}`}>
                          {anom.severity}
                        </span>
                      </td>
                      <td style={{ maxWidth: '320px', whiteSpace: 'normal', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {anom.supporting_evidence}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
