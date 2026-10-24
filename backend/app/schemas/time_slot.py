from pydantic import BaseModel, Field
from datetime import date, time
from typing import Optional

class TimeSlotBase(BaseModel):
    court_id: int
    date: date
    start_time: time
    end_time: time
    status: str = Field(default="available", pattern="^(available|booked|blocked)$")

class TimeSlotCreate(TimeSlotBase):
    pass

class TimeSlotUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(available|booked|blocked)$")

class TimeSlotResponse(TimeSlotBase):
    id: int

    class Config:
        from_attributes = True

class TimeSlotBulkCreate(BaseModel):
    court_id: int
    start_date: date
    end_date: date
    start_hour: int = Field(ge=0, le=23, default=6)
    end_hour: int = Field(ge=1, le=24, default=22)
    duration_minutes: int = Field(default=60)

class GenerateSlotsRequest(BaseModel):
    court_id: int
    date_from: date
    date_to: date
    start_hour: int = Field(default=6, ge=0, le=23)
    end_hour: int = Field(default=22, ge=1, le=24)
    slot_duration_hours: int = Field(default=1, ge=1)

class GenerateSlotsResponse(BaseModel):
    created_count: int
    skipped_count: int
