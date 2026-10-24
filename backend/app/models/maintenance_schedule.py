from sqlalchemy import Column, Integer, String, Date, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class MaintenanceSchedule(Base):
    __tablename__ = "maintenance_schedules"

    id = Column(Integer, primary_key=True, index=True)
    court_id = Column(Integer, ForeignKey("courts.id"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    reason = Column(Text)
    status = Column(String, nullable=False, default="planned") # planned, in_progress, done

    court = relationship("Court", back_populates="maintenance_schedules")
