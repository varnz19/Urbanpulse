import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { LoadingSkeleton, EmptyState, ErrorAlert } from '../../components/common/Feedback';
import { fetchExperiments } from '../../services/api';
import { Filter, Clock } from 'lucide-react';
export const ExperimentsPage = ({ datasetId }) => {
    const [experiments, setExperiments] = useState([]);
    const [taskFilter, setTaskFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        setError(null);
        fetchExperiments(datasetId)
            .then((data) => {
            if (isMounted) {
                setExperiments(data);
                setLoading(false);
            }
        })
            .catch((err) => {
            if (isMounted) {
                setError(err.message || 'Failed to fetch experiments');
                setLoading(false);
            }
        });
        return () => { isMounted = false; };
    }, [datasetId]);
    if (loading)
        return _jsx(LoadingSkeleton, { message: "Retrieving experiment lineage and run logs..." });
    if (error)
        return _jsx(ErrorAlert, { message: error });
    const filtered = experiments.filter(e => taskFilter === 'ALL' || e.task_type === taskFilter);
    return (_jsxs("div", { children: [_jsx(PageHeader, { title: "Experiment Center & Reproducibility Hub", description: "Unified registry of executed modeling runs, hyperparameter configurations, evaluation metrics, and reproducible tracking records." }), _jsxs("div", { className: "card", style: { marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '10px' }, children: [_jsx(Filter, { size: 16, style: { color: 'var(--accent-teal)' } }), _jsx("span", { style: { fontSize: '0.85rem', color: 'var(--text-muted)' }, children: "Filter by Model Task:" })] }), _jsx("div", { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' }, children: ['ALL', 'classification', 'clustering', 'association', 'anomaly'].map(task => (_jsx("button", { className: `btn ${taskFilter === task ? 'btn-primary' : 'btn-secondary'}`, style: { padding: '6px 12px', fontSize: '0.8rem', textTransform: 'capitalize' }, onClick: () => setTaskFilter(task), children: task === 'ALL' ? 'All Tasks' : task }, task))) })] }), filtered.length === 0 ? (_jsx(EmptyState, { title: "No Experiments Recorded Yet", message: "Run a model in Classification, Segment Intelligence, Association Rules, or Anomaly Monitor and click 'Save to Experiments' to log your runs here." })) : (_jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '16px' }, children: filtered.map((exp) => (_jsxs("div", { className: "card", children: [_jsx("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }, children: _jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '10px' }, children: [_jsx("h3", { style: { color: '#F8FAFC', fontSize: '1.05rem', margin: 0 }, children: exp.name }), _jsx("span", { className: "badge badge-mod", style: { textTransform: 'uppercase' }, children: exp.task_type })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }, children: [_jsx(Clock, { size: 12 }), _jsxs("span", { children: ["Logged at ", new Date(exp.created_at).toLocaleString(), " \u2022 ID: ", exp.id] })] })] }) }), _jsx("p", { style: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '14px' }, children: exp.results_summary }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', background: 'var(--bg-surface-elevated)', padding: '12px', borderRadius: 'var(--radius-sm)' }, children: [_jsxs("div", { children: [_jsx("span", { style: { fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }, children: "Parameters" }), _jsx("pre", { style: { color: '#38BDF8', fontSize: '0.75rem', marginTop: '4px', overflowX: 'auto', fontFamily: 'monospace' }, children: JSON.stringify(exp.parameters, null, 2) })] }), _jsxs("div", { children: [_jsx("span", { style: { fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }, children: "Recorded Evaluation Metrics" }), _jsx("pre", { style: { color: '#10B981', fontSize: '0.75rem', marginTop: '4px', overflowX: 'auto', fontFamily: 'monospace' }, children: JSON.stringify(exp.metrics, null, 2) })] })] })] }, exp.id))) }))] }));
};
