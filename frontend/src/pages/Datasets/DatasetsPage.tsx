import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { LoadingSkeleton, ErrorAlert } from '../../components/common/Feedback';
import { fetchDataset, fetchDatasetPreview, uploadDataset, preprocessDataset } from '../../services/api';
import { Dataset, DatasetPreview, PreprocessResult } from '../../types';
import { Upload, Sliders, ChevronLeft, ChevronRight, Check } from 'lucide-react';

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
      setUploadSuccess(`Successfully ingested ${res.name} (${res.row_count} rows, ${res.column_count} columns)`);
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
        description="Inspect schema metadata, profile column distributions, view raw observation records, and configure a reproducible data cleaning pipeline."
      />

      {/* Upload & Ingestion Strip */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div>
            <div className="card-title">
              <Upload size={18} style={{ color: 'var(--accent-teal)' }} />
              Ingest New Traffic Corpus
            </div>
            <div className="card-subtitle">
              Upload local CSV or ARFF datasets with timestamps, speed/volume metrics, or coordinates
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
            <Upload size={14} />
            <span>{uploading ? 'Processing & Validating...' : 'Select File (.csv or .arff)'}</span>
            <input
              type="file"
              accept=".csv,.arff"
              onChange={handleFileUpload}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Max file limit 50MB. Automatic column type inference & schema validation applied.
          </span>
        </div>

        {uploadError && (
          <div style={{ marginTop: '14px' }}>
            <ErrorAlert message={uploadError} />
          </div>
        )}
        {uploadSuccess && (
          <div style={{
            marginTop: '14px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            color: '#10B981',
            fontSize: '0.85rem'
          }}>
            ✓ {uploadSuccess}
          </div>
        )}
      </div>

      {/* Data Profiling Table */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Column Profile & Data Quality Audit</div>
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
                  <td><strong style={{ color: '#F8FAFC' }}>{col.name}</strong></td>
                  <td>
                    <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                      {col.inferred_type}
                    </span>
                  </td>
                  <td>
                    {col.missing_count === 0 ? (
                      <span style={{ color: '#10B981' }}>0 (0%)</span>
                    ) : (
                      <span style={{ color: '#EF4444' }}>{col.missing_count} ({col.missing_pct}%)</span>
                    )}
                  </td>
                  <td>{col.unique_count.toLocaleString()}</td>
                  <td>
                    {col.min_val !== null && col.max_val !== null ? (
                      <span>{col.min_val} to {col.max_val}</span>
                    ) : (
                      <span style={{ color: 'var(--text-dim)' }}>—</span>
                    )}
                  </td>
                  <td>
                    {col.mean_val !== null ? (
                      <span>{col.mean_val} ± {col.std_val}</span>
                    ) : (
                      <span style={{ color: 'var(--text-dim)' }}>—</span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {col.sample_values?.slice(0, 3).join(', ') || '—'}
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
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <div>
              <div className="card-title">Observation Records Preview</div>
              <div className="card-subtitle">
                Showing rows {((page - 1) * preview.page_size) + 1} to {Math.min(page * preview.page_size, preview.total_rows)} of {preview.total_rows.toLocaleString()}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                className="btn btn-secondary"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
                style={{ padding: '6px 10px' }}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Page {page} of {Math.ceil(preview.total_rows / preview.page_size)}
              </span>
              <button
                className="btn btn-secondary"
                disabled={page >= Math.ceil(preview.total_rows / preview.page_size)}
                onClick={() => handlePageChange(page + 1)}
                style={{ padding: '6px 10px' }}
              >
                <ChevronRight size={16} />
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
                        {row[c] !== null && row[c] !== undefined ? String(row[c]) : <span style={{ color: '#EF4444' }}>null</span>}
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
            <div className="card-title">
              <Sliders size={18} style={{ color: 'var(--accent-teal)' }} />
              Feature Engineering & Preprocessing Pipeline
            </div>
            <div className="card-subtitle">
              Configure deterministic data cleaning, missing imputation, outlier boundaries, and scaling
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleRunPreprocessing}
            disabled={preprocLoading}
          >
            {preprocLoading ? 'Running Pipeline...' : 'Execute Preprocessing'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
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
              <option value="clip_iqr">Clip at 1.5x IQR (Recommended)</option>
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

        {/* Feature Selector */}
        <div style={{ marginBottom: '20px' }}>
          <div className="form-label" style={{ marginBottom: '8px' }}>Active Features for Model Fitting:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {dataset.columns.map((col) => {
              const active = selectedFeatures.includes(col.name);
              return (
                <button
                  key={col.name}
                  type="button"
                  onClick={() => toggleFeature(col.name)}
                  style={{
                    backgroundColor: active ? 'rgba(20, 184, 166, 0.15)' : 'var(--bg-surface-elevated)',
                    border: `1px solid ${active ? 'var(--accent-teal)' : 'var(--border-color)'}`,
                    color: active ? 'var(--accent-teal)' : 'var(--text-muted)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {active && <Check size={12} />}
                  <span>{col.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Preprocessing Results Output */}
        {preprocResult && (
          <div style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px',
            marginTop: '16px'
          }}>
            <div style={{ fontWeight: 600, color: '#F8FAFC', marginBottom: '8px' }}>
              ✓ Transformation Completed
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Row Count Delta:</span>
                <div style={{ fontWeight: 600, color: '#F8FAFC' }}>
                  {preprocResult.original_rows} → {preprocResult.processed_rows}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Feature Columns:</span>
                <div style={{ fontWeight: 600, color: '#F8FAFC' }}>
                  {preprocResult.original_cols} → {preprocResult.processed_cols}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Transformations Applied:</span>
              <ul style={{ margin: '6px 0 0 18px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {preprocResult.transformations_applied.map((t, idx) => (
                  <li key={idx}>{t}</li>
                ))}
              </ul>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '6px' }}>Transformed Matrix Sample:</div>
            <div className="table-container" style={{ maxHeight: '180px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    {preprocResult.columns.slice(0, 8).map(c => <th key={c}>{c}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {preprocResult.sample_preview.slice(0, 5).map((row, idx) => (
                    <tr key={idx}>
                      {preprocResult.columns.slice(0, 8).map(c => (
                        <td key={c}>
                          {typeof row[c] === 'number' ? Number(row[c]).toFixed(3) : String(row[c] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
