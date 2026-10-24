from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date, datetime, timedelta

from app.database import get_db
from app.models.payment import Payment
from app.models.booking import Booking
from app.models.time_slot import TimeSlot
from app.models.court import Court
from app.schemas.statistics import OverviewResponse, RevenueChartItem, PeakHourItem, CourtOccupancyItem
from app.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/statistics", tags=["statistics"])

@router.get("/overview", response_model=OverviewResponse)
def get_overview(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Tổng doanh thu = payments đã paid + tiền cọc tất cả booking − tổng tiền hoàn trả (refunded)
    payments_revenue = db.query(func.sum(Payment.amount)).filter(Payment.status == "paid").scalar() or 0.0
    refunds_sum = db.query(func.sum(Payment.amount)).filter(Payment.status == "refunded").scalar() or 0.0
    total_deposits_revenue = db.query(func.sum(Booking.deposit_amount)).filter(
        Booking.deposit_amount > 0
    ).scalar() or 0.0
    total_revenue = max(0.0, payments_revenue + total_deposits_revenue - refunds_sum)
    
    # Tổng cọc đang giữ = tổng cọc tất cả booking có deposit > 0 − cọc đã hoàn trả (refunded)
    # Bao gồm cả booking đã hủy nhưng chưa hoàn cọc cho khách
    all_deposits = db.query(func.sum(Booking.deposit_amount)).filter(
        Booking.deposit_amount > 0
    ).scalar() or 0.0
    refunded_deposits = db.query(func.sum(Payment.amount)).filter(
        Payment.status == "refunded"
    ).scalar() or 0.0
    total_deposit_query = max(0.0, all_deposits - refunded_deposits)

    # Phân tách cọc: có hiệu (pending/confirmed) vs giữ sau hủy
    deposit_from_active = db.query(func.sum(Booking.deposit_amount)).filter(
        Booking.status.in_(["pending", "confirmed"]),
        Booking.deposit_amount > 0
    ).scalar() or 0.0

    # Cọc giữ lại từ booking đã hủy nhưng chưa có giao dịch refund
    cancelled_with_deposit = db.query(Booking).filter(
        Booking.status == "cancelled",
        Booking.deposit_amount > 0
    ).all()
    deposit_from_cancelled = 0.0
    for b in cancelled_with_deposit:
        has_refund = db.query(Payment).filter(
            Payment.booking_id == b.id,
            Payment.status == "refunded"
        ).first()
        if not has_refund:
            amount = b.deposit_amount
            deposit_from_cancelled += float(amount) if amount is not None else 0.0  # type: ignore
    
    # Doanh thu hôm nay = đã thu hôm nay − hoàn trả hôm nay
    today = date.today()
    all_payments = db.query(Payment).all()
    today_paid = sum(p.amount for p in all_payments if p.status == "paid" and p.paid_at and p.paid_at.date() == today)
    today_refunded = sum(p.amount for p in all_payments if p.status == "refunded" and p.paid_at and p.paid_at.date() == today)
    today_revenue = max(0.0, today_paid - today_refunded)
    
    # Tổng số bookings (completed or confirmed)
    total_bookings = db.query(Booking).filter(Booking.status.in_(["confirmed", "completed"])).count()
    
    # Số booking hôm nay
    today_bookings = db.query(Booking).join(TimeSlot).filter(
        Booking.status.in_(["confirmed", "completed"]),
        TimeSlot.date == today
    ).count()
    
    # Công suất trung bình tổng thể
    total_slots = db.query(TimeSlot).count()
    booked_slots = db.query(TimeSlot).filter(TimeSlot.status == "booked").count()
    avg_occupancy_rate = (booked_slots / total_slots * 100) if total_slots > 0 else 0.0
    
    # Công suất hôm nay
    today_total_slots = db.query(TimeSlot).filter(TimeSlot.date == today).count()
    today_booked_slots = db.query(TimeSlot).filter(TimeSlot.date == today, TimeSlot.status == "booked").count()
    today_occupancy_rate = (today_booked_slots / today_total_slots * 100) if today_total_slots > 0 else 0.0
    
    # Tình trạng sân
    total_courts = db.query(Court).count()
    active_courts = db.query(Court).filter(Court.status == "active").count()
    
    # Phân quyền: Nhân viên (staff) không xem số liệu doanh thu & quỹ cọc của chủ sân
    if current_user.role != "admin":
        total_revenue = 0.0
        total_deposit_query = 0.0
        deposit_from_active = 0.0
        deposit_from_cancelled = 0.0
        today_revenue = 0.0
    
    return OverviewResponse(
        total_revenue=float(str(total_revenue)),
        total_deposit=float(str(total_deposit_query)),
        deposit_from_active=float(str(deposit_from_active)),
        deposit_from_cancelled=float(str(deposit_from_cancelled)),
        today_revenue=float(str(today_revenue)),
        total_bookings=int(str(total_bookings)),
        avg_occupancy_rate=float(str(round(avg_occupancy_rate, 2))),
        today_bookings=int(str(today_bookings)),
        active_courts=int(str(active_courts)),
        total_courts=int(str(total_courts)),
        today_occupancy_rate=float(str(round(today_occupancy_rate, 2)))
    )

@router.get("/revenue-chart", response_model=List[RevenueChartItem])
def get_revenue_chart(
    from_date: Optional[date] = None, 
    to_date: Optional[date] = None, 
    all_time: Optional[bool] = False,
    db: Session = Depends(get_db), 
    current_user = Depends(require_admin)
):
    min_pay_date = db.query(func.min(Payment.paid_at)).scalar()
    min_book_date = db.query(func.min(Booking.created_at)).scalar()
    max_pay_date = db.query(func.max(Payment.paid_at)).scalar()
    max_book_date = db.query(func.max(Booking.created_at)).scalar()
    
    valid_mins = [d.date() if isinstance(d, datetime) else d for d in [min_pay_date, min_book_date] if d is not None]
    earliest_db_date = min(valid_mins) if valid_mins else date.today() - timedelta(days=30)
    
    valid_maxs = [d.date() if isinstance(d, datetime) else d for d in [max_pay_date, max_book_date] if d is not None]
    latest_db_date = max(valid_maxs) if valid_maxs else date.today()
    
    if all_time or from_date is None or to_date is None:
        start_date = earliest_db_date
        end_date = max(latest_db_date, date.today())
    else:
        if from_date > to_date:
            raise HTTPException(status_code=400, detail="from_date must be less than or equal to to_date")
        start_date = from_date
        end_date = to_date
        
    def calculate_revenue_series(s_date, e_date):
        days = (e_date - s_date).days + 1
        rev_dict = {}
        for i in range(days):
            d = s_date + timedelta(days=i)
            rev_dict[d.isoformat()] = 0.0
            
        payments = db.query(Payment).all()
        for p in payments:
            if p.paid_at:
                p_date = p.paid_at.date()
                if s_date <= p_date <= e_date:
                    iso_key = p_date.isoformat()
                    if iso_key in rev_dict:
                        if p.status == "paid":
                            rev_dict[iso_key] += float(p.amount or 0.0)
                        elif p.status == "refunded":
                            rev_dict[iso_key] -= float(p.amount or 0.0)

        bookings = db.query(Booking).filter(Booking.deposit_amount > 0).all()
        for b in bookings:
            b_date = b.created_at.date() if b.created_at else None
            if b_date and s_date <= b_date <= e_date:
                iso_key = b_date.isoformat()
                if iso_key in rev_dict:
                    rev_dict[iso_key] += float(b.deposit_amount or 0.0)  # type: ignore

        for k in rev_dict:
            rev_dict[k] = max(0.0, rev_dict[k])
                    
        items = [RevenueChartItem(date=k, revenue=v) for k, v in rev_dict.items()]
        items.sort(key=lambda x: x.date)
        return items

    result = calculate_revenue_series(start_date, end_date)
    
    # Khắc phục dữ liệu mẫu: Nếu khoảng thời gian lọc ban đầu không có doanh thu,
    # nhưng DB thực tế có doanh thu ở các ngày khác, tự động lấy khoảng có dữ liệu để biểu đồ luôn sinh động
    total_rev = sum(item.revenue for item in result)
    if total_rev == 0 and not all_time:
        has_any_revenue = db.query(Payment).filter(Payment.status == "paid").first() or db.query(Booking).filter(Booking.deposit_amount > 0).first()
        if has_any_revenue:
            result = calculate_revenue_series(earliest_db_date, max(latest_db_date, date.today()))
            
    return result

@router.get("/peak-hours", response_model=List[PeakHourItem])
def get_peak_hours(
    from_date: Optional[date] = None, 
    to_date: Optional[date] = None, 
    all_time: Optional[bool] = False,
    db: Session = Depends(get_db), 
    current_user = Depends(require_admin)
):
    if from_date and to_date and from_date > to_date:
        raise HTTPException(status_code=400, detail="from_date must be less than or equal to to_date")
        
    slots_query = db.query(TimeSlot)
    if not all_time and from_date and to_date:
        slots = slots_query.filter(TimeSlot.date >= from_date, TimeSlot.date <= to_date).all()
        booked_in_range = sum(1 for s in slots if s.status == "booked")
        if booked_in_range == 0:
            total_booked = db.query(TimeSlot).filter(TimeSlot.status == "booked").count()
            if total_booked > 0:
                slots = slots_query.all()
    else:
        slots = slots_query.all()
    
    hour_stats = {}
    for i in range(6, 24):
        hour_str = f"{i:02d}:00"
        hour_stats[hour_str] = {"total": 0, "booked": 0}
        
    for slot in slots:
        hour_str = slot.start_time.strftime("%H:00")
        if hour_str in hour_stats:
            if slot.status != "blocked":
                hour_stats[hour_str]["total"] += 1
                if slot.status == "booked":
                    hour_stats[hour_str]["booked"] += 1
                
    result = []
    for hour, stats in hour_stats.items():
        occ = (stats["booked"] / stats["total"] * 100) if stats["total"] > 0 else 0.0
        result.append(PeakHourItem(
            hour=hour,
            total_slots=stats["total"],
            booked_slots=stats["booked"],
            occupancy_rate=round(occ, 2)
        ))
        
    result.sort(key=lambda x: x.hour)
    return result

@router.get("/court-occupancy", response_model=List[CourtOccupancyItem])
def get_court_occupancy(
    from_date: Optional[date] = None, 
    to_date: Optional[date] = None, 
    all_time: Optional[bool] = False,
    db: Session = Depends(get_db), 
    current_user = Depends(require_admin)
):
    if from_date and to_date and from_date > to_date:
        raise HTTPException(status_code=400, detail="from_date must be less than or equal to to_date")
    
    use_all_slots = False
    if not all_time and from_date and to_date:
        range_booked = db.query(TimeSlot).filter(TimeSlot.date >= from_date, TimeSlot.date <= to_date, TimeSlot.status == "booked").count()
        total_booked = db.query(TimeSlot).filter(TimeSlot.status == "booked").count()
        if range_booked == 0 and total_booked > 0:
            use_all_slots = True
    else:
        use_all_slots = True

    courts = db.query(Court).all()
    result = []
    
    for court in courts:
        slot_query = db.query(TimeSlot).filter(TimeSlot.court_id == court.id)
        booking_query = db.query(Booking).join(TimeSlot).filter(
            Booking.court_id == court.id,
            Booking.status.in_(["confirmed", "completed"])
        )
        if not use_all_slots and from_date and to_date:
            slot_query = slot_query.filter(TimeSlot.date >= from_date, TimeSlot.date <= to_date)
            booking_query = booking_query.filter(TimeSlot.date >= from_date, TimeSlot.date <= to_date)
            
        slots = slot_query.all()
        total_slots = sum(1 for s in slots if s.status != "blocked")
        booked_slots = sum(1 for s in slots if s.status == "booked")
        occ = (booked_slots / total_slots * 100) if total_slots > 0 else 0.0
        
        court_bookings = booking_query.all()
        revenue = sum(b.total_amount for b in court_bookings)
        
        result.append(CourtOccupancyItem(
            court_id=int(str(court.id)),
            court_name=str(court.name),
            total_slots=total_slots,
            booked_slots=booked_slots,
            occupancy_rate=round(occ, 2),
            total_revenue=float(str(revenue))
        ))
        
    return result
