import React from 'react';
import {
  isNavigationSourceCompatible,
  useNavigationCoordinateBoundary,
} from './NavigationCoordinateBoundary.jsx';
import { isFocusVisibleTarget } from './_NavigationFocus.js';
import { NavigationStateGlyph } from './_NavigationStateGlyph.js';
import { FacilityGlyph } from './_FacilityGlyph.js';
import {
  ANNOTATION_IMPORTANCE,
  NavigationAnnotationBlock,
  annotationPriority,
  useNavigationAnnotationDetailMode,
  useNavigationLabelDisclosure,
  useNavigationObstacles,
} from './_navigationAnnotations.js';
import { navStateOpacity, NAV_PIN, NAV_HIT, NAV_STATE_BADGE, NAV_LABEL_HALO, NAV_FOCUS, NAV_SELECTION } from './_navigationVocabulary.js';

const AVAILABILITY_PRESENTATION = {
  available: {
    label: '사용 가능',
    stroke: 'var(--viewer-accent, var(--color-semantic-primary-normal))',
  },
  // "Can't use right now" desaturates to muted (greyed-out convention) rather
  // than danger red — red is reserved for DATA errors (invalid). The slash
  // shape carries "unavailable"; the white knockout stays legible on the
  // muted pin.
  unavailable: {
    label: '사용 불가',
    stroke: 'var(--viewer-muted, var(--color-semantic-label-alternative))',
  },
  unknown: {
    label: '가용성 미확인',
    stroke: 'var(--viewer-muted, var(--color-semantic-label-alternative))',
  },
};

const KIND_LABELS = {
  door: '문 전이',
  lift: '승강기 전이',
  dock: '도킹 전이',
  ramp: '경사로 전이',
  charging: '충전 지점',
  gate: '보안 게이트 전이',
  handoff: '핸드오프 지점',
};

const DOOR_STATE_LABELS = {
  closed: '문 닫힘',
  moving: '문 이동 중',
  open: '문 열림',
  offline: '문 오프라인',
  unknown: '문 상태 미확인',
};

const DOOR_EVENT_LABELS = {
  open: '열기 이벤트',
  close: '닫기 이벤트',
  pass: '통과 이벤트',
};

const LIFT_PHASE_LABELS = {
  approach: '접근 중',
  waiting: '대기 중',
  boarding: '탑승 중',
  moving: '층간 이동 중',
  arrival: '도착',
  exiting: '하차 중',
};

const MOTION_LABELS = {
  stopped: '정지',
  up: '상승',
  down: '하강',
  unknown: '이동 미확인',
};

const OPERATING_MODE_LABELS = {
  human: '사람 모드',
  agv: 'AGV 모드',
  fire: '소방 모드',
  offline: '운영 오프라인',
  emergency: '비상 모드',
  unknown: '운영 모드 미확인',
};

const SESSION_LABELS = {
  none: '세션 없음',
  requested: '세션 요청됨',
  owned: '현재 fleet 세션',
  other: '다른 세션 사용 중',
  unknown: '세션 소유 미확인',
};

const DOCK_PHASE_LABELS = {
  approach: '도킹 접근 중',
  docking: '도킹 중',
  docked: '도킹 완료',
  undocking: '도킹 해제 중',
  complete: '전이 완료',
};

function safeScale(viewportScale) {
  const scale = Number(viewportScale);
  return Number.isFinite(scale) && scale > 0 ? scale : 1;
}

function midpoint(a, b) {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

function endpointForMap(transition, activeMapId) {
  const fromMatches = transition.from.mapId === activeMapId;
  const toMatches = transition.to?.mapId === activeMapId;

  if (fromMatches && toMatches) {
    return {
      position: midpoint(transition.from.position, transition.to.position),
      side: 'both',
    };
  }
  if (fromMatches) return { position: transition.from.position, side: 'from' };
  if (toMatches) return { position: transition.to.position, side: 'to' };
  return null;
}

function detailRows(transition, availabilityLabel) {
  if (transition.kind === 'lift') {
    return [
      [
        LIFT_PHASE_LABELS[transition.phase],
        DOOR_STATE_LABELS[transition.doorState],
        MOTION_LABELS[transition.motionState],
      ].filter(Boolean).join(' · '),
      [
        OPERATING_MODE_LABELS[transition.operatingMode],
        SESSION_LABELS[transition.sessionState],
        availabilityLabel,
      ].filter(Boolean).join(' · '),
    ];
  }

  if (transition.kind === 'door') {
    return [[
      DOOR_EVENT_LABELS[transition.event],
      DOOR_STATE_LABELS[transition.doorState],
      availabilityLabel,
    ].filter(Boolean).join(' · ')];
  }

  if (transition.kind === 'dock') {
    return [[DOCK_PHASE_LABELS[transition.phase], availabilityLabel].filter(Boolean).join(' · ')];
  }
  // ramp, charging: passive facility — no phase/state axes, availability only.
  return [availabilityLabel].filter(Boolean);
}

function visibleDetailRows(transition, availabilityLabel) {
  if (transition.kind === 'lift') {
    return [
      [LIFT_PHASE_LABELS[transition.phase], availabilityLabel].filter(Boolean).join(' · '),
      [
        DOOR_STATE_LABELS[transition.doorState],
        MOTION_LABELS[transition.motionState],
        OPERATING_MODE_LABELS[transition.operatingMode],
      ].filter(Boolean).join(' · '),
    ];
  }

  if (transition.kind === 'door') {
    return [[
      DOOR_EVENT_LABELS[transition.event],
      DOOR_STATE_LABELS[transition.doorState],
      availabilityLabel,
    ].filter(Boolean).join(' · ')];
  }

  if (transition.kind === 'dock') {
    return [[DOCK_PHASE_LABELS[transition.phase], availabilityLabel].filter(Boolean).join(' · ')];
  }
  // ramp, charging: passive facility — no phase/state axes, availability only.
  return [availabilityLabel].filter(Boolean);
}

function compactLabel(label, limit = 18) {
  if (typeof label !== 'string' || label.length <= limit) return label;
  return `${label.slice(0, limit - 1).trimEnd()}…`;
}

function computedAccessibleLabel(transition, availabilityLabel) {
  const from = transition.from.label ?? transition.from.mapId;
  const endpointDescription = transition.to
    ? `${from}에서 ${transition.to.label ?? transition.to.mapId}까지`
    : `${from}에서 시작`;
  const maps = transition.kind === 'lift'
    ? [
        transition.currentMapId ? `현재 지도 ${transition.currentMapId}` : undefined,
        transition.destinationMapId ? `목적 지도 ${transition.destinationMapId}` : undefined,
      ]
    : [];
  return [
    KIND_LABELS[transition.kind],
    transition.label,
    endpointDescription,
    ...maps,
    ...detailRows(transition, availabilityLabel),
  ].filter(Boolean).join(' · ');
}

// Map-pin silhouette: a round head centered at the origin (so the glyph, hit
// target, rings and state badges all stay centered) tapering to a point that
// marks the coordinate. Focus follows this silhouette; selection enlarges the
// same filled body, so both states preserve facility identity and paint.
const PIN_PATH = NAV_PIN.path;

/**
 * LK Robotics — FacilityTransition
 *
 * Renderer-neutral SVG reference fragment for a door, lift, or dock transition.
 * It visualizes product-provided state and never requests or controls equipment.
 */
export function FacilityTransition({
  transition,
  activeMapId,
  hidden = false,
  viewportScale = 1,
  selected = false,
  focused = false,
  disabled = false,
  invalid = false,
  stale = false,
  showLabel,
  labelVisibility,
  detailVisibility,
  onActivate,
  style,
  role,
  tabIndex,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
  onFocus,
  onBlur,
  onPointerEnter,
  onPointerLeave,
  onMouseDown,
  ...rest
}) {
  const [focusVisible, setFocusVisible] = React.useState(false);
  const coordinateBoundary = useNavigationCoordinateBoundary();
  const annotationDetailMode = useNavigationAnnotationDetailMode();
  const obstacle = useNavigationObstacles();
  const endpoint = endpointForMap(transition, activeMapId);
  const availability = AVAILABILITY_PRESENTATION[transition.availability]
    ?? AVAILABILITY_PRESENTATION.unknown;
  const interactive = typeof onActivate === 'function';
  const pointerOnly = ariaHidden === true || ariaHidden === 'true';
  const activeFocus = !pointerOnly && (focused || focusVisible);
  const scale = safeScale(viewportScale);
  const inverseScale = 1 / scale;
  const focusSurface = 'var(--viewer-surface-elevated, var(--color-semantic-background-elevated-normal))';
  const stroke = invalid
    ? 'var(--viewer-danger, var(--color-semantic-status-negative-foreground))'
    : disabled
      ? 'var(--viewer-muted, var(--color-semantic-label-alternative))'
      : availability.stroke;
  const detailRowsVisible = visibleDetailRows(transition, availability.label);
  const coordinated = annotationDetailMode != null;
  const visualLabel = coordinated ? compactLabel(transition.label) : transition.label;
  const rows = coordinated
    ? detailRowsVisible.slice(0, 1)
    : detailRowsVisible;
  const computedLabel = [
    computedAccessibleLabel(transition, availability.label),
    selected ? '선택됨' : undefined,
    activeFocus ? '포커스됨' : undefined,
    invalid ? '잘못된 설비 전이' : undefined,
    stale ? '데이터 지연' : undefined,
    disabled ? '선택할 수 없음' : undefined,
  ].filter(Boolean).join(' · ');
  // Marker-family contract: one attached solid status badge. All raw states
  // remain in the accessible name, while the visual slot resolves by priority.
  const stateBadge = invalid
    ? { kind: 'invalid', tone: 'var(--viewer-danger, var(--color-semantic-status-negative-foreground))' }
    : stale
      ? { kind: 'stale', tone: 'var(--viewer-muted, var(--color-semantic-label-alternative))' }
      : transition.availability === 'unknown'
        ? { kind: 'unknown', tone: 'var(--viewer-warning, var(--color-semantic-status-cautionary-foreground))' }
        : null;
  const {
    hovered,
    labelVisibility: resolvedLabelVisibility,
    detailVisibility: resolvedDetailVisibility,
    labelVisible,
    detailsVisible,
    onPointerEnter: handleLabelPointerEnter,
    onPointerLeave: handleLabelPointerLeave,
  } = useNavigationLabelDisclosure({
    showLabel,
    labelVisibility,
    detailVisibility,
    selected,
    focused: activeFocus,
    priority: invalid || stale || transition.availability === 'unavailable',
    hasDetails: rows.length > 0,
    onPointerEnter,
    onPointerLeave,
  });

  if (
    hidden
    || !endpoint
    || (endpoint.source && endpoint.source.mapId !== endpoint.mapId)
    || !isNavigationSourceCompatible(endpoint?.source, coordinateBoundary)
  ) return null;

  const endpointLabel = endpoint.side === 'from'
    ? '출발'
    : endpoint.side === 'to'
      ? '도착'
      : '연결';

  const activate = (event) => {
    if (disabled || !interactive) return;
    onActivate(transition.id, event);
  };

  const handleKeyDown = (event) => {
    if (!pointerOnly) setFocusVisible(true);
    if (pointerOnly || disabled || !interactive || event.repeat) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    activate(event);
  };

  return (
    <g
      {...rest}
      role={pointerOnly ? undefined : role ?? (interactive ? 'button' : 'img')}
      tabIndex={pointerOnly ? undefined : interactive ? (disabled ? -1 : (tabIndex ?? 0)) : tabIndex}
      focusable={pointerOnly ? 'false' : interactive && !disabled ? 'true' : undefined}
      aria-hidden={pointerOnly || undefined}
      aria-label={pointerOnly ? undefined : ariaLabel ?? computedLabel}
      aria-pressed={!pointerOnly && interactive ? selected : undefined}
      aria-disabled={!pointerOnly && interactive && disabled ? true : undefined}
      aria-invalid={!pointerOnly && invalid ? true : undefined}
      transform={`translate(${endpoint.position.x} ${endpoint.position.y})`}
      data-lds-facility-transition=""
      data-transition-id={transition.id}
      data-facility-id={transition.facilityId}
      data-transition-kind={transition.kind}
      data-transition-availability={transition.availability}
      data-active-map-id={activeMapId}
      data-from-map-id={transition.from.mapId}
      data-to-map-id={transition.to?.mapId}
      data-visible-endpoint={endpoint.side}
      data-source-frame-id={endpoint.source?.frameId}
      data-source-map-version={endpoint.source?.mapVersion}
      data-door-state={transition.doorState}
      data-door-event={transition.kind === 'door' ? transition.event : undefined}
      data-lift-phase={transition.kind === 'lift' ? transition.phase : undefined}
      data-motion-state={transition.kind === 'lift' ? transition.motionState : undefined}
      data-operating-mode={transition.kind === 'lift' ? transition.operatingMode : undefined}
      data-session-state={transition.kind === 'lift' ? transition.sessionState : undefined}
      data-current-map-id={transition.kind === 'lift' ? transition.currentMapId : undefined}
      data-destination-map-id={transition.kind === 'lift' ? transition.destinationMapId : undefined}
      data-dock-phase={transition.kind === 'dock' ? transition.phase : undefined}
      data-selected={selected || undefined}
      data-focused={activeFocus || undefined}
      data-invalid={invalid || undefined}
      data-stale={stale || undefined}
      data-disabled={disabled || undefined}
      data-viewport-scale={scale}
      data-hovered={hovered || undefined}
      data-label-visibility={resolvedLabelVisibility}
      data-label-visible={labelVisible ? 'true' : 'false'}
      data-detail-visibility={resolvedDetailVisibility}
      data-detail-visible={detailsVisible ? 'true' : 'false'}
      onClick={activate}
      onKeyDown={handleKeyDown}
      onMouseDown={(event) => {
        if (pointerOnly) event.preventDefault();
        onMouseDown?.(event);
      }}
      onFocus={(event) => {
        if (!pointerOnly) setFocusVisible(isFocusVisibleTarget(event.currentTarget));
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocusVisible(false);
        onBlur?.(event);
      }}
      onPointerEnter={handleLabelPointerEnter}
      onPointerLeave={handleLabelPointerLeave}
      style={{
        cursor: interactive && !disabled ? 'pointer' : disabled ? 'not-allowed' : 'default',
        opacity: navStateOpacity(disabled, stale),
        outline: 'none',
        ...style,
      }}
    >
      <g transform={`scale(${inverseScale})`} data-transition-screen-space="">
        {/* Focus traces the pin silhouette. Selection enlarges the complete pin
            body without changing availability color or scaling state badges. */}
        {activeFocus && (
          <>
            <path d={PIN_PATH} transform={`scale(${NAV_PIN.focusRing.scale})`} fill="none" stroke={focusSurface} strokeWidth={NAV_FOCUS.contrastStrokeWidth} strokeLinejoin="round" vectorEffect="non-scaling-stroke" pointerEvents="none" data-transition-focus-contrast="" />
            <path d={PIN_PATH} transform={`scale(${NAV_PIN.focusRing.scale})`} fill="none" stroke="var(--color-semantic-focus-indicator)" strokeWidth={NAV_PIN.focusRing.strokeWidth} strokeLinejoin="round" vectorEffect="non-scaling-stroke" pointerEvents="none" data-transition-focus-ring="" />
          </>
        )}
        <circle
          r={NAV_HIT.radius}
          fill="transparent"
          stroke="none"
          pointerEvents={interactive ? 'all' : 'none'}
          data-transition-hit-area=""
          data-screen-target-size={NAV_HIT.screenTargetSize}
        />
        <g
          data-navigation-selection-scale=""
          data-transition-selection-visual=""
          data-transition-selected-scale={selected ? NAV_SELECTION.pinScale : undefined}
          style={{ transform: `scale(${selected ? NAV_SELECTION.pinScale : 1})` }}
        >
          <path d={PIN_PATH} transform={NAV_PIN.shadow.transform} fill={NAV_PIN.shadow.fill} opacity={NAV_PIN.shadow.opacity} pointerEvents="none" data-transition-shadow="" />
          <path
            {...obstacle(`facility:${transition.id}:pin`)}
            d={PIN_PATH}
            fill={stroke}
            vectorEffect="non-scaling-stroke"
            data-transition-marker=""
          />
          <FacilityGlyph
            kind={transition.kind}
            color="var(--viewer-surface-elevated, var(--color-semantic-static-white))"
            badge={stroke}
          />

          {transition.availability === 'unavailable' && (
            <g pointerEvents="none" data-transition-unavailable-mark="">
              {/* Badge-color halo cuts a gap through the white knockout glyph so the
                  white slash core reads cleanly over BOTH the glyph and the badge. */}
              <path d="M-6.5 6.5L6.5-6.5" fill="none" stroke={stroke} strokeWidth="5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              <path d="M-6.5 6.5L6.5-6.5" fill="none" stroke="var(--color-semantic-static-white)" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </g>
          )}
        </g>
        {stateBadge && (
          <g {...obstacle(`facility:${transition.id}:states`)} data-transition-state-slot-layer="" pointerEvents="none">
            <g
              transform="translate(9 -9)"
              data-transition-state-slot={stateBadge.kind}
              data-transition-status-badge-style="solid"
              data-transition-unknown-mark={stateBadge.kind === 'unknown' ? '' : undefined}
              data-transition-invalid-mark={stateBadge.kind === 'invalid' ? '' : undefined}
              data-transition-stale-mark={stateBadge.kind === 'stale' ? '' : undefined}
            >
              <circle
                r={NAV_STATE_BADGE.radius}
                fill={stateBadge.tone}
                stroke={focusSurface}
                strokeWidth={NAV_STATE_BADGE.strokeWidth}
                vectorEffect="non-scaling-stroke"
              />
              <NavigationStateGlyph
                kind={stateBadge.kind}
                size={10}
                color={focusSurface}
              />
            </g>
          </g>
        )}

        {labelVisible && (
          <NavigationAnnotationBlock
            id={`facility:${transition.id}:label`}
            kind="facility-label"
            anchor={endpoint.position}
            detailLevel="standard"
            priority={annotationPriority({
              selected,
              focused: activeFocus,
              alarm: invalid || transition.availability === 'unavailable',
              importance: ANNOTATION_IMPORTANCE.context,
            })}
          >
            <text
              x="20"
              y="-8"
              textAnchor="start"
              fill="var(--viewer-foreground, var(--color-semantic-label-strong))"
              stroke="var(--viewer-surface, var(--color-semantic-background-normal-normal))"
              strokeWidth={NAV_LABEL_HALO.primary}
              paintOrder="stroke"
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
              data-transition-label=""
              style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--caption1-size)', fontWeight: 'var(--fw-bold)' }}
            >
              <tspan x="20" dy="0">
                {annotationDetailMode === 'standard' ? '' : `${endpointLabel} · `}{visualLabel}
              </tspan>
              {detailsVisible && rows.map((row, index) => (
                <tspan key={`${transition.id}-row-${index}`} x="20" dy="13" style={{ fontSize: 'var(--caption2-size)', fontWeight: 'var(--fw-semibold)' }}>
                  {row}
                </tspan>
              ))}
            </text>
          </NavigationAnnotationBlock>
        )}
      </g>
    </g>
  );
}
