import React from 'react';
import { ListCell } from '@lk-design-system/lds-core/components/content/ListCell';
import { Avatar } from '@lk-design-system/lds-core/components/feedback/Avatar';

const DENSITY = {
  comfortable: {
    avatarSize: 'large',
    avatarBoxSize: 48,
    verticalPadding: 'large',
    paddingX: 16,
    gap: 'var(--space-4)',
  },
  compact: {
    avatarSize: 'medium',
    avatarBoxSize: 40,
    // Two text lines (46px) set the floor here, not the badge stack (44px), so
    // the padding is the only place left to reclaim scanning density.
    verticalPadding: 'custom',
    paddingY: 5,
    paddingX: 12,
    leadingMarginRight: 'var(--space-1)',
  },
  'single-line': {
    avatarSize: 'small',
    avatarBoxSize: 32,
    verticalPadding: 'none',
    paddingX: 12,
    gap: 'var(--space-2)',
  },
};

/**
 * Shared robot identity and status cell.
 *
 * This internal primitive owns the common avatar, name, density, selection,
 * and accessible button contract beneath RobotStatusCard, including the
 * compact RobotStatusCard composition used by FleetRobotRow. Public
 * components remain responsible for their own telemetry and fleet semantics.
 */
export function RobotStatusCell({
  name,
  image,
  avatarStatus,
  avatarStatusLabel = false,
  showAvatar = true,
  density = 'comfortable',
  description,
  trailing,
  selected = false,
  disabled = false,
  interaction,
  onClick,
  leadingStyle,
  contentStyle,
  titleStyle,
  descriptionStyle,
  trailingStyle,
  verticalPadding,
  paddingY,
  paddingX,
  style,
  role,
  tabIndex,
  'aria-pressed': ariaPressed,
  'aria-labelledby': ariaLabelledby,
  'aria-describedby': ariaDescribedby,
  ...rest
}) {
  const reactId = React.useId();
  const nameId = `${reactId}-name`;
  const descriptionId = `${reactId}-description`;
  const resolvedDensity = DENSITY[density] ?? DENSITY.comfortable;
  const interactive = typeof onClick === 'function';
  const resolvedDescriptionId = React.isValidElement(description) && description.props.id
    ? description.props.id
    : descriptionId;
  const describedContent = description == null
    ? undefined
    : React.isValidElement(description) && description.type !== React.Fragment
      ? React.cloneElement(description, {
          id: description.props.id ?? resolvedDescriptionId,
        })
      : <span id={resolvedDescriptionId}>{description}</span>;
  const densityStyle = resolvedDensity.gap == null
    ? undefined
    : { gap: resolvedDensity.gap };

  return (
    <ListCell
      {...rest}
      data-robot-status-cell=""
      leading={showAvatar ? (
        <Avatar
          aria-hidden="true"
          src={image}
          name={name}
          variant="company"
          size={resolvedDensity.avatarSize}
          status={avatarStatus}
          statusLabel={avatarStatus == null ? undefined : avatarStatusLabel}
        />
      ) : undefined}
      leadingStyle={showAvatar ? {
        width: resolvedDensity.avatarBoxSize,
        height: resolvedDensity.avatarBoxSize,
        padding: 0,
        background: 'transparent',
        ...(resolvedDensity.leadingMarginRight == null
          ? {}
          : { marginRight: resolvedDensity.leadingMarginRight }),
        ...leadingStyle,
      } : undefined}
      title={name == null ? undefined : (
        <span
          id={nameId}
          style={{
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </span>
      )}
      description={describedContent}
      trailing={trailing}
      selected={selected}
      disabled={disabled}
      interaction={interaction}
      contentStyle={contentStyle}
      titleStyle={titleStyle}
      descriptionStyle={descriptionStyle}
      trailingStyle={trailingStyle}
      verticalPadding={verticalPadding ?? resolvedDensity.verticalPadding}
      paddingY={paddingY ?? resolvedDensity.paddingY}
      paddingX={paddingX ?? resolvedDensity.paddingX}
      onClick={interactive ? onClick : undefined}
      role={role ?? (interactive ? 'button' : undefined)}
      tabIndex={tabIndex ?? (interactive && disabled ? -1 : undefined)}
      aria-pressed={ariaPressed ?? (interactive ? selected : undefined)}
      aria-labelledby={ariaLabelledby ?? (interactive && name != null ? nameId : undefined)}
      aria-describedby={ariaDescribedby ?? (
        interactive && description != null ? resolvedDescriptionId : undefined
      )}
      style={{
        minWidth: 0,
        ...densityStyle,
        ...style,
      }}
    />
  );
}
