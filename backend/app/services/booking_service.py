from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError
from typing import Optional
from datetime import datetime, timezone, timedelta
from app.models.booking import Booking
from app.models.time_slot import TimeSlot
from app.models.court import Court
from app.models.payment import Payment
from app.models.maintenance_schedule import MaintenanceSchedule
from app.schemas.booking import BookingCreateRequest
from contextlib import contextmanager
import threading

_booking_lock = threading.Lock()

@contextmanager
def transaction(db: Session):
    try:
        yield
        db.commit()
    except OperationalError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, 
            detail="Hệ thống đang xử lý giao dịch cho khung giờ này, vui lòng thử lại."
        )
    except Exception as e:
        db.rollback()
        raise e

def create_booking(db: Session, request: BookingCreateRequest, staff_id: int) -> Booking:
    with _booking_lock:
        with transaction(db):
            # Cơ chế lock: Dùng with_for_update() để khóa record time_slot trong DB
            # chống đọc/ghi đồng thời từ các transaction khác cho đến khi transaction này commit/rollback.
            time_slot = db.query(TimeSlot).with_for_update().filter(TimeSlot.id == request.time_slot_id).first()
        
            if not time_slot:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Time slot not found")
                
            if str(time_slot.status) != "available":
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT, 
                    detail="Khung giờ vừa được đặt, vui lòng chọn khung giờ khác"
                )
                
            # Kiểm tra thời gian thực (Giờ Việt Nam UTC+7): Không cho phép đặt khung giờ trong quá khứ hoặc đã bắt đầu
            tz_vn = timezone(timedelta(hours=7))
            now_vn = datetime.now(tz_vn).replace(tzinfo=None)
            slot_start_dt = datetime.combine(time_slot.date, time_slot.start_time)
            if slot_start_dt <= now_vn:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Không thể đặt sân cho khung giờ trong quá khứ (khung giờ bắt đầu lúc {slot_start_dt.strftime('%H:%M %d/%m/%Y')} đã trôi qua so với thời gian hiện tại {now_vn.strftime('%H:%M %d/%m/%Y')})."
                )
                
            court = db.query(Court).filter(Court.id == time_slot.court_id).first()
            if not court:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Court not found")

            # Kiểm tra nếu sân đang bảo trì hoặc ngày slot nằm trong lịch bảo trì hiệu lực
            is_maintenance = court.status == "maintenance" or db.query(MaintenanceSchedule).filter(
                MaintenanceSchedule.court_id == court.id,
                MaintenanceSchedule.status.in_(["planned", "scheduled", "in_progress"]),
                MaintenanceSchedule.start_date <= time_slot.date,
                time_slot.date <= MaintenanceSchedule.end_date
            ).first() is not None

            if is_maintenance:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Sân đang trong lịch bảo trì vào ngày này, không thể đặt hoặc đổi lịch"
                )

            # Tính toán thời lượng ca (theo giờ) để tính đúng giá tiền cho ca 60p, 90p, 120p,...
            start_dt = datetime.combine(time_slot.date, time_slot.start_time)
            end_dt = datetime.combine(time_slot.date, time_slot.end_time)
            duration_hours = (end_dt - start_dt).total_seconds() / 3600.0
            if duration_hours <= 0:
                duration_hours = 1.0

            slot_total_amount = round(court.price_per_hour * duration_hours)

            # Kiểm tra số tiền cọc: 0 <= deposit_amount <= giá ca
            dep_amount = float(request.deposit_amount or 0.0)
            if dep_amount < 0 or dep_amount > slot_total_amount:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Tiền cọc không hợp lệ (phải từ 0đ đến tối đa {slot_total_amount:,.0f}đ bằng giá ca sân)"
                )
                
            # 1. Cập nhật status của khung giờ
            setattr(time_slot, "status", "booked")
            
            # 2. Tạo booking (total_amount lấy chuẩn từ thời lượng ca x giá sân/giờ)
            new_booking = Booking(
                customer_id=request.customer_id,
                court_id=time_slot.court_id,
                time_slot_id=request.time_slot_id,
                staff_id=staff_id,
                status="pending",
                deposit_amount=request.deposit_amount,
                deposit_forfeited=False,
                total_amount=slot_total_amount,
                note=request.note
            )
            
            db.add(new_booking)
            db.flush() # Để có ID nếu cần, commit được quản lý bởi context manager

            # 3. Tự động sinh Payment cho khoản cọc ban đầu nếu có cọc
            if dep_amount > 0:
                deposit_payment = Payment(
                    booking_id=new_booking.id,
                    amount=dep_amount,
                    method=request.deposit_method or "cash",
                    status="paid",
                    paid_at=datetime.now(timezone.utc)
                )
                db.add(deposit_payment)
                db.flush()

            db.refresh(new_booking)
            return new_booking

def cancel_booking(
    db: Session, 
    booking_id: int, 
    refund_deposit: bool = False, 
    refund_method: str = "cash", 
    reason: Optional[str] = None
) -> Booking:
    with transaction(db):
        booking = db.query(Booking).with_for_update().filter(Booking.id == booking_id).first()
        
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
            
        if str(booking.status) not in ["pending", "confirmed"]:
            raise HTTPException(status_code=400, detail="Only pending or confirmed bookings can be cancelled")
            
        time_slot = db.query(TimeSlot).with_for_update().filter(TimeSlot.id == booking.time_slot_id).first()
        
        setattr(booking, "status", "cancelled")
        if time_slot:
            court_maint = db.query(MaintenanceSchedule).filter(
                MaintenanceSchedule.court_id == time_slot.court_id,
                MaintenanceSchedule.status.in_(["planned", "scheduled", "in_progress"]),
                MaintenanceSchedule.start_date <= time_slot.date,
                time_slot.date <= MaintenanceSchedule.end_date
            ).first()
            setattr(time_slot, "status", "blocked" if court_maint else "available")
            
        # Xử lý hoàn tiền / phạt cọc theo chuẩn dòng tiền
        paid_payments = db.query(Payment).filter(
            Payment.booking_id == booking.id,
            Payment.status == "paid"
        ).all()
        total_paid = sum(p.amount for p in paid_payments)
        
        # Nếu chưa có payment paid mà booking có deposit_amount (dữ liệu cũ)
        if total_paid == 0.0 and float(booking.deposit_amount or 0.0) > 0:
            total_paid = float(booking.deposit_amount)
            
        already_refunded = sum(
            p.amount for p in db.query(Payment).filter(
                Payment.booking_id == booking.id,
                Payment.status == "refunded"
            ).all()
        )
        net_paid = max(0.0, total_paid - already_refunded)
        dep_amount = float(booking.deposit_amount or 0.0)
        
        if net_paid > 0:
            if refund_deposit:
                # Hoàn toàn bộ số tiền khách đang nộp
                refund_payment = Payment(
                    booking_id=booking.id,
                    amount=net_paid,
                    method=refund_method or "cash",
                    status="refunded",
                    paid_at=datetime.now(timezone.utc)
                )
                db.add(refund_payment)
                note_str = f" [Đã hủy - Đã hoàn cọc {net_paid:,.0f}đ"
                if reason:
                    note_str += f": {reason}"
                note_str += "]"
                booking.note = (booking.note or "") + note_str # type: ignore
            else:
                # Giữ cọc: tiền giữ lại tối đa là dep_amount
                kept_deposit = min(dep_amount, net_paid)
                excess_paid = net_paid - kept_deposit
                if excess_paid > 0:
                    # Hoàn lại phần tiền nộp thừa vượt cọc
                    refund_payment = Payment(
                        booking_id=booking.id,
                        amount=excess_paid,
                        method=refund_method or "cash",
                        status="refunded",
                        paid_at=datetime.now(timezone.utc)
                    )
                    db.add(refund_payment)
                    note_str = f" [Đã hủy - Giữ cọc {kept_deposit:,.0f}đ, hoàn tiền thừa {excess_paid:,.0f}đ"
                    if reason:
                        note_str += f": {reason}"
                    note_str += "]"
                    booking.note = (booking.note or "") + note_str # type: ignore
                else:
                    note_str = f" [Đã hủy - Giữ cọc {kept_deposit:,.0f}đ"
                    if reason:
                        note_str += f": {reason}"
                    note_str += "]"
                    booking.note = (booking.note or "") + note_str # type: ignore
                
                # Chốt giữ cọc vào doanh thu
                if kept_deposit > 0 or dep_amount > 0:
                    setattr(booking, "deposit_forfeited", True)
        elif reason:
            booking.note = (booking.note or "") + f" [Đã hủy: {reason}]" # type: ignore
            
        db.flush()
        db.refresh(booking)
        return booking

def reschedule_booking(db: Session, booking_id: int, new_time_slot_id: int) -> dict:
    with _booking_lock:
        with transaction(db):
            booking = db.query(Booking).with_for_update().filter(Booking.id == booking_id).first()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
            
        if str(booking.status) not in ["pending", "confirmed"]:
            raise HTTPException(status_code=400, detail="Cannot reschedule cancelled or completed booking")
            
        # Lock slot cũ và mới
        old_time_slot = db.query(TimeSlot).with_for_update().filter(TimeSlot.id == booking.time_slot_id).first()
        new_time_slot = db.query(TimeSlot).with_for_update().filter(TimeSlot.id == new_time_slot_id).first()
        
        if not new_time_slot:
            raise HTTPException(status_code=404, detail="New time slot not found")
            
        if str(new_time_slot.status) != "available":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, 
                detail="Khung giờ mới đã được đặt hoặc không khả dụng."
            )

        # Kiểm tra thời gian thực: Không cho phép đổi sang khung giờ trong quá khứ hoặc đã bắt đầu
        tz_vn = timezone(timedelta(hours=7))
        now_vn = datetime.now(tz_vn).replace(tzinfo=None)
        new_slot_start_dt = datetime.combine(new_time_slot.date, new_time_slot.start_time)
        if new_slot_start_dt <= now_vn:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Không thể đổi sang khung giờ đã trôi qua so với thời gian thực (khung giờ bắt đầu lúc {new_slot_start_dt.strftime('%H:%M %d/%m/%Y')} đã qua so với thời gian hiện tại {now_vn.strftime('%H:%M %d/%m/%Y')})."
            )
        
        # Lấy giá sân mới (có thể khác sân cũ)
        new_court = db.query(Court).filter(Court.id == new_time_slot.court_id).first()
        if not new_court:
            raise HTTPException(status_code=404, detail="New court not found")

        # Kiểm tra nếu sân mới đang bảo trì hoặc ngày slot mới nằm trong lịch bảo trì hiệu lực
        is_maintenance = new_court.status == "maintenance" or db.query(MaintenanceSchedule).filter(
            MaintenanceSchedule.court_id == new_court.id,
            MaintenanceSchedule.status.in_(["planned", "scheduled", "in_progress"]),
            MaintenanceSchedule.start_date <= new_time_slot.date,
            new_time_slot.date <= MaintenanceSchedule.end_date
        ).first() is not None

        if is_maintenance:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sân đang trong lịch bảo trì vào ngày này, không thể đặt hoặc đổi lịch"
            )
        
        old_total = float(booking.total_amount) # type: ignore
        new_total = float(new_court.price_per_hour) # type: ignore
        amount_difference = new_total - old_total  # dương = KH trả thêm, âm = hoàn lại
            
        # Trả lại slot cũ (khóa lại nếu sân cũ đang trong lịch bảo trì)
        if old_time_slot:
            old_court_maint = db.query(MaintenanceSchedule).filter(
                MaintenanceSchedule.court_id == old_time_slot.court_id,
                MaintenanceSchedule.status.in_(["planned", "scheduled", "in_progress"]),
                MaintenanceSchedule.start_date <= old_time_slot.date,
                old_time_slot.date <= MaintenanceSchedule.end_date
            ).first()
            setattr(old_time_slot, "status", "blocked" if old_court_maint else "available")
            
        # Chiếm slot mới, cập nhật court và tổng tiền
        setattr(new_time_slot, "status", "booked")
        setattr(booking, "time_slot_id", new_time_slot.id)
        setattr(booking, "court_id", new_time_slot.court_id)
        setattr(booking, "total_amount", new_total)
        
        db.flush()
        db.refresh(booking)
        
        # Tạo message rõ ràng cho nhân viên
        if amount_difference > 0:
            msg = f"Đổi lịch thành công. Khách cần trả thêm {amount_difference:,.0f}đ do chuyển sang sân có giá cao hơn."
        elif amount_difference < 0:
            msg = f"Đổi lịch thành công. Cần hoàn lại {abs(amount_difference):,.0f}đ cho khách do chuyển sang sân có giá thấp hơn."
        else:
            msg = "Đổi lịch thành công. Tổng tiền không thay đổi."
        
        return {"booking": booking, "amount_difference": amount_difference, "message": msg}
