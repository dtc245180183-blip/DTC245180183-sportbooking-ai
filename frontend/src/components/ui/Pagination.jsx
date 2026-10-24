import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  className = '',
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  if (totalItems === 0) return null;

  return (
    <div 
      className={`flex flex-wrap items-center justify-between gap-3 pt-3 pb-1 text-sm text-slate-600 ${className}`}
      style={{
        borderTop: '1px solid #F1F5F9',
        fontSize: '0.85rem'
      }}
    >
      {/* Left: Summary */}
      <div className="flex items-center gap-2">
        <span>Hiển thị <strong style={{ color: '#0F172A' }}>{startItem} - {endItem}</strong> trong tổng số <strong style={{ color: '#0F172A' }}>{totalItems}</strong></span>
        
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-2">
            <span style={{ fontSize: '0.78rem', color: '#64748B' }}>/ trang:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              style={{
                padding: '2px 6px',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
                fontSize: '0.8rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page controls */}
      <div className="flex items-center gap-1">
        {/* First page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          title="Trang đầu"
          style={{
            padding: '5px',
            borderRadius: '6px',
            border: '1px solid #E2E8F0',
            backgroundColor: currentPage <= 1 ? '#F8FAFC' : '#FFFFFF',
            color: currentPage <= 1 ? '#94A3B8' : '#334155',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease'
          }}
        >
          <ChevronsLeft size={15} />
        </button>

        {/* Previous page */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          title="Trang trước"
          style={{
            padding: '5px 8px',
            borderRadius: '6px',
            border: '1px solid #E2E8F0',
            backgroundColor: currentPage <= 1 ? '#F8FAFC' : '#FFFFFF',
            color: currentPage <= 1 ? '#94A3B8' : '#334155',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            fontSize: '0.8rem',
            fontWeight: 500,
            transition: 'all 0.15s ease'
          }}
        >
          <ChevronLeft size={15} />
          <span className="hidden sm:inline">Trước</span>
        </button>

        {/* Current page badge */}
        <span 
          style={{
            padding: '4px 10px',
            borderRadius: '6px',
            backgroundColor: '#ECFDF5',
            color: '#059669',
            border: '1px solid #A7F3D0',
            fontWeight: 700,
            fontSize: '0.8rem',
            margin: '0 2px'
          }}
        >
          {currentPage} / {totalPages}
        </span>

        {/* Next page */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          title="Trang sau"
          style={{
            padding: '5px 8px',
            borderRadius: '6px',
            border: '1px solid #E2E8F0',
            backgroundColor: currentPage >= totalPages ? '#F8FAFC' : '#FFFFFF',
            color: currentPage >= totalPages ? '#94A3B8' : '#334155',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            fontSize: '0.8rem',
            fontWeight: 500,
            transition: 'all 0.15s ease'
          }}
        >
          <span className="hidden sm:inline">Sau</span>
          <ChevronRight size={15} />
        </button>

        {/* Last page */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          title="Trang cuối"
          style={{
            padding: '5px',
            borderRadius: '6px',
            border: '1px solid #E2E8F0',
            backgroundColor: currentPage >= totalPages ? '#F8FAFC' : '#FFFFFF',
            color: currentPage >= totalPages ? '#94A3B8' : '#334155',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease'
          }}
        >
          <ChevronsRight size={15} />
        </button>
      </div>
    </div>
  );
}
