import {
  Dataset, DatasetPreview, PreprocessResult,
  OverviewMetrics, HeatmapResponse, CorridorGeoItem,
  ClusterResponse, ClassifyResponse, AssociationResponse,
  AnomalyResponse, ExperimentItem
} from '../types';

const rawBase = (import.meta.env.VITE_API_BASE_URL as string) || '/api';
export const API_BASE = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;

export async function fetchDatasets(): Promise<Dataset[]> {
  const res = await fetch(`${API_BASE}/datasets`);
  if (!res.ok) throw new Error('Failed to fetch datasets');
  return res.json();
}

export async function fetchDataset(id: string): Promise<Dataset> {
  const res = await fetch(`${API_BASE}/datasets/${id}`);
  if (!res.ok) throw new Error('Failed to fetch dataset');
  return res.json();
}

export async function uploadDataset(file: File): Promise<Dataset> {
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

export async function deleteDataset(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/datasets/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to delete dataset' }));
    throw new Error(err.detail || 'Failed to delete dataset');
  }
}


export async function fetchDatasetPreview(id: string, page = 1, pageSize = 25): Promise<DatasetPreview> {
  const res = await fetch(`${API_BASE}/datasets/${id}/preview?page=${page}&page_size=${pageSize}`);
  if (!res.ok) throw new Error('Failed to fetch preview');
  return res.json();
}

export async function preprocessDataset(id: string, options: Record<string, any>): Promise<PreprocessResult> {
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

export async function fetchOverview(id: string): Promise<OverviewMetrics> {
  const res = await fetch(`${API_BASE}/analytics/${id}/overview`);
  if (!res.ok) throw new Error('Failed to fetch overview metrics');
  return res.json();
}

export async function fetchHeatmap(id: string, metric = 'avg_speed_kmh'): Promise<HeatmapResponse> {
  const res = await fetch(`${API_BASE}/analytics/${id}/heatmap?metric=${metric}`);
  if (!res.ok) throw new Error('Failed to fetch heatmap data');
  return res.json();
}

export async function fetchCorridorsGeo(id: string): Promise<CorridorGeoItem[]> {
  const res = await fetch(`${API_BASE}/analytics/${id}/corridors`);
  if (!res.ok) throw new Error('Failed to fetch corridor geographic data');
  return res.json();
}

export async function runClustering(id: string, payload: { features: string[]; k: number; scale_features: boolean }): Promise<ClusterResponse> {
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

export async function runClassification(id: string, payload: Record<string, any>): Promise<ClassifyResponse> {
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

export async function runAssociation(id: string, payload: { min_support: number; min_confidence: number; min_lift: number }): Promise<AssociationResponse> {
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

export async function runAnomalyDetection(id: string, payload: { method: string; contamination: number; metric_column: string; segment_filter?: string }): Promise<AnomalyResponse> {
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

export async function fetchExperiments(datasetId?: string): Promise<ExperimentItem[]> {
  const url = datasetId ? `${API_BASE}/experiments?dataset_id=${datasetId}` : `${API_BASE}/experiments`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch experiments');
  return res.json();
}

export async function saveExperiment(payload: { dataset_id: string; name: string; task_type: string; parameters: any; metrics: any; results_summary: string }): Promise<ExperimentItem> {
  const res = await fetch(`${API_BASE}/experiments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to save experiment');
  return res.json();
}

export async function fetchReportSummary(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/reports/${id}/summary`);
  if (!res.ok) throw new Error('Failed to generate report summary');
  return res.json();
}
