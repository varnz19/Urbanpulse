import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { LoadingSkeleton, ErrorAlert } from '../../components/common/Feedback';
import { runClassification, saveExperiment } from '../../services/api';
import { BrainCircuit, Check, Bookmark, Sparkles } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
export const ClassificationPage = ({ datasetId }) => {
    const [modelType, setModelType] = useState('decision_tree');
    const [targetCol] = useState('congestion_level');
    const [featureCols, setFeatureCols] = useState(['avg_speed_kmh', 'vehicle_count', 'hour', 'weather', 'road_type']);
    const [maxDepth, setMaxDepth] = useState(4);
    const [testSize, setTestSize] = useState(0.2);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [savedSuccess, setSavedSuccess] = useState(false);
    const availableFeatures = [
        { id: 'avg_speed_kmh', label: 'Average Speed' },
        { id: 'vehicle_count', label: 'Vehicle Volume' },
        { id: 'hour', label: 'Hour of Day' },
        { id: 'weather', label: 'Weather Condition' },
        { id: 'road_type', label: 'Road Segment Type' },
        { id: 'is_weekend', label: 'Weekend Indicator' },
    ];
    const handleRunModel = async () => {
        if (!datasetId)
            return;
        setLoading(true);
        setError(null);
        setSavedSuccess(false);
        try {
            const res = await runClassification(datasetId, {
                model_type: modelType,
                target_column: targetCol,
                feature_columns: featureCols,
                test_size: testSize,
                max_depth: maxDepth,
                random_state: 42
            });
            setResult(res);
        }
        catch (err) {
            setError(err.message || 'Model training and evaluation failed');
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
                name: `${result.model_name}`,
                task_type: 'classification',
                parameters: { model_type: modelType, features: featureCols, test_size: testSize, max_depth: maxDepth },
                metrics: { accuracy: result.accuracy, macro_f1: result.macro_f1, cv_mean_accuracy: result.cv_mean_accuracy },
                results_summary: `Accuracy: ${(result.accuracy * 100).toFixed(1)}%, Macro F1: ${result.macro_f1}. Evaluated on ${result.total_test_samples} test records.`
            });
            setSavedSuccess(true);
        }
        catch (err) {
            alert(`Failed to save: ${err.message}`);
        }
    };
    const toggleFeature = (id) => {
        setFeatureCols(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
    };
    // Prepare feature importance data
    const fiData = result?.feature_importance
        ? Object.entries(result.feature_importance).map(([feature, importance]) => ({
            feature,
            importance: Number(importance)
        }))
        : [];
    return (_jsxs("div", { children: [_jsx(PageHeader, { title: "Congestion Classification & Explainability", description: "Train, evaluate, and interpret supervised classification models to classify road congestion levels with leak-free validation and decision rules." }), _jsxs("div", { className: "card", style: { marginBottom: '24px' }, children: [_jsxs("div", { className: "card-header", children: [_jsxs("div", { children: [_jsxs("div", { className: "card-title", children: [_jsx(BrainCircuit, { size: 18, style: { color: 'var(--accent-teal)' } }), "Classification Model Architecture"] }), _jsx("div", { className: "card-subtitle", children: "Choose learning algorithm, depth limits, and predictor attributes" })] }), _jsxs("button", { className: "btn btn-primary", onClick: handleRunModel, disabled: loading || featureCols.length === 0, children: [_jsx(Sparkles, { size: 14 }), _jsx("span", { children: loading ? 'Training & Evaluating...' : 'Train Model' })] })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Algorithm" }), _jsxs("select", { className: "form-select", value: modelType, onChange: (e) => setModelType(e.target.value), children: [_jsx("option", { value: "decision_tree", children: "Decision Tree Classifier" }), _jsx("option", { value: "naive_bayes", children: "Gaussian Naive Bayes" }), _jsx("option", { value: "oner", children: "OneR Baseline (Single-Attribute Stump)" }), _jsx("option", { value: "rules", children: "Rule-Based Decision List" })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Target Attribute" }), _jsx("input", { type: "text", className: "form-input", value: targetCol, disabled: true, style: { opacity: 0.8 } })] }), _jsxs("div", { className: "form-group", children: [_jsxs("label", { className: "form-label", children: ["Test Split: ", Math.round(testSize * 100), "%"] }), _jsx("input", { type: "range", min: "0.1", max: "0.4", step: "0.05", value: testSize, onChange: (e) => setTestSize(Number(e.target.value)), style: { width: '100%', accentColor: 'var(--accent-teal)', marginTop: '8px' } })] }), modelType === 'decision_tree' && (_jsxs("div", { className: "form-group", children: [_jsxs("label", { className: "form-label", children: ["Max Tree Depth: ", maxDepth] }), _jsx("input", { type: "range", min: "2", max: "8", value: maxDepth, onChange: (e) => setMaxDepth(Number(e.target.value)), style: { width: '100%', accentColor: 'var(--accent-teal)', marginTop: '8px' } })] }))] }), _jsxs("div", { children: [_jsx("label", { className: "form-label", style: { marginBottom: '8px' }, children: "Input Features:" }), _jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: '8px' }, children: availableFeatures.map((f) => {
                                    const active = featureCols.includes(f.id);
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
                                }) })] })] }), loading && _jsx(LoadingSkeleton, { message: "Fitting model, computing cross-validation, and compiling confusion matrix..." }), error && _jsx(ErrorAlert, { message: error }), result && !loading && (_jsxs(_Fragment, { children: [_jsxs("div", { style: {
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
                        }, children: [_jsxs("div", { style: { display: 'flex', gap: '24px', flexWrap: 'wrap' }, children: [_jsxs("div", { children: [_jsx("span", { style: { fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }, children: "Overall Accuracy" }), _jsxs("div", { style: { fontSize: '1.4rem', fontWeight: 700, color: '#10B981' }, children: [(result.accuracy * 100).toFixed(1), "%"] })] }), _jsxs("div", { children: [_jsx("span", { style: { fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }, children: "Macro F1-Score" }), _jsx("div", { style: { fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-teal)' }, children: result.macro_f1.toFixed(3) })] }), _jsxs("div", { children: [_jsx("span", { style: { fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }, children: "5-Fold CV Accuracy" }), _jsx("div", { style: { fontSize: '1.4rem', fontWeight: 700, color: '#38BDF8' }, children: result.cv_mean_accuracy ? `${(result.cv_mean_accuracy * 100).toFixed(1)}%` : 'N/A' })] }), _jsxs("div", { children: [_jsx("span", { style: { fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }, children: "Evaluation Split" }), _jsxs("div", { style: { fontSize: '1.4rem', fontWeight: 700, color: '#F8FAFC' }, children: [result.total_train_samples, " / ", result.total_test_samples] })] })] }), _jsxs("button", { className: "btn btn-secondary", onClick: handleSaveExperiment, disabled: savedSuccess, children: [_jsx(Bookmark, { size: 14 }), _jsx("span", { children: savedSuccess ? '✓ Saved to Experiments' : 'Save Experiment' })] })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }, children: [_jsxs("div", { className: "card", children: [_jsx("div", { className: "card-header", children: _jsxs("div", { children: [_jsx("div", { className: "card-title", children: "Confusion Matrix (Test Evaluation)" }), _jsx("div", { className: "card-subtitle", children: "Predicted vs Actual target labels" })] }) }), _jsx("div", { className: "table-container", children: _jsxs("table", { className: "data-table", style: { textAlign: 'center' }, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: { textAlign: 'left' }, children: "Actual \\ Pred" }), result.classes.map(c => _jsx("th", { children: c }, c))] }) }), _jsx("tbody", { children: result.classes.map((actClass, i) => (_jsxs("tr", { children: [_jsx("td", { style: { textAlign: 'left', fontWeight: 600 }, children: actClass }), result.classes.map((_, j) => {
                                                                const val = result.confusion_matrix[i][j];
                                                                const isDiagonal = i === j;
                                                                return (_jsx("td", { style: {
                                                                        backgroundColor: isDiagonal && val > 0 ? 'rgba(20, 184, 166, 0.2)' : 'transparent',
                                                                        color: isDiagonal ? '#14B8A6' : (val > 0 ? '#EF4444' : 'var(--text-dim)'),
                                                                        fontWeight: isDiagonal ? 700 : 400
                                                                    }, children: val }, j));
                                                            })] }, actClass))) })] }) })] }), _jsxs("div", { className: "card", children: [_jsx("div", { className: "card-header", children: _jsxs("div", { children: [_jsx("div", { className: "card-title", children: "Per-Class Precision, Recall & F1" }), _jsx("div", { className: "card-subtitle", children: "Class-specific discrimination metrics" })] }) }), _jsx("div", { className: "table-container", children: _jsxs("table", { className: "data-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Class" }), _jsx("th", { children: "Precision" }), _jsx("th", { children: "Recall" }), _jsx("th", { children: "F1-Score" }), _jsx("th", { children: "Support" })] }) }), _jsx("tbody", { children: Object.entries(result.per_class).map(([cName, metrics]) => (_jsxs("tr", { children: [_jsx("td", { children: _jsx("span", { className: `badge badge-${cName.toLowerCase()}`, children: cName }) }), _jsxs("td", { children: [(metrics.precision * 100).toFixed(1), "%"] }), _jsxs("td", { children: [(metrics.recall * 100).toFixed(1), "%"] }), _jsx("td", { children: _jsx("strong", { style: { color: '#F8FAFC' }, children: metrics.f1_score.toFixed(3) }) }), _jsx("td", { children: metrics.support })] }, cName))) })] }) })] })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: fiData.length > 0 ? '1fr 1fr' : '1fr', gap: '20px' }, children: [fiData.length > 0 && (_jsxs("div", { className: "card", children: [_jsx("div", { className: "card-header", children: _jsxs("div", { children: [_jsx("div", { className: "card-title", children: "Gini Feature Importance" }), _jsx("div", { className: "card-subtitle", children: "Relative contribution of attributes to class splits" })] }) }), _jsx("div", { style: { height: '260px' }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: fiData, layout: "vertical", margin: { left: 30, right: 20 }, children: [_jsx(CartesianGrid, { stroke: "#1E293B", horizontal: false }), _jsx(XAxis, { type: "number", stroke: "#64748B" }), _jsx(YAxis, { dataKey: "feature", type: "category", stroke: "#64748B", width: 110 }), _jsx(Tooltip, { contentStyle: { backgroundColor: '#111C2E', borderColor: '#1E293B', borderRadius: '6px', color: '#F8FAFC' }, formatter: (val) => [val, 'Importance'] }), _jsx(Bar, { dataKey: "importance", fill: "#14B8A6", radius: [0, 4, 4, 0] })] }) }) })] })), result.decision_rules && result.decision_rules.length > 0 && (_jsxs("div", { className: "card", children: [_jsx("div", { className: "card-header", children: _jsxs("div", { children: [_jsx("div", { className: "card-title", children: "Explainable Decision Rules (Tree Paths)" }), _jsx("div", { className: "card-subtitle", children: "Human-interpretable decision logic" })] }) }), _jsx("pre", { style: {
                                            backgroundColor: '#0B1220',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: 'var(--radius-sm)',
                                            padding: '14px',
                                            color: '#38BDF8',
                                            fontSize: '0.78rem',
                                            lineHeight: '1.6',
                                            maxHeight: '260px',
                                            overflowY: 'auto',
                                            fontFamily: 'monospace'
                                        }, children: result.decision_rules.join('\n') })] }))] })] }))] }));
};
