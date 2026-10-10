import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  detail?: string;
  badge?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon, detail, badge }) => {
  return (
    <div className="metric-card">
      <div className="metric-card-top">
        <span className="metric-label">{label}</span>
        {icon && <div className="metric-icon-wrap">{icon}</div>}
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
