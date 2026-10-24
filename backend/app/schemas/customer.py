from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List
from .booking import BookingResponse

class CustomerBase(BaseModel):
    full_name: str
    phone: str = Field(..., pattern=r"^0\d{8,10}$", description="Vietnamese phone number (9-11 digits)") # type: ignore
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    note: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = Field(None, pattern=r"^0\d{8,10}$", description="Vietnamese phone number (9-11 digits)")
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    note: Optional[str] = None

class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class CustomerDetailResponse(CustomerResponse):
    bookings: List[BookingResponse] = []
