#!/usr/bin/env python3
"""
Database initialization script for EcoTrackHub Backend
"""

from database import create_tables, SessionLocal, engine
from models import Base
from calculations import seed_initial_data

def init_database():
    """Initialize database and seed initial data."""
    print("Creating database tables...")
    
    # Import all models to ensure they're registered
    from models import User, Panchayat, MonthlyData, EmissionFactors, CarbonMetrics
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")
    
    # Seed initial data
    print("Seeding initial data...")
    db = SessionLocal()
    try:
        seed_initial_data(db)
        print("Initial data seeded successfully!")
    except Exception as e:
        print(f"Error seeding data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_database()
