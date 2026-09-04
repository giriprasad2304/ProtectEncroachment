# Bhoomi-Rakshak 🛡️🛰️

Bhoomi-Rakshak is an on-premise agentic AI system engineered for automated public land encroachment detection using multi-temporal satellite imagery, spatial boundary validation (Shapely/GeoJSON), and local LLM-powered visual interpretation (Ollama). Designed to run fully air-gapped on government infrastructure, the system features a LangGraph orchestration pipeline that ingests before/after imagery, detects physical footprint changes, validates land parcel ownership boundaries, determines incident severity, and automatically routes generated PDF reports to appropriate local authorities.

---

## 📁 Directory Structure

```
bhoomi-rakshak/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI app entrypoint
│   │   ├── config.py                  # env vars, settings
│   │   ├── db/
│   │   │   ├── database.py            # SQLite connection setup
│   │   │   └── models.py              # parcels, incidents table schemas
│   │   ├── routers/
│   │   │   ├── imagery.py             # /api/imagery/* endpoints
│   │   │   ├── agent.py               # /api/agent/* endpoints
│   │   │   ├── boundary.py            # /api/boundary/* endpoints
│   │   │   ├── report.py              # /api/report/* endpoints
│   │   │   └── feedback.py            # /api/feedback endpoint
│   │   ├── agent/
│   │   │   ├── graph.py               # LangGraph pipeline definition
│   │   │   ├── state.py               # shared agent state schema
│   │   │   └── nodes/
│   │   │       ├── preprocess.py      # image align + diff
│   │   │       ├── interpret.py       # LLM call via Ollama
│   │   │       ├── boundary_check.py  # Shapely containment check
│   │   │       ├── severity.py        # severity classification
│   │   │       └── report.py          # report assembly
│   │   ├── services/
│   │   │   ├── sentinel_hub.py        # live satellite fetch (Sentinel-2)
│   │   │   ├── pdf_generator.py       # PDF export (ReportLab)
│   │   │   └── ollama_client.py       # local LLM wrapper
│   │   └── schemas/
│   │       └── pydantic_models.py     # request/response schemas
│   ├── sample_data/
│   │   ├── before.png                 # baseline satellite capture
│   │   ├── after.png                  # current satellite capture
│   │   └── mock_boundary.geojson      # parcel geometry
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── store/
│   │   │   └── store.js               # Redux Toolkit store config
│   │   ├── features/
│   │   ├── components/
│   │   │   ├── ImageComparisonSlider.jsx
│   │   │   ├── BoundaryMap.jsx        # Leaflet GIS map
│   │   │   ├── AgentTrace.jsx         # Timeline progressive reveal
│   │   │   ├── ReportViewer.jsx       # Report & PDF download
│   │   │   └── ScanForm.jsx           # Lat/lon/date scanner form
│   │   └── pages/
│   │       └── Dashboard.jsx
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
│
├── docker-compose.yml
├── start.sh
└── README.md
```

---

## 🚀 One-Command Deployment

```bash
# Make startup script executable and launch the entire stack
chmod +x start.sh
./start.sh
```

`start.sh` automatically:
1. Builds and launches all Docker containers (`ollama`, `backend`, `frontend`).
2. Waits for Ollama service readiness.
3. Automatically pulls the `qwen2-vl` multimodal vision model into the Ollama container if not present.
4. Opens **Frontend Dashboard** at `http://localhost` and **FastAPI Swagger Docs** at `http://localhost:8000/docs`.

---

## ✈️ Air-Gapped & Offline Live Demonstration

Bhoomi-Rakshak is purpose-built for high-reliability, zero-internet government deployments:

1. **First-Time Provisioning (Online)**:
   * Run `./start.sh` while connected to the internet to download Docker base images, Python/Node packages, and pull the `qwen2-vl` vision model into Ollama container storage.

2. **Offline Stage Demo (100% Air-Gapped)**:
   * Once provisioned, **disable Wi-Fi / disconnect network cables**.
   * The complete stack (FastAPI Backend, LangGraph Agentic Pipeline, Local Ollama LLM Vision Inference, OpenCV Difference Heatmaps, Shapely GIS Boundary Checking, SQLite Storage, and React/Nginx Frontend) runs **100% locally on-device**.
   * If network connectivity is lost during live satellite fetching, the backend gracefully activates the high-resolution baseline sample satellite captures, ensuring an uninterrupted stage demonstration.
