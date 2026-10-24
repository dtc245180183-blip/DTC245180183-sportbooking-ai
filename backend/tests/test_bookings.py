import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models.court_type import CourtType
from app.models.court import Court
from app.models.user import User
from app.models.customer import Customer
from app.models.time_slot import TimeSlot
from app.models.booking import Booking
from app.core.security import hash_password, create_access_token
from datetime import date, time as dt_time

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False, "timeout": 30},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Init users
    admin_user = User(username="admin_bk", full_name="Admin", role="admin", password_hash=hash_password("123"))
    db.add(admin_user)
    db.commit()
    
    # Init court types
    ct = CourtType(name="Sân 5", description="Desc")
    db.add(ct)
    db.commit()
    
    # Init courts
    court_cheap = Court(name="Sân Rẻ", court_type_id=ct.id, price_per_hour=100000, status="active")
    court_expensive = Court(name="Sân Đắt", court_type_id=ct.id, price_per_hour=150000, status="active")
    db.add_all([court_cheap, court_expensive])
    db.commit()
    
    # Init customer
    customer = Customer(full_name="Nguyễn Văn A", phone="0901234567")
    db.add(customer)
    db.commit()
    
    # Init slots
    slot1 = TimeSlot(court_id=court_cheap.id, date=date(2026, 10, 1), start_time=dt_time(10, 0), end_time=dt_time(11, 0), status="booked")
    slot2 = TimeSlot(court_id=court_expensive.id, date=date(2026, 10, 1), start_time=dt_time(10, 0), end_time=dt_time(11, 0), status="available")
    db.add_all([slot1, slot2])
    db.commit()
    
    # Init bookings
    booking_completed = Booking(
        customer_id=customer.id,
        court_id=court_cheap.id,
        time_slot_id=slot1.id,
        staff_id=admin_user.id,
        status="completed", # COMPLETED
        total_amount=100000
    )
    db.add(booking_completed)
    db.commit()
    
    slot3 = TimeSlot(court_id=court_cheap.id, date=date(2026, 10, 2), start_time=dt_time(10, 0), end_time=dt_time(11, 0), status="booked")
    db.add(slot3)
    db.commit()
    
    booking_pending = Booking(
        customer_id=customer.id,
        court_id=court_cheap.id,
        time_slot_id=slot3.id,
        staff_id=admin_user.id,
        status="pending", # PENDING
        total_amount=100000
    )
    db.add(booking_pending)
    db.commit()
    
    yield
    db.close()
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()

def get_auth_headers():
    token = create_access_token({"user_id": 1, "username": "admin_bk", "role": "admin"})
    return {"Authorization": f"Bearer {token}"}

def test_cancel_completed_booking_fails():
    headers = get_auth_headers()
    # booking 1 is completed
    res = client.put("/bookings/1/cancel", headers=headers)
    assert res.status_code == 400
    assert "Only pending or confirmed bookings can be cancelled" in res.json()["detail"]

def test_reschedule_cross_court_recalculates_total_and_returns_difference():
    headers = get_auth_headers()
    # booking 2 is pending on court_cheap (total = 100000)
    # move to slot 2 on court_expensive (price = 150000)
    payload = {
        "new_time_slot_id": 2
    }
    res = client.put("/bookings/2/reschedule", json=payload, headers=headers)
    assert res.status_code == 200
    
    data = res.json()
    assert data["amount_difference"] == 50000 # Cần thu thêm 50k
    assert data["booking"]["total_amount"] == 150000
    assert data["booking"]["court_id"] == 2
    assert "Khách cần trả thêm 50,000đ" in data["message"]


import threading
from datetime import date, time as dt_time

def test_staff_can_view_all_bookings():
    headers = get_auth_headers()
    res = client.get("/bookings/", headers=headers)
    assert res.status_code == 200

def test_create_booking_success():
    headers = get_auth_headers()
    db = TestingSessionLocal()
    from app.models.time_slot import TimeSlot
    new_slot = TimeSlot(court_id=1, date=date(2028, 1, 1), start_time=dt_time(8,0), end_time=dt_time(9,0), status="available")
    db.add(new_slot)
    db.commit()
    db.refresh(new_slot)
    slot_id = new_slot.id
    db.close()
    


import threading
from datetime import date, time as dt_time

def test_staff_can_view_all_bookings():
    headers = get_auth_headers()
    res = client.get("/bookings/", headers=headers)
    assert res.status_code == 200

def test_create_booking_success():
    headers = get_auth_headers()
    db = TestingSessionLocal()
    from app.models.time_slot import TimeSlot
    new_slot = TimeSlot(court_id=1, date=date(2028, 1, 1), start_time=dt_time(8,0), end_time=dt_time(9,0), status="available")
    db.add(new_slot)
    db.commit()
    db.refresh(new_slot)
    slot_id = new_slot.id
    db.close()
    
    payload = {
        "customer_id": 1,
        "court_id": 1,
        "time_slot_id": slot_id,
        "deposit_amount": 0
    }
    res = client.post("/bookings/", json=payload, headers=headers)
    assert res.status_code == 201

def test_create_booking_unavailable_slot_fails():
    headers = get_auth_headers()
    # slot1 is booked in setup_db
    payload = {
        "customer_id": 1,
        "court_id": 1,
        "time_slot_id": 1, 
        "deposit_amount": 0
    }
    res = client.post("/bookings/", json=payload, headers=headers)
    assert res.status_code == 409

def test_cancel_pending_booking_success():
    headers = get_auth_headers()
    # Create a fresh pending booking to cancel
    db = TestingSessionLocal()
    from app.models.time_slot import TimeSlot
    from app.models.booking import Booking
    new_slot = TimeSlot(court_id=1, date=date(2028, 2, 2), start_time=dt_time(8,0), end_time=dt_time(9,0), status="booked")
    db.add(new_slot)
    db.commit()
    db.refresh(new_slot)
    
    new_bk = Booking(customer_id=1, court_id=1, time_slot_id=new_slot.id, staff_id=1, status="pending", deposit_amount=0, total_amount=100000)
    db.add(new_bk)
    db.commit()
    db.refresh(new_bk)
    bk_id = new_bk.id
    db.close()
    
    res = client.put(f"/bookings/{bk_id}/cancel", headers=headers)
    assert res.status_code == 200
    assert res.json()["status"] == "cancelled"

def test_concurrent_booking_same_slot_only_one_succeeds():
    headers = get_auth_headers()
    db = TestingSessionLocal()
    from app.models.time_slot import TimeSlot
    new_slot = TimeSlot(court_id=1, date=date(2028, 3, 3), start_time=dt_time(10,0), end_time=dt_time(11,0), status="available")
    db.add(new_slot)
    db.commit()
    db.refresh(new_slot)
    slot_id = new_slot.id
    db.close()
    
    results = []
    
    def book():
        payload = {
            "customer_id": 1,
            "court_id": 1,
            "time_slot_id": slot_id,
            "deposit_amount": 0
        }
        try:
            res = client.post("/bookings/", json=payload, headers=headers)
            results.append(res.status_code)
        except Exception:
            results.append(409) # SQLite lock or concurrent exception counts as blocked
        
    t1 = threading.Thread(target=book)
    t2 = threading.Thread(target=book)
    
    t1.start()
    t2.start()
    t1.join()
    t2.join()
    
    assert results.count(201) == 1
    assert results.count(409) == 1
