from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class PaymentBase(BaseModel):
    booking_id: int
    amount: float
    method: str
    status: str = Field(default="pending", pattern="^(pending|paid|refunded)$")
    paid_at: Optional[datetime] = None

class PaymentCreate(PaymentBase):
    pass

class PaymentUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(pending|paid|refunded)$")
    paid_at: Optional[datetime] = None

class PaymentResponse(PaymentBase):
    id: int

    class Config:
        from_attributes = True
