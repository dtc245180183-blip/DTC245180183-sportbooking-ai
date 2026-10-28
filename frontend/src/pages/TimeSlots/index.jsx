import { useState, useEffect, useMemo, useCallback } from 'react';
import { timeSlotsAPI, courtsAPI, courtTypesAPI, bookingsAPI, customersAPI } from '../../api';
import {
  Calendar, RefreshCw, Lock, Unlock, Clock, Zap, CheckCircle2,
  AlertCircle, XCircle, ChevronLeft, ChevronRight, LayoutGrid,
  Grid, Flame, Sunrise, Sun, Moon, DollarSign, Filter, Plus,
  User, Phone, Check, ShieldAlert, Eye, CreditCard
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Button, Card, Badge, Modal, Input, Select, Skeleton } from '../../components/ui';
import { useNavigate } from 'react-router-dom';
import { todayVN, addDays, formatVNDateLong } from '../../utils/datetime';
import './TimeSlots.css';

/* ── Sport Metadata Helper (Icons, Badges, Colors) ── */
const getSportMeta = (courtName = '', typeName = '') => {
  const text = `${courtName} ${typeName}`.toLowerCase();
  if (text.includes('bóng đá') || text.includes('bóng a') || text.includes('bóng b') || text.includes('futsal')) {
    return { icon: '⚽', sport: 'Bóng đá', badgeColor: '#16A34A', badgeBg: '#DCFCE7' };
  }
  if (text.includes('cầu lông')) {
    return { icon: '🏸', sport: 'Cầu lông', badgeColor: '#0284C7', badgeBg: '#E0F2FE' };
  }
  if (text.includes('bóng chuyền') || text.includes('chuyền')) {
    return { icon: '🏐', sport: 'Bóng chuyền', badgeColor: '#9333EA', badgeBg: '#F3E8FF' };
  }
  if (text.includes('pickle') || text.includes('picker')) {
    return { icon: '🏓', sport: 'Pickleball', badgeColor: '#EA580C', badgeBg: '#FFEDD5' };
  }
  return { icon: '🏟️', sport: 'Sân đa năng', badgeColor: '#059669', badgeBg: '#ECFDF5' };
};

/* ── Status display constants ── */
const STATUS_CONFIG = {
  available: { label: 'Sẵn sàng', color: '#15803D', bg: '#DCFCE7', border: '#86EFAC' },
  booked:    { label: 'Đã đặt',  color: '#BE123C', bg: '#FFE4E6', border: '#FDA4AF' },
  blocked:   { label: 'Bị khóa', color: '#475569', bg: '#F1F5F9', border: '#CBD5E1' },
};

/* ── Helper: generate 7 dates around center date ── */
const getWeekDays = (centerDateStr) => {
  const days = [];
  const DOW_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const todayStr = todayVN();

  for (let offset = -3; offset <= 3; offset++) {
    const dateStr = addDays(centerDateStr, offset);
    const [y, m, d] = dateStr.split('-').map(Number);
    const targetDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const dow = DOW_NAMES[targetDate.getUTCDay()];
    const isToday = dateStr === todayStr;
    const isTomorrow = dateStr === addDays(todayStr, 1);
    days.push({
      dateStr,
      dayNum: d,
      dow,
      isToday,
      label: isToday ? 'Hôm nay' : (isTomorrow ? 'Ngày mai' : dow),
    });
  }
  return days;
};

/* ── Time Slots Component ── */
export default function TimeSlots() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  // Navigation & View States
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'matrix'
  const [selectedDate, setSelectedDate] = useState(() => todayVN());
  const [selectedCourt, setSelectedCourt] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'available' | 'booked' | 'blocked'

  // Master Data
  const [courts, setCourts] = useState([]);
  const [courtTypes, setCourtTypes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [bookings, setBookings] = useState([]);

  // Slots Data
  const [slots, setSlots] = useState([]);
  const [matrixSlots, setMatrixSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  // Bulk Selection
  const [selectedSlotIds, setSelectedSlotIds] = useState(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Modals
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [bulkForm, setBulkForm] = useState(() => ({
    court_id: '',
    start_date: todayVN(),
    end_date: todayVN(),
    start_hour: 6,
    end_hour: 22,
    duration_minutes: 60,
  }));

  // Modal: View Booking Detail
  const [activeBooking, setActiveBooking] = useState(null);



  // 1. Initial Load Master Data
  useEffect(() => {
    Promise.all([
      courtsAPI.getAll({}),
      courtTypesAPI.getAll().catch(() => []),
      customersAPI.getAll({}).catch(() => []),
      bookingsAPI.getAll({ limit: 300 }).catch(() => []),
    ]).then(([cList, ctList, custList, bList]) => {
      setCourts(Array.isArray(cList) ? cList : []);
      setCourtTypes(Array.isArray(ctList) ? ctList : []);
      setCustomers(Array.isArray(custList) ? custList : []);
      setBookings(Array.isArray(bList) ? bList : []);
      if (Array.isArray(cList) && cList.length > 0 && !selectedCourt) {
        setSelectedCourt(String(cList[0].id));
      }
    }).catch(err => {
      console.error('Failed to load initial data', err);
    });
  }, []);

  // 2. Fetch Slots on Date / Court / View Mode Change
  const fetchSlots = useCallback(async () => {
    setLoading(true);
    setSelectedSlotIds(new Set());
    try {
      if (viewMode === 'grid') {
        if (!selectedCourt) {
          setSlots([]);
          return;
        }
        const data = await timeSlotsAPI.getAll({ court_id: selectedCourt, filter_date: selectedDate, limit: 200 });
        const list = Array.isArray(data) ? data : [];
        list.sort((a, b) => a.start_time.localeCompare(b.start_time));
        setSlots(list);
      } else {
        // Matrix view: fetch all slots for this date
        const data = await timeSlotsAPI.getAll({ filter_date: selectedDate, limit: 500 });
        const list = Array.isArray(data) ? data : [];
        setMatrixSlots(list);
      }

      // Refresh bookings
      const bRes = await bookingsAPI.getAll({ limit: 300 }).catch(() => []);
      if (Array.isArray(bRes)) setBookings(bRes);
    } catch (e) {
      console.error('Failed to fetch slots', e);
    } finally {
      setLoading(false);
    }
  }, [viewMode, selectedCourt, selectedDate]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // Mapping slot_id -> booking object
  const slotBookingMap = useMemo(() => {
    const map = {};
    bookings.forEach(b => {
      if (b.time_slot_id && b.status !== 'cancelled') {
        const cust = customers.find(c => c.id === b.customer_id) || {};
        map[b.time_slot_id] = {
          ...b,
          customerName: cust.full_name || 'Khách vãng lai',
          customerPhone: cust.phone || '',
        };
      }
    });
    return map;
  }, [bookings, customers]);

  // Current active court object
  const currentCourt = useMemo(() => {
    return courts.find(c => String(c.id) === String(selectedCourt)) || courts[0] || {};
  }, [courts, selectedCourt]);

  const currentCourtMeta = useMemo(() => {
    const typeName = courtTypes.find(t => t.id === currentCourt.court_type_id)?.name || '';
    return getSportMeta(currentCourt.name, typeName);
  }, [currentCourt, courtTypes]);

  // Filtered slots according to status filter
  const displayedSlots = useMemo(() => {
    if (statusFilter === 'all') return slots;
    return slots.filter(s => s.status === statusFilter);
  }, [slots, statusFilter]);

  // 3. Shift Breakdown (Sáng: 06-12, Chiều: 12-17, Tối Giờ Vàng: 17-23)
  const shiftGroups = useMemo(() => {
    const morning = [];
    const afternoon = [];
    const evening = [];

    displayedSlots.forEach(s => {
      const h = parseInt(s.start_time.slice(0, 2), 10);
      if (h < 12) morning.push(s);
      else if (h < 17) afternoon.push(s);
      else evening.push(s);
    });

    return [
      {
        id: 'morning',
        name: 'Ca Sáng (06:00 - 12:00)',
        subtitle: 'Mở cửa ca sớm & tiêu chuẩn',
        icon: Sunrise,
        color: '#D97706',
        bg: '#FEF3C7',
        border: '#FDE68A',
        slots: morning,
        availableCount: morning.filter(s => s.status === 'available').length,
      },
      {
        id: 'afternoon',
        name: 'Ca Chiều (12:00 - 17:00)',
        subtitle: 'Khung giờ thấp điểm & linh hoạt',
        icon: Sun,
        color: '#2563EB',
        bg: '#DBEAFE',
        border: '#BFDBFE',
        slots: afternoon,
        availableCount: afternoon.filter(s => s.status === 'available').length,
      },
      {
        id: 'evening',
        name: 'Giờ Vàng Buổi Tối (17:00 - 23:00)',
        subtitle: 'Khung giờ cao điểm có yêu cầu cọc',
        icon: Moon,
        color: '#7C3AED',
        bg: '#F3E8FF',
        border: '#DDD6FE',
        isHot: true,
        slots: evening,
        availableCount: evening.filter(s => s.status === 'available').length,
      },
    ].filter(g => g.slots.length > 0);
  }, [displayedSlots]);

  // Capacity & KPI Statistics for current selection
  const kpiStats = useMemo(() => {
    const list = viewMode === 'grid' ? slots : matrixSlots;
    const total = list.length;
    const available = list.filter(s => s.status === 'available').length;
    const booked = list.filter(s => s.status === 'booked').length;
    const blocked = list.filter(s => s.status === 'blocked').length;
    const occupancyRate = total > 0 ? Math.round((booked / total) * 100) : 0;

    // Projected revenue today from booked slots
    const projectedRev = list
      .filter(s => s.status === 'booked')
      .reduce((sum, s) => {
        const c = courts.find(item => item.id === s.court_id) || currentCourt;
        return sum + (c.price_per_hour || 0);
      }, 0);

    return { total, available, booked, blocked, occupancyRate, projectedRev };
  }, [viewMode, slots, matrixSlots, courts, currentCourt]);

  // Matrix View Rows (Unique start hours: 06:00 -> 23:00)
  const matrixHours = useMemo(() => {
    const set = new Set();
    matrixSlots.forEach(s => set.add(s.start_time.slice(0, 5)));
    return Array.from(set).sort();
  }, [matrixSlots]);

  // 4. Action Handlers
  const handleToggleBlock = async (slotId, e) => {
    if (e) e.stopPropagation();
    if (!isAdmin) return;
    try {
      await timeSlotsAPI.toggleBlock(slotId);
      showToast({ type: 'success', message: 'Cập nhật trạng thái khóa/mở ca thành công' });
      fetchSlots();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.detail || 'Không thể đổi trạng thái slot này' });
    }
  };

  // Bulk actions: select/deselect
  const handleToggleSelectSlot = (slotId, e) => {
    if (e) e.stopPropagation();
    setSelectedSlotIds(prev => {
      const next = new Set(prev);
      if (next.has(slotId)) next.delete(slotId);
      else next.add(slotId);
      return next;
    });
  };

  const handleSelectAllAvailable = () => {
    const avIds = slots.filter(s => s.status === 'available').map(s => s.id);
    setSelectedSlotIds(new Set(avIds));
  };

  const handleBulkToggleBlock = async (shouldBlock) => {
    if (!isAdmin || selectedSlotIds.size === 0) return;
    setBulkProcessing(true);
    let successCount = 0;
    try {
      for (const id of Array.from(selectedSlotIds)) {
        const slot = slots.find(s => s.id === id);
        if (slot) {
          if ((shouldBlock && slot.status === 'available') || (!shouldBlock && slot.status === 'blocked')) {
            await timeSlotsAPI.toggleBlock(id);
            successCount++;
          }
        }
      }
      showToast({ type: 'success', message: `Đã ${shouldBlock ? 'khóa' : 'mở'} thành công ${successCount} ca` });
      setSelectedSlotIds(new Set());
      fetchSlots();
    } catch (err) {
      showToast({ type: 'error', message: 'Có lỗi phát sinh khi xử lý hàng loạt' });
    } finally {
      setBulkProcessing(false);
    }
  };



  // Bulk Generator Open Helper
  const handleOpenBulkModal = (courtIdToUse = null) => {
    setBulkForm({
      court_id: courtIdToUse || selectedCourt || (courts[0]?.id ? String(courts[0].id) : 'all'),
      start_date: selectedDate,
      end_date: selectedDate,
      start_hour: 6,
      end_hour: 22,
      duration_minutes: 60,
    });
    setShowBulkModal(true);
  };

  // Quick 1-click generation for current court on selectedDate
  const handleQuickGenerateForCurrentCourt = async () => {
    const courtId = selectedCourt || (courts[0]?.id ? String(courts[0].id) : null);
    if (!courtId) {
      showToast({ type: 'warning', message: 'Vui lòng chọn sân trước' });
      return;
    }
    setGenerating(true);
    try {
      const payload = {
        court_id: parseInt(courtId),
        date_from: selectedDate,
        date_to: selectedDate,
        start_hour: 6,
        end_hour: 22,
        slot_duration_hours: 1,
      };
      const result = await timeSlotsAPI.generate(payload);
      const courtName = courts.find(c => c.id === parseInt(courtId))?.name || 'Sân';
      showToast({
        type: 'success',
        message: `✅ ${courtName}: Đã tạo thành công ${result.created_count} ca mới cho ngày ${selectedDate}! (bỏ qua ${result.skipped_count} ca trùng)`,
      });
      fetchSlots();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.detail || 'Lỗi khi tạo khung giờ' });
    } finally {
      setGenerating(false);
    }
  };

  // Bulk Generator (form submission)
  const handleBulkGenerate = async (e) => {
    e.preventDefault();
    const courtId = bulkForm.court_id || selectedCourt;
    if (!courtId) {
      showToast({ type: 'warning', message: 'Vui lòng chọn sân cần sinh khung giờ' });
      return;
    }
    if (parseInt(bulkForm.start_hour) >= parseInt(bulkForm.end_hour)) {
      showToast({ type: 'warning', message: 'Giờ bắt đầu phải nhỏ hơn giờ kết thúc' });
      return;
    }
    setGenerating(true);
    try {
      const durationMinutes = parseInt(bulkForm.duration_minutes) || 60;
      if (courtId === 'all') {
        let totalCreated = 0;
        let totalSkipped = 0;
        for (const court of courts) {
          const payload = {
            court_id: court.id,
            date_from: bulkForm.start_date,
            date_to: bulkForm.end_date,
            start_hour: parseInt(bulkForm.start_hour),
            end_hour: parseInt(bulkForm.end_hour),
            duration_minutes: durationMinutes,
            slot_duration_hours: durationMinutes / 60,
          };
          const res = await timeSlotsAPI.generate(payload);
          totalCreated += (res.created_count || 0);
          totalSkipped += (res.skipped_count || 0);
        }
        showToast({
          type: 'success',
          message: `✅ Đã tạo thành công ${totalCreated} ca mới cho tất cả ${courts.length} sân (bỏ qua ${totalSkipped} ca trùng lặp)`,
        });
      } else {
        const payload = {
          court_id: parseInt(courtId),
          date_from: bulkForm.start_date,
          date_to: bulkForm.end_date,
          start_hour: parseInt(bulkForm.start_hour),
          end_hour: parseInt(bulkForm.end_hour),
          duration_minutes: durationMinutes,
          slot_duration_hours: durationMinutes / 60,
        };
        const result = await timeSlotsAPI.generate(payload);
        const courtName = courts.find(c => c.id === parseInt(courtId))?.name || '';
        showToast({
          type: 'success',
          message: `✅ ${courtName}: Đã tạo ${result.created_count} ca mới (bỏ qua ${result.skipped_count} ca trùng lặp)`,
        });
        setSelectedCourt(String(courtId));
      }
      setShowBulkModal(false);
      fetchSlots();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.detail || 'Lỗi khi tạo khung giờ' });
    } finally {
      setGenerating(false);
    }
  };

  // Date Navigation
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

  const handlePrevDay = () => {
    setSelectedDate(prev => addDays(prev, -1));
  };

  const handleNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  const handleToday = () => {
    setSelectedDate(todayVN());
  };

  return (
    <div className="timeslots-page animate-fade-in">
      {/* ── Top Header Card ───────────────────────────────── */}
      <div className="timeslots-header-card">
        <div className="timeslots-title-area">
          <h1>
            <Clock size={24} style={{ color: '#059669' }} />
            Khung giờ &amp; Trạng thái Đặt
          </h1>
          <p>Bảng điều phối ca sân thể thao thông minh — Ma trận đa sân thời gian thực &amp; Phân ca hoạt động</p>
        </div>

        <div className="timeslots-top-actions">
          {/* View Mode Switcher */}
          <div className="view-mode-pill-group">
            <button
              className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid size={15} />
              <span>Xem theo sân (Phân ca)</span>
            </button>
            <button
              className={`view-mode-btn ${viewMode === 'matrix' ? 'active' : ''}`}
              onClick={() => setViewMode('matrix')}
            >
              <Grid size={15} />
              <span>Ma trận toàn sân (Timeline)</span>
            </button>
          </div>

          {isAdmin && (
            <Button
              variant="primary"
              icon={<Zap size={15} />}
              onClick={() => handleOpenBulkModal(selectedCourt)}
              style={{ background: 'linear-gradient(135deg, #059669, #10B981)', boxShadow: '0 2px 8px rgba(16,185,129,0.25)' }}
            >
              Tạo ca tự động
            </Button>
          )}
        </div>
      </div>

      {/* ── Smart Date Strip Navigator ───────────────────── */}
      <div className="date-navigator-card">
        <div className="date-nav-header">
          <div className="date-nav-label">
            <Calendar size={18} style={{ color: '#2563EB' }} />
            <span>Thời gian vận hành: <strong>{formatVNDateLong(selectedDate)}</strong></span>
          </div>

          <div className="date-nav-controls">
            <Button variant="secondary" size="sm" icon={<ChevronLeft size={14} />} onClick={handlePrevDay}>
              Ngày trước
            </Button>
            <Button variant="secondary" size="sm" onClick={handleToday}>
              Hôm nay
            </Button>
            <Button variant="secondary" size="sm" icon={<ChevronRight size={14} />} onClick={handleNextDay}>
              Ngày sau
            </Button>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              style={{
                border: '1px solid #CBD5E1', borderRadius: 8, padding: '4px 8px', fontSize: '0.82rem',
                color: '#0F172A', outline: 'none', background: '#FFFFFF', cursor: 'pointer'
              }}
            />
            <Button variant="secondary" size="sm" icon={<RefreshCw size={13} />} onClick={fetchSlots} title="Tải lại dữ liệu">
              Làm mới
            </Button>
          </div>
        </div>

        {/* 7-Day Pill Strip */}
        <div className="date-strip-scroll">
          {weekDays.map(d => (
            <div
              key={d.dateStr}
              className={`date-pill-item ${d.dateStr === selectedDate ? 'active' : ''}`}
              onClick={() => setSelectedDate(d.dateStr)}
            >
              <div className="date-pill-dow">{d.label}</div>
              <div className="date-pill-date">{d.dayNum}</div>
              <div className="date-pill-badge">{d.dateStr.slice(5)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Live Capacity & Metrics KPIs ─────────────────── */}
      <div className="timeslots-stats-grid">
        <div className="slot-stat-card" style={{ borderTopColor: '#6366F1' }}>
          <div className="slot-stat-header">
            <span className="slot-stat-title">Tổng số ca</span>
            <div className="slot-stat-icon" style={{ background: '#EEF2FF', color: '#6366F1' }}>
              <Calendar size={16} />
            </div>
          </div>
          <p className="slot-stat-val" style={{ color: '#0F172A' }}>{kpiStats.total}</p>
          <p className="slot-stat-sub">Trong ngày {selectedDate.slice(5)}</p>
        </div>

        <div className="slot-stat-card" style={{ borderTopColor: '#10B981' }}>
          <div className="slot-stat-header">
            <span className="slot-stat-title">Ca sẵn sàng</span>
            <div className="slot-stat-icon" style={{ background: '#DCFCE7', color: '#059669' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="slot-stat-val" style={{ color: '#059669' }}>{kpiStats.available}</p>
          <div className="slot-stat-progress">
            <div
              className="slot-stat-progress-fill"
              style={{ width: `${kpiStats.total > 0 ? (kpiStats.available / kpiStats.total) * 100 : 0}%`, background: '#10B981' }}
            />
          </div>
        </div>

        <div className="slot-stat-card" style={{ borderTopColor: '#EF4444' }}>
          <div className="slot-stat-header">
            <span className="slot-stat-title">Ca đã đặt</span>
            <div className="slot-stat-icon" style={{ background: '#FEE2E2', color: '#DC2626' }}>
              <Flame size={16} />
            </div>
          </div>
          <p className="slot-stat-val" style={{ color: '#DC2626' }}>{kpiStats.booked}</p>
          <div className="slot-stat-progress">
            <div
              className="slot-stat-progress-fill"
              style={{ width: `${kpiStats.occupancyRate}%`, background: '#EF4444' }}
            />
          </div>
        </div>

        <div className="slot-stat-card" style={{ borderTopColor: '#64748B' }}>
          <div className="slot-stat-header">
            <span className="slot-stat-title">Bị khóa / Bảo trì</span>
            <div className="slot-stat-icon" style={{ background: '#F1F5F9', color: '#475569' }}>
              <Lock size={16} />
            </div>
          </div>
          <p className="slot-stat-val" style={{ color: '#475569' }}>{kpiStats.blocked}</p>
          <p className="slot-stat-sub">Tạm ngưng phục vụ</p>
        </div>

        <div className="slot-stat-card" style={{ borderTopColor: '#059669', background: 'linear-gradient(135deg, #F0FDF4, #FFFFFF)' }}>
          <div className="slot-stat-header">
            <span className="slot-stat-title">Công suất &amp; Dự thu</span>
            <div className="slot-stat-icon" style={{ background: '#DCFCE7', color: '#059669' }}>
              <DollarSign size={16} />
            </div>
          </div>
          <p className="slot-stat-val" style={{ color: '#059669' }}>{kpiStats.occupancyRate}%</p>
          <p className="slot-stat-sub" style={{ fontWeight: 600, color: '#15803D' }}>
            Dự thu: {kpiStats.projectedRev.toLocaleString('vi-VN')}đ
          </p>
        </div>
      </div>

      {/* ── View 1: Chế độ Lưới phân ca theo sân (Single Court Shift View) ── */}
      {viewMode === 'grid' && (
        <div>
          {/* Horizontal Court Tabs Strip */}
          <div className="court-selector-strip">
            {courts.map(c => {
              const typeName = courtTypes.find(t => t.id === c.court_type_id)?.name || '';
              const meta = getSportMeta(c.name, typeName);
              const isActive = String(c.id) === String(selectedCourt);
              return (
                <button
                  key={c.id}
                  className={`court-strip-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedCourt(String(c.id))}
                >
                  <span>{meta.icon}</span>
                  <span>{c.name}</span>
                  <span style={{ fontSize: '0.72rem', opacity: 0.8, color: isActive ? '#047857' : '#64748B' }}>
                    ({(c.price_per_hour || 50000).toLocaleString('vi-VN')}đ/h)
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filter Bar & Quick Actions */}
          <div className="filter-action-bar">
            <div className="filter-chips-wrap">
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Filter size={13} /> Lọc trạng thái:
              </span>
              <button className={`filter-chip ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>
                Tất cả ca ({slots.length})
              </button>
              <button className={`filter-chip ${statusFilter === 'available' ? 'active' : ''}`} onClick={() => setStatusFilter('available')}>
                🟢 Sẵn sàng ({slots.filter(s => s.status === 'available').length})
              </button>
              <button className={`filter-chip ${statusFilter === 'booked' ? 'active' : ''}`} onClick={() => setStatusFilter('booked')}>
                🔴 Đã đặt ({slots.filter(s => s.status === 'booked').length})
              </button>
              <button className={`filter-chip ${statusFilter === 'blocked' ? 'active' : ''}`} onClick={() => setStatusFilter('blocked')}>
                🔒 Bị khóa ({slots.filter(s => s.status === 'blocked').length})
              </button>
            </div>

            {isAdmin && slots.length > 0 && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Button variant="secondary" size="sm" onClick={handleSelectAllAvailable}>
                  Chọn tất cả ca trống
                </Button>
              </div>
            )}
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} height="130px" variant="rect" style={{ borderRadius: 12 }} />
              ))}
            </div>
          )}

          {/* Empty States */}
          {!loading && slots.length === 0 && (
            <Card padding="lg" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
              <Clock size={44} style={{ color: '#94A3B8', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>
                Chưa có khung giờ nào cho sân này trong ngày {selectedDate}
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#64748B', maxWidth: 480, margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                Bạn có thể bấm <strong>"Tạo khung giờ cho ngày này"</strong> để sinh nhanh 16 ca (06:00 – 22:00) cho <strong>{currentCourt.name}</strong>, hoặc mở tùy chọn tạo nâng cao.
              </p>
              {isAdmin && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <Button
                    variant="primary"
                    icon={<Zap size={15} />}
                    loading={generating}
                    onClick={handleQuickGenerateForCurrentCourt}
                    style={{ background: 'linear-gradient(135deg, #059669, #10B981)', padding: '0.625rem 1.25rem', fontWeight: 600 }}
                  >
                    Tạo khung giờ cho ngày này (06:00 - 22:00)
                  </Button>
                  <Button
                    variant="secondary"
                    icon={<Calendar size={15} />}
                    onClick={() => handleOpenBulkModal(selectedCourt)}
                    style={{ padding: '0.625rem 1.25rem' }}
                  >
                    Tùy chọn tạo nhiều ngày / nhiều sân...
                  </Button>
                </div>
              )}
            </Card>
          )}

          {/* Shift Sections (Sáng, Chiều, Tối) */}
          {!loading && shiftGroups.map(group => {
            const GroupIcon = group.icon;
            return (
              <div key={group.id} className="shift-section">
                <div className="shift-section-header">
                  <div className="shift-title-group">
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, background: group.bg, color: group.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <GroupIcon size={18} />
                    </div>
                    <div>
                      <h4 className="shift-title">
                        {group.name}
                        {group.isHot && (
                          <span className="shift-badge-pulse">
                            <Flame size={12} /> Giờ Vàng 🔥
                          </span>
                        )}
                      </h4>
                      <span className="shift-time-tag">{group.subtitle}</span>
                    </div>
                  </div>

                  <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
                    Còn trống: <strong style={{ color: '#059669' }}>{group.availableCount}</strong>/{group.slots.length} ca
                  </span>
                </div>

                <div className="shift-slots-grid">
                  {group.slots.map(slot => {
                    const isBooked = slot.status === 'booked';
                    const isBlocked = slot.status === 'blocked';
                    const isAvailable = slot.status === 'available';
                    const booking = slotBookingMap[slot.id];
                    const cfg = STATUS_CONFIG[slot.status] || STATUS_CONFIG.available;
                    const isSelected = selectedSlotIds.has(slot.id);

                    return (
                      <div
                        key={slot.id}
                        className={`enterprise-slot-card ${slot.status}`}
                        style={{
                          outline: isSelected ? '2px solid #2563EB' : 'none',
                        }}
                      >
                        {/* Header: Time & Status tag */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <span className="slot-time-range">
                              {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                            </span>
                            <span className="slot-card-status-badge">
                              {cfg.label}
                            </span>
                          </div>

                          {/* Price Tag */}
                          <div className="slot-card-price">
                            {(currentCourt.price_per_hour || 50000).toLocaleString('vi-VN')}đ/ca
                          </div>
                        </div>

                        {/* Middle Content */}
                        {isBooked && booking && (
                          <div className="slot-card-customer-info">
                            <p className="slot-cust-name" title={booking.customerName}>
                              👤 {booking.customerName}
                            </p>
                            <div className="slot-cust-sub">
                              <span>#{booking.id}</span>
                              {booking.customerPhone && <span>• 📞 {booking.customerPhone}</span>}
                            </div>
                            <div style={{ marginTop: 4, display: 'flex', gap: 4 }}>
                              <span style={{ fontSize: '0.68rem', background: '#FEF3C7', color: '#B45309', padding: '1px 5px', borderRadius: 4, fontWeight: 600 }}>
                                {booking.deposit_amount > 0 ? `Đã cọc ${(booking.deposit_amount).toLocaleString('vi-VN')}đ` : 'Chưa cọc'}
                              </span>
                            </div>
                          </div>
                        )}

                        {isBlocked && (
                          <div style={{ margin: '8px 0', fontSize: '0.74rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Lock size={12} /> Đang tạm khóa bảo trì
                          </div>
                        )}

                        {/* Bottom Actions */}
                        <div className="slot-card-actions">
                          {isAvailable && (
                            <>
                              {isAdmin ? (
                                <button
                                  className="slot-action-btn secondary"
                                  onClick={(e) => handleToggleBlock(slot.id, e)}
                                  title="Tạm khóa ca này"
                                  style={{ width: '100%', borderColor: '#CBD5E1', color: '#475569' }}
                                >
                                  <Lock size={12} /> Tạm khóa ca
                                </button>
                              ) : (
                                <span style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 600, textAlign: 'center', width: '100%', padding: '4px 0' }}>
                                  ✓ Sẵn sàng đón khách
                                </span>
                              )}
                            </>
                          )}

                          {isBooked && (
                            <button
                              className="slot-action-btn secondary"
                              onClick={() => setActiveBooking(booking)}
                              style={{ width: '100%', color: '#BE123C', borderColor: '#FDA4AF', background: '#FFF1F2' }}
                            >
                              <Eye size={12} /> Chi tiết đơn #{booking?.id}
                            </button>
                          )}

                          {isBlocked && isAdmin && (
                            <button
                              className="slot-action-btn primary"
                              onClick={(e) => handleToggleBlock(slot.id, e)}
                              style={{ width: '100%', background: '#475569' }}
                            >
                              <Unlock size={12} /> Mở khóa ca
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── View 2: Chế độ Ma trận Toàn bộ Sân (Multi-Court Timeline Matrix) ── */}
      {viewMode === 'matrix' && (
        <div className="matrix-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Grid size={18} style={{ color: '#059669' }} />
                Ma trận Toàn bộ Sân ngày {selectedDate}
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '2px 0 0' }}>
                Đối chiếu trực quan tình trạng lịch đặt của tất cả các sân theo từng khung giờ
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12, fontSize: '0.78rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: '#DCFCE7', border: '1px solid #86EFAC' }} /> Sẵn sàng
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: '#FFE4E6', border: '1px solid #FDA4AF' }} /> Đã đặt
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: '#F1F5F9', border: '1px solid #CBD5E1' }} /> Bị khóa
              </span>
            </div>
          </div>

          {loading ? (
            <Skeleton height="350px" variant="rect" style={{ borderRadius: 12 }} />
          ) : matrixHours.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
              <Clock size={36} style={{ color: '#CBD5E1', margin: '0 auto 8px' }} />
              <p>Chưa có khung giờ nào được sinh cho các sân trong ngày {selectedDate}</p>
              {isAdmin && (
                <Button variant="primary" size="sm" icon={<Zap size={14} />} onClick={() => setShowBulkModal(true)}>
                  Tạo ca tự động
                </Button>
              )}
            </div>
          ) : (
            <table className="matrix-table">
              <thead>
                <tr>
                  <th className="matrix-header-cell" style={{ width: 110, background: '#0F172A', color: '#FFFFFF' }}>
                    Khung giờ
                  </th>
                  {courts.map(c => {
                    const typeName = courtTypes.find(t => t.id === c.court_type_id)?.name || '';
                    const meta = getSportMeta(c.name, typeName);
                    return (
                      <th key={c.id} className="matrix-header-cell">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <span>{meta.icon}</span>
                          <span>{c.name}</span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 500, marginTop: 2 }}>
                          {(c.price_per_hour || 50000).toLocaleString('vi-VN')}đ/h
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {matrixHours.map(hour => {
                  return (
                    <tr key={hour}>
                      <td className="matrix-time-col">
                        {hour}
                      </td>
                      {courts.map(court => {
                        const slot = matrixSlots.find(
                          s => s.court_id === court.id && s.start_time.slice(0, 5) === hour
                        );

                        if (!slot) {
                          return (
                            <td key={court.id} className="matrix-slot-cell empty">
                              <span>—</span>
                            </td>
                          );
                        }

                        const booking = slotBookingMap[slot.id];

                        if (slot.status === 'booked') {
                          return (
                            <td
                              key={court.id}
                              className="matrix-slot-cell booked"
                              onClick={() => booking && setActiveBooking(booking)}
                              title={booking ? `Đã đặt bởi: ${booking.customerName} (#${booking.id})` : 'Đã đặt'}
                            >
                              <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                🔴 {booking?.customerName || 'Đã đặt'}
                              </div>
                              <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>
                                #{booking?.id} • {(court.price_per_hour || 50000).toLocaleString('vi-VN')}đ
                              </div>
                            </td>
                          );
                        }

                        if (slot.status === 'blocked') {
                          return (
                            <td
                              key={court.id}
                              className="matrix-slot-cell blocked"
                              onClick={() => isAdmin && handleToggleBlock(slot.id)}
                              title={isAdmin ? 'Click để mở khóa' : 'Bị khóa'}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontWeight: 600 }}>
                                <Lock size={12} /> Khóa
                              </div>
                            </td>
                          );
                        }

                        return (
                          <td
                            key={court.id}
                            className="matrix-slot-cell available"
                            title="Khung giờ sẵn sàng đón khách"
                          >
                            <div style={{ fontWeight: 700 }}>
                              🟢 Sẵn sàng
                            </div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>
                              {(court.price_per_hour || 50000).toLocaleString('vi-VN')}đ
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Floating Bar for Bulk Actions ─────────────────── */}
      {selectedSlotIds.size > 0 && (
        <div className="bulk-floating-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem', fontWeight: 600 }}>
            <Check size={18} style={{ color: '#10B981' }} />
            <span>Đã chọn <strong>{selectedSlotIds.size}</strong> ca</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => handleBulkToggleBlock(true)}
              disabled={bulkProcessing}
              style={{
                background: '#EF4444', color: '#FFFFFF', border: 'none', borderRadius: 8,
                padding: '6px 14px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 5
              }}
            >
              <Lock size={13} /> Khóa {selectedSlotIds.size} ca
            </button>
            <button
              onClick={() => handleBulkToggleBlock(false)}
              disabled={bulkProcessing}
              style={{
                background: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: 8,
                padding: '6px 14px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 5
              }}
            >
              <Unlock size={13} /> Mở {selectedSlotIds.size} ca
            </button>
            <button
              onClick={() => setSelectedSlotIds(new Set())}
              style={{
                background: 'transparent', color: '#94A3B8', border: 'none', cursor: 'pointer',
                fontSize: '0.82rem', padding: '6px'
              }}
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}



      {/* ── Modal: View Booking Detail ───────────────────── */}
      {activeBooking && (
        <Modal
          open={Boolean(activeBooking)}
          isOpen={true}
          title={`Chi tiết Đơn đặt sân #${activeBooking.id}`}
          onClose={() => setActiveBooking(null)}
          maxWidth="500px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: 12,
              padding: '1rem', display: 'flex', alignItems: 'center', gap: 12
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#FFE4E6', color: '#E11D48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={22} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#9F1239' }}>
                  {activeBooking.customerName}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                  📞 SĐT: <strong>{activeBooking.customerPhone || 'Không có'}</strong>
                </p>
              </div>
            </div>

            <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '0.85rem 1rem', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Trạng thái:</span>
                <span style={{ fontWeight: 700, color: activeBooking.status === 'confirmed' ? '#15803D' : '#0F172A' }}>
                  {activeBooking.status === 'confirmed' ? 'Đã xác nhận' : activeBooking.status}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Tổng tiền ca:</span>
                <strong>{(activeBooking.total_amount || 0).toLocaleString('vi-VN')}đ</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Tiền cọc ghi nhận:</span>
                <strong style={{ color: '#B45309' }}>{(activeBooking.deposit_amount || 0).toLocaleString('vi-VN')}đ</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Còn thiếu:</span>
                <strong style={{ color: '#DC2626' }}>
                  {Math.max(0, (activeBooking.total_amount || 0) - (activeBooking.deposit_amount || 0)).toLocaleString('vi-VN')}đ
                </strong>
              </div>
              {activeBooking.note && (
                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 6, color: '#475569', fontSize: '0.8rem' }}>
                  📝 Ghi chú: <em>{activeBooking.note}</em>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Button variant="secondary" onClick={() => setActiveBooking(null)}>
                Đóng
              </Button>
              <Button
                variant="primary"
                icon={<CreditCard size={14} />}
                onClick={() => {
                  setActiveBooking(null);
                  navigate('/payments');
                }}
              >
                Đến trang Thanh toán
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Modal: Bulk Generate Slots ───────────────────── */}
      {showBulkModal && (
        <Modal
          open={showBulkModal}
          isOpen={true}
          title="⚡ Tạo khung giờ tự động (Bulk Generator)"
          onClose={() => setShowBulkModal(false)}
          maxWidth="560px"
        >
          <form onSubmit={handleBulkGenerate}>
            <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0 0 1.25rem' }}>
              Tự động sinh các ca chơi theo khoảng giờ và khoảng ngày định sẵn. Hệ thống tự động bỏ qua các ca đã tồn tại để tránh trùng lặp.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Select
                label="Chọn sân áp dụng *"
                value={bulkForm.court_id}
                onChange={e => setBulkForm(p => ({ ...p, court_id: e.target.value }))}
                options={[
                  { value: 'all', label: '🌟 Tất cả các sân (Áp dụng đồng loạt)' },
                  ...courts.map(c => ({ value: String(c.id), label: c.name }))
                ]}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Input
                  label="Từ ngày *"
                  type="date"
                  value={bulkForm.start_date}
                  onChange={e => setBulkForm(p => ({ ...p, start_date: e.target.value }))}
                />
                <Input
                  label="Đến ngày *"
                  type="date"
                  min={bulkForm.start_date}
                  value={bulkForm.end_date}
                  onChange={e => setBulkForm(p => ({ ...p, end_date: e.target.value }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Select
                  label="Giờ bắt đầu hàng ngày"
                  value={bulkForm.start_hour}
                  onChange={e => setBulkForm(p => ({ ...p, start_hour: e.target.value }))}
                  options={Array.from({ length: 18 }, (_, i) => ({ value: i + 5, label: `${String(i + 5).padStart(2, '0')}:00` }))}
                />
                <Select
                  label="Giờ đóng cửa hàng ngày"
                  value={bulkForm.end_hour}
                  onChange={e => setBulkForm(p => ({ ...p, end_hour: e.target.value }))}
                  options={Array.from({ length: 18 }, (_, i) => ({ value: i + 6, label: `${String(i + 6).padStart(2, '0')}:00` }))}
                />
              </div>

              <Select
                label="Thời lượng mỗi ca"
                value={bulkForm.duration_minutes}
                onChange={e => setBulkForm(p => ({ ...p, duration_minutes: parseInt(e.target.value) }))}
                options={[
                  { value: 60, label: '60 phút (Tiêu chuẩn 1 giờ/ca)' },
                  { value: 90, label: '90 phút (1 tiếng rưỡi/ca - Chuẩn đá bóng phong trào)' },
                  { value: 120, label: '120 phút (2 giờ/ca)' },
                ]}
              />

              <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: 8, padding: '0.75rem', fontSize: '0.78rem', color: '#475569' }}>
                💡 <strong>Dự kiến:</strong> Mỗi ngày sinh khoảng <strong>{Math.max(0, Math.floor(((parseInt(bulkForm.end_hour) - parseInt(bulkForm.start_hour)) * 60) / (bulkForm.duration_minutes || 60)))} ca</strong> từ {bulkForm.start_hour}:00 đến {bulkForm.end_hour}:00{bulkForm.court_id === 'all' ? ` cho tất cả ${courts.length} sân` : ''}.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <Button variant="secondary" onClick={() => setShowBulkModal(false)} type="button">
                Hủy bỏ
              </Button>
              <Button variant="primary" type="submit" loading={generating} icon={<Zap size={14} />}>
                {generating ? 'Đang tạo ca...' : 'Bắt đầu tạo ca'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
