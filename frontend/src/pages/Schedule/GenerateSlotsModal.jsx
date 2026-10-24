import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { timeSlotsAPI, courtsAPI } from '../../api';
import { useToast } from '../../components/ui/Toast';
import { Button, Modal, Input, Select } from '../../components/ui';

export default function GenerateSlotsModal({ isOpen, onClose, courts: courtsProp = [], onSuccess }) {
  const { showToast } = useToast();

  // Tự fetch courts nếu prop rỗng (phòng trường hợp parent chưa load xong)
  const [localCourts, setLocalCourts] = useState([]);
  const [courtsLoading, setCourtsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (courtsProp.length > 0) {
        setLocalCourts(courtsProp);
      } else {
        // Tự fetch nếu không có prop
        setCourtsLoading(true);
        courtsAPI.getAll()
          .then(data => setLocalCourts(data))
          .catch(() => showToast({ type: 'error', message: 'Không tải được danh sách sân' }))
          .finally(() => setCourtsLoading(false));
      }
    }
  }, [isOpen, courtsProp]);

  const courts = localCourts.length > 0 ? localCourts : courtsProp;

  const [formData, setFormData] = useState({
    court_id: '',
    date_from: new Date().toISOString().split('T')[0],
    date_to:   new Date().toISOString().split('T')[0],
    start_hour: 6,
    end_hour:   22,
    duration_minutes: 60,  // lưu theo phút, giống trang TimeSlots
  });
  const [loading, setLoading]         = useState(false);
  const [courtError, setCourtError]   = useState('');  // validation error riêng cho dropdown sân

  // Reset form khi mở lại
  useEffect(() => {
    if (isOpen) {
      setFormData({
        court_id: '',
        date_from: new Date().toISOString().split('T')[0],
        date_to:   new Date().toISOString().split('T')[0],
        start_hour: 6,
        end_hour:   22,
        duration_minutes: 60,
      });
      setCourtError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate sân — hiện lỗi ngay tại dropdown
    if (!formData.court_id) {
      setCourtError('Vui lòng chọn sân trước khi tạo khung giờ');
      return;
    }
    setCourtError('');

    // Validate giờ
    if (parseInt(formData.start_hour) >= parseInt(formData.end_hour)) {
      showToast({ type: 'warning', message: 'Giờ bắt đầu phải nhỏ hơn giờ kết thúc' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        court_id:            parseInt(formData.court_id),
        date_from:           formData.date_from,
        date_to:             formData.date_to,
        start_hour:          parseInt(formData.start_hour),
        end_hour:            parseInt(formData.end_hour),
        slot_duration_hours: formData.duration_minutes / 60,  // convert phút → giờ
      };
      const res = await timeSlotsAPI.generate(payload);
      const courtName = courts.find(c => c.id === parseInt(formData.court_id))?.name || '';
      showToast({
        type: 'success',
        message: `✅ ${courtName}: Tạo ${res.created_count} slot mới, bỏ qua ${res.skipped_count} slot đã tồn tại`,
      });
      onSuccess();
      onClose();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.detail || 'Lỗi khi sinh khung giờ' });
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setFormData(p => ({ ...p, [field]: e.target.value }));

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Sinh Khung Giờ Tự Động"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Hủy</Button>
          <Button variant="primary" loading={loading} type="submit" form="gen-slots-form">
            Sinh Khung Giờ
          </Button>
        </>
      }
    >
      <form
        id="gen-slots-form"
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        {/* ── Chọn sân — BẮT BUỘC ── */}
        <div>
          <Select
            label="Chọn sân *"
            required
            value={formData.court_id}
            placeholder={courtsLoading ? 'Đang tải danh sách sân...' : '-- Chọn sân --'}
            options={courts.map(c => ({ value: c.id, label: c.name }))}
            onChange={e => {
              setFormData(p => ({ ...p, court_id: e.target.value }));
              if (e.target.value) setCourtError('');
            }}
            error={courtError}
          />
          {/* Cảnh báo nếu không có sân nào */}
          {!courtsLoading && courts.length === 0 && (
            <p style={{ color: '#F59E0B', fontSize: '0.78rem', marginTop: 4 }}>
              ⚠️ Chưa có sân nào trong hệ thống. Vui lòng thêm sân trước.
            </p>
          )}
        </div>

        {/* ── Khoảng ngày ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input
            label="Từ ngày *"
            type="date"
            required
            value={formData.date_from}
            onChange={set('date_from')}
          />
          <Input
            label="Đến ngày *"
            type="date"
            required
            min={formData.date_from}
            value={formData.date_to}
            onChange={set('date_to')}
          />
        </div>

        {/* ── Khung giờ ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input
            label="Giờ bắt đầu (0–23) *"
            type="number"
            min="0"
            max="23"
            required
            value={formData.start_hour}
            onChange={set('start_hour')}
          />
          <Input
            label="Giờ kết thúc (1–24) *"
            type="number"
            min="1"
            max="24"
            required
            value={formData.end_hour}
            onChange={set('end_hour')}
          />
        </div>

        {/* Độ dài mỗi ca — giống trang TimeSlots */}
        <Select
          label="Thời lượng mỗi ca"
          value={formData.duration_minutes}
          onChange={set('duration_minutes')}
          options={[
            { value: 30,  label: '30 phút' },
            { value: 60,  label: '60 phút' },
            { value: 90,  label: '90 phút' },
            { value: 120, label: '120 phút' },
          ]}
        />

        {/* Tóm tắt preview */}
        {formData.court_id && formData.date_from && formData.date_to && (
          <div style={{
            padding: '0.75rem 1rem',
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: 10,
            fontSize: '0.82rem',
            color: '#166534',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <Calendar size={16} style={{ color: '#16A34A', flexShrink: 0 }} />
            <div>
              Sẽ sinh khung giờ từ <strong style={{ color: '#0F172A' }}>{formData.date_from}</strong> đến{' '}
              <strong style={{ color: '#0F172A' }}>{formData.date_to}</strong>, mỗi ca{' '}
              <strong style={{ color: '#0F172A' }}>{formData.slot_duration_hours} giờ</strong>, từ{' '}
              <strong style={{ color: '#0F172A' }}>{formData.start_hour}:00</strong> đến{' '}
              <strong style={{ color: '#0F172A' }}>{formData.end_hour}:00</strong>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
