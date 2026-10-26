from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Any
from app.database import get_db
from app.models.maintenance_schedule import MaintenanceSchedule
from app.models.court import Court
from app.schemas.maintenance_schedule import MaintenanceScheduleCreate, MaintenanceScheduleUpdate, MaintenanceScheduleResponse
from app.dependencies import require_admin, get_current_user

router = APIRouter(prefix="/maintenance", tags=["maintenance"])

def sync_maintenance_slots_and_court(db: Session, court_id: int):
    court = db.query(Court).filter(Court.id == court_id).first()
    if not court:
        return

    # Lấy tất cả lịch bảo trì đang có hiệu lực của sân (kế hoạch hoặc đang sửa)
    active_schedules = db.query(MaintenanceSchedule).filter(
        MaintenanceSchedule.court_id == court_id,
        MaintenanceSchedule.status.in_(["planned", "scheduled", "in_progress"])
    ).all()

    # Cập nhật trạng thái sân: nếu có lịch in_progress -> "maintenance", ngược lại -> "active"
    has_in_progress = any(s.status == "in_progress" for s in active_schedules)
    setattr(court, "status", "maintenance" if has_in_progress else "active")

    # Đồng bộ trạng thái các TimeSlot của sân
    from app.models.time_slot import TimeSlot
    slots: List[Any] = db.query(TimeSlot).filter(TimeSlot.court_id == court_id).all()
    for slot in slots:
        slot_any: Any = slot
        is_in_maintenance = any(
            s.start_date <= slot_any.date <= s.end_date for s in active_schedules
        )
        if is_in_maintenance:
            # Nếu đang available thì khóa (blocked), giữ nguyên nếu đã booked
            if getattr(slot, "status", None) == "available":
                setattr(slot, "status", "blocked")
        else:
            # Nếu không còn lịch bảo trì và slot đang blocked (chưa có booking) thì mở lại available
            if getattr(slot, "status", None) == "blocked" and not getattr(slot, "booking", None):
                setattr(slot, "status", "available")

    db.commit()

def get_conflicting_bookings(db: Session, court_id: int, start_date, end_date):
    from app.models.booking import Booking
    from app.models.time_slot import TimeSlot
    conflicts = db.query(Booking).join(TimeSlot).filter(
        Booking.court_id == court_id,
        Booking.status == "confirmed",
        TimeSlot.date >= start_date,
        TimeSlot.date <= end_date
    ).all()
    return [b.id for b in conflicts]

@router.get("/", response_model=List[MaintenanceScheduleResponse])
def get_schedules(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(MaintenanceSchedule).options(joinedload(MaintenanceSchedule.court)).all()

@router.post("/", response_model=MaintenanceScheduleResponse)
def create_schedule(schedule: MaintenanceScheduleCreate, force: bool = False, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    if schedule.start_date >= schedule.end_date:
        raise HTTPException(status_code=400, detail="start_date must be strictly before end_date")
        
    court = db.query(Court).filter(Court.id == schedule.court_id).first()
    if not court:
        raise HTTPException(status_code=404, detail="Court not found")
    if not force:
        conflicts = get_conflicting_bookings(db, schedule.court_id, schedule.start_date, schedule.end_date)
        if conflicts:
            raise HTTPException(status_code=409, detail={"message": "Conflict", "conflicting_bookings": conflicts})

    new_schedule = MaintenanceSchedule(**schedule.model_dump())
    db.add(new_schedule)
    db.commit()
    db.refresh(new_schedule)
    
    sync_maintenance_slots_and_court(db, new_schedule.court_id)  # type: ignore
    return new_schedule

@router.put("/{schedule_id}", response_model=MaintenanceScheduleResponse)
def update_schedule(schedule_id: int, schedule: MaintenanceScheduleUpdate, force: bool = False, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    db_schedule = db.query(MaintenanceSchedule).filter(MaintenanceSchedule.id == schedule_id).first()
    if not db_schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
        
    update_data = schedule.model_dump(exclude_unset=True)
    
    start_date = update_data.get("start_date", db_schedule.start_date)
    end_date = update_data.get("end_date", db_schedule.end_date)
    
    if start_date >= end_date:
        raise HTTPException(status_code=400, detail="start_date must be strictly before end_date")
        
    if not force:
        conflicts = get_conflicting_bookings(db, int(str(db_schedule.court_id)), start_date, end_date)
        if conflicts:
            raise HTTPException(status_code=409, detail={"message": "Conflict", "conflicting_bookings": conflicts})

    old_court_id = db_schedule.court_id
    for key, value in update_data.items():
        setattr(db_schedule, key, value)
        
    db.commit()
    db.refresh(db_schedule)
    
    sync_maintenance_slots_and_court(db, db_schedule.court_id)  # type: ignore
    if old_court_id != db_schedule.court_id:
        sync_maintenance_slots_and_court(db, old_court_id)  # type: ignore
        
    return db_schedule

@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule(schedule_id: int, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    db_schedule = db.query(MaintenanceSchedule).filter(MaintenanceSchedule.id == schedule_id).first()
    if not db_schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
        
    court_id = db_schedule.court_id
    db.delete(db_schedule)
    db.commit()
    
    sync_maintenance_slots_and_court(db, court_id)  # type: ignore
