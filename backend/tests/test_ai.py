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

@patch("app.ai.gemini_client.genai")
def test_suggest_slot_ai_timeout_uses_fallback(mock_genai):
    import google.api_core.exceptions
    import unittest
    
    mock_instance = unittest.mock.MagicMock()
    mock_instance.generate_content.side_effect = google.api_core.exceptions.DeadlineExceeded("Timeout")
    mock_genai.GenerativeModel.return_value = mock_instance
    
    headers = get_auth_headers()
    with patch("app.ai.gemini_client.settings.GEMINI_API_KEY", "dummy"):
        payload = {
            "court_type_id": 1,
            "preferred_date": "2026-09-03" # has slot1 available
        }
        response = client.post("/ai/suggest-slot", json=payload, headers=headers)
        
    assert response.status_code == 200
    data = response.json()
    assert data["is_fallback"] is True
    assert len(data["matched_slots"]) > 0
    assert "Gợi ý dự phòng" in data["message"]
    assert "khung giờ trống phù hợp" in data["suggestions_text"]

@patch("app.ai.gemini_client.generate")
def test_suggest_slot_success_no_fallback(mock_generate):
    mock_generate.return_value = "1. 🕒 18:00-19:00 | 🏟️ Sân AI 1 | 💵 150,000đ\n   💡 Khung giờ vàng."
    headers = get_auth_headers()
    payload = {
        "court_type_id": 1,
        "preferred_date": "2026-09-03"
    }
    response = client.post("/ai/suggest-slot", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["is_fallback"] is False
    assert len(data["matched_slots"]) == 1
    assert data["matched_slots"][0]["slot_id"] == 1
    assert data["matched_slots"][0]["court_name"] == "Sân AI 1"
    assert data["matched_slots"][0]["price"] == 150000.0
    assert data["message"] == "Thành công"
    assert "18:00-19:00" in data["suggestions_text"]

@patch("app.ai.gemini_client.generate")
def test_suggest_slot_booked_and_blocked_slots_excluded(mock_generate):
    """Xác minh slot đã bị booked (slot 2, slot 4) hoặc blocked (slot 3) không bao giờ được gợi ý."""
    headers = get_auth_headers()
    payload = {
        "court_type_id": 1,
        "preferred_date": "2026-09-03"
    }
    response = client.post("/ai/suggest-slot", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    suggested_slot_ids = [s["slot_id"] for s in data["matched_slots"]]
    assert 2 not in suggested_slot_ids  # slot 2 is booked (booking confirmed)
    assert 3 not in suggested_slot_ids  # slot 3 is blocked
    assert 4 not in suggested_slot_ids  # slot 4 is booked (booking pending)
    assert 1 in suggested_slot_ids      # slot 1 is available

@patch("app.ai.gemini_client.generate")
def test_suggest_slot_wrong_court_type_or_date_or_time_excluded(mock_generate):
    """Xác minh sai loại sân, sai ngày hoặc ngoài khoảng giờ đều trả về danh sách rỗng."""
    headers = get_auth_headers()
    
    # 1. Sai loại sân
    res1 = client.post("/ai/suggest-slot", json={"court_type_id": 999, "preferred_date": "2026-09-03"}, headers=headers)
    assert res1.status_code == 200
    assert res1.json()["matched_slots"] == []
    assert res1.json()["message"] == "Hiện không còn khung giờ trống phù hợp"

    # 2. Sai ngày
    res2 = client.post("/ai/suggest-slot", json={"court_type_id": 1, "preferred_date": "2026-12-31"}, headers=headers)
    assert res2.status_code == 200
    assert res2.json()["matched_slots"] == []

    # 3. Ngoài khoảng giờ (slot 1 là 18:00-19:00, tìm từ 20:00 trở đi)
    res3 = client.post("/ai/suggest-slot", json={
        "court_type_id": 1,
        "preferred_date": "2026-09-03",
        "preferred_start_time": "20:00:00"
    }, headers=headers)
    assert res3.status_code == 200
    assert res3.json()["matched_slots"] == []

@patch("app.ai.gemini_client.generate")
def test_suggest_slot_maintenance_court_excluded(mock_generate):
    """Xác minh sân đang có lịch bảo trì vào preferred_date sẽ bị loại trừ."""
    db = TestingSessionLocal()
    from app.models.maintenance_schedule import MaintenanceSchedule
    # Thêm lịch bảo trì cho sân 1 vào ngày 2026-09-03
    maint = MaintenanceSchedule(court_id=1, start_date=date(2026, 9, 1), end_date=date(2026, 9, 5), status="in_progress", reason="Bảo trì mặt cỏ")
    db.add(maint)
    db.commit()
    
    headers = get_auth_headers()
    try:
        response = client.post("/ai/suggest-slot", json={"court_type_id": 1, "preferred_date": "2026-09-03"}, headers=headers)
        assert response.status_code == 200
        assert response.json()["matched_slots"] == []
        assert response.json()["message"] == "Hiện không còn khung giờ trống phù hợp"
    finally:
        db.delete(maint)
        db.commit()
        db.close()

@patch("app.ai.gemini_client.generate")
def test_suggest_slot_hallucinated_slot_discarded(mock_generate):
    """Xác minh slot do Gemini tự bịa ra (không tồn tại trong DB) bị loại bỏ hoàn toàn."""
    # Gemini sinh 1 slot thật (18:00-19:00) và 1 slot ảo (23:00-24:00 Sân Ảo)
    mock_generate.return_value = (
        "1. 🕒 18:00-19:00 | 🏟️ Sân AI 1 | 💵 150,000đ\n"
        "   💡 Slot có thật trong DB.\n"
        "2. 🕒 23:00-24:00 | 🏟️ Sân Ảo Bịa | 💵 500,000đ\n"
        "   💡 Slot bịa không có trong DB."
    )
    headers = get_auth_headers()
    payload = {
        "court_type_id": 1,
        "preferred_date": "2026-09-03"
    }
    response = client.post("/ai/suggest-slot", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["matched_slots"]) == 1
    assert data["matched_slots"][0]["slot_id"] == 1
    # Slot ảo 23:00-24:00 không xuất hiện trong matched_slots hoặc text
    assert "23:00-24:00" not in data["suggestions_text"]
    assert "Sân Ảo Bịa" not in data["suggestions_text"]

@patch("app.ai.gemini_client.generate")
def test_suggest_slot_enforces_database_price_and_names(mock_generate):
    """Xác minh giá tiền và tên sân trong gợi ý luôn lấy từ bản ghi database, không tin số liệu model bịa."""
    # Gemini sinh giá 999,999đ và tên sai
    mock_generate.return_value = (
        "1. 🕒 18:00-19:00 | 🏟️ Tên AI Tự Nghĩ | 💵 999,999đ\n"
        "   💡 Lý do."
    )
    headers = get_auth_headers()
    payload = {
        "court_type_id": 1,
        "preferred_date": "2026-09-03"
    }
    response = client.post("/ai/suggest-slot", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["matched_slots"][0]["price"] == 150000.0
    assert data["matched_slots"][0]["court_name"] == "Sân AI 1"
    assert "150,000đ" in data["suggestions_text"]
    assert "999,999" not in data["suggestions_text"]

@patch("app.ai.gemini_client.generate")
def test_suggest_slot_unparseable_ai_response_triggers_fallback(mock_generate):
    """Xác minh khi Gemini trả về văn bản không chứa khung giờ hợp lệ, hệ thống tự động fallback về DB thật."""
    mock_generate.return_value = "Xin chào, tôi là trợ lý ảo nhưng hôm nay tôi không thể tìm được khung giờ nào cho bạn."
    headers = get_auth_headers()
    payload = {
        "court_type_id": 1,
        "preferred_date": "2026-09-03"
    }
    response = client.post("/ai/suggest-slot", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["is_fallback"] is True
    assert "Gợi ý dự phòng từ hệ thống" in data["message"]
    assert len(data["matched_slots"]) == 1
    assert data["matched_slots"][0]["slot_id"] == 1
    assert "📌 Khung giờ thực tế còn trống trong hệ thống" in data["suggestions_text"]

def test_booking_conflict_on_unavailable_slot_prevented():
    """Xác minh cơ chế ngăn đặt trùng booking trên slot không khả dụng (slot 2 đã có booking)."""
    headers = get_auth_headers()
    booking_payload = {
        "customer_id": 1,
        "court_id": 1,
        "time_slot_id": 2,  # slot 2 is booked
        "deposit_amount": 0.0,
        "note": "Đặt trùng thử nghiệm"
    }

    # Đặt trên slot 2 -> Xảy ra xung đột (409 Conflict)
    res = client.post("/bookings/", json=booking_payload, headers=headers)
    assert res.status_code == 409
    assert "Khung giờ vừa được đặt" in res.json()["detail"]

