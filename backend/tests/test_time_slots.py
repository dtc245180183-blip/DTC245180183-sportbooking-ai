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
    admin_user = User(username="admin_ts", full_name="Admin", role="admin", password_hash=hash_password("123"))
    staff_user = User(username="staff_ts", full_name="Staff", role="staff", password_hash=hash_password("123"))
    db.add_all([admin_user, staff_user])
    db.commit()
    
    # Init court types
    ct = CourtType(name="Sân 5", description="Desc")
    db.add(ct)
    db.commit()
    
    # Init courts
    court = Court(name="Sân A", court_type_id=ct.id, price_per_hour=100000, status="active")
    db.add(court)
    db.commit()
    
    # Init slot 
    slot = TimeSlot(
        court_id=court.id,
        date=date(2026, 9, 2),
        start_time=dt_time(18, 0),
        end_time=dt_time(19, 0),
        status="booked"
    )
    db.add(slot)
    db.commit()
    
    yield
    db.close()
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()

def get_auth_headers(role="admin"):
    if role == "admin":
        token = create_access_token({"user_id": 1, "username": "admin_ts", "role": "admin"})
    else:
        token = create_access_token({"user_id": 2, "username": "staff_ts", "role": "staff"})
    return {"Authorization": f"Bearer {token}"}

def test_staff_cannot_generate_slots():
    headers = get_auth_headers(role="staff")
    payload = {
        "court_id": 1,
        "date_from": "2026-10-01",
        "date_to": "2026-10-01",
        "start_hour": 6,
        "end_hour": 10,
        "slot_duration_hours": 1
    }
    res = client.post("/time-slots/generate", json=payload, headers=headers)
    assert res.status_code == 403

def test_staff_cannot_toggle_block():
    headers = get_auth_headers(role="staff")
    res = client.put("/time-slots/1/toggle-block", headers=headers)
    assert res.status_code == 403

def test_generate_slots_idempotent():
    headers = get_auth_headers(role="admin")
    payload = {
        "court_id": 1,
        "date_from": "2026-10-01",
        "date_to": "2026-10-01",
        "start_hour": 6,
        "end_hour": 8,
        "slot_duration_hours": 1
    }
    # First call: should create 2 slots (6-7, 7-8)
    res1 = client.post("/time-slots/generate", json=payload, headers=headers)
    assert res1.status_code == 200
    assert res1.json()["created_count"] == 2
    assert res1.json()["skipped_count"] == 0
    
    # Second call with same params: should skip 2 slots
    res2 = client.post("/time-slots/generate", json=payload, headers=headers)
    assert res2.status_code == 200
    assert res2.json()["created_count"] == 0
    assert res2.json()["skipped_count"] == 2

def test_toggle_block_already_booked_slot_fails():
    headers = get_auth_headers(role="admin")
    # slot_id 1 is booked
    res = client.put("/time-slots/1/toggle-block", headers=headers)
    assert res.status_code == 400
    assert "Cannot toggle block for a booked slot" in res.json()["detail"]


def test_admin_can_generate_slots():
    headers = get_auth_headers(role="admin")
    payload = {
        "court_id": 1,
        "date_from": "2027-01-01",
        "date_to": "2027-01-01",
        "start_hour": 6,
        "end_hour": 8,
        "slot_duration_hours": 1
    }
    res = client.post("/time-slots/generate", json=payload, headers=headers)
    assert res.status_code == 200

def test_admin_can_toggle_block():
    headers = get_auth_headers(role="admin")
    db = TestingSessionLocal()
    from app.models.time_slot import TimeSlot
    from datetime import date, time as dt_time
    new_slot = TimeSlot(court_id=1, date=date(2027, 2, 2), start_time=dt_time(6,0), end_time=dt_time(7,0), status="available")
    db.add(new_slot)
    db.commit()
    db.refresh(new_slot)
    slot_id = new_slot.id
    db.close()
    
    res = client.put(f"/time-slots/{slot_id}/toggle-block", headers=headers)
    assert res.status_code == 200
    assert res.json()["status"] == "blocked"

