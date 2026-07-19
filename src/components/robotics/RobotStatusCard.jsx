import React from 'react';
import { ConnectionBadge } from './ConnectionBadge.jsx';
import { BatteryGauge } from './BatteryGauge.jsx';

/**
 * LK ROBOTICS — RobotStatusCard
 * Live robot status card — thumbnail (or initials) + name on the left, and a
 * top-right status cluster: the operating-mode chip over a telemetry row
 * (ConnectionBadge signal bars + BatteryGauge). `selected` for the picked robot.
 */
export function RobotStatusCard({ name, image, status = 'online', battery, mode, selected = false, onClick, style, ...rest }) {
  const hasBat = typeof battery === 'number';
  return (
    <div onClick={onClick} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: 16, width: '100%', boxSizing: 'border-box',
      background: 'var(--color-semantic-background-elevated-normal)', border: selected ? 'var(--border-thin) solid var(--color-semantic-primary-normal)' : 'var(--component-card-border)',
      borderRadius: 'var(--component-card-radius)', boxShadow: selected ? '0 0 0 3px var(--color-semantic-focus-ring)' : 'var(--component-card-shadow-sm)',
      cursor: onClick ? 'pointer' : 'default', fontFamily: 'var(--font-sans)', ...style }} {...rest}>
      <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', flexShrink: 0, overflow: 'hidden',
        background: 'var(--color-semantic-fill-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {image ? <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 'var(--headline2-size)', fontWeight: 'var(--fw-extra)', color: 'var(--color-semantic-label-neutral)' }}>{String(name || '?').slice(0, 2)}</span>}
      </div>
      <span style={{ flex: 1, minWidth: 0, fontSize: 'var(--body1-size)', fontWeight: 'var(--fw-bold)', color: 'var(--color-semantic-label-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7, flexShrink: 0 }}>
        {mode != null && <span style={{ fontSize: 'var(--caption2-size)', fontWeight: 'var(--fw-bold)', letterSpacing: 0, padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: 'var(--color-semantic-primary-surface-normal)', color: 'var(--color-semantic-label-normal)', whiteSpace: 'nowrap' }}>{mode}</span>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ConnectionBadge status={status} showLabel={false} size="sm" />
          {hasBat && <BatteryGauge value={battery} />}
        </div>
      </div>
    </div>
  );
}
