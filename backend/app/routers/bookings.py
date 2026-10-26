from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.database import get_db
from app.models.booking import Booking
from app.models.time_slot import TimeSlot
from app.schemas.booking import BookingResponse, BookingDetailResponse, BookingCreateRequest, BookingCancelRequest, BookingRescheduleRequest, BookingRescheduleResponse
from app.dependencies import get_current_user
from app.services.booking_service import create_booking, cancel_booking, reschedule_booking

router = APIRouter(prefix="/bookings", tags=["bookings"])

@router.post("/", response_model=BookingDetailResponse, status_code=status.HTTP_201_CREATED)
def api_create_booking(request: BookingCreateRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return create_booking(db, request, staff_id=current_user.id)

@router.put("/{booking_id}/cancel", response_model=BookingDetailResponse)
def api_cancel_booking(
    booking_id: int, 
    request: Optional[BookingCancelRequest] = None, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    refund_deposit = request.refund_deposit if request else False
    refund_method = (request.refund_method if request else "cash") or "cash"
    reason = request.reason if request else None
    return cancel_booking(db, booking_id, refund_deposit=refund_deposit, refund_method=refund_method, reason=reason)

@router.put("/{booking_id}/reschedule", response_model=BookingRescheduleResponse)
def api_reschedule_booking(booking_id: int, request: BookingRescheduleRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    result = reschedule_booking(db, booking_id, request.new_time_slot_id)
    return {
        "booking": result["booking"],
        "amount_difference": result["amount_difference"],
        "message": result["message"],
    }

@router.get("/", response_model=List[BookingDetailResponse])
def get_bookings(
    customer_id: Optional[int] = None,
    court_id: Optional[int] = None,
    status: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(Booking).join(TimeSlot)
    if customer_id:
        query = query.filter(Booking.customer_id == customer_id)
    if court_id:
        query = query.filter(Booking.court_id == court_id)
    if status:
        query = query.filter(Booking.status == status)
    if date_from:
        query = query.filter(TimeSlot.date >= date_from)
    if date_to:
        query = query.filter(TimeSlot.date <= date_to)
        
    return query.offset(skip).limit(limit).all()

@router.get("/{booking_id}", response_model=BookingDetailResponse)
def get_booking(booking_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking

@router.put("/{booking_id}/confirm", response_model=BookingDetailResponse)
def confirm_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Nhân viên/Admin xác nhận booking: pending → confirmed."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status == "cancelled":
        raise HTTPException(status_code=400, detail="Không thể xác nhận booking đã hủy")
    if booking.status == "completed":
        raise HTTPException(status_code=400, detail="Booking này đã hoàn thành")
    if booking.status == "confirmed":
        raise HTTPException(status_code=400, detail="Booking này đã được xác nhận trước đó")

    # Kiểm tra thời gian thực: Không cho phép xác nhận đơn đặt sân đã quá giờ chơi
    from datetime import datetime, timezone, timedelta
    tz_vn = timezone(timedelta(hours=7))
    now_vn = datetime.now(tz_vn).replace(tzinfo=None)
    if booking.time_slot:
        slot_end_dt = datetime.combine(booking.time_slot.date, booking.time_slot.end_time)
        if slot_end_dt <= now_vn:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Khung giờ chơi của đơn đặt sân này đã kết thúc ({slot_end_dt.strftime('%H:%M %d/%m/%Y')} so với thời gian hiện tại {now_vn.strftime('%H:%M %d/%m/%Y')}), không thể xác nhận."
            )

    setattr(booking, "status", "confirmed")
    db.commit()
    db.refresh(booking)
    return booking

@router.put("/{booking_id}/forfeit-deposit", response_model=BookingDetailResponse)
def forfeit_deposit(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Xác nhận chốt phạt cọc cho đơn đã hủy, đóng hồ sơ theo dõi hoàn cọc."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status != "cancelled":
        raise HTTPException(status_code=400, detail="Chỉ có thể chốt giữ cọc cho đơn đã hủy")
    
    setattr(booking, "deposit_forfeited", True)
    note_str = " [Đã chốt giữ cọc vào doanh thu]"
    if not booking.note or note_str not in booking.note:
        booking.note = (booking.note or "") + note_str # type: ignore
        
    db.commit()
    db.refresh(booking)
    return booking

