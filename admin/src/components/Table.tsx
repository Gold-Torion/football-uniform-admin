import React, { useState } from 'react';

export interface Column<T> {
  key:       string;
  header:    string;
  render:    (row: T) => React.ReactNode;
  mobileHide?: boolean;
}

interface TableProps<T> {
  columns:  Column<T>[];
  rows:     T[];
  rowKey:   (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyText?: string;
}

const isMobile = () => window.innerWidth < 768;

export function Table<T>({ columns, rows, rowKey, onRowClick, emptyText }: TableProps<T>) {
  const [hovered, setHovered] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <div
        style={{
          background:   '#FFFFFF',
          borderRadius: '12px',
          border:       '1px solid #E5DCC4',
          padding:      '48px 24px',
          textAlign:    'center',
          color:        '#9C9486',
          fontSize:     '14px',
        }}
      >
        {emptyText ?? 'Nenhum registro encontrado.'}
      </div>
    );
  }

  // Mobile: card view
  if (isMobile()) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {rows.map(row => {
          const key = rowKey(row);
          return (
            <div
              key={key}
              onClick={() => onRowClick?.(row)}
              style={{
                background:   '#FFFFFF',
                borderRadius: '12px',
                border:       '1px solid #E5DCC4',
                padding:      '14px 16px',
                cursor:       onRowClick ? 'pointer' : 'default',
              }}
            >
              {columns.map(col => (
                <div
                  key={col.key}
                  style={{
                    display:      'flex',
                    justifyContent: 'space-between',
                    alignItems:   'center',
                    padding:      '4px 0',
                    borderBottom: '1px solid #F4EFE3',
                    gap:          '8px',
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#9C9486', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>
                    {col.header}
                  </span>
                  <span style={{ fontSize: '13px', color: '#1C1A14', textAlign: 'right' }}>
                    {col.render(row)}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  }

  // Desktop: table view
  return (
    <div
      style={{
        background:   '#FFFFFF',
        borderRadius: '12px',
        border:       '1px solid #E5DCC4',
        overflow:     'hidden',
        boxShadow:    '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#F4EFE3' }}>
            {columns.map(col => (
              <th
                key={col.key}
                style={{
                  padding:       '11px 16px',
                  textAlign:     'left',
                  fontSize:      '11px',
                  fontWeight:    700,
                  color:         '#9C9486',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  whiteSpace:    'nowrap',
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const key = rowKey(row);
            return (
              <tr
                key={key}
                onClick={() => onRowClick?.(row)}
                onMouseEnter={() => setHovered(key)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background:  hovered === key ? '#F4EFE3' : '#FFFFFF',
                  cursor:      onRowClick ? 'pointer' : 'default',
                  borderTop:   '1px solid #F4EFE3',
                  transition:  'background 0.12s',
                }}
              >
                {columns.map(col => (
                  <td
                    key={col.key}
                    style={{
                      padding:  '12px 16px',
                      fontSize: '13px',
                      color:    '#1C1A14',
                    }}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
