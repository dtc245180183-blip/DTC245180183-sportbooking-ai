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
    connect_args={"check_same_thread": False},
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
    admin_user = User(username="admin_court", full_name="Admin", role="admin", password_hash=hash_password("123"))
    staff_user = User(username="staff_court", full_name="Staff", role="staff", password_hash=hash_password("123"))
    db.add_all([admin_user, staff_user])
    db.commit()
    
    # Init court types
    ct1 = CourtType(name="Sân 5", description="Desc")
    ct2 = CourtType(name="Sân 7", description="Desc 7")
    db.add_all([ct1, ct2])
    db.commit()
    
    # Init courts
    court1 = Court(name="Sân A", court_type_id=ct1.id, price_per_hour=100000, status="active")
    db.add(court1)
    db.commit()
    
    # Init customer and booking for constraints
    customer = Customer(full_name="Khach", phone="0901112223")
    db.add(customer)
    db.commit()
    
    slot = TimeSlot(court_id=court1.id, date=date(2026, 9, 2), start_time=dt_time(18, 0), end_time=dt_time(19, 0), status="booked")
    db.add(slot)
    db.commit()
    
    booking = Booking(
        customer_id=customer.id,
        court_id=court1.id,
        time_slot_id=slot.id,
        staff_id=admin_user.id,
        status="confirmed",
        total_amount=100000
    )
    db.add(booking)
    db.commit()
    
    yield
    db.close()
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()

def get_auth_headers(role="admin"):
    if role == "admin":
        token = create_access_token({"user_id": 1, "username": "admin_court", "role": "admin"})
    else:
        token = create_access_token({"user_id": 2, "username": "staff_court", "role": "staff"})
    return {"Authorization": f"Bearer {token}"}

def test_staff_cannot_create_court():
    headers = get_auth_headers(role="staff")
    payload = {
        "name": "Sân B (Staff)",
        "court_type_id": 1,
        "price_per_hour": 150000,
        "status": "active"
    }
    res = client.post("/courts/", json=payload, headers=headers)
    assert res.status_code == 403

def test_staff_cannot_delete_court():
    headers = get_auth_headers(role="staff")
    res = client.delete("/courts/1", headers=headers)
    assert res.status_code == 403

def test_create_court_invalid_price():
    headers = get_auth_headers(role="admin")
    payload = {
        "name": "Sân C (Âm giá)",
        "court_type_id": 1,
        "price_per_hour": -50000,
        "status": "active"
    }
    res = client.post("/courts/", json=payload, headers=headers)
    assert res.status_code == 400
    assert "lớn hơn 0" in res.json()["detail"]

def test_delete_court_type_with_courts_fails():
    headers = get_auth_headers(role="admin")
    # type_id = 1 đang có court1
    res = client.delete("/court-types/1", headers=headers)
    assert res.status_code == 409
    assert "đang có sân sử dụng" in res.json()["detail"]

def test_get_courts_requires_auth():
    # without auth header
    res = client.get("/courts/")
    assert res.status_code == 401

def test_delete_court_with_active_booking_fails():
    headers = get_auth_headers(role="admin")
    # court_id = 1 đang có booking confirmed
    res = client.delete("/courts/1", headers=headers)
    assert res.status_code == 409
    assert "chờ xử lý hoặc đã xác nhận" in res.json()["detail"]


def test_admin_can_create_court():
    headers = get_auth_headers(role="admin")
    payload = {
        "name": "Sân Admin Tạo",
        "court_type_id": 1,

        "price_per_hour": 150000,
        "status": "active"
    }
    res = client.post("/courts/", json=payload, headers=headers)
    assert res.status_code == 200

def test_admin_can_delete_court():
    headers = get_auth_headers(role="admin")
    # Tự tạo sân riêng để xóa cho an toàn
    db = TestingSessionLocal()
    from app.models.court import Court
    new_court = Court(name="Sân Xóa", court_type_id=1, price_per_hour=100000, status="active")
    db.add(new_court)
    db.commit()
    db.refresh(new_court)
    court_id = new_court.id
    db.close()
    
    res = client.delete(f"/courts/{court_id}", headers=headers)
    assert res.status_code == 204

def test_delete_court_with_only_available_slots_succeeds():
    headers = get_auth_headers(role="admin")
    db = TestingSessionLocal()
    from app.models.court import Court
    from app.models.time_slot import TimeSlot
    new_court = Court(name="Sân Có Khung Giờ Trống", court_type_id=1, price_per_hour=100000, status="active")
    db.add(new_court)
    db.commit()
    db.refresh(new_court)
    
    slot = TimeSlot(court_id=new_court.id, date=date(2026, 9, 3), start_time=dt_time(10, 0), end_time=dt_time(11, 0), status="available")
    db.add(slot)
    db.commit()
    
    court_id = new_court.id
    db.close()
    
    res = client.delete(f"/courts/{court_id}", headers=headers)
    assert res.status_code == 204

def test_delete_court_with_booked_slot_fails():
    headers = get_auth_headers(role="admin")
    db = TestingSessionLocal()
    from app.models.court import Court
    from app.models.time_slot import TimeSlot
    new_court = Court(name="Sân Có Khung Giờ Đã Đặt", court_type_id=1, price_per_hour=100000, status="active")
    db.add(new_court)
    db.commit()
    db.refresh(new_court)
    
    # Create booked slot without active booking to isolate the time_slot check
    slot = TimeSlot(court_id=new_court.id, date=date(2026, 9, 3), start_time=dt_time(14, 0), end_time=dt_time(15, 0), status="booked")
    db.add(slot)
    db.commit()
    
    court_id = new_court.id
    db.close()
    
    res = client.delete(f"/courts/{court_id}", headers=headers)
    assert res.status_code == 409
    assert "Sân đang có khung giờ đã đặt, không thể xóa" in res.json()["detail"]
