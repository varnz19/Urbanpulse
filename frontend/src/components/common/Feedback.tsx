import React from 'react';
import { Inbox, AlertCircle } from 'lucide-react';

export const LoadingSkeleton: React.FC<{ message?: string }> = ({ message = 'Computing analytics...' }) => {
  return (
    <div className="loading-box">
      <div className="spinner" />
      <span>{message}</span>
    </div>
  );
};

export const EmptyState: React.FC<{ title: string; message: string; action?: React.ReactNode }> = ({
  title, message, action
}) => {
  return (
    <div className="empty-state">
      <Inbox className="empty-state-icon" />
      <h3 style={{ color: '#F8FAFC', marginBottom: '6px' }}>{title}</h3>
      <p style={{ maxWidth: '450px', margin: '0 auto 16px auto', fontSize: '0.88rem' }}>{message}</p>
      {action}
    </div>
  );
};

export const ErrorAlert: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => {
  return (
    <div style={{
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      borderRadius: 'var(--radius-sm)',
      padding: '14px 18px',
      color: '#FCA5A5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '20px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <AlertCircle size={18} style={{ color: '#EF4444' }} />
        <span style={{ fontSize: '0.88rem' }}>{message}</span>
      </div>
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry} style={{ padding: '4px 12px', fontSize: '0.78rem' }}>
          Retry
        </button>
      )}
    </div>
  );
};
