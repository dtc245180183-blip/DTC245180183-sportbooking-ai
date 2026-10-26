import { useState, useEffect } from 'react';
import { courtsAPI, courtTypesAPI } from '../../api';
import { Plus, Edit, Trash2, Filter, Building2, Link } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Button, Card, Badge, Modal, Input, Select, Table, EmptyState, Skeleton, ConfirmModal } from '../../components/ui';
import { getSportImage, getSportAccent } from '../../utils/sportImages';

const COURT_STATUS_MAP = {
  active:      { status: 'available', label: 'Hoạt động' },
  maintenance: { status: 'blocked',   label: 'Bảo trì'   },
  inactive:    { status: 'blocked',   label: 'Tạm dừng'  },
};

const COURT_STATUS_OPTIONS = [
  { value: 'active',      label: 'Hoạt động' },
  { value: 'maintenance', label: 'Bảo trì'   },
  { value: 'inactive',    label: 'Tạm dừng'  },
];

/* ── Court Image Card ─────────────────────────────── */
function CourtCard({ court, typeName, isAdmin, onEdit, onDelete }) {
  const st = COURT_STATUS_MAP[court.status] || COURT_STATUS_MAP.active;
  const accent = getSportAccent(typeName);
  const imgSrc = getSportImage(typeName, court.image_url);

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: 14,
      overflow: 'hidden',
      transition: 'transform 0.18s, box-shadow 0.18s, border-color 0.18s',
      cursor: 'default',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      display: 'flex',
      flexDirection: 'column',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)';
        e.currentTarget.style.borderColor = '#CBD5E1';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
        e.currentTarget.style.borderColor = '#E2E8F0';
      }}
    >
      {/* Header bar with Badges — Clean & NOT overlapping the court diagram */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.65rem 0.875rem',
        background: '#F8FAFC',
        borderBottom: '1px solid #F1F5F9',
      }}>
        <span style={{
          fontSize: '0.72rem',
          fontWeight: 600,
          color: '#475569',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 6,
          padding: '2px 8px',
        }}>
          {typeName}
        </span>
        <Badge status={st.status} label={st.label} />
      </div>

      {/* Unobstructed Court SVG Diagram */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: 135,
        overflow: 'hidden',
        background: '#F8FAFC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <img
          src={imgSrc}
          alt={typeName}
          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '10px' }}
          onError={e => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = getSportImage(typeName, null);
          }}
        />
      </div>

      {/* Content */}
      <div style={{ padding: '0.875rem 1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {court.name}
        </h3>
        <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#059669' }}>
          {court.price_per_hour?.toLocaleString('vi-VN')}đ
          <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 400 }}> /giờ</span>
        </p>

        {isAdmin && (
          <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9' }}>
            <Button variant="secondary" size="sm" icon={<Edit size={13} />} style={{ flex: 1 }} onClick={() => onEdit(court)}>Sửa</Button>
            <Button variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={() => onDelete(court.id)}>Xóa</Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Type Table columns ─────────────────────────── */
function typeColumns(courtTypes, isAdmin, onEdit, onDelete) {
  return [
    { key: 'id',          label: '#',           width: '60px',  render: v => `#${v}` },
    {
      key: 'name', label: 'Tên loại sân',
      render: (v, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src={getSportImage(v, row.image_url)}
            alt={v}
            style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
            onError={e => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = getSportImage(v, null);
            }}
          />
          <strong style={{ color: '#0F172A' }}>{v}</strong>
        </div>
      ),
    },
    { key: 'description', label: 'Mô tả',       render: v => v || '—' },
    isAdmin && {
      key: 'actions', label: '', align: 'right', width: '120px',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <Button variant="ghost" size="sm" icon={<Edit size={13} />}
            onClick={() => onEdit(row)} />
          <Button variant="danger" size="sm" icon={<Trash2 size={13} />}
            onClick={() => onDelete(row.id)} />
        </div>
      ),
    },
  ].filter(Boolean);
}

/* ── Main Page ──────────────────────────────────── */
export default function Courts() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState('courts');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
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

  useEffect(() => { fetchData(); }, [filterType, filterStatus]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterType) params.court_type_id = filterType;
      if (filterStatus) params.status = filterStatus;
      const [c, ct] = await Promise.all([courtsAPI.getAll(params), courtTypesAPI.getAll()]);
      setCourts(c);
      setCourtTypes(ct);
    } catch (e) {}
    finally { setLoading(false); }
  };

  const getTypeName = id => courtTypes.find(ct => ct.id === id)?.name || 'N/A';
  const getTypeImageUrl = id => courtTypes.find(ct => ct.id === id)?.image_url || null;

  /* Handlers Courts */
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
        image_url: courtForm.image_url.trim() || null,
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

  /* Handlers Court Types */
  const handleSaveType = async e => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!typeForm.name.trim()) { showToast({ type: 'warning', message: 'Tên loại sân không được để trống' }); return; }
    try {
      const payload = { name: typeForm.name.trim(), description: typeForm.description, image_url: typeForm.image_url.trim() || null };
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

  const cols = typeColumns(courtTypes, isAdmin,
    row => { setTypeForm({ id: row.id, name: row.name, description: row.description, image_url: row.image_url || '' }); setShowTypeModal(true); },
    handleDeleteType,
  );

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý Sân &amp; Bảng Giá</h1>
          <p className="page-subtitle">Quản lý danh sách sân, loại sân và biểu giá</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', borderBottom: '1px solid #E2E8F0' }}>
        {[['courts', 'Danh sách Sân & Giá'], ['types', 'Danh mục Loại sân']].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '0.65rem 1.25rem', fontSize: '0.9rem',
            fontWeight: activeTab === key ? 700 : 500,
            color: activeTab === key ? '#059669' : '#64748B',
            borderBottom: activeTab === key ? '2px solid #059669' : '2px solid transparent',
            transition: 'all 0.18s', marginBottom: -1,
          }}>{label}</button>
        ))}
      </div>

      {/* ── TAB: COURTS ── */}
      {activeTab === 'courts' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <Filter size={15} style={{ color: '#64748B' }} />
              <Select placeholder="Tất cả loại sân" value={filterType} onChange={e => setFilterType(e.target.value)}
                options={courtTypes.map(ct => ({ value: ct.id, label: ct.name }))} style={{ minWidth: 160 }} />
              <Select placeholder="Tất cả trạng thái" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                options={COURT_STATUS_OPTIONS} style={{ minWidth: 160 }} />
            </div>
            {isAdmin && (
              <Button variant="primary" icon={<Plus size={15} />}
                onClick={() => { setCourtForm({ id: null, name: '', court_type_id: '', price_per_hour: '', status: 'active', image_url: '' }); setShowCourtModal(true); }}>
                Thêm sân mới
              </Button>
            )}
          </div>

          {/* Grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                  <Skeleton variant="rect" height="148px" />
                  <div style={{ padding: '0.875rem 1rem', background: '#FFFFFF' }}>
                    <Skeleton variant="text" height="1rem" style={{ marginBottom: 8 }} />
                    <Skeleton variant="text" height="1.3rem" width="60%" />
                  </div>
                </div>
              ))}
            </div>
          ) : courts.length === 0 ? (
            <Card padding="none">
              <EmptyState icon={Building2} title="Không tìm thấy sân nào" description="Thêm sân mới hoặc thay đổi bộ lọc"
                action={isAdmin ? { label: 'Thêm sân mới', icon: <Plus size={14} />, onClick: () => { setCourtForm({ id: null, name: '', court_type_id: '', price_per_hour: '', status: 'active', image_url: '' }); setShowCourtModal(true); } } : undefined} />
            </Card>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
              {courts.map(court => (
                <CourtCard
                  key={court.id}
                  court={court}
                  typeName={getTypeName(court.court_type_id)}
                  isAdmin={isAdmin}
                  onEdit={c => { setCourtForm({ id: c.id, name: c.name, court_type_id: c.court_type_id, price_per_hour: c.price_per_hour, status: c.status, image_url: c.image_url || '' }); setShowCourtModal(true); }}
                  onDelete={handleDeleteCourt}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── TAB: COURT TYPES ── */}
      {activeTab === 'types' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
            {isAdmin && (
              <Button variant="primary" icon={<Plus size={15} />}
                onClick={() => { setTypeForm({ id: null, name: '', description: '', image_url: '' }); setShowTypeModal(true); }}>
                Thêm loại sân
              </Button>
            )}
          </div>
          <Card padding="none"><Table columns={cols} data={courtTypes} loading={loading} emptyText="Chưa có loại sân nào" /></Card>
        </>
      )}

      {/* ── MODAL: Court Form ── */}
      <Modal open={showCourtModal} onClose={() => setShowCourtModal(false)}
        title={courtForm.id ? 'Sửa thông tin sân' : 'Thêm sân mới'}
        footer={<><Button variant="ghost" onClick={() => setShowCourtModal(false)}>Hủy</Button><Button variant="primary" type="submit" form="court-form">Lưu thông tin</Button></>}
      >
        <form id="court-form" onSubmit={handleSaveCourt} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ gridColumn: '1/-1' }}>
            <Input label="Tên sân" required value={courtForm.name} onChange={e => setCourtForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <Select label="Loại sân" required value={courtForm.court_type_id} onChange={e => setCourtForm(p => ({ ...p, court_type_id: e.target.value }))}
            placeholder="-- Chọn loại --" options={courtTypes.map(ct => ({ value: ct.id, label: ct.name }))} />
          <Input label="Giá/giờ (VNĐ)" type="number" required value={courtForm.price_per_hour} onChange={e => setCourtForm(p => ({ ...p, price_per_hour: e.target.value }))} />
          <Select label="Trạng thái" value={courtForm.status} onChange={e => setCourtForm(p => ({ ...p, status: e.target.value }))} options={COURT_STATUS_OPTIONS} />
          <div style={{ gridColumn: '1/-1' }}>
            <Input label="URL ảnh riêng (để trống = dùng ảnh mặc định theo loại sân)" icon={<Link size={13} />}
              value={courtForm.image_url} onChange={e => setCourtForm(p => ({ ...p, image_url: e.target.value }))}
              placeholder="https://example.com/court.jpg" hint="Ghi đè ảnh mặc định cho sân này" />
          </div>
          {/* Preview */}
          {(courtForm.image_url || courtForm.court_type_id) && (
            <div style={{ gridColumn: '1/-1' }}>
              <p style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: 6 }}>Xem trước ảnh:</p>
              <img
                src={getSportImage(getTypeName(parseInt(courtForm.court_type_id)), courtForm.image_url || null)}
                alt="preview"
                style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(100,140,220,0.15)' }}
                onError={e => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = getSportImage(getTypeName(parseInt(courtForm.court_type_id)), null);
                }}
              />
            </div>
          )}
        </form>
      </Modal>

      {/* ── MODAL: Court Type Form ── */}
      <Modal open={showTypeModal} onClose={() => setShowTypeModal(false)}
        title={typeForm.id ? 'Sửa loại sân' : 'Thêm loại sân mới'}
        footer={<><Button variant="ghost" onClick={() => setShowTypeModal(false)}>Hủy</Button><Button variant="primary" type="submit" form="type-form">Lưu</Button></>}
      >
        <form id="type-form" onSubmit={handleSaveType} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input label="Tên loại sân" required value={typeForm.name} onChange={e => setTypeForm(p => ({ ...p, name: e.target.value }))} placeholder="VD: Sân cầu lông" />
          <Input label="Mô tả" value={typeForm.description} onChange={e => setTypeForm(p => ({ ...p, description: e.target.value }))} placeholder="Tiêu chuẩn, kích thước..." />
          <Input label="URL ảnh riêng (tùy chọn)" icon={<Link size={13} />}
            value={typeForm.image_url} onChange={e => setTypeForm(p => ({ ...p, image_url: e.target.value }))}
            hint="Để trống = tự động chọn ảnh theo tên loại sân" />
        </form>
      </Modal>

      <ConfirmModal
        isOpen={Boolean(courtToDelete)}
        onClose={() => setCourtToDelete(null)}
        onConfirm={confirmDeleteCourt}
        title="Xác nhận xóa sân"
        message="Bạn có chắc chắn muốn xóa sân này không? Hành động này sẽ không thể hoàn tác nếu sân đã có dữ liệu liên quan."
        confirmText="Xóa sân"
        confirmVariant="danger"
        isLoading={deleting}
      />

      <ConfirmModal
        isOpen={Boolean(typeToDelete)}
        onClose={() => setTypeToDelete(null)}
        onConfirm={confirmDeleteType}
        title="Xác nhận xóa loại sân"
        message="Xóa loại sân này có thể ảnh hưởng đến các sân đang sử dụng. Bạn có chắc chắn muốn tiếp tục?"
        confirmText="Xóa loại sân"
        confirmVariant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
