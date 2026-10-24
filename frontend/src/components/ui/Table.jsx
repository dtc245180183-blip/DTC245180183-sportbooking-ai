import Skeleton from './Skeleton';

/**
 * Table component chuẩn với loading state và empty state
 *
 * @param {{key: string, label: string, render?: (value, row) => ReactNode, width?: string, align?: 'left'|'center'|'right'}[]} columns
 * @param {object[]} data
 * @param {boolean} loading
 * @param {string} emptyText
 * @param {string} className
 */
export default function Table({
  columns = [],
  data = [],
  loading = false,
  emptyText = 'Không có dữ liệu',
  className = '',
}) {
  return (
    <div className={`overflow-hidden ${className}`} style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.875rem' }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: col.padding || '12px 16px',
                  textAlign: col.align ?? 'left',
                  width: col.width,
                  minWidth: col.minWidth || (col.width ? undefined : 72),
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#475569',
                  borderBottom: '1px solid #E2E8F0',
                  background: '#F8FAFC',
                  whiteSpace: 'nowrap',
                  ...(col.style || {}),
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            /* Skeleton rows */
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding: col.padding || '12px 16px',
                      borderBottom: '1px solid #F1F5F9',
                    }}
                  >
                    <Skeleton height="1rem" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: '3rem 1rem',
                  textAlign: 'center',
                  color: '#64748B',
                  fontSize: '0.875rem',
                }}
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={row.id ?? rowIdx}
                style={{
                  borderBottom: '1px solid #F1F5F9',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding: col.padding || '12px 16px',
                      color: '#0F172A',
                      verticalAlign: 'middle',
                      textAlign: col.align ?? 'left',
                      width: col.width,
                      minWidth: col.minWidth,
                      borderBottom: '1px solid #F1F5F9',
                      ...(col.style || {}),
                    }}
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
