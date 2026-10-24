from pydantic import BaseModel, Field
from typing import Optional

class CourtBase(BaseModel):
    name: str
    court_type_id: int
    price_per_hour: float
    status: str = Field(default="active", pattern="^(active|maintenance|inactive)$")
    image_url: Optional[str] = None

class CourtCreate(CourtBase):
    pass

class CourtUpdate(BaseModel):
    name: Optional[str] = None
    court_type_id: Optional[int] = None
    price_per_hour: Optional[float] = None
    status: Optional[str] = Field(None, pattern="^(active|maintenance|inactive)$")
    image_url: Optional[str] = None

class CourtResponse(CourtBase):
    id: int

    class Config:
        from_attributes = True
