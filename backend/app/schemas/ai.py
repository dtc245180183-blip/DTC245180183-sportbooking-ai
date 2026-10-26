from pydantic import BaseModel
from datetime import date, time
from typing import Optional, List, Dict, Any

class SuggestSlotRequest(BaseModel):
    court_type_id: int
    preferred_date: date
    preferred_start_time: Optional[time] = None
    preferred_end_time: Optional[time] = None

class SuggestSlotResponse(BaseModel):
    suggestions_text: Optional[str] = None
    matched_slots: List[Dict[str, Any]] = []
    booked_slots: List[Dict[str, Any]] = []
    message: Optional[str] = None
    is_fallback: Optional[bool] = False

from typing import Literal

MessageType = Literal["confirmation", "reminder"]

class GenerateMessageResponse(BaseModel):
    message: str
    message_type: MessageType

class OccupancySummaryResponse(BaseModel):
    summary: str
    raw_data: Dict[str, Any]
