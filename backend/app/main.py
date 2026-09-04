"""FastAPI app entrypoint for Bhoomi-Rakshak on-prem agentic AI system."""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.db.database import init_db
from app.routers import agent, boundary, report, feedback, imagery


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database and seed initial parcel data
    init_db()
    yield


app = FastAPI(
    title="Bhoomi-Rakshak API",
    description="On-prem agentic AI system for public land encroachment detection",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files directory to serve satellite imagery
sample_data_dir = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../sample_data")
)
os.makedirs(sample_data_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=sample_data_dir), name="static")

# Mount API routers
app.include_router(agent.router, prefix="/api/agent", tags=["agent"])
app.include_router(boundary.router, prefix="/api/boundary", tags=["boundary"])
app.include_router(report.router, prefix="/api/report", tags=["report"])
app.include_router(feedback.router, prefix="/api/feedback", tags=["feedback"])
app.include_router(imagery.router, prefix="/api/imagery", tags=["imagery"])


@app.get("/")
def read_root():
    return {
        "system": "Bhoomi-Rakshak",
        "status": "online",
        "description": "On-prem agentic AI system for land encroachment detection"
    }
