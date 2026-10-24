import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from datetime import date, timedelta, time as dt_time

from app.main import app
from app.database import Base, get_db
from app.models.user import User
from app.models.court import Court
from app.models.booking import Booking
from app.models.time_slot import TimeSlot
from app.core.security import hash_password, create_access_token

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
    
    admin = User(username="admin_stat", full_name="Admin Stat", role="admin", password_hash=hash_password("123"))
    db.add(admin)
    db.commit()
    
    court1 = Court(name="Sân Stat 1", court_type_id=1, status="active", price_per_hour=100000)
    court2 = Court(name="Sân Stat 2", court_type_id=1, status="maintenance", price_per_hour=120000)
    db.add_all([court1, court2])
    db.commit()
    
    today = date.today()
    # Slot 1: booked
    slot1 = TimeSlot(court_id=court1.id, date=today, start_time=dt_time(10, 0), end_time=dt_time(11, 0), status="booked")
    # Slot 2: blocked (should not be counted in total peak hours)
    slot2 = TimeSlot(court_id=court1.id, date=today, start_time=dt_time(11, 0), end_time=dt_time(12, 0), status="blocked")
    db.add_all([slot1, slot2])
    db.commit()
    
    b1 = Booking(customer_id=1, court_id=court1.id, time_slot_id=slot1.id, staff_id=admin.id, status="confirmed", total_amount=100000)
    db.add(b1)
    db.commit()
    
    yield
    db.close()
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()

def get_auth_headers():
    token = create_access_token({"user_id": 1, "username": "admin_stat", "role": "admin"})
    return {"Authorization": f"Bearer {token}"}

def test_revenue_chart_invalid_date_range():
    headers = get_auth_headers()
    res = client.get("/statistics/revenue-chart?from_date=2026-12-05&to_date=2026-12-01", headers=headers)
    assert res.status_code == 400
    assert "from_date must be less than or equal to to_date" in res.json()["detail"]

def test_peak_hours_excludes_blocked_slots():
    headers = get_auth_headers()
    today = date.today().isoformat()
    res = client.get(f"/statistics/peak-hours?from_date={today}&to_date={today}", headers=headers)
    assert res.status_code == 200
    data = res.json()
    
    # 10:00 should have total=1, booked=1
    h10 = next(d for d in data if d["hour"] == "10:00")
    assert h10["total_slots"] == 1
    assert h10["booked_slots"] == 1
    
    # 11:00 was blocked -> should NOT be counted in total_slots
    h11 = next(d for d in data if d["hour"] == "11:00")
    assert h11["total_slots"] == 0
    assert h11["booked_slots"] == 0

def test_overview_returns_all_required_fields():
    headers = get_auth_headers()
    res = client.get("/statistics/overview", headers=headers)
    assert res.status_code == 200
    data = res.json()
    
    required_keys = [
        "total_revenue", "total_deposit", "today_revenue", 
        "total_bookings", "avg_occupancy_rate", "today_bookings",
        "active_courts", "total_courts", "today_occupancy_rate"
    ]
    for key in required_keys:
        assert key in data

    assert data["active_courts"] == 1
    assert data["total_courts"] == 2
    assert data["today_bookings"] == 1
    assert data["total_bookings"] == 1
