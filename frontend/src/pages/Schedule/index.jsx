import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Calendar, 
  Sparkles, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  CalendarDays, 
  Plus, 
  Wrench, 
  Flame,
  LayoutGrid,
  Trophy,
  Activity,
  CircleDot
} from 'lucide-react';
import { courtsAPI, courtTypesAPI, timeSlotsAPI, maintenanceAPI, bookingsAPI } from '../../api';
import QuickBookModal from './QuickBookModal';
import BookingDetailPanel from './BookingDetailPanel';
import AISuggestModal from './AISuggestModal';
import GenerateSlotsModal from './GenerateSlotsModal';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { ConfirmModal, CustomerAvatar } from '../../components/ui';
import { getSportImage, getSportAccent } from '../../utils/sportImages';
import './Schedule.css';

export default function Schedule() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user?.role === 'admin';

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [courts, setCourts] = useState([]);
  const [courtTypes, setCourtTypes] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [maintenanceList, setMaintenanceList] = useState([]);
  const [dayBookings, setDayBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState('all');

  // Modals state
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [isQuickBookOpen, setIsQuickBookOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [toggleSlotModal, setToggleSlotModal] = useState({ open: false, slot: null, isLocking: false });
  const [toggleLoading, setToggleLoading] = useState(false);

  const hours = Array.from({ length: 17 }, (_, i) => i + 6); // 6:00 to 22:00

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [courtsData, typesData, slotsData, maintenanceData, bookingsData] = await Promise.all([
        courtsAPI.getAll(),
        courtTypesAPI.getAll(),
        timeSlotsAPI.getAll({ filter_date: selectedDate, limit: 1000 }),
        maintenanceAPI.getAll().catch(() => []),
        bookingsAPI.getAll({ date_from: selectedDate, date_to: selectedDate, limit: 1000 }).catch(() => [])
      ]);
      setCourts(courtsData);
      setCourtTypes(typesData);
      setTimeSlots(slotsData);
      setMaintenanceList(maintenanceData || []);
      setDayBookings(bookingsData || []);
    } catch (error) {
      console.error('Lỗi tải dữ liệu lịch:', error);
      showToast({ type: 'error', message: 'Không thể tải dữ liệu lịch đặt sân.' });
    } finally {
      setLoading(false);
    }
  }, [selectedDate, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getCourtTypeName = useCallback((courtTypeId) => {
    return courtTypes.find(t => t.id === courtTypeId)?.name || '';
  }, [courtTypes]);

  // Bộ lọc Sport Pills
  const filteredCourts = useMemo(() => {
    if (!selectedSport || selectedSport === 'all') return courts;
    return courts.filter(c => {
      const type = (getCourtTypeName(c.court_type_id) || '').toLowerCase();
      const name = (c.name || '').toLowerCase();
      const combined = `${type} ${name}`;
      if (selectedSport === 'football') return combined.includes('bóng đá') || combined.includes('football');
      if (selectedSport === 'badminton') return combined.includes('cầu lông') || combined.includes('badminton');
      if (selectedSport === 'pickleball') return combined.includes('pickleball');
      return true;
    });
  }, [courts, selectedSport, getCourtTypeName]);

  const isCourtInMaintenance = (court) => {
    if (!court) return false;
    if (court.status === 'maintenance') return true;
    return maintenanceList.some(m => {
      if (m.court_id !== court.id) return false;
      const activeStatuses = ['planned', 'scheduled', 'in_progress'];
      if (!activeStatuses.includes(m.status)) return false;
      return m.start_date <= selectedDate && selectedDate <= m.end_date;
    });
  };

  const getSlotForCourtAndHour = (courtId, hour) => {
    return timeSlots.find(
      s => s.court_id === courtId && parseInt(s.start_time.split(':')[0]) === hour
    );
  };

  const getBookingForSlot = (slotId) => {
    if (!slotId) return null;
    return dayBookings.find(b => b.time_slot_id === slotId && b.status !== 'cancelled');
  };

  const getCustomerShortName = (fullName) => {
    if (!fullName) return 'Khách đặt';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    return parts[parts.length - 1]; // Lấy tên chính cuối cùng (ví dụ "Hào", "Khách", "Bách")
  };

  const isPeakHour = (hour) => hour >= 17 && hour <= 21;

  const formatVietnameseDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = days[dateObj.getDay()];
    return `${dayName}, ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  };

  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d - 1);
    const newY = dateObj.getFullYear();
    const newM = String(dateObj.getMonth() + 1).padStart(2, '0');
    const newD = String(dateObj.getDate()).padStart(2, '0');
    setSelectedDate(`${newY}-${newM}-${newD}`);
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d + 1);
    const newY = dateObj.getFullYear();
    const newM = String(dateObj.getMonth() + 1).padStart(2, '0');
    const newD = String(dateObj.getDate()).padStart(2, '0');
    setSelectedDate(`${newY}-${newM}-${newD}`);
  };

  const handleToday = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  };

  const isToday = () => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return selectedDate === todayStr;
  };

  const handleSlotClick = async (court, slot, hour) => {
    if (!slot) {
      if (isCourtInMaintenance(court)) {
        showToast({ type: 'warning', message: 'Sân đang trong lịch bảo trì vào ngày này, không thể đặt hoặc đổi lịch.' });
      }
      return;
    }
    
    setSelectedCourt(court);
    setSelectedSlot(slot);
    
    const underMaintenance = isCourtInMaintenance(court);
    
    if (slot.status === 'booked') {
      setIsDetailOpen(true);
      return;
    }

    if (underMaintenance) {
      showToast({ 
        type: 'warning', 
        message: 'Sân đang trong lịch bảo trì vào ngày này, không thể đặt hoặc đổi lịch.' 
      });
      return;
    }
    
    if (slot.status === 'available') {
      if (isAdmin) {
        // Admin: mở modal hỏi xác nhận khóa hay đặt sân
        setToggleSlotModal({ open: true, slot, isLocking: true });
      } else {
        setIsQuickBookOpen(true);
      }
    } else if (slot.status === 'blocked') {
      if (isAdmin) {
        setToggleSlotModal({ open: true, slot, isLocking: false });
      } else {
        showToast({ type: 'info', message: 'Khung giờ này đang bị khóa.' });
      }
    }
  };

  const handleConfirmToggleSlot = async () => {
    if (!toggleSlotModal.slot) return;
    setToggleLoading(true);
    try {
      await timeSlotsAPI.toggleBlock(toggleSlotModal.slot.id);
      showToast({
        type: 'success',
        message: toggleSlotModal.isLocking ? 'Đã khóa khung giờ thành công' : 'Đã mở khóa khung giờ thành công'
      });
      setToggleSlotModal({ open: false, slot: null, isLocking: false });
      fetchData();
    } catch(e) {
      showToast({ type: 'error', message: e.response?.data?.detail || 'Thao tác thất bại' });
    } finally {
      setToggleLoading(false);
    }
  };

  const handleSelectSuggestedSlot = (slotId) => {
    const slot = timeSlots.find(s => s.id === slotId);
    if (slot) {
      const court = courts.find(c => c.id === slot.court_id);
      setSelectedDate(slot.date);
      setSelectedCourt(court);
      setSelectedSlot(slot);
      setIsQuickBookOpen(true);
    } else {
      showToast({ type: 'warning', message: 'Khung giờ gợi ý không nằm trong ngày đang xem hoặc chưa được tải.' });
    }
  };

  return (
    <div className="schedule-page fade-in">
      {/* Page Header */}
      <div className="schedule-header">
        <div className="schedule-header-left">
          <h1 className="page-title">Lịch Đặt Sân</h1>
          <p className="page-subtitle">Xem tổng quan, quản lý khung giờ và đặt sân nhanh theo thời gian thực</p>
        </div>
      </div>

      {/* 1. Header Toolbar */}
      <div className="schedule-toolbar">
        <div className="toolbar-left">
          <div className="date-nav-group">
            <button 
              type="button" 
              className="date-nav-btn" 
              onClick={handlePrevDay} 
              title="Ngày hôm trước"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="date-picker-wrap">
              <Calendar size={17} className="date-picker-icon" />
              <input 
                type="date" 
                className="date-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <button 
              type="button" 
              className="date-nav-btn" 
              onClick={handleNextDay} 
              title="Ngày hôm sau"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <button 
            type="button" 
            className={`btn-today ${isToday() ? 'is-today-active' : ''}`} 
            onClick={handleToday}
            title="Về ngày hôm nay"
          >
            <CalendarDays size={15} />
            <span>Hôm nay</span>
          </button>

          <div className="selected-date-display">
            <span className="date-display-badge">
              {formatVietnameseDate(selectedDate)}
            </span>
          </div>
        </div>

        <div className="toolbar-right">
          {isAdmin && (
            <button 
              type="button" 
              className="btn-toolbar-outline" 
              onClick={() => setIsGenerateOpen(true)}
            >
              <Settings size={16} /> 
              <span>Sinh khung giờ</span>
            </button>
          )}

          <button 
            type="button" 
            className="btn-toolbar-ai" 
            onClick={() => setIsAIOpen(true)}
          >
            <Sparkles size={16} className="ai-sparkle-icon" /> 
            <span>✨ Nhờ AI gợi ý</span>
          </button>
        </div>
      </div>

      {/* Sport Pills Filter */}
      <div className="schedule-sport-pills">
        {[
          { id: 'all', label: 'Tất cả sân', icon: LayoutGrid, count: courts.length },
          { id: 'pickleball', label: 'Pickleball', icon: Trophy, count: courts.filter(c => (getCourtTypeName(c.court_type_id) + c.name).toLowerCase().includes('pickleball')).length },
          { id: 'badminton', label: 'Cầu lông', icon: Activity, count: courts.filter(c => (getCourtTypeName(c.court_type_id) + c.name).toLowerCase().includes('cầu lông') || (getCourtTypeName(c.court_type_id) + c.name).toLowerCase().includes('badminton')).length },
          { id: 'football', label: 'Bóng đá', icon: CircleDot, count: courts.filter(c => (getCourtTypeName(c.court_type_id) + c.name).toLowerCase().includes('bóng đá') || (getCourtTypeName(c.court_type_id) + c.name).toLowerCase().includes('football')).length },
        ].filter(p => p.id === 'all' || p.count > 0).map(pill => {
          const Icon = pill.icon;
          const isActive = selectedSport === pill.id;
          return (
            <button
              key={pill.id}
              type="button"
              className={`sport-pill-btn ${isActive ? 'active' : ''}`}
              onClick={() => setSelectedSport(pill.id)}
            >
              <Icon size={14} />
              <span>{pill.label}</span>
              <span className="sport-pill-count">{pill.count}</span>
            </button>
          );
        })}
      </div>

      {/* Legend Bar (Chú thích nhanh) */}
      <div className="schedule-legend-bar">
        <div className="legend-item">
          <span className="legend-dot available"></span>
          <span>Trống (Click để đặt)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot booked"></span>
          <span>Đã đặt (Click xem chi tiết)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot blocked"></span>
          <span>Đã khóa</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot maintenance"></span>
          <span>Bảo trì (Vô hiệu hóa)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot peak"></span>
          <span>Giờ vàng (17h - 21h)</span>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="calendar-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Đang tải dữ liệu lịch đặt sân...
          </div>
        ) : (
          <div className="calendar-scroll-area">
            <div 
              className="calendar-grid" 
              style={{ gridTemplateColumns: `88px repeat(${filteredCourts.length || 1}, minmax(160px, 1fr))` }}
            >
              {/* 2. Header row các cột Sân */}
              <div className="calendar-header-row" style={{ gridColumn: '1 / -1', gridTemplateColumns: 'subgrid' }}>
                <div className="calendar-corner-label">
                  Giờ / Sân
                </div>
                {filteredCourts.map(court => {
                  const typeName = getCourtTypeName(court.court_type_id);
                  const imgSrc = getSportImage(typeName || court.name, court.image_url);
                  const inMaintenance = isCourtInMaintenance(court);
                  const accentColor = getSportAccent(typeName || court.name) || '#10B981';

                  return (
                    <div 
                      key={court.id} 
                      className={`calendar-court-header-card ${inMaintenance ? 'in-maintenance' : ''}`}
                      style={{ '--court-accent': accentColor }}
                    >
                      <div className="court-card-top">
                        <div 
                          className="court-icon-wrapper" 
                          style={{ 
                            background: `${accentColor}18`, 
                            borderColor: `${accentColor}40` 
                          }}
                        >
                          <img
                            src={imgSrc}
                            alt={typeName || court.name}
                            onError={(e) => {
                              const lower = (court.name || '').toLowerCase();
                              if (lower.includes('pickleball')) e.currentTarget.src = '/images/sports/pickleball.svg';
                              else if (lower.includes('cầu lông') || lower.includes('badminton')) e.currentTarget.src = '/images/sports/badminton.svg';
                              else if (lower.includes('tennis')) e.currentTarget.src = '/images/sports/tennis.svg';
                              else if (lower.includes('bóng đá') || lower.includes('football')) e.currentTarget.src = '/images/sports/football.svg';
                              else e.currentTarget.src = '/images/sports/default.svg';
                            }}
                            className="court-sport-img"
                          />
                        </div>
                        <div className="court-card-info">
                          <div className="court-name-row">
                            <span className="court-name" title={court.name}>{court.name}</span>
                            {inMaintenance && (
                              <span className="court-maintenance-badge" title="Sân đang có lịch bảo trì vào ngày này">
                                <Wrench size={11} /> Bảo trì
                              </span>
                            )}
                          </div>
                          {typeName && (
                            <span className="court-type-subtitle" title={typeName}>
                              {typeName}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="court-card-bottom">
                        <span className="court-price-pill">
                          {new Intl.NumberFormat('vi-VN').format(court.price_per_hour)}đ/h
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 3 & 4. Body rows & Time Axis */}
              {hours.map(hour => {
                const peak = isPeakHour(hour);
                return (
                  <div key={hour} className="calendar-body-row" style={{ gridColumn: '1 / -1', gridTemplateColumns: 'subgrid' }}>
                    {/* Cột mốc thời gian */}
                    <div className={`calendar-time-label ${peak ? 'peak-hour' : ''}`}>
                      <span className="time-text">
                        {hour.toString().padStart(2, '0')}:00
                      </span>
                      {peak && (
                        <span className="peak-badge" title="Khung giờ cao điểm">
                          <Flame size={11} /> Giờ vàng
                        </span>
                      )}
                    </div>
                    
                    {/* Các ô sân */}
                    {filteredCourts.map(court => {
                      const slot = getSlotForCourtAndHour(court.id, hour);
                      const underMaintenance = isCourtInMaintenance(court);
                      const isBooked = slot && slot.status === 'booked';
                      const booking = isBooked ? getBookingForSlot(slot.id) : null;
                      
                      let cellClass = slot ? slot.status : 'missing';
                      if (underMaintenance && !isBooked) {
                        cellClass = 'maintenance';
                      }
                      
                      return (
                        <div 
                          key={`${court.id}-${hour}`} 
                          className={`slot-cell ${cellClass}`}
                          onClick={() => handleSlotClick(court, slot, hour)}
                        >
                          {isBooked ? (
                            <div 
                              className="slot-booked-card"
                              title={
                                booking 
                                  ? `Đơn #${booking.id} - ${booking.customer?.full_name || 'Khách đặt'} (${booking.customer?.phone || 'Chưa có SĐT'})\nKhung giờ: ${hour.toString().padStart(2, '0')}:00 - ${(hour + 1).toString().padStart(2, '0')}:00\nTổng tiền: ${new Intl.NumberFormat('vi-VN').format(booking.total_amount)}đ${booking.deposit_amount > 0 ? ` (Đã cọc: ${new Intl.NumberFormat('vi-VN').format(booking.deposit_amount)}đ)` : ''}\nClick để xem chi tiết / đổi lịch / hủy lịch`
                                  : `Đơn đặt sân #${slot.id}\nClick để xem chi tiết`
                              }
                            >
                              <div className="slot-booked-header">
                                <span className="slot-booked-code">#{booking?.id || slot.id}</span>
                                <span className="slot-booked-status-dot"></span>
                              </div>
                              <div className="slot-booked-customer">
                                <CustomerAvatar name={booking?.customer?.full_name || 'Khách'} size={20} />
                                <span className="slot-customer-name">
                                  {booking?.customer?.full_name ? getCustomerShortName(booking.customer.full_name) : 'Khách đặt'}
                                </span>
                              </div>
                              <div className="slot-booked-sub">
                                <span>{hour.toString().padStart(2, '0')}:00 - {(hour + 1).toString().padStart(2, '0')}:00</span>
                                {booking?.deposit_amount > 0 && (
                                  <span className="slot-deposit-tag">Đã cọc</span>
                                )}
                              </div>
                            </div>
                          ) : underMaintenance ? (
                            <div 
                              className="slot-maintenance-card"
                              title="Sân đang trong lịch bảo trì vào ngày này (Vô hiệu hóa đặt sân)"
                            >
                              <Wrench size={14} className="maintenance-icon" />
                              <span>Bảo trì</span>
                            </div>
                          ) : slot && slot.status === 'available' ? (
                            <>
                              <div className="slot-available-idle">
                                <span className="slot-available-badge">Trống</span>
                                <span className="slot-available-price">
                                  {new Intl.NumberFormat('vi-VN').format(court.price_per_hour)}đ
                                </span>
                              </div>
                              <div 
                                className="slot-available-hover"
                                title={`Khung giờ trống: ${hour.toString().padStart(2, '0')}:00 - ${(hour + 1).toString().padStart(2, '0')}:00\nClick để đặt sân nhanh`}
                              >
                                <Plus size={14} />
                                <span>Đặt sân</span>
                              </div>
                            </>
                          ) : slot && slot.status === 'blocked' ? (
                            <div 
                              className="slot-blocked-card"
                              title={isAdmin ? "Khung giờ đang bị khóa thủ công. Click để mở lại." : "Khung giờ đang bị khóa."}
                            >
                              <span className="slot-blocked-text">Đã khóa</span>
                            </div>
                          ) : (
                            <div 
                              className="slot-missing-content" 
                              title={isAdmin ? "Chưa sinh khung giờ này. Bấm 'Sinh khung giờ' trên thanh công cụ để tạo." : "Khung giờ chưa mở"}
                            >
                              -
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <QuickBookModal 
        isOpen={isQuickBookOpen} 
        onClose={() => setIsQuickBookOpen(false)}
        slot={selectedSlot}
        court={selectedCourt}
        onBookingSuccess={fetchData}
      />

      <BookingDetailPanel
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        slot={selectedSlot}
        court={selectedCourt}
        courts={courts}
        onStatusChange={fetchData}
      />

      <AISuggestModal 
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        onSelectSlot={handleSelectSuggestedSlot}
      />

      <GenerateSlotsModal 
        isOpen={isGenerateOpen} 
        onClose={() => setIsGenerateOpen(false)}
        courts={courts}
        onSuccess={fetchData}
      />

      {/* Modal xác nhận khóa / mở khóa khung giờ */}
      <ConfirmModal
        open={toggleSlotModal.open}
        onClose={() => setToggleSlotModal({ open: false, slot: null, isLocking: false })}
        onConfirm={handleConfirmToggleSlot}
        loading={toggleLoading}
        title={toggleSlotModal.isLocking ? "Khóa khung giờ thủ công" : "Mở khóa khung giờ"}
        message={
          toggleSlotModal.isLocking
            ? `Bạn có chắc chắn muốn khóa khung giờ ${toggleSlotModal.slot?.start_time?.slice(0,5)} - ${toggleSlotModal.slot?.end_time?.slice(0,5)} của sân này? Khách hàng sẽ không thể đặt khung giờ này.`
            : `Khung giờ ${toggleSlotModal.slot?.start_time?.slice(0,5)} - ${toggleSlotModal.slot?.end_time?.slice(0,5)} đang bị khóa. Bạn có muốn mở khóa lại để phục vụ khách không?`
        }
        confirmText={toggleSlotModal.isLocking ? "Khóa khung giờ" : "Mở khóa"}
        variant={toggleSlotModal.isLocking ? "warning" : "primary"}
      />
    </div>
  );
}
