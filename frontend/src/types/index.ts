export interface ColumnMeta {
  name: string;
  inferred_type: string;
  missing_count: number;
  missing_pct: number;
  unique_count: number;
  sample_values: any[];
  min_val?: number | null;
  max_val?: number | null;
  mean_val?: number | null;
  std_val?: number | null;
}

export interface Dataset {
  id: string;
  name: string;
  description?: string;
  filename: string;
  file_format: string;
  row_count: number;
  column_count: number;
  columns: ColumnMeta[];
  is_demo: boolean;
  created_at: string;
  provenance?: {
    city?: string;
    corridors_count?: number;
    coverage?: string;
    time_span?: string;
    source?: string;
    license?: string;
    notes?: string;
    [key: string]: any;
  };
}

export interface DatasetPreview {
  id: string;
  name: string;
  total_rows: number;
  total_columns: number;
  columns: string[];
  rows: Record<string, any>[];
  page: number;
  page_size: number;
}

export interface PreprocessResult {
  original_rows: number;
  processed_rows: number;
  original_cols: number;
  processed_cols: number;
  transformations_applied: string[];
  sample_preview: Record<string, any>[];
  columns: string[];
}

export interface HourlyTrendItem {
  hour: number;
  avg_speed: number;
  avg_volume: number;
  congestion_index: number;
}

export interface DayComparisonItem {
  day_type: string;
  avg_speed: number;
  avg_volume: number;
  severe_congestion_pct: number;
}

export interface PrioritySegmentItem {
  segment_id: string;
  segment_name: string;
  latitude?: number | null;
  longitude?: number | null;
  avg_speed: number;
  avg_volume: number;
  congestion_rate: number;
  dominant_congestion: string;
  risk_score: number;
}

export interface OverviewMetrics {
  total_observations: number;
  unique_segments: number;
  date_start?: string | null;
  date_end?: string | null;
  completeness_pct: number;
  avg_speed_kmh?: number | null;
  avg_vehicle_volume?: number | null;
  congestion_breakdown: Record<string, number>;
  hourly_trend: HourlyTrendItem[];
  weekday_vs_weekend: DayComparisonItem[];
  top_priority_corridors: PrioritySegmentItem[];
}

export interface HeatmapCell {
  day: string;
  day_idx: number;
  hour: number;
  avg_speed: number;
  avg_volume: number;
  congestion_score: number;
}

export interface HeatmapResponse {
  metric: string;
  cells: HeatmapCell[];
}

export interface CorridorGeoItem {
  segment_id: string;
  segment_name: string;
  latitude: number;
  longitude: number;
  road_type?: string;
  avg_speed: number;
  avg_volume: number;
  dominant_congestion: string;
  observation_count: number;
}

export interface ClusterProfile {
  cluster_id: number;
  cluster_label: string;
  member_count: number;
  member_percentage: number;
  feature_means: Record<string, number>;
  description: string;
}

export interface ClusterPcaPoint {
  id: number;
  x: number;
  y: number;
  cluster: number;
  segment_name: string;
  avg_speed: number;
  avg_volume: number;
}

export interface ClusterResponse {
  k: number;
  silhouette_score: number;
  inertia: number;
  features_used: string[];
  cluster_profiles: ClusterProfile[];
  pca_projections: ClusterPcaPoint[];
  feature_importance_pca: Record<string, number>;
}

export interface ClassMetrics {
  precision: number;
  recall: number;
  f1_score: number;
  support: number;
}

export interface ClassifyResponse {
  model_type: string;
  model_name: string;
  accuracy: number;
  macro_f1: number;
  weighted_f1: number;
  classes: string[];
  confusion_matrix: number[][];
  per_class: Record<string, ClassMetrics>;
  feature_importance?: Record<string, number> | null;
  decision_rules?: string[] | null;
  cv_mean_accuracy?: number | null;
  cv_std?: number | null;
  total_train_samples: number;
  total_test_samples: number;
}

export interface AssociationRuleItem {
  antecedents: string[];
  consequents: string[];
  support: number;
  confidence: number;
  lift: number;
  conviction: number;
  human_explanation: string;
}

export interface AssociationResponse {
  total_rules_found: number;
  min_support_used: number;
  min_confidence_used: number;
  rules: AssociationRuleItem[];
}

export interface AnomalyItem {
  index: number;
  timestamp: string;
  segment_id: string;
  segment_name: string;
  observed_value: number;
  baseline_value: number;
  deviation_pct: number;
  anomaly_score: number;
  severity: "Moderate" | "High" | "Critical";
  supporting_evidence: string;
}

export interface AnomalyResponse {
  method_used: string;
  metric_analyzed: string;
  total_records: number;
  anomalies_count: number;
  anomaly_rate_pct: number;
  anomalies: AnomalyItem[];
}

export interface ExperimentItem {
  id: string;
  dataset_id: string;
  name: string;
  task_type: string;
  parameters: Record<string, any>;
  metrics: Record<string, any>;
  results_summary: string;
  created_at: string;
}
