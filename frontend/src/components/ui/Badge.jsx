/**
 * Badge component — hiển thị trạng thái/nhãn
 * Hỗ trợ preset status hoặc màu tuỳ chỉnh
 *
 * @param {string} status — preset key (xem STATUS_PRESETS bên dưới)
 * @param {string} label  — override nhãn text (dùng preset nếu bỏ qua)
 * @param {boolean} dot   — hiển thị chấm trạng thái
 * @param {string} className
 */

const STATUS_PRESETS = {
  // Booking status
  pending:   { label: 'Chờ xử lý',   bg: '#FEF3C7', color: '#B45309', border: '#FDE68A' },
  confirmed: { label: 'Đã xác nhận', bg: '#DCFCE7', color: '#15803D', border: '#BBF7D0' },
  cancelled: { label: 'Đã hủy',      bg: '#FEE2E2', color: '#B91C1C', border: '#FECACA' },
  completed: { label: 'Hoàn thành',  bg: '#DBEAFE', color: '#1D4ED8', border: '#BFDBFE' },
  // Time slot status
  available: { label: 'Trống',        bg: '#DCFCE7', color: '#15803D', border: '#BBF7D0' },
  booked:    { label: 'Đã đặt',       bg: '#FEE2E2', color: '#B91C1C', border: '#FECACA' },
  blocked:   { label: 'Bị khóa',      bg: '#F1F5F9', color: '#475569', border: '#E2E8F0' },
  // Payment status
  paid:      { label: 'Đã thanh toán', bg: '#DCFCE7', color: '#15803D', border: '#BBF7D0' },
  unpaid:    { label: 'Chưa thanh toán', bg: '#FEF3C7', color: '#B45309', border: '#FDE68A' },
  partial:   { label: 'Thanh toán 1 phần', bg: '#E0E7FF', color: '#4338CA', border: '#C7D2FE' },
  // User roles
  admin:     { label: 'Admin',         bg: '#F3E8FF', color: '#6B21A8', border: '#E9D5FF' },
  staff:     { label: 'Nhân viên',     bg: '#EFF6FF', color: '#1E40AF', border: '#DBEAFE' },
};

export default function Badge({
  status,
  label,
  dot = true,
  className = '',
  style,
}) {
  const preset = STATUS_PRESETS[status] ?? {
    label: status ?? 'Unknown',
    bg: '#F1F5F9',
    color: '#475569',
    border: '#CBD5E1',
  };

  const displayLabel = label ?? preset.label;

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: '0.72rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        letterSpacing: '0.01em',
        background: preset.bg,
        color: preset.color,
        border: `1px solid ${preset.border}`,
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            flexShrink: 0,
            background: preset.color,
          }}
        />
      )}
      {displayLabel}
    </span>
  );
}

// Export presets cho phép dùng bên ngoài
export { STATUS_PRESETS };
