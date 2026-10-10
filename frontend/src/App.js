import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
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
import './App.css';
export function App() {
    const [datasets, setDatasets] = useState([]);
    const [selectedDatasetId, setSelectedDatasetId] = useState('');
    const [loading, setLoading] = useState(true);
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
    return (_jsx(BrowserRouter, { children: _jsxs("div", { className: "app-container", children: [_jsx(Sidebar, {}), _jsxs("div", { className: "main-wrapper", children: [_jsx(TopNav, { datasets: datasets, selectedDatasetId: selectedDatasetId, onSelectDataset: (id) => setSelectedDatasetId(id), onRefresh: loadDatasets, isLoading: loading }), _jsx("main", { className: "content-body", children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(OverviewPage, { datasetId: selectedDatasetId }) }), _jsx(Route, { path: "/overview", element: _jsx(Navigate, { to: "/", replace: true }) }), _jsx(Route, { path: "/datasets", element: _jsx(DatasetsPage, { datasetId: selectedDatasetId, onDatasetUploaded: loadDatasets }) }), _jsx(Route, { path: "/patterns", element: _jsx(PatternExplorerPage, { datasetId: selectedDatasetId }) }), _jsx(Route, { path: "/segments", element: _jsx(SegmentIntelligencePage, { datasetId: selectedDatasetId }) }), _jsx(Route, { path: "/classification", element: _jsx(ClassificationPage, { datasetId: selectedDatasetId }) }), _jsx(Route, { path: "/association", element: _jsx(AssociationRulesPage, { datasetId: selectedDatasetId }) }), _jsx(Route, { path: "/anomalies", element: _jsx(AnomaliesPage, { datasetId: selectedDatasetId }) }), _jsx(Route, { path: "/experiments", element: _jsx(ExperimentsPage, { datasetId: selectedDatasetId }) }), _jsx(Route, { path: "/reports", element: _jsx(ReportsPage, { datasetId: selectedDatasetId }) }), _jsx(Route, { path: "/provenance", element: _jsx(ProvenancePage, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }) })] })] }) }));
}
export default App;
