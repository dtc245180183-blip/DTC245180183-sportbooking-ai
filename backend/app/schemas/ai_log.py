from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class AILogBase(BaseModel):
    type: str = Field(pattern="^(suggest_slot|notify_message|revenue_summary)$")
    input_json: str
    output_text: str

class AILogCreate(AILogBase):
    pass

class AILogResponse(AILogBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
