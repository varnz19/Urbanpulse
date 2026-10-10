const API_BASE = '/api';
export async function fetchDatasets() {
    const res = await fetch(`${API_BASE}/datasets`);
    if (!res.ok)
        throw new Error('Failed to fetch datasets');
    return res.json();
}
export async function fetchDataset(id) {
    const res = await fetch(`${API_BASE}/datasets/${id}`);
    if (!res.ok)
        throw new Error('Failed to fetch dataset');
    return res.json();
}
export async function uploadDataset(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/datasets/upload`, {
        method: 'POST',
        body: formData,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
}
export async function fetchDatasetPreview(id, page = 1, pageSize = 25) {
    const res = await fetch(`${API_BASE}/datasets/${id}/preview?page=${page}&page_size=${pageSize}`);
    if (!res.ok)
        throw new Error('Failed to fetch preview');
    return res.json();
}
export async function preprocessDataset(id, options) {
    const res = await fetch(`${API_BASE}/datasets/${id}/preprocess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Preprocessing failed' }));
        throw new Error(err.detail || 'Preprocessing failed');
    }
    return res.json();
}
export async function fetchOverview(id) {
    const res = await fetch(`${API_BASE}/analytics/${id}/overview`);
    if (!res.ok)
        throw new Error('Failed to fetch overview metrics');
    return res.json();
}
export async function fetchHeatmap(id, metric = 'avg_speed_kmh') {
    const res = await fetch(`${API_BASE}/analytics/${id}/heatmap?metric=${metric}`);
    if (!res.ok)
        throw new Error('Failed to fetch heatmap data');
    return res.json();
}
export async function fetchCorridorsGeo(id) {
    const res = await fetch(`${API_BASE}/analytics/${id}/corridors`);
    if (!res.ok)
        throw new Error('Failed to fetch corridor geographic data');
    return res.json();
}
export async function runClustering(id, payload) {
    const res = await fetch(`${API_BASE}/ml/${id}/clustering`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Clustering failed' }));
        throw new Error(err.detail || 'Clustering execution failed');
    }
    return res.json();
}
export async function runClassification(id, payload) {
    const res = await fetch(`${API_BASE}/ml/${id}/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Classification failed' }));
        throw new Error(err.detail || 'Classification execution failed');
    }
    return res.json();
}
export async function runAssociation(id, payload) {
    const res = await fetch(`${API_BASE}/ml/${id}/association`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Association mining failed' }));
        throw new Error(err.detail || 'Association mining failed');
    }
    return res.json();
}
export async function runAnomalyDetection(id, payload) {
    const res = await fetch(`${API_BASE}/ml/${id}/anomalies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Anomaly detection failed' }));
        throw new Error(err.detail || 'Anomaly detection failed');
    }
    return res.json();
}
export async function fetchExperiments(datasetId) {
    const url = datasetId ? `${API_BASE}/experiments?dataset_id=${datasetId}` : `${API_BASE}/experiments`;
    const res = await fetch(url);
    if (!res.ok)
        throw new Error('Failed to fetch experiments');
    return res.json();
}
export async function saveExperiment(payload) {
    const res = await fetch(`${API_BASE}/experiments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok)
        throw new Error('Failed to save experiment');
    return res.json();
}
export async function fetchReportSummary(id) {
    const res = await fetch(`${API_BASE}/reports/${id}/summary`);
    if (!res.ok)
        throw new Error('Failed to generate report summary');
    return res.json();
}
