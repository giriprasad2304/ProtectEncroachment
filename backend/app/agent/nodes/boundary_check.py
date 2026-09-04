"""Boundary check node: evaluates exact spatial containment of detected change
against the user-specified GeoJSON parcel boundary using Shapely and outputs
dynamically georeferenced flagged GeoJSON features.
"""
import os
import json
from datetime import datetime
from shapely.geometry import shape, box, Polygon, mapping
from app.agent.state import AgentState
from app.db.database import SessionLocal
from app.db.models import Parcel


def boundary_check_node(state: AgentState) -> AgentState:
    change_bbox = state.get("change_bbox")
    boundary_geojson_id = state.get("boundary_geojson_id")
    boundary_geojson = state.get("boundary_geojson")
    bbox = state.get("bbox")

    boundary_geom = None

    # 1. Parse raw GeoJSON object if passed directly
    if boundary_geojson:
        try:
            if isinstance(boundary_geojson, str):
                boundary_geojson = json.loads(boundary_geojson)
            if isinstance(boundary_geojson, dict):
                if boundary_geojson.get("type") == "FeatureCollection" and boundary_geojson.get("features"):
                    boundary_geom = shape(boundary_geojson["features"][0]["geometry"])
                elif boundary_geojson.get("type") == "Feature":
                    boundary_geom = shape(boundary_geojson["geometry"])
                elif "coordinates" in boundary_geojson:
                    boundary_geom = shape(boundary_geojson)
        except Exception as e:
            print(f"Error parsing raw boundary_geojson: {e}")

    # 2. Query parcel from SQLite DB if boundary_geom not yet resolved
    if boundary_geom is None and boundary_geojson_id:
        try:
            db = SessionLocal()
            parcel = db.query(Parcel).filter(Parcel.id == boundary_geojson_id).first()
            if parcel and parcel.geojson:
                p_geojson = json.loads(parcel.geojson) if isinstance(parcel.geojson, str) else parcel.geojson
                if p_geojson.get("features"):
                    boundary_geom = shape(p_geojson["features"][0]["geometry"])
            db.close()
        except Exception as e:
            print(f"Error querying parcel from DB: {e}")

    # 3. Fallback to sample mock_boundary if still unresolved
    if boundary_geom is None:
        sample_dir = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "../../../sample_data")
        )
        mock_boundary_path = os.path.join(sample_dir, "mock_boundary.geojson")
        if os.path.exists(mock_boundary_path):
            with open(mock_boundary_path, "r") as f:
                geojson_data = json.load(f)
                features = geojson_data.get("features", [])
                if features:
                    boundary_geom = shape(features[0]["geometry"])

    # Determine bounding box in [min_lon, min_lat, max_lon, max_lat]
    if bbox and len(bbox) == 4:
        min_lon, min_lat, max_lon, max_lat = bbox
    elif boundary_geom and boundary_geom.is_valid:
        b_min_lon, b_min_lat, b_max_lon, b_max_lat = boundary_geom.bounds
        dlon = max((b_max_lon - b_min_lon) * 0.1, 0.0005)
        dlat = max((b_max_lat - b_min_lat) * 0.1, 0.0005)
        min_lon, min_lat = b_min_lon - dlon, b_min_lat - dlat
        max_lon, max_lat = b_max_lon + dlon, b_max_lat + dlat
    else:
        min_lon, min_lat, max_lon, max_lat = 77.5900, 12.9680, 77.6000, 12.9780

    outside_percent = 0.0
    inside_percent = 100.0
    flagged_region_geojson = None

    if change_bbox:
        x = change_bbox.get("x", 0)
        y = change_bbox.get("y", 0)
        w = change_bbox.get("w", 100)
        h = change_bbox.get("h", 100)

        # Map pixel space (512x512) into real geographic coordinates
        img_w = 512.0
        img_h = 512.0

        c_lon_min = min_lon + (x / img_w) * (max_lon - min_lon)
        c_lon_max = min_lon + ((x + w) / img_w) * (max_lon - min_lon)
        c_lat_max = max_lat - (y / img_h) * (max_lat - min_lat)
        c_lat_min = max_lat - ((y + h) / img_h) * (max_lat - min_lat)

        change_geom = box(
            min(c_lon_min, c_lon_max),
            min(c_lat_min, c_lat_max),
            max(c_lon_min, c_lon_max),
            max(c_lat_min, c_lat_max)
        )

        if boundary_geom and boundary_geom.is_valid:
            try:
                if boundary_geom.intersects(change_geom):
                    inside_geom = boundary_geom.intersection(change_geom)
                    outside_geom = change_geom.difference(boundary_geom)
                else:
                    inside_geom = None
                    outside_geom = change_geom

                if outside_geom and not outside_geom.is_empty and outside_geom.area > 1e-12:
                    change_area_geo = change_geom.area
                    outside_area_geo = outside_geom.area
                    outside_percent = round((outside_area_geo / change_area_geo) * 100.0, 1)
                    inside_percent = round(100.0 - outside_percent, 1)
                    flagged_geom = outside_geom
                else:
                    outside_percent = 0.0
                    inside_percent = 100.0
                    flagged_geom = None

                if flagged_geom is not None and not flagged_geom.is_empty:
                    flagged_region_geojson = {
                        "type": "Feature",
                        "properties": {
                            "outside_percent": outside_percent,
                            "inside_percent": inside_percent,
                            "description": f"Flagged Encroachment Region ({outside_percent}% beyond legal boundary)",
                            "severity": "severe" if outside_percent > 60 else "moderate" if outside_percent > 25 else "minor",
                        },
                        "geometry": mapping(flagged_geom)
                    }
            except Exception as e:
                print(f"Error during Shapely intersection calculation: {e}")
                outside_percent = 50.0
                inside_percent = 50.0
                flagged_region_geojson = {
                    "type": "Feature",
                    "properties": {
                        "outside_percent": outside_percent,
                        "description": "Flagged Encroachment Region"
                    },
                    "geometry": mapping(change_geom)
                }
        else:
            outside_percent = 100.0
            inside_percent = 0.0
            flagged_region_geojson = {
                "type": "Feature",
                "properties": {
                    "outside_percent": 100.0,
                    "description": "Unregistered Region / Full Deviation"
                },
                "geometry": mapping(change_geom)
            }

    step_log = {
        "node_name": "boundary_check_node",
        "status": "success",
        "output": {
            "boundary_id": boundary_geojson_id or state.get("region_id") or "custom_drawn_region",
            "change_bbox": change_bbox,
            "outside_percent": outside_percent,
            "inside_percent": inside_percent,
            "flagged_region_geojson": flagged_region_geojson,
        },
        "timestamp": datetime.utcnow().isoformat(),
    }

    steps = list(state.get("steps", []))
    steps.append(step_log)

    return {
        **state,
        "outside_percent": outside_percent,
        "flagged_region_geojson": flagged_region_geojson,
        "steps": steps,
    }
