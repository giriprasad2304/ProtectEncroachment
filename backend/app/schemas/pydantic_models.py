"""Pydantic schemas for API requests, responses, and agent state logging."""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AgentRunRequest(BaseModel):
    imagery_id: Optional[str] = Field("img_001", example="img_001")
    region_id: Optional[str] = Field(None, example="parcel_001")
    boundary_geojson_id: Optional[str] = Field(None, example="parcel_001")
    boundary_geojson: Optional[Dict[str, Any]] = None  # raw GeoJSON polygon or FeatureCollection
    bbox: Optional[List[float]] = None  # [minLon, minLat, maxLon, maxLat]
    lat: Optional[float] = Field(None, example=12.9716)
    lon: Optional[float] = Field(None, example=77.5946)
    date_before: Optional[str] = Field("2023-01-15", example="2023-01-15")
    date_after: Optional[str] = Field("2024-02-20", example="2024-02-20")


class StepLog(BaseModel):
    node_name: str
    status: str
    output: Any
    timestamp: str


class Report(BaseModel):
    incident_id: Optional[str] = None
    location: str
    timestamp: str
    violation_detected: bool
    severity: str  # "none" | "minor" | "moderate" | "severe"
    overlap_percent: float
    llm_description: str
    is_false_positive: Optional[bool] = False


class AgentRunResponse(BaseModel):
    steps: List[StepLog]
    report: Report
