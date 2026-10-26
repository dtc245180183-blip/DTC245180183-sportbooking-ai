import json
import time
import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date

from app.database import get_db
from app.models.time_slot import TimeSlot
from app.models.court import Court
from app.models.booking import Booking
from app.models.customer import Customer
from app.models.payment import Payment
from app.schemas.ai import SuggestSlotRequest, SuggestSlotResponse, GenerateMessageResponse, OccupancySummaryResponse
from app.dependencies import get_current_user, require_admin
from app.core.config import settings
from app.ai import gemini_client
from app.services import ai_log_service
from app.ai.prompts import (
    SUGGEST_SLOT_SYSTEM, GENERATE_MESSAGE_CONFIRMATION_SYSTEM, GENERATE_MESSAGE_REMINDER_SYSTEM, OCCUPANCY_SUMMARY_SYSTEM,
    build_suggest_slot_user_prompt, build_confirmation_user_prompt, build_reminder_user_prompt, build_occupancy_summary_user_prompt
)

router = APIRouter(prefix="/ai", tags=["ai"])

import logging
logger = logging.getLogger(__name__)

def _build_fallback_suggestion(request: SuggestSlotRequest, matched_slots: list, booked_slots: list = None) -> str:
    lines = []
    count = min(3, len(matched_slots))
    if matched_slots:
        lines.append(f"Dưới đây là {count} khung giờ trống phù hợp nhất được rà soát trực tiếp từ hệ thống:")
        for i, s in enumerate(matched_slots[:count], 1):
            price_val = int(s['price']) if s.get('price') is not None else 0
            price_str = f"{price_val:,}đ"
            lines.append(f"{i}. 🕒 {s['start_time']}-{s['end_time']} | 🏟️ {s['court_name']} | 💵 {price_str}")
            lines.append(f"   📌 Khung giờ thực tế còn trống trong hệ thống, sẵn sàng phục vụ.")
    else:
        lines.append("Hiện không còn khung giờ trống phù hợp trong khoảng thời gian này.")

    if booked_slots:
        lines.append("")
        lines.append("⚠️ Lưu ý khung giờ đã có người đặt:")
        for b in booked_slots[:3]:
            lines.append(f"• 🔒 {b['start_time']}-{b['end_time']} | 🏟️ {b['court_name']} | Đã có khách đặt ({b['customer_name']})")

    return "\n".join(lines)

def _reconcile_gemini_slots(output_text: str, candidate_slots: list, request: SuggestSlotRequest, booked_slots: list = None) -> tuple[list, str, bool]:
    """
    Đối chiếu kết quả của Gemini với danh sách ứng viên thực tế từ database.
    - Loại bỏ hoàn toàn slot ảo do AI bịa ra (không có trong candidate_slots).
    - Ép thông tin sân, thời gian và giá tiền 100% theo bản ghi database.
    - Giữ nguyên lời giải thích riêng biệt (💡 ...) của Gemini cho từng khung giờ.
    - Trả về (reconciled_slots, formatted_text, is_valid) để phân biệt kết quả Gemini hợp lệ và parse failure.
    """
    if not output_text or not candidate_slots:
        fallback_text = _build_fallback_suggestion(request, candidate_slots, booked_slots)
        return candidate_slots[:3], fallback_text, False

    import re
    time_pattern = re.compile(r"(\b\d{1,2}:\d{2}\b)\s*[-–—]\s*(\b\d{1,2}:\d{2}\b)")
    
    all_time_matches = time_pattern.findall(output_text)
    if not all_time_matches:
        fallback_text = _build_fallback_suggestion(request, candidate_slots, booked_slots)
        return candidate_slots[:3], fallback_text, False

    lines = output_text.strip().split("\n")
    reconciled_slots = []
    seen_slot_ids = set()
    sanitized_blocks = []
    
    current_block = []
    current_matched_slot = None

    def flush_block():
        nonlocal current_block, current_matched_slot
        if current_matched_slot and current_block:
            sanitized_blocks.append(current_block)
        current_block = []
        current_matched_slot = None

    for line in lines:
        match = time_pattern.search(line)
        if match:
            flush_block()
            st, et = match.group(1), match.group(2)
            matches = [
                s for s in candidate_slots
                if s["start_time"] == st and s["end_time"] == et
            ]
            
            chosen = None
            if len(matches) == 1:
                chosen = matches[0]
            elif len(matches) > 1:
                court_matches = [s for s in matches if s["court_name"].lower() in line.lower()]
                chosen = court_matches[0] if court_matches else matches[0]

            if chosen and chosen["slot_id"] not in seen_slot_ids:
                seen_slot_ids.add(chosen["slot_id"])
                reconciled_slots.append(chosen)
                current_matched_slot = chosen
                
                # Ép giá tiền, tên sân và thời gian theo đúng bản ghi database
                price_val = int(chosen['price']) if chosen.get('price') is not None else 0
                price_str = f"{price_val:,}đ"
                prefix_match = re.match(r"^(\s*\d+[\.\)]|\s*[-*•])", line)
                prefix = prefix_match.group(1) + " " if prefix_match else f"{len(reconciled_slots)}. "
                verified_line = f"{prefix}🕒 {chosen['start_time']}-{chosen['end_time']} | 🏟️ {chosen['court_name']} | 💵 {price_str}"
                current_block.append(verified_line)
            else:
                # Loại bỏ slot ảo / không tồn tại trong DB
                current_matched_slot = None
        else:
            if current_matched_slot:
                current_block.append(line)
            elif not seen_slot_ids and line.strip():
                sanitized_blocks.append([line])

    flush_block()

    if not reconciled_slots:
        fallback_text = _build_fallback_suggestion(request, candidate_slots)
        return candidate_slots[:3], fallback_text, False

    sanitized_text_lines = []
    for block in sanitized_blocks:
        sanitized_text_lines.extend(block)
        
    return reconciled_slots[:3], "\n".join(sanitized_text_lines), True

@router.post("/suggest-slot", response_model=SuggestSlotResponse)
def suggest_slot(request: SuggestSlotRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # 1. Lấy danh sách ID các sân có lịch bảo trì trùng ngày preferred_date
    from app.models.maintenance_schedule import MaintenanceSchedule
    maintenance_court_ids = [
        row[0] for row in db.query(MaintenanceSchedule.court_id).filter(
            MaintenanceSchedule.status.in_(["planned", "scheduled", "in_progress"]),
            MaintenanceSchedule.start_date <= request.preferred_date,
            request.preferred_date <= MaintenanceSchedule.end_date
        ).all()
    ]

    # 2. Lấy danh sách slot_id đang có booking hợp lệ (chưa bị hủy: pending, confirmed, completed)
    occupied_slot_ids = [
        row[0] for row in db.query(Booking.time_slot_id).filter(
            Booking.status.in_(["pending", "confirmed", "completed"])
        ).all()
    ]

    # Truy vấn danh sách khung giờ đã có người đặt trên loại sân này vào ngày này
    booked_slots_query = db.query(TimeSlot, Court, Booking)\
        .join(Court, TimeSlot.court_id == Court.id)\
        .join(Booking, Booking.time_slot_id == TimeSlot.id)\
        .filter(Court.court_type_id == request.court_type_id)\
        .filter(TimeSlot.date == request.preferred_date)\
        .filter(Booking.status.in_(["pending", "confirmed", "completed"]))

    if request.preferred_start_time:
        booked_slots_query = booked_slots_query.filter(TimeSlot.start_time >= request.preferred_start_time)
    if request.preferred_end_time:
        end_time_boundary = request.preferred_end_time.replace(microsecond=999999) if request.preferred_end_time.microsecond == 0 else request.preferred_end_time
        booked_slots_query = booked_slots_query.filter(TimeSlot.end_time <= end_time_boundary)

    booked_results = booked_slots_query.order_by(TimeSlot.start_time).limit(10).all()

    booked_slots_data = []
    for slot, court, booking in booked_results:
        cust_name = booking.customer.full_name if booking.customer else "Khách đặt"
        booked_slots_data.append({
            "slot_id": slot.id,
            "court_name": court.name,
            "start_time": slot.start_time.strftime("%H:%M"),
            "end_time": slot.end_time.strftime("%H:%M"),
            "booking_id": booking.id,
            "customer_name": cust_name,
            "status": booking.status,
            "status_label": "Đã có người đặt"
        })

    # 3. Query time_slots thực tế từ database (loại trừ sân bảo trì hoặc không active, slot booked hoặc blocked)
    query = db.query(TimeSlot, Court).join(Court, TimeSlot.court_id == Court.id)\
              .filter(Court.court_type_id == request.court_type_id)\
              .filter(Court.status == "active")\
              .filter(TimeSlot.date == request.preferred_date)\
              .filter(TimeSlot.status == "available")
              
    if maintenance_court_ids:
        query = query.filter(Court.id.not_in(maintenance_court_ids))

    if occupied_slot_ids:
        query = query.filter(TimeSlot.id.not_in(occupied_slot_ids))
              
    if request.preferred_start_time:
        query = query.filter(TimeSlot.start_time >= request.preferred_start_time)
    if request.preferred_end_time:
        end_time_boundary = request.preferred_end_time.replace(microsecond=999999) if request.preferred_end_time.microsecond == 0 else request.preferred_end_time
        query = query.filter(TimeSlot.end_time <= end_time_boundary)
        
    query = query.order_by(TimeSlot.start_time)
    results = query.limit(20).all()
    
    # 4. Không có slot nào hợp lệ trong database -> return ngay, không gọi AI
    if not results:
        booked_msg = ""
        if booked_slots_data:
            b_lines = [f"• 🔒 {b['start_time']}-{b['end_time']} | 🏟️ {b['court_name']} | Đã có khách đặt ({b['customer_name']})" for b in booked_slots_data[:3]]
            booked_msg = "\n\n⚠️ Lưu ý các khung giờ đã có người đặt:\n" + "\n".join(b_lines)
        return SuggestSlotResponse(
            suggestions_text=f"Hiện không còn khung giờ trống phù hợp trong khoảng thời gian này.{booked_msg}",
            matched_slots=[],
            booked_slots=booked_slots_data,
            message="Hiện không còn khung giờ trống phù hợp",
            is_fallback=False
        )
        
    candidate_slots = []
    for slot, court in results:
        candidate_slots.append({
            "slot_id": slot.id,
            "court_name": court.name,
            "start_time": slot.start_time.strftime("%H:%M"),
            "end_time": slot.end_time.strftime("%H:%M"),
            "price": float(court.price_per_hour)
        })
        
    # 5. Build prompt gửi danh sách candidate thật từ database cho Gemini
    system_prompt = SUGGEST_SLOT_SYSTEM
    user_prompt = build_suggest_slot_user_prompt(request.court_type_id, request.preferred_date, candidate_slots, booked_slots_data)
    
    # 6. Generate & Reconcile (với cơ chế Fallback an toàn khi AI timeout hoặc lỗi mạng)
    output_text = None
    call_ctx = gemini_client.GeminiCallContext()
    t_start = time.time()
    
    try:
        output_text = gemini_client.generate(system_prompt, user_prompt, timeout=12.0, context=call_ctx)
        reconciled_slots, formatted_output, is_gemini_valid = _reconcile_gemini_slots(output_text, candidate_slots, request, booked_slots_data)
        
        # Đảm bảo phần lưu ý các khung giờ đã có người đặt luôn được bổ sung rõ ràng
        if booked_slots_data:
            b_lines = [f"• 🔒 {b['start_time']}-{b['end_time']} | 🏟️ {b['court_name']} | Đã có khách đặt: {b['customer_name']}" + (f" (Đơn #{b['booking_id']})" if b.get('booking_id') else "") for b in booked_slots_data[:3]]
            formatted_output = formatted_output.rstrip() + "\n\n⚠️ Lưu ý khung giờ đã có người đặt:\n" + "\n".join(b_lines)

        if is_gemini_valid:
            elapsed = time.time() - t_start
            model_used = call_ctx.model_used or settings.GEMINI_MODEL
            logger.info(
                f"[UC10_SUCCESS] Model: {model_used} | Thời gian: {elapsed:.2f}s | "
                f"Số lần gọi: {call_ctx.attempts or 1} | Số khung giờ xác thực: {len(reconciled_slots)} | "
                f"Trạng thái: Hoàn toàn từ Gemini AI (kèm lý do riêng biệt cho từng khung giờ)"
            )
            ai_log_service.save_log(db, log_type="suggest_slot", input_data=request.model_dump(mode='json'), output_text=formatted_output)
            return SuggestSlotResponse(
                suggestions_text=formatted_output,
                matched_slots=reconciled_slots,
                booked_slots=booked_slots_data,
                message="Thành công",
                is_fallback=False
            )
        else:
            elapsed = time.time() - t_start
            model_used = call_ctx.model_used or settings.GEMINI_MODEL
            logger.warning(
                f"[UC10_FALLBACK_TRIGGERED] Model: {model_used} | Thời gian: {elapsed:.2f}s | "
                f"Số lần gọi: {call_ctx.attempts or 1} | Loại lỗi: LỖI_PARSE_KẾT_QUẢ | "
                f"Nguyên nhân fallback: Nội dung phản hồi từ Gemini không chứa khung giờ hợp lệ nào khớp với DB | "
                f"Số khung giờ DB dự phòng: {len(reconciled_slots)}"
            )
            ai_log_service.save_log(db, log_type="suggest_slot_fallback", input_data=request.model_dump(mode='json'), output_text=formatted_output)
            return SuggestSlotResponse(
                suggestions_text=formatted_output,
                matched_slots=reconciled_slots,
                booked_slots=booked_slots_data,
                message="Gợi ý dự phòng từ hệ thống",
                is_fallback=True
            )

    except HTTPException as he:
        # Nếu là lỗi 400 hoặc 502 -> re-raise theo đúng test contract
        if he.status_code in [400, 502]:
            logger.error(f"[UC10_AI_ERROR] Loại lỗi: LỖI_RESPONSE | Mã HTTP: {he.status_code} | Chi tiết: {he.detail}")
            raise he
        
        elapsed = time.time() - t_start
        error_type = call_ctx.error_type or "LỖI_KẾT_NỐI_AI"
        fallback_text = _build_fallback_suggestion(request, candidate_slots, booked_slots_data)
        fallback_slots = candidate_slots[:3]
        logger.warning(
            f"[UC10_FALLBACK_TRIGGERED] Model: {settings.GEMINI_MODEL} | Thời gian: {elapsed:.2f}s | "
            f"Số lần gọi: {call_ctx.attempts or 1} | Loại lỗi: {error_type} | "
            f"Nguyên nhân fallback: {he.detail} | "
            f"Số khung giờ DB dự phòng: {len(fallback_slots)}"
        )
        ai_log_service.save_log(db, log_type="suggest_slot_fallback", input_data=request.model_dump(mode='json'), output_text=fallback_text)
        return SuggestSlotResponse(
            suggestions_text=fallback_text,
            matched_slots=fallback_slots,
            booked_slots=booked_slots_data,
            message="Gợi ý dự phòng từ hệ thống",
            is_fallback=True
        )
        
    except Exception as e:
        elapsed = time.time() - t_start
        fallback_text = _build_fallback_suggestion(request, candidate_slots, booked_slots_data)
        fallback_slots = candidate_slots[:3]
        logger.warning(
            f"[UC10_FALLBACK_TRIGGERED] Model: {settings.GEMINI_MODEL} | Thời gian: {elapsed:.2f}s | "
            f"Số lần gọi: {call_ctx.attempts or 1} | Loại lỗi: LỖI_BẤT_NGỜ ({type(e).__name__}) | "
            f"Nguyên nhân fallback: Ngoại lệ không xác định khi gọi AI ({e}) | "
            f"Số khung giờ DB dự phòng: {len(fallback_slots)}"
        )
        ai_log_service.save_log(db, log_type="suggest_slot_fallback", input_data=request.model_dump(mode='json'), output_text=fallback_text)
        return SuggestSlotResponse(
            suggestions_text=fallback_text,
            matched_slots=fallback_slots,
            booked_slots=booked_slots_data,
            message="Gợi ý dự phòng từ hệ thống",
            is_fallback=True
        )

def normalize_ai_message(text: str) -> str:
    """Post-process generated AI messages to guarantee standard Vietnamese VND currency formatting and terminology."""
    if not text:
        return text

    # 1. Thay thế cụm từ sai về tiền cọc nếu AI sinh ra
    text = re.sub(r'(?:số\s+)?tiền cọc còn thiếu', 'số tiền còn lại cần thanh toán', text, flags=re.IGNORECASE)

    # 2. Xử lý số float dạng 50000.0 hoặc 50000.00 hoặc 50000.0đ (phải là số nguyên liền nhau, KHÔNG phải dạng 50.000)
    def _fix_float_currency(m):
        raw_num = m.group(1)
        suffix = m.group(2)
        try:
            val = int(raw_num)
            formatted = f"{val:,}".replace(",", ".")
            if suffix:
                s = suffix.strip()
                return f"{formatted}{' ' + s if s.upper() in ['VNĐ', 'VND', 'ĐỒNG'] else s}"
            return f"{formatted}đ"
        except Exception:
            return m.group(0)

    # Match e.g. 50000.0 or 50000.00, optionally followed by đ/VNĐ/vnd/đồng, but NOT followed by another digit (so 50.000 is safe)
    text = re.sub(r'\b(\d+)\.0{1,2}(?!\d)(?:\s*(đ|VNĐ|vnd|đồng))?', _fix_float_currency, text, flags=re.IGNORECASE)

    # 3. Chuẩn hoá các số lớn dính tiền tệ chưa có dấu chấm phân cách (vd: 50000đ -> 50.000đ)
    def _fix_unformatted_vnd(m):
        prefix = m.group(1) or ""
        raw_num = m.group(2)
        suffix = m.group(3) or "đ"
        try:
            val = int(raw_num)
            formatted = f"{val:,}".replace(",", ".")
            s = suffix.strip()
            unit = f"{' ' + s if s.upper() in ['VNĐ', 'VND', 'ĐỒNG'] else s}"
            return f"{prefix}{formatted}{unit}"
        except Exception:
            return m.group(0)

    text = re.sub(r'(^|[^\d.])(\d{4,9})\s*(đ|VNĐ|vnd|đồng)\b', _fix_unformatted_vnd, text, flags=re.IGNORECASE)

    return text

@router.post("/generate-message/{booking_id}", response_model=GenerateMessageResponse)
def generate_message(booking_id: int, message_type: str = "confirmation", db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # 1. Query booking
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    if message_type not in ["confirmation", "reminder"]:
        raise HTTPException(status_code=400, detail="Loại tin nhắn không hợp lệ")

    if message_type == "confirmation":
        if booking.status in ["cancelled", "completed"]:
            raise HTTPException(status_code=400, detail="Không thể sinh tin nhắn xác nhận cho booking đã hủy/đã hoàn tất")
    elif message_type == "reminder":
        if booking.status != "confirmed":
            raise HTTPException(status_code=400, detail="Chỉ sinh tin nhắn nhắc lịch cho booking đã xác nhận")
        
    court = db.query(Court).filter(Court.id == booking.court_id).first()
    time_slot = db.query(TimeSlot).filter(TimeSlot.id == booking.time_slot_id).first()
    customer = db.query(Customer).filter(Customer.id == booking.customer_id).first()
    
    # 3. Build prompt
    customer_name = customer.full_name if customer else 'Vãng lai'
    court_name = court.name if court else 'N/A'
    book_date = time_slot.date if time_slot else 'N/A'
    start_time = time_slot.start_time.strftime("%H:%M") if time_slot else 'N/A'
    end_time = time_slot.end_time.strftime("%H:%M") if time_slot else 'N/A'
    
    if message_type == "confirmation":
        system_prompt = GENERATE_MESSAGE_CONFIRMATION_SYSTEM
        user_prompt = build_confirmation_user_prompt(customer_name, court_name, book_date, start_time, end_time, booking.deposit_amount, booking.total_amount)
        log_type = "confirmation_message"
    else:
        system_prompt = GENERATE_MESSAGE_REMINDER_SYSTEM
        
        payments = db.query(Payment).filter(Payment.booking_id == booking_id, Payment.status == "paid").all()
        paid_via_payments = sum(p.amount for p in payments)
        
        # Nếu đã có payment record status='paid', số tiền này đã bao gồm cọc (hệ thống tự sinh Payment cọc khi tạo booking)
        # Nếu chưa có payment nào nhưng booking có deposit_amount > 0 (dữ liệu cũ), fallback sang deposit_amount
        if paid_via_payments == 0 and (booking.deposit_amount or 0) > 0:
            paid_amount = float(booking.deposit_amount)
        else:
            paid_amount = paid_via_payments
            
        remaining_amount = max(0.0, float(booking.total_amount) - paid_amount)
        
        user_prompt = build_reminder_user_prompt(
            customer_name, court_name, book_date, start_time, end_time,
            remaining_amount, booking.deposit_amount, booking.total_amount
        )
        log_type = "reminder_message"

    
    # 4. Generate & Log
    output_text = gemini_client.generate(system_prompt, user_prompt)
    output_text = normalize_ai_message(output_text)
    
    ai_log_service.save_log(db, log_type=log_type, input_data={"booking_id": booking_id, "message_type": message_type}, output_text=output_text)
    
    return GenerateMessageResponse(message=output_text, message_type=message_type)

# UC-12: AI tóm tắt công suất & gợi ý khuyến mại (Chỉ dành cho Admin)
@router.get("/occupancy-summary", response_model=OccupancySummaryResponse)
@router.get("/occupancy-report", response_model=OccupancySummaryResponse)
def occupancy_summary(from_date: date, to_date: date, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    if from_date > to_date:
        raise HTTPException(status_code=400, detail="Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc")
        
    if (to_date - from_date).days > 30:
        raise HTTPException(status_code=400, detail="Khoảng thời gian thống kê không được vượt quá 30 ngày")
        
    # 1. Aggregate data (Xử lý an toàn bằng code Python thay vì SQL func.strftime để tránh lỗi SQLite vs Postgres)
    slots = db.query(TimeSlot).filter(TimeSlot.date >= from_date, TimeSlot.date <= to_date).all()
    
    raw_data = {}
    for slot in slots:
        if slot.status == "blocked":
            continue
            
        hour = slot.start_time.strftime("%H:00")
        if hour not in raw_data:
            raw_data[hour] = {"total": 0, "booked": 0, "occupancy_rate_percent": 0.0}
        
        raw_data[hour]["total"] += 1
        if slot.status == "booked":
            raw_data[hour]["booked"] += 1
            
    if not raw_data:
        return OccupancySummaryResponse(
            summary="Không có dữ liệu trong khoảng thời gian này để phân tích.",
            raw_data={}
        )
            
    for hour, data in raw_data.items():
        if data["total"] > 0:
            data["occupancy_rate_percent"] = round((data["booked"] / data["total"]) * 100, 2)
            
    # 3. Build prompt
    system_prompt = OCCUPANCY_SUMMARY_SYSTEM
    user_prompt = build_occupancy_summary_user_prompt(from_date, to_date, raw_data)
    
    # 4. Generate & Log
    # 2. Chỉ gửi số liệu tổng hợp
    output_text = gemini_client.generate(system_prompt, user_prompt)
    
    input_data = {"from_date": str(from_date), "to_date": str(to_date), "raw_data": raw_data}
    ai_log_service.save_log(db, log_type="revenue_summary", input_data=input_data, output_text=output_text)
    
    return OccupancySummaryResponse(
        summary=output_text,
        raw_data=raw_data
    )
