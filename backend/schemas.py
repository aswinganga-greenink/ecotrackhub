from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# Base schemas
class BaseSchema(BaseModel):
    class Config:
        from_attributes = True

# User schemas
class UserBase(BaseSchema):
    username: str
    email: Optional[EmailStr] = None
    role: str = "user"
    panchayat_id: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseSchema):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    panchayat_id: Optional[str] = None
    is_active: Optional[bool] = None

class User(UserBase):
    id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

class UserInDB(User):
    hashed_password: str

# Panchayat schemas
class PanchayatBase(BaseSchema):
    name: str
    district: str
    state: str
    total_population: int = 0

class PanchayatCreate(PanchayatBase):
    pass

class PanchayatUpdate(BaseSchema):
    name: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    total_population: Optional[int] = None

class Panchayat(PanchayatBase):
    id: str
    created_at: datetime
    updated_at: datetime

# Monthly Data schemas
class MonthlyDataBase(BaseSchema):
    user_id: str
    panchayat_id: Optional[str] = None
    month: str
    year: int
    electricity_kwh: float = 0
    diesel_liters: float = 0
    petrol_liters: float = 0
    waste_kg: float = 0
    water_liters: float = 0
    solar_units: float = 0
    trees_planted: int = 0

class MonthlyDataCreate(MonthlyDataBase):
    pass

class MonthlyDataUpdate(BaseSchema):
    month: Optional[str] = None
    year: Optional[int] = None
    electricity_kwh: Optional[float] = None
    diesel_liters: Optional[float] = None
    petrol_liters: Optional[float] = None
    waste_kg: Optional[float] = None
    water_liters: Optional[float] = None
    solar_units: Optional[float] = None
    trees_planted: Optional[int] = None

class MonthlyData(MonthlyDataBase):
    id: str
    created_at: datetime
    updated_at: datetime

# Emission Factors schemas
class EmissionFactorsBase(BaseSchema):
    electricity: float = 0.82
    diesel: float = 2.68
    petrol: float = 2.31
    waste: float = 0.6
    water: float = 0.000344
    tree_per_year: float = 21.77
    solar_per_unit: float = 0.5

class EmissionFactorsCreate(EmissionFactorsBase):
    pass

class EmissionFactorsUpdate(BaseSchema):
    electricity: Optional[float] = None
    diesel: Optional[float] = None
    petrol: Optional[float] = None
    waste: Optional[float] = None
    water: Optional[float] = None
    tree_per_year: Optional[float] = None
    solar_per_unit: Optional[float] = None

class EmissionFactors(EmissionFactorsBase):
    id: str
    created_at: datetime
    updated_at: datetime

# Carbon Metrics schemas
class CarbonMetricsBase(BaseSchema):
    user_id: str
    panchayat_id: Optional[str] = None
    month: str
    year: int
    total_emissions: float = 0
    total_offsets: float = 0
    net_footprint: float = 0
    is_neutral: bool = False

class CarbonMetricsCreate(CarbonMetricsBase):
    pass

class CarbonMetricsUpdate(BaseSchema):
    total_emissions: Optional[float] = None
    total_offsets: Optional[float] = None
    net_footprint: Optional[float] = None
    is_neutral: Optional[bool] = None

class CarbonMetrics(CarbonMetricsBase):
    id: str
    created_at: datetime
    updated_at: datetime

# Analytics schemas
class SectorEmission(BaseSchema):
    sector: str
    emission: float
    percentage: float
    color: str

class MonthlyTrend(BaseSchema):
    month: str
    emissions: float
    offsets: float
    net: float

class CarbonMetricsResponse(BaseSchema):
    total_emissions: float
    total_offsets: float
    net_footprint: float
    is_neutral: bool

# Authentication schemas
class Token(BaseSchema):
    access_token: str
    token_type: str

class TokenData(BaseSchema):
    username: Optional[str] = None

class LoginRequest(BaseSchema):
    username: str
    password: str

# Response schemas
class MessageResponse(BaseSchema):
    message: str

class PaginatedResponse(BaseSchema):
    items: List
    total: int
    page: int
    size: int
    size: int
    pages: int

# Prediction schemas
class ForecastItem(BaseSchema):
    month: str
    year: int
    predicted_emission: float

class PredictionResponse(BaseSchema):
    forecast: List[ForecastItem]
    recommendations: List[str]

