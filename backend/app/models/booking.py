from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    court_id = Column(Integer, ForeignKey("courts.id"), nullable=False)
    time_slot_id = Column(Integer, ForeignKey("time_slots.id"), nullable=False, unique=True)
    staff_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    status = Column(String, nullable=False, default="pending") # pending, confirmed, cancelled, completed
    deposit_amount = Column(Float, default=0.0)
    total_amount = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    note = Column(Text)

    customer = relationship("Customer", back_populates="bookings")
    court = relationship("Court")
    time_slot = relationship("TimeSlot", back_populates="booking")
    staff = relationship("User")
    payments = relationship("Payment", back_populates="booking")
