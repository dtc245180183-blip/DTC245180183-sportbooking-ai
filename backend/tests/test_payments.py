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
from app.models.payment import Payment
from app.core.security import hash_password, create_access_token
from datetime import date, time as dt_time, datetime, timezone

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
    
    admin_user = User(username="admin_pay", full_name="Admin", role="admin", password_hash=hash_password("123"))
    db.add(admin_user)
    db.commit()
    
    customer = Customer(full_name="KH1", phone="0911222333")
    db.add(customer)
    db.commit()
    
    # Booking 1: confirmed
    slot1 = TimeSlot(court_id=1, date=date(2026, 12, 1), start_time=dt_time(10, 0), end_time=dt_time(11, 0), status="booked")
    db.add(slot1)
    db.commit()
    b1 = Booking(customer_id=customer.id, court_id=1, time_slot_id=slot1.id, staff_id=admin_user.id, status="confirmed", total_amount=100000)
    db.add(b1)
    
    # Booking 2: cancelled
    slot2 = TimeSlot(court_id=1, date=date(2026, 12, 1), start_time=dt_time(11, 0), end_time=dt_time(12, 0), status="available")
    db.add(slot2)
    db.commit()
    b2 = Booking(customer_id=customer.id, court_id=1, time_slot_id=slot2.id, staff_id=admin_user.id, status="cancelled", total_amount=150000)
    db.add(b2)
    db.commit()
    
    yield
    db.close()
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()

def get_auth_headers():
    token = create_access_token({"user_id": 1, "username": "admin_pay", "role": "admin"})
    return {"Authorization": f"Bearer {token}"}

def test_payment_negative_amount_fails():
    headers = get_auth_headers()
    payload = {
        "booking_id": 1,
        "amount": -50000,
        "method": "cash",
        "status": "paid"
    }
    res = client.post("/payments/", json=payload, headers=headers)
    assert res.status_code == 400
    assert "Amount must be greater than 0" in res.json()["detail"]

def test_payment_for_cancelled_booking_fails():
    headers = get_auth_headers()
    payload = {
        "booking_id": 2, # Booking 2 is cancelled
        "amount": 50000,
        "method": "cash",
        "status": "paid"
    }
    res = client.post("/payments/", json=payload, headers=headers)
    assert res.status_code == 400
    assert "Không thể ghi nhận thanh toán cho đơn đã hủy" in res.json()["detail"]

def test_payment_full_amount_auto_completes_booking():
    headers = get_auth_headers()
    # Create payment of 100,000 for booking 1 (total is 100,000)
    payload = {
        "booking_id": 1,
        "amount": 100000,
        "method": "transfer",
        "status": "paid"
    }
    res = client.post("/payments/", json=payload, headers=headers)
    assert res.status_code == 200
    payment_id = res.json()["id"]
    
    # Check if booking 1 is now completed
    res_b = client.get("/bookings/1", headers=headers)
    assert res_b.status_code == 200
    assert res_b.json()["status"] == "completed"

def test_update_payment_amount_fails():
    headers = get_auth_headers()
    # Attempt to update the payment amount of payment_id=1 (from test above)
    payload = {
        "amount": 200000,
        "status": "pending"
    }
    res = client.put("/payments/1", json=payload, headers=headers)
    assert res.status_code == 200
    assert res.json()["amount"] == 100000 # Amount is unchanged because Pydantic strips it

def test_refund_exceeding_max_refundable_fails():
    headers = get_auth_headers()
    # Booking 2 is cancelled with 0 paid, attempt to refund 50,000 should fail
    payload = {
        "booking_id": 2,
        "amount": 50000,
        "method": "cash",
        "status": "refunded"
    }
    res = client.post("/payments/", json=payload, headers=headers)
    assert res.status_code == 400
    assert "vượt quá số tiền tối đa có thể hoàn" in res.json()["detail"]

def test_forfeit_deposit_endpoint():
    headers = get_auth_headers()
    # Booking 2 is cancelled, forfeit its deposit
    res = client.put("/bookings/2/forfeit-deposit", headers=headers)
    assert res.status_code == 200
    assert res.json()["deposit_forfeited"] is True
