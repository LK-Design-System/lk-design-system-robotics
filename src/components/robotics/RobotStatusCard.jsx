import React from 'react';
import { Card } from '@lk-robotics/lds-core/components/cards/Card';
import { ContentBadge } from '@lk-robotics/lds-core/components/content/ContentBadge';
import { ListCell } from '@lk-robotics/lds-core/components/content/ListCell';
import { Avatar } from '@lk-robotics/lds-core/components/feedback/Avatar';
import { BatteryGauge } from '@lk-robotics/lds-product/components/robotics/BatteryGauge';
import { ConnectionBadge } from '@lk-robotics/lds-product/components/robotics/ConnectionBadge';

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
  const statusCluster = (
    <div
      id={interactive ? statusId : undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 'var(--space-1-5)',
        flexShrink: 0,
      }}
    >
      {mode != null && <ContentBadge color="accent" size="xsmall">{mode}</ContentBadge>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <ConnectionBadge status={status} showLabel={false} size="sm" />
        {hasBat && <BatteryGauge value={battery} />}
      </div>
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
      <ListCell
        data-robot-status-card=""
        data-selected={selected ? 'true' : 'false'}
        leading={(
          <Avatar
            aria-hidden="true"
            src={image}
            name={name}
            variant="company"
            size="large"
          />
        )}
        leadingStyle={{
          width: 48,
          height: 48,
          padding: 0,
          background: 'transparent',
          borderRadius: 'var(--radius-md)',
        }}
        title={<span id={interactive ? nameId : undefined}>{name}</span>}
        titleStyle={{
          color: 'var(--color-semantic-label-strong)',
          fontWeight: 'var(--fw-bold)',
        }}
        trailing={statusCluster}
        trailingStyle={{ alignSelf: 'stretch' }}
        verticalPadding="large"
        paddingX={16}
        onClick={interactive ? onClick : undefined}
        aria-pressed={interactive ? selected : undefined}
        aria-labelledby={interactive ? nameId : undefined}
        aria-describedby={interactive ? statusId : undefined}
        style={{
          gap: 'var(--space-4)',
          borderRadius: 'var(--component-card-radius)',
          background: 'transparent',
        }}
        {...rest}
      />
    </Card>
  );
}
