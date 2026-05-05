import React from 'react';

interface BadgeProps {
  label: string;
  color?: string;
  bg?: string;
}

const STATUS_MAP: Record<string, { bg: string; color: string }> = {
  // User
  ACTIVE:           { bg: '#D1FAE5', color: '#065F46' },
  SUSPENDED:        { bg: '#FEE2E2', color: '#B91C1C' },
  DELETED:          { bg: '#E5E7EB', color: '#6B7280' },
  // Listing
  DRAFT:            { bg: '#FEF3C7', color: '#92400E' },
  SOLD:             { bg: '#DBEAFE', color: '#1E40AF' },
  REMOVED:          { bg: '#FEE2E2', color: '#B91C1C' },
  // Order
  PENDING_PAYMENT:  { bg: '#FEF3C7', color: '#92400E' },
  PAID:             { bg: '#D1FAE5', color: '#065F46' },
  SHIPPED:          { bg: '#DBEAFE', color: '#1E40AF' },
  DELIVERED:        { bg: '#EDE9FE', color: '#5B21B6' },
  COMPLETED:        { bg: '#D1FAE5', color: '#065F46' },
  CANCELLED:        { bg: '#FEE2E2', color: '#B91C1C' },
  // Report reason
  SPAM:             { bg: '#FEF3C7', color: '#92400E' },
  OFFENSIVE:        { bg: '#FEE2E2', color: '#B91C1C' },
  MISINFORMATION:   { bg: '#FEF3C7', color: '#92400E' },
};

export function Badge({ label, color, bg }: BadgeProps) {
  const preset = STATUS_MAP[label] ?? { bg: bg ?? '#E5E7EB', color: color ?? '#374151' };

  return (
    <span
      style={{
        display:       'inline-block',
        padding:       '2px 10px',
        borderRadius:  '999px',
        fontSize:      '11px',
        fontWeight:    600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        background:    preset.bg,
        color:         preset.color,
        whiteSpace:    'nowrap',
      }}
    >
      {label.replace(/_/g, ' ')}
    </span>
  );
}
