import React from 'react';
import { Card } from '@lk-design-system/lds-core/components/cards/Card';
import { StatusBadge } from '@lk-design-system/lds-core/components/content/StatusBadge';
import { VisuallyHidden } from '@lk-design-system/lds-core/components/layout/VisuallyHidden';
import { BatteryGauge } from '@lk-design-system/lds-product/components/robotics/BatteryGauge';
import { ConnectionBadge } from '@lk-design-system/lds-product/components/robotics/ConnectionBadge';
import { RobotStatusCell } from './_RobotStatusCell.jsx';

function statusTone(tone) {
  if (tone === 'accent' || tone === 'navy') return 'signal';
  return tone;
}

/**
 * LK ROBOTICS — RobotStatusCard
 * Live robot status card — thumbnail (or initials) + name on the left,
 * connection and battery telemetry below the name, and the operating-mode chip
 * on the right. `selected` marks the picked robot.
 *
 * `badges` replaces the single `mode` chip when a row must show more than one
 * independent state — a safety stop stays visible next to an attention state
 * instead of being ranked away. Composers own the ordering and the cap.
 *
 * When `onClick` is supplied the whole card becomes a keyboard-operable button
 * (role=button, Tab-reachable, Enter/Space activate) named by the robot's name,
 * and `selected` is exposed to assistive tech as `aria-pressed`. Without
 * `onClick` it is a pure presentation card and carries no widget semantics.
 * The nested ConnectionBadge / BatteryGauge are non-focusable visual readouts;
 * their labels reach the button through `aria-describedby`.
 */
export function RobotStatusCard({
  name,
  image,
  status = 'online',
  connectionState,
  battery,
  mode,
  modeTone = 'accent',
  badges,
  meta,
  showAvatar = true,
  density = 'comfortable',
  accessibleDescription,
  selected = false,
  disabled = false,
  interaction,
  onClick,
  style,
  ...rest
}) {
  const hasBat = typeof battery === 'number';
  const singleLine = density === 'single-line';
  const compact = density === 'compact';
  const badgeList = Array.isArray(badges) && badges.length > 0
    ? badges
    : (mode != null ? [{ key: 'mode', label: mode, tone: modeTone }] : []);
  const telemetry = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: singleLine ? 'var(--space-2)' : 'var(--space-3)',
        minWidth: 0,
        /* Stacked densities let the telemetry row wrap instead of refusing to
           shrink: in a ~200px column the old nowrap/no-shrink row starved the
           robot name down to one glyph and then pushed the battery readout
           through the card border. Identity survives first; telemetry drops
           to its own line. Single-line keeps one row — that density's context
           is a wide list row, and wrapping would break its contract. */
        flexShrink: singleLine ? 0 : undefined,
        flexWrap: singleLine ? undefined : 'wrap',
        whiteSpace: 'nowrap',
      }}
    >
      <ConnectionBadge
        {...(connectionState == null ? { status } : { connectionState })}
        showLabel
        size="sm"
      />
      {hasBat && <BatteryGauge value={battery} size={singleLine ? 'sm' : 'md'} />}
      {meta}
      {accessibleDescription != null && (
        <VisuallyHidden>{accessibleDescription}</VisuallyHidden>
      )}
    </div>
  );

  return (
    <Card
      elevation="sm"
      padding={0}
      style={{
        width: '100%',
        minWidth: 0,
        overflow: 'hidden',
        ...(selected
          ? {
              background: 'var(--color-semantic-primary-surface-normal)',
              border: 'var(--border-thin) solid var(--color-semantic-primary-normal)',
            }
          : {}),
        ...style,
      }}
    >
      <RobotStatusCell
        {...rest}
        data-robot-status-card=""
        data-density={density}
        data-selected={selected ? 'true' : 'false'}
        name={name}
        image={image}
        showAvatar={showAvatar}
        density={density}
        leadingStyle={{
          borderRadius: 'var(--radius-md)',
        }}
        description={telemetry}
        trailing={badgeList.length === 0 ? undefined : badgeList.length === 1 ? (
          <StatusBadge tone={statusTone(badgeList[0].tone ?? 'accent')}>
            {badgeList[0].label}
          </StatusBadge>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 'var(--space-1)',
              minWidth: 0,
            }}
          >
            {badgeList.map((badge, index) => (
              <StatusBadge key={badge.key ?? index} tone={statusTone(badge.tone ?? 'accent')}>
                {badge.label}
              </StatusBadge>
            ))}
          </div>
        )}
        selected={selected}
        disabled={disabled}
        interaction={interaction}
        contentStyle={singleLine ? {
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
        } : undefined}
        titleStyle={{
          color: 'var(--color-semantic-label-strong)',
          fontWeight: 'var(--fw-bold)',
          ...(singleLine ? {
            flex: '1 1 auto',
            minWidth: 0,
          } : {}),
        }}
        descriptionStyle={{
          overflow: 'visible',
          ...(singleLine ? {
            marginTop: 0,
            flexShrink: 0,
          } : {}),
        }}
        trailingStyle={{ alignSelf: singleLine || compact ? 'center' : 'flex-start' }}
        onClick={onClick}
        style={{
          borderRadius: 'var(--component-card-radius)',
          background: 'transparent',
        }}
      />
    </Card>
  );
}
