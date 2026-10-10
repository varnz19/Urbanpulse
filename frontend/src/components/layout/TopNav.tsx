import React from 'react';
import { Dataset } from '../../types';
import { Database, RefreshCw } from 'lucide-react';

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
      <div className="dataset-picker">
        <Database size={16} style={{ color: 'var(--accent-teal)' }} />
        <span className="dataset-picker-label">Active Dataset:</span>
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
          <span className="badge badge-neutral">
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
          <RefreshCw size={14} className={isLoading ? 'spinner' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>
    </header>
  );
};
