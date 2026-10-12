import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { LoadingSkeleton, ErrorAlert } from '../../components/common/Feedback';
import { fetchDataset, fetchDatasetPreview, uploadDataset, preprocessDataset, deleteDataset } from '../../services/api';
import { Dataset, DatasetPreview, PreprocessResult } from '../../types';

interface DatasetsPageProps {
  datasetId: string;
  datasets?: Dataset[];
  onSelectDataset?: (id: string) => void;
  onDatasetUploaded: (newId?: string) => void;
}

export const DatasetsPage: React.FC<DatasetsPageProps> = ({
  datasetId,
  datasets = [],
  onSelectDataset,
  onDatasetUploaded
}) => {
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
      setUploadSuccess(`Successfully ingested "${res.name}" (${res.row_count} rows, ${res.column_count} columns) and activated as current corpus!`);
      onDatasetUploaded(res.id);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload dataset');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDataset = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this uploaded dataset?")) return;
    try {
      await deleteDataset(id);
      // If we deleted the active dataset, fallback to demo
      if (id === datasetId) {
        const demo = datasets.find(d => d.is_demo);
        if (demo && onSelectDataset) onSelectDataset(demo.id);
      }
      onDatasetUploaded();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
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
        description="Choose between the built-in Hyderabad Benchmark or your own uploaded datasets to view platform results."
      />

      {/* Side-by-Side Choice: Sample Benchmark vs Uploaded Custom Data */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        
        {/* Option 1: Sample Benchmark Dataset */}
        <div className="card" style={{
          border: dataset.is_demo ? '2px solid var(--accent-teal)' : '1px solid var(--border-color)',
          boxShadow: dataset.is_demo ? '0 0 16px rgba(13, 148, 136, 0.15)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🏢</span> Option 1: Sample Benchmark Dataset
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Hyderabad Arterial Corridors (Empirical Benchmark)
                </div>
              </div>
              {dataset.is_demo && (
                <span className="badge badge-accent" style={{ backgroundColor: '#0D9488', color: '#FFF' }}>
                  ✓ ACTIVE NOW
                </span>
              )}
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', lineHeight: 1.5, margin: '10px 0 16px 0' }}>
              Pre-loaded authentic benchmark containing <strong>2,016 hourly records</strong> across <strong>12 verified road corridors</strong> (HITEC City, Gachibowli ORR, Banjara Hills, Jubilee Hills, etc.) with real speeds, vehicle volumes, weather conditions, and congestion states.
            </p>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {datasets.filter(d => d.is_demo).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onSelectDataset?.(d.id)}
                  className={`btn ${datasetId === d.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                >
                  {datasetId === d.id ? '✓ Using ' : 'Switch to '} {d.file_format.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Includes full GPS coordinates for maps, diurnal recurrence, and classification ground truth.
          </div>
        </div>

        {/* Option 2: Uploaded Custom Dataset */}
        <div className="card" style={{
          border: !dataset.is_demo ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
          boxShadow: !dataset.is_demo ? '0 0 16px rgba(2, 132, 199, 0.15)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📁</span> Option 2: Upload Your Own Dataset
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Ingest CSV or ARFF files (Kaggle, NYC DOT, traffic sensors)
                </div>
              </div>
              {!dataset.is_demo && (
                <span className="badge badge-accent" style={{ backgroundColor: '#0284C7', color: '#FFF' }}>
                  ✓ ACTIVE NOW
                </span>
              )}
            </div>

            <div style={{ margin: '14px 0' }}>
              <label className="btn btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span>⬆ {uploading ? 'Parsing File...' : 'Upload File (.csv or .arff)'}</span>
                <input
                  type="file"
                  accept=".csv,.arff"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  style={{ display: 'none' }}
                />
              </label>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginLeft: '12px' }}>
                Max 50MB. Auto-parses timestamps, speeds, volume, or labels.
              </span>
            </div>

            {uploadError && <div style={{ marginTop: '10px' }}><ErrorAlert message={uploadError} /></div>}
            {uploadSuccess && (
              <div style={{
                marginTop: '10px',
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

            {/* List of previously uploaded custom datasets */}
            {datasets.filter(d => !d.is_demo).length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Your Uploaded Datasets ({datasets.filter(d => !d.is_demo).length}):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                  {datasets.filter(d => !d.is_demo).map((d) => {
                    const isActive = d.id === datasetId;
                    return (
                      <div
                        key={d.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: isActive ? 'var(--bg-surface-elevated)' : 'var(--bg-primary)',
                          border: `1px solid ${isActive ? 'var(--accent-cyan)' : 'var(--border-color)'}`
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                            {d.name} {isActive && <span style={{ color: 'var(--accent-cyan)', fontSize: '0.72rem' }}>✓ Active</span>}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                            {d.row_count.toLocaleString()} rows • {d.column_count} cols
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => onSelectDataset?.(d.id)}
                              className="btn btn-secondary"
                              style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                            >
                              Activate
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteDataset(d.id, e)}
                            className="btn btn-secondary"
                            style={{ padding: '3px 8px', fontSize: '0.74rem', color: '#EF4444' }}
                            title="Delete this uploaded dataset"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Switching datasets dynamically refreshes results across all analytics and ML pages.
          </div>
        </div>
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
