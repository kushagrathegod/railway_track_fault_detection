from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

DATABASE_URL = "sqlite:///./railway.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Defect(Base):
    __tablename__ = "defects"

    id = Column(Integer, primary_key=True, index=True)
    defect_type = Column(String, index=True)
    confidence = Column(Float)
    image_url = Column(String)
    # Location data
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    chainage = Column(String, nullable=True) # KM/Chainage
    nearest_station = Column(String, nullable=True)
    
    timestamp = Column(DateTime, default=datetime.now)
    
    # Analysis results
    severity = Column(String, default="Pending") # Low, High, Critical
    root_cause = Column(String, nullable=True)
    action_required = Column(String, nullable=True)
    resolution_steps = Column(String, nullable=True)

def init_db():
    Base.metadata.create_all(bind=engine)
