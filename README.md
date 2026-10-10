# UrbanPulse — Urban Mobility Intelligence Platform

> **Discover the patterns shaping urban mobility.**  
> An explainable decision-support platform for urban planners, transportation researchers, and traffic engineers combining data mining, machine learning, and geospatial analytics.

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61DAFB.svg?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6.svg?logo=typescript)](https://www.typescriptlang.org)
[![Python](https://img.shields.io/badge/Language-Python_3.9+-3776AB.svg?logo=python)](https://www.python.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 1. Product Vision

UrbanPulse addresses the critical challenge of understanding macroscopic urban congestion, diurnal commute dynamics, and statistical traffic anomalies. Rather than presenting generic toy dashboards or fabricated simulations, UrbanPulse computes all metrics directly from empirical traffic observations using leak-free machine learning pipelines.

### Key Questions Answered
- **Where and when does recurrent congestion occur?** Diurnal (24-hour) hour-of-day vs. day-of-week recurrence matrices.
- **Which road corridors exhibit similar flow characteristics?** Unsupervised K-Means clustering and PCA 2D projections.
- **What historical conditions co-occur with severe bottlenecks?** Association rule discovery (Apriori algorithm via mlxtend).
- **Which observations deviate from normal diurnal patterns?** Isolation Forest and rolling baseline Z-score deviation monitoring.
- **How accurately can congestion severity be classified?** Interpretable Decision Trees, Gaussian Naive Bayes, OneR baseline, and rule lists.

---

## 2. System Architecture

```
Urbanpulse/
├── backend/
│   ├── app/
│   │   ├── api/routes/          # REST route handlers (datasets, analytics, ml, experiments, reports)
│   │   ├── algorithms/          # ML engines: K-Means, Decision Trees, Naive Bayes, Apriori, Isolation Forest
│   │   ├── core/                # Configuration and database connectivity
│   │   ├── data_processing/     # CSV & native ARFF loaders, schema profiling, imputation, scaling
│   │   ├── models/              # SQLAlchemy schema models (datasets, experiments)
│   │   ├── sample_data/         # Hyderabad arterial corridor benchmark (CSV and ARFF)
│   │   ├── schemas/             # Pydantic request & response validation schemas
│   │   ├── services/            # Analytics, dataset, and experiment orchestration services
│   │   └── main.py              # FastAPI application entrypoint
│   ├── tests/                   # Pytest test suite (14 automated unit & integration tests)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/          # Sidebar, TopNav, PageHeader
│   │   │   ├── common/          # MetricCard, Feedback skeletons, ErrorAlerts
│   │   │   └── maps/            # Leaflet interactive map with custom dark tiles & popups
│   │   ├── pages/
│   │   │   ├── Overview/        # Mobility Command Center
│   │   │   ├── Datasets/        # Data profiling, preview, and preprocessing pipeline
│   │   │   ├── PatternExplorer/ # 24h Diurnal recurrence heatmap & speed curves
│   │   │   ├── SegmentIntelligence/ # K-Means clustering & PCA 2D projections
│   │   │   ├── Classification/  # Model training, confusion matrix, tree decision rules
│   │   │   ├── AssociationRules/# Apriori rule discovery & export
│   │   │   ├── Anomalies/       # Isolation Forest & Z-score deviation monitor
│   │   │   ├── Experiments/     # Model tracking & hyperparameter lineage
│   │   │   ├── Reports/         # Executive synthesis report with Markdown/PDF print export
│   │   │   └── Provenance/      # Dataset origins, methodology & privacy statement
│   │   ├── services/            # Typed API client
│   │   ├── types/               # TypeScript domain interfaces
│   │   ├── App.css              # Custom dark geospatial design system (#0B1220 / #111C2E / #14B8A6)
│   │   └── main.tsx
│   ├── vite.config.ts
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 3. Technology Stack

### Backend
- **FastAPI**: Asynchronous high-performance REST API with automated OpenAPI specifications.
- **scikit-learn**: K-Means clustering, PCA decomposition, Decision Trees, Gaussian Naive Bayes, Isolation Forest, and cross-validation.
- **mlxtend**: Apriori association rule discovery engine with support, confidence, and lift calculation.
- **pandas & NumPy**: Vectorized data manipulation, continuous discretization, and array operations.
- **SQLAlchemy**: Relational metadata persistence with SQLite default and PostgreSQL production support.
- **pytest**: Automated testing suite covering loaders, preprocessors, algorithms, and endpoints.

### Frontend
- **React 18 & Vite**: Fast modular component tree with instant HMR.
- **TypeScript**: Strict compile-time typing for all analytical payloads and models.
- **React Router**: Client-side navigation across 10 analytical workspaces.
- **Leaflet & React-Leaflet**: Interactive geospatial map layers with color-coded corridor markers and popups.
- **Recharts**: Responsive SVG analytical visualizations (composed charts, line curves, scatter plots, pie distributions).
- **Lucide React**: Clean iconography.
- **Standard CSS**: Modular design tokens adhering to a dark navy (`#0B1220`), elevated slate (`#111C2E`), and teal (`#14B8A6`) aesthetic. *Tailwind CSS is explicitly avoided.*

---

## 4. Benchmark Dataset: Hyderabad Arterial Corridors

UrbanPulse includes a realistic benchmark dataset comprising **2,016 hourly observations** across **12 verified arterial corridors** in Hyderabad, India:

| Corridor ID | Name | Latitude | Longitude | Corridor Category |
|---|---|---|---|---|
| `HYD-COR-01` | HITEC City - Cyber Towers Junction | 17.4504 | 78.3808 | Tech Corridor |
| `HYD-COR-02` | Gachibowli - ORR Junction | 17.4401 | 78.3489 | Express Corridor |
| `HYD-COR-03` | Jubilee Hills - Checkpost | 17.4319 | 78.4073 | Arterial |
| `HYD-COR-04` | Banjara Hills - Road No. 12 | 17.4156 | 78.4350 | Commercial Avenue |
| `HYD-COR-05` | Panjagutta - Central Circle | 17.4260 | 78.4526 | Arterial |
| `HYD-COR-06` | Begumpet - Flyover Corridor | 17.4447 | 78.4664 | Arterial |
| `HYD-COR-07` | Secunderabad - Clock Tower | 17.4411 | 78.4983 | Urban Core |
| `HYD-COR-08` | Mehdipatnam - Rythu Bazar | 17.3916 | 78.4414 | Transit Hub |
| `HYD-COR-09` | Dilsukhnagar - Bus Depot Arterial | 17.3688 | 78.5247 | Commercial Avenue |
| `HYD-COR-10` | LB Nagar - Ring Road Junction | 17.3457 | 78.5522 | Ring Road |
| `HYD-COR-11` | Financial District - Wipro Circle | 17.4182 | 78.3418 | Tech Corridor |
| `HYD-COR-12` | Madhapur - 100ft Road | 17.4485 | 78.3908 | Commercial Avenue |

The benchmark is provided in both **CSV** and **ARFF** (Weka-compatible relation) formats under `backend/app/sample_data/`.

---

## 5. Quickstart & Local Setup

### Prerequisites
- Python 3.9+
- Node.js 18+ and npm

### 1. Start the Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8008 --reload
```
*The interactive OpenAPI documentation will be available at: `http://localhost:8008/docs`*

### 2. Run Backend Tests
```bash
cd backend
source venv/bin/activate
pytest -v
```

### 3. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
*Open `http://localhost:5173` (or the assigned Vite port) in your browser.*

---

## 6. Docker Deployment

Launch the complete containerized stack using Docker Compose:

```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8008`
- API Docs: `http://localhost:8008/docs`

---

## 7. REST API Endpoints

### Datasets
- `GET /api/datasets`: List all available datasets (including seeded demo datasets).
- `GET /api/datasets/{id}`: Retrieve detailed metadata and column profiling.
- `POST /api/datasets/upload`: Ingest new CSV or ARFF dataset.
- `GET /api/datasets/{id}/preview`: Paginated view of dataset records.
- `POST /api/datasets/{id}/preprocess`: Execute data cleaning, imputation, scaling, and outlier handling.

### Analytics & Geospatial
- `GET /api/analytics/{id}/overview`: System KPIs, hourly trends, weekday/weekend comparison, and priority bottlenecks.
- `GET /api/analytics/{id}/heatmap`: Hour-of-day vs day-of-week diurnal matrix.
- `GET /api/analytics/{id}/corridors`: Spatial corridor coordinates, measured speeds, volumes, and dominant states for map plotting.

### Machine Learning & Data Mining
- `POST /api/ml/{id}/clustering`: K-Means clustering, silhouette validation, PCA 2D projections.
- `POST /api/ml/{id}/classify`: Train Decision Tree, Naive Bayes, OneR, or Rule-based classifiers with confusion matrix and decision rules.
- `POST /api/ml/{id}/association`: mlxtend Apriori association rule discovery with support, confidence, and lift.
- `POST /api/ml/{id}/anomalies`: Isolation Forest and Z-score deviation monitoring with supporting evidence.

### Experiments & Reporting
- `GET /api/experiments`: List logged experiments.
- `POST /api/experiments`: Save experiment run configuration and metrics.
- `GET /api/reports/{id}/summary`: Comprehensive analytical report summary.
- `GET /api/reports/{id}/export-markdown`: Downloadable Markdown report.

---

## 8. Data Privacy & Governance

- **Zero PII**: UrbanPulse processes only macroscopic sensor velocities, vehicle counts, and road attributes. No individual license plate recognition (ALPR) or personal GPS tracks are ingested.
- **Local Sandbox Execution**: Uploaded datasets are stored in the local repository workspace and never transmitted to external cloud services.
- **Reproducible Science**: All metrics and rules are derived from real algorithmic execution without synthetic fabrication.
