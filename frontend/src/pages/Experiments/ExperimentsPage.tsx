import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { LoadingSkeleton, EmptyState, ErrorAlert } from '../../components/common/Feedback';
import { fetchExperiments } from '../../services/api';
import { ExperimentItem } from '../../types';

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

  if (loading) return <LoadingSkeleton message="Retrieving experiment run logs..." />;
  if (error) return <ErrorAlert message={error} />;

  const filtered = experiments.filter(e => taskFilter === 'ALL' || e.task_type === taskFilter);

  return (
    <div>
      <PageHeader
        title="Experiment Center & Reproducibility Hub"
        description="Unified registry of executed modeling runs, hyperparameter configurations, evaluation metrics, and reproducible tracking records."
      />

      <div className="card" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Filter by Task:</span>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['ALL', 'classification', 'clustering', 'association', 'anomaly'].map(task => (
            <button
              key={task}
              className={`btn ${taskFilter === task ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '4px 10px', fontSize: '0.78rem', textTransform: 'capitalize' }}
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
          message="Run a model in Classification, Segment Intelligence, Association Rules, or Anomaly Monitor and click 'Save Experiment' to log your runs here."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filtered.map((exp) => (
            <div key={exp.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ color: 'var(--text-main)', fontSize: '0.98rem', margin: 0 }}>{exp.name}</h3>
                    <span className="badge badge-mod" style={{ textTransform: 'uppercase' }}>
                      {exp.task_type}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                    Logged: {new Date(exp.created_at).toLocaleString()} • ID: {exp.id}
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                {exp.results_summary}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', background: 'var(--bg-surface-elevated)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Parameters</span>
                  <pre style={{ color: '#38BDF8', fontSize: '0.72rem', marginTop: '2px', overflowX: 'auto', fontFamily: 'monospace' }}>
                    {JSON.stringify(exp.parameters, null, 2)}
                  </pre>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Evaluation Metrics</span>
                  <pre style={{ color: '#059669', fontSize: '0.72rem', marginTop: '2px', overflowX: 'auto', fontFamily: 'monospace' }}>
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
