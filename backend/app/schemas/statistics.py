from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import date

class OverviewResponse(BaseModel):
    total_revenue: float
    total_deposit: float
    deposit_from_active: float    # Cọc từ booking còn đang hoạt động (pending/confirmed)
    deposit_from_cancelled: float # Cọc giữ lại từ booking đã hủy (chưa hoàn trả)
    today_revenue: float
    total_bookings: int
    avg_occupancy_rate: float
    today_bookings: int
    active_courts: int
    total_courts: int
    today_occupancy_rate: float

class RevenueChartItem(BaseModel):
    date: str
    revenue: float

class PeakHourItem(BaseModel):
    hour: str
    total_slots: int
    booked_slots: int
    occupancy_rate: float

class CourtOccupancyItem(BaseModel):
    court_id: int
    court_name: str
    total_slots: int
    booked_slots: int
    occupancy_rate: float
    total_revenue: float
