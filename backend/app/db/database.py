"""SQLite connection setup and session management."""
import os
import json
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./bhoomi_rakshak.db")

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency for obtaining a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables and seed sample parcels if none exist."""
    from app.db.models import Parcel

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Parcel 1: Sector 4 Public Buffer Zone
        p1 = db.query(Parcel).filter(Parcel.id == "parcel_001").first()
        p1_geojson = {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {"parcel_id": "parcel_001", "name": "Public Buffer Zone Sector 4", "authority": "Land Revenue Department"},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[77.5946, 12.9756], [77.5971, 12.9756], [77.5971, 12.9716], [77.5946, 12.9716], [77.5946, 12.9756]]]
                }
            }]
        }
        if not p1:
            db.add(Parcel(id="parcel_001", name="Public Buffer Zone Sector 4", geojson=json.dumps(p1_geojson), land_type="Government Public Land", authority="Land Revenue Department"))
        else:
            p1.geojson = json.dumps(p1_geojson)

        # Parcel 2: North Forest Reserve & Lake Basin
        p2 = db.query(Parcel).filter(Parcel.id == "parcel_002").first()
        p2_geojson = {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {"parcel_id": "parcel_002", "name": "North Forest Reserve & Lake Basin", "authority": "Forest & Wildlife Authority"},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[77.5920, 12.9840], [77.5980, 12.9840], [77.5980, 12.9790], [77.5920, 12.9790], [77.5920, 12.9840]]]
                }
            }]
        }
        if not p2:
            db.add(Parcel(id="parcel_002", name="North Forest Reserve & Lake Basin", geojson=json.dumps(p2_geojson), land_type="Protected Forest Buffer", authority="Forest & Wildlife Authority"))
        else:
            p2.geojson = json.dumps(p2_geojson)

        # Parcel 3: Central Industrial Corridor Buffer
        p3 = db.query(Parcel).filter(Parcel.id == "parcel_003").first()
        p3_geojson = {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {"parcel_id": "parcel_003", "name": "Central Industrial Corridor Buffer", "authority": "Industrial Development Board"},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[77.6950, 12.9960], [77.7010, 12.9960], [77.7010, 12.9910], [77.6950, 12.9910], [77.6950, 12.9960]]]
                }
            }]
        }
        if not p3:
            db.add(Parcel(id="parcel_003", name="Central Industrial Corridor Buffer", geojson=json.dumps(p3_geojson), land_type="Industrial Buffer Zone", authority="Industrial Development Board"))
        else:
            p3.geojson = json.dumps(p3_geojson)

        db.commit()
    finally:
        db.close()
