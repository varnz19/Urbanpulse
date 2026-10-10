import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { LoadingSkeleton, ErrorAlert } from '../../components/common/Feedback';
import { fetchDataset, fetchDatasetPreview, uploadDataset, preprocessDataset } from '../../services/api';
import { Upload, Sliders, ChevronLeft, ChevronRight, Check } from 'lucide-react';
export const DatasetsPage = ({ datasetId, onDatasetUploaded }) => {
    const [dataset, setDataset] = useState(null);
    const [preview, setPreview] = useState(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Upload state
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [uploadSuccess, setUploadSuccess] = useState(null);
    // Preprocessing state
    const [imputeStrategy, setImputeStrategy] = useState('mean');
    const [dropDups, setDropDups] = useState(true);
    const [scalingMethod, setScalingMethod] = useState('standard');
    const [outlierHandling, setOutlierHandling] = useState('clip_iqr');
    const [encodingMethod, setEncodingMethod] = useState('onehot');
    const [selectedFeatures, setSelectedFeatures] = useState([]);
    const [preprocResult, setPreprocResult] = useState(null);
    const [preprocLoading, setPreprocLoading] = useState(false);
    useEffect(() => {
        if (!datasetId)
            return;
        setLoading(true);
        setError(null);
        Promise.all([
            fetchDataset(datasetId),
            fetchDatasetPreview(datasetId, 1, 15)
        ])
            .then(([ds, prev]) => {
            setDataset(ds);
            setPreview(prev);
            setPage(1);
            setSelectedFeatures(ds.columns.map(c => c.name));
            setLoading(false);
        })
            .catch((err) => {
            setError(err.message || 'Failed to fetch dataset');
            setLoading(false);
        });
    }, [datasetId]);
    const handlePageChange = (newPage) => {
        if (!datasetId)
            return;
        setPage(newPage);
        fetchDatasetPreview(datasetId, newPage, 15)
            .then(setPreview)
            .catch(console.error);
    };
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        setUploading(true);
        setUploadError(null);
        setUploadSuccess(null);
        try {
            const res = await uploadDataset(file);
            setUploadSuccess(`Successfully ingested ${res.name} (${res.row_count} rows, ${res.column_count} columns)`);
            onDatasetUploaded();
        }
        catch (err) {
            setUploadError(err.message || 'Failed to upload dataset');
        }
        finally {
            setUploading(false);
        }
    };
    const handleRunPreprocessing = async () => {
        if (!datasetId)
            return;
        setPreprocLoading(true);
        try {
            const res = await preprocessDataset(datasetId, {
                imputation_strategy: imputeStrategy,
                drop_duplicates: dropDups,
                scaling_method: scalingMethod,
                outlier_handling: outlierHandling,
                categorical_encoding: encodingMethod,
                feature_selection: selectedFeatures
            });
            setPreprocResult(res);
        }
        catch (err) {
            alert(`Preprocessing failed: ${err.message}`);
        }
        finally {
            setPreprocLoading(false);
        }
    };
    const toggleFeature = (name) => {
        setSelectedFeatures(prev => prev.includes(name) ? prev.filter(f => f !== name) : [...prev, name]);
    };
    if (loading)
        return _jsx(LoadingSkeleton, { message: "Inspecting dataset schema and profiles..." });
    if (error)
        return _jsx(ErrorAlert, { message: error });
    if (!dataset)
        return null;
    return (_jsxs("div", { children: [_jsx(PageHeader, { title: "Dataset Workspace & Feature Preparation", description: "Inspect schema metadata, profile column distributions, view raw observation records, and configure a reproducible data cleaning pipeline." }), _jsxs("div", { className: "card", style: { marginBottom: '24px' }, children: [_jsx("div", { className: "card-header", children: _jsxs("div", { children: [_jsxs("div", { className: "card-title", children: [_jsx(Upload, { size: 18, style: { color: 'var(--accent-teal)' } }), "Ingest New Traffic Corpus"] }), _jsx("div", { className: "card-subtitle", children: "Upload local CSV or ARFF datasets with timestamps, speed/volume metrics, or coordinates" })] }) }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }, children: [_jsxs("label", { className: "btn btn-primary", style: { cursor: 'pointer' }, children: [_jsx(Upload, { size: 14 }), _jsx("span", { children: uploading ? 'Processing & Validating...' : 'Select File (.csv or .arff)' }), _jsx("input", { type: "file", accept: ".csv,.arff", onChange: handleFileUpload, disabled: uploading, style: { display: 'none' } })] }), _jsx("span", { style: { fontSize: '0.8rem', color: 'var(--text-dim)' }, children: "Max file limit 50MB. Automatic column type inference & schema validation applied." })] }), uploadError && (_jsx("div", { style: { marginTop: '14px' }, children: _jsx(ErrorAlert, { message: uploadError }) })), uploadSuccess && (_jsxs("div", { style: {
                            marginTop: '14px',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '10px 14px',
                            color: '#10B981',
                            fontSize: '0.85rem'
                        }, children: ["\u2713 ", uploadSuccess] }))] }), _jsxs("div", { className: "card", style: { marginBottom: '24px' }, children: [_jsxs("div", { className: "card-header", children: [_jsxs("div", { children: [_jsx("div", { className: "card-title", children: "Column Profile & Data Quality Audit" }), _jsx("div", { className: "card-subtitle", children: "Inferred data types, missingness rates, unique cardinalities, and numerical boundaries" })] }), _jsxs("span", { className: "badge badge-neutral", children: [dataset.columns.length, " Attributes Defined"] })] }), _jsx("div", { className: "table-container", children: _jsxs("table", { className: "data-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Column Name" }), _jsx("th", { children: "Inferred Type" }), _jsx("th", { children: "Missing Values" }), _jsx("th", { children: "Unique Count" }), _jsx("th", { children: "Min / Max" }), _jsx("th", { children: "Mean \u00B1 Std" }), _jsx("th", { children: "Sample Preview" })] }) }), _jsx("tbody", { children: dataset.columns.map((col) => (_jsxs("tr", { children: [_jsx("td", { children: _jsx("strong", { style: { color: '#F8FAFC' }, children: col.name }) }), _jsx("td", { children: _jsx("span", { className: "badge badge-neutral", style: { textTransform: 'capitalize' }, children: col.inferred_type }) }), _jsx("td", { children: col.missing_count === 0 ? (_jsx("span", { style: { color: '#10B981' }, children: "0 (0%)" })) : (_jsxs("span", { style: { color: '#EF4444' }, children: [col.missing_count, " (", col.missing_pct, "%)"] })) }), _jsx("td", { children: col.unique_count.toLocaleString() }), _jsx("td", { children: col.min_val !== null && col.max_val !== null ? (_jsxs("span", { children: [col.min_val, " to ", col.max_val] })) : (_jsx("span", { style: { color: 'var(--text-dim)' }, children: "\u2014" })) }), _jsx("td", { children: col.mean_val !== null ? (_jsxs("span", { children: [col.mean_val, " \u00B1 ", col.std_val] })) : (_jsx("span", { style: { color: 'var(--text-dim)' }, children: "\u2014" })) }), _jsx("td", { children: _jsx("span", { style: { fontSize: '0.75rem', color: 'var(--text-muted)' }, children: col.sample_values?.slice(0, 3).join(', ') || '—' }) })] }, col.name))) })] }) })] }), preview && (_jsxs("div", { className: "card", style: { marginBottom: '24px' }, children: [_jsxs("div", { className: "card-header", children: [_jsxs("div", { children: [_jsx("div", { className: "card-title", children: "Observation Records Preview" }), _jsxs("div", { className: "card-subtitle", children: ["Showing rows ", ((page - 1) * preview.page_size) + 1, " to ", Math.min(page * preview.page_size, preview.total_rows), " of ", preview.total_rows.toLocaleString()] })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx("button", { className: "btn btn-secondary", disabled: page <= 1, onClick: () => handlePageChange(page - 1), style: { padding: '6px 10px' }, children: _jsx(ChevronLeft, { size: 16 }) }), _jsxs("span", { style: { fontSize: '0.85rem', color: 'var(--text-muted)' }, children: ["Page ", page, " of ", Math.ceil(preview.total_rows / preview.page_size)] }), _jsx("button", { className: "btn btn-secondary", disabled: page >= Math.ceil(preview.total_rows / preview.page_size), onClick: () => handlePageChange(page + 1), style: { padding: '6px 10px' }, children: _jsx(ChevronRight, { size: 16 }) })] })] }), _jsx("div", { className: "table-container", children: _jsxs("table", { className: "data-table", children: [_jsx("thead", { children: _jsx("tr", { children: preview.columns.map((c) => (_jsx("th", { children: c }, c))) }) }), _jsx("tbody", { children: preview.rows.map((row, idx) => (_jsx("tr", { children: preview.columns.map((c) => (_jsx("td", { children: row[c] !== null && row[c] !== undefined ? String(row[c]) : _jsx("span", { style: { color: '#EF4444' }, children: "null" }) }, c))) }, idx))) })] }) })] })), _jsxs("div", { className: "card", children: [_jsxs("div", { className: "card-header", children: [_jsxs("div", { children: [_jsxs("div", { className: "card-title", children: [_jsx(Sliders, { size: 18, style: { color: 'var(--accent-teal)' } }), "Feature Engineering & Preprocessing Pipeline"] }), _jsx("div", { className: "card-subtitle", children: "Configure deterministic data cleaning, missing imputation, outlier boundaries, and scaling" })] }), _jsx("button", { className: "btn btn-primary", onClick: handleRunPreprocessing, disabled: preprocLoading, children: preprocLoading ? 'Running Pipeline...' : 'Execute Preprocessing' })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Missing Value Imputation" }), _jsxs("select", { className: "form-select", value: imputeStrategy, onChange: (e) => setImputeStrategy(e.target.value), children: [_jsx("option", { value: "mean", children: "Mean (Numerical Columns)" }), _jsx("option", { value: "median", children: "Median (Outlier-Resistant)" }), _jsx("option", { value: "mode", children: "Mode / Most Frequent" }), _jsx("option", { value: "drop", children: "Drop Incomplete Rows" })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Outlier Mitigation" }), _jsxs("select", { className: "form-select", value: outlierHandling, onChange: (e) => setOutlierHandling(e.target.value), children: [_jsx("option", { value: "clip_iqr", children: "Clip at 1.5x IQR (Recommended)" }), _jsx("option", { value: "drop_zscore", children: "Filter Rows with |Z| > 3" }), _jsx("option", { value: "none", children: "No Outlier Transformation" })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Numerical Scaling" }), _jsxs("select", { className: "form-select", value: scalingMethod, onChange: (e) => setScalingMethod(e.target.value), children: [_jsx("option", { value: "standard", children: "StandardScaler (Zero Mean, Unit Var)" }), _jsx("option", { value: "minmax", children: "MinMaxScaler [0, 1]" }), _jsx("option", { value: "robust", children: "RobustScaler (Median / IQR)" }), _jsx("option", { value: "none", children: "None (Keep Raw Units)" })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "Categorical Encoding" }), _jsxs("select", { className: "form-select", value: encodingMethod, onChange: (e) => setEncodingMethod(e.target.value), children: [_jsx("option", { value: "onehot", children: "One-Hot Encoding (Dummies)" }), _jsx("option", { value: "label", children: "Label Encoding (Ordinal Integers)" }), _jsx("option", { value: "none", children: "Pass-Through Strings" })] })] })] }), _jsxs("div", { style: { marginBottom: '20px' }, children: [_jsx("div", { className: "form-label", style: { marginBottom: '8px' }, children: "Active Features for Model Fitting:" }), _jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: '8px' }, children: dataset.columns.map((col) => {
                                    const active = selectedFeatures.includes(col.name);
                                    return (_jsxs("button", { type: "button", onClick: () => toggleFeature(col.name), style: {
                                            backgroundColor: active ? 'rgba(20, 184, 166, 0.15)' : 'var(--bg-surface-elevated)',
                                            border: `1px solid ${active ? 'var(--accent-teal)' : 'var(--border-color)'}`,
                                            color: active ? 'var(--accent-teal)' : 'var(--text-muted)',
                                            borderRadius: 'var(--radius-sm)',
                                            padding: '6px 12px',
                                            fontSize: '0.8rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }, children: [active && _jsx(Check, { size: 12 }), _jsx("span", { children: col.name })] }, col.name));
                                }) })] }), preprocResult && (_jsxs("div", { style: {
                            backgroundColor: 'var(--bg-surface-elevated)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '16px',
                            marginTop: '16px'
                        }, children: [_jsx("div", { style: { fontWeight: 600, color: '#F8FAFC', marginBottom: '8px' }, children: "\u2713 Transformation Completed" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }, children: [_jsxs("div", { children: [_jsx("span", { style: { fontSize: '0.75rem', color: 'var(--text-dim)' }, children: "Row Count Delta:" }), _jsxs("div", { style: { fontWeight: 600, color: '#F8FAFC' }, children: [preprocResult.original_rows, " \u2192 ", preprocResult.processed_rows] })] }), _jsxs("div", { children: [_jsx("span", { style: { fontSize: '0.75rem', color: 'var(--text-dim)' }, children: "Feature Columns:" }), _jsxs("div", { style: { fontWeight: 600, color: '#F8FAFC' }, children: [preprocResult.original_cols, " \u2192 ", preprocResult.processed_cols] })] })] }), _jsxs("div", { style: { marginBottom: '12px' }, children: [_jsx("span", { style: { fontSize: '0.75rem', color: 'var(--text-dim)' }, children: "Transformations Applied:" }), _jsx("ul", { style: { margin: '6px 0 0 18px', fontSize: '0.82rem', color: 'var(--text-muted)' }, children: preprocResult.transformations_applied.map((t, idx) => (_jsx("li", { children: t }, idx))) })] }), _jsx("div", { style: { fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '6px' }, children: "Transformed Matrix Sample:" }), _jsx("div", { className: "table-container", style: { maxHeight: '180px' }, children: _jsxs("table", { className: "data-table", children: [_jsx("thead", { children: _jsx("tr", { children: preprocResult.columns.slice(0, 8).map(c => _jsx("th", { children: c }, c)) }) }), _jsx("tbody", { children: preprocResult.sample_preview.slice(0, 5).map((row, idx) => (_jsx("tr", { children: preprocResult.columns.slice(0, 8).map(c => (_jsx("td", { children: typeof row[c] === 'number' ? Number(row[c]).toFixed(3) : String(row[c] ?? '') }, c))) }, idx))) })] }) })] }))] })] }));
};
