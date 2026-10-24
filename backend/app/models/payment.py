from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    amount = Column(Float, nullable=False)
    method = Column(String, nullable=False) # cash, transfer, momo...
    status = Column(String, nullable=False, default="pending") # pending, paid, refunded
    paid_at = Column(DateTime(timezone=True))

    booking = relationship("Booking", back_populates="payments")
