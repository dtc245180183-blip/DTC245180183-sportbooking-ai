import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';

/**
 * EmptyState — hiển thị khi danh sách rỗng
 * @param {ReactNode} icon  — icon component (mặc định: Inbox)
 * @param {string} title
 * @param {string} description
 * @param {{label: string, onClick: function, icon?: ReactNode}} action
 */
export default function EmptyState({
  icon,
  title = 'Không có dữ liệu',
  description,
  action,
  className = '',
}) {

  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-6 text-center gap-4 ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-[rgba(100,160,255,0.08)] border border-[rgba(100,160,255,0.12)] flex items-center justify-center text-[#64748B]">
        {icon ? (
          React.isValidElement(icon)
            ? icon                      /* đã là <Element /> — render trực tiếp */
            : React.createElement(icon, { size: 28 })  /* là component (kể cả forwardRef) */
        ) : (
          <Inbox size={28} />
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-base font-semibold text-[#94A3B8]">{title}</p>
        {description && (
          <p className="text-sm text-[#64748B] max-w-xs">{description}</p>
        )}
      </div>

      {action && (
        <Button
          variant="secondary"
          size="sm"
          icon={action.icon}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
