from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")  # admin, user
    panchayat_id = Column(String, ForeignKey("panchayats.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    panchayat = relationship("Panchayat", back_populates="users")
    monthly_data = relationship("MonthlyData", back_populates="user")

class Panchayat(Base):
    __tablename__ = "panchayats"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    district = Column(String, nullable=False)
    state = Column(String, nullable=False)
    total_population = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    users = relationship("User", back_populates="panchayat")
    monthly_data = relationship("MonthlyData", back_populates="panchayat")

class MonthlyData(Base):
    __tablename__ = "monthly_data"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    panchayat_id = Column(String, ForeignKey("panchayats.id"), nullable=True)
    month = Column(String, nullable=False)  # Jan, Feb, Mar, etc.
    year = Column(Integer, nullable=False)
    electricity_kwh = Column(Float, default=0)
    diesel_liters = Column(Float, default=0)
    petrol_liters = Column(Float, default=0)
    waste_kg = Column(Float, default=0)
    water_liters = Column(Float, default=0)
    solar_units = Column(Float, default=0)
    trees_planted = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="monthly_data")
    panchayat = relationship("Panchayat", back_populates="monthly_data")

class EmissionFactors(Base):
    __tablename__ = "emission_factors"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    electricity = Column(Float, default=0.82)  # kg CO₂ per kWh
    diesel = Column(Float, default=2.68)  # kg CO₂ per liter
    petrol = Column(Float, default=2.31)  # kg CO₂ per liter
    waste = Column(Float, default=0.6)  # kg CO₂ per kg
    water = Column(Float, default=0.000344)  # kg CO₂ per liter
    tree_per_year = Column(Float, default=21.77)  # kg CO₂ absorbed per tree per year
    solar_per_unit = Column(Float, default=0.5)  # kg CO₂ offset per unit
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class CarbonMetrics(Base):
    __tablename__ = "carbon_metrics"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    panchayat_id = Column(String, ForeignKey("panchayats.id"), nullable=True)
    month = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    total_emissions = Column(Float, default=0)
    total_offsets = Column(Float, default=0)
    net_footprint = Column(Float, default=0)
    is_neutral = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
