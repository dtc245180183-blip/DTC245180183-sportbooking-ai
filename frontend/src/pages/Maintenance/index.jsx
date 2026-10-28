import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { maintenanceAPI, courtsAPI, courtTypesAPI } from '../../api';
import {
  Wrench, Plus, Edit, Trash2, AlertTriangle, CheckCircle, Clock,
  Search, Filter, Calendar, LayoutList, Columns, ChevronRight,
  ShieldCheck, AlertCircle, ArrowRight, RefreshCw, Sparkles, X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Button, Card, Badge, Modal, Input, Select, ConfirmModal, Skeleton } from '../../components/ui';
import { todayVN } from '../../utils/datetime';
import './Maintenance.css';

/* ── Status definitions ───────────────────────────── */
const STATUS_OPTS = [
  { value: 'planned',     label: '📋 Kế hoạch' },
  { value: 'in_progress', label: '🔧 Đang sửa' },
  { value: 'done',        label: '✅ Hoàn thành' },
];

const STATUS_META = {
  planned: {
    label: 'Kế hoạch',
    color: '#2563EB',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    icon: Clock,
    desc: 'Lịch bảo dưỡng dự kiến',
  },
  in_progress: {
    label: 'Đang sửa',
    color: '#D97706',
    bg: '#FFFBEB',
    border: '#FDE68A',
    icon: Wrench,
    desc: 'Đang tạm dừng để thi công',
  },
  done: {
    label: 'Hoàn thành',
    color: '#059669',
    bg: '#ECFDF5',
    border: '#A7F3D0',
    icon: CheckCircle,
    desc: 'Đã nghiệm thu sử dụng',
  },
};

/* ── Helper: Sport icons & colors ─────────────────── */
const getSportMeta = (courtName = '', typeName = '') => {
  const text = `${courtName} ${typeName}`.toLowerCase();
  if (text.includes('bóng đá') || text.includes('bóng a') || text.includes('bóng b') || text.includes('futsal')) {
    return { icon: '⚽', sport: 'Bóng đá', bg: '#DCFCE7', color: '#16A34A' };
  }
  if (text.includes('cầu lông')) {
    return { icon: '🏸', sport: 'Cầu lông', bg: '#E0F2FE', color: '#0284C7' };
  }
  if (text.includes('bóng chuyền') || text.includes('chuyền')) {
    return { icon: '🏐', sport: 'Bóng chuyền', bg: '#F3E8FF', color: '#9333EA' };
  }
  if (text.includes('pickle') || text.includes('picker')) {
    return { icon: '🏓', sport: 'Pickleball', bg: '#FFEDD5', color: '#EA580C' };
  }
  return { icon: '🏟️', sport: 'Sân đa năng', bg: '#ECFDF5', color: '#059669' };
};

/* ── Helper: Classify reason into category ───────── */
const getReasonCategory = (reason = '') => {
  const r = (reason || '').toLowerCase();
  if (r.includes('mặt sân') || r.includes('cỏ') || r.includes('sàn') || r.includes('thảm')) {
    return { label: 'Mặt sân', type: 'surface', icon: '🌱' };
  }
  if (r.includes('đèn') || r.includes('chiếu sáng') || r.includes('điện')) {
    return { label: 'Chiếu sáng', type: 'lighting', icon: '💡' };
  }
  if (r.includes('lưới') || r.includes('khung') || r.includes('vạch') || r.includes('sơn')) {
    return { label: 'Lưới & Vạch sơn', type: 'net', icon: '🥅' };
  }
  if (r.includes('định kỳ') || r.includes('tổng thể') || r.includes('khử khuẩn') || r.includes('vệ sinh')) {
    return { label: 'Định kỳ', type: 'regular', icon: '🔄' };
  }
  return { label: 'Nâng cấp / Khác', type: 'other', icon: '🛠️' };
};

/* ── Helper: Format date & duration ───────────────── */
const formatDateVN = (dateStr) => {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

const calculateDays = (start, end) => {
  if (!start || !end) return 0;
  const d1 = new Date(start);
  const d2 = new Date(end);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

/* Quick suggestion chips for reasons */
const REASON_SUGGESTIONS = [
  'Bảo dưỡng mặt cỏ nhân tạo & rải thêm hạt cao su',
  'Thay thế & nâng cấp hệ thống đèn LED chiếu sáng',
  'Căng lại lưới thi đấu & sơn lại vạch giới hạn sân',
  'Bảo dưỡng định kỳ & khử khuẩn toàn diện',
  'Sửa chữa hệ thống thoát nước sân',
];

export default function Maintenance() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user?.role === 'admin';
  const [searchParams, setSearchParams] = useSearchParams();

  // Data states
  const [schedules, setSchedules] = useState([]);
  const [courts, setCourts] = useState([]);
  const [courtTypes, setCourtTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Targeted schedule & court from notification navigation
  const targetCourtId = searchParams.get('court_id');
  const targetScheduleId = searchParams.get('schedule_id');
  const [highlightScheduleId, setHighlightScheduleId] = useState(null);

  // View state: 'table' or 'kanban'
  const [viewMode, setViewMode] = useState('table');

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courtFilter, setCourtFilter] = useState('all');

  // Đọc params khi chuyển từ chuông thông báo sang
  useEffect(() => {
    if (targetCourtId) {
      setCourtFilter(String(targetCourtId));
    }
    if (targetScheduleId) {
      setHighlightScheduleId(String(targetScheduleId));
      setStatusFilter('all'); // Không bị lọc mất bởi tab
    }
  }, [targetCourtId, targetScheduleId]);

  // Modal: Form Create / Edit
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState(() => ({
    court_id: '',
    start_date: todayVN(),
    end_date: todayVN(),
    reason: '',
    status: 'planned',
  }));
  const [conflicts, setConflicts] = useState(null);
  const [saving, setSaving] = useState(false);

  // Modal: Delete confirmation
  const [scheduleToDelete, setScheduleToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // 1. Initial Load
  const fetchAll = async () => {
    setLoading(true);
    try {
      const data = await maintenanceAPI.getAll();
      setSchedules(Array.isArray(data) ? data : []);
    } catch (e) {
      showToast({ type: 'error', message: 'Không thể tải danh sách lịch bảo trì' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    courtsAPI.getAll({}).then(cList => setCourts(Array.isArray(cList) ? cList : [])).catch(() => {});
    courtTypesAPI.getAll().then(ctList => setCourtTypes(Array.isArray(ctList) ? ctList : [])).catch(() => {});
  }, []);

  // Court lookup helper
  const getCourtObj = (courtId) => courts.find(c => c.id === courtId) || {};
  const getCourtName = (courtId) => getCourtObj(courtId).name || `Sân #${courtId}`;

  // 2. Metrics & KPI calculations
  const kpis = useMemo(() => {
    const planned = schedules.filter(s => s.status === 'planned').length;
    const inProgress = schedules.filter(s => s.status === 'in_progress').length;
    const done = schedules.filter(s => s.status === 'done').length;

    // Fleet readiness calculation
    // Courts currently in maintenance status or have in_progress schedule
    const courtsInMaintenance = new Set(
      schedules.filter(s => s.status === 'in_progress').map(s => s.court_id)
    );
    const totalCourts = courts.length || 7;
    const availableCourts = Math.max(0, totalCourts - courtsInMaintenance.size);
    const availabilityRate = totalCourts > 0 ? Math.round((availableCourts / totalCourts) * 100) : 100;

    return {
      planned,
      inProgress,
      done,
      totalCourts,
      availableCourts,
      availabilityRate,
    };
  }, [schedules, courts]);

  // Targeted schedule object
  const highlightSchedule = useMemo(() => {
    if (!highlightScheduleId) return null;
    return schedules.find(s => String(s.id) === String(highlightScheduleId)) || null;
  }, [highlightScheduleId, schedules]);

  // Tự động cuộn đến hàng lịch bảo trì đang cần thao tác
  useEffect(() => {
    if (highlightScheduleId && schedules.length > 0) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`maint-row-${highlightScheduleId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [highlightScheduleId, schedules, viewMode]);

  // 3. Filtered Schedules
  const filteredSchedules = useMemo(() => {
    return schedules.filter(s => {
      // Status filter
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;

      // Court filter
      if (courtFilter !== 'all' && String(s.court_id) !== String(courtFilter)) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const courtName = getCourtName(s.court_id).toLowerCase();
        const reason = (s.reason || '').toLowerCase();
        const idStr = String(s.id);
        if (!courtName.includes(query) && !reason.includes(query) && !idStr.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [schedules, statusFilter, courtFilter, searchTerm, courts]);

  // 4. Form Actions
  const handleOpenCreate = () => {
    setEditId(null);
    setFormData({
      court_id: courts[0]?.id ? String(courts[0].id) : '',
      start_date: todayVN(),
      end_date: todayVN(),
      reason: '',
      status: 'planned',
    });
    setConflicts(null);
    setShowForm(true);
  };

  const handleEdit = (s) => {
    setEditId(s.id);
    setFormData({
      court_id: String(s.court_id),
      start_date: s.start_date,
      end_date: s.end_date,
      reason: s.reason || '',
      status: s.status,
    });
    setConflicts(null);
    setShowForm(true);
  };

  const handleSave = async (e, force = false) => {
    if (e) e.preventDefault();
    if (!formData.court_id) {
      showToast({ type: 'warning', message: 'Vui lòng chọn sân cần bảo trì' });
      return;
    }
    if (formData.start_date > formData.end_date) {
      showToast({ type: 'warning', message: 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        court_id: parseInt(formData.court_id),
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: formData.reason.trim() || 'Bảo dưỡng định kỳ',
        status: formData.status,
      };

      if (editId) {
        await maintenanceAPI.update(editId, payload, { params: { force } });
        showToast({ type: 'success', message: '✅ Cập nhật lịch bảo trì thành công!' });
      } else {
        await maintenanceAPI.create(payload, { params: { force } });
        showToast({ type: 'success', message: '✅ Thêm lịch bảo trì mới thành công!' });
      }

      setShowForm(false);
      setEditId(null);
      setConflicts(null);
      fetchAll();
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.detail?.conflicting_bookings) {
        setConflicts(err.response.data.detail.conflicting_bookings);
      } else {
        showToast({ type: 'error', message: err.response?.data?.detail || 'Thao tác bảo trì thất bại' });
      }
    } finally {
      setSaving(false);
    }
  };

  // 5. Quick Status Transition
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await maintenanceAPI.update(id, { status: newStatus });
      const label = STATUS_META[newStatus]?.label || newStatus;
      showToast({ type: 'success', message: `✅ Đã chuyển trạng thái sang "${label}"` });
      fetchAll();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.detail || 'Cập nhật trạng thái thất bại' });
    }
  };

  // 6. Delete Schedule
  const confirmDeleteSchedule = async () => {
    if (!scheduleToDelete) return;
    setDeleting(true);
    try {
      await maintenanceAPI.delete(scheduleToDelete);
      showToast({ type: 'success', message: '🗑️ Đã xóa lịch bảo trì thành công' });
      setScheduleToDelete(null);
      fetchAll();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.detail || 'Xóa lịch bảo trì thất bại' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="maintenance-page-container">
      {/* ── 1. Page Header ───────────────────────────────── */}
      <div className="maint-header">
        <div className="maint-title-group">
          <h1>
            <Wrench size={26} style={{ color: '#059669' }} />
            Quản lý & Lịch Bảo trì Sân
          </h1>
          <p>
            Lên kế hoạch bảo dưỡng, theo dõi tiến độ thi công và đồng bộ khóa ca tự động theo tiêu chuẩn doanh nghiệp
          </p>
        </div>

        <div className="maint-header-actions">
          {/* Dual-View Switcher */}
          <div className="maint-view-mode-pill">
            <button
              className={`maint-view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              <LayoutList size={15} />
              <span>Bảng danh sách</span>
            </button>
            <button
              className={`maint-view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
            >
              <Columns size={15} />
              <span>Bảng Kanban</span>
            </button>
          </div>

          <Button
            variant="secondary"
            icon={<RefreshCw size={14} />}
            onClick={fetchAll}
            title="Tải lại dữ liệu"
          >
            Làm mới
          </Button>

          {isAdmin && (
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={handleOpenCreate}
              style={{ background: 'linear-gradient(135deg, #059669, #10B981)', boxShadow: '0 2px 8px rgba(16,185,129,0.25)' }}
            >
              Lên lịch bảo trì mới
            </Button>
          )}
        </div>
      </div>

      {/* ── 2. Operational Health KPIs (4 Cards) ─────────── */}
      <div className="maint-kpi-grid">
        {/* Card 1: Kế hoạch */}
        <div className="maint-kpi-card planned">
          <div className="maint-kpi-header">
            <span className="maint-kpi-label">Lên kế hoạch</span>
            <div className="maint-kpi-icon-wrap" style={{ background: '#EFF6FF', color: '#2563EB' }}>
              <Clock size={18} />
            </div>
          </div>
          <p className="maint-kpi-val">{kpis.planned}</p>
          <div className="maint-kpi-sub">
            <span>Sắp diễn ra trong tương lai</span>
          </div>
        </div>

        {/* Card 2: Đang bảo trì */}
        <div className="maint-kpi-card in_progress">
          <div className="maint-kpi-header">
            <span className="maint-kpi-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {kpis.inProgress > 0 && <span className="pulse-indicator" />}
              Đang bảo dưỡng
            </span>
            <div className="maint-kpi-icon-wrap" style={{ background: '#FFFBEB', color: '#D97706' }}>
              <Wrench size={18} />
            </div>
          </div>
          <p className="maint-kpi-val" style={{ color: kpis.inProgress > 0 ? '#D97706' : '#0F172A' }}>
            {kpis.inProgress}
          </p>
          <div className="maint-kpi-sub">
            <span>{kpis.inProgress > 0 ? 'Sân đang tạm ngưng đón khách' : 'Không có sân nào đang bảo trì'}</span>
          </div>
        </div>

        {/* Card 3: Hoàn thành */}
        <div className="maint-kpi-card done">
          <div className="maint-kpi-header">
            <span className="maint-kpi-label">Đã nghiệm thu</span>
            <div className="maint-kpi-icon-wrap" style={{ background: '#ECFDF5', color: '#059669' }}>
              <CheckCircle size={18} />
            </div>
          </div>
          <p className="maint-kpi-val">{kpis.done}</p>
          <div className="maint-kpi-sub">
            <span>Đã hoàn tất & đưa vào khai thác</span>
          </div>
        </div>

        {/* Card 4: Sẵn sàng vận hành */}
        <div className="maint-kpi-card fleet">
          <div className="maint-kpi-header">
            <span className="maint-kpi-label">Sẵn sàng vận hành</span>
            <div className="maint-kpi-icon-wrap" style={{ background: '#EEF2FF', color: '#6366F1' }}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <p className="maint-kpi-val" style={{ color: '#4F46E5' }}>{kpis.availabilityRate}%</p>
          <div className="maint-kpi-sub">
            <span><strong>{kpis.availableCourts}/{kpis.totalCourts}</strong> sân đang mở đón khách</span>
          </div>
          <div className="maint-progress-bar-bg">
            <div
              className="maint-progress-bar-fill"
              style={{
                width: `${kpis.availabilityRate}%`,
                background: kpis.availabilityRate > 80 ? '#10B981' : kpis.availabilityRate > 50 ? '#F59E0B' : '#EF4444'
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Targeted Action Callout Banner (Khi Admin bấm từ thông báo sang) ── */}
      {highlightSchedule && (
        <div className="maint-action-callout-banner">
          <div className="maint-callout-left">
            <div className="maint-callout-icon">
              <Wrench size={22} />
            </div>
            <div className="maint-callout-text">
              <h4>
                {highlightSchedule.status === 'planned'
                  ? '⚡ Yêu cầu kích hoạt bảo trì sân:'
                  : highlightSchedule.status === 'in_progress'
                  ? '🔧 Sân đang thi công bảo trì:'
                  : '✅ Lịch bảo trì sân:'} {getCourtName(highlightSchedule.court_id)}
              </h4>
              <p>
                Lịch #{highlightSchedule.id} • Thời gian: <strong>{formatDateVN(highlightSchedule.start_date)}</strong> ➔ <strong>{formatDateVN(highlightSchedule.end_date)}</strong> • Lý do: <em>{highlightSchedule.reason || 'Bảo dưỡng định kỳ'}</em>.
                {highlightSchedule.status === 'planned' && ' Bấm nút bên phải để kích hoạt "Đang sửa" và tự động khóa ca sân đón khách.'}
                {highlightSchedule.status === 'in_progress' && ' Khi thi công xong, bấm nút "Nghiệm thu & Mở sân" để mở lại đón khách.'}
              </p>
            </div>
          </div>
          <div className="maint-callout-actions">
            {isAdmin && highlightSchedule.status === 'planned' && (
              <Button
                variant="primary"
                icon={<Wrench size={15} />}
                onClick={() => handleStatusUpdate(highlightSchedule.id, 'in_progress')}
                style={{ background: '#D97706', borderColor: '#D97706', fontWeight: 700, boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)' }}
              >
                Bắt đầu bảo trì ngay
              </Button>
            )}
            {isAdmin && highlightSchedule.status === 'in_progress' && (
              <Button
                variant="primary"
                icon={<CheckCircle size={15} />}
                onClick={() => handleStatusUpdate(highlightSchedule.id, 'done')}
                style={{ background: '#059669', borderColor: '#059669', fontWeight: 700 }}
              >
                Nghiệm thu & Mở sân
              </Button>
            )}
            <button
              className="maint-callout-close"
              onClick={() => {
                setHighlightScheduleId(null);
                setSearchParams({});
              }}
              title="Đóng chỉ dẫn này"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ── 3. Search & Filter Toolbar ──────────────────── */}
      <div className="maint-toolbar-card">
        {/* Status Filter Tabs */}
        <div className="maint-filter-tabs">
          <button
            className={`maint-filter-tab ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            Tất cả lịch
            <span className="maint-tab-badge">{schedules.length}</span>
          </button>
          <button
            className={`maint-filter-tab ${statusFilter === 'planned' ? 'active' : ''}`}
            onClick={() => setStatusFilter('planned')}
          >
            <Clock size={13} style={{ color: '#2563EB' }} />
            Kế hoạch
            <span className="maint-tab-badge">{kpis.planned}</span>
          </button>
          <button
            className={`maint-filter-tab ${statusFilter === 'in_progress' ? 'active' : ''}`}
            onClick={() => setStatusFilter('in_progress')}
          >
            <Wrench size={13} style={{ color: '#D97706' }} />
            Đang sửa
            <span className="maint-tab-badge">{kpis.inProgress}</span>
          </button>
          <button
            className={`maint-filter-tab ${statusFilter === 'done' ? 'active' : ''}`}
            onClick={() => setStatusFilter('done')}
          >
            <CheckCircle size={13} style={{ color: '#059669' }} />
            Hoàn thành
            <span className="maint-tab-badge">{kpis.done}</span>
          </button>
        </div>

        {/* Right tools: Search & Court Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="maint-search-box">
            <Search size={15} style={{ color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Tìm theo sân, lý do, mã..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0 }}
              >
                ×
              </button>
            )}
          </div>

          <select
            className="maint-court-select-filter"
            value={courtFilter}
            onChange={e => setCourtFilter(e.target.value)}
          >
            <option value="all">🏟️ Tất cả các sân</option>
            {courts.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── 4. View Mode: Table or Kanban ─────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Skeleton height="60px" variant="rect" style={{ borderRadius: 12 }} />
          <Skeleton height="60px" variant="rect" style={{ borderRadius: 12 }} />
          <Skeleton height="60px" variant="rect" style={{ borderRadius: 12 }} />
        </div>
      ) : filteredSchedules.length === 0 ? (
        <Card padding="lg" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <div className="maint-empty-state">
            <Wrench size={42} style={{ color: '#CBD5E1', margin: '0 auto' }} />
            <h3>Không tìm thấy lịch bảo trì phù hợp</h3>
            <p>Thử thay đổi bộ lọc tìm kiếm hoặc thêm lịch bảo trì mới cho sân.</p>
            {isAdmin && (
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={handleOpenCreate}
                style={{ marginTop: '1rem' }}
              >
                Thêm lịch bảo trì
              </Button>
            )}
          </div>
        </Card>
      ) : viewMode === 'table' ? (
        /* ── View A: Table View ────────────────────────────── */
        <div className="maint-table-card">
          <table className="maint-table">
            <thead>
              <tr>
                <th style={{ width: 70 }}>Mã #</th>
                <th>Sân bảo trì</th>
                <th>Khoảng thời gian</th>
                <th>Thời lượng</th>
                <th>Hạng mục / Lý do</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedules.map(row => {
                const court = getCourtObj(row.court_id);
                const typeName = courtTypes.find(t => t.id === court.court_type_id)?.name || '';
                const sport = getSportMeta(court.name, typeName);
                const cat = getReasonCategory(row.reason);
                const days = calculateDays(row.start_date, row.end_date);
                const meta = STATUS_META[row.status] || STATUS_META.planned;
                const StatusIcon = meta.icon;
                const isTarget = String(row.id) === String(highlightScheduleId);

                return (
                  <tr key={row.id} id={`maint-row-${row.id}`} className={isTarget ? 'highlight-action-row' : ''}>
                    {/* ID */}
                    <td style={{ fontWeight: 700, color: '#64748B' }}>
                      #{row.id}
                    </td>

                    {/* Court Info */}
                    <td>
                      <div className="maint-court-cell">
                        <div className="maint-sport-badge-icon" style={{ background: sport.bg, color: sport.color }}>
                          {sport.icon}
                        </div>
                        <div>
                          <p className="maint-court-name">
                            {court.name || `Sân #${row.court_id}`}
                            {isTarget && (
                              <span className="maint-target-tag">📍 Đang chọn</span>
                            )}
                          </p>
                          <p className="maint-court-type">{sport.sport} • {typeName || 'Tiêu chuẩn'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Date Range */}
                    <td>
                      <div className="maint-date-range">
                        <span className="maint-date-text">
                          {formatDateVN(row.start_date)} ➔ {formatDateVN(row.end_date)}
                        </span>
                      </div>
                    </td>

                    {/* Duration Badge */}
                    <td>
                      <span className="maint-days-badge">
                        <Calendar size={11} /> {days} ngày
                      </span>
                    </td>

                    {/* Category & Reason */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span className={`maint-cat-tag ${cat.type}`}>
                          <span>{cat.icon}</span> {cat.label}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#475569', maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.reason}>
                          {row.reason || '—'}
                        </span>
                      </div>
                    </td>

                    {/* Status Pill */}
                    <td>
                      <span className={`maint-status-pill ${row.status}`}>
                        <StatusIcon size={12} />
                        {meta.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="maint-action-group">
                        {isAdmin && row.status === 'planned' && (
                          <button
                            className="maint-btn-quick-action start"
                            onClick={() => handleStatusUpdate(row.id, 'in_progress')}
                            title="Bắt đầu thi công bảo trì"
                          >
                            <Wrench size={12} /> Bắt đầu
                          </button>
                        )}

                        {isAdmin && row.status === 'in_progress' && (
                          <button
                            className="maint-btn-quick-action finish"
                            onClick={() => handleStatusUpdate(row.id, 'done')}
                            title="Nghiệm thu hoàn tất"
                          >
                            <CheckCircle size={12} /> Nghiệm thu
                          </button>
                        )}

                        {isAdmin && (
                          <>
                            <button
                              className="maint-btn-icon"
                              onClick={() => handleEdit(row)}
                              title="Chỉnh sửa lịch"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              className="maint-btn-icon delete"
                              onClick={() => setScheduleToDelete(row.id)}
                              title="Xóa lịch"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* ── View B: Kanban Board ──────────────────────────── */
        <div className="maint-kanban-board">
          {['planned', 'in_progress', 'done'].map(statusKey => {
            const meta = STATUS_META[statusKey];
            const ColumnIcon = meta.icon;
            const items = filteredSchedules.filter(s => s.status === statusKey);

            return (
              <div key={statusKey} className="maint-kanban-col">
                <div className="maint-kanban-header">
                  <div className="maint-kanban-title" style={{ color: meta.color }}>
                    <ColumnIcon size={17} />
                    <span>{meta.label}</span>
                  </div>
                  <span className="maint-kanban-count-pill">{items.length}</span>
                </div>

                <div className="maint-kanban-cards-wrap">
                  {items.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94A3B8', fontSize: '0.8rem' }}>
                      Chưa có lịch nào ở trạng thái này
                    </div>
                  ) : (
                    items.map(item => {
                      const court = getCourtObj(item.court_id);
                      const typeName = courtTypes.find(t => t.id === court.court_type_id)?.name || '';
                      const sport = getSportMeta(court.name, typeName);
                      const cat = getReasonCategory(item.reason);
                      const days = calculateDays(item.start_date, item.end_date);

                      return (
                        <div key={item.id} className="maint-kanban-card">
                          <div className="maint-kanban-card-top">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                              <span style={{ fontSize: '1.2rem' }}>{sport.icon}</span>
                              <div>
                                <strong style={{ fontSize: '0.88rem', color: '#0F172A', display: 'block' }}>
                                  {court.name || `Sân #${item.court_id}`}
                                </strong>
                                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                                  #{item.id} • {sport.sport}
                                </span>
                              </div>
                            </div>
                            <span className="maint-days-badge">
                              {days} ngày
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#475569' }}>
                            <Calendar size={13} style={{ color: '#2563EB' }} />
                            <span>{formatDateVN(item.start_date)} ➔ {formatDateVN(item.end_date)}</span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className={`maint-cat-tag ${cat.type}`}>
                              <span>{cat.icon}</span> {cat.label}
                            </span>
                          </div>

                          {item.reason && (
                            <p className="maint-kanban-reason" title={item.reason}>
                              {item.reason}
                            </p>
                          )}

                          <div className="maint-kanban-card-footer">
                            <div style={{ display: 'flex', gap: 4 }}>
                              {isAdmin && (
                                <>
                                  <button
                                    className="maint-btn-icon"
                                    onClick={() => handleEdit(item)}
                                    title="Sửa"
                                  >
                                    <Edit size={13} />
                                  </button>
                                  <button
                                    className="maint-btn-icon delete"
                                    onClick={() => setScheduleToDelete(item.id)}
                                    title="Xóa"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </>
                              )}
                            </div>

                            {isAdmin && item.status === 'planned' && (
                              <button
                                className="maint-btn-quick-action start"
                                onClick={() => handleStatusUpdate(item.id, 'in_progress')}
                              >
                                Bắt đầu <ArrowRight size={12} />
                              </button>
                            )}

                            {isAdmin && item.status === 'in_progress' && (
                              <button
                                className="maint-btn-quick-action finish"
                                onClick={() => handleStatusUpdate(item.id, 'done')}
                              >
                                Nghiệm thu <CheckCircle size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 5. Modal: Create / Edit Maintenance Schedule ─── */}
      <Modal
        open={showForm && isAdmin}
        isOpen={showForm && isAdmin}
        onClose={() => { setShowForm(false); setConflicts(null); }}
        title={editId ? `✏️ Chỉnh sửa Lịch Bảo trì #${editId}` : '⚡ Lên Lịch Bảo Trì Sân Mới'}
        maxWidth="600px"
        footer={!conflicts && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <Button variant="secondary" onClick={() => { setShowForm(false); setConflicts(null); }} disabled={saving}>
              Hủy bỏ
            </Button>
            <Button variant="primary" type="submit" form="maintenance-form" loading={saving} icon={<CheckCircle size={15} />}>
              {editId ? 'Lưu thay đổi' : 'Xác nhận tạo lịch'}
            </Button>
          </div>
        )}
      >
        <form id="maintenance-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Select
              label="Chọn sân bảo trì *"
              required
              value={formData.court_id}
              onChange={e => setFormData(p => ({ ...p, court_id: e.target.value }))}
              placeholder="-- Chọn sân thể thao --"
              options={courts.map(c => {
                const typeName = courtTypes.find(t => t.id === c.court_type_id)?.name || '';
                const sport = getSportMeta(c.name, typeName);
                return { value: c.id, label: `${sport.icon} ${c.name}` };
              })}
            />

            <Select
              label="Trạng thái ban đầu *"
              value={formData.status}
              onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}
              options={STATUS_OPTS}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label="Từ ngày *"
              type="date"
              required
              value={formData.start_date}
              onChange={e => setFormData(p => ({ ...p, start_date: e.target.value }))}
            />
            <Input
              label="Đến ngày *"
              type="date"
              required
              min={formData.start_date}
              value={formData.end_date}
              onChange={e => setFormData(p => ({ ...p, end_date: e.target.value }))}
            />
          </div>

          {/* Duration Preview */}
          <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: 8, padding: '0.65rem 0.85rem', fontSize: '0.8rem', color: '#475569' }}>
            ⏱️ <strong>Thời lượng dự kiến:</strong> {calculateDays(formData.start_date, formData.end_date)} ngày bảo dưỡng (Hệ thống sẽ tự động khóa các khung giờ trống của sân trong khoảng này để đảm bảo an toàn).
          </div>

          <div>
            <Input
              label="Lý do & Nội dung công việc *"
              value={formData.reason}
              onChange={e => { setFormData(p => ({ ...p, reason: e.target.value })); setConflicts(null); }}
              placeholder="Ví dụ: Thay thảm cỏ nhân tạo, sửa đèn LED, bảo dưỡng định kỳ..."
              required
            />
            {/* Quick suggestion chips */}
            <div className="maint-reason-suggestions">
              {REASON_SUGGESTIONS.map((sug, i) => (
                <button
                  type="button"
                  key={i}
                  className="maint-reason-chip"
                  onClick={() => setFormData(p => ({ ...p, reason: sug }))}
                >
                  + {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Conflict Warning Box */}
          {conflicts && (
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '1rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <AlertTriangle size={20} style={{ color: '#D97706', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong style={{ color: '#92400E', fontSize: '0.92rem' }}>Cảnh báo xung đột lịch đặt sân</strong>
                  <p style={{ fontSize: '0.84rem', color: '#B45309', margin: '0.25rem 0 0', lineHeight: 1.4 }}>
                    Khoảng thời gian bảo trì này bị trùng với <strong>{conflicts.length} đơn đặt sân</strong> đã xác nhận của khách hàng (Mã đơn: {conflicts.map(c => `#${c}`).join(', ')}).
                  </p>
                  <p style={{ fontSize: '0.78rem', color: '#78350F', margin: '4px 0 0' }}>
                    Nếu tiếp tục, hệ thống sẽ ưu tiên lịch bảo trì và khóa sân. Bạn có chắc chắn muốn ghi đè?
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Button variant="secondary" size="sm" onClick={() => setConflicts(null)}>
                  Hủy bỏ & Chọn ngày khác
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  style={{ background: '#D97706', borderColor: '#D97706' }}
                  onClick={() => handleSave(null, true)}
                  loading={saving}
                >
                  Xác nhận tiếp tục lưu
                </Button>
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* ── 6. Confirm Modal: Delete Schedule ───────────── */}
      <ConfirmModal
        isOpen={Boolean(scheduleToDelete)}
        onClose={() => setScheduleToDelete(null)}
        onConfirm={confirmDeleteSchedule}
        title="Xác nhận xóa lịch bảo trì"
        message="Bạn có chắc chắn muốn xóa lịch bảo trì này không? Sau khi xóa, các khung giờ bị khóa của sân trong khoảng thời gian này sẽ được tự động mở lại trạng thái sẵn sàng."
        confirmText="Xóa lịch bảo trì"
        confirmVariant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
