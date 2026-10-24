import { useState, useEffect } from 'react';
import { timeSlotsAPI, courtsAPI } from '../../api';
import { Calendar, RefreshCw, Lock, Unlock, Clock, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Button, Card, Badge, Modal, Input, Select, EmptyState, Skeleton } from '../../components/ui';

const STATUS_INFO = {
  available: { label: 'Trống',   bg: '#DCFCE7', color: '#15803D', border: '#BBF7D0' },
  booked:    { label: 'Đã đặt', bg: '#FEE2E2', color: '#B91C1C', border: '#FECACA' },
  blocked:   { label: 'Khóa',   bg: '#F1F5F9', color: '#475569', border: '#E2E8F0' },
};

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({ value: i, label: `${String(i).padStart(2,'0')}:00` }));
const HOUR_OPTIONS_END = Array.from({ length: 24 }, (_, i) => ({ value: i + 1, label: `${String(i+1).padStart(2,'0')}:00` }));
const DUR_OPTIONS = [{ value: 30, label: '30 phút' }, { value: 60, label: '60 phút' }, { value: 90, label: '90 phút' }, { value: 120, label: '120 phút' }];

export default function TimeSlots() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user?.role === 'admin';

  const [courts, setCourts] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    court_id: '',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date().toISOString().slice(0, 10),
    start_hour: 6, end_hour: 22, duration_minutes: 60,
  });

  useEffect(() => { courtsAPI.getAll({}).then(setCourts).catch(() => {}); }, []);

  useEffect(() => {
    if (selectedCourt && selectedDate) fetchSlots();
  }, [selectedCourt, selectedDate]);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const data = await timeSlotsAPI.getAll({ court_id: selectedCourt, filter_date: selectedDate });
      data.sort((a, b) => a.start_time.localeCompare(b.start_time));
      setSlots(data);
    } catch (e) {}
    finally { setLoading(false); }
  };

  const handleToggleBlock = async (slotId) => {
    if (!isAdmin) return;
    try {
      await timeSlotsAPI.toggleBlock(slotId);
      fetchSlots();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.detail || 'Không thể đổi trạng thái slot này' });
    }
  };

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
      // Map sang đúng field names mà backend /time-slots/generate yêu cầu
      const payload = {
        court_id:            parseInt(courtId),
        date_from:           bulkForm.start_date,
        date_to:             bulkForm.end_date,
        start_hour:          parseInt(bulkForm.start_hour),
        end_hour:            parseInt(bulkForm.end_hour),
        slot_duration_hours: bulkForm.duration_minutes / 60,  // convert phút → giờ
      };
      const result = await timeSlotsAPI.generate(payload);
      const courtName = courts.find(c => c.id === parseInt(courtId))?.name || '';
      showToast({
        type: 'success',
        message: `✅ ${courtName}: Tạo ${result.created_count} slot mới, bỏ qua ${result.skipped_count} slot đã tồn tại`,
      });
      setSelectedCourt(String(courtId));
      setShowBulkModal(false);
      if (bulkForm.start_date <= selectedDate && selectedDate <= bulkForm.end_date) fetchSlots();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.detail || 'Lỗi khi tạo khung giờ' });
    } finally {
      setGenerating(false);
    }
  };

  const totalSlots     = slots.length;
  const bookedSlots    = slots.filter(s => s.status === 'booked').length;
  const availableSlots = slots.filter(s => s.status === 'available').length;
  const blockedSlots   = slots.filter(s => s.status === 'blocked').length;
  const occupancyRate  = totalSlots > 0 ? Math.round(bookedSlots / totalSlots * 100) : 0;

  return (
    <div style={{ maxWidth: 1200 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Khung giờ &amp; Trạng thái Đặt</h1>
          <p className="page-subtitle">Xem và quản lý các ca theo sân và ngày</p>
        </div>
        {isAdmin && (
          <Button variant="primary" icon={<Zap size={15} />} onClick={() => {
            setBulkForm(p => ({ ...p, court_id: selectedCourt || (courts[0]?.id ? String(courts[0].id) : '') }));
            setShowBulkModal(true);
          }}>
            Tạo khung giờ nhanh
          </Button>
        )}
      </div>

      {/* Filter bar */}
      <Card padding="md" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <Select label="Chọn sân" value={selectedCourt} onChange={e => setSelectedCourt(e.target.value)}
              placeholder="-- Chọn sân --" options={courts.map(c => ({ value: c.id, label: c.name }))} />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <Input label="Ngày xem" type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
          </div>
          <Button variant="secondary" icon={<RefreshCw size={14} />} onClick={fetchSlots}>Tải lại</Button>
        </div>
      </Card>

      {/* Stats */}
      {totalSlots > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Tổng ca',   value: totalSlots,   color: '#4F46E5' },
            { label: 'Trống',     value: availableSlots, color: '#059669' },
            { label: 'Đã đặt',   value: bookedSlots,  color: '#DC2626'  },
            { label: 'Bị khóa',  value: blockedSlots, color: '#475569'  },
            { label: 'Công suất', value: `${occupancyRate}%`, color: occupancyRate > 70 ? '#D97706' : '#2563EB' },
          ].map(s => (
            <Card key={s.label} padding="sm" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
              <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '2px 0 0', fontWeight: 500 }}>{s.label}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
          {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} height="88px" variant="rect" />)}
        </div>
      )}

      {/* Empty states */}
      {!loading && !selectedCourt && (
        <Card padding="none"><EmptyState icon={Calendar} title="Chọn sân để xem khung giờ" description="Sử dụng bộ lọc bên trên để chọn sân và ngày" /></Card>
      )}
      {!loading && selectedCourt && slots.length === 0 && (
        <Card padding="none">
          <EmptyState icon={Clock} title="Chưa có khung giờ nào" description='Dùng nút "Tạo khung giờ nhanh" để tạo'
            action={isAdmin ? { label: 'Tạo khung giờ', icon: <Zap size={14} />, onClick: () => setShowBulkModal(true) } : undefined} />
        </Card>
      )}

      {/* Slot grid */}
      {!loading && slots.length > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
            {slots.map(slot => {
              const info = STATUS_INFO[slot.status] || STATUS_INFO.available;
              const canToggle = isAdmin && slot.status !== 'booked';
              return (
                <div
                  key={slot.id}
                  onClick={() => canToggle && handleToggleBlock(slot.id)}
                  title={canToggle ? 'Click để khóa/mở' : ''}
                  style={{
                    background: info.bg, border: `1px solid ${info.border}`, borderRadius: 12,
                    padding: '0.75rem', textAlign: 'center',
                    cursor: canToggle ? 'pointer' : 'default',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={e => { if (canToggle) e.currentTarget.style.transform = 'scale(1.04)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <p style={{ fontSize: '1.1rem', fontWeight: 700, color: info.color, margin: '0 0 2px' }}>
                    {slot.start_time.slice(0, 5)}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0 0 6px' }}>— {slot.end_time.slice(0, 5)}</p>
                  <Badge status={slot.status} label={info.label} dot={false} />
                  {canToggle && (
                    <p style={{ marginTop: '0.375rem', fontSize: '0.7rem', color: '#64748B' }}>
                      {slot.status === 'available' ? <><Lock size={10}/> Khóa</> : <><Unlock size={10}/> Mở</>}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            {Object.entries(STATUS_INFO).map(([key, val]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: val.bg, border: `1px solid ${val.border}` }} />
                <span style={{ fontSize: '0.8rem', color: '#475569' }}>{val.label}</span>
              </div>
            ))}
            {isAdmin && <span style={{ fontSize: '0.8rem', color: '#64748B', marginLeft: 'auto' }}>Click vào ô Trống/Khóa để đổi trạng thái</span>}
          </div>
        </>
      )}

      {/* ── MODAL: Bulk generate ── */}
      <Modal
        open={showBulkModal && isAdmin}
        onClose={() => setShowBulkModal(false)}
        title="Tạo khung giờ tự động"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowBulkModal(false)}>Hủy</Button>
            <Button variant="primary" loading={generating} type="submit" form="bulk-form">Tạo khung giờ</Button>
          </>
        }
      >
        <form id="bulk-form" onSubmit={handleBulkGenerate}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ gridColumn: '1/-1' }}>
            <Select
              label="Chọn sân *"
              required
              value={bulkForm.court_id}
              onChange={e => setBulkForm(p => ({ ...p, court_id: e.target.value }))}
              options={courts.map(c => ({ value: c.id, label: `${c.name} (${c.price_per_hour?.toLocaleString('vi-VN')}đ/giờ)` }))}
              placeholder="-- Chọn sân cần sinh khung giờ --"
            />
          </div>
          <Input label="Ngày bắt đầu" type="date" required
            value={bulkForm.start_date}
            onChange={e => setBulkForm(p => ({ ...p, start_date: e.target.value }))} />
          <Input label="Ngày kết thúc" type="date" required
            min={bulkForm.start_date}
            value={bulkForm.end_date}
            onChange={e => setBulkForm(p => ({ ...p, end_date: e.target.value }))} />
          <Select label="Giờ bắt đầu" value={bulkForm.start_hour}
            onChange={e => setBulkForm(p => ({ ...p, start_hour: parseInt(e.target.value) }))}
            options={HOUR_OPTIONS} />
          <Select label="Giờ kết thúc" value={bulkForm.end_hour}
            onChange={e => setBulkForm(p => ({ ...p, end_hour: parseInt(e.target.value) }))}
            options={HOUR_OPTIONS_END} />
          <div style={{ gridColumn: '1/-1' }}>
            <Select label="Độ dài mỗi ca" value={bulkForm.duration_minutes}
              onChange={e => setBulkForm(p => ({ ...p, duration_minutes: parseInt(e.target.value) }))}
              options={DUR_OPTIONS} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
