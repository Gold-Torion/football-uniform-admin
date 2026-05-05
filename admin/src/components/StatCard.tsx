import React from 'react';

interface StatCardProps {
  icon: string;
  value: number | string;
  label: string;
  trend?: { value: string; up: boolean };
  alert?: boolean;
}

export function StatCard({ icon, value, label, trend, alert }: StatCardProps) {
  return (
    <div
      style={{
        background:   '#FFFFFF',
        borderRadius: '12px',
        border:       alert ? '2px solid #B91C1C' : '1px solid #E5DCC4',
        padding:      '20px 24px',
        display:      'flex',
        flexDirection: 'column',
        gap:          '6px',
        position:     'relative',
        boxShadow:    '0 1px 4px rgba(0,0,0,0.05)',
        transition:   'box-shadow 0.2s',
      }}
    >
      {alert && (
        <span
          style={{
            position:     'absolute',
            top:          '-8px',
            right:        '-8px',
            background:   '#B91C1C',
            color:        '#fff',
            borderRadius: '999px',
            fontSize:     '11px',
            fontWeight:   700,
            padding:      '2px 8px',
            boxShadow:    '0 2px 6px rgba(185,28,28,0.4)',
          }}
        >
          !
        </span>
      )}
      <span style={{ fontSize: '32px', lineHeight: 1 }}>{icon}</span>
      <span style={{ fontSize: '32px', fontWeight: 700, color: '#D4AF37', lineHeight: 1.1 }}>
        {value}
      </span>
      <span style={{ fontSize: '13px', color: '#9C9486', fontWeight: 500 }}>{label}</span>
      {trend && (
        <span
          style={{
            fontSize:   '12px',
            fontWeight: 600,
            color:      trend.up ? '#065F46' : '#B91C1C',
            marginTop:  '2px',
          }}
        >
          {trend.up ? '▲' : '▼'} {trend.value}
        </span>
      )}
    </div>
  );
}
