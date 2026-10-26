import json

# System prompts
SUGGEST_SLOT_SYSTEM = "Bạn là trợ lý đặt sân. Chỉ dùng dữ liệu được cấp. Phải tuân thủ tuyệt đối cấu trúc trả lời để hiển thị trên UI."
GENERATE_MESSAGE_CONFIRMATION_SYSTEM = (
    "Bạn là trợ lý chăm sóc khách hàng sân thể thao chuyên nghiệp. "
    "Viết tin nhắn xác nhận đặt sân ngắn gọn, thân thiện, lịch sự, CHỈ dùng đúng thông tin được cung cấp, không thêm bớt số liệu. "
    "QUY TẮC TIỀN TỆ: Bắt buộc viết đúng định dạng tiền tệ VNĐ có dấu chấm phân cách hàng nghìn và kèm chữ 'đ' hoặc 'VNĐ' (ví dụ: 50.000đ, 150.000đ), tuyệt đối không viết số dạng thập phân như 50000.0."
)
GENERATE_MESSAGE_REMINDER_SYSTEM = (
    "Bạn là trợ lý chăm sóc khách hàng sân thể thao chuyên nghiệp. "
    "Viết tin nhắn NHẮC LỊCH THI ĐẤU ngắn gọn, thân thiện, lịch sự. "
    "Đây là tin nhắn nhắc lịch khi sắp đến giờ thi đấu, nhấn mạnh thời gian sắp tới và nhắc khách đến đúng giờ trước 10-15 phút. "
    "QUY TẮC TÌNH TRẠNG THANH TOÁN: Nếu số tiền còn lại cần thanh toán > 0, bắt buộc phải nêu rõ số tiền còn lại khách cần thanh toán khi đến sân (dùng cụm từ 'số tiền còn lại cần thanh toán'), TUYỆT ĐỐI KHÔNG được nói là 'đã thanh toán đủ 100%'. "
    "QUY TẮC TIỀN TỆ: Bắt buộc viết đúng định dạng tiền tệ VNĐ có dấu chấm phân cách hàng nghìn và kèm chữ 'đ' hoặc 'VNĐ' (ví dụ: 25.000đ, 50.000đ), tuyệt đối không viết số dạng thập phân như 25000.0 hay số trần."
)
OCCUPANCY_SUMMARY_SYSTEM = "Bạn là trợ lý phân tích vận hành sân thể thao. Chỉ dựa vào số liệu được cung cấp, không suy diễn thêm."

def format_vnd(amount) -> str:
    """Format any number or float to standard Vietnamese currency string (e.g. 50.000đ)."""
    try:
        val = int(round(float(amount or 0)))
        return f"{val:,}đ".replace(",", ".")
    except (ValueError, TypeError):
        return "0đ"

# User prompt builders
def build_suggest_slot_user_prompt(court_type_id, preferred_date, matched_slots, booked_slots=None):
    prompt = f"Khách đặt sân (court_type_id={court_type_id}) vào {preferred_date}.\nDữ liệu khung giờ còn trống: {json.dumps(matched_slots, ensure_ascii=False)}.\n"
    if booked_slots:
        prompt += f"Dữ liệu khung giờ đã có người đặt: {json.dumps(booked_slots, ensure_ascii=False)}.\n"
    prompt += "Chọn tối đa 3 khung giờ trống phù hợp nhất từ danh sách 'Dữ liệu khung giờ còn trống' và trình bày THEO ĐÚNG format sau, không thêm câu chào hỏi hay kết luận:\n1. 🕒 [Giờ bắt đầu]-[Giờ kết thúc] | 🏟️ [Tên sân] | 💵 [Giá]đ\n   💡 [1 câu lý do ngắn]\n2. ...\n3. ..."
    return prompt

def build_confirmation_user_prompt(customer_name, court_name, book_date, start_time, end_time, deposit_amount, total_amount):
    deposit_str = format_vnd(deposit_amount)
    total_str = format_vnd(total_amount)
    return (
        f"Sinh tin nhắn XÁC NHẬN ĐẶT SÂN gửi khách hàng {customer_name}: "
        f"Sân: {court_name}, Ngày: {book_date}, Giờ thi đấu: {start_time}-{end_time}, "
        f"Tiền cọc: {deposit_str}, Tổng tiền sân: {total_str}. "
        f"YÊU CẦU ĐỊNH DẠNG TIỀN TỆ: Mọi số tiền trong tin nhắn bắt buộc phải viết chuẩn định dạng VNĐ (ví dụ: {deposit_str}, {total_str}), tuyệt đối KHÔNG viết số thập phân dạng .0 (như 50000.0) hay số trần."
    )

def build_reminder_user_prompt(customer_name, court_name, book_date, start_time, end_time, remaining_amount, deposit_amount=0, total_amount=0):
    try:
        rem_val = float(remaining_amount or 0)
    except (ValueError, TypeError):
        rem_val = 0.0

    dep_val = float(deposit_amount or 0)
    tot_val = float(total_amount or 0)

    if rem_val <= 0:
        payment_clause = f"Đơn đặt sân đã thanh toán đủ 100% ({format_vnd(tot_val)}), không cần thu thêm số tiền nào."
    else:
        rem_str = format_vnd(rem_val)
        dep_str = format_vnd(dep_val)
        tot_str = format_vnd(tot_val)
        if dep_val > 0:
            payment_clause = f"Tình trạng thanh toán: Khách đã đặt cọc trước {dep_str} / Tổng tiền sân {tot_str}. Bắt buộc nhắc khách số tiền còn lại cần thanh toán khi đến sân là {rem_str} (tuyệt đối KHÔNG nói đã thanh toán 100% hay còn thiếu 0đ)."
        else:
            payment_clause = f"Tình trạng thanh toán: Tổng tiền sân là {tot_str}. Nhắc khách số tiền cần thanh toán là {rem_str} khi đến sân."

    return (
        f"Sinh tin nhắn NHẮC LỊCH THI ĐẤU gửi khách hàng {customer_name}: "
        f"Sân: {court_name}, Ngày: {book_date}, Khung giờ: {start_time}-{end_time}. "
        f"Nhắc khách đến đúng giờ trước 10-15 phút để chuẩn bị. {payment_clause} "
        f"YÊU CẦU ĐỊNH DẠNG TIỀN TỆ: Mọi số tiền trong tin nhắn bắt buộc phải viết chuẩn định dạng VNĐ (ví dụ: 25.000đ, 50.000đ), tuyệt đối KHÔNG viết số thập phân dạng .0 hay số trần."
    )

def build_occupancy_summary_user_prompt(from_date, to_date, raw_data):
    return f"Dữ liệu tỉ lệ lấp đầy theo khung giờ từ {from_date} đến {to_date}:\n{json.dumps(raw_data, ensure_ascii=False)}.\nHãy tóm tắt khung giờ cao điểm/thấp điểm và đề xuất 1-2 chương trình khuyến mại cho khung giờ thấp điểm."
