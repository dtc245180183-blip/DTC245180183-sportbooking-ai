def append_tests(filepath):
    tests = """
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
    assert "Hệ thống AI đang quá tải" in response.json()["detail"]
"""
    with open(filepath, "a", encoding="utf-8") as f:
        f.write("\n" + tests + "\n")

append_tests("c:/Users/HP/OneDrive/Desktop/DỰ ÁN NHÓM 14/backend/tests/test_ai.py")
