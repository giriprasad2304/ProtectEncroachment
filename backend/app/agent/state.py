"""Shared agent state schema for LangGraph workflow."""
from typing import Any, Dict, List, Optional, TypedDict


class AgentState(TypedDict, total=False):
    imagery_id: str
    region_id: Optional[str]
    boundary_geojson_id: Optional[str]
    boundary_geojson: Optional[Dict[str, Any]]
    bbox: Optional[List[float]]
    lat: Optional[float]
    lon: Optional[float]
    date_before: Optional[str]
    date_after: Optional[str]
    location_name: Optional[str]
    before_path: str
    after_path: str
    diff_path: str
    change_bbox: Optional[Dict[str, int]]
    change_area: float
    llm_description: str
    outside_percent: float
    severity: str
    flagged_region_geojson: Optional[Dict[str, Any]]
    report: Dict[str, Any]
    steps: List[Dict[str, Any]]
