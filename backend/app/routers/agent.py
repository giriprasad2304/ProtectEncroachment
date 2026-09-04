"""Agent API router: exposes POST /api/agent/run endpoint to execute the LangGraph encroachment analysis graph."""
from fastapi import APIRouter, HTTPException
from app.schemas.pydantic_models import AgentRunRequest, AgentRunResponse
from app.agent.graph import agent_graph
from app.services.sentinel_hub import fetch_sentinel_imagery

router = APIRouter()


@router.post("/run", response_model=AgentRunResponse)
async def run_agent_pipeline(request: AgentRunRequest):
    """Executes the complete agentic pipeline (preprocess -> interpret -> boundary check -> severity -> report)."""
    # Synchronize satellite imagery for coordinates or bbox
    imagery_result = {}
    if request.bbox is not None or (request.lat is not None and request.lon is not None) or request.region_id is not None:
        try:
            imagery_result = fetch_sentinel_imagery(
                lat=request.lat,
                lon=request.lon,
                bbox=request.bbox,
                region_id=request.region_id,
                date_before=request.date_before or "2023-01-15",
                date_after=request.date_after or "2024-02-20"
            )
        except Exception as e:
            print(f"Warning: imagery fetch during agent run failed: {e}")

    initial_state = {
        "imagery_id": request.imagery_id or "img_001",
        "region_id": request.region_id,
        "boundary_geojson_id": request.boundary_geojson_id,
        "boundary_geojson": request.boundary_geojson,
        "bbox": request.bbox or imagery_result.get("bbox"),
        "lat": request.lat,
        "lon": request.lon,
        "date_before": request.date_before or "2023-01-15",
        "date_after": request.date_after or "2024-02-20",
        "before_path": imagery_result.get("before_path"),
        "after_path": imagery_result.get("after_path"),
        "diff_path": imagery_result.get("diff_path"),
        "steps": []
    }

    try:
        final_state = agent_graph.invoke(initial_state)
        
        return AgentRunResponse(
            steps=final_state.get("steps", []),
            report=final_state.get("report", {})
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Agent execution failed: {str(e)}"
        )
