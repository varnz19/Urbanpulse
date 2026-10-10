import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { LoadingSkeleton, EmptyState, ErrorAlert } from '../../components/common/Feedback';
import { fetchExperiments } from '../../services/api';
import { ExperimentItem } from '../../types';
import { FlaskConical, Filter, Clock } from 'lucide-react';

interface ExperimentsPageProps {
  datasetId: string;
}

export const ExperimentsPage: React.FC<ExperimentsPageProps> = ({ datasetId }) => {
  const [experiments, setExperiments] = useState<ExperimentItem[]>([]);
  const [taskFilter, setTaskFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchExperiments(datasetId)
      .then((data) => {
        if (isMounted) {
          setExperiments(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to fetch experiments');
          setLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, [datasetId]);

  if (loading) return <LoadingSkeleton message="Retrieving experiment lineage and run logs..." />;
  if (error) return <ErrorAlert message={error} />;

  const filtered = experiments.filter(e => taskFilter === 'ALL' || e.task_type === taskFilter);

  return (
    <div>
      <PageHeader
        title="Experiment Center & Reproducibility Hub"
        description="Unified registry of executed modeling runs, hyperparameter configurations, evaluation metrics, and reproducible tracking records."
      />

      {/* Filter Toolbar */}
      <div className="card" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Filter size={16} style={{ color: 'var(--accent-teal)' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Filter by Model Task:</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['ALL', 'classification', 'clustering', 'association', 'anomaly'].map(task => (
            <button
              key={task}
              className={`btn ${taskFilter === task ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '0.8rem', textTransform: 'capitalize' }}
              onClick={() => setTaskFilter(task)}
            >
              {task === 'ALL' ? 'All Tasks' : task}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No Experiments Recorded Yet"
          message="Run a model in Classification, Segment Intelligence, Association Rules, or Anomaly Monitor and click 'Save to Experiments' to log your runs here."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map((exp) => (
            <div key={exp.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ color: '#F8FAFC', fontSize: '1.05rem', margin: 0 }}>{exp.name}</h3>
                    <span className="badge badge-mod" style={{ textTransform: 'uppercase' }}>
                      {exp.task_type}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                    <Clock size={12} />
                    <span>Logged at {new Date(exp.created_at).toLocaleString()} • ID: {exp.id}</span>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                {exp.results_summary}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', background: 'var(--bg-surface-elevated)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Parameters</span>
                  <pre style={{ color: '#38BDF8', fontSize: '0.75rem', marginTop: '4px', overflowX: 'auto', fontFamily: 'monospace' }}>
                    {JSON.stringify(exp.parameters, null, 2)}
                  </pre>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Recorded Evaluation Metrics</span>
                  <pre style={{ color: '#10B981', fontSize: '0.75rem', marginTop: '4px', overflowX: 'auto', fontFamily: 'monospace' }}>
                    {JSON.stringify(exp.metrics, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
