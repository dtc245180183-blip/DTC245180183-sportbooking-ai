from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base

class AILog(Base):
    __tablename__ = "ai_logs"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False) # suggest_slot, notify_message, revenue_summary
    input_json = Column(Text, nullable=False)
    output_text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
