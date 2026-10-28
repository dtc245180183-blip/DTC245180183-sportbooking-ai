import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { courtsAPI, courtTypesAPI } from '../../api';
import {
  Plus, Edit, Trash2, Filter, Building2, Link, Search, X,
  RefreshCw, CheckCircle2, Wrench, Trophy, Clock, Calendar,
  LayoutGrid, List, Layers, ArrowRight, Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Button, Card, Badge, Modal, Input, Select, Table, EmptyState, Skeleton, ConfirmModal } from '../../components/ui';
import { getSportImage, getSportAccent } from '../../utils/sportImages';
import './Courts.css';

const COURT_STATUS_MAP = {
  active:      { status: 'available', label: 'Hoạt động' },
  maintenance: { status: 'blocked',   label: 'Bảo trì'   },
  inactive:    { status: 'blocked',   label: 'Tạm dừng'  },
};

const COURT_STATUS_OPTIONS = [
  { value: 'active',      label: 'Hoạt động (Sẵn sàng)' },
  { value: 'maintenance', label: 'Bảo trì (Khóa sân)'   },
  { value: 'inactive',    label: 'Tạm dừng (Ngưng nhận)'  },
];

/* ── Modern Court Card Component ── */
function CourtCard({ court, typeName, isAdmin, onEdit, onDelete, onGoToSchedule }) {
  const st = COURT_STATUS_MAP[court.status] || COURT_STATUS_MAP.active;
  const accent = getSportAccent(typeName);
  const imgSrc = getSportImage(typeName, court.image_url);

  return (
    <div className="court-card-pro" style={{ borderTop: `3px solid ${accent}` }}>
      {/* Header bar with Badges */}
      <div className="court-card-banner">
        <span className="court-type-tag" style={{ borderLeft: `3px solid ${accent}` }}>
          {typeName}
        </span>
        <Badge status={st.status} label={st.label} />
      </div>

      {/* Unobstructed Court SVG/Image Diagram */}
      <div className="court-diagram-box">
        <img
          src={imgSrc}
          alt={court.name}
          className="court-diagram-img"
          onError={e => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = getSportImage(typeName, null);
          }}
        />
      </div>

      {/* Body Content */}
      <div className="court-card-body">
        <h3 className="court-card-title" title={court.name}>
          {court.name}
        </h3>
        
        <div className="court-card-price-row">
          <span className="court-price-amount">
            {court.price_per_hour?.toLocaleString('vi-VN')}đ
          </span>
          <span className="court-price-unit">/ giờ</span>
        </div>

        {/* Action Buttons */}
        {isAdmin && (
          <div className="court-card-footer">
            <button
              type="button"
              className="court-footer-btn btn-card-edit"
              title="Sửa thông tin sân & đơn giá"
              onClick={() => onEdit(court)}
            >
              <Edit size={14} />
              Chỉnh sửa
            </button>
            <button
              type="button"
              className="court-footer-btn btn-card-del"
              title="Xóa sân"
              onClick={() => onDelete(court.id)}
            >
              <Trash2 size={14} />
              Xóa sân
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Courts Page Component ── */
export default function Courts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user?.role === 'admin';

  // State Management (Preserving exact data flow)
  const [activeTab, setActiveTab] = useState('courts'); // 'courts' | 'types' | 'pricing_matrix'
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [loading, setLoading] = useState(false);

  const [courts, setCourts] = useState([]);
  const [showCourtModal, setShowCourtModal] = useState(false);
  const [courtForm, setCourtForm] = useState({ id: null, name: '', court_type_id: '', price_per_hour: '', status: 'active', image_url: '' });

  const [courtTypes, setCourtTypes] = useState([]);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [typeForm, setTypeForm] = useState({ id: null, name: '', description: '', image_url: '' });

  const [courtToDelete, setCourtToDelete] = useState(null);
  const [typeToDelete, setTypeToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filterType, filterStatus]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterType) params.court_type_id = filterType;
      if (filterStatus) params.status = filterStatus;
      const [c, ct] = await Promise.all([courtsAPI.getAll(params), courtTypesAPI.getAll()]);
      setCourts(Array.isArray(c) ? c : []);
      setCourtTypes(Array.isArray(ct) ? ct : []);
    } catch (e) {
      console.error(e);
      showToast({ type: 'error', message: 'Không thể tải danh sách sân' });
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterType) params.court_type_id = filterType;
      if (filterStatus) params.status = filterStatus;
      const [c, ct] = await Promise.all([courtsAPI.getAll(params), courtTypesAPI.getAll()]);
      setCourts(Array.isArray(c) ? c : []);
      setCourtTypes(Array.isArray(ct) ? ct : []);
      await new Promise(r => setTimeout(r, 450));
      showToast({ type: 'success', message: 'Đã làm mới danh sách sân và biểu giá thành công!' });
    } catch (e) {
      showToast({ type: 'error', message: 'Lỗi đồng bộ dữ liệu' });
    } finally {
      setLoading(false);
    }
  };

  const getTypeName = id => courtTypes.find(ct => ct.id === id)?.name || 'N/A';

  // Navigation to Schedule Page for specific Court
  const handleGoToSchedule = (courtId) => {
    navigate(`/schedule?court_id=${courtId}`);
  };

  /* Handlers Courts (Strictly Preserving Data Flow & Payloads) */
  const handleSaveCourt = async e => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!courtForm.name.trim()) { showToast({ type: 'warning', message: 'Tên sân không được để trống' }); return; }
    if (parseFloat(courtForm.price_per_hour) <= 0) { showToast({ type: 'warning', message: 'Giá/giờ phải lớn hơn 0' }); return; }
    if (!courtForm.court_type_id) { showToast({ type: 'warning', message: 'Vui lòng chọn loại sân' }); return; }
    try {
      const payload = {
        name: courtForm.name.trim(),
        court_type_id: parseInt(courtForm.court_type_id),
        price_per_hour: parseFloat(courtForm.price_per_hour),
        status: courtForm.status,
        image_url: courtForm.image_url?.trim() || null,
      };
      if (courtForm.id) {
        await courtsAPI.update(courtForm.id, payload);
        showToast({ type: 'success', message: 'Cập nhật thông tin sân thành công' });
      } else {
        await courtsAPI.create(payload);
        showToast({ type: 'success', message: 'Thêm sân mới thành công' });
      }
      setShowCourtModal(false);
      fetchData();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.detail || 'Thao tác thất bại' });
    }
  };

  const handleDeleteCourt = id => {
    if (!isAdmin) return;
    setCourtToDelete(id);
  };

  const confirmDeleteCourt = async () => {
    if (!courtToDelete) return;
    setDeleting(true);
    try {
      await courtsAPI.delete(courtToDelete);
      showToast({ type: 'success', message: 'Đã xóa sân thành công' });
      setCourtToDelete(null);
      fetchData();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.detail || 'Xóa thất bại' });
    } finally {
      setDeleting(false);
    }
  };

  /* Handlers Court Types (Strictly Preserving Data Flow & Payloads) */
  const handleSaveType = async e => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!typeForm.name.trim()) { showToast({ type: 'warning', message: 'Tên loại sân không được để trống' }); return; }
    try {
      const payload = {
        name: typeForm.name.trim(),
        description: typeForm.description,
        image_url: typeForm.image_url?.trim() || null
      };
      if (typeForm.id) {
        await courtTypesAPI.update(typeForm.id, payload);
        showToast({ type: 'success', message: 'Cập nhật loại sân thành công' });
      } else {
        await courtTypesAPI.create(payload);
        showToast({ type: 'success', message: 'Thêm loại sân mới thành công' });
      }
      setShowTypeModal(false);
      fetchData();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.detail || 'Thao tác thất bại' });
    }
  };

  const handleDeleteType = id => {
    if (!isAdmin) return;
    setTypeToDelete(id);
  };

  const confirmDeleteType = async () => {
    if (!typeToDelete) return;
    setDeleting(true);
    try {
      await courtTypesAPI.delete(typeToDelete);
      showToast({ type: 'success', message: 'Đã xóa loại sân thành công' });
      setTypeToDelete(null);
      fetchData();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.detail || 'Xóa thất bại' });
    } finally {
      setDeleting(false);
    }
  };

  // Filtered Courts based on search query
  const filteredCourts = useMemo(() => {
    return courts.filter(c => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      const typeName = getTypeName(c.court_type_id).toLowerCase();
      return c.name.toLowerCase().includes(q) || typeName.includes(q);
    });
  }, [courts, searchQuery, courtTypes]);

  // KPI Calculations
  const activeCount = courts.filter(c => c.status === 'active').length;
  const maintenanceCount = courts.filter(c => c.status === 'maintenance').length;
  const prices = courts.map(c => c.price_per_hour || 0).filter(p => p > 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  // Columns for Courts Table View
  const courtTableColumns = [
    { key: 'id', label: '#', width: '60px', render: v => <span style={{ color: '#94A3B8', fontWeight: 600 }}>#{String(v).padStart(2, '0')}</span> },
    {
      key: 'name', label: 'Tên sân & Minh họa',
      render: (v, row) => {
        const typeName = getTypeName(row.court_type_id);
        const imgSrc = getSportImage(typeName, row.image_url);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src={imgSrc}
              alt={v}
              style={{ width: 44, height: 34, objectFit: 'contain', background: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0', padding: 2 }}
              onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = getSportImage(typeName, null); }}
            />
            <div>
              <strong style={{ color: '#0F172A', display: 'block', fontSize: '0.92rem' }}>{v}</strong>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{typeName}</span>
            </div>
          </div>
        );
      }
    },
    {
      key: 'price', label: 'Đơn giá thuê',
      render: (_, row) => (
        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#059669' }}>
          {row.price_per_hour?.toLocaleString('vi-VN')}đ
          <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 400 }}> /giờ</span>
        </span>
      )
    },
    {
      key: 'status', label: 'Trạng thái',
      render: (v) => {
        const st = COURT_STATUS_MAP[v] || COURT_STATUS_MAP.active;
        return <Badge status={st.status} label={st.label} />;
      }
    },
    {
      key: 'actions', label: 'Thao tác', align: 'right', width: '150px',
      render: (_, row) => isAdmin ? (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <Button variant="secondary" size="sm" icon={<Edit size={13} />} onClick={() => {
            setCourtForm({ id: row.id, name: row.name, court_type_id: row.court_type_id, price_per_hour: row.price_per_hour, status: row.status, image_url: row.image_url || '' });
            setShowCourtModal(true);
          }}>Sửa</Button>
          <Button variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={() => handleDeleteCourt(row.id)}>Xóa</Button>
        </div>
      ) : null
    }
  ];

  // Columns for Types Table View
  const typeTableCols = [
    { key: 'id', label: '#', width: '60px', render: v => <span style={{ color: '#94A3B8', fontWeight: 600 }}>#{String(v).padStart(2, '0')}</span> },
    {
      key: 'name', label: 'Bộ môn / Loại sân',
      render: (v, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src={getSportImage(v, row.image_url)}
            alt={v}
            style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8, border: '1px solid #E2E8F0', padding: 2, background: '#F8FAFC' }}
            onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = getSportImage(v, null); }}
          />
          <div>
            <strong style={{ color: '#0F172A', display: 'block', fontSize: '0.92rem' }}>{v}</strong>
            <span className="sport-type-count-badge">
              {courts.filter(c => c.court_type_id === row.id).length} sân trực thuộc
            </span>
          </div>
        </div>
      ),
    },
    { key: 'description', label: 'Mô tả quy cách tiêu chuẩn', render: v => v || 'Tiêu chuẩn thể thao hiện đại' },
    isAdmin && {
      key: 'actions', label: 'Thao tác', align: 'right', width: '130px',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <Button variant="ghost" size="sm" icon={<Edit size={13} />}
            onClick={() => { setTypeForm({ id: row.id, name: row.name, description: row.description, image_url: row.image_url || '' }); setShowTypeModal(true); }}>
            Sửa
          </Button>
          <Button variant="danger" size="sm" icon={<Trash2 size={13} />}
            onClick={() => handleDeleteType(row.id)}>
            Xóa
          </Button>
        </div>
      ),
    },
  ].filter(Boolean);

  return (
    <div className="courts-page">
      {/* ── Top Header Bar ── */}
      <div className="courts-header">
        <div className="courts-header-title">
          <h1>
            <Building2 size={26} style={{ color: '#10B981' }} />
            Quản lý Sân &amp; Bảng Giá
          </h1>
          <p>Quản trị danh mục cụm sân bãi, phân loại bộ môn thể thao và chiến lược biểu giá</p>
        </div>
        <div className="courts-header-actions">
          <Button
            variant="ghost"
            icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            onClick={handleManualRefresh}
            disabled={loading}
          >
            Làm mới
          </Button>
          {isAdmin && (
            <Button
              variant="primary"
              icon={<Plus size={15} />}
              onClick={() => {
                setCourtForm({ id: null, name: '', court_type_id: courtTypes[0]?.id || '', price_per_hour: '', status: 'active', image_url: '' });
                setShowCourtModal(true);
              }}
            >
              Thêm sân mới
            </Button>
          )}
        </div>
      </div>

      {/* ── 4 KPI Stat Cards ── */}
      <div className="courts-stats-grid">
        <div className="court-kpi-card kpi-blue">
          <div className="court-kpi-top">
            <div className="court-kpi-icon">
              <Building2 size={22} />
            </div>
            <span className="court-kpi-chip">Cụm sân bãi</span>
          </div>
          <div className="court-kpi-meta">
            <h3>Tổng số sân bãi</h3>
            <div className="court-kpi-value-row">
              <strong>{courts.length}</strong>
              <span className="court-kpi-sub">Sân thể thao</span>
            </div>
          </div>
        </div>

        <div className="court-kpi-card kpi-emerald">
          <div className="court-kpi-top">
            <div className="court-kpi-icon">
              <CheckCircle2 size={22} />
            </div>
            <span className="court-kpi-chip">Sẵn sàng</span>
          </div>
          <div className="court-kpi-meta">
            <h3>Đang mở đón khách</h3>
            <div className="court-kpi-value-row">
              <strong style={{ color: '#059669' }}>{activeCount}</strong>
              <span className="court-kpi-sub">
                {courts.length ? Math.round((activeCount / courts.length) * 100) : 0}% hoạt động
              </span>
            </div>
          </div>
        </div>

        <div className="court-kpi-card kpi-amber">
          <div className="court-kpi-top">
            <div className="court-kpi-icon">
              <Wrench size={22} />
            </div>
            <span className="court-kpi-chip">{maintenanceCount > 0 ? 'Cảnh báo' : 'Ổn định'}</span>
          </div>
          <div className="court-kpi-meta">
            <h3>Đang bảo trì / Khóa</h3>
            <div className="court-kpi-value-row">
              <strong style={{ color: '#D97706' }}>{maintenanceCount}</strong>
              <span className="court-kpi-sub">{maintenanceCount > 0 ? 'Tạm khóa thi công' : 'Không có sân khóa'}</span>
            </div>
          </div>
        </div>

        <div className="court-kpi-card kpi-purple">
          <div className="court-kpi-top">
            <div className="court-kpi-icon">
              <Trophy size={22} />
            </div>
            <span className="court-kpi-chip">Bộ môn</span>
          </div>
          <div className="court-kpi-meta">
            <h3>Phân loại thể thao</h3>
            <div className="court-kpi-value-row">
              <strong style={{ color: '#7C3AED' }}>{courtTypes.length}</strong>
              <span className="court-kpi-sub">
                {minPrice ? `${minPrice.toLocaleString('vi-VN')}đ - ${maxPrice.toLocaleString('vi-VN')}đ` : 'Biểu giá linh hoạt'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs Navigation ── */}
      <div className="courts-tabs-bar">
        <div className="courts-tabs-nav">
          <button
            className={`courts-tab-btn ${activeTab === 'courts' ? 'active' : ''}`}
            onClick={() => setActiveTab('courts')}
          >
            <Building2 size={16} />
            Danh sách Sân &amp; Giá
            <span className="courts-tab-count">{courts.length}</span>
          </button>
          <button
            className={`courts-tab-btn ${activeTab === 'types' ? 'active' : ''}`}
            onClick={() => setActiveTab('types')}
          >
            <Trophy size={16} />
            Danh mục Bộ môn &amp; Loại sân
            <span className="courts-tab-count">{courtTypes.length}</span>
          </button>
          <button
            className={`courts-tab-btn ${activeTab === 'pricing_matrix' ? 'active' : ''}`}
            onClick={() => setActiveTab('pricing_matrix')}
          >
            <Clock size={16} />
            Bảng giá tổng hợp &amp; So sánh
          </button>
        </div>
      </div>

      {/* ── TAB 1: Danh sách Sân & Giá ── */}
      {activeTab === 'courts' && (
        <>
          {/* Toolbar with Search, Sport Pills, Filter & View Mode Switcher */}
          <div className="courts-toolbar">
            <div className="courts-search-box">
              <Search size={15} className="courts-search-icon" />
              <input
                type="text"
                className="courts-search-input"
                placeholder="Tìm kiếm theo tên sân, bộ môn..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="courts-search-clear" onClick={() => setSearchQuery('')}>
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Quick Sport Pills */}
            <div className="courts-filter-pills">
              <button
                type="button"
                className={`court-sport-pill ${filterType === '' ? 'active' : ''}`}
                onClick={() => setFilterType('')}
              >
                Tất cả môn ({courts.length})
              </button>
              {courtTypes.map(ct => {
                const count = courts.filter(c => c.court_type_id === ct.id).length;
                return (
                  <button
                    key={ct.id}
                    type="button"
                    className={`court-sport-pill ${filterType === String(ct.id) ? 'active' : ''}`}
                    onClick={() => setFilterType(filterType === String(ct.id) ? '' : String(ct.id))}
                  >
                    {ct.name} ({count})
                  </button>
                );
              })}
            </div>

            {/* Status Select & View Mode Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Select
                placeholder="Tất cả trạng thái"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                options={COURT_STATUS_OPTIONS}
                style={{ minWidth: 155 }}
              />

              <div className="view-mode-toggle">
                <button
                  type="button"
                  className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Chế độ xem thẻ lưới trực quan"
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  type="button"
                  className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
                  onClick={() => setViewMode('table')}
                  title="Chế độ xem bảng chi tiết"
                >
                  <List size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Content: Grid or Table */}
          {loading ? (
            <div className="courts-grid-layout">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                  <Skeleton variant="rect" height="145px" />
                  <div style={{ padding: '1rem', background: '#FFFFFF' }}>
                    <Skeleton variant="text" height="1.1rem" style={{ marginBottom: 8 }} />
                    <Skeleton variant="text" height="1.4rem" width="55%" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCourts.length === 0 ? (
            <Card padding="none">
              <EmptyState
                icon={Building2}
                title="Không tìm thấy sân thể thao nào"
                description={searchQuery || filterType || filterStatus ? "Thử xóa bộ lọc để xem toàn bộ danh sách" : "Bắt đầu bằng việc thêm sân thể thao mới"}
                action={isAdmin ? {
                  label: 'Thêm sân mới',
                  icon: <Plus size={14} />,
                  onClick: () => {
                    setCourtForm({ id: null, name: '', court_type_id: courtTypes[0]?.id || '', price_per_hour: '', status: 'active', image_url: '' });
                    setShowCourtModal(true);
                  }
                } : undefined}
              />
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="courts-grid-layout">
              {filteredCourts.map(court => (
                <CourtCard
                  key={court.id}
                  court={court}
                  typeName={getTypeName(court.court_type_id)}
                  isAdmin={isAdmin}
                  onEdit={c => {
                    setCourtForm({ id: c.id, name: c.name, court_type_id: c.court_type_id, price_per_hour: c.price_per_hour, status: c.status, image_url: c.image_url || '' });
                    setShowCourtModal(true);
                  }}
                  onDelete={handleDeleteCourt}
                />
              ))}
            </div>
          ) : (
            <Card padding="none" style={{ borderRadius: 14, overflow: 'hidden' }}>
              <Table columns={courtTableColumns} data={filteredCourts} loading={loading} />
            </Card>
          )}
        </>
      )}

      {/* ── TAB 2: Danh mục Bộ môn & Loại sân ── */}
      {activeTab === 'types' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748B', fontWeight: 500 }}>
              Quản lý các loại hình thể thao, tiêu chuẩn mặt sân và quy cách thi đấu trong tổ hợp
            </p>
            {isAdmin && (
              <Button
                variant="primary"
                icon={<Plus size={15} />}
                onClick={() => {
                  setTypeForm({ id: null, name: '', description: '', image_url: '' });
                  setShowTypeModal(true);
                }}
              >
                Thêm loại sân
              </Button>
            )}
          </div>

          <div className="sports-types-grid">
            {courtTypes.map(ct => {
              const courtCount = courts.filter(c => c.court_type_id === ct.id).length;
              const accent = getSportAccent(ct.name);
              const sampleCourt = courts.find(c => c.court_type_id === ct.id);
              return (
                <div key={ct.id} className="sport-type-card" style={{ borderTop: `4px solid ${accent}` }}>
                  <div className="sport-type-header">
                    <div className="sport-type-icon-box">
                      <img
                        src={getSportImage(ct.name, ct.image_url)}
                        alt={ct.name}
                        onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = getSportImage(ct.name, null); }}
                      />
                    </div>
                    <div className="sport-type-title">
                      <h3>{ct.name}</h3>
                      <span className="sport-type-count-badge">
                        {courtCount} sân đang vận hành
                      </span>
                    </div>
                  </div>

                  <div className="sport-type-body">
                    <p className="sport-type-desc">
                      {ct.description || 'Tiêu chuẩn sân bãi chất lượng cao, bề mặt thi đấu hiện đại.'}
                    </p>

                    <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.85rem' }}>
                      <Clock size={13} style={{ color: '#059669' }} />
                      Đơn giá giờ: <strong>{sampleCourt?.price_per_hour ? `${sampleCourt.price_per_hour.toLocaleString('vi-VN')}đ /h` : 'Linh hoạt'}</strong>
                    </div>

                    {isAdmin && (
                      <div className="sport-type-footer">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Edit size={13} />}
                          onClick={() => {
                            setTypeForm({ id: ct.id, name: ct.name, description: ct.description, image_url: ct.image_url || '' });
                            setShowTypeModal(true);
                          }}
                        >
                          Sửa
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={<Trash2 size={13} />}
                          onClick={() => handleDeleteType(ct.id)}
                        >
                          Xóa
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── TAB 3: Bảng giá tổng hợp & So sánh ── */}
      {activeTab === 'pricing_matrix' && (
        <div className="price-matrix-card">
          <div className="price-matrix-header">
            <h2>
              <Clock size={18} style={{ color: '#059669' }} />
              Bảng so sánh biểu giá thuê sân theo bộ môn
            </h2>
            <p>Tra cứu nhanh khung giá giờ tiêu chuẩn của tất cả các sân trong hệ thống SportBooking Pro</p>
          </div>

          <table className="price-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Mã sân</th>
                <th>Tên sân bãi</th>
                <th>Phân loại bộ môn</th>
                <th>Đơn giá thuê / giờ</th>
                <th>Tình trạng sân</th>
                {isAdmin && <th style={{ textAlign: 'right' }}>Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {courts.map(court => {
                const typeName = getTypeName(court.court_type_id);
                const st = COURT_STATUS_MAP[court.status] || COURT_STATUS_MAP.active;
                return (
                  <tr key={court.id}>
                    <td><strong style={{ color: '#94A3B8' }}>#{String(court.id).padStart(2, '0')}</strong></td>
                    <td>
                      <strong style={{ color: '#0F172A', fontSize: '0.92rem' }}>{court.name}</strong>
                    </td>
                    <td>
                      <span className="court-type-tag">{typeName}</span>
                    </td>
                    <td>
                      <strong style={{ color: '#059669', fontSize: '1.05rem' }}>
                        {court.price_per_hour?.toLocaleString('vi-VN')}đ
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}> /giờ</span>
                    </td>
                    <td>
                      <Badge status={st.status} label={st.label} />
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Edit size={13} />}
                          onClick={() => {
                            setCourtForm({ id: court.id, name: court.name, court_type_id: court.court_type_id, price_per_hour: court.price_per_hour, status: court.status, image_url: court.image_url || '' });
                            setShowCourtModal(true);
                          }}
                        >
                          Sửa giá
                        </Button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── MODAL: Thêm / Sửa Sân ── */}
      <Modal
        open={showCourtModal}
        onClose={() => setShowCourtModal(false)}
        title={courtForm.id ? 'Sửa thông tin sân thể thao' : 'Thêm sân thể thao mới'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCourtModal(false)}>Hủy</Button>
            <Button variant="primary" type="submit" form="court-form">Lưu thông tin</Button>
          </>
        }
      >
        <form id="court-form" onSubmit={handleSaveCourt} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ gridColumn: '1/-1' }}>
            <Input
              label="Tên sân thể thao"
              required
              value={courtForm.name}
              placeholder="VD: Sân Bóng A, Sân Cầu Lông 1, Sân Pickleball Pro"
              onChange={e => setCourtForm(p => ({ ...p, name: e.target.value }))}
            />
          </div>

          <Select
            label="Loại môn thể thao"
            required
            value={courtForm.court_type_id}
            onChange={e => setCourtForm(p => ({ ...p, court_type_id: e.target.value }))}
            placeholder="-- Chọn loại sân --"
            options={courtTypes.map(ct => ({ value: ct.id, label: ct.name }))}
          />

          <Input
            label="Đơn giá / giờ (VNĐ)"
            type="number"
            required
            min="1000"
            step="1000"
            value={courtForm.price_per_hour}
            placeholder="VD: 200000"
            onChange={e => setCourtForm(p => ({ ...p, price_per_hour: e.target.value }))}
          />

          <div style={{ gridColumn: '1/-1' }}>
            <Select
              label="Trạng thái vận hành"
              value={courtForm.status}
              onChange={e => setCourtForm(p => ({ ...p, status: e.target.value }))}
              options={COURT_STATUS_OPTIONS}
            />
          </div>

          <div style={{ gridColumn: '1/-1' }}>
            <Input
              label="URL ảnh sân riêng (để trống = dùng ảnh sơ đồ chuẩn theo môn)"
              icon={<Link size={13} />}
              value={courtForm.image_url}
              onChange={e => setCourtForm(p => ({ ...p, image_url: e.target.value }))}
              placeholder="https://example.com/court.jpg"
              hint="Hệ thống tự động hiển thị sơ đồ sân chuẩn nếu để trống trường này"
            />
          </div>

          {/* Quick Presets for Court Image */}
          <div style={{ gridColumn: '1/-1' }}>
            <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0 0 6px', fontWeight: 600 }}>
              Mẫu sơ đồ mặt sân chuẩn:
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {courtTypes.map(ct => (
                <button
                  key={ct.id}
                  type="button"
                  onClick={() => setCourtForm(p => ({ ...p, court_type_id: ct.id, image_url: '' }))}
                  style={{
                    padding: '3px 8px',
                    fontSize: '0.74rem',
                    borderRadius: 6,
                    border: '1px solid #E2E8F0',
                    background: courtForm.court_type_id === ct.id ? '#EFF6FF' : '#F8FAFC',
                    color: courtForm.court_type_id === ct.id ? '#2563EB' : '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Sơ đồ {ct.name}
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview */}
          {(courtForm.image_url || courtForm.court_type_id) && (
            <div style={{ gridColumn: '1/-1' }}>
              <p style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: 6 }}>Xem trước hình ảnh hiển thị:</p>
              <div style={{ height: 130, background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <img
                  src={getSportImage(getTypeName(parseInt(courtForm.court_type_id)), courtForm.image_url || null)}
                  alt="preview"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }}
                  onError={e => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getSportImage(getTypeName(parseInt(courtForm.court_type_id)), null);
                  }}
                />
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* ── MODAL: Thêm / Sửa Loại Sân ── */}
      <Modal
        open={showTypeModal}
        onClose={() => setShowTypeModal(false)}
        title={typeForm.id ? 'Sửa thông tin loại sân' : 'Thêm loại môn thể thao mới'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowTypeModal(false)}>Hủy</Button>
            <Button variant="primary" type="submit" form="type-form">Lưu loại sân</Button>
          </>
        }
      >
        <form id="type-form" onSubmit={handleSaveType} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="Tên loại môn thể thao"
            required
            value={typeForm.name}
            onChange={e => setTypeForm(p => ({ ...p, name: e.target.value }))}
            placeholder="VD: Sân bóng đá 7 người, Sân Pickleball, Sân Tennis..."
          />
          <Input
            label="Mô tả tiêu chuẩn quy cách"
            value={typeForm.description}
            onChange={e => setTypeForm(p => ({ ...p, description: e.target.value }))}
            placeholder="VD: Sân cỏ nhân tạo chuẩn FIFA, thảm PVC chống trơn trượt..."
          />
          <Input
            label="URL ảnh đại diện riêng (tùy chọn)"
            icon={<Link size={13} />}
            value={typeForm.image_url}
            onChange={e => setTypeForm(p => ({ ...p, image_url: e.target.value }))}
            hint="Để trống = Hệ thống tự động chọn ảnh theo tên loại môn thể thao"
          />
        </form>
      </Modal>

      {/* ── Confirm Modals ── */}
      <ConfirmModal
        isOpen={Boolean(courtToDelete)}
        onClose={() => setCourtToDelete(null)}
        onConfirm={confirmDeleteCourt}
        title="Xác nhận xóa sân thể thao"
        message="Bạn có chắc chắn muốn xóa sân này không? Hành động này sẽ không thể hoàn tác nếu sân đã có lịch đặt hoặc dữ liệu liên quan."
        confirmText="Xóa sân"
        confirmVariant="danger"
        isLoading={deleting}
      />

      <ConfirmModal
        isOpen={Boolean(typeToDelete)}
        onClose={() => setTypeToDelete(null)}
        onConfirm={confirmDeleteType}
        title="Xác nhận xóa loại môn thể thao"
        message="Xóa loại môn này có thể ảnh hưởng đến các sân đang thuộc phân loại này. Bạn có chắc chắn muốn tiếp tục?"
        confirmText="Xóa loại sân"
        confirmVariant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
