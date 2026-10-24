import os

def append_to_file(filepath, content):
    with open(filepath, "a", encoding="utf-8") as f:
        f.write("\n" + content + "\n")

# 1. test_courts.py
court_tests = """
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
"""

# 2. test_time_slots.py
time_slot_tests = """
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
"""

# 3. test_bookings.py
booking_tests = """
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
    assert res.status_code == 200

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
        res = client.post("/bookings/", json=payload, headers=headers)
        results.append(res.status_code)
        
    t1 = threading.Thread(target=book)
    t2 = threading.Thread(target=book)
    
    t1.start()
    t2.start()
    t1.join()
    t2.join()
    
    assert results.count(200) == 1
    assert results.count(409) == 1
"""

append_to_file("c:/Users/HP/OneDrive/Desktop/DỰ ÁN NHÓM 14/backend/tests/test_courts.py", court_tests)
append_to_file("c:/Users/HP/OneDrive/Desktop/DỰ ÁN NHÓM 14/backend/tests/test_time_slots.py", time_slot_tests)
append_to_file("c:/Users/HP/OneDrive/Desktop/DỰ ÁN NHÓM 14/backend/tests/test_bookings.py", booking_tests)

print("Done appending tests")
