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
import { fetchDatasets } from './services/api';
import { Dataset } from './types';
import './App.css';

export function App() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const loadDatasets = (newId?: string) => {
    setLoading(true);
    setConnectionError(null);
    fetchDatasets()
      .then((data) => {
        setDatasets(data);
        if (newId) {
          setSelectedDatasetId(newId);
        } else if (data.length > 0) {
          setSelectedDatasetId((prev) => (prev ? prev : data[0].id));
        }
      })
      .catch((err) => {
        console.error('Error fetching datasets:', err);
        setConnectionError(
          'Connecting to UrbanPulse backend... If the backend was sleeping, it takes ~30-45s to wake up.'
        );
        // Auto-retry once after 6 seconds in case of cold start
        setTimeout(() => {
          fetchDatasets().then((data) => {
            if (data.length > 0) {
              setDatasets(data);
              setSelectedDatasetId(data[0].id);
              setConnectionError(null);
            }
          }).catch(() => {});
        }, 6000);
      })
      .finally(() => setLoading(false));
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
          {connectionError && (
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
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => loadDatasets()}
                style={{ marginLeft: '12px', padding: '4px 10px', fontSize: '12px' }}
              >
                Retry Now
              </button>
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
