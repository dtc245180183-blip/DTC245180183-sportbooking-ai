from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Court(Base):
    __tablename__ = "courts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    court_type_id = Column(Integer, ForeignKey("court_types.id"), nullable=False)
    price_per_hour = Column(Float, nullable=False)
    status = Column(String, nullable=False, default="active") # active, maintenance, inactive
    image_url = Column(String, nullable=True)

    court_type = relationship("CourtType", back_populates="courts")
    time_slots = relationship("TimeSlot", back_populates="court")
    maintenance_schedules = relationship("MaintenanceSchedule", back_populates="court")
