from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from sqlalchemy import or_
from app.database import get_db
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse, CustomerDetailResponse
from app.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/customers", tags=["customers"])

@router.get("/", response_model=List[CustomerResponse])
def get_customers(
    q: Optional[str] = None, 
    page: int = 1, 
    limit: int = 1000, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    skip = (page - 1) * limit
    query = db.query(Customer)
    if q:
        query = query.filter(
            or_(
                Customer.full_name.ilike(f"%{q}%"),
                Customer.phone.ilike(f"%{q}%")
            )
        )
    return query.offset(skip).limit(limit).all()

@router.get("/{customer_id}", response_model=CustomerDetailResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Sắp xếp bookings theo ngày giảm dần
    from datetime import date
    customer.bookings.sort(key=lambda b: b.time_slot.date if b.time_slot else date.min, reverse=True) # type: ignore
    
    return customer

@router.post("/", response_model=CustomerResponse)
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    existing = db.query(Customer).filter(Customer.phone == customer.phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered")
        
    new_customer = Customer(**customer.model_dump())
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    return new_customer

@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(customer_id: int, customer: CustomerUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    update_data = customer.model_dump(exclude_unset=True)
    if "phone" in update_data and update_data["phone"] != db_customer.phone:
        existing = db.query(Customer).filter(Customer.phone == update_data["phone"]).first()
        if existing:
            raise HTTPException(status_code=400, detail="Phone number already registered")
            
    for key, value in update_data.items():
        setattr(db_customer, key, value)
    
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(customer_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    if db_customer.bookings:
        raise HTTPException(status_code=409, detail="Không thể xóa khách hàng đã có lịch sử đặt sân")
        
    db.delete(db_customer)
    db.commit()
