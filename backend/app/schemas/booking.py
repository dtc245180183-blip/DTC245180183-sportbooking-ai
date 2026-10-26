from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional, List, Any

class BookingBase(BaseModel):
    customer_id: int
    court_id: int
    time_slot_id: int
    staff_id: int
    status: str = Field(default="pending", pattern="^(pending|confirmed|cancelled|completed)$")
    deposit_amount: float = 0.0
    deposit_forfeited: bool = False
    total_amount: float
    note: Optional[str] = None

class BookingCreate(BookingBase):
    pass

class BookingCreateRequest(BaseModel):
    customer_id: int
    time_slot_id: int
    deposit_amount: float = Field(default=0.0, ge=0.0)
    deposit_method: Optional[str] = "cash"
    note: Optional[str] = None

class BookingCancelRequest(BaseModel):
    refund_deposit: bool = False
    refund_method: Optional[str] = "cash"
    reason: Optional[str] = None

class BookingRescheduleRequest(BaseModel):
    new_time_slot_id: int

class BookingRescheduleResponse(BaseModel):
    booking: "BookingDetailResponse"
    amount_difference: float
    message: str

    class Config:
        from_attributes = True

class BookingUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(pending|confirmed|cancelled|completed)$")
    deposit_amount: Optional[float] = None
    deposit_forfeited: Optional[bool] = None
    total_amount: Optional[float] = None
    note: Optional[str] = None

class BookingResponse(BookingBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class CourtInfo(BaseModel):
    id: int
    name: str
    price_per_hour: float

class CustomerInfo(BaseModel):
    id: int
    full_name: str
    phone: str

class TimeSlotInfo(BaseModel):
    id: int
    date: date
    start_time: Any
    end_time: Any

class PaymentInfo(BaseModel):
    id: int
    amount: float
    status: str
    method: Optional[str] = "cash"
    paid_at: Optional[datetime] = None

class BookingDetailResponse(BookingResponse):
    court: Optional[CourtInfo] = None
    time_slot: Optional[TimeSlotInfo] = None
    customer: Optional[CustomerInfo] = None
    payments: List[PaymentInfo] = []
