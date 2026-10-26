from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.database import get_db
from app.models.time_slot import TimeSlot
from app.schemas.time_slot import TimeSlotCreate, TimeSlotUpdate, TimeSlotResponse
from app.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/time-slots", tags=["time_slots"])

@router.get("/", response_model=List[TimeSlotResponse])
def get_time_slots(court_id: Optional[int] = None, filter_date: Optional[date] = None, status: Optional[str] = None, skip: int = 0, limit: int = 500, db: Session = Depends(get_db)):
    query = db.query(TimeSlot)
    if court_id:
        query = query.filter(TimeSlot.court_id == court_id)
    if filter_date:
        query = query.filter(TimeSlot.date == filter_date)
    if status:
        query = query.filter(TimeSlot.status == status)
    return query.order_by(TimeSlot.start_time.asc()).offset(skip).limit(limit).all()

@router.post("/", response_model=TimeSlotResponse)
def create_time_slot(time_slot: TimeSlotCreate, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    new_slot = TimeSlot(**time_slot.model_dump())
    db.add(new_slot)
    db.commit()
    db.refresh(new_slot)
    return new_slot

@router.put("/{slot_id}", response_model=TimeSlotResponse)
def update_time_slot(slot_id: int, time_slot: TimeSlotUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db_slot = db.query(TimeSlot).filter(TimeSlot.id == slot_id).first()
    if not db_slot:
        raise HTTPException(status_code=404, detail="Time slot not found")
    
    update_data = time_slot.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_slot, key, value)
        
    db.commit()
    db.refresh(db_slot)
    return db_slot

from app.schemas.time_slot import GenerateSlotsRequest, GenerateSlotsResponse
from datetime import timedelta, datetime

@router.post("/generate", response_model=GenerateSlotsResponse)
def generate_time_slots(request: GenerateSlotsRequest, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    """Sinh hàng loạt khung giờ cho một sân trong khoảng ngày. Idempotent: bỏ qua slot đã tồn tại."""
    # Validate logic
    if request.date_from > request.date_to:
        raise HTTPException(status_code=400, detail="date_from phải nhỏ hơn hoặc bằng date_to")
    if request.start_hour >= request.end_hour:
        raise HTTPException(status_code=400, detail="start_hour phải nhỏ hơn end_hour")
    span_hours = request.end_hour - request.start_hour
    if span_hours % request.slot_duration_hours != 0:
        raise HTTPException(
            status_code=400,
            detail=f"slot_duration_hours ({request.slot_duration_hours}) phải chia hết khoảng ({span_hours} giờ)"
        )

    # Validate court exists
    from app.models.court import Court
    court = db.query(Court).filter(Court.id == request.court_id).first()
    if not court:
        raise HTTPException(status_code=404, detail="Sân không tồn tại")

    # Build set of existing (court_id, date, start_time) for O(1) skip check
    all_existing = db.query(TimeSlot.date, TimeSlot.start_time).filter(
        TimeSlot.court_id == request.court_id,
        TimeSlot.date >= request.date_from,
        TimeSlot.date <= request.date_to,
    ).all()
    existing_keys = {(str(row.date), str(row.start_time)) for row in all_existing}

    new_slots = []
    skipped = 0
    current_date = request.date_from
    while current_date <= request.date_to:
        for hour_offset in range(0, span_hours, request.slot_duration_hours):
            slot_start = (datetime.combine(current_date, datetime.min.time()) + timedelta(hours=request.start_hour + hour_offset)).time()
            slot_end   = (datetime.combine(current_date, datetime.min.time()) + timedelta(hours=request.start_hour + hour_offset + request.slot_duration_hours)).time()
            key = (str(current_date), str(slot_start))
            if key in existing_keys:
                skipped += 1
            else:
                new_slots.append(TimeSlot(
                    court_id=request.court_id,
                    date=current_date,
                    start_time=slot_start,
                    end_time=slot_end,
                    status="available"
                ))
        current_date += timedelta(days=1)

    if new_slots:
        db.add_all(new_slots)
        db.commit()
        from app.routers.maintenance import sync_maintenance_slots_and_court
        sync_maintenance_slots_and_court(db, request.court_id)

    return GenerateSlotsResponse(created_count=len(new_slots), skipped_count=skipped)

@router.put("/{slot_id}/toggle-block", response_model=TimeSlotResponse)
def toggle_block_time_slot(slot_id: int, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    db_slot = db.query(TimeSlot).filter(TimeSlot.id == slot_id).first()
    if not db_slot:
        raise HTTPException(status_code=404, detail="Time slot not found")
        
    slot_status = getattr(db_slot, "status", None)
    if slot_status == "available":
        setattr(db_slot, "status", "blocked")
    elif slot_status == "blocked":
        setattr(db_slot, "status", "available")
    else:
        raise HTTPException(status_code=400, detail="Cannot toggle block for a booked slot")
        
    db.commit()
    db.refresh(db_slot)
    return db_slot
