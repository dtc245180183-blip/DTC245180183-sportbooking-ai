from pydantic import BaseModel
from typing import Optional

class CourtTypeBase(BaseModel):
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None

class CourtTypeCreate(CourtTypeBase):
    pass

class CourtTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None

class CourtTypeResponse(CourtTypeBase):
    id: int

    class Config:
        from_attributes = True
