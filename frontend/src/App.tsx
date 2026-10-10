import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { TopNav } from './components/layout/TopNav';
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

  const loadDatasets = () => {
    setLoading(true);
    fetchDatasets()
      .then((data) => {
        setDatasets(data);
        if (data.length > 0 && !selectedDatasetId) {
          setSelectedDatasetId(data[0].id);
        }
      })
      .catch((err) => console.error('Error fetching datasets:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDatasets();
  }, []);

  return (
    <BrowserRouter>
      <div className="app-container">
        <Sidebar />
        <div className="main-wrapper">
          <TopNav
            datasets={datasets}
            selectedDatasetId={selectedDatasetId}
            onSelectDataset={(id) => setSelectedDatasetId(id)}
            onRefresh={loadDatasets}
            isLoading={loading}
          />

          <main className="content-body">
            <Routes>
              <Route path="/" element={<OverviewPage datasetId={selectedDatasetId} />} />
              <Route path="/overview" element={<Navigate to="/" replace />} />
              <Route
                path="/datasets"
                element={
                  <DatasetsPage
                    datasetId={selectedDatasetId}
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
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
