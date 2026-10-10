import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { LoadingSkeleton, ErrorAlert } from '../../components/common/Feedback';
import { fetchDataset, fetchDatasetPreview, uploadDataset, preprocessDataset } from '../../services/api';
import { Dataset, DatasetPreview, PreprocessResult } from '../../types';

interface DatasetsPageProps {
  datasetId: string;
  onDatasetUploaded: () => void;
}

export const DatasetsPage: React.FC<DatasetsPageProps> = ({ datasetId, onDatasetUploaded }) => {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [preview, setPreview] = useState<DatasetPreview | null>(null);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Upload state
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Preprocessing state
  const [imputeStrategy, setImputeStrategy] = useState<string>('mean');
  const [dropDups, setDropDups] = useState<boolean>(true);
  const [scalingMethod, setScalingMethod] = useState<string>('standard');
  const [outlierHandling, setOutlierHandling] = useState<string>('clip_iqr');
  const [encodingMethod, setEncodingMethod] = useState<string>('onehot');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [preprocResult, setPreprocResult] = useState<PreprocessResult | null>(null);
  const [preprocLoading, setPreprocLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!datasetId) return;
    setLoading(true);
    setError(null);

    Promise.all([
      fetchDataset(datasetId),
      fetchDatasetPreview(datasetId, 1, 15)
    ])
      .then(([ds, prev]) => {
        setDataset(ds);
        setPreview(prev);
        setPage(1);
        setSelectedFeatures(ds.columns.map(c => c.name));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch dataset');
        setLoading(false);
      });
  }, [datasetId]);

  const handlePageChange = (newPage: number) => {
    if (!datasetId) return;
    setPage(newPage);
    fetchDatasetPreview(datasetId, newPage, 15)
      .then(setPreview)
      .catch(console.error);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const res = await uploadDataset(file);
      setUploadSuccess(`Ingested ${res.name} (${res.row_count} rows, ${res.column_count} columns)`);
      onDatasetUploaded();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload dataset');
    } finally {
      setUploading(false);
    }
  };

  const handleRunPreprocessing = async () => {
    if (!datasetId) return;
    setPreprocLoading(true);

    try {
      const res = await preprocessDataset(datasetId, {
        imputation_strategy: imputeStrategy,
        drop_duplicates: dropDups,
        scaling_method: scalingMethod,
        outlier_handling: outlierHandling,
        categorical_encoding: encodingMethod,
        feature_selection: selectedFeatures
      });
      setPreprocResult(res);
    } catch (err: any) {
      alert(`Preprocessing failed: ${err.message}`);
    } finally {
      setPreprocLoading(false);
    }
  };

  const toggleFeature = (name: string) => {
    setSelectedFeatures(prev =>
      prev.includes(name) ? prev.filter(f => f !== name) : [...prev, name]
    );
  };

  if (loading) return <LoadingSkeleton message="Inspecting dataset schema and profiles..." />;
  if (error) return <ErrorAlert message={error} />;
  if (!dataset) return null;

  return (
    <div>
      <PageHeader
        title="Dataset Workspace & Feature Preparation"
        description="Inspect schema metadata, profile column distributions, view observation records, and configure reproducible data cleaning."
      />

      {/* Upload & Ingestion Strip */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Ingest Traffic Corpus</div>
            <div className="card-subtitle">
              Upload local CSV or ARFF files with timestamps, velocities, volume, or spatial coordinates
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
            <span>{uploading ? 'Processing File...' : 'Upload File (.csv or .arff)'}</span>
            <input
              type="file"
              accept=".csv,.arff"
              onChange={handleFileUpload}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            Max file limit 50MB. Automatic schema verification and column inference applied.
          </span>
        </div>

        {uploadError && (
          <div style={{ marginTop: '12px' }}>
            <ErrorAlert message={uploadError} />
          </div>
        )}
        {uploadSuccess && (
          <div style={{
            marginTop: '12px',
            backgroundColor: 'rgba(5, 150, 105, 0.15)',
            border: '1px solid #059669',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            color: '#10B981',
            fontSize: '0.82rem'
          }}>
            [OK] {uploadSuccess}
          </div>
        )}
      </div>

      {/* Column Profile Table */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Column Profile & Data Hygiene Audit</div>
            <div className="card-subtitle">
              Inferred data types, missingness rates, unique cardinalities, and numerical boundaries
            </div>
          </div>
          <span className="badge badge-neutral">{dataset.columns.length} Attributes Defined</span>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Column Name</th>
                <th>Inferred Type</th>
                <th>Missing Values</th>
                <th>Unique Count</th>
                <th>Min / Max</th>
                <th>Mean ± Std</th>
                <th>Sample Preview</th>
              </tr>
            </thead>
            <tbody>
              {dataset.columns.map((col) => (
                <tr key={col.name}>
                  <td><strong style={{ color: 'var(--text-main)' }}>{col.name}</strong></td>
                  <td>
                    <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                      {col.inferred_type}
                    </span>
                  </td>
                  <td>
                    {col.missing_count === 0 ? (
                      <span style={{ color: '#059669' }}>0 (0%)</span>
                    ) : (
                      <span style={{ color: '#DC2626' }}>{col.missing_count} ({col.missing_pct}%)</span>
                    )}
                  </td>
                  <td>{col.unique_count.toLocaleString()}</td>
                  <td>
                    {col.min_val !== null && col.max_val !== null ? (
                      <span>{col.min_val} to {col.max_val}</span>
                    ) : (
                      <span style={{ color: 'var(--text-dim)' }}>-</span>
                    )}
                  </td>
                  <td>
                    {col.mean_val !== null ? (
                      <span>{col.mean_val} ± {col.std_val}</span>
                    ) : (
                      <span style={{ color: 'var(--text-dim)' }}>-</span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {col.sample_values?.slice(0, 3).join(', ') || '-'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginated Dataset Preview */}
      {preview && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <div>
              <div className="card-title">Observation Records Preview</div>
              <div className="card-subtitle">
                Rows {((page - 1) * preview.page_size) + 1} to {Math.min(page * preview.page_size, preview.total_rows)} of {preview.total_rows.toLocaleString()}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                className="btn btn-secondary"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
                style={{ padding: '4px 10px' }}
              >
                Prev
              </button>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Page {page} of {Math.ceil(preview.total_rows / preview.page_size)}
              </span>
              <button
                className="btn btn-secondary"
                disabled={page >= Math.ceil(preview.total_rows / preview.page_size)}
                onClick={() => handlePageChange(page + 1)}
                style={{ padding: '4px 10px' }}
              >
                Next
              </button>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  {preview.columns.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, idx) => (
                  <tr key={idx}>
                    {preview.columns.map((c) => (
                      <td key={c}>
                        {row[c] !== null && row[c] !== undefined ? String(row[c]) : <span style={{ color: '#DC2626' }}>null</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preprocessing Workflow */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Feature Engineering & Preprocessing Pipeline</div>
            <div className="card-subtitle">
              Configure deterministic data cleaning, missing imputation, outlier boundaries, and scaling
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleRunPreprocessing}
            disabled={preprocLoading}
          >
            {preprocLoading ? 'Processing...' : 'Execute Preprocessing'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '16px' }}>
          <div className="form-group">
            <label className="form-label">Missing Value Imputation</label>
            <select
              className="form-select"
              value={imputeStrategy}
              onChange={(e) => setImputeStrategy(e.target.value)}
            >
              <option value="mean">Mean (Numerical Columns)</option>
              <option value="median">Median (Outlier-Resistant)</option>
              <option value="mode">Mode / Most Frequent</option>
              <option value="drop">Drop Incomplete Rows</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Outlier Mitigation</label>
            <select
              className="form-select"
              value={outlierHandling}
              onChange={(e) => setOutlierHandling(e.target.value)}
            >
              <option value="clip_iqr">Clip at 1.5x IQR</option>
              <option value="drop_zscore">Filter Rows with |Z| &gt; 3</option>
              <option value="none">No Outlier Transformation</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Numerical Scaling</label>
            <select
              className="form-select"
              value={scalingMethod}
              onChange={(e) => setScalingMethod(e.target.value)}
            >
              <option value="standard">StandardScaler (Zero Mean, Unit Var)</option>
              <option value="minmax">MinMaxScaler [0, 1]</option>
              <option value="robust">RobustScaler (Median / IQR)</option>
              <option value="none">None (Keep Raw Units)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Categorical Encoding</label>
            <select
              className="form-select"
              value={encodingMethod}
              onChange={(e) => setEncodingMethod(e.target.value)}
            >
              <option value="onehot">One-Hot Encoding (Dummies)</option>
              <option value="label">Label Encoding (Ordinal Integers)</option>
              <option value="none">Pass-Through Strings</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div className="form-label" style={{ marginBottom: '6px' }}>Active Features for Model Fitting:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {dataset.columns.map((col) => {
              const active = selectedFeatures.includes(col.name);
              return (
                <button
                  key={col.name}
                  type="button"
                  onClick={() => toggleFeature(col.name)}
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
                  {col.name} {active ? '[x]' : '[ ]'}
                </button>
              );
            })}
          </div>
        </div>

        {preprocResult && (
          <div style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px',
            marginTop: '12px'
          }}>
            <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
              [OK] Transformations Applied
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginBottom: '10px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Row Delta:</span>
                <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                  {preprocResult.original_rows} to {preprocResult.processed_rows}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Feature Columns:</span>
                <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                  {preprocResult.original_cols} to {preprocResult.processed_cols}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Transformations:</span>
              <ul style={{ margin: '4px 0 0 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {preprocResult.transformations_applied.map((t, idx) => (
                  <li key={idx}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
