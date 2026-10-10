import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  detail?: string;
  badge?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, detail, badge }) => {
  return (
    <div className="metric-card">
      <div className="metric-card-top">
        <span className="metric-label">{label}</span>
      </div>
      <div className="metric-value">{value}</div>
      {(detail || badge) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
          {detail && <span className="metric-detail">{detail}</span>}
          {badge}
        </div>
      )}
    </div>
  );
};
