"""Boundary API router: handles parcel boundary lookup, listing, and custom GeoJSON persistence."""
import json
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.database import get_db, init_db
from app.db.models import Parcel

router = APIRouter()


class CustomParcelRequest(BaseModel):
    id: str
    name: str
    land_type: str
    authority: str
    coordinates: list  # [[lon, lat], [lon, lat], ...]


@router.get("/list")
async def list_parcels(db: Session = Depends(get_db)):
    """Returns a list of all available registered land parcels."""
    init_db()
    parcels = db.query(Parcel).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "land_type": p.land_type,
            "authority": p.authority
        }
        for p in parcels
    ]


@router.post("/save")
async def save_custom_parcel(payload: CustomParcelRequest, db: Session = Depends(get_db)):
    """Saves or updates a custom land parcel boundary GeoJSON."""
    init_db()
    
    geojson_obj = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "parcel_id": payload.id,
                    "name": payload.name,
                    "authority": payload.authority
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [payload.coordinates]
                }
            }
        ]
    }
    
    existing = db.query(Parcel).filter(Parcel.id == payload.id).first()
    if existing:
        existing.name = payload.name
        existing.land_type = payload.land_type
        existing.authority = payload.authority
        existing.geojson = json.dumps(geojson_obj)
    else:
        db.add(Parcel(
            id=payload.id,
            name=payload.name,
            land_type=payload.land_type,
            authority=payload.authority,
            geojson=json.dumps(geojson_obj)
        ))
    db.commit()
    
    return {
        "status": "success",
        "message": f"Parcel '{payload.name}' ({payload.id}) boundary successfully saved.",
        "parcel": {
            "id": payload.id,
            "name": payload.name,
            "land_type": payload.land_type,
            "authority": payload.authority,
            "geojson": geojson_obj
        }
    }


@router.get("/{parcel_id}")
async def get_parcel_boundary(parcel_id: str, db: Session = Depends(get_db)):
    """Fetches GeoJSON polygon and metadata for a specific land parcel."""
    init_db()
    parcel = db.query(Parcel).filter(Parcel.id == parcel_id).first()
    
    if not parcel:
        raise HTTPException(status_code=404, detail=f"Parcel with ID '{parcel_id}' not found.")

    geojson_obj = json.loads(parcel.geojson) if isinstance(parcel.geojson, str) else parcel.geojson

    return {
        "id": parcel.id,
        "name": parcel.name,
        "land_type": parcel.land_type,
        "authority": parcel.authority,
        "geojson": geojson_obj
    }
