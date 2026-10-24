import json
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
from app.ai import gemini_client
from app.services import ai_log_service
from app.ai.prompts import (
    SUGGEST_SLOT_SYSTEM, GENERATE_MESSAGE_CONFIRMATION_SYSTEM, GENERATE_MESSAGE_REMINDER_SYSTEM, OCCUPANCY_SUMMARY_SYSTEM,
    build_suggest_slot_user_prompt, build_confirmation_user_prompt, build_reminder_user_prompt, build_occupancy_summary_user_prompt
)

router = APIRouter(prefix="/ai", tags=["ai"])

@router.post("/suggest-slot", response_model=SuggestSlotResponse)
def suggest_slot(request: SuggestSlotRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Lấy danh sách ID các sân có lịch bảo trì trùng ngày preferred_date
    from app.models.maintenance_schedule import MaintenanceSchedule
    maintenance_court_ids = [
        row[0] for row in db.query(MaintenanceSchedule.court_id).filter(
            MaintenanceSchedule.status.in_(["planned", "scheduled", "in_progress"]),
            MaintenanceSchedule.start_date <= request.preferred_date,
            request.preferred_date <= MaintenanceSchedule.end_date
        ).all()
    ]

    # 1. Query time_slots (loại trừ sân bảo trì hoặc không active)
    query = db.query(TimeSlot, Court).join(Court, TimeSlot.court_id == Court.id)\
              .filter(Court.court_type_id == request.court_type_id)\
              .filter(Court.status == "active")\
              .filter(TimeSlot.date == request.preferred_date)\
              .filter(TimeSlot.status == "available")
              
    if maintenance_court_ids:
        query = query.filter(Court.id.not_in(maintenance_court_ids))
              
    if request.preferred_start_time:
        query = query.filter(TimeSlot.start_time >= request.preferred_start_time)
    if request.preferred_end_time:
        query = query.filter(TimeSlot.end_time <= request.preferred_end_time)
        
    query = query.order_by(TimeSlot.start_time)
    results = query.limit(20).all()
    
    # 2. Không có slot nào -> return ngay, không gọi AI
    if not results:
        return SuggestSlotResponse(
            suggestions_text="",
            matched_slots=[],
            message="Hiện không còn khung giờ trống phù hợp"
        )
        
    matched_slots = []
    for slot, court in results:
        matched_slots.append({
            "slot_id": slot.id,
            "court_name": court.name,
            "start_time": slot.start_time.strftime("%H:%M"),
            "end_time": slot.end_time.strftime("%H:%M"),
            "price": court.price_per_hour
        })
        
    # 3. Build prompt
    system_prompt = SUGGEST_SLOT_SYSTEM
    user_prompt = build_suggest_slot_user_prompt(request.court_type_id, request.preferred_date, matched_slots)
    
    # 4. Generate & Log
    output_text = gemini_client.generate(system_prompt, user_prompt)
    
    ai_log_service.save_log(db, log_type="suggest_slot", input_data=request.model_dump(mode='json'), output_text=output_text)
    
    return SuggestSlotResponse(
        suggestions_text=output_text,
        matched_slots=matched_slots,
        message="Thành công"
    )

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
        # Cộng tiền cọc đặt ban đầu (lưu trực tiếp trên booking, không phải payment record)
        paid_amount = paid_via_payments + (booking.deposit_amount or 0)
        remaining_amount = max(0, booking.total_amount - paid_amount)
        
        user_prompt = build_reminder_user_prompt(customer_name, court_name, book_date, start_time, end_time, remaining_amount)
        log_type = "reminder_message"

    
    # 4. Generate & Log
    output_text = gemini_client.generate(system_prompt, user_prompt)
    
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
