import React from 'react';
import { ConnectionBadge } from './ConnectionBadge.jsx';
import { BatteryGauge } from './BatteryGauge.jsx';

/**
 * LK ROBOTICS — RobotStatusCard
 * Live robot status card — thumbnail (or initials) + name on the left, and a
 * top-right status cluster: the operating-mode chip over a telemetry row
 * (ConnectionBadge signal bars + BatteryGauge). `selected` for the picked robot.
 *
 * When `onClick` is supplied the whole card becomes a keyboard-operable button
 * (role=button, Tab-reachable, Enter/Space activate) named by the robot's name,
 * and `selected` is exposed to assistive tech as `aria-pressed`. Without
 * `onClick` it is a pure presentation card and carries no widget semantics.
 * The nested ConnectionBadge / BatteryGauge are non-focusable visual readouts;
 * their labels reach the button through `aria-describedby`.
 */
export function RobotStatusCard({ name, image, status = 'online', battery, mode, selected = false, onClick, style, ...rest }) {
  const hasBat = typeof battery === 'number';
  const interactive = typeof onClick === 'function';
  // Stable ids so an interactive card is *named* by the robot name and
  // *described* by its status cluster. Naming a button from its own content
  // would fold the mode chip + signal + battery into one noisy name; making it
  // a button without a description would instead hide that telemetry (a button
  // is a leaf for AT). labelledby + describedby keeps the name clean and the
  // status readable — and carries mode/connection/battery on a channel that is
  // not colour alone (1.4.1).
  const reactId = React.useId();
  const nameId = `${reactId}-name`;
  const statusId = `${reactId}-status`;
  // A single-select picker state is a toggle-in-a-set → aria-pressed. Radio
  // semantics would need this card to own a radiogroup, but each card is
  // rendered independently by the consumer, which owns any group/list wrapper.
  const interactiveProps = interactive
    ? {
        role: 'button',
        tabIndex: 0,
        'aria-pressed': selected,
        'aria-labelledby': nameId,
        'aria-describedby': statusId,
        onKeyDown: (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick(event);
          }
        },
      }
    : {};
  return (
    <div onClick={onClick} {...interactiveProps} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: 16, width: '100%', boxSizing: 'border-box',
      background: 'var(--color-semantic-background-elevated-normal)', border: selected ? 'var(--border-thin) solid var(--color-semantic-primary-normal)' : 'var(--component-card-border)',
      borderRadius: 'var(--component-card-radius)', boxShadow: selected ? '0 0 0 3px var(--color-semantic-focus-ring)' : 'var(--component-card-shadow-sm)',
      cursor: onClick ? 'pointer' : 'default', fontFamily: 'var(--font-sans)', ...style }} {...rest}>
      <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', flexShrink: 0, overflow: 'hidden',
        background: 'var(--color-semantic-fill-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {image ? <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span aria-hidden="true" style={{ fontSize: 'var(--headline2-size)', fontWeight: 'var(--fw-extra)', color: 'var(--color-semantic-label-neutral)' }}>{String(name || '?').slice(0, 2)}</span>}
      </div>
      <span id={interactive ? nameId : undefined} style={{ flex: 1, minWidth: 0, fontSize: 'var(--body1-size)', fontWeight: 'var(--fw-bold)', color: 'var(--color-semantic-label-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
      <div id={interactive ? statusId : undefined} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7, flexShrink: 0 }}>
        {mode != null && <span style={{ fontSize: 'var(--caption2-size)', fontWeight: 'var(--fw-bold)', letterSpacing: 0, padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: 'var(--color-semantic-primary-surface-normal)', color: 'var(--color-semantic-label-normal)', whiteSpace: 'nowrap' }}>{mode}</span>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ConnectionBadge status={status} showLabel={false} size="sm" />
          {hasBat && <BatteryGauge value={battery} />}
        </div>
      </div>
    </div>
  );
}
