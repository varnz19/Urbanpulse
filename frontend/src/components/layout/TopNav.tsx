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

      <div className="dataset-picker">
        <span className="dataset-picker-label">Active Corpus:</span>
        <select
          className="dataset-select"
          value={selectedDatasetId}
          onChange={(e) => onSelectDataset(e.target.value)}
        >
          {datasets.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.file_format.toUpperCase()})
            </option>
          ))}
        </select>
        {currentDataset && (
          <span className="badge badge-accent">
            {currentDataset.row_count.toLocaleString()} rows • {currentDataset.column_count} cols
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
        <NavLink to="/terms" className="top-nav-link">Terms</NavLink>
        <NavLink to="/privacy" className="top-nav-link">Privacy</NavLink>
      </div>
    </header>
  );
};
