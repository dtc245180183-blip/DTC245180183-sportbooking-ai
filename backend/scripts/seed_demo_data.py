import os
import sys
from datetime import date, timedelta, datetime

# Thêm thư mục gốc backend vào sys.path để import được app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.user import User
from app.models.court_type import CourtType
from app.models.court import Court
from app.models.customer import Customer
from app.models.time_slot import TimeSlot
from app.core.security import hash_password

def seed_data():
    db = SessionLocal()
    try:
        print("Start seeding data...")
        
        # 1. Tạo Admin User
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin = User(
                username="admin",
                hashed_password=hash_password("admin123"),
                full_name="Quản trị viên",
                role="admin"
            )
            db.add(admin)
            print("Created admin user")
        
        # 2. Tạo Court Types
        badminton = db.query(CourtType).filter(CourtType.name == "Sân Cầu Lông").first()
        if not badminton:
            badminton = CourtType(name="Sân Cầu Lông", description="Thảm tiêu chuẩn")
            db.add(badminton)
            
        football = db.query(CourtType).filter(CourtType.name == "Sân Bóng Đá").first()
        if not football:
            football = CourtType(name="Sân Bóng Đá", description="Cỏ nhân tạo 5 người")
            db.add(football)
            
        db.commit()
        db.refresh(badminton)
        db.refresh(football)
        print("Created 2 court types")
        
        # 3. Tạo Courts
        courts_data = [
            {"name": "Sân Cầu Lông 1", "court_type_id": badminton.id, "price_per_hour": 100000},
            {"name": "Sân Cầu Lông 2", "court_type_id": badminton.id, "price_per_hour": 100000},
            {"name": "Sân Bóng 1", "court_type_id": football.id, "price_per_hour": 250000},
            {"name": "Sân Bóng 2", "court_type_id": football.id, "price_per_hour": 250000},
        ]
        
        court_objs = []
        for c_data in courts_data:
            c = db.query(Court).filter(Court.name == c_data["name"]).first()
            if not c:
                c = Court(**c_data)
                db.add(c)
                db.commit()
                db.refresh(c)
            court_objs.append(c)
        print("Created 4 courts")
        
        # 4. Tạo Customers
        customers_data = [
            {"full_name": "Nguyễn Văn A", "phone": "0912345678", "email": "a@gmail.com"},
            {"full_name": "Trần Thị B", "phone": "0987654321", "email": "b@gmail.com"},
            {"full_name": "Lê Văn C", "phone": "0909123456", "email": "c@gmail.com"},
        ]
        
        for cust_data in customers_data:
            cust = db.query(Customer).filter(Customer.phone == cust_data["phone"]).first()
            if not cust:
                db.add(Customer(**cust_data))
        db.commit()
        print("Created 3 customers")
        
        # 5. Sinh khung giờ trống
        today = date.today()
        end_date = today + timedelta(days=7)
        start_hour = 6
        end_hour = 22
        slot_duration = 1
        
        total_slots_created = 0
        total_slots_skipped = 0
        
        for court in court_objs:
            # Load existing
            all_existing = db.query(TimeSlot.date, TimeSlot.start_time).filter(
                TimeSlot.court_id == court.id,
                TimeSlot.date >= today,
                TimeSlot.date <= end_date,
            ).all()
            existing_keys = {(str(row.date), str(row.start_time)) for row in all_existing}
            
            new_slots = []
            curr_d = today
            while curr_d <= end_date:
                for h in range(start_hour, end_hour):
                    slot_start = (datetime.combine(curr_d, datetime.min.time()) + timedelta(hours=h)).time()
                    slot_end = (datetime.combine(curr_d, datetime.min.time()) + timedelta(hours=h+1)).time()
                    
                    key = (str(curr_d), str(slot_start))
                    if key in existing_keys:
                        total_slots_skipped += 1
                    else:
                        new_slots.append(TimeSlot(
                            court_id=court.id,
                            date=curr_d,
                            start_time=slot_start,
                            end_time=slot_end,
                            status="available"
                        ))
                curr_d += timedelta(days=1)
                
            if new_slots:
                db.add_all(new_slots)
                db.commit()
                total_slots_created += len(new_slots)
                
        print(f"Time slots seeding completed: {total_slots_created} new, {total_slots_skipped} skipped.")
        
    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
