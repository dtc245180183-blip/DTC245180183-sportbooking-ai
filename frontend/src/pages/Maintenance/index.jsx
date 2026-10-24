import { useState, useEffect } from 'react';
import { maintenanceAPI, courtsAPI } from '../../api';
import { Wrench, Plus, Edit, Trash2, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Button, Card, Badge, Modal, Input, Select, Table, ConfirmModal } from '../../components/ui';

const STATUS_OPTS = [
  { value: 'planned',     label: 'Kế hoạch'  },
  { value: 'in_progress', label: 'Đang sửa'  },
  { value: 'done',        label: 'Hoàn thành' },
];

const STATUS_BADGE = { planned: 'pending', in_progress: 'pending', done: 'confirmed' };
const STATUS_LABEL = { planned: 'Kế hoạch', in_progress: 'Đang sửa', done: 'Hoàn thành' };
const STATUS_META = {
  planned:     { color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', icon: Clock },
  in_progress: { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', icon: Wrench },
  done:        { color: '#15803D', bg: '#DCFCE7', border: '#BBF7D0', icon: CheckCircle },
};

export default function Maintenance() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user?.role === 'admin';

  const [schedules, setSchedules] = useState([]);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ court_id: '', start_date: '', end_date: '', reason: '', status: 'planned' });
  const [conflicts, setConflicts] = useState(null);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchAll();
    courtsAPI.getAll({}).then(setCourts).catch(() => {});
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const data = await maintenanceAPI.getAll();
      setSchedules(data);
    } catch (e) {}
    finally { setLoading(false); }
  };

  const getCourtName = (id) => courts.find(c => c.id === id)?.name || `Sân#${id}`;

  const handleSave = async (e, force = false) => {
    if (e) e.preventDefault();
    try {
      const payload = { ...formData, court_id: parseInt(formData.court_id) };
      if (editId) {
        await maintenanceAPI.update(editId, payload, { params: { force } });
      } else {
        await maintenanceAPI.create(payload, { params: { force } });
      }
      showToast({ type: 'success', message: editId ? 'Cập nhật lịch bảo trì thành công' : 'Thêm lịch bảo trì thành công' });
      setShowForm(false);
      setEditId(null);
      setFormData({ court_id: '', start_date: '', end_date: '', reason: '', status: 'planned' });
      setConflicts(null);
      fetchAll();
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.detail?.conflicting_bookings) {
        setConflicts(err.response.data.detail.conflicting_bookings);
      } else {
        showToast({ type: 'error', message: err.response?.data?.detail || 'Thao tác thất bại' });
      }
    }
  };

  const handleEdit = (s) => {
    setFormData({ court_id: s.court_id, start_date: s.start_date, end_date: s.end_date, reason: s.reason || '', status: s.status });
    setEditId(s.id);
    setConflicts(null);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setScheduleToDelete(id);
  };

  const confirmDeleteSchedule = async () => {
    if (!scheduleToDelete) return;
    setDeleting(true);
    try {
      await maintenanceAPI.delete(scheduleToDelete);
      showToast({ type: 'success', message: 'Đã xóa lịch bảo trì thành công' });
      setScheduleToDelete(null);
      fetchAll();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.detail || 'Xóa thất bại' });
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await maintenanceAPI.update(id, { status: newStatus });
      showToast({ type: 'success', message: 'Cập nhật trạng thái thành công' });
      fetchAll();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.detail || 'Cập nhật thất bại' });
    }
  };

  const columns = [
    { key: 'id',         label: '#',        width: '60px', render: (v) => `#${v}` },
    { key: 'court_id',   label: 'Sân',      render: (v) => <strong style={{ color: '#0F172A' }}>{getCourtName(v)}</strong> },
    { key: 'start_date', label: 'Từ ngày'  },
    { key: 'end_date',   label: 'Đến ngày' },
    { key: 'reason',     label: 'Lý do',    render: (v) => v || '—' },
    { key: 'status',     label: 'Trạng thái', render: (v) => <Badge status={STATUS_BADGE[v] || 'pending'} label={STATUS_LABEL[v] || v} /> },
    isAdmin && {
      key: 'actions', label: '', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {row.status === 'planned'     && <Button variant="ghost" size="sm" icon={<Wrench size={12} />} onClick={() => handleStatusUpdate(row.id, 'in_progress')} style={{ color: '#D97706', borderColor: '#FDE68A', background: '#FFFBEB' }}>Bắt đầu</Button>}
          {row.status === 'in_progress' && <Button variant="ghost" size="sm" icon={<CheckCircle size={12} />} onClick={() => handleStatusUpdate(row.id, 'done')} style={{ color: '#15803D', borderColor: '#BBF7D0', background: '#DCFCE7' }}>Hoàn tất</Button>}
          <Button variant="ghost" size="sm" icon={<Edit size={13} />} onClick={() => handleEdit(row)} />
          <Button variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={() => handleDelete(row.id)} />
        </div>
      ),
    },
  ].filter(Boolean);

  return (
    <div style={{ maxWidth: 1200 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Lịch Bảo trì Sân</h1>
          <p className="page-subtitle">Lên kế hoạch và theo dõi tiến trình bảo dưỡng</p>
        </div>
        {isAdmin && (
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => { setEditId(null); setFormData({ court_id: '', start_date: '', end_date: '', reason: '', status: 'planned' }); setConflicts(null); setShowForm(true); }}>
            Thêm lịch bảo trì
          </Button>
        )}
      </div>

      {/* Status Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
        {Object.entries(STATUS_META).map(([key, meta]) => {
          const count = schedules.filter(s => s.status === key).length;
          const IconComp = meta.icon;
          return (
            <Card key={key} padding="md" style={{ borderTop: `3px solid ${meta.color}`, textAlign: 'center', background: '#FFFFFF', border: '1px solid #E2E8F0', borderTopWidth: 3, borderTopColor: meta.color, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: '0.25rem' }}>
                <IconComp size={16} style={{ color: meta.color }} />
                <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>{STATUS_LABEL[key]}</span>
              </div>
              <p style={{ fontSize: '2rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>{count}</p>
            </Card>
          );
        })}
      </div>

      <Card padding="none">
        <Table columns={columns} data={schedules} loading={loading} emptyText="Chưa có lịch bảo trì nào" />
      </Card>

      {/* ── MODAL: Form ── */}
      <Modal
        open={showForm && isAdmin}
        onClose={() => { setShowForm(false); setConflicts(null); }}
        title={editId ? 'Sửa lịch bảo trì' : 'Thêm Lịch Bảo Trì'}
        footer={!conflicts && (
          <>
            <Button variant="ghost" onClick={() => { setShowForm(false); setConflicts(null); }}>Hủy</Button>
            <Button variant="primary" type="submit" form="maintenance-form">Lưu lịch bảo trì</Button>
          </>
        )}
      >
        <form id="maintenance-form" onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Select label="Sân" required value={formData.court_id} onChange={e => setFormData(p => ({ ...p, court_id: e.target.value }))}
            placeholder="-- Chọn sân --" options={courts.map(c => ({ value: c.id, label: c.name }))} />
          <Select label="Trạng thái" value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))} options={STATUS_OPTS} />
          <Input label="Ngày bắt đầu" type="date" required value={formData.start_date} onChange={e => setFormData(p => ({ ...p, start_date: e.target.value }))} />
          <Input label="Ngày kết thúc" type="date" required value={formData.end_date} onChange={e => setFormData(p => ({ ...p, end_date: e.target.value }))} />
          <div style={{ gridColumn: '1/-1' }}>
            <Input label="Lý do / Mô tả" value={formData.reason} onChange={e => { setFormData(p => ({ ...p, reason: e.target.value })); setConflicts(null); }}
              placeholder="Sửa mặt sân, thay lưới, bảo dưỡng hệ thống chiếu sáng..." />
          </div>

          {conflicts && (
            <div style={{ gridColumn: '1/-1', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '1rem' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <AlertTriangle size={18} style={{ color: '#D97706', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong style={{ color: '#92400E' }}>Cảnh báo trùng lịch</strong>
                  <p style={{ fontSize: '0.875rem', color: '#B45309', margin: '0.25rem 0 0' }}>
                    Lịch này đè lên các đơn đã xác nhận: {conflicts.map(c => `#${c}`).join(', ')}. Bạn có muốn tiếp tục?
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="primary" size="sm" style={{ background: '#D97706', borderColor: '#D97706' }} onClick={() => handleSave(null, true)}>Tiếp tục lưu</Button>
                <Button variant="ghost" size="sm" onClick={() => setConflicts(null)}>Hủy</Button>
              </div>
            </div>
          )}
        </form>
      </Modal>

      <ConfirmModal
        isOpen={Boolean(scheduleToDelete)}
        onClose={() => setScheduleToDelete(null)}
        onConfirm={confirmDeleteSchedule}
        title="Xác nhận xóa lịch bảo trì"
        message="Bạn có chắc chắn muốn xóa lịch bảo trì này không?"
        confirmText="Xóa lịch bảo trì"
        confirmVariant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
