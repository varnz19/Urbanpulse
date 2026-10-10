import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { LoadingSkeleton, ErrorAlert } from '../../components/common/Feedback';
import { runClustering, saveExperiment } from '../../services/api';
import { Network, Check, Sparkles, Bookmark } from 'lucide-react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
export const SegmentIntelligencePage = ({ datasetId }) => {
    const [k, setK] = useState(3);
    const [features, setFeatures] = useState(['avg_speed_kmh', 'vehicle_count']);
    const [scaleFeatures, setScaleFeatures] = useState(true);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [savedSuccess, setSavedSuccess] = useState(false);
    const availableFeatures = [
        { id: 'avg_speed_kmh', label: 'Average Speed (km/h)' },
        { id: 'vehicle_count', label: 'Vehicle Count (Volume)' },
        { id: 'hour', label: 'Hour of Day' },
        { id: 'is_weekend', label: 'Weekend Indicator' },
    ];
    const handleRunClustering = async () => {
        if (!datasetId)
            return;
        setLoading(true);
        setError(null);
        setSavedSuccess(false);
        try {
            const res = await runClustering(datasetId, {
                features,
                k,
                scale_features: scaleFeatures
            });
            setResult(res);
        }
        catch (err) {
            setError(err.message || 'Clustering execution failed');
        }
        finally {
            setLoading(false);
        }
    };
    const handleSaveToExperiments = async () => {
        if (!result || !datasetId)
            return;
        try {
            await saveExperiment({
                dataset_id: datasetId,
                name: `K-Means (K=${k}) Clustering`,
                task_type: 'clustering',
                parameters: { k, features, scale_features: scaleFeatures },
                metrics: { silhouette_score: result.silhouette_score, inertia: result.inertia },
                results_summary: `Partitioned into ${k} clusters with silhouette score ${result.silhouette_score}.`
            });
            setSavedSuccess(true);
        }
        catch (err) {
            alert(`Failed to save experiment: ${err.message}`);
        }
    };
    const toggleFeature = (id) => {
        setFeatures(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
    };
    const clusterColors = ['#14B8A6', '#6366F1', '#F59E0B', '#EC4899', '#10B981', '#38BDF8', '#8B5CF6'];
    return (_jsxs("div", { children: [_jsx(PageHeader, { title: "Road Segment Intelligence", description: "Unsupervised K-Means clustering and PCA projection to group road segments exhibiting similar speed, volume, and diurnal patterns." }), _jsxs("div", { className: "card", style: { marginBottom: '24px' }, children: [_jsxs("div", { className: "card-header", children: [_jsxs("div", { children: [_jsxs("div", { className: "card-title", children: [_jsx(Network, { size: 18, style: { color: 'var(--accent-teal)' } }), "Cluster Model Parameters"] }), _jsx("div", { className: "card-subtitle", children: "Select clustering features, cluster count K, and feature scaling" })] }), _jsxs("button", { className: "btn btn-primary", onClick: handleRunClustering, disabled: loading || features.length === 0, children: [_jsx(Sparkles, { size: 14 }), _jsx("span", { children: loading ? 'Fitting K-Means...' : 'Execute Clustering' })] })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '16px' }, children: [_jsxs("div", { children: [_jsxs("label", { className: "form-label", children: ["Cluster Count (K): ", k] }), _jsx("input", { type: "range", min: "2", max: "7", value: k, onChange: (e) => setK(Number(e.target.value)), style: { width: '100%', accentColor: 'var(--accent-teal)', marginTop: '8px' } }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)' }, children: [_jsx("span", { children: "2" }), _jsx("span", { children: "3" }), _jsx("span", { children: "4" }), _jsx("span", { children: "5" }), _jsx("span", { children: "6" }), _jsx("span", { children: "7" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "form-label", style: { marginBottom: '8px' }, children: "Feature Standard Scaler" }), _jsx("div", { style: { display: 'flex', alignItems: 'center', gap: '10px' }, children: _jsx("button", { type: "button", className: `btn ${scaleFeatures ? 'btn-primary' : 'btn-secondary'}`, onClick: () => setScaleFeatures(!scaleFeatures), children: scaleFeatures ? '✓ Enabled (StandardScaler)' : 'Disabled (Raw Values)' }) })] })] }), _jsxs("div", { children: [_jsx("label", { className: "form-label", style: { marginBottom: '8px' }, children: "Active Clustering Features:" }), _jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: '8px' }, children: availableFeatures.map((f) => {
                                    const active = features.includes(f.id);
                                    return (_jsxs("button", { type: "button", onClick: () => toggleFeature(f.id), style: {
                                            backgroundColor: active ? 'rgba(20, 184, 166, 0.15)' : 'var(--bg-surface-elevated)',
                                            border: `1px solid ${active ? 'var(--accent-teal)' : 'var(--border-color)'}`,
                                            color: active ? 'var(--accent-teal)' : 'var(--text-muted)',
                                            borderRadius: 'var(--radius-sm)',
                                            padding: '6px 12px',
                                            fontSize: '0.82rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }, children: [active && _jsx(Check, { size: 12 }), _jsx("span", { children: f.label })] }, f.id));
                                }) })] })] }), loading && _jsx(LoadingSkeleton, { message: "Fitting K-Means centroids and computing PCA 2D projections..." }), error && _jsx(ErrorAlert, { message: error }), result && !loading && (_jsxs(_Fragment, { children: [_jsxs("div", { style: {
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
                        }, children: [_jsxs("div", { style: { display: 'flex', gap: '24px' }, children: [_jsxs("div", { children: [_jsx("span", { style: { fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }, children: "Silhouette Score" }), _jsx("div", { style: { fontSize: '1.3rem', fontWeight: 700, color: result.silhouette_score > 0.35 ? '#10B981' : '#F59E0B' }, children: result.silhouette_score })] }), _jsxs("div", { children: [_jsx("span", { style: { fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }, children: "Inertia (WCSS)" }), _jsx("div", { style: { fontSize: '1.3rem', fontWeight: 700, color: '#F8FAFC' }, children: result.inertia.toLocaleString() })] }), _jsxs("div", { children: [_jsx("span", { style: { fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }, children: "Clusters Partitioned" }), _jsxs("div", { style: { fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-teal)' }, children: ["K = ", result.k] })] })] }), _jsxs("button", { className: "btn btn-secondary", onClick: handleSaveToExperiments, disabled: savedSuccess, children: [_jsx(Bookmark, { size: 14 }), _jsx("span", { children: savedSuccess ? '✓ Saved to Experiments' : 'Save Run to Experiments' })] })] }), _jsxs("div", { className: "card", style: { marginBottom: '24px' }, children: [_jsxs("div", { className: "card-header", children: [_jsxs("div", { children: [_jsx("div", { className: "card-title", children: "2D Principal Component Projection (PCA)" }), _jsx("div", { className: "card-subtitle", children: "Observation sample projected onto top 2 principal components, colored by cluster assignment" })] }), _jsxs("div", { style: { display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }, children: [_jsxs("span", { children: ["PC1 Var: ", (result.feature_importance_pca.PC1_variance_ratio * 100).toFixed(1), "%"] }), _jsxs("span", { children: ["PC2 Var: ", (result.feature_importance_pca.PC2_variance_ratio * 100).toFixed(1), "%"] })] })] }), _jsx("div", { style: { height: '360px', width: '100%' }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(ScatterChart, { margin: { top: 20, right: 20, bottom: 20, left: 20 }, children: [_jsx(CartesianGrid, { stroke: "#1E293B" }), _jsx(XAxis, { type: "number", dataKey: "x", name: "PC1", stroke: "#64748B" }), _jsx(YAxis, { type: "number", dataKey: "y", name: "PC2", stroke: "#64748B" }), _jsx(Tooltip, { contentStyle: { backgroundColor: '#111C2E', borderColor: '#1E293B', borderRadius: '6px', color: '#F8FAFC' }, formatter: (_val, _name, entry) => {
                                                    const p = entry.payload;
                                                    return [
                                                        `Cluster ${p.cluster + 1} | Speed: ${p.avg_speed} km/h | Volume: ${p.avg_volume}`,
                                                        p.segment_name
                                                    ];
                                                } }), _jsx(Scatter, { name: "Corridors", data: result.pca_projections, children: result.pca_projections.map((entry, index) => (_jsx(Cell, { fill: clusterColors[entry.cluster % clusterColors.length] }, `cell-${index}`))) })] }) }) })] }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }, children: result.cluster_profiles.map((prof) => (_jsxs("div", { className: "card", style: { borderLeft: `4px solid ${clusterColors[prof.cluster_id % clusterColors.length]}` }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }, children: [_jsx("strong", { style: { fontSize: '1rem', color: '#F8FAFC' }, children: prof.cluster_label }), _jsxs("span", { className: "badge badge-neutral", children: [prof.member_count, " observations (", prof.member_percentage, "%)"] })] }), _jsx("p", { style: { fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.4 }, children: prof.description }), _jsxs("div", { style: { borderTop: '1px solid var(--border-color)', paddingTop: '10px' }, children: [_jsx("div", { style: { fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '6px', textTransform: 'uppercase' }, children: "Feature Means:" }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' }, children: Object.entries(prof.feature_means).map(([feat, val]) => (_jsxs("div", { children: [_jsxs("span", { style: { color: 'var(--text-dim)' }, children: [feat, ":"] }), _jsx("div", { style: { color: '#F8FAFC', fontWeight: 600 }, children: val })] }, feat))) })] })] }, prof.cluster_id))) })] }))] }));
};
