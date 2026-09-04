"""SQLAlchemy models for parcels and incidents."""
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base


class Parcel(Base):
    __tablename__ = "parcels"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    geojson = Column(Text, nullable=False)
    land_type = Column(String, nullable=False)
    authority = Column(String, nullable=False)

    incidents = relationship("Incident", back_populates="parcel")


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String, primary_key=True, index=True)
    parcel_id = Column(String, ForeignKey("parcels.id"), nullable=False)
    report_json = Column(Text, nullable=False)
    is_false_positive = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    parcel = relationship("Parcel", back_populates="incidents")
