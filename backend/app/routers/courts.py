from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from app.database import get_db
from app.models.court import Court
from app.models.court_type import CourtType
from app.models.booking import Booking
from app.models.time_slot import TimeSlot
from app.schemas.court import CourtCreate, CourtUpdate, CourtResponse
from app.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/courts", tags=["courts"])

@router.get("/", response_model=List[CourtResponse])
def get_courts(
    skip: int = 0, 
    limit: int = 100, 
    court_type_id: Optional[int] = Query(None, description="Filter by court type ID"),
    status: Optional[str] = Query(None, description="Filter by status (active, maintenance, inactive)"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(Court)
    if court_type_id is not None:
        query = query.filter(Court.court_type_id == court_type_id)
    if status is not None:
        query = query.filter(Court.status == status)
    return query.offset(skip).limit(limit).all()

@router.get("/{court_id}", response_model=CourtResponse)
def get_court(court_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    court = db.query(Court).filter(Court.id == court_id).first()
    if not court:
        raise HTTPException(status_code=404, detail="Court not found")
    return court

@router.post("/", response_model=CourtResponse)
def create_court(court: CourtCreate, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    if court.price_per_hour <= 0:
        raise HTTPException(status_code=400, detail="Giá thuê sân mỗi giờ phải lớn hơn 0")
    
    # Check court type exists
    court_type = db.query(CourtType).filter(CourtType.id == court.court_type_id).first()
    if not court_type:
        raise HTTPException(status_code=404, detail="Loại sân không tồn tại")
        
    # Check unique name within court type
    existing_court = db.query(Court).filter(Court.name == court.name, Court.court_type_id == court.court_type_id).first()
    if existing_court:
        raise HTTPException(status_code=409, detail="Tên sân đã tồn tại trong loại sân này")

    new_court = Court(**court.model_dump())
    db.add(new_court)
    db.commit()
    db.refresh(new_court)
    return new_court

@router.put("/{court_id}", response_model=CourtResponse)
def update_court(court_id: int, court: CourtUpdate, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    db_court = db.query(Court).filter(Court.id == court_id).first()
    if not db_court:
        raise HTTPException(status_code=404, detail="Court not found")
    
    if court.price_per_hour is not None and court.price_per_hour <= 0:
        raise HTTPException(status_code=400, detail="Giá thuê sân mỗi giờ phải lớn hơn 0")
        
    if court.court_type_id is not None:
        court_type = db.query(CourtType).filter(CourtType.id == court.court_type_id).first()
        if not court_type:
            raise HTTPException(status_code=404, detail="Loại sân không tồn tại")
            
    # Check unique name if name or court_type_id is changing
    new_name = court.name if court.name is not None else db_court.name
    new_type_id = court.court_type_id if court.court_type_id is not None else db_court.court_type_id
    
    if court.name is not None or court.court_type_id is not None:
        existing_court = db.query(Court).filter(
            Court.name == new_name, 
            Court.court_type_id == new_type_id,
            Court.id != court_id
        ).first()
        if existing_court:
            raise HTTPException(status_code=409, detail="Tên sân đã tồn tại trong loại sân này")
    
    update_data = court.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_court, key, value)
    
    db.commit()
    db.refresh(db_court)
    return db_court

@router.delete("/{court_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_court(court_id: int, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    db_court = db.query(Court).filter(Court.id == court_id).first()
    if not db_court:
        raise HTTPException(status_code=404, detail="Court not found")
        
    # Check constraints: pending or confirmed bookings
    active_booking = db.query(Booking).filter(
        Booking.court_id == court_id,
        Booking.status.in_(["pending", "confirmed"])
    ).first()
    
    if active_booking:
        raise HTTPException(status_code=409, detail="Không thể xóa sân đang có lịch đặt chờ xử lý hoặc đã xác nhận")
        
    # Block if there is any 'booked' time slot
    booked_slot = db.query(TimeSlot).filter(
        TimeSlot.court_id == court_id,
        TimeSlot.status == "booked"
    ).first()
    
    if booked_slot:
        raise HTTPException(status_code=409, detail="Sân đang có khung giờ đã đặt, không thể xóa")
        
    # Cascade delete available time slots
    db.query(TimeSlot).filter(
        TimeSlot.court_id == court_id,
        TimeSlot.status != "booked"
    ).delete()
    
    try:
        db.delete(db_court)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Không thể xóa sân do có dữ liệu liên quan trong hệ thống")
