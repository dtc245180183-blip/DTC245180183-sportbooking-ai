import Modal from './Modal';
import Button from './Button';
import { AlertTriangle, HelpCircle } from 'lucide-react';

/**
 * ConfirmModal — Modal xác nhận chuẩn giao diện thống nhất
 */
export default function ConfirmModal({
  open,
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác nhận thao tác',
  message,
  children,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  variant,
  confirmVariant = 'primary',
  loading,
  isLoading = false,
  icon,
}) {
  const isModalOpen = open !== undefined ? open : Boolean(isOpen);
  const isModalLoading = loading !== undefined ? loading : Boolean(isLoading);
  const actualVariant = variant || confirmVariant;

  const IconComp = icon || (actualVariant === 'danger' ? AlertTriangle : HelpCircle);
  const iconColor = actualVariant === 'danger' ? '#DC2626' : actualVariant === 'warning' ? '#D97706' : '#2563EB';
  const iconBg = actualVariant === 'danger' ? '#FEE2E2' : actualVariant === 'warning' ? '#FEF3C7' : '#DBEAFE';

  return (
    <Modal
      open={isModalOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isModalLoading}>
            {cancelText}
          </Button>
          <Button
            variant={actualVariant === 'danger' ? 'danger' : 'primary'}
            loading={isModalLoading}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '0.5rem 0' }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: iconBg,
          color: iconColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <IconComp size={20} />
        </div>
        <div style={{ flex: 1, fontSize: '0.9rem', color: '#334155', lineHeight: 1.6 }}>
          {message || children}
        </div>
      </div>
    </Modal>
  );
}
