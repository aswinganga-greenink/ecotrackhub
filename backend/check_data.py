from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import MonthlyData
from database import DATABASE_URL

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

data = db.query(MonthlyData).order_by(MonthlyData.year, MonthlyData.month).all()
print(f"Found {len(data)} records:")
for d in data:
    print(f"{d.month} {d.year}: Elec={d.electricity_kwh}, Diesel={d.diesel_liters}, Waste={d.waste_kg}")

db.close()
