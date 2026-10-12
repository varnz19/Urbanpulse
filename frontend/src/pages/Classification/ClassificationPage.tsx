import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { LoadingSkeleton, ErrorAlert } from '../../components/common/Feedback';
import { runClassification, saveExperiment, fetchDataset } from '../../services/api';
import { ClassifyResponse } from '../../types';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';

interface ClassificationPageProps {
  datasetId: string;
}

export const ClassificationPage: React.FC<ClassificationPageProps> = ({ datasetId }) => {
  const [modelType, setModelType] = useState<string>('decision_tree');
  const [targetCol, setTargetCol] = useState<string>('congestion_level');
  const [allCols, setAllCols] = useState<string[]>([]);
  const [featureCols, setFeatureCols] = useState<string[]>(['avg_speed_kmh', 'vehicle_count', 'hour', 'weather', 'road_type']);
  const [maxDepth, setMaxDepth] = useState<number>(4);
  const [testSize, setTestSize] = useState<number>(0.2);
  const [result, setResult] = useState<ClassifyResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (!datasetId) return;
    fetchDataset(datasetId)
      .then((ds) => {
        const colNames = ds.columns.map(c => c.name);
        setAllCols(colNames);

        // Pick best target column
        let chosenTarget = colNames.find(c => ['congestion_level', 'congestion', 'status', 'label', 'target'].includes(c.toLowerCase()));
        if (!chosenTarget && colNames.length > 0) {
          // Choose the last column as target default
          chosenTarget = colNames[colNames.length - 1];
        }
        if (chosenTarget) {
          setTargetCol(chosenTarget);
          const remaining = colNames.filter(c => c !== chosenTarget && c !== 'Unnamed: 0');
          setFeatureCols(remaining.slice(0, 5));
        }
      })
      .catch(console.error);
  }, [datasetId]);

  const availableFeatures = allCols
    .filter(c => c !== targetCol && c !== 'Unnamed: 0')
    .map(c => ({ id: c, label: c }));

  const handleRunModel = async () => {
    if (!datasetId) return;
    setLoading(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const res = await runClassification(datasetId, {
        model_type: modelType,
        target_column: targetCol,
        feature_columns: featureCols,
        test_size: testSize,
        max_depth: maxDepth,
        random_state: 42
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Model training and evaluation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExperiment = async () => {
    if (!result || !datasetId) return;
    try {
      await saveExperiment({
        dataset_id: datasetId,
        name: `${result.model_name}`,
        task_type: 'classification',
        parameters: { model_type: modelType, features: featureCols, test_size: testSize, max_depth: maxDepth },
        metrics: { accuracy: result.accuracy, macro_f1: result.macro_f1, cv_mean_accuracy: result.cv_mean_accuracy },
        results_summary: `Accuracy: ${(result.accuracy * 100).toFixed(1)}%, Macro F1: ${result.macro_f1}. Evaluated on ${result.total_test_samples} test records.`
      });
      setSavedSuccess(true);
    } catch (err: any) {
      alert(`Failed to save: ${err.message}`);
    }
  };

  const toggleFeature = (id: string) => {
    setFeatureCols(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const fiData = result?.feature_importance
    ? Object.entries(result.feature_importance).map(([feature, importance]) => ({
        feature,
        importance: Number(importance)
      }))
    : [];

  return (
    <div>
      <PageHeader
        title="Congestion Classification & Explainability"
        description="Train, evaluate, and interpret supervised classification models to classify road congestion levels with leak-free validation and decision rules."
      />

      {/* Model Configuration Card */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Classification Model Architecture</div>
            <div className="card-subtitle">Choose learning algorithm, depth limits, and predictor attributes</div>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleRunModel}
            disabled={loading || featureCols.length === 0}
          >
            <span>{loading ? 'Fitting Model...' : 'Train Model'}</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '14px' }}>
          <div className="form-group">
            <label className="form-label">Algorithm</label>
            <select
              className="form-select"
              value={modelType}
              onChange={(e) => setModelType(e.target.value)}
            >
              <option value="decision_tree">Decision Tree Classifier</option>
              <option value="naive_bayes">Gaussian Naive Bayes</option>
              <option value="oner">OneR Baseline (Single-Attribute Stump)</option>
              <option value="rules">Rule-Based Decision List</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Target Attribute</label>
            <select
              className="form-select"
              value={targetCol}
              onChange={(e) => {
                const newT = e.target.value;
                setTargetCol(newT);
                setFeatureCols(prev => prev.filter(c => c !== newT));
              }}
            >
              {allCols.filter(c => c !== 'Unnamed: 0').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Test Split: {Math.round(testSize * 100)}%</label>
            <input
              type="range"
              min="0.1"
              max="0.4"
              step="0.05"
              value={testSize}
              onChange={(e) => setTestSize(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-teal)', marginTop: '6px' }}
            />
          </div>

          {modelType === 'decision_tree' && (
            <div className="form-group">
              <label className="form-label">Max Tree Depth: {maxDepth}</label>
              <input
                type="range"
                min="2"
                max="8"
                value={maxDepth}
                onChange={(e) => setMaxDepth(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-teal)', marginTop: '6px' }}
              />
            </div>
          )}
        </div>

        <div>
          <label className="form-label" style={{ marginBottom: '6px' }}>Input Features:</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {availableFeatures.map((f) => {
              const active = featureCols.includes(f.id);
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

      {loading && <LoadingSkeleton message="Fitting classifier and evaluating cross-validation folds..." />}
      {error && <ErrorAlert message={error} />}

      {/* Model Performance Results */}
      {result && !loading && (
        <>
          {/* Top Performance Banner */}
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
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Overall Accuracy</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#059669' }}>
                  {(result.accuracy * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Macro F1-Score</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                  {result.macro_f1.toFixed(3)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>5-Fold CV Accuracy</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0284C7' }}>
                  {result.cv_mean_accuracy ? `${(result.cv_mean_accuracy * 100).toFixed(1)}%` : 'N/A'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Records (Train / Test)</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {result.total_train_samples} / {result.total_test_samples}
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

          {/* Confusion Matrix & Per-Class Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Confusion Matrix (Test Evaluation)</div>
                  <div className="card-subtitle">Predicted vs Actual target labels</div>
                </div>
              </div>

              <div className="table-container">
                <table className="data-table" style={{ textAlign: 'center' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Actual \ Pred</th>
                      {result.classes.map(c => <th key={c}>{c}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {result.classes.map((actClass, i) => (
                      <tr key={actClass}>
                        <td style={{ textAlign: 'left', fontWeight: 600 }}>{actClass}</td>
                        {result.classes.map((_, j) => {
                          const val = result.confusion_matrix[i][j];
                          const isDiagonal = i === j;
                          return (
                            <td
                              key={j}
                              style={{
                                backgroundColor: isDiagonal && val > 0 ? 'rgba(13, 148, 136, 0.2)' : 'transparent',
                                color: isDiagonal ? '#0D9488' : (val > 0 ? '#DC2626' : 'var(--text-dim)'),
                                fontWeight: isDiagonal ? 700 : 400
                              }}
                            >
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Per-Class Precision, Recall & F1</div>
                  <div className="card-subtitle">Class-specific discrimination metrics</div>
                </div>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Class</th>
                      <th>Precision</th>
                      <th>Recall</th>
                      <th>F1-Score</th>
                      <th>Support</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(result.per_class).map(([cName, metrics]) => (
                      <tr key={cName}>
                        <td>
                          <span className={`badge badge-${cName.toLowerCase()}`}>{cName}</span>
                        </td>
                        <td>{(metrics.precision * 100).toFixed(1)}%</td>
                        <td>{(metrics.recall * 100).toFixed(1)}%</td>
                        <td>
                          <strong style={{ color: 'var(--text-main)' }}>{metrics.f1_score.toFixed(3)}</strong>
                        </td>
                        <td>{metrics.support}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Feature Importance & Explainable Decision Rules */}
          <div style={{ display: 'grid', gridTemplateColumns: fiData.length > 0 ? '1fr 1fr' : '1fr', gap: '16px' }}>
            {fiData.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <div>
                    <div className="card-title">Gini Feature Importance</div>
                    <div className="card-subtitle">Contribution of attributes to split criteria</div>
                  </div>
                </div>
                <div style={{ height: '240px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fiData} layout="vertical" margin={{ left: 24, right: 16 }}>
                      <CartesianGrid stroke="#E2E8F0" horizontal={false} />
                      <XAxis type="number" stroke="#64748B" />
                      <YAxis dataKey="feature" type="category" stroke="#64748B" width={110} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', borderRadius: '4px', color: '#0F172A', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)' }}
                        formatter={(val: any) => [val, 'Importance']}
                      />
                      <Bar dataKey="importance" fill="#0284C7" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {result.decision_rules && result.decision_rules.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <div>
                    <div className="card-title">Decision Tree Rules</div>
                    <div className="card-subtitle">Extracted IF-THEN conditional splits</div>
                  </div>
                </div>
                <pre style={{
                  backgroundColor: '#0B1220',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px',
                  color: '#38BDF8',
                  fontSize: '0.75rem',
                  lineHeight: '1.5',
                  maxHeight: '240px',
                  overflowY: 'auto',
                  fontFamily: 'monospace'
                }}>
                  {result.decision_rules.join('\n')}
                </pre>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
