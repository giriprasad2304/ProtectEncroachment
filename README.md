# Bhoomi-Rakshak 🛡️🛰️

**Autonomous On-Premise GeoAI Encroachment Forensics & Public Land Protection System**

Bhoomi-Rakshak is an enterprise-grade, air-gapped GeoAI platform engineered for automated public land encroachment detection. It combines multi-temporal high-resolution satellite imagery, real-time geometric boundary containment validation (Shapely / GeoJSON), OpenCV difference heatmapping, and local multimodal LLM visual interpretation (Ollama `qwen2-vl`).

Designed to run 100% on-premise on government infrastructure with zero cloud dependency, the system features an autonomous LangGraph agent pipeline that ingests satellite captures, extracts physical change footprints, calculates exact geospatial overlap against authorized parcels, classifies violation severity, and generates forensic PDF audit dossiers routed to local revenue and forest authorities.

---

## 🌟 Key Features

### 1. Interactive Multi-Region GIS Mapping & Drawing
- **High-Contrast Cartographic Layers**: Toggle between **CartoDB Dark Matter**, **CartoDB Positron**, and **Esri World Imagery** basemaps.
- **Interactive Boundary Drawing**: Draw, edit vertices, calculate area in $m^2$ and hectares in real-time, and persist custom legal boundaries.
- **Multi-Region Selection & Management**: Manage multiple parcels simultaneously with status indicators (Clear, Flagged Encroachment, Draft) and inline renaming.
- **Georeferenced Popups & Legends**: Inspect parcel dimensions, authority jurisdiction, coordinates, and exact overlap percentages directly on the Leaflet map.

### 2. Dynamic High-Resolution Satellite Tile Acquisition
- **Global Satellite Fetcher**: Integrates live Sentinel-2 API and high-resolution ESRI World Imagery XYZ tile stitching for **any** coordinates or bounding box worldwide.
- **Multi-Temporal Change Synthesis**: Generates localized multi-temporal captures (`before`, `after`, and OpenCV difference heatmap overlay) with cache-busting per region.

### 3. Precision Spatial Containment & Encroachment Engine
- **Shapely Spatial Analysis**: Converts pixel-space change contours to geographic CRS coordinates and performs exact geometric difference:
  $$\text{Encroachment Polygon} = \text{Detected Change} \setminus \text{Legal Boundary}$$
  $$\text{Overlap Percent} = \left(\frac{\text{Area}(\text{Encroachment})}{\text{Area}(\text{Detected Change})}\right) \times 100$$
- **Dynamic GeoJSON Rendering**: Renders the exact geographic violation polygon on the map with severity styling (Minor, Moderate, Severe).

### 4. On-Premise Vision AI & Agentic Trace Pipeline
- **Autonomous LangGraph Workflow**: Ingests satellite captures and processes through `preprocess` $\rightarrow$ `interpret` $\rightarrow$ `boundary_check` $\rightarrow$ `severity` $\rightarrow$ `report` nodes.
- **Local Multimodal LLM (Ollama `qwen2-vl`)**: Performs visual inspection of ground excavation, soil clearing, and structural footprints without sending data to external APIs.
- **Interactive Step Timeline**: Collapsible execution trace with expandable node outputs and LLM explanations.

### 5. Forensic Audit Dossier Generation
- **Automated PDF Export**: Produces official government audit dossiers with timestamps, parcel metadata, severity badges, and geospatial coordinate tables via ReportLab.
- **False Positive Feedback Loop**: Allows authorized officers to mark false alarms and train the system iteratively.

---

## 📁 Project Directory Structure

```
bhoomi-rakshak/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                     # FastAPI application entrypoint & static mounts
│   │   ├── config.py                   # Environment configuration
│   │   ├── db/
│   │   │   ├── database.py             # SQLite engine setup & init
│   │   │   └── models.py               # SQLAlchemy models (Parcels, Incidents, Feedback)
│   │   ├── routers/
│   │   │   ├── imagery.py              # POST /api/imagery/fetch endpoint
│   │   │   ├── agent.py                # POST /api/agent/run LangGraph executor
│   │   │   ├── boundary.py             # GET / POST /api/boundary/* endpoints
│   │   │   ├── report.py               # GET /api/report/* & PDF download endpoints
│   │   │   └── feedback.py             # POST /api/feedback false positive endpoint
│   │   ├── agent/
│   │   │   ├── graph.py                # LangGraph state graph definition
│   │   │   ├── state.py                # AgentState schema (TypedDict)
│   │   │   └── nodes/
│   │   │       ├── preprocess.py       # OpenCV difference, Gaussian blur, contour bbox
│   │   │       ├── interpret.py        # Ollama multimodal LLM vision inspection
│   │   │       ├── boundary_check.py   # Shapely geometric intersection & GeoJSON mapper
│   │   │       ├── severity.py         # Severity classifier (none, minor, moderate, severe)
│   │   │       └── report.py           # Incident assembly & database persistence
│   │   ├── services/
│   │   │   ├── sentinel_hub.py         # Dynamic satellite tile stitcher & synthesis engine
│   │   │   ├── pdf_generator.py        # ReportLab PDF dossier generator
│   │   │   └── ollama_client.py        # Local Ollama wrapper
│   │   └── schemas/
│   │       └── pydantic_models.py      # Request / Response schemas & validation
│   ├── sample_data/
│   │   ├── before.png                  # Baseline satellite capture
│   │   ├── after.png                   # Current satellite capture
│   │   ├── diff_overlay.png            # Difference heatmap overlay
│   │   ├── mock_boundary.geojson       # Default mock boundary
│   │   └── imagery/                    # Dynamically fetched per-region satellite imagery
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx                    # React entrypoint & Redux Provider
│   │   ├── App.jsx                     # Top-level application layout
│   │   ├── pages/
│   │   │   └── Dashboard.jsx           # Main forensic dashboard & workspace grid
│   │   ├── components/
│   │   │   ├── BoundaryMap.jsx         # Leaflet GIS map (CartoDB Dark/Positron/Esri layers)
│   │   │   ├── BoundaryToolbar.jsx     # Polygon drawing, vertex counter & save modal
│   │   │   ├── RegionListPanel.jsx     # Monitored region side panel & status badges
│   │   │   ├── ImageComparisonSlider.jsx # Multi-temporal before/after slider & heatmap toggle
│   │   │   ├── ScanForm.jsx            # Scan scope selector, date ranges & trigger button
│   │   │   ├── AgentTrace.jsx          # Collapsible LangGraph execution timeline
│   │   │   ├── ReportViewer.jsx        # Incident summary, severity badges & PDF downloader
│   │   │   ├── ToastContainer.jsx      # Animated floating notifications
│   │   │   └── DevStateViewer.jsx      # Live Redux state inspector
│   │   ├── features/
│   │   │   ├── boundary/               # Boundary slice & async thunks
│   │   │   ├── imagery/                # Satellite imagery slice & fetch thunks
│   │   │   ├── agent/                  # Agent state & step reveal actions
│   │   │   ├── report/                 # Report slice & feedback actions
│   │   │   └── ui/                     # UI slice (demo mode, dev mode, toasts)
│   │   ├── store/
│   │   │   └── store.js                # Centralized Redux Toolkit store
│   │   ├── styles/
│   │   │   ├── index.css               # Design tokens, base resets & animations
│   │   │   └── tokens.js               # Central design token constants
│   │   └── utils/
│   │       └── geoUtils.js             # Turf.js area, bbox, centroid calculations
│   ├── package.json
│   ├── vite.config.js
│   ├── nginx.conf                      # Optimized reverse proxy configuration
│   └── Dockerfile
│
├── docker-compose.yml                  # Multi-container orchestration (Ollama + Backend + Frontend)
├── start.sh                            # One-command automated startup script
├── DEPLOYMENT.md                       # Comprehensive cloud & on-premise deployment guide
└── README.md
```

---

## 🚀 Quickstart & One-Command Launch

### Method 1: Automated Script (Recommended)
```bash
# Clone the repository
git clone https://github.com/giriprasad2304/ProtectEncroachment.git bhoomi-rakshak
cd bhoomi-rakshak

# Make executable and launch
chmod +x start.sh
./start.sh
```

`start.sh` automatically:
1. Builds and starts all 3 Docker containers (`bhoomi_frontend`, `bhoomi_backend`, `bhoomi_ollama`).
2. Waits for Ollama service readiness.
3. Automatically pulls the `qwen2-vl` vision model into container storage if not already present.
4. Launches the **Frontend Dashboard** on `http://localhost` and **Swagger API Docs** on `http://localhost:8000/docs`.

### Method 2: Standard Docker Compose
```bash
docker compose up -d --build
```

---

## 🌐 Endpoints & Ports

| Service | Host Port | URL | Description |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | `80` | `http://localhost` | Interactive GIS Dashboard & Dossier UI |
| **FastAPI REST API** | `8000` | `http://localhost:8000` | LangGraph Agent, Spatial Checks, Reports |
| **Interactive Docs** | `8000` | `http://localhost:8000/docs` | Swagger / OpenAPI Explorer |
| **Ollama Inference** | `11434` | `http://localhost:11434` | Local Multimodal LLM Engine |

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/imagery/fetch` | Fetches satellite tiles for given lat/lon or bbox and generates multi-temporal captures. |
| `POST` | `/api/agent/run` | Executes the complete LangGraph encroachment detection graph. |
| `GET` | `/api/boundary/list` | Returns all registered legal boundary parcels from SQLite database. |
| `GET` | `/api/boundary/{id}` | Returns GeoJSON feature collection for a specific parcel. |
| `POST` | `/api/boundary/save` | Registers and persists a newly drawn custom polygon boundary. |
| `GET` | `/api/report/{id}` | Retrieves the incident report and audit details. |
| `GET` | `/api/report/{id}/pdf` | Generates and downloads the official forensic PDF dossier. |
| `POST` | `/api/feedback` | Flags an incident as a verified false positive. |

---

## ✈️ Air-Gapped & Offline Government Operation

Bhoomi-Rakshak is purpose-built for air-gapped government servers with **zero internet access**:
- Once provisioned with `./start.sh`, the entire system (FastAPI backend, LangGraph state engine, Ollama LLM, OpenCV image processing, Shapely spatial validation, SQLite database, and React/Nginx frontend) runs **100% locally on-device**.
- For detailed instructions on exporting Docker bundles to USB drives for air-gapped server installation, see [**`DEPLOYMENT.md`**](file:///Users/giriprasad/Desktop/SIH/bhoomi-rakshak/DEPLOYMENT.md).

---

## 📖 Deployment Documentation

For production cloud VPS deployment (AWS EC2, GCP, Azure, DigitalOcean), domain & SSL setup with Certbot, and managed cloud platforms, refer to the full [**Deployment Guide (`DEPLOYMENT.md`)**](file:///Users/giriprasad/Desktop/SIH/bhoomi-rakshak/DEPLOYMENT.md).

---

## 🛡️ License & Acknowledgments

Built for the **Smart India Hackathon (SIH)** — empowering public land administration, revenue departments, and forestry divisions with trustworthy, sovereign GeoAI technology.
