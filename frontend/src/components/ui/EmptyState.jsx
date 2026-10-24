import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';

/**
 * Rich EmptyState matching Enterprise Light Theme
 * @param {ReactNode} icon - Icon component or element
 * @param {string} title
 * @param {string} description
 * @param {{label: string, onClick: function, icon?: ReactNode, variant?: string}} action
 */
export default function EmptyState({
  icon,
  title = 'Không có dữ liệu',
  description,
  action,
  className = '',
  style = {},
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-6 text-center gap-3.5 ${className}`}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        ...style
      }}
    >
      <div 
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '16px',
          backgroundColor: '#F1F5F9',
          border: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748B',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}
      >
        {icon ? (
          React.isValidElement(icon)
            ? icon
            : React.createElement(icon, { size: 28 })
        ) : (
          <Inbox size={28} />
        )}
      </div>

      <div className="flex flex-col gap-1 max-w-sm">
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
          {title}
        </h3>
        {description && (
          <p style={{ fontSize: '0.875rem', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
            {description}
          </p>
        )}
      </div>

      {action && (
        <div style={{ marginTop: '0.5rem' }}>
          <Button
            variant={action.variant || 'primary'}
            size="sm"
            icon={action.icon}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
