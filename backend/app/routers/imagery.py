"""Imagery API router: handles POST /api/imagery/fetch to acquire Sentinel satellite imagery or fallback sample captures."""
from typing import Optional, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.services.sentinel_hub import fetch_sentinel_imagery

router = APIRouter()


class ImageryFetchRequest(BaseModel):
    lat: Optional[float] = Field(None, example=12.9716)
    lon: Optional[float] = Field(None, example=77.5946)
    bbox: Optional[List[float]] = Field(None, example=[77.590, 12.968, 77.600, 12.978])
    region_id: Optional[str] = Field(None, example="parcel_001")
    date_before: str = Field("2023-01-15", example="2023-01-15")
    date_after: str = Field("2024-02-20", example="2024-02-20")


@router.post("/fetch")
async def fetch_imagery_endpoint(request: ImageryFetchRequest):
    """Fetches high-resolution satellite imagery for specified coordinates or bounding box."""
    try:
        result = fetch_sentinel_imagery(
            lat=request.lat,
            lon=request.lon,
            bbox=request.bbox,
            region_id=request.region_id,
            date_before=request.date_before,
            date_after=request.date_after
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process imagery request: {str(e)}"
        )
