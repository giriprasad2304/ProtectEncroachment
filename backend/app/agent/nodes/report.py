"""Report assembly node: constructs final JSON incident report with dynamic geographic
metadata and persists record in SQLite database.
"""
import json
import uuid
from datetime import datetime
from app.agent.state import AgentState
from app.db.database import SessionLocal, init_db
from app.db.models import Incident, Parcel


def report_node(state: AgentState) -> AgentState:
    init_db()

    boundary_id = state.get("boundary_geojson_id") or state.get("region_id") or "custom_region"
    outside_percent = state.get("outside_percent", 0.0)
    severity = state.get("severity", "none")
    llm_description = state.get("llm_description", "")
    lat = state.get("lat")
    lon = state.get("lon")
    boundary_geojson = state.get("boundary_geojson")

    violation_detected = severity in ["minor", "moderate", "severe"]
    timestamp = datetime.utcnow().isoformat()
    incident_id = str(uuid.uuid4())

    location_name = None

    # 1. Try DB lookup
    if state.get("boundary_geojson_id"):
        db = SessionLocal()
        try:
            parcel = db.query(Parcel).filter(Parcel.id == state["boundary_geojson_id"]).first()
            if parcel:
                location_name = f"{parcel.name} ({parcel.authority})"
        except Exception:
            pass
        finally:
            db.close()

    # 2. Try GeoJSON properties
    if not location_name and isinstance(boundary_geojson, dict):
        props = boundary_geojson.get("properties") or (
            boundary_geojson.get("features", [{}])[0].get("properties") if boundary_geojson.get("features") else {}
        )
        if props and props.get("name"):
            authority = props.get("authority", "Local Authority")
            location_name = f"{props['name']} ({authority})"

    # 3. Fallback to coordinates
    if not location_name:
        if lat is not None and lon is not None:
            location_name = f"Monitored Parcel (Lat: {lat:.4f}, Lon: {lon:.4f})"
        else:
            location_name = f"Monitored Boundary ({boundary_id})"

    report = {
        "incident_id": incident_id,
        "boundary_id": boundary_id,
        "location": location_name,
        "timestamp": timestamp,
        "violation_detected": violation_detected,
        "severity": severity,
        "overlap_percent": outside_percent,
        "llm_description": llm_description
    }

    # Save incident record to SQLite
    db = SessionLocal()
    try:
        incident_record = Incident(
            id=incident_id,
            parcel_id=boundary_id,
            report_json=json.dumps(report),
            is_false_positive=False,
            created_at=datetime.utcnow()
        )
        db.add(incident_record)
        db.commit()
    except Exception as e:
        db.rollback()
    finally:
        db.close()

    step_log = {
        "node_name": "report_node",
        "status": "success",
        "output": report,
        "timestamp": timestamp
    }

    steps = list(state.get("steps", []))
    steps.append(step_log)

    return {
        **state,
        "report": report,
        "steps": steps
    }
