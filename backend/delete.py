from database import SessionLocal
from models import MonthlyData, CarbonMetrics, OTPVerification, User
db = SessionLocal()
db.query(MonthlyData).delete()
db.query(CarbonMetrics).delete()
db.query(OTPVerification).delete()
db.query(User).filter(User.role == 'user').delete()
db.commit(); db.close()
print("✅ Done. Monthly data, metrics, OTPs, and non-admin users cleared.")