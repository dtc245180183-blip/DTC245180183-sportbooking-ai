def append_tests(filepath):
    tests = """
@patch("google.generativeai.GenerativeModel.generate_content")
def test_suggest_slot_ai_returns_empty(mock_gen_content):
    class MockResponse:
        @property
        def text(self):
            return "   "
    mock_gen_content.return_value = MockResponse()
    headers = get_auth_headers()
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
"""
    with open(filepath, "a", encoding="utf-8") as f:
        f.write("\n" + tests + "\n")

append_tests("c:/Users/HP/OneDrive/Desktop/DỰ ÁN NHÓM 14/backend/tests/test_ai.py")
