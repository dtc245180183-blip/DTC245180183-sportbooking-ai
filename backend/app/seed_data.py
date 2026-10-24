import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.models.user import User
from app.models.court_type import CourtType
from app.models.court import Court
from app.models.customer import Customer
from app.models.time_slot import TimeSlot
from app.models.booking import Booking
from app.models.payment import Payment
from app.core.security import hash_password
from datetime import date, datetime, timedelta, time

def seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 1. Users
    if not db.query(User).filter(User.username == "admin").first():
        admin = User(username="admin", full_name="Quản lý", role="admin", password_hash=hash_password("admin123"))
        db.add(admin)
    if not db.query(User).filter(User.username == "staff").first():
        staff = User(username="staff", full_name="Nhân viên Bán hàng", role="staff", password_hash=hash_password("staff123"))
        db.add(staff)
    db.commit()

    # 2. Court Types
    court_types = [
        {"name": "Sân bóng đá 7 người", "description": "Sân cỏ nhân tạo chuẩn 7 người"},
        {"name": "Sân Cầu Lông", "description": "Sân thảm PVC chuẩn thi đấu"},
        {"name": "Sân Pickleball", "description": "Sân cứng tiêu chuẩn quốc tế"}
    ]
    for ct in court_types:
        if not db.query(CourtType).filter(CourtType.name == ct["name"]).first():
            db.add(CourtType(**ct))
    db.commit()

    # 3. Courts
    ct_football = db.query(CourtType).filter(CourtType.name == "Sân bóng đá 7 người").first().id # type: ignore
    ct_badminton = db.query(CourtType).filter(CourtType.name == "Sân Cầu Lông").first().id # type: ignore
    ct_pickleball = db.query(CourtType).filter(CourtType.name == "Sân Pickleball").first().id # type: ignore

    courts = [
        {"name": "Sân Bóng A", "court_type_id": ct_football, "price_per_hour": 300000, "status": "active"},
        {"name": "Sân Bóng B", "court_type_id": ct_football, "price_per_hour": 300000, "status": "active"},
        {"name": "Sân Cầu Lông 1", "court_type_id": ct_badminton, "price_per_hour": 100000, "status": "active"},
        {"name": "Sân Cầu Lông 2", "court_type_id": ct_badminton, "price_per_hour": 100000, "status": "active"},
        {"name": "Sân Pickleball VIP", "court_type_id": ct_pickleball, "price_per_hour": 250000, "status": "active"},
    ]
    for c in courts:
        if not db.query(Court).filter(Court.name == c["name"]).first():
            db.add(Court(**c))
    db.commit()

    # 4. Customers
    customers = [
        {"full_name": "Nguyễn Văn Khách", "phone": "0901234561", "email": "khach1@gmail.com"},
        {"full_name": "Trần Thị Khách", "phone": "0901234562", "email": "khach2@gmail.com"},
    ]
    for c in customers:
        if not db.query(Customer).filter(Customer.phone == c["phone"]).first():
            db.add(Customer(**c))
    db.commit()

    print("Seed data completed successfully!")
    db.close()

if __name__ == "__main__":
    seed_db()
