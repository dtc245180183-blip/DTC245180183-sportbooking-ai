import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models.court_type import CourtType
from app.models.court import Court
from app.models.time_slot import TimeSlot
from app.models.customer import Customer
from app.models.user import User
from app.models.booking import Booking
from app.models.payment import Payment
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
    
    # Init data
    user = User(username="admin_ai", full_name="Admin AI", role="admin", password_hash=hash_password("123"))
    customer = Customer(full_name="Khach Hang AI", phone="0901234568")
    court_type = CourtType(name="Sân AI", description="...")
    db.add_all([user, customer, court_type])
    db.commit()
    
    court = Court(name="Sân AI 1", court_type_id=court_type.id, price_per_hour=150000)
    db.add(court)
    db.commit()
    
    # Slot 1: available
    slot1 = TimeSlot(court_id=court.id, date=date(2026, 9, 3), start_time=dt_time(18, 0), end_time=dt_time(19, 0), status="available")
    # Slot 2: booked
    slot2 = TimeSlot(court_id=court.id, date=date(2026, 9, 3), start_time=dt_time(19, 0), end_time=dt_time(20, 0), status="booked")
    # Slot 3: blocked
    slot3 = TimeSlot(court_id=court.id, date=date(2026, 9, 3), start_time=dt_time(20, 0), end_time=dt_time(21, 0), status="blocked")
    # Slot 4: available (for booking 3)
    slot4 = TimeSlot(court_id=court.id, date=date(2026, 9, 3), start_time=dt_time(21, 0), end_time=dt_time(22, 0), status="booked")
    db.add_all([slot1, slot2, slot3, slot4])
    db.commit()
    
    # Booking 1: confirmed (for reminder)
    booking1 = Booking(customer_id=customer.id, court_id=court.id, time_slot_id=slot2.id, staff_id=user.id, deposit_amount=50000, total_amount=150000, status="confirmed")
    # Booking 2: cancelled
    booking2 = Booking(customer_id=customer.id, court_id=court.id, time_slot_id=slot1.id, staff_id=user.id, deposit_amount=0, total_amount=150000, status="cancelled")
    # Booking 3: pending (cannot reminder)
    booking3 = Booking(customer_id=customer.id, court_id=court.id, time_slot_id=slot4.id, staff_id=user.id, deposit_amount=0, total_amount=150000, status="pending")
    
    db.add_all([booking1, booking2, booking3])
    db.commit()
    
    # Payment for booking 1 (Paid 50k)
    payment = Payment(booking_id=booking1.id, amount=50000, method="cash", status="paid")
    db.add(payment)
    db.commit()
    
    yield
    db.close()
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()

def get_auth_headers():
    token = create_access_token({"user_id": 1, "username": "admin_ai", "role": "admin"})
    return {"Authorization": f"Bearer {token}"}

@patch("app.ai.gemini_client.generate")
def test_suggest_slot_no_available(mock_generate):
    headers = get_auth_headers()
    payload = {
        "court_type_id": 1,
        "preferred_date": "2026-09-04"
    }
    response = client.post("/ai/suggest-slot", json=payload, headers=headers)
    assert response.status_code == 200
    assert mock_generate.call_count == 0

@patch("app.ai.gemini_client.generate")
def test_suggest_slot_with_available(mock_generate):
    mock_generate.return_value = "Đây là gợi ý từ AI."
    headers = get_auth_headers()
    payload = {
        "court_type_id": 1,
        "preferred_date": "2026-09-03"
    }
    response = client.post("/ai/suggest-slot", json=payload, headers=headers)
    assert response.status_code == 200
    assert mock_generate.call_count == 1

@patch("app.ai.gemini_client.generate")
def test_generate_message_not_found(mock_generate):
    headers = get_auth_headers()
    response = client.post("/ai/generate-message/999?message_type=confirmation", headers=headers)
    assert response.status_code == 404
    assert mock_generate.call_count == 0

@patch("app.ai.gemini_client.generate")
def test_generate_message_cancelled_booking_confirmation(mock_generate):
    headers = get_auth_headers()
    # Booking ID 2 is cancelled
    response = client.post("/ai/generate-message/2?message_type=confirmation", headers=headers)
    assert response.status_code == 400
    assert "Không thể sinh tin nhắn xác nhận" in response.json()["detail"]
    assert mock_generate.call_count == 0

@patch("app.ai.gemini_client.generate")
def test_generate_message_success_confirmation(mock_generate):
    mock_generate.return_value = "Xác nhận đặt sân thành công."
    headers = get_auth_headers()
    # Booking 3 is pending, can send confirmation
    response = client.post("/ai/generate-message/3?message_type=confirmation", headers=headers) 
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Xác nhận đặt sân thành công."
    assert data["message_type"] == "confirmation"
    assert mock_generate.call_count == 1

@patch("app.ai.gemini_client.generate")
def test_generate_message_pending_booking_reminder(mock_generate):
    headers = get_auth_headers()
    # Booking 3 is pending, cannot send reminder
    response = client.post("/ai/generate-message/3?message_type=reminder", headers=headers)
    assert response.status_code == 400
    assert "Chỉ sinh tin nhắn nhắc lịch cho booking đã xác nhận" in response.json()["detail"]
    assert mock_generate.call_count == 0

@patch("app.ai.gemini_client.generate")
def test_generate_message_success_reminder(mock_generate):
    mock_generate.return_value = "Nhắc lịch đặt sân."
    headers = get_auth_headers()
    # Booking 1 is confirmed, can send reminder
    response = client.post("/ai/generate-message/1?message_type=reminder", headers=headers) 
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Nhắc lịch đặt sân."
    assert data["message_type"] == "reminder"
    assert mock_generate.call_count == 1

@patch("app.ai.gemini_client.generate")
def test_occupancy_summary_invalid_date(mock_generate):
    headers = get_auth_headers()
    response = client.get("/ai/occupancy-summary?from_date=2026-09-05&to_date=2026-09-01", headers=headers)
    assert response.status_code == 400
    assert mock_generate.call_count == 0

@patch("app.ai.gemini_client.generate")
def test_occupancy_summary_empty_data(mock_generate):
    headers = get_auth_headers()
    response = client.get("/ai/occupancy-summary?from_date=2026-09-10&to_date=2026-09-11", headers=headers)
    assert response.status_code == 200
    assert mock_generate.call_count == 0

@patch("app.ai.gemini_client.generate")
def test_occupancy_summary_success(mock_generate):
    mock_generate.return_value = "Tóm tắt: cao điểm lúc 19:00."
    headers = get_auth_headers()
    response = client.get("/ai/occupancy-summary?from_date=2026-09-03&to_date=2026-09-03", headers=headers)
    assert response.status_code == 200
    assert mock_generate.call_count == 1
@patch("app.ai.gemini_client.genai")
def test_suggest_slot_ai_returns_empty(mock_genai):
    class MockResponse:
        @property
        def text(self):
            return "   "
            
    import unittest
    mock_instance = unittest.mock.MagicMock()
    mock_instance.generate_content.return_value = MockResponse()
    mock_genai.GenerativeModel.return_value = mock_instance
    
    headers = get_auth_headers()
    
    with patch("app.ai.gemini_client.settings.GEMINI_API_KEY", "dummy"):
        payload = {
            "court_type_id": 1,
            "preferred_date": "2026-09-03" # has slot1 available from setup_db
        }
        response = client.post("/ai/suggest-slot", json=payload, headers=headers)
    assert response.status_code == 502
    assert "AI không sinh được nội dung phù hợp" in response.json()["detail"]

@patch("app.ai.gemini_client.generate")
def test_suggest_slot_limits_to_20_slots(mock_generate):
    mock_generate.return_value = "Success"
    headers = get_auth_headers()
    
    # Tạo 30 slot
    db = TestingSessionLocal()
    for i in range(30):
        # Tránh lỗi duplicate hoặc validation nếu có, nhưng SQLite auto increment id, court_id=1, date=2030-01-01
        slot = TimeSlot(court_id=1, date=date(2030, 1, 1), start_time=dt_time(i % 24, 0), end_time=dt_time((i+1)%24, 0), status="available")
        db.add(slot)
    db.commit()
    db.close()
    
    payload = {
        "court_type_id": 1,
        "preferred_date": "2030-01-01"
    }
    response = client.post("/ai/suggest-slot", json=payload, headers=headers)
    assert response.status_code == 200
    
    user_prompt = mock_generate.call_args[0][1]
    assert user_prompt.count("slot_id") == 20

@patch("app.ai.gemini_client.generate")
def test_occupancy_summary_date_range_too_long(mock_generate):
    headers = get_auth_headers()
    response = client.get("/ai/occupancy-summary?from_date=2026-01-01&to_date=2026-02-15", headers=headers)
    assert response.status_code == 400
    assert "vượt quá 30 ngày" in response.json()["detail"]
    assert mock_generate.call_count == 0


@patch("app.ai.gemini_client.generate")
def test_suggest_slot_with_very_long_slot_list(mock_generate):
    mock_generate.return_value = "Success"
    headers = get_auth_headers()
    
    # Tạo 100 slot
    db = TestingSessionLocal()
    for i in range(100):
        # Chọn ngày khác để không đụng slot cũ
        slot = TimeSlot(court_id=1, date=date(2040, 1, 1), start_time=dt_time(i % 24, 0), end_time=dt_time((i+1)%24, 0), status="available")
        db.add(slot)
    db.commit()
    db.close()
    
    payload = {
        "court_type_id": 1,
        "preferred_date": "2040-01-01"
    }
    response = client.post("/ai/suggest-slot", json=payload, headers=headers)
    assert response.status_code == 200
    
    user_prompt = mock_generate.call_args[0][1]
    # Kiểm tra xem AI chỉ nhận được 20 slot thay vì 100
    assert user_prompt.count("slot_id") == 20

@patch("app.ai.gemini_client.genai")
def test_generate_message_ai_returns_empty(mock_genai):
    class MockResponse:
        @property
        def text(self):
            return ""
            
    import unittest
    mock_instance = unittest.mock.MagicMock()
    mock_instance.generate_content.return_value = MockResponse()
    mock_genai.GenerativeModel.return_value = mock_instance
    
    headers = get_auth_headers()
    with patch("app.ai.gemini_client.settings.GEMINI_API_KEY", "dummy"):
        # Booking 1 is confirmed, can send reminder
        response = client.post("/ai/generate-message/1?message_type=reminder", headers=headers) 
    assert response.status_code == 502
    assert "AI không sinh được nội dung phù hợp" in response.json()["detail"]

@patch("app.ai.gemini_client.genai")
def test_occupancy_summary_ai_timeout(mock_genai):
    import google.api_core.exceptions
    import unittest
    
    mock_instance = unittest.mock.MagicMock()
    mock_instance.generate_content.side_effect = google.api_core.exceptions.DeadlineExceeded("Timeout")
    mock_genai.GenerativeModel.return_value = mock_instance
    
    headers = get_auth_headers()
    with patch("app.ai.gemini_client.settings.GEMINI_API_KEY", "dummy"):
        response = client.get("/ai/occupancy-summary?from_date=2026-09-03&to_date=2026-09-03", headers=headers)
    
    assert response.status_code == 503
    assert "Dịch vụ AI hiện đang quá tải hoặc không thể kết nối, vui lòng thử lại sau." in response.json()["detail"]

