import React from 'react';
import { RobotStatusCard } from './RobotStatusCard.jsx';

const ATTENTION = {
  none: { label: '조치 없음', tone: 'neutral' },
  info: { label: '확인 필요', tone: 'signal' },
  warning: { label: '주의 필요', tone: 'cautionary' },
  critical: { label: '긴급 조치', tone: 'negative' },
};

const OPERABILITY = {
  available: { label: '작업 가능', tone: 'neutral' },
  busy: { label: '작업 중', tone: 'neutral' },
  blocked: { label: '차단됨', tone: 'cautionary' },
  unavailable: { label: '운영 불가', tone: 'negative' },
  unknown: { label: '가용성 미확인', tone: 'neutral' },
};

const MISSION = {
  idle: { label: '임무 없음', tone: 'neutral' },
  queued: { label: '임무 대기', tone: 'neutral' },
  assigned: { label: '임무 할당', tone: 'neutral' },
  executing: { label: '임무 수행 중', tone: 'neutral' },
  paused: { label: '임무 일시정지', tone: 'cautionary' },
  completed: { label: '임무 완료', tone: 'neutral' },
  failed: { label: '임무 실패', tone: 'negative' },
  cancelled: { label: '임무 취소', tone: 'neutral' },
  unknown: { label: '임무 상태 미확인', tone: 'neutral' },
};

const SAFETY = {
  normal: { label: '안전 상태 정상', tone: 'neutral' },
  'protective-stop': { label: '보호 정지', tone: 'cautionary' },
  'software-stop-requested': { label: '주행 정지 요청', tone: 'cautionary' },
  'e-stopped': { label: '비상정지', tone: 'negative' },
  unknown: { label: '안전 상태 미확인', tone: 'neutral' },
};

const FRESHNESS = {
  current: { label: '최신 데이터', tone: 'neutral' },
  delayed: { label: '데이터 지연', tone: 'cautionary' },
  stale: { label: '오래된 데이터', tone: 'cautionary' },
  unknown: { label: '갱신 시각 미확인', tone: 'neutral' },
};

const CONTROL = {
  autonomous: '자율',
  supervised: '감독',
  manual: '수동',
  teleoperated: '원격제어',
  unavailable: '제어 불가',
  unknown: '제어 모드 미확인',
};

const AUTHORITY = {
  unclaimed: '제어권 없음',
  requested: '제어권 요청 중',
  owned: '제어권 보유',
  denied: '제어권 거부',
  revoked: '제어권 회수',
  unknown: '제어권 미확인',
};

function stateConfig(table, value) {
  return table[value] ?? table.unknown;
}

function visibleStatusBadges({
  state,
  attention,
  operability,
  mission,
  safety,
}) {
  const badges = [];

  if (state.attention && state.attention !== 'none') {
    badges.push({ key: 'attention', ...attention });
  }

  if (state.safety && state.safety !== 'normal') {
    badges.push({ key: 'safety', ...safety });
  } else if (
    state.operability === 'blocked'
    || state.operability === 'unavailable'
    || state.operability === 'unknown'
  ) {
    badges.push({ key: 'operability', ...operability });
  } else if (!state.attention || state.attention === 'none') {
    badges.push({ key: 'mission', ...mission });
  }

  return badges.slice(0, 2);
}

/**
 * Dense, controlled fleet row.
 *
 * The row keeps every operational axis in data and accessible descriptions,
 * while the visible RobotStatusCard anatomy shows identity, connection,
 * battery, and up to two independent states. Attention and safety are ranked
 * separately rather than collapsed, so a protective or emergency stop stays
 * visible next to an attention state. It does not derive source truth or
 * contain nested actions.
 */
export function FleetRobotRow({
  robot,
  selected = false,
  highlighted = false,
  disabled = false,
  updatedAtLabel,
  detail,
  trailing,
  onActivate,
  onHighlightChange,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  style,
  ...rest
}) {
  const state = robot?.state ?? {};
  const connection = state.connection ?? 'unknown';
  const attention = stateConfig(ATTENTION, state.attention);
  const operability = stateConfig(OPERABILITY, state.operability);
  const mission = stateConfig(MISSION, state.mission);
  const safety = stateConfig(SAFETY, state.safety);
  const freshness = stateConfig(FRESHNESS, state.freshness);
  const control = CONTROL[state.control] ?? CONTROL.unknown;
  const authority = AUTHORITY[state.authority] ?? AUTHORITY.unknown;
  const visibleBadges = visibleStatusBadges({
    state,
    attention,
    operability,
    mission,
    safety,
  });
  const rowBadges = visibleBadges.length > 0 ? visibleBadges : [{ key: 'mission', ...mission }];
  const interactive = typeof onActivate === 'function' || typeof onClick === 'function';
  // Badges carry the state axes; `meta` carries the measurements that used to
  // reach screen readers only. Stale telemetry is a live data-quality problem
  // and stays coloured; an incident count is a historical fact and stays muted,
  // because the attention badge already ranks its severity.
  const showFreshness = updatedAtLabel != null && state.freshness !== 'current';
  const rowMeta = showFreshness || detail != null || trailing != null ? (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        minWidth: 0,
        fontSize: 'var(--caption1-size)',
        lineHeight: 'var(--caption1-line)',
      }}
    >
      {showFreshness && (
        <span style={{ color: 'var(--color-semantic-status-cautionary-foreground)' }}>
          {updatedAtLabel}
        </span>
      )}
      {detail != null && (
        <span style={{ color: 'var(--color-semantic-label-alternative)' }}>{detail}</span>
      )}
      {trailing}
    </span>
  ) : undefined;

  const activate = (event) => {
    onClick?.(event);
    if (!event.defaultPrevented) onActivate?.(robot.id, event);
  };

  const notifyHighlight = (next) => {
    onHighlightChange?.(next ? robot.id : null);
  };

  return (
    <RobotStatusCard
      {...rest}
      data-fleet-robot-row=""
      data-robot-id={robot.id}
      data-attention={state.attention ?? 'none'}
      data-connection={connection}
      data-freshness={state.freshness ?? 'unknown'}
      data-operability={state.operability ?? 'unknown'}
      data-mission={state.mission ?? 'unknown'}
      data-safety={state.safety ?? 'unknown'}
      data-control={state.control ?? 'unknown'}
      data-authority={state.authority ?? 'unknown'}
      data-highlighted={highlighted ? 'true' : 'false'}
      name={robot.name}
      image={robot.image}
      connectionState={connection}
      battery={Number.isFinite(state.batteryPercent) ? state.batteryPercent : undefined}
      badges={rowBadges}
      meta={rowMeta}
      // A fleet row is identified by its name. An initials avatar would repeat
      // the first letter sitting next to it — "AMR-07", "AMR-12" and "AMR-21"
      // all reduce to "A" — while spending the widest slot in the row and
      // pulling a fourth adjacent type step (15px) into a two-step row.
      showAvatar={false}
      density="compact"
      accessibleDescription={
        `${mission.label}, ${operability.label}, ${safety.label}, ${control}, ${authority}, ${freshness.label}`
      }
      selected={selected}
      disabled={disabled}
      interaction={highlighted ? 'hovered' : undefined}
      onClick={interactive ? activate : undefined}
      onMouseEnter={(event) => {
        notifyHighlight(true);
        onMouseEnter?.(event);
      }}
      onMouseLeave={(event) => {
        if (event.currentTarget.ownerDocument.activeElement !== event.currentTarget) {
          notifyHighlight(false);
        }
        onMouseLeave?.(event);
      }}
      onFocus={(event) => {
        notifyHighlight(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) notifyHighlight(false);
        onBlur?.(event);
      }}
      style={{
        minWidth: 0,
        overflow: 'hidden',
        ...(highlighted && !selected
          ? { border: 'var(--border-thin) solid var(--color-semantic-label-neutral)' }
          : {}),
        ...style,
      }}
    />
  );
}
