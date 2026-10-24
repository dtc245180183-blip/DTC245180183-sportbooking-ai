import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models.user import User
from app.models.customer import Customer
from app.models.booking import Booking
from app.models.time_slot import TimeSlot
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
    admin_user = User(username="admin_cust", full_name="Admin", role="admin", password_hash=hash_password("123"))
    db.add(admin_user)
    db.commit()
    
    # Init customers
    c1 = Customer(full_name="Lê Văn Luyện", phone="0911222333")
    c2 = Customer(full_name="Trần Thị Bình", phone="0988777666")
    db.add_all([c1, c2])
    db.commit()
    
    # Add a booking for c1
    slot = TimeSlot(court_id=1, date=date(2026, 12, 1), start_time=dt_time(10, 0), end_time=dt_time(11, 0), status="booked")
    db.add(slot)
    db.commit()
    
    b1 = Booking(customer_id=c1.id, court_id=1, time_slot_id=slot.id, staff_id=admin_user.id, status="pending", total_amount=100000)
    db.add(b1)
    db.commit()
    
    yield
    db.close()
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()

def get_auth_headers():
    token = create_access_token({"user_id": 1, "username": "admin_cust", "role": "admin"})
    return {"Authorization": f"Bearer {token}"}

def test_search_customer_by_name_or_phone():
    headers = get_auth_headers()
    # Search by phone
    res = client.get("/customers/?q=0911222", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) == 1
    assert res.json()[0]["full_name"] == "Lê Văn Luyện"
    
    # Search by name (case-insensitive)
    res = client.get("/customers/?q=bình", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) == 1
    assert res.json()[0]["phone"] == "0988777666"

def test_create_customer_invalid_phone_format():
    headers = get_auth_headers()
    payload = {
        "full_name": "Nguyen Sai",
        "phone": "12345", # invalid
    }
    res = client.post("/customers/", json=payload, headers=headers)
    assert res.status_code == 422 # Pydantic schema validation returns 422 Unprocessable Entity
    
    payload["phone"] = "090123456789" # 12 digits (invalid, exceeds 11 digits)
    res2 = client.post("/customers/", json=payload, headers=headers)
    assert res2.status_code == 422
    
def test_delete_customer_with_booking_history_fails():
    headers = get_auth_headers()
    # c1 has a booking
    res = client.delete("/customers/1", headers=headers)
    assert res.status_code == 409
    assert "Không thể xóa khách hàng đã có lịch sử đặt sân" in res.json()["detail"]

def test_get_customer_detail_includes_booking_history():
    headers = get_auth_headers()
    res = client.get("/customers/1", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["full_name"] == "Lê Văn Luyện"
    assert "bookings" in data
    assert len(data["bookings"]) == 1
    assert data["bookings"][0]["status"] == "pending"
