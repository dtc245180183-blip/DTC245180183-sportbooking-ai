from pydantic import BaseModel, Field
from datetime import date
from typing import Optional

class MaintenanceScheduleBase(BaseModel):
    court_id: int
    start_date: date
    end_date: date
    reason: Optional[str] = None
    status: str = Field(default="planned", pattern="^(planned|scheduled|in_progress|done|completed|cancelled)$")

class MaintenanceScheduleCreate(MaintenanceScheduleBase):
    pass

class MaintenanceScheduleUpdate(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    reason: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(planned|scheduled|in_progress|done|completed|cancelled)$")

class MaintenanceScheduleResponse(MaintenanceScheduleBase):
    id: int
    court_name: Optional[str] = None

    class Config:
        from_attributes = True
