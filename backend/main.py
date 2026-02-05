from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import uvicorn

# Import local modules
from database import get_db, create_tables, SessionLocal
from models import User, Panchayat, MonthlyData, EmissionFactors, CarbonMetrics
from schemas import (
    User as UserSchema, UserCreate, UserUpdate, UserInDB,
    Panchayat as PanchayatSchema, PanchayatCreate, PanchayatUpdate,
    MonthlyData as MonthlyDataSchema, MonthlyDataCreate, MonthlyDataUpdate,
    EmissionFactors as EmissionFactorsSchema, EmissionFactorsCreate, EmissionFactorsUpdate,
    CarbonMetrics as CarbonMetricsSchema, CarbonMetricsCreate, CarbonMetricsUpdate,
    Token, TokenData, LoginRequest, MessageResponse,
    CarbonMetricsResponse, SectorEmission, MonthlyTrend, PaginatedResponse,
    PredictionResponse
)
from auth import (
    get_password_hash, verify_password, create_access_token, 
    ACCESS_TOKEN_EXPIRE_MINUTES, SECRET_KEY, ALGORITHM
)
from dependencies import get_current_user, get_current_active_user, require_admin, get_optional_user, get_pagination_params
from calculations import (
    get_carbon_metrics, get_sector_emissions, get_monthly_trends, 
    calculate_emissions, seed_initial_data
)

# Create FastAPI app
app = FastAPI(
    title="EcoTrackHub API",
    description="Carbon footprint tracking API for Gram Panchayats",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:4173", "http://localhost:8080"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize database and seed data."""
    create_tables()
    # Seed data
    db = SessionLocal()
    try:
        seed_initial_data(db)
    finally:
        db.close()

# Authentication endpoints
@app.post("/auth/login", response_model=Token)
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Login user and return access token."""
    user = db.query(User).filter(User.username == login_data.username).first()
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/auth/register", response_model=UserSchema)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register new user."""
    # Check if user exists
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(
            status_code=400, detail="Username already registered"
        )
    
    if user_data.email and db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=400, detail="Email already registered"
        )
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        role=user_data.role,
        panchayat_id=user_data.panchayat_id
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return UserSchema.from_orm(db_user)

@app.get("/auth/me", response_model=UserSchema)
async def read_users_me(current_user: UserSchema = Depends(get_current_active_user)):
    """Get current user info."""
    return current_user

# User management endpoints
@app.get("/users/", response_model=List[UserSchema])
async def get_users(
    db: Session = Depends(get_db),
    current_user: UserSchema = Depends(require_admin),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    """Get all users (admin only)."""
    users = db.query(User).offset(skip).limit(limit).all()
    return [UserSchema.from_orm(user) for user in users]

@app.get("/users/{user_id}", response_model=UserSchema)
async def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: UserSchema = Depends(get_current_active_user)
):
    """Get user by ID."""
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserSchema.from_orm(user)

@app.put("/users/{user_id}", response_model=UserSchema)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: UserSchema = Depends(get_current_active_user)
):
    """Update user."""
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update fields
    for field, value in user_data.dict(exclude_unset=True).items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    return UserSchema.from_orm(user)

@app.delete("/users/{user_id}", response_model=MessageResponse)
async def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: UserSchema = Depends(require_admin)
):
    """Delete user (admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}

# Panchayat endpoints
@app.get("/panchayats/", response_model=List[PanchayatSchema])
async def get_panchayats(
    db: Session = Depends(get_db),
    current_user: Optional[UserSchema] = Depends(get_optional_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(1000, ge=1, le=1000)
):
    """Get all panchayats."""
    query = db.query(Panchayat).offset(skip).limit(limit)
    
    # Regular users can only see their own panchayat
    if current_user and current_user.role == "user" and current_user.panchayat_id:
        query = query.filter(Panchayat.id == current_user.panchayat_id)
    
    panchayats = query.all()
    return [PanchayatSchema.from_orm(panchayat) for panchayat in panchayats]

@app.post("/panchayats/", response_model=PanchayatSchema)
async def create_panchayat(
    panchayat_data: PanchayatCreate,
    db: Session = Depends(get_db),
    current_user: UserSchema = Depends(require_admin)
):
    """Create new panchayat (admin only)."""
    db_panchayat = Panchayat(**panchayat_data.dict())
    db.add(db_panchayat)
    db.commit()
    db.refresh(db_panchayat)
    
    return PanchayatSchema.from_orm(db_panchayat)

@app.get("/panchayats/{panchayat_id}", response_model=PanchayatSchema)
async def get_panchayat(
    panchayat_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[UserSchema] = Depends(get_optional_user)
):
    """Get panchayat by ID."""
    panchayat = db.query(Panchayat).filter(Panchayat.id == panchayat_id).first()
    if not panchayat:
        raise HTTPException(status_code=404, detail="Panchayat not found")
    
    # Check permissions
    if current_user and current_user.role == "user" and current_user.panchayat_id != panchayat_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return PanchayatSchema.from_orm(panchayat)

# Monthly data endpoints
@app.get("/data/", response_model=PaginatedResponse)
async def get_monthly_data(
    db: Session = Depends(get_db),
    current_user: UserSchema = Depends(get_current_active_user),
    user_id: Optional[str] = None,
    panchayat_id: Optional[str] = None,
    month: Optional[str] = None,
    year: Optional[int] = None,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100)
):
    """Get monthly carbon data."""
    query = db.query(MonthlyData)
    
    # Apply filters
    if current_user.role == "user":
        query = query.filter(MonthlyData.user_id == current_user.id)
    elif user_id:
        query = query.filter(MonthlyData.user_id == user_id)
    
    if panchayat_id:
        query = query.filter(MonthlyData.panchayat_id == panchayat_id)
    if month:
        query = query.filter(MonthlyData.month == month)
    if year:
        query = query.filter(MonthlyData.year == year)
    
    # Pagination
    total = query.count()
    offset = (page - 1) * size
    data = query.offset(offset).limit(size).all()
    
    return {
        "items": [MonthlyDataSchema.from_orm(item) for item in data],
        "total": total,
        "page": page,
        "size": size,
        "pages": (total + size - 1) // size
    }

@app.post("/data/", response_model=MonthlyDataSchema)
async def create_monthly_data(
    data: MonthlyDataCreate,
    db: Session = Depends(get_db),
    current_user: UserSchema = Depends(get_current_active_user)
):
    """Create new monthly data entry."""
    if current_user.role == "user" and data.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only create data for yourself")
    
    db_data = MonthlyData(**data.dict())
    db.add(db_data)
    db.commit()
    db.refresh(db_data)
    
    return MonthlyDataSchema.from_orm(db_data)

@app.put("/data/{data_id}", response_model=MonthlyDataSchema)
async def update_monthly_data(
    data_id: str,
    data_update: MonthlyDataUpdate,
    db: Session = Depends(get_db),
    current_user: UserSchema = Depends(get_current_active_user)
):
    """Update monthly data entry."""
    db_data = db.query(MonthlyData).filter(MonthlyData.id == data_id).first()
    if not db_data:
        raise HTTPException(status_code=404, detail="Data not found")
    
    if current_user.role == "user" and db_data.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only update your own data")
    
    # Update fields
    for field, value in data_update.dict(exclude_unset=True).items():
        setattr(db_data, field, value)
    
    db.commit()
    db.refresh(db_data)
    
    return MonthlyDataSchema.from_orm(db_data)

@app.delete("/data/{data_id}", response_model=MessageResponse)
async def delete_monthly_data(
    data_id: str,
    db: Session = Depends(get_db),
    current_user: UserSchema = Depends(get_current_active_user)
):
    """Delete monthly data entry."""
    db_data = db.query(MonthlyData).filter(MonthlyData.id == data_id).first()
    if not db_data:
        raise HTTPException(status_code=404, detail="Data not found")
    
    if current_user.role == "user" and db_data.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only delete your own data")
    
    db.delete(db_data)
    db.commit()
    
    return {"message": "Data deleted successfully"}

# Analytics endpoints
@app.get("/analytics/metrics", response_model=CarbonMetricsResponse)
async def get_analytics_metrics(
    db: Session = Depends(get_db),
    current_user: UserSchema = Depends(get_current_active_user),
    user_id: Optional[str] = None,
    panchayat_id: Optional[str] = None,
    month: Optional[str] = None,
    year: Optional[int] = None
):
    """Get carbon metrics."""
    # Apply user permissions
    if current_user.role == "user":
        user_id = current_user.id
    elif user_id:
        user_id = user_id
    
    return get_carbon_metrics(db, user_id, panchayat_id, month, year)

@app.get("/analytics/sectors", response_model=List[SectorEmission])
async def get_analytics_sectors(
    db: Session = Depends(get_db),
    current_user: UserSchema = Depends(get_current_active_user),
    user_id: Optional[str] = None,
    panchayat_id: Optional[str] = None,
    month: Optional[str] = None,
    year: Optional[int] = None
):
    """Get sector-wise emissions."""
    if current_user.role == "user":
        user_id = current_user.id
    
    return get_sector_emissions(db, user_id, panchayat_id, month, year)

@app.get("/analytics/trends", response_model=List[MonthlyTrend])
async def get_analytics_trends(
    db: Session = Depends(get_db),
    current_user: UserSchema = Depends(get_current_active_user),
    user_id: Optional[str] = None,
    panchayat_id: Optional[str] = None,
    year: Optional[int] = None
):
    """Get monthly trends."""
    if current_user.role == "user":
        user_id = current_user.id
    
    return get_monthly_trends(db, user_id, panchayat_id, year)

# Emission factors endpoints (admin only)
@app.get("/emission-factors/", response_model=EmissionFactorsSchema)
async def get_emission_factors(
    db: Session = Depends(get_db),
    current_user: UserSchema = Depends(require_admin)
):
    """Get emission factors (admin only)."""
    factors = db.query(EmissionFactors).first()
    if not factors:
        factors = EmissionFactors()
        db.add(factors)
        db.commit()
        db.refresh(factors)
    
    return EmissionFactorsSchema.from_orm(factors)

@app.put("/emission-factors/", response_model=EmissionFactorsSchema)
async def update_emission_factors(
    factors_update: EmissionFactorsUpdate,
    db: Session = Depends(get_db),
    current_user: UserSchema = Depends(require_admin)
):
    """Update emission factors (admin only)."""
    factors = db.query(EmissionFactors).first()
    if not factors:
        factors = EmissionFactors()
        db.add(factors)
    
    # Update fields
    for field, value in factors_update.dict(exclude_unset=True).items():
        setattr(factors, field, value)
    
    db.commit()
    db.refresh(factors)
    
    return EmissionFactorsSchema.from_orm(factors)

# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# Utility endpoint to seed data (for development)
@app.post("/dev/seed-data")
async def seed_dev_data(db: Session = Depends(get_db)):
    """Seed development data (only in development)."""
    seed_initial_data(db)
    return {"message": "Development data seeded successfully"}

@app.get("/analytics/predictions", response_model=PredictionResponse)
async def get_predictions(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get AI-generated emissions forecast and recommendations.
    """
    # Fetch historical data
    query = db.query(MonthlyData)
    
    # Filter by user or panchayat based on role
    if current_user.role == "user":
        query = query.filter(MonthlyData.user_id == current_user.id)
    elif current_user.role == "admin" and current_user.panchayat_id:
        query = query.filter(MonthlyData.panchayat_id == current_user.panchayat_id)
        
    data = query.order_by(MonthlyData.year, MonthlyData.month).all() # Simple ordering
    
    # Get emission factors
    emission_factors = db.query(EmissionFactors).first()
    if not emission_factors:
        emission_factors = EmissionFactors()

    # Convert to list of dicts with calculated emissions
    historical_data = []
    for d in data:
        data_dict = MonthlyDataSchema.from_orm(d).dict()
        # Calculate emissions
        calc_result = calculate_emissions(d, emission_factors)
        data_dict["calculated_total_emission_kg"] = calc_result["total_emissions"]
        data_dict["calculated_net_footprint_kg"] = calc_result["net_footprint"]
        historical_data.append(data_dict)
    
    from ai_service import get_ai_prediction
    prediction = await get_ai_prediction(historical_data)
    
    if "error" in prediction:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=prediction["error"]
        )
        
    return prediction

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
