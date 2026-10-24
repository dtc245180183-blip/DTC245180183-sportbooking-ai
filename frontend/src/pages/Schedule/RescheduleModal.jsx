import { useState, useEffect } from 'react';
import { timeSlotsAPI, bookingsAPI } from '../../api';
import { useToast } from '../../components/ui/Toast';
import { Button, Modal, Input, Select } from '../../components/ui';

export default function RescheduleModal({ isOpen, onClose, booking, courts, onSuccess }) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    court_id: '',
    date: new Date().toISOString().split('T')[0],
    new_time_slot_id: '',
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && booking) {
      setFormData({
        court_id: booking.court_id,
        date: booking.time_slot?.date || new Date().toISOString().split('T')[0],
        new_time_slot_id: '',
      });
    }
  }, [isOpen, booking]);

  useEffect(() => {
    if (formData.court_id && formData.date) {
      timeSlotsAPI.getAll({ court_id: formData.court_id, filter_date: formData.date, status: 'available' })
        .then(setAvailableSlots)
        .catch(() => setAvailableSlots([]));
    } else {
      setAvailableSlots([]);
    }
  }, [formData.court_id, formData.date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.new_time_slot_id) { showToast({ type: 'warning', message: 'Vui lòng chọn khung giờ trống mới' }); return; }
    setLoading(true);
    try {
      const res = await bookingsAPI.reschedule(booking.id, { new_time_slot_id: parseInt(formData.new_time_slot_id) });
      showToast({ type: 'success', message: res.message || 'Đổi lịch thành công' });
      onSuccess();
      onClose();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.detail || 'Lỗi khi đổi lịch' });
      if (err.response?.status === 409) {
        // Reload slots sau conflict
        timeSlotsAPI.getAll({ court_id: formData.court_id, filter_date: formData.date, status: 'available' })
          .then(setAvailableSlots).catch(() => setAvailableSlots([]));
        setFormData(p => ({ ...p, new_time_slot_id: '' }));
      }
    } finally {
      setLoading(false);
    }
  };

  if (!booking) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={`Đổi Lịch Đặt Sân #${booking.id}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Hủy</Button>
          <Button variant="primary" loading={loading} type="submit" form="reschedule-form">Xác nhận Đổi Lịch</Button>
        </>
      }
    >
      <form id="reschedule-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Select label="Sân mới (có thể giữ nguyên sân cũ)" required value={formData.court_id}
          onChange={e => setFormData(p => ({ ...p, court_id: e.target.value, new_time_slot_id: '' }))}
          placeholder="-- Chọn sân --"
          options={courts?.filter(c => c.status === 'active').map(c => ({ value: c.id, label: c.name })) || []} />
        <Input label="Ngày mới" type="date" required value={formData.date}
          onChange={e => setFormData(p => ({ ...p, date: e.target.value, new_time_slot_id: '' }))} />
        <Select
          label="Khung giờ mới"
          required
          value={formData.new_time_slot_id}
          disabled={!formData.court_id || !formData.date}
          onChange={e => setFormData(p => ({ ...p, new_time_slot_id: e.target.value }))}
          placeholder={!formData.court_id || !formData.date ? 'Vui lòng chọn Sân & Ngày' : availableSlots.length === 0 ? 'Không còn khung giờ trống' : '-- Chọn khung giờ --'}
          options={availableSlots.map(s => ({ value: s.id, label: `${s.start_time.slice(0,5)} – ${s.end_time.slice(0,5)}` }))}
        />
      </form>
    </Modal>
  );
}
