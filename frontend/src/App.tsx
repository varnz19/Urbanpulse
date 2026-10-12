import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TopNav } from './components/layout/TopNav';
import { FloatingBottomNav } from './components/layout/FloatingBottomNav';
import { OverviewPage } from './pages/Overview/OverviewPage';
import { DatasetsPage } from './pages/Datasets/DatasetsPage';
import { PatternExplorerPage } from './pages/PatternExplorer/PatternExplorerPage';
import { SegmentIntelligencePage } from './pages/SegmentIntelligence/SegmentIntelligencePage';
import { ClassificationPage } from './pages/Classification/ClassificationPage';
import { AssociationRulesPage } from './pages/AssociationRules/AssociationRulesPage';
import { AnomaliesPage } from './pages/Anomalies/AnomaliesPage';
import { ExperimentsPage } from './pages/Experiments/ExperimentsPage';
import { ReportsPage } from './pages/Reports/ReportsPage';
import { ProvenancePage } from './pages/Provenance/ProvenancePage';
import { fetchDatasets, getApiBase, setCustomApiBase } from './services/api';
import { Dataset } from './types';
import './App.css';

export function App() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [apiUrlInput, setApiUrlInput] = useState<string>(() => getApiBase() === '/api' ? '' : getApiBase());
  const [showConfigBox, setShowConfigBox] = useState<boolean>(false);

  const loadDatasets = (newId?: string) => {
    setLoading(true);
    setConnectionError(null);
    fetchDatasets()
      .then((data) => {
        setDatasets(data);
        setShowConfigBox(false);
        if (newId) {
          setSelectedDatasetId(newId);
        } else if (data.length > 0) {
          setSelectedDatasetId((prev) => (prev ? prev : data[0].id));
        }
      })
      .catch((err) => {
        console.error('Error fetching datasets:', err);
        const isHtmlError = err.message && (err.message.includes('BACKEND_NOT_CONFIGURED') || err.message.includes('Unexpected token'));
        if (isHtmlError || getApiBase() === '/api') {
          setConnectionError(
            'The frontend needs your Render Backend URL to fetch and compute datasets.'
          );
          setShowConfigBox(true);
        } else {
          setConnectionError(
            'Connecting to backend... If the Render free instance is waking up, please allow ~30-45s.'
          );
          setTimeout(() => {
            fetchDatasets().then((data) => {
              if (data.length > 0) {
                setDatasets(data);
                setSelectedDatasetId(data[0].id);
                setConnectionError(null);
              }
            }).catch(() => {});
          }, 6000);
        }
      })
      .finally(() => setLoading(false));
  };

  const handleSaveApiUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiUrlInput.trim()) return;
    setCustomApiBase(apiUrlInput);
    loadDatasets();
  };

  useEffect(() => {
    loadDatasets();
  }, []);

  return (
    <BrowserRouter>
      <div className="app-container full-width-layout">
        <TopNav
          datasets={datasets}
          selectedDatasetId={selectedDatasetId}
          onSelectDataset={(id) => setSelectedDatasetId(id)}
          onRefresh={loadDatasets}
          isLoading={loading}
        />

        <main className="content-body">
          {showConfigBox && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
              border: '1px solid #14B8A6',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              borderRadius: '12px',
              padding: '20px 24px',
              margin: '0 0 24px 0',
              color: '#F1F5F9'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>🔗</span>
                  <strong style={{ fontSize: '16px', color: '#14B8A6' }}>Connect UrbanPulse Backend Service</strong>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfigBox(false)}
                  style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '18px' }}
                >
                  ✕
                </button>
              </div>
              <p style={{ margin: '0 0 16px 0', fontSize: '13.5px', color: '#CBD5E1', lineHeight: '1.5' }}>
                Paste the public URL of your <strong>urbanpulse-backend</strong> service from Render (e.g. <code>https://urbanpulse-backend.onrender.com/api</code>).
                This directly links the browser to your live FastAPI &amp; ML algorithms:
              </p>
              <form onSubmit={handleSaveApiUrl} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="https://urbanpulse-backend.onrender.com/api"
                  value={apiUrlInput}
                  onChange={(e) => setApiUrlInput(e.target.value)}
                  style={{
                    flex: '1',
                    minWidth: '280px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#0B1220',
                    border: '1px solid #334155',
                    color: '#F8FAFC',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    padding: '10px 22px',
                    fontWeight: 600,
                    background: '#14B8A6',
                    color: '#0B1220',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Connect &amp; Load Data
                </button>
              </form>
            </div>
          )}

          {connectionError && !showConfigBox && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#FBBF24',
              borderRadius: '8px',
              padding: '12px 18px',
              margin: '0 0 20px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '13px',
              fontWeight: 500
            }}>
              <span>⏳ {connectionError}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowConfigBox(true)}
                  style={{ padding: '4px 10px', fontSize: '12px' }}
                >
                  Change API URL
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => loadDatasets()}
                  style={{ padding: '4px 10px', fontSize: '12px' }}
                >
                  Retry Now
                </button>
              </div>
            </div>
          )}
          <Routes>
            <Route
              path="/"
              element={
                <OverviewPage
                  datasetId={selectedDatasetId}
                  datasets={datasets}
                  onSelectDataset={(id) => setSelectedDatasetId(id)}
                />
              }
            />
            <Route path="/overview" element={<Navigate to="/" replace />} />
            <Route
              path="/datasets"
              element={
                <DatasetsPage
                  datasetId={selectedDatasetId}
                  datasets={datasets}
                  onSelectDataset={(id) => setSelectedDatasetId(id)}
                  onDatasetUploaded={loadDatasets}
                />
              }
            />
            <Route path="/patterns" element={<PatternExplorerPage datasetId={selectedDatasetId} />} />
            <Route path="/segments" element={<SegmentIntelligencePage datasetId={selectedDatasetId} />} />
            <Route path="/classification" element={<ClassificationPage datasetId={selectedDatasetId} />} />
            <Route path="/association" element={<AssociationRulesPage datasetId={selectedDatasetId} />} />
            <Route path="/anomalies" element={<AnomaliesPage datasetId={selectedDatasetId} />} />
            <Route path="/experiments" element={<ExperimentsPage datasetId={selectedDatasetId} />} />
            <Route path="/reports" element={<ReportsPage datasetId={selectedDatasetId} />} />
            <Route path="/provenance" element={<ProvenancePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Floating bottom navigation bar in the air with icons */}
        <FloatingBottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;
