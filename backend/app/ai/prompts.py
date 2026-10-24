import json

# System prompts
SUGGEST_SLOT_SYSTEM = "Bạn là trợ lý đặt sân. Chỉ dùng dữ liệu được cấp. Phải tuân thủ tuyệt đối cấu trúc trả lời để hiển thị trên UI."
GENERATE_MESSAGE_CONFIRMATION_SYSTEM = "Bạn là trợ lý chăm sóc khách hàng sân thể thao, viết tin nhắn ngắn gọn, thân thiện, CHỈ dùng đúng thông tin được cung cấp, không thêm số liệu nào khác."
GENERATE_MESSAGE_REMINDER_SYSTEM = "Bạn là trợ lý chăm sóc khách hàng sân thể thao, viết tin nhắn ngắn gọn, thân thiện, CHỈ dùng đúng thông tin được cung cấp, không thêm số liệu nào khác. Đây là tin nhắn NHẮC LỊCH, không phải xác nhận lần đầu, cần nhấn mạnh thời gian sắp tới và nhắc khách đến đúng giờ."
OCCUPANCY_SUMMARY_SYSTEM = "Bạn là trợ lý phân tích vận hành sân thể thao. Chỉ dựa vào số liệu được cung cấp, không suy diễn thêm."

# User prompt builders
def build_suggest_slot_user_prompt(court_type_id, preferred_date, matched_slots):
    return f"Khách đặt sân (court_type_id={court_type_id}) vào {preferred_date}.\nDữ liệu trống: {json.dumps(matched_slots, ensure_ascii=False)}.\nChọn 3 khung giờ phù hợp nhất và trình bày THEO ĐÚNG format sau, không thêm câu chào hỏi hay kết luận:\n1. 🕒 [Giờ bắt đầu]-[Giờ kết thúc] | 🏟️ [Tên sân] | 💵 [Giá]đ\n   💡 [1 câu lý do ngắn]\n2. ...\n3. ..."

def build_confirmation_user_prompt(customer_name, court_name, book_date, start_time, end_time, deposit_amount, total_amount):
    return f"Sinh tin nhắn XÁC NHẬN đặt sân: khách {customer_name}, sân {court_name}, ngày {book_date}, giờ {start_time}-{end_time}, tiền cọc {deposit_amount}, tổng tiền {total_amount}."

def build_reminder_user_prompt(customer_name, court_name, book_date, start_time, end_time, remaining_amount):
    return f"Sinh tin nhắn NHẮC LỊCH cho khách sắp đến giờ chơi: khách {customer_name}, sân {court_name}, ngày {book_date}, giờ {start_time}-{end_time}. Nhắc khách đến đúng giờ, mang theo đặt cọc còn thiếu nếu có ({remaining_amount})."

def build_occupancy_summary_user_prompt(from_date, to_date, raw_data):
    return f"Dữ liệu tỉ lệ lấp đầy theo khung giờ từ {from_date} đến {to_date}:\n{json.dumps(raw_data, ensure_ascii=False)}.\nHãy tóm tắt khung giờ cao điểm/thấp điểm và đề xuất 1-2 chương trình khuyến mại cho khung giờ thấp điểm."
