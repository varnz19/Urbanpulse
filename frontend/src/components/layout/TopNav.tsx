import React from 'react';
import { NavLink } from 'react-router-dom';
import { Dataset } from '../../types';

interface TopNavProps {
  datasets: Dataset[];
  selectedDatasetId: string;
  onSelectDataset: (id: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  datasets,
  selectedDatasetId,
  onSelectDataset,
  onRefresh,
  isLoading,
}) => {
  const currentDataset = datasets.find(d => d.id === selectedDatasetId);
  const isCustom = currentDataset ? !currentDataset.is_demo : false;
  const demoDatasets = datasets.filter(d => d.is_demo);
  const customDatasets = datasets.filter(d => !d.is_demo);

  const handleModeSwitch = (mode: 'sample' | 'custom') => {
    if (mode === 'sample') {
      const demo = demoDatasets.find(d => d.id === 'demo-hyderabad-corridors-csv') || demoDatasets[0];
      if (demo) onSelectDataset(demo.id);
    } else {
      if (customDatasets.length > 0) {
        onSelectDataset(customDatasets[0].id);
      }
    }
  };

  return (
    <header className="top-nav">
      <div className="top-nav-brand">
        <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div className="brand-logo-badge">UP</div>
          <div>
            <div className="brand-title">UrbanPulse</div>
            <div className="brand-subtitle">Mobility Intelligence</div>
          </div>
        </NavLink>
      </div>

      <div className="dataset-picker" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {/* Dual Mode Switcher: Sample vs Uploaded */}
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--bg-primary)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
          padding: '2px',
          gap: '2px'
        }}>
          <button
            type="button"
            onClick={() => handleModeSwitch('sample')}
            style={{
              padding: '5px 12px',
              fontSize: '0.78rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: !isCustom ? 'var(--accent-teal)' : 'transparent',
              color: !isCustom ? '#FFFFFF' : 'var(--text-muted)',
              transition: 'all 0.15s ease'
            }}
          >
            🏢 Sample Benchmark
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch('custom')}
            style={{
              padding: '5px 12px',
              fontSize: '0.78rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: isCustom ? 'var(--accent-cyan)' : 'transparent',
              color: isCustom ? '#FFFFFF' : 'var(--text-muted)',
              transition: 'all 0.15s ease'
            }}
          >
            📁 Uploaded Data ({customDatasets.length})
          </button>
        </div>

        {/* Specific Dataset Selector for Active Mode */}
        {!isCustom ? (
          <select
            className="dataset-select"
            value={selectedDatasetId}
            onChange={(e) => onSelectDataset(e.target.value)}
            style={{ padding: '5px 10px', fontSize: '0.78rem' }}
          >
            {demoDatasets.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.file_format.toUpperCase()})
              </option>
            ))}
          </select>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {customDatasets.length > 0 ? (
              <select
                className="dataset-select"
                value={selectedDatasetId}
                onChange={(e) => onSelectDataset(e.target.value)}
                style={{ padding: '5px 10px', fontSize: '0.78rem' }}
              >
                {customDatasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.row_count.toLocaleString()} rows)
                  </option>
                ))}
              </select>
            ) : null}
            <NavLink
              to="/datasets"
              className="btn btn-secondary"
              style={{ padding: '4px 8px', fontSize: '0.75rem', textDecoration: 'none' }}
            >
              + Upload New
            </NavLink>
          </div>
        )}

        {currentDataset && (
          <span className="badge" style={{
            backgroundColor: isCustom ? 'rgba(2, 132, 199, 0.15)' : 'rgba(13, 148, 136, 0.15)',
            color: isCustom ? 'var(--accent-cyan)' : 'var(--accent-teal)',
            border: `1px solid ${isCustom ? 'rgba(2, 132, 199, 0.4)' : 'rgba(13, 148, 136, 0.4)'}`,
            fontSize: '0.72rem'
          }}>
            {isCustom ? 'Uploaded' : 'Benchmark'}: {currentDataset.row_count.toLocaleString()} rows
          </span>
        )}
      </div>

      <div className="top-actions">
        <button
          className="btn btn-secondary"
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh analytics data"
        >
          <span>{isLoading ? 'Reloading...' : 'Reload Data'}</span>
        </button>
      </div>
    </header>
  );
};
