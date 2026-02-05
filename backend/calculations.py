from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime

from models import MonthlyData, EmissionFactors, CarbonMetrics, User, Panchayat
from schemas import (
    MonthlyData as MonthlyDataSchema,
    MonthlyDataCreate,
    MonthlyDataUpdate,
    CarbonMetricsResponse,
    SectorEmission,
    MonthlyTrend
)

def calculate_emissions(monthly_data: MonthlyData, emission_factors: EmissionFactors) -> Dict[str, float]:
    """Calculate emissions and offsets for a monthly data record."""
    
    # Calculate emissions (positive values)
    electricity_emissions = monthly_data.electricity_kwh * emission_factors.electricity
    diesel_emissions = monthly_data.diesel_liters * emission_factors.diesel
    petrol_emissions = monthly_data.petrol_liters * emission_factors.petrol
    waste_emissions = monthly_data.waste_kg * emission_factors.waste
    water_emissions = monthly_data.water_liters * emission_factors.water
    
    total_emissions = (
        electricity_emissions + 
        diesel_emissions + 
        petrol_emissions + 
        waste_emissions + 
        water_emissions
    )
    
    # Calculate offsets (negative values)
    tree_offsets = monthly_data.trees_planted * emission_factors.tree_per_year / 12  # Monthly
    solar_offsets = monthly_data.solar_units * emission_factors.solar_per_unit
    
    total_offsets = tree_offsets + solar_offsets
    
    # Net footprint
    net_footprint = total_emissions - total_offsets
    is_neutral = net_footprint <= 0
    
    return {
        "total_emissions": total_emissions,
        "total_offsets": total_offsets,
        "net_footprint": net_footprint,
        "is_neutral": is_neutral,
        "breakdown": {
            "electricity": electricity_emissions,
            "diesel": diesel_emissions,
            "petrol": petrol_emissions,
            "waste": waste_emissions,
            "water": water_emissions,
            "trees": tree_offsets,
            "solar": solar_offsets
        }
    }

def get_carbon_metrics(
    db: Session, 
    user_id: Optional[str] = None,
    panchayat_id: Optional[str] = None,
    month: Optional[str] = None,
    year: Optional[int] = None
) -> CarbonMetricsResponse:
    """Get carbon metrics for given filters."""
    
    query = db.query(MonthlyData)
    
    if user_id:
        query = query.filter(MonthlyData.user_id == user_id)
    if panchayat_id:
        query = query.filter(MonthlyData.panchayat_id == panchayat_id)
    if month:
        query = query.filter(MonthlyData.month == month)
    if year:
        query = query.filter(MonthlyData.year == year)
    
    monthly_data_list = query.all()
    
    if not monthly_data_list:
        return CarbonMetricsResponse(
            total_emissions=0,
            total_offsets=0,
            net_footprint=0,
            is_neutral=True
        )
    
    # Get emission factors (use first one or create default)
    emission_factors = db.query(EmissionFactors).first()
    if not emission_factors:
        emission_factors = EmissionFactors()
        db.add(emission_factors)
        db.commit()
    
    total_emissions = 0
    total_offsets = 0
    
    for data in monthly_data_list:
        calculations = calculate_emissions(data, emission_factors)
        total_emissions += calculations["total_emissions"]
        total_offsets += calculations["total_offsets"]
    
    net_footprint = total_emissions - total_offsets
    is_neutral = net_footprint <= 0
    
    return CarbonMetricsResponse(
        total_emissions=total_emissions,
        total_offsets=total_offsets,
        net_footprint=net_footprint,
        is_neutral=is_neutral
    )

def get_sector_emissions(
    db: Session,
    user_id: Optional[str] = None,
    panchayat_id: Optional[str] = None,
    month: Optional[str] = None,
    year: Optional[int] = None
) -> List[SectorEmission]:
    """Get emissions by sector (electricity, transport, waste, water)."""
    
    query = db.query(MonthlyData)
    
    if user_id:
        query = query.filter(MonthlyData.user_id == user_id)
    if panchayat_id:
        query = query.filter(MonthlyData.panchayat_id == panchayat_id)
    if month:
        query = query.filter(MonthlyData.month == month)
    if year:
        query = query.filter(MonthlyData.year == year)
    
    monthly_data_list = query.all()
    
    if not monthly_data_list:
        return []
    
    # Get emission factors
    emission_factors = db.query(EmissionFactors).first()
    if not emission_factors:
        emission_factors = EmissionFactors()
        db.add(emission_factors)
        db.commit()
    
    sector_totals = {
        "electricity": 0,
        "transport": 0,  # diesel + petrol
        "waste": 0,
        "water": 0
    }
    
    for data in monthly_data_list:
        calculations = calculate_emissions(data, emission_factors)
        breakdown = calculations["breakdown"]
        
        sector_totals["electricity"] += breakdown["electricity"]
        sector_totals["transport"] += breakdown["diesel"] + breakdown["petrol"]
        sector_totals["waste"] += breakdown["waste"]
        sector_totals["water"] += breakdown["water"]
    
    # Calculate total and percentages
    total = sum(sector_totals.values())
    if total == 0:
        return []
    
    colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b"]
    sector_data = []
    
    for i, (sector, emission) in enumerate(sector_totals.items()):
        if emission > 0:  # Only include sectors with emissions
            percentage = (emission / total) * 100
            sector_data.append(SectorEmission(
                sector=sector.title(),
                emission=emission,
                percentage=percentage,
                color=colors[i]
            ))
    
    # Sort by emission amount descending
    sector_data.sort(key=lambda x: x.emission, reverse=True)
    
    return sector_data

def get_monthly_trends(
    db: Session,
    user_id: Optional[str] = None,
    panchayat_id: Optional[str] = None,
    year: Optional[int] = None
) -> List[MonthlyTrend]:
    """Get monthly emission trends."""
    
    query = db.query(MonthlyData)
    
    if user_id:
        query = query.filter(MonthlyData.user_id == user_id)
    if panchayat_id:
        query = query.filter(MonthlyData.panchayat_id == panchayat_id)
    if year:
        query = query.filter(MonthlyData.year == year)
    
    # Group by month and year
    monthly_data_list = query.order_by(MonthlyData.year, MonthlyData.month).all()
    
    if not monthly_data_list:
        return []
    
    # Get emission factors
    emission_factors = db.query(EmissionFactors).first()
    if not emission_factors:
        emission_factors = EmissionFactors()
        db.add(emission_factors)
        db.commit()
    
    # Group data by month-year combination
    month_data = {}
    
    for data in monthly_data_list:
        key = f"{data.year}-{data.month}"
        if key not in month_data:
            month_data[key] = []
        month_data[key].append(data)
    
    trends = []
    
    for key in sorted(month_data.keys()):
        year_month = key.split('-')
        year_val = int(year_month[0])
        month_val = year_month[1]
        
        month_emissions = 0
        month_offsets = 0
        
        for data in month_data[key]:
            calculations = calculate_emissions(data, emission_factors)
            month_emissions += calculations["total_emissions"]
            month_offsets += calculations["total_offsets"]
        
        net = month_emissions - month_offsets
        
        trends.append(MonthlyTrend(
            month=f"{month_val} {year_val}",
            emissions=month_emissions,
            offsets=month_offsets,
            net=net
        ))
    
    return trends

def seed_initial_data(db: Session):
    """Seed database with initial emission factors and sample data."""
    
    # Check if emission factors exist
    existing_factors = db.query(EmissionFactors).first()
    if not existing_factors:
        emission_factors = EmissionFactors()
        db.add(emission_factors)
        db.commit()
    
    # Check if sample panchayats exist
    existing_panchayats = db.query(Panchayat).count()
    if existing_panchayats < 5:  # If very few or none, seed from JSON
        import json
        import os
        
        json_path = os.path.join(os.path.dirname(__file__), "kerala_panchayats.json")
        try:
            with open(json_path, "r") as f:
                panchayat_list = json.load(f)
                
            print(f"Seeding {len(panchayat_list)} panchayats from JSON...")
            for p_data in panchayat_list:
                # Check if exists
                if not db.query(Panchayat).filter(Panchayat.id == p_data["id"]).first():
                    # Generate a random population between 15000 and 45000 if not in JSON (it isn't)
                    # p_data has: name, district, state, id
                    
                    panchayat = Panchayat(
                        id=p_data["id"],
                        name=f"Gram Panchayat {p_data['name']}",
                        district=p_data["district"],
                        state=p_data.get("state", "Kerala"),
                        total_population=25000  # Default or random
                    )
                    db.add(panchayat)
            db.commit()
            print("Panchayats seeded successfully.")
            
        except FileNotFoundError:
            print(f"Warning: {json_path} not found. Using fallback samples.")
            sample_panchayats = [
                Panchayat(
                    name="Gram Panchayat Chandpur",
                    district="Varanasi",
                    state="Uttar Pradesh",
                    total_population=4500
                ),
                Panchayat(
                    name="Gram Panchayat Ramgarh",
                    district="Lucknow", 
                    state="Uttar Pradesh",
                    total_population=3200
                ),
                Panchayat(
                    name="Gram Panchayat Sundarpur",
                    district="Patna",
                    state="Bihar",
                    total_population=5100
                )
            ]
            
            for panchayat in sample_panchayats:
                db.add(panchayat)
            db.commit()
    
    # Check if sample users exist
    existing_users = db.query(User).count()
    if existing_users == 0:
        from auth import get_password_hash
        
        admin_user = User(
            username="admin",
            email="admin@ecotrackhub.com",
            hashed_password=get_password_hash("admin123"),
            role="admin",
            is_active=True
        )
        
        user1 = User(
            username="chandpur_user",
            email="chandpur@example.com",
            hashed_password=get_password_hash("password123"),
            role="user",
            is_active=True,
            panchayat_id=db.query(Panchayat).filter(Panchayat.name.contains("Chandpur")).first().id
        )
        
        db.add_all([admin_user, user1])
        db.commit()
