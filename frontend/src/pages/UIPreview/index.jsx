import { useState } from 'react';
import {
  Button, Card, Badge, Modal, Input, Select,
  Table, EmptyState, Skeleton, useToast,
} from '../../components/ui';
import {
  Plus, Trash2, Edit, Sparkles, Search, Calendar,
  CheckCircle, AlertTriangle, Bell, Zap, Users,
  CreditCard, LayoutGrid, Layers, ToggleLeft,
} from 'lucide-react';

/* ─────────────── Section wrapper ─────────────── */
function Section({ icon: Icon, title, subtitle, children }) {
  return (
    <div style={{ marginBottom: '3rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
        {Icon && (
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'rgba(20,184,166,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#14B8A6', flexShrink: 0,
          }}>
            <Icon size={15} />
          </div>
        )}
        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#F1F5F9' }}>{title}</h2>
      </div>
      {subtitle && <p style={{ margin: '0 0 1.25rem', fontSize: '0.8rem', color: '#64748B' }}>{subtitle}</p>}
      {!subtitle && <div style={{ marginBottom: '1.25rem' }} />}
      {children}
    </div>
  );
}

/* ─────────────── Label chip ─────────────── */
function Chip({ children }) {
  return (
    <span style={{
      fontSize: '0.7rem', fontWeight: 600, color: '#94A3B8',
      background: 'rgba(100,140,220,0.1)', border: '1px solid rgba(100,140,220,0.15)',
      padding: '2px 8px', borderRadius: 99, letterSpacing: '0.04em',
    }}>
      {children}
    </span>
  );
}

/* ─────────────── Table columns ─────────────── */
const COLS = [
  { key: 'id', label: '#', width: '48px' },
  { key: 'name', label: 'Tên sân' },
  { key: 'status', label: 'Trạng thái', render: (v) => <Badge status={v} /> },
  { key: 'amount', label: 'Số tiền', align: 'right', render: (v) => v.toLocaleString('vi-VN') + 'đ' },
  {
    key: 'actions', label: '', align: 'right', width: '80px',
    render: () => (
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        <Button variant="ghost" size="sm" icon={<Edit size={13} />} />
        <Button variant="danger" size="sm" icon={<Trash2 size={13} />} />
      </div>
    ),
  },
];

const ROWS = [
  { id: 1, name: 'Sân Bóng Đá A', status: 'confirmed', amount: 150000 },
  { id: 2, name: 'Sân Tennis B',  status: 'pending',   amount: 200000 },
  { id: 3, name: 'Sân Cầu Lông', status: 'cancelled',  amount: 80000  },
];

/* ─────────────── Page ─────────────── */
export default function UIPreview() {
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [inputVal, setInputVal] = useState('');

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>

      {/* ── Hero header ── */}
      <div style={{ marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(100,140,220,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg,#14B8A6,#3B82F6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Layers size={18} color="white" />
          </div>
          <h1 className="page-title text-gradient" style={{ margin: 0 }}>UI Component Library</h1>
        </div>
        <p style={{ color: '#64748B', fontSize: '0.875rem', margin: 0 }}>
          Phase 2 preview — Kiểm tra toàn bộ atoms trước khi áp dụng vào 12 trang chính
        </p>
      </div>

      {/* ══════════ BUTTON ══════════ */}
      <Section icon={ToggleLeft} title="Button" subtitle="5 variants · 3 sizes · loading · disabled">
        <Card padding="md">
          {/* Row 1: variants */}
          <div style={{ marginBottom: '0.5rem' }}><Chip>Variants</Chip></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: '1.25rem' }}>
            <Button variant="primary"   icon={<Zap size={14} />}>Primary</Button>
            <Button variant="secondary" icon={<Edit size={14} />}>Secondary</Button>
            <Button variant="danger"    icon={<Trash2 size={14} />}>Danger</Button>
            <Button variant="ghost"     icon={<Search size={14} />}>Ghost</Button>
            <Button variant="ai"        icon={<Sparkles size={14} />}>AI</Button>
          </div>

          {/* Row 2: sizes */}
          <div style={{ marginBottom: '0.5rem' }}><Chip>Sizes</Chip></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: '1.25rem' }}>
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="md">Medium</Button>
            <Button variant="primary" size="lg">Large</Button>
          </div>

          {/* Row 3: states */}
          <div style={{ marginBottom: '0.5rem' }}><Chip>States</Chip></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <Button variant="primary" loading>Đang xử lý...</Button>
            <Button variant="primary" disabled>Disabled</Button>
            <Button variant="secondary" disabled>Disabled</Button>
          </div>
        </Card>
      </Section>

      {/* ══════════ BADGE ══════════ */}
      <Section icon={Bell} title="Badge" subtitle="Tất cả preset status trong hệ thống">
        <Card padding="md">
          <div style={{ marginBottom: '0.625rem' }}><Chip>Booking</Chip></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1rem' }}>
            {['pending','confirmed','cancelled','completed'].map(s => <Badge key={s} status={s} />)}
          </div>
          <div style={{ marginBottom: '0.625rem' }}><Chip>Time Slot</Chip></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1rem' }}>
            {['available','booked','blocked'].map(s => <Badge key={s} status={s} />)}
          </div>
          <div style={{ marginBottom: '0.625rem' }}><Chip>Payment · Role · Custom</Chip></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['paid','unpaid','partial','admin','staff'].map(s => <Badge key={s} status={s} />)}
            <Badge status="custom" label="Custom label" dot={false} />
          </div>
        </Card>
      </Section>

      {/* ══════════ CARD ══════════ */}
      <Section icon={LayoutGrid} title="Card" subtitle="3 variants: default · glow · hoverable">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <Card padding="md">
            <p style={{ color: '#94A3B8', fontSize: '0.8rem', marginBottom: 6 }}>Card mặc định</p>
            <p style={{ color: '#F1F5F9', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>150,000đ</p>
          </Card>
          <Card padding="md" glow>
            <p style={{ color: '#94A3B8', fontSize: '0.8rem', marginBottom: 6 }}>Card + Glow effect</p>
            <p style={{ color: '#14B8A6', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Doanh thu</p>
          </Card>
          <Card padding="md" hoverable>
            <p style={{ color: '#94A3B8', fontSize: '0.8rem', marginBottom: 6 }}>Card + Hoverable ↑</p>
            <p style={{ color: '#F1F5F9', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Hover me</p>
          </Card>
        </div>
      </Section>

      {/* ══════════ FORM CONTROLS ══════════ */}
      <Section icon={CreditCard} title="Input & Select" subtitle="Form controls với label, error state, icon, hint">
        <Card padding="md">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <Input
              label="Tên khách hàng"
              placeholder="Nhập tên..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              icon={<Users size={14} />}
            />
            <Input
              label="Email (có lỗi)"
              defaultValue="abc@"
              error="Email không đúng định dạng"
            />
            <Select
              label="Loại sân"
              placeholder="Chọn loại sân..."
              options={[
                { value: 'badminton', label: 'Cầu lông' },
                { value: 'tennis', label: 'Tennis' },
                { value: 'football', label: 'Bóng đá' },
              ]}
            />
            <Input
              label="Ngày đặt"
              type="date"
              icon={<Calendar size={14} />}
              hint="Ngày khách muốn đặt sân"
            />
          </div>
        </Card>
      </Section>

      {/* ══════════ SKELETON ══════════ */}
      <Section icon={Layers} title="Skeleton" subtitle="Loading placeholders dạng shimmer">
        <Card padding="md">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
            <div>
              <Chip>3 dòng text</Chip>
              <div style={{ marginTop: 10 }}><Skeleton variant="text" count={3} height="0.875rem" /></div>
            </div>
            <div>
              <Chip>Rect (card)</Chip>
              <div style={{ marginTop: 10 }}><Skeleton variant="rect" height="72px" /></div>
            </div>
            <div>
              <Chip>Avatar + text</Chip>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10 }}>
                <Skeleton variant="circle" width="40px" height="40px" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Skeleton variant="text" height="0.875rem" />
                  <Skeleton variant="text" height="0.75rem" width="60%" />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </Section>

      {/* ══════════ TABLE ══════════ */}
      <Section icon={LayoutGrid} title="Table" subtitle="3 trạng thái: có data · loading · rỗng">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <div style={{ marginBottom: 6 }}><Chip>Với dữ liệu thật</Chip></div>
            <Card padding="none"><Table columns={COLS} data={ROWS} /></Card>
          </div>
          <div>
            <div style={{ marginBottom: 6 }}><Chip>Loading state</Chip></div>
            <Card padding="none"><Table columns={COLS} data={[]} loading /></Card>
          </div>
          <div>
            <div style={{ marginBottom: 6 }}><Chip>Empty state</Chip></div>
            <Card padding="none"><Table columns={COLS} data={[]} emptyText="Chưa có đặt sân nào hôm nay" /></Card>
          </div>
        </div>
      </Section>

      {/* ══════════ EMPTY STATE ══════════ */}
      <Section icon={Search} title="EmptyState" subtitle="Hiển thị khi danh sách rỗng">
        <Card padding="none">
          <EmptyState
            icon={Calendar}
            title="Chưa có lịch đặt sân"
            description="Tạo đặt sân đầu tiên để bắt đầu quản lý lịch của bạn"
            action={{ label: 'Tạo đặt sân ngay', icon: <Plus size={14} />, onClick: () => {} }}
          />
        </Card>
      </Section>

      {/* ══════════ MODAL ══════════ */}
      <Section icon={Layers} title="Modal" subtitle="ESC close · scroll lock · animation · 4 sizes">
        <Card padding="md">
          <Button variant="secondary" icon={<Layers size={14} />} onClick={() => setModalOpen(true)}>
            Mở Modal demo
          </Button>
        </Card>
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Modal xác nhận đặt sân"
          footer={
            <>
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Hủy</Button>
              <Button variant="primary" onClick={() => setModalOpen(false)}>Xác nhận</Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ color: '#94A3B8', fontSize: '0.875rem', margin: 0 }}>
              Bấm <strong style={{ color: '#F1F5F9' }}>ESC</strong> hoặc click nền mờ để đóng.
              Scroll lock được áp dụng khi modal mở.
            </p>
            <Input label="Tên khách" placeholder="Nhập tên khách hàng..." />
            <Select
              label="Loại sân"
              placeholder="Chọn..."
              options={[{ value: '1', label: 'Tennis' }, { value: '2', label: 'Cầu lông' }]}
            />
          </div>
        </Modal>
      </Section>

      {/* ══════════ TOAST ══════════ */}
      <Section icon={Bell} title="Toast" subtitle="4 types · auto dismiss · progress bar · góc phải dưới">
        <Card padding="md">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <Button
              variant="primary"
              icon={<CheckCircle size={14} />}
              onClick={() => showToast({ type: 'success', message: 'Đặt sân thành công! Booking #1234 đã được xác nhận.' })}
            >
              Success
            </Button>
            <Button
              variant="danger"
              icon={<Trash2 size={14} />}
              onClick={() => showToast({ type: 'error', message: 'Xóa thất bại. Sân vẫn còn lịch đặt chưa hoàn tất.' })}
            >
              Error
            </Button>
            <Button
              variant="ghost"
              icon={<AlertTriangle size={14} />}
              onClick={() => showToast({ type: 'warning', message: 'Sân đang trong lịch bảo trì, vui lòng kiểm tra lại.' })}
            >
              Warning
            </Button>
            <Button
              variant="secondary"
              onClick={() => showToast({ type: 'info', message: 'Phiên làm việc sẽ hết hạn sau 10 phút.' })}
            >
              Info
            </Button>
          </div>
        </Card>
      </Section>

      {/* Bottom spacer */}
      <div style={{ height: '3rem' }} />
    </div>
  );
}
