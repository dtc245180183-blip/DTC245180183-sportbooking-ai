from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from app.database import Base

class CourtType(Base):
    __tablename__ = "court_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(Text)
    image_url = Column(String, nullable=True)
    
    courts = relationship("Court", back_populates="court_type")
