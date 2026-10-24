import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models.user import User
from app.models.court import Court
from app.models.maintenance_schedule import MaintenanceSchedule
from app.models.booking import Booking
from app.models.time_slot import TimeSlot
from app.core.security import hash_password, create_access_token
from datetime import date, timedelta, time as dt_time

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
    
    admin_user = User(username="admin_maint", full_name="Admin", role="admin", password_hash=hash_password("123"))
    staff_user = User(username="staff_maint", full_name="Staff", role="staff", password_hash=hash_password("123"))
    db.add_all([admin_user, staff_user])
    db.commit()
    
    court = Court(name="Sân 1", court_type_id=1, status="active", price_per_hour=100000)
    db.add(court)
    db.commit()
    
    # Create a booking on 2026-12-05
    slot = TimeSlot(court_id=court.id, date=date(2026, 12, 5), start_time=dt_time(10, 0), end_time=dt_time(11, 0), status="booked")
    db.add(slot)
    db.commit()
    b = Booking(customer_id=1, court_id=court.id, time_slot_id=slot.id, staff_id=admin_user.id, status="confirmed", total_amount=100000)
    db.add(b)
    db.commit()
    
    yield
    db.close()
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()

def get_admin_headers():
    token = create_access_token({"user_id": 1, "username": "admin_maint", "role": "admin"})
    return {"Authorization": f"Bearer {token}"}

def get_staff_headers():
    token = create_access_token({"user_id": 2, "username": "staff_maint", "role": "staff"})
    return {"Authorization": f"Bearer {token}"}

def test_staff_cannot_create_maintenance():
    payload = {
        "court_id": 1,
        "start_date": "2026-12-01",
        "end_date": "2026-12-02",
        "status": "planned"
    }
    res = client.post("/maintenance/", json=payload, headers=get_staff_headers())
    assert res.status_code == 403

def test_maintenance_start_after_end_fails():
    payload = {
        "court_id": 1,
        "start_date": "2026-12-02",
        "end_date": "2026-12-01",
        "status": "planned"
    }
    res = client.post("/maintenance/", json=payload, headers=get_admin_headers())
    assert res.status_code == 400
    assert "start_date must be strictly before end_date" in res.json()["detail"]

def test_maintenance_warns_conflicting_confirmed_booking():
    # Booking is on 2026-12-05
    payload = {
        "court_id": 1,
        "start_date": "2026-12-04",
        "end_date": "2026-12-06",
        "status": "planned"
    }
    
    # 1. Test without force -> 409 Conflict
    res1 = client.post("/maintenance/", json=payload, headers=get_admin_headers())
    assert res1.status_code == 409
    data1 = res1.json()["detail"]
    assert data1["message"] == "Conflict"
    assert len(data1["conflicting_bookings"]) > 0
    
    # 2. Test with force=true -> 200 OK
    res2 = client.post("/maintenance/?force=true", json=payload, headers=get_admin_headers())
    assert res2.status_code == 200
    assert res2.json()["id"] is not None
    
    global schedule_id
    schedule_id = res2.json()["id"]

def test_maintenance_auto_updates_court_status():
    # Update status to in_progress -> court becomes maintenance
    res = client.put(f"/maintenance/{schedule_id}?force=true", json={"status": "in_progress"}, headers=get_admin_headers())
    assert res.status_code == 200
    
    # Check court status
    court_res = client.get("/courts/1", headers=get_admin_headers())
    assert court_res.json()["status"] == "maintenance"
    
    # Update status to done -> court becomes active
    res = client.put(f"/maintenance/{schedule_id}?force=true", json={"status": "done"}, headers=get_admin_headers())
    assert res.status_code == 200
    
    court_res = client.get("/courts/1", headers=get_admin_headers())
    assert court_res.json()["status"] == "active"

def test_maintenance_blocks_available_slots_and_restores_on_complete():
    db = TestingSessionLocal()
    # Create available slot for Court 1 on 2026-12-10
    slot = TimeSlot(court_id=1, date=date(2026, 12, 10), start_time=dt_time(8, 0), end_time=dt_time(9, 0), status="available")
    db.add(slot)
    db.commit()
    slot_id = slot.id
    db.close()

    # Create maintenance schedule covering 2026-12-10
    payload = {
        "court_id": 1,
        "start_date": "2026-12-09",
        "end_date": "2026-12-11",
        "status": "planned"
    }
    res = client.post("/maintenance/", json=payload, headers=get_admin_headers())
    assert res.status_code == 200
    m_id = res.json()["id"]

    # Slot should now be blocked
    slot_res = client.get(f"/time-slots/?court_id=1&filter_date=2026-12-10", headers=get_admin_headers())
    assert slot_res.status_code == 200
    target_slot = next(s for s in slot_res.json() if s["id"] == slot_id)
    assert target_slot["status"] == "blocked"

    # Complete maintenance
    res = client.put(f"/maintenance/{m_id}", json={"status": "completed"}, headers=get_admin_headers())
    assert res.status_code == 200

    # Slot should be restored to available
    slot_res = client.get(f"/time-slots/?court_id=1&filter_date=2026-12-10", headers=get_admin_headers())
    target_slot = next(s for s in slot_res.json() if s["id"] == slot_id)
    assert target_slot["status"] == "available"

def test_booking_rejected_during_maintenance_dates():
    db = TestingSessionLocal()
    slot = TimeSlot(court_id=1, date=date(2026, 12, 15), start_time=dt_time(14, 0), end_time=dt_time(15, 0), status="available")
    db.add(slot)
    db.commit()
    slot_id = slot.id
    db.close()

    # Schedule maintenance on 2026-12-15
    payload = {
        "court_id": 1,
        "start_date": "2026-12-14",
        "end_date": "2026-12-16",
        "status": "scheduled"
    }
    res = client.post("/maintenance/", json=payload, headers=get_admin_headers())
    assert res.status_code == 200

    # Manually make slot available to test service level rejection
    db = TestingSessionLocal()
    slot_obj = db.query(TimeSlot).filter(TimeSlot.id == slot_id).first()
    slot_obj.status = "available"
    db.commit()
    db.close()

    # Attempt to book this slot -> should be rejected with exact maintenance message
    book_payload = {
        "customer_id": 1,
        "time_slot_id": slot_id,
        "deposit_amount": 50000
    }
    res_book = client.post("/bookings/", json=book_payload, headers=get_admin_headers())
    assert res_book.status_code == 400
    assert "Sân đang trong lịch bảo trì vào ngày này, không thể đặt hoặc đổi lịch" in res_book.json()["detail"]
