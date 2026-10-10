import React from 'react';

export const LoadingSkeleton: React.FC<{ message?: string }> = ({ message = 'Computing analytics...' }) => {
  return (
    <div className="loading-box">
      <span>[STATUS: {message}]</span>
    </div>
  );
};

export const EmptyState: React.FC<{ title: string; message: string; action?: React.ReactNode }> = ({
  title, message, action
}) => {
  return (
    <div className="empty-state">
      <h3 style={{ color: 'var(--text-main)', marginBottom: '6px', fontSize: '1rem' }}>{title}</h3>
      <p style={{ maxWidth: '480px', margin: '0 auto 16px auto', fontSize: '0.85rem' }}>{message}</p>
      {action}
    </div>
  );
};

export const ErrorAlert: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => {
  return (
    <div style={{
      backgroundColor: 'rgba(220, 38, 38, 0.1)',
      border: '1px solid #DC2626',
      borderRadius: 'var(--radius-sm)',
      padding: '12px 16px',
      color: '#F87171',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '16px',
      fontSize: '0.82rem'
    }}>
      <div>
        <strong>Error:</strong> {message}
      </div>
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry} style={{ padding: '3px 10px', fontSize: '0.75rem' }}>
          Retry
        </button>
      )}
    </div>
  );
};
