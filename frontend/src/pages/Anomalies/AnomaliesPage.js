import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { LoadingSkeleton, ErrorAlert } from '../../components/common/Feedback';
import { runAnomalyDetection, saveExperiment } from '../../services/api';
import { AlertTriangle, Sparkles, Bookmark, ShieldAlert } from 'lucide-react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
export const AnomaliesPage = ({ datasetId }) => {
    const [method, setMethod] = useState('isolation_forest');
    const [contamination, setContamination] = useState(0.04);
    const [metricCol, setMetricCol] = useState('avg_speed_kmh');
    const [severityFilter, setSeverityFilter] = useState('ALL');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [savedSuccess, setSavedSuccess] = useState(false);
    const handleRunDetection = async () => {
        if (!datasetId)
            return;
        setLoading(true);
        setError(null);
        setSavedSuccess(false);
        try {
            const res = await runAnomalyDetection(datasetId, {
                method,
                contamination,
                metric_column: metricCol
            });
            setResult(res);
        }
        catch (err) {
            setError(err.message || 'Anomaly detection failed');
        }
        finally {
            setLoading(false);
        }
    };
    const handleSaveExperiment = async () => {
        if (!result || !datasetId)
            return;
        try {
            await saveExperiment({
                dataset_id: datasetId,
                name: `Anomaly Detection (${method})`,
                task_type: 'anomaly',
                parameters: { method, contamination, metric_column: metricCol },
                metrics: { anomalies_count: result.anomalies_count, anomaly_rate_pct: result.anomaly_rate_pct },
                results_summary: `Identified ${result.anomalies_count} anomalies (${result.anomaly_rate_pct}% anomaly rate) in ${metricCol}.`
            });
            setSavedSuccess(true);
        }
        catch (err) {
            alert(`Failed to save: ${err.message}`);
        }
    };
    const filteredAnomalies = result
        ? result.anomalies.filter(a => severityFilter === 'ALL' || a.severity === severityFilter)
        : [];
    return (_jsxs("div", { children: [_jsx(PageHeader, { title: "Traffic Anomaly Monitor", description: "Detect statistical outliers and abrupt velocity drops using Isolation Forest and historical rolling baseline deviation scores." }), _jsxs("div", { style: {
                    backgroundColor: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 16px',
                    color: '#7DD3FC',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '20px'
                }, children: [_jsx(ShieldAlert, { size: 18, style: { color: '#38BDF8', flexShrink: 0 } }), _jsxs("span", { children: [_jsx("strong", { children: "Operational Distinction:" }), " Statistical deviations indicate atypical sensor patterns relative to diurnal baselines. They represent candidates for investigation, not ground-truth verified physical accidents or lane closures."] })] }), _jsxs("div", { className: "card", style: { marginBottom: '24px' }, children: [_jsxs("div", { className: "card-header", children: [_jsxs("div", { children: [_jsxs("div", { className: "card-title", children: [_jsx(AlertTriangle, { size: 18, style: { color: 'var(--accent-teal)' } }), "Anomaly Detection Engine Configuration"] }), _jsx("div", { className: "card-subtitle", children: "Choose detection algorithm, expected contamination rate, and evaluated metric" })] }), _jsxs("button", { className: "btn btn-primary", onClick: handleRunDetection, disabled: loading, children: [_jsx(Sparkles, { size: 14 }), _jsx("span", { children: loading ? 'Executing Detection...' : 'Run Anomaly Detection' })] })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Algorithm" }), _jsxs("select", { className: "form-select", value: method, onChange: (e) => setMethod(e.target.value), children: [_jsx("option", { value: "isolation_forest", children: "Isolation Forest (Tree Ensemble)" }), _jsx("option", { value: "zscore", children: "Historical Baseline Z-Score (|Z| > 2.5)" })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Target Metric" }), _jsxs("select", { className: "form-select", value: metricCol, onChange: (e) => setMetricCol(e.target.value), children: [_jsx("option", { value: "avg_speed_kmh", children: "Average Speed (km/h)" }), _jsx("option", { value: "vehicle_count", children: "Vehicle Count (Volume)" })] })] }), _jsxs("div", { className: "form-group", children: [_jsxs("label", { className: "form-label", children: ["Expected Contamination: ", (contamination * 100).toFixed(0), "%"] }), _jsx("input", { type: "range", min: "0.01", max: "0.10", step: "0.01", value: contamination, onChange: (e) => setContamination(Number(e.target.value)), style: { width: '100%', accentColor: 'var(--accent-teal)', marginTop: '8px' } })] })] })] }), loading && _jsx(LoadingSkeleton, { message: "Computing Isolation Forest trees and historical baseline deviations..." }), error && _jsx(ErrorAlert, { message: error }), result && !loading && (_jsxs(_Fragment, { children: [_jsxs("div", { style: {
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            padding: '16px 20px',
                            marginBottom: '24px',
                            flexWrap: 'wrap',
                            gap: '12px'
                        }, children: [_jsxs("div", { style: { display: 'flex', gap: '24px', flexWrap: 'wrap' }, children: [_jsxs("div", { children: [_jsx("span", { style: { fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }, children: "Records Evaluated" }), _jsx("div", { style: { fontSize: '1.4rem', fontWeight: 700, color: '#F8FAFC' }, children: result.total_records.toLocaleString() })] }), _jsxs("div", { children: [_jsx("span", { style: { fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }, children: "Anomalies Flagged" }), _jsx("div", { style: { fontSize: '1.4rem', fontWeight: 700, color: '#EF4444' }, children: result.anomalies_count })] }), _jsxs("div", { children: [_jsx("span", { style: { fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }, children: "Anomaly Rate" }), _jsxs("div", { style: { fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-teal)' }, children: [result.anomaly_rate_pct, "%"] })] }), _jsxs("div", { children: [_jsx("span", { style: { fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }, children: "Method Applied" }), _jsx("div", { style: { fontSize: '1.1rem', fontWeight: 600, color: '#38BDF8', marginTop: '4px' }, children: result.method_used === 'isolation_forest' ? 'Isolation Forest' : 'Z-Score Deviation' })] })] }), _jsxs("button", { className: "btn btn-secondary", onClick: handleSaveExperiment, disabled: savedSuccess, children: [_jsx(Bookmark, { size: 14 }), _jsx("span", { children: savedSuccess ? '✓ Saved to Experiments' : 'Save Run' })] })] }), _jsxs("div", { className: "card", style: { marginBottom: '24px' }, children: [_jsx("div", { className: "card-header", children: _jsxs("div", { children: [_jsx("div", { className: "card-title", children: "Anomaly Deviation Timeline" }), _jsx("div", { className: "card-subtitle", children: "Deviation score across observed sequence (higher indicates stronger anomaly)" })] }) }), _jsx("div", { style: { height: '240px' }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(ScatterChart, { margin: { top: 10, right: 20, bottom: 20, left: 10 }, children: [_jsx(CartesianGrid, { stroke: "#1E293B" }), _jsx(XAxis, { dataKey: "index", name: "Observation Index", stroke: "#64748B" }), _jsx(YAxis, { dataKey: "anomaly_score", name: "Anomaly Score", stroke: "#64748B", domain: [0, 1] }), _jsx(Tooltip, { contentStyle: { backgroundColor: '#111C2E', borderColor: '#1E293B', borderRadius: '6px', color: '#F8FAFC' }, formatter: (_val, _name, entry) => {
                                                    const p = entry.payload;
                                                    return [
                                                        `${p.segment_name} | Obs: ${p.observed_value} vs Base: ${p.baseline_value} (${p.deviation_pct}%)`,
                                                        p.timestamp
                                                    ];
                                                } }), _jsx(Scatter, { data: result.anomalies, fill: "#EF4444" })] }) }) })] }), _jsxs("div", { className: "card", children: [_jsxs("div", { className: "card-header", children: [_jsxs("div", { children: [_jsx("div", { className: "card-title", children: "Flagged Outlier Records" }), _jsx("div", { className: "card-subtitle", children: "Detailed corroboration evidence and historical baseline comparisons" })] }), _jsx("div", { style: { display: 'flex', gap: '8px' }, children: ['ALL', 'Critical', 'High', 'Moderate'].map((sev) => (_jsx("button", { className: `btn ${severityFilter === sev ? 'btn-primary' : 'btn-secondary'}`, style: { padding: '4px 10px', fontSize: '0.78rem' }, onClick: () => setSeverityFilter(sev), children: sev }, sev))) })] }), _jsx("div", { className: "table-container", children: _jsxs("table", { className: "data-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Timestamp" }), _jsx("th", { children: "Corridor Location" }), _jsx("th", { children: "Observed" }), _jsx("th", { children: "Baseline" }), _jsx("th", { children: "Deviation" }), _jsx("th", { children: "Score" }), _jsx("th", { children: "Severity" }), _jsx("th", { children: "Supporting Evidence" })] }) }), _jsx("tbody", { children: filteredAnomalies.map((anom) => (_jsxs("tr", { children: [_jsx("td", { style: { color: 'var(--text-dim)', fontSize: '0.78rem' }, children: anom.timestamp }), _jsx("td", { children: _jsx("strong", { style: { color: '#F8FAFC' }, children: anom.segment_name }) }), _jsx("td", { children: _jsx("strong", { style: { color: anom.observed_value < anom.baseline_value ? '#EF4444' : '#10B981' }, children: anom.observed_value }) }), _jsx("td", { children: anom.baseline_value }), _jsx("td", { children: _jsxs("span", { style: { color: anom.deviation_pct < 0 ? '#EF4444' : '#F59E0B' }, children: [anom.deviation_pct, "%"] }) }), _jsx("td", { children: anom.anomaly_score.toFixed(2) }), _jsx("td", { children: _jsx("span", { className: `badge badge-${anom.severity.toLowerCase()}`, children: anom.severity }) }), _jsx("td", { style: { maxWidth: '320px', whiteSpace: 'normal', fontSize: '0.78rem', color: 'var(--text-muted)' }, children: anom.supporting_evidence })] }, anom.index))) })] }) })] })] }))] }));
};
