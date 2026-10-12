import {
  Dataset, DatasetPreview, PreprocessResult,
  OverviewMetrics, HeatmapResponse, CorridorGeoItem,
  ClusterResponse, ClassifyResponse, AssociationResponse,
  AnomalyResponse, ExperimentItem
} from '../types';

export function getApiBase(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('urbanpulse_custom_api_base');
    if (custom) return custom.endsWith('/') ? custom.slice(0, -1) : custom;
  }
  const rawBase = (import.meta.env.VITE_API_BASE_URL as string) || '';
  if (rawBase) return rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;
  return '/api';
}

export function setCustomApiBase(url: string) {
  let cleaned = url.trim();
  if (cleaned && !cleaned.startsWith('http://') && !cleaned.startsWith('https://') && !cleaned.startsWith('/')) {
    cleaned = 'https://' + cleaned;
  }
  if (cleaned && !cleaned.endsWith('/api') && !cleaned.includes('/api/')) {
    cleaned = cleaned.endsWith('/') ? `${cleaned}api` : `${cleaned}/api`;
  }
  if (cleaned) {
    localStorage.setItem('urbanpulse_custom_api_base', cleaned);
  } else {
    localStorage.removeItem('urbanpulse_custom_api_base');
  }
}

export const API_BASE = getApiBase();

async function safeJsonFetch<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const base = getApiBase();
  const url = endpoint.startsWith('http') ? endpoint : `${base}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  const res = await fetch(url, init);
  const contentType = res.headers.get('content-type') || '';
  
  if (contentType.includes('text/html')) {
    throw new Error(
      `BACKEND_NOT_CONFIGURED: Received HTML response from "${url}". The frontend cannot reach the backend API.`
    );
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP error ${res.status}` }));
    throw new Error(err.detail || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export async function fetchDatasets(): Promise<Dataset[]> {
  return safeJsonFetch<Dataset[]>('/datasets');
}

export async function fetchDataset(id: string): Promise<Dataset> {
  return safeJsonFetch<Dataset>(`/datasets/${id}`);
}

export async function uploadDataset(file: File): Promise<Dataset> {
  const formData = new FormData();
  formData.append('file', file);
  return safeJsonFetch<Dataset>('/datasets/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function deleteDataset(id: string): Promise<void> {
  const base = getApiBase();
  const res = await fetch(`${base}/datasets/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to delete dataset' }));
    throw new Error(err.detail || 'Failed to delete dataset');
  }
}

export async function fetchDatasetPreview(id: string, page = 1, pageSize = 25): Promise<DatasetPreview> {
  return safeJsonFetch<DatasetPreview>(`/datasets/${id}/preview?page=${page}&page_size=${pageSize}`);
}

export async function preprocessDataset(id: string, options: Record<string, any>): Promise<PreprocessResult> {
  return safeJsonFetch<PreprocessResult>(`/datasets/${id}/preprocess`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });
}

export async function fetchOverview(id: string): Promise<OverviewMetrics> {
  return safeJsonFetch<OverviewMetrics>(`/analytics/${id}/overview`);
}

export async function fetchHeatmap(id: string, metric = 'avg_speed_kmh'): Promise<HeatmapResponse> {
  return safeJsonFetch<HeatmapResponse>(`/analytics/${id}/heatmap?metric=${metric}`);
}

export async function fetchCorridorsGeo(id: string): Promise<CorridorGeoItem[]> {
  return safeJsonFetch<CorridorGeoItem[]>(`/analytics/${id}/corridors`);
}

export async function runClustering(id: string, payload: { features: string[]; k: number; scale_features: boolean }): Promise<ClusterResponse> {
  return safeJsonFetch<ClusterResponse>(`/ml/${id}/clustering`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function runClassification(id: string, payload: Record<string, any>): Promise<ClassifyResponse> {
  return safeJsonFetch<ClassifyResponse>(`/ml/${id}/classify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function runAssociation(id: string, payload: { min_support: number; min_confidence: number; min_lift: number }): Promise<AssociationResponse> {
  return safeJsonFetch<AssociationResponse>(`/ml/${id}/association`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function runAnomalyDetection(id: string, payload: { method: string; contamination: number; metric_column: string; segment_filter?: string }): Promise<AnomalyResponse> {
  return safeJsonFetch<AnomalyResponse>(`/ml/${id}/anomalies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function fetchExperiments(datasetId?: string): Promise<ExperimentItem[]> {
  const path = datasetId ? `/experiments?dataset_id=${datasetId}` : '/experiments';
  return safeJsonFetch<ExperimentItem[]>(path);
}

export async function saveExperiment(payload: { dataset_id: string; name: string; task_type: string; parameters: any; metrics: any; results_summary: string }): Promise<ExperimentItem> {
  return safeJsonFetch<ExperimentItem>('/experiments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function fetchReportSummary(id: string): Promise<any> {
  return safeJsonFetch<any>(`/reports/${id}/summary`);
}
