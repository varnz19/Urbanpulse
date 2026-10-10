import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { LoadingSkeleton, ErrorAlert } from '../../components/common/Feedback';
import { runAssociation, saveExperiment } from '../../services/api';
import { GitPullRequest, Download, Bookmark, Sparkles, AlertTriangle } from 'lucide-react';
export const AssociationRulesPage = ({ datasetId }) => {
    const [minSupport, setMinSupport] = useState(0.03);
    const [minConfidence, setMinConfidence] = useState(0.35);
    const [minLift, setMinLift] = useState(1.1);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [savedSuccess, setSavedSuccess] = useState(false);
    const handleRunApriori = async () => {
        if (!datasetId)
            return;
        setLoading(true);
        setError(null);
        setSavedSuccess(false);
        try {
            const res = await runAssociation(datasetId, {
                min_support: minSupport,
                min_confidence: minConfidence,
                min_lift: minLift
            });
            setResult(res);
        }
        catch (err) {
            setError(err.message || 'Association rule discovery failed');
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
                name: `Apriori Mining (Supp=${minSupport}, Conf=${minConfidence})`,
                task_type: 'association',
                parameters: { min_support: minSupport, min_confidence: minConfidence, min_lift: minLift },
                metrics: { total_rules: result.total_rules_found },
                results_summary: `Discovered ${result.total_rules_found} rules matching minimum lift ${minLift}.`
            });
            setSavedSuccess(true);
        }
        catch (err) {
            alert(`Failed to save: ${err.message}`);
        }
    };
    const exportRulesCsv = () => {
        if (!result || result.rules.length === 0)
            return;
        const header = 'Antecedents,Consequents,Support,Confidence,Lift,Conviction\n';
        const rows = result.rules.map(r => `"${r.antecedents.join(' AND ')}","${r.consequents.join(' AND ')}",${r.support},${r.confidence},${r.lift},${r.conviction}`).join('\n');
        const blob = new Blob([header + rows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `urbanpulse_association_rules_${datasetId}.csv`;
        a.click();
    };
    return (_jsxs("div", { children: [_jsx(PageHeader, { title: "Association Rule Discovery (Apriori Engine)", description: "Discover co-occurring traffic conditions across discretized mobility dimensions: weather, road type, time period, and congestion levels." }), _jsxs("div", { style: {
                    backgroundColor: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 16px',
                    color: '#FCD34D',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '20px'
                }, children: [_jsx(AlertTriangle, { size: 18, style: { color: '#F59E0B', flexShrink: 0 } }), _jsxs("span", { children: [_jsx("strong", { children: "Methodological Note:" }), " Association rules identify statistical co-occurrence within historical sensor transactions. Association does not establish causation or ground-truth physical etiology."] })] }), _jsxs("div", { className: "card", style: { marginBottom: '24px' }, children: [_jsxs("div", { className: "card-header", children: [_jsxs("div", { children: [_jsxs("div", { className: "card-title", children: [_jsx(GitPullRequest, { size: 18, style: { color: 'var(--accent-teal)' } }), "Apriori Mining Thresholds"] }), _jsx("div", { className: "card-subtitle", children: "Adjust minimum support, confidence, and lift thresholds" })] }), _jsxs("button", { className: "btn btn-primary", onClick: handleRunApriori, disabled: loading, children: [_jsx(Sparkles, { size: 14 }), _jsx("span", { children: loading ? 'Mining Frequent Itemsets...' : 'Discover Rules' })] })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }, children: [_jsxs("div", { children: [_jsxs("label", { className: "form-label", children: ["Minimum Support: ", (minSupport * 100).toFixed(0), "%"] }), _jsx("input", { type: "range", min: "0.01", max: "0.15", step: "0.01", value: minSupport, onChange: (e) => setMinSupport(Number(e.target.value)), style: { width: '100%', accentColor: 'var(--accent-teal)', marginTop: '8px' } }), _jsx("div", { style: { fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }, children: "Minimum frequency of itemset across observations" })] }), _jsxs("div", { children: [_jsxs("label", { className: "form-label", children: ["Minimum Confidence: ", (minConfidence * 100).toFixed(0), "%"] }), _jsx("input", { type: "range", min: "0.1", max: "0.8", step: "0.05", value: minConfidence, onChange: (e) => setMinConfidence(Number(e.target.value)), style: { width: '100%', accentColor: 'var(--accent-teal)', marginTop: '8px' } }), _jsx("div", { style: { fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }, children: "P(Consequent | Antecedent) conditional probability" })] }), _jsxs("div", { children: [_jsxs("label", { className: "form-label", children: ["Minimum Lift: ", minLift.toFixed(1), "x"] }), _jsx("input", { type: "range", min: "1.0", max: "3.0", step: "0.1", value: minLift, onChange: (e) => setMinLift(Number(e.target.value)), style: { width: '100%', accentColor: 'var(--accent-teal)', marginTop: '8px' } }), _jsx("div", { style: { fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }, children: "Multiplier above baseline random independence (> 1.0)" })] })] })] }), loading && _jsx(LoadingSkeleton, { message: "Mining frequent itemsets with mlxtend Apriori..." }), error && _jsx(ErrorAlert, { message: error }), result && !loading && (_jsxs("div", { className: "card", children: [_jsxs("div", { className: "card-header", children: [_jsxs("div", { children: [_jsxs("div", { className: "card-title", children: ["Discovered Rules (", result.total_rules_found, ")"] }), _jsx("div", { className: "card-subtitle", children: "Sorted by statistical lift (highest unexpected correlation first)" })] }), _jsxs("div", { style: { display: 'flex', gap: '8px' }, children: [_jsxs("button", { className: "btn btn-secondary", onClick: handleSaveExperiment, disabled: savedSuccess, children: [_jsx(Bookmark, { size: 14 }), _jsx("span", { children: savedSuccess ? '✓ Saved' : 'Save Run' })] }), _jsxs("button", { className: "btn btn-secondary", onClick: exportRulesCsv, disabled: result.rules.length === 0, children: [_jsx(Download, { size: 14 }), _jsx("span", { children: "Export CSV" })] })] })] }), result.rules.length === 0 ? (_jsxs("div", { style: { padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }, children: ["No association rules met the specified support (", minSupport, ") and confidence (", minConfidence, ") thresholds. Try lowering the thresholds."] })) : (_jsx("div", { className: "table-container", children: _jsxs("table", { className: "data-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Antecedents (IF)" }), _jsx("th", { children: "Consequents (THEN)" }), _jsx("th", { children: "Support" }), _jsx("th", { children: "Confidence" }), _jsx("th", { children: "Lift" }), _jsx("th", { children: "Plain English Interpretation" })] }) }), _jsx("tbody", { children: result.rules.map((rule, idx) => (_jsxs("tr", { children: [_jsx("td", { children: _jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: '4px' }, children: rule.antecedents.map((ant, i) => (_jsx("span", { className: "badge badge-neutral", children: ant }, i))) }) }), _jsx("td", { children: _jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: '4px' }, children: rule.consequents.map((con, i) => (_jsx("span", { className: "badge badge-mod", children: con }, i))) }) }), _jsxs("td", { children: [(rule.support * 100).toFixed(1), "%"] }), _jsx("td", { children: _jsxs("strong", { style: { color: rule.confidence > 0.6 ? '#10B981' : '#F59E0B' }, children: [(rule.confidence * 100).toFixed(1), "%"] }) }), _jsx("td", { children: _jsxs("strong", { style: { color: rule.lift > 1.8 ? '#EF4444' : '#14B8A6' }, children: [rule.lift.toFixed(2), "x"] }) }), _jsx("td", { style: { maxWidth: '340px', whiteSpace: 'normal', fontSize: '0.78rem', color: 'var(--text-muted)' }, children: rule.human_explanation })] }, idx))) })] }) }))] }))] }));
};
