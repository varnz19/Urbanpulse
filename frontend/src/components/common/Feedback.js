import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Inbox, AlertCircle } from 'lucide-react';
export const LoadingSkeleton = ({ message = 'Computing analytics...' }) => {
    return (_jsxs("div", { className: "loading-box", children: [_jsx("div", { className: "spinner" }), _jsx("span", { children: message })] }));
};
export const EmptyState = ({ title, message, action }) => {
    return (_jsxs("div", { className: "empty-state", children: [_jsx(Inbox, { className: "empty-state-icon" }), _jsx("h3", { style: { color: '#F8FAFC', marginBottom: '6px' }, children: title }), _jsx("p", { style: { maxWidth: '450px', margin: '0 auto 16px auto', fontSize: '0.88rem' }, children: message }), action] }));
};
export const ErrorAlert = ({ message, onRetry }) => {
    return (_jsxs("div", { style: {
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px 18px',
            color: '#FCA5A5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px'
        }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '10px' }, children: [_jsx(AlertCircle, { size: 18, style: { color: '#EF4444' } }), _jsx("span", { style: { fontSize: '0.88rem' }, children: message })] }), onRetry && (_jsx("button", { className: "btn btn-secondary", onClick: onRetry, style: { padding: '4px 12px', fontSize: '0.78rem' }, children: "Retry" }))] }));
};
