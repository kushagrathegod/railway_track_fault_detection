from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

DATABASE_URL = "sqlite:///./railway.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Station(Base):
    __tablename__ = "stations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    code = Column(String, unique=True, nullable=False)  # e.g., "NDLS", "DLI", "NZM"
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    station_master_email = Column(String, nullable=False)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # "Admin" or "StationMaster"
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=True)  # NULL for Admin
    
    # Relationship
    station = relationship("Station")

class Defect(Base):
    __tablename__ = "defects"

    id = Column(Integer, primary_key=True, index=True)
    defect_type = Column(String, index=True)
    confidence = Column(Float)
    image_url = Column(String)
    # Location data
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    nearest_station = Column(String, nullable=True)
    
    timestamp = Column(DateTime, default=datetime.now)
    
    # Analysis results
    severity = Column(String, default="Pending") # Low, High, Critical
    root_cause = Column(String, nullable=True)
    action_required = Column(String, nullable=True)
    resolution_steps = Column(String, nullable=True)
    
    # Status tracking
    status = Column(String, default="Open")  # Open, Resolved
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Assignment
    assigned_station_id = Column(Integer, ForeignKey("stations.id"), nullable=True)
    
    # Relationships
    assigned_station = relationship("Station")
    resolver = relationship("User", foreign_keys=[resolved_by])

def init_db():
    Base.metadata.create_all(bind=engine)