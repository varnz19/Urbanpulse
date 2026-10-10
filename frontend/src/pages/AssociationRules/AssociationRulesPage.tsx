import React, { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { LoadingSkeleton, ErrorAlert } from '../../components/common/Feedback';
import { runAssociation, saveExperiment } from '../../services/api';
import { AssociationResponse } from '../../types';

interface AssociationRulesPageProps {
  datasetId: string;
}

export const AssociationRulesPage: React.FC<AssociationRulesPageProps> = ({ datasetId }) => {
  const [minSupport, setMinSupport] = useState<number>(0.03);
  const [minConfidence, setMinConfidence] = useState<number>(0.35);
  const [minLift, setMinLift] = useState<number>(1.1);
  const [result, setResult] = useState<AssociationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleRunApriori = async () => {
    if (!datasetId) return;
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
    } catch (err: any) {
      setError(err.message || 'Association rule discovery failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExperiment = async () => {
    if (!result || !datasetId) return;
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
    } catch (err: any) {
      alert(`Failed to save: ${err.message}`);
    }
  };

  const exportRulesCsv = () => {
    if (!result || result.rules.length === 0) return;
    const header = 'Antecedents,Consequents,Support,Confidence,Lift,Conviction\n';
    const rows = result.rules.map(r =>
      `"${r.antecedents.join(' AND ')}","${r.consequents.join(' AND ')}",${r.support},${r.confidence},${r.lift},${r.conviction}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `urbanpulse_association_rules_${datasetId}.csv`;
    a.click();
  };

  return (
    <div>
      <PageHeader
        title="Association Rule Discovery (Apriori Engine)"
        description="Discover co-occurring traffic conditions across discretized mobility dimensions: weather, road type, time period, and congestion levels."
      />

      {/* Caution Alert regarding correlation vs causation */}
      <div style={{
        backgroundColor: 'rgba(217, 119, 6, 0.12)',
        border: '1px solid #D97706',
        borderRadius: 'var(--radius-sm)',
        padding: '10px 14px',
        color: '#FBBF24',
        fontSize: '0.8rem',
        marginBottom: '16px'
      }}>
        <strong>Methodological Note:</strong> Association rules identify statistical co-occurrence within observation transactions. Association does not establish causation or physical etiology.
      </div>

      {/* Configuration Controls */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Apriori Mining Thresholds</div>
            <div className="card-subtitle">Adjust minimum support, confidence, and lift thresholds</div>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleRunApriori}
            disabled={loading}
          >
            <span>{loading ? 'Mining Itemsets...' : 'Discover Rules'}</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label className="form-label">Minimum Support: {(minSupport * 100).toFixed(0)}%</label>
            <input
              type="range"
              min="0.01"
              max="0.15"
              step="0.01"
              value={minSupport}
              onChange={(e) => setMinSupport(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-teal)', marginTop: '6px' }}
            />
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
              Minimum frequency of itemset across observations
            </div>
          </div>

          <div>
            <label className="form-label">Minimum Confidence: {(minConfidence * 100).toFixed(0)}%</label>
            <input
              type="range"
              min="0.1"
              max="0.8"
              step="0.05"
              value={minConfidence}
              onChange={(e) => setMinConfidence(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-teal)', marginTop: '6px' }}
            />
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
              Conditional probability P(Consequent | Antecedent)
            </div>
          </div>

          <div>
            <label className="form-label">Minimum Lift: {minLift.toFixed(1)}x</label>
            <input
              type="range"
              min="1.0"
              max="3.0"
              step="0.1"
              value={minLift}
              onChange={(e) => setMinLift(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-teal)', marginTop: '6px' }}
            />
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
              Multiplier above baseline random independence
            </div>
          </div>
        </div>
      </div>

      {loading && <LoadingSkeleton message="Mining frequent itemsets with mlxtend Apriori..." />}
      {error && <ErrorAlert message={error} />}

      {/* Rules Table */}
      {result && !loading && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Discovered Rules ({result.total_rules_found})</div>
              <div className="card-subtitle">
                Sorted by statistical lift
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-secondary"
                onClick={handleSaveExperiment}
                disabled={savedSuccess}
              >
                <span>{savedSuccess ? '[OK] Saved' : 'Save Run'}</span>
              </button>
              <button
                className="btn btn-secondary"
                onClick={exportRulesCsv}
                disabled={result.rules.length === 0}
              >
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {result.rules.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No association rules met the specified support ({minSupport}) and confidence ({minConfidence}) thresholds. Adjust thresholds to broaden search.
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Antecedents (IF)</th>
                    <th>Consequents (THEN)</th>
                    <th>Support</th>
                    <th>Confidence</th>
                    <th>Lift</th>
                    <th>Interpretation</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rules.map((rule, idx) => (
                    <tr key={idx}>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                          {rule.antecedents.map((ant, i) => (
                            <span key={i} className="badge badge-neutral">{ant}</span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                          {rule.consequents.map((con, i) => (
                            <span key={i} className="badge badge-mod">{con}</span>
                          ))}
                        </div>
                      </td>
                      <td>{(rule.support * 100).toFixed(1)}%</td>
                      <td>
                        <strong style={{ color: rule.confidence > 0.6 ? '#059669' : '#D97706' }}>
                          {(rule.confidence * 100).toFixed(1)}%
                        </strong>
                      </td>
                      <td>
                        <strong style={{ color: rule.lift > 1.8 ? '#DC2626' : '#0D9488' }}>
                          {rule.lift.toFixed(2)}x
                        </strong>
                      </td>
                      <td style={{ maxWidth: '340px', whiteSpace: 'normal', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {rule.human_explanation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
