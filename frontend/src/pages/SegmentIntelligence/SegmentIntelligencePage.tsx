import React, { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { LoadingSkeleton, ErrorAlert } from '../../components/common/Feedback';
import { runClustering, saveExperiment } from '../../services/api';
import { ClusterResponse } from '../../types';
import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid, Cell
} from 'recharts';

interface SegmentIntelligencePageProps {
  datasetId: string;
}

export const SegmentIntelligencePage: React.FC<SegmentIntelligencePageProps> = ({ datasetId }) => {
  const [k, setK] = useState<number>(3);
  const [features, setFeatures] = useState<string[]>(['avg_speed_kmh', 'vehicle_count']);
  const [scaleFeatures, setScaleFeatures] = useState<boolean>(true);
  const [result, setResult] = useState<ClusterResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const availableFeatures = [
    { id: 'avg_speed_kmh', label: 'Average Speed (km/h)' },
    { id: 'vehicle_count', label: 'Vehicle Count (Volume)' },
    { id: 'hour', label: 'Hour of Day' },
    { id: 'is_weekend', label: 'Weekend Indicator' },
  ];

  const handleRunClustering = async () => {
    if (!datasetId) return;
    setLoading(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const res = await runClustering(datasetId, {
        features,
        k,
        scale_features: scaleFeatures
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Clustering execution failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToExperiments = async () => {
    if (!result || !datasetId) return;
    try {
      await saveExperiment({
        dataset_id: datasetId,
        name: `K-Means (K=${k}) Clustering`,
        task_type: 'clustering',
        parameters: { k, features, scale_features: scaleFeatures },
        metrics: { silhouette_score: result.silhouette_score, inertia: result.inertia },
        results_summary: `Partitioned into ${k} clusters with silhouette score ${result.silhouette_score}.`
      });
      setSavedSuccess(true);
    } catch (err: any) {
      alert(`Failed to save experiment: ${err.message}`);
    }
  };

  const toggleFeature = (id: string) => {
    setFeatures(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  // Disciplined cluster colors (no purple, pink, or rainbow)
  const clusterColors = ['#0D9488', '#0284C7', '#D97706', '#DC2626', '#475569', '#059669', '#64748B'];

  return (
    <div>
      <PageHeader
        title="Road Segment Intelligence"
        description="Unsupervised K-Means clustering and PCA projection to group road segments exhibiting similar speed, volume, and diurnal patterns."
      />

      {/* Configuration Controls */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Cluster Model Parameters</div>
            <div className="card-subtitle">Select clustering features, cluster count K, and feature scaling</div>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleRunClustering}
            disabled={loading || features.length === 0}
          >
            <span>{loading ? 'Fitting Model...' : 'Execute Clustering'}</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '14px' }}>
          <div>
            <label className="form-label">Cluster Count (K): {k}</label>
            <input
              type="range"
              min="2"
              max="7"
              value={k}
              onChange={(e) => setK(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-teal)', marginTop: '6px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              <span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span>
            </div>
          </div>

          <div>
            <label className="form-label" style={{ marginBottom: '6px' }}>Feature Standard Scaler</label>
            <div>
              <button
                type="button"
                className={`btn ${scaleFeatures ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setScaleFeatures(!scaleFeatures)}
              >
                {scaleFeatures ? 'Enabled (StandardScaler)' : 'Disabled (Raw Values)'}
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="form-label" style={{ marginBottom: '6px' }}>Active Clustering Features:</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {availableFeatures.map((f) => {
              const active = features.includes(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => toggleFeature(f.id)}
                  style={{
                    backgroundColor: active ? 'var(--bg-surface-elevated)' : 'var(--bg-primary)',
                    border: `1px solid ${active ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                    color: active ? 'var(--text-main)' : 'var(--text-muted)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '4px 10px',
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  {f.label} {active ? '[x]' : '[ ]'}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {loading && <LoadingSkeleton message="Fitting K-Means centroids and computing PCA projections..." />}
      {error && <ErrorAlert message={error} />}

      {/* Results View */}
      {result && !loading && (
        <>
          {/* Metrics summary banner */}
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
            <div style={{ display: 'flex', gap: '20px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Silhouette Score</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: result.silhouette_score > 0.35 ? '#059669' : '#D97706' }}>
                  {result.silhouette_score}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Inertia (WCSS)</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {result.inertia.toLocaleString()}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Clusters</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-teal)' }}>
                  K = {result.k}
                </div>
              </div>
            </div>

            <button
              className="btn btn-secondary"
              onClick={handleSaveToExperiments}
              disabled={savedSuccess}
            >
              <span>{savedSuccess ? '[OK] Saved' : 'Save Experiment'}</span>
            </button>
          </div>

          {/* 2D PCA Scatter Visualization */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-header">
              <div>
                <div className="card-title">2D Principal Component Projection (PCA)</div>
                <div className="card-subtitle">
                  Observations projected onto top 2 principal components, colored by cluster
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <span>PC1 Var: {(result.feature_importance_pca.PC1_variance_ratio * 100).toFixed(1)}%</span>
                <span>PC2 Var: {(result.feature_importance_pca.PC2_variance_ratio * 100).toFixed(1)}%</span>
              </div>
            </div>

            <div style={{ height: '340px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 16, right: 16, bottom: 16, left: 16 }}>
                  <CartesianGrid stroke="#E2E8F0" strokeDasharray="2 2" />
                  <XAxis type="number" dataKey="x" name="PC1" stroke="#64748B" />
                  <YAxis type="number" dataKey="y" name="PC2" stroke="#64748B" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', borderRadius: '4px', color: '#0F172A', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)' }}
                    formatter={(_val: any, _name: any, entry: any) => {
                      const p = entry.payload;
                      return [
                        `Cluster ${p.cluster + 1} | Speed: ${p.avg_speed} km/h | Volume: ${p.avg_volume}`,
                        p.segment_name
                      ];
                    }}
                  />
                  <Scatter name="Corridors" data={result.pca_projections}>
                    {result.pca_projections.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={clusterColors[entry.cluster % clusterColors.length]} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cluster Profile Cards - Clean borders, no colored left stripes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {result.cluster_profiles.map((prof) => (
              <div
                key={prof.cluster_id}
                className="card"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{prof.cluster_label}</strong>
                  <span className="badge badge-neutral">
                    {prof.member_count} obs ({prof.member_percentage}%)
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.4 }}>
                  {prof.description}
                </p>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '4px', textTransform: 'uppercase' }}>
                    Feature Means:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.78rem' }}>
                    {Object.entries(prof.feature_means).map(([feat, val]) => (
                      <div key={feat}>
                        <span style={{ color: 'var(--text-dim)' }}>{feat}:</span>
                        <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>{val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
