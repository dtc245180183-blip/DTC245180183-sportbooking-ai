"""
Script cập nhật hàng loạt booking đã thanh toán đủ → completed
Chạy: python backend/scripts/fix_booking_status.py
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.database import SessionLocal
from app.models.booking import Booking
from app.models.payment import Payment
from sqlalchemy import func

db = SessionLocal()

try:
    # Lấy tất cả booking chưa bị hủy
    bookings = db.query(Booking).filter(Booking.status != 'cancelled').all()
    updated = 0

    for b in bookings:
        paid_sum = db.query(func.sum(Payment.amount)).filter(
            Payment.booking_id == b.id,
            Payment.status == 'paid'
        ).scalar() or 0.0

        if paid_sum >= b.total_amount and b.status != 'completed':
            old = b.status
            b.status = 'completed'   # type: ignore
            print(f"  Booking #{b.id}: {old} -> completed  (paid {paid_sum:,.0f} / {b.total_amount:,.0f})")
            updated += 1

    db.commit()
    print(f"\n✅ Đã cập nhật {updated} booking sang 'completed'.")
finally:
    db.close()
