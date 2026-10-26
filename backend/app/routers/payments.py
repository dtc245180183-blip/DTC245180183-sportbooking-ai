from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.database import get_db
from app.models.payment import Payment
from app.models.booking import Booking
from app.schemas.payment import PaymentCreate, PaymentUpdate, PaymentResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/payments", tags=["payments"])

def check_and_update_booking_status(db: Session, booking_id: int):
    """Tự động cập nhật trạng thái booking khi có giao dịch thanh toán.
    
    Luồng trạng thái:
      pending   → confirmed : NHÂN VIÊN XÁC NHẬN THỦ CÔNG (không dùng hàm này)
      confirmed → completed : TỰ ĐỘNG khi thu đủ tiền VÀ đã qua giờ chơi kết thúc
      any       → cancelled : NHÂN VIÊN HỦY THỦ CÔNG   (không dùng hàm này)
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    # Chỉ xét booking đang ở trạng thái "confirmed" — đã được nhân viên xác nhận
    if not booking or booking.status != "confirmed":
        return

    from sqlalchemy import func
    paid_sum = db.query(func.sum(Payment.amount)).filter(
        Payment.booking_id == booking_id,
        Payment.status == "paid"
    ).scalar() or 0.0

    if paid_sum == 0.0 and (booking.deposit_amount or 0) > 0:
        total_paid = float(booking.deposit_amount)
    else:
        total_paid = paid_sum

    if total_paid >= booking.total_amount:
        setattr(booking, "status", "completed")
        db.commit()


@router.get("/", response_model=List[PaymentResponse])
def get_payments(
    booking_id: Optional[int] = None, 
    status: Optional[str] = None, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    query = db.query(Payment)
    if booking_id:
        query = query.filter(Payment.booking_id == booking_id)
    if status:
        query = query.filter(Payment.status == status)
    return query.all()

@router.post("/", response_model=PaymentResponse)
def create_payment(payment: PaymentCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if payment.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")
        
    booking = db.query(Booking).filter(Booking.id == payment.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    if booking.status == "cancelled" and payment.status != "refunded":
        raise HTTPException(status_code=400, detail="Không thể ghi nhận thanh toán cho đơn đã hủy (chỉ cho phép ghi nhận hoàn tiền)")
        
    from sqlalchemy import func
    if payment.status == "paid":
        existing_paid = db.query(func.sum(Payment.amount)).filter(
            Payment.booking_id == payment.booking_id,
            Payment.status == "paid"
        ).scalar() or 0.0
        
        if existing_paid == 0.0 and (booking.deposit_amount or 0.0) > 0:
            total_collected = float(booking.deposit_amount)
        else:
            total_collected = existing_paid

        remaining = max(0.0, (booking.total_amount or 0.0) - total_collected)
        if payment.amount > remaining:
            raise HTTPException(
                status_code=400,
                detail=f"Số tiền thanh toán ({payment.amount:,.0f}đ) vượt quá số tiền còn thiếu ({remaining:,.0f}đ)"
            )
            
    if payment.status == "refunded":
        total_paid = db.query(func.sum(Payment.amount)).filter(
            Payment.booking_id == payment.booking_id,
            Payment.status == "paid"
        ).scalar() or 0.0
        if total_paid == 0.0 and (booking.deposit_amount or 0.0) > 0:
            total_paid = float(booking.deposit_amount)
            
        already_refunded = db.query(func.sum(Payment.amount)).filter(
            Payment.booking_id == payment.booking_id,
            Payment.status == "refunded"
        ).scalar() or 0.0
        
        max_refundable = max(0.0, total_paid - already_refunded)
        if payment.amount > max_refundable:
            raise HTTPException(
                status_code=400,
                detail=f"Số tiền hoàn ({payment.amount:,.0f}đ) vượt quá số tiền tối đa có thể hoàn ({max_refundable:,.0f}đ)"
            )
        
    new_payment = Payment(**payment.model_dump())
    if (new_payment.status in ["paid", "refunded"]) and not new_payment.paid_at:
        new_payment.paid_at = datetime.now(timezone.utc) # type: ignore
        
    db.add(new_payment)
    
    # Nếu là hoàn tiền cho booking đã hủy, cập nhật ghi chú booking
    if new_payment.status == "refunded":
        refund_note = f" [Đã hoàn tiền {new_payment.amount:,.0f}đ]"
        if not booking.note or refund_note not in booking.note:
            booking.note = (booking.note or "") + refund_note # type: ignore
            
    db.commit()
    db.refresh(new_payment)
    
    if new_payment.status == "paid":
        check_and_update_booking_status(db, new_payment.booking_id)
        
    return new_payment

@router.put("/{payment_id}", response_model=PaymentResponse)
def update_payment(payment_id: int, payment: PaymentUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db_payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not db_payment:
        raise HTTPException(status_code=404, detail="Payment not found")
        
    update_data = payment.model_dump(exclude_unset=True)
    
    if "amount" in update_data and update_data["amount"] != db_payment.amount:
        raise HTTPException(status_code=400, detail="Không thể sửa số tiền của giao dịch đã tạo")
    
    if "status" in update_data and update_data["status"] == "paid" and db_payment.status != "paid":
        if "paid_at" not in update_data or update_data["paid_at"] is None:
            update_data["paid_at"] = datetime.now(timezone.utc)
            
    for key, value in update_data.items():
        setattr(db_payment, key, value)
        
    db.commit()
    db.refresh(db_payment)
    
    if db_payment.status == "paid":
        check_and_update_booking_status(db, db_payment.booking_id)
        
    return db_payment

@router.delete("/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Xóa giao dịch thanh toán. Chỉ admin mới được xóa."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Chỉ admin mới có thể xóa giao dịch")

    db_payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not db_payment:
        raise HTTPException(status_code=404, detail="Không tìm thấy giao dịch")

    db.delete(db_payment)
    db.commit()

