from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.court_type import CourtType
from app.models.court import Court
from app.schemas.court_type import CourtTypeCreate, CourtTypeUpdate, CourtTypeResponse
from app.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/court-types", tags=["court_types"])

@router.get("/", response_model=List[CourtTypeResponse])
def get_court_types(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(CourtType).offset(skip).limit(limit).all()

@router.post("/", response_model=CourtTypeResponse)
def create_court_type(court_type: CourtTypeCreate, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    new_court_type = CourtType(**court_type.model_dump())
    db.add(new_court_type)
    db.commit()
    db.refresh(new_court_type)
    return new_court_type

@router.put("/{type_id}", response_model=CourtTypeResponse)
def update_court_type(type_id: int, court_type: CourtTypeUpdate, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    db_court_type = db.query(CourtType).filter(CourtType.id == type_id).first()
    if not db_court_type:
        raise HTTPException(status_code=404, detail="Court Type not found")
    
    update_data = court_type.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_court_type, key, value)
    
    db.commit()
    db.refresh(db_court_type)
    return db_court_type

@router.delete("/{type_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_court_type(type_id: int, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    db_court_type = db.query(CourtType).filter(CourtType.id == type_id).first()
    if not db_court_type:
        raise HTTPException(status_code=404, detail="Court Type not found")
    
    # Check if any court is using this type
    active_courts = db.query(Court).filter(Court.court_type_id == type_id).first()
    if active_courts:
        raise HTTPException(status_code=409, detail="Không thể xóa loại sân đang có sân sử dụng")
        
    db.delete(db_court_type)
    db.commit()
