import React from 'react';
import {
  isNavigationGeometryCompatible,
  useNavigationCoordinateBoundary,
} from './NavigationCoordinateBoundary.jsx';
import { isFocusVisibleTarget } from './_NavigationFocus.js';
import { NavigationStateGlyph } from './_NavigationStateGlyph.js';
import {
  ANNOTATION_IMPORTANCE,
  NavigationAnnotationBlock,
  annotationPriority,
  useNavigationLabelDisclosure,
  useNavigationObstacles,
} from './_navigationAnnotations.js';
import { navStateOpacity, NAV_NODE, NAV_HIT, NAV_STATE_BADGE, NAV_LABEL_HALO, NAV_FOCUS, NAV_SELECTION, NAV_LINE_ROLE } from './_navigationVocabulary.js';

const VIEWER_FOREGROUND = 'var(--viewer-foreground, var(--color-semantic-label-strong))';
const VIEWER_MUTED = 'var(--viewer-muted, var(--color-semantic-label-neutral))';
const VIEWER_SURFACE = 'var(--viewer-surface-elevated, var(--color-semantic-background-elevated-normal))';

const AVAILABILITY_LABEL = {
  available: '통행 가능',
  closed: '폐쇄',
  unknown: '상태 미확인',
};

function finitePoint(point) {
  return point && Number.isFinite(point.x) && Number.isFinite(point.y);
}

function pathFromPoints(points) {
  if (points.length < 2) return '';
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

function pointAlong(points, ratio) {
  if (points.length === 0) return { x: 0, y: 0, angle: 0 };
  if (points.length === 1) return { ...points[0], angle: 0 };

  const lengths = [];
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1];
    const end = points[index];
    const length = Math.hypot(end.x - start.x, end.y - start.y);
    lengths.push(length);
    total += length;
  }

  if (total === 0) return { ...points[0], angle: 0 };
  let remaining = total * Math.max(0, Math.min(1, ratio));
  for (let index = 0; index < lengths.length; index += 1) {
    const length = lengths[index];
    const start = points[index];
    const end = points[index + 1];
    if (remaining <= length || index === lengths.length - 1) {
      const localRatio = length === 0 ? 0 : remaining / length;
      return {
        x: start.x + (end.x - start.x) * localRatio,
        y: start.y + (end.y - start.y) * localRatio,
        angle: Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI,
      };
    }
    remaining -= length;
  }

  return { ...points[points.length - 1], angle: 0 };
}

function upperScreenNormal(angle) {
  const radians = angle * Math.PI / 180;
  let x = Math.sin(radians);
  let y = -Math.cos(radians);

  // Keep labels on the visually upper side of a lane regardless of travel
  // direction. A vertical lane uses its left side as the stable tie-breaker.
  if (y > 0 || (Math.abs(y) < 0.0001 && x > 0)) {
    x *= -1;
    y *= -1;
  }

  return { x, y };
}

function outwardTextAnchor(horizontalDirection) {
  if (horizontalDirection > 0.15) return 'start';
  if (horizontalDirection < -0.15) return 'end';
  return 'middle';
}

function laneAccessibleName(lane, availability, conflict, selected, focused, disabled, invalid, stale) {
  const entryName = lane.entry?.waypointId ?? '진입점';
  const exitName = lane.exit?.waypointId ?? '이탈점';
  const parts = [
    lane.label ?? `레인 ${lane.id}`,
    `${entryName}에서 ${exitName} 방향`,
    AVAILABILITY_LABEL[availability],
  ];
  if (lane.relation?.kind === 'paired') parts.push(`반대 방향 레인 ${lane.relation.pairedLaneId}와 쌍`);
  if (lane.speedLimitMps != null) parts.push(`속도 제한 ${lane.speedLimitMps} m/s`);
  if (lane.mutexGroupId) parts.push(`상호 배제 그룹 ${lane.mutexGroupId}`);
  if (lane.entry?.transitionIds?.length) parts.push(`진입 전환 ${lane.entry.transitionIds.join(', ')}`);
  if (lane.exit?.transitionIds?.length) parts.push(`이탈 전환 ${lane.exit.transitionIds.join(', ')}`);
  if (lane.entry?.orientation && lane.entry.orientation !== 'unconstrained') {
    parts.push(`진입 방위 제약 ${lane.entry.orientation}`);
  }
  if (lane.exit?.orientation && lane.exit.orientation !== 'unconstrained') {
    parts.push(`이탈 방위 제약 ${lane.exit.orientation}`);
  }
  if (conflict) parts.push('충돌 있음');
  if (selected) parts.push('선택됨');
  if (focused) parts.push('포커스됨');
  if (disabled) parts.push('선택할 수 없음');
  if (invalid) parts.push('데이터 오류');
  if (stale) parts.push('오래된 데이터');
  return parts.join(', ');
}

function endpointMarker(point, endpoint, kind, inverseScale) {
  if (!point || !endpoint) return null;
  const transitionCount = endpoint.transitionIds?.length ?? 0;

  return (
    <g
      key={kind}
      data-lane-endpoint={kind}
      data-lane-endpoint-symbol={kind === 'entry' ? 'circle' : 'square'}
      data-waypoint-id={endpoint.waypointId ?? undefined}
      transform={`translate(${point.x} ${point.y}) scale(${inverseScale})`}
      aria-hidden="true"
      pointerEvents="none"
    >
      <rect
        data-lane-endpoint-point={kind}
        {...NAV_NODE.rect(NAV_NODE.endpointRadius, NAV_NODE.endpointCornerRadius)}
        fill={VIEWER_SURFACE}
        stroke={VIEWER_MUTED}
        strokeWidth="1.5"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {kind === 'entry' ? (
        <circle
          data-lane-endpoint-glyph="entry"
          r="2.75"
          fill={VIEWER_MUTED}
        />
      ) : (
        <rect
          data-lane-endpoint-glyph="exit"
          x="-2.75"
          y="-2.75"
          width="5.5"
          height="5.5"
          rx="0.75"
          fill={VIEWER_MUTED}
        />
      )}
      {transitionCount > 0 && (
        <g data-lane-transition-count={transitionCount} transform="translate(0 16)">
          <circle
            data-lane-transition-count-circle=""
            r="10"
            fill={VIEWER_SURFACE}
            stroke={VIEWER_MUTED}
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
          <text
            data-lane-transition-count-text=""
            x="0"
            y="0.5"
            textAnchor="middle"
            dominantBaseline="middle"
            fill={VIEWER_FOREGROUND}
            stroke={VIEWER_SURFACE}
            strokeWidth="1.5"
            paintOrder="stroke"
            vectorEffect="non-scaling-stroke"
            fontFamily="var(--font-sans)"
            fontSize="var(--caption2-size)"
            fontWeight="var(--fw-bold)"
          >
            {/* "×2", not "T2": the T read as an identifier or a sequence
                number ("transition #2") when it always meant a count, and a
                legend note had to exist to say so. The multiplication sign is
                the language-neutral count marker, so the badge explains
                itself and the note can retire. */}
            ×{transitionCount}
          </text>
        </g>
      )}
    </g>
  );
}

/** Renderer-neutral SVG fragment for one directed robotics navigation lane. */
export function LaneOverlay({
  lane,
  availability = 'available',
  conflict = false,
  viewportScale = 1,
  selected = false,
  focused = false,
  disabled = false,
  invalid = false,
  stale = false,
  showLabel,
  labelVisibility,
  detailVisibility,
  showEndpoints = false,
  onActivate,
  role,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
  tabIndex,
  onFocus,
  onBlur,
  onPointerEnter,
  onPointerLeave,
  onMouseDown,
  style,
  ...rest
}) {
  const [hasFocus, setHasFocus] = React.useState(false);
  const coordinateBoundary = useNavigationCoordinateBoundary();
  const obstacle = useNavigationObstacles();
  const pointerOnly = ariaHidden === true || ariaHidden === 'true';
  const scale = Number.isFinite(viewportScale) && viewportScale > 0 ? viewportScale : 1;
  const inverseScale = 1 / scale;
  const resolvedAvailability = ['available', 'closed', 'unknown'].includes(availability)
    ? availability
    : 'available';
  const hasConflict = Boolean(conflict);
  const points = (lane?.points ?? []).filter(finitePoint);
  const interactive = typeof onActivate === 'function';
  const visibleFocus = !pointerOnly && (focused || hasFocus);
  const relation = lane?.relation?.kind === 'paired' ? 'paired' : 'single';
  const hasMetadata = lane?.speedLimitMps != null || Boolean(lane?.mutexGroupId);
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
    focused: visibleFocus,
    priority: invalid
      || stale
      || hasConflict
      || resolvedAvailability === 'closed'
      || lane?.speedLimitMps != null,
    hasDetails: hasMetadata,
    onPointerEnter,
    onPointerLeave,
  });
  if (
    (lane?.source && lane.source.mapId !== lane.mapId)
    || !isNavigationGeometryCompatible(lane, coordinateBoundary)
  ) return null;
  if (points.length < 2) return null;

  const pathData = pathFromPoints(points);
  const midpoint = pointAlong(points, 0.5);

  const baseColor = invalid || hasConflict || resolvedAvailability === 'closed'
    ? 'var(--viewer-danger, var(--color-semantic-status-negative-foreground))'
    : resolvedAvailability === 'unknown'
      ? 'var(--viewer-warning, var(--color-semantic-status-cautionary-foreground))'
      : 'var(--viewer-muted, var(--color-semantic-label-alternative))';
  // The dash is a stable LINE ROLE cue: every Lane uses the same quiet topology
  // texture. Runtime availability/conflict changes tone only; exact state text
  // remains in the visible label/detail surface and accessible name. The only
  // glyph badges a lane keeps are data-quality flags (invalid/stale).
  const stateGlyphs = [
    invalid ? { state: 'invalid', tone: 'var(--viewer-danger, var(--color-semantic-status-negative-foreground))' } : null,
    stale ? { state: 'stale', tone: VIEWER_MUTED } : null,
  ].filter(Boolean);
  const midpointRadians = midpoint.angle * Math.PI / 180;
  const labelNormal = upperScreenNormal(midpoint.angle);
  const stateTangent = {
    x: Math.cos(midpointRadians),
    y: Math.sin(midpointRadians),
  };
  const positionedStateGlyphs = stateGlyphs.map((state, index) => ({
    ...state,
    slot: {
      x: stateTangent.x * (index - (stateGlyphs.length - 1) / 2) * 18 + labelNormal.x * 32,
      y: stateTangent.y * (index - (stateGlyphs.length - 1) / 2) * 18 + labelNormal.y * 32,
    },
  }));
  const primaryLabelDistance = positionedStateGlyphs.length > 0 ? 56 : 22;
  const metadataDistance = positionedStateGlyphs.length > 0 ? 40 : 28;
  const primaryLabelPosition = {
    x: labelNormal.x * primaryLabelDistance,
    y: labelNormal.y * primaryLabelDistance,
  };
  const primaryLabelAnchor = outwardTextAnchor(labelNormal.x);
  const metadataNormalDistance = lane?.label ? -metadataDistance : primaryLabelDistance;
  const metadataPosition = {
    x: labelNormal.x * metadataNormalDistance,
    y: labelNormal.y * metadataNormalDistance,
  };
  const metadataAnchor = outwardTextAnchor(labelNormal.x * Math.sign(metadataNormalDistance));
  const metadata = [
    lane?.speedLimitMps != null
      ? `≤ ${lane.speedLimitMps} m/s`
      : null,
    lane?.mutexGroupId ? `mutex ${lane.mutexGroupId}` : null,
  ].filter(Boolean).join(' · ');

  const activate = (event) => {
    if (disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    onActivate?.(lane.id, event);
  };

  const handleKeyDown = (event) => {
    if (!pointerOnly) setHasFocus(true);
    if (pointerOnly || disabled || !interactive || event.repeat) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    activate(event);
  };

  return (
    <g
      {...rest}
      data-lk-lane-overlay=""
      data-navigation-line-role="lane"
      data-line-encoding="topology"
      data-lane-id={lane?.id}
      data-map-id={lane?.mapId}
      data-source-frame-id={lane?.source?.frameId}
      data-source-map-version={lane?.source?.mapVersion}
      data-coordinate-space={lane?.coordinateSpace}
      data-availability={resolvedAvailability}
      data-conflict={hasConflict ? 'true' : 'false'}
      data-lane-flow-encoding="dashed-stroke"
      data-relation={relation}
      data-paired-lane-id={lane?.relation?.kind === 'paired' ? lane.relation.pairedLaneId : undefined}
      data-selected={selected ? 'true' : 'false'}
      data-focused={visibleFocus ? 'true' : 'false'}
      data-disabled={disabled ? 'true' : 'false'}
      data-invalid={invalid ? 'true' : 'false'}
      data-stale={stale ? 'true' : 'false'}
      data-hovered={hovered ? 'true' : 'false'}
      data-label-visibility={resolvedLabelVisibility}
      data-label-visible={labelVisible ? 'true' : 'false'}
      data-detail-visibility={resolvedDetailVisibility}
      data-detail-visible={detailsVisible ? 'true' : 'false'}
      role={pointerOnly ? undefined : role ?? (interactive ? 'button' : 'img')}
      tabIndex={pointerOnly ? undefined : interactive ? (disabled ? -1 : tabIndex ?? 0) : tabIndex}
      focusable={pointerOnly ? 'false' : interactive && !disabled ? 'true' : undefined}
      aria-hidden={pointerOnly || undefined}
      aria-label={pointerOnly ? undefined : ariaLabel ?? laneAccessibleName(
        lane,
        resolvedAvailability,
        hasConflict,
        selected,
        visibleFocus,
        disabled,
        invalid,
        stale,
      )}
      aria-pressed={!pointerOnly && interactive ? selected : undefined}
      aria-disabled={!pointerOnly && interactive && disabled ? true : undefined}
      aria-invalid={!pointerOnly && invalid ? true : undefined}
      onClick={interactive ? activate : undefined}
      onKeyDown={handleKeyDown}
      onMouseDown={(event) => {
        if (pointerOnly) event.preventDefault();
        onMouseDown?.(event);
      }}
      onFocus={(event) => {
        if (!pointerOnly) setHasFocus(isFocusVisibleTarget(event.currentTarget));
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setHasFocus(false);
        onBlur?.(event);
      }}
      onPointerEnter={handleLabelPointerEnter}
      onPointerLeave={handleLabelPointerLeave}
      style={{
        cursor: disabled ? 'not-allowed' : interactive ? 'pointer' : 'default',
        opacity: navStateOpacity(disabled, stale),
        outline: 'none',
        ...style,
      }}
    >
      {visibleFocus && pathData && (
        <path
          data-lane-focus-ring=""
          d={pathData}
          fill="none"
          stroke="var(--color-semantic-focus-indicator)"
          strokeWidth={NAV_FOCUS.pathHaloWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
      )}
      {pathData && (
        <path
          data-lane-casing=""
          data-lane-selection-casing={selected ? '' : undefined}
          data-navigation-selection-geometry=""
          d={pathData}
          fill="none"
          stroke={VIEWER_SURFACE}
          strokeWidth={selected ? NAV_LINE_ROLE.lane.selectedCasingWidth : NAV_LINE_ROLE.lane.casingWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
      )}
      {pathData && (
        <path
          data-lane-path=""
          data-navigation-annotation-path-obstacle=""
          d={pathData}
          fill="none"
          stroke={baseColor}
          strokeWidth={selected ? NAV_LINE_ROLE.lane.selectedCoreWidth : NAV_LINE_ROLE.lane.coreWidth}
          data-navigation-selection-geometry=""
          strokeDasharray={NAV_LINE_ROLE.lane.dash}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
      )}
      {pathData && (
        <>
          <path
            data-lane-hit-target=""
            data-screen-target-size={NAV_HIT.screenTargetSize}
            d={pathData}
            fill="none"
            stroke="transparent"
            strokeWidth="24"
            vectorEffect="non-scaling-stroke"
            pointerEvents="stroke"
          />
          <circle
            data-lane-hit-target-core=""
            data-lane-actual-hit-core=""
            data-screen-target-size={NAV_HIT.screenTargetSize}
            data-screen-target-diameter="35"
            cx={midpoint.x}
            cy={midpoint.y}
            r={NAV_HIT.radius * inverseScale}
            fill="transparent"
            pointerEvents="all"
          />
        </>
      )}
      {showEndpoints && (
        <g {...obstacle(`lane:${lane.id}:endpoint:entry`)}>
          {endpointMarker(points[0], lane?.entry, 'entry', inverseScale)}
        </g>
      )}
      {showEndpoints && (
        <g {...obstacle(`lane:${lane.id}:endpoint:exit`)}>
          {endpointMarker(points[points.length - 1], lane?.exit, 'exit', inverseScale)}
        </g>
      )}
      {positionedStateGlyphs.length > 0 && (
        <g
          {...obstacle(`lane:${lane.id}:states`)}
          data-lane-state-slot-layer=""
          data-viewport-scale={scale}
          data-lane-state-tangent-x={stateTangent.x}
          data-lane-state-tangent-y={stateTangent.y}
          data-lane-state-normal-x={labelNormal.x}
          data-lane-state-normal-y={labelNormal.y}
          transform={`translate(${midpoint.x} ${midpoint.y}) scale(${inverseScale})`}
          aria-hidden="true"
          pointerEvents="none"
        >
          {positionedStateGlyphs.map((state) => (
            <g
              key={state.state}
              data-lane-state-glyph={state.state}
              data-lane-state={state.state}
              data-lane-state-slot-x={state.slot.x}
              data-lane-state-slot-y={state.slot.y}
              transform={`translate(${state.slot.x} ${state.slot.y})`}
            >
              <circle
                data-lane-state-circle={state.state}
                r={NAV_STATE_BADGE.radius}
                fill={VIEWER_SURFACE}
                stroke={state.tone}
                strokeWidth={NAV_STATE_BADGE.strokeWidth}
                vectorEffect="non-scaling-stroke"
              />
              <NavigationStateGlyph
                kind={state.state}
                size={10}
                color={VIEWER_FOREGROUND}
                data-lane-state-glyph-geometry=""
              />
            </g>
          ))}
        </g>
      )}
      {labelVisible && (lane?.label || (detailsVisible && metadata)) && (
        <NavigationAnnotationBlock
          id={`lane:${lane.id}:label`}
          kind="lane-label"
          anchor={midpoint}
          detailLevel="detail"
          priority={annotationPriority({
            selected,
            focused: visibleFocus,
            alarm: invalid || hasConflict || resolvedAvailability === 'closed',
            importance: ANNOTATION_IMPORTANCE.background,
          })}
        >
        <g
          data-lane-label=""
          data-lane-label-normal-x={labelNormal.x}
          data-lane-label-normal-y={labelNormal.y}
          transform={`translate(${midpoint.x} ${midpoint.y}) scale(${inverseScale})`}
          aria-hidden="true"
          pointerEvents="none"
        >
          {lane?.label && (
            <text
              data-lane-primary-label=""
              data-lane-normal-distance={primaryLabelDistance}
              data-lane-outward-anchor={primaryLabelAnchor}
              x={primaryLabelPosition.x}
              y={primaryLabelPosition.y}
              textAnchor={primaryLabelAnchor}
              fill={VIEWER_FOREGROUND}
              stroke={VIEWER_SURFACE}
              strokeWidth={NAV_LABEL_HALO.primary}
              paintOrder="stroke"
              vectorEffect="non-scaling-stroke"
              fontFamily="var(--font-sans)"
              fontSize="var(--caption1-size)"
              fontWeight="var(--fw-bold)"
            >
              {lane.label}
            </text>
          )}
          {detailsVisible && metadata && (
            <text
              data-lane-metadata=""
              data-lane-normal-distance={metadataNormalDistance}
              data-lane-outward-anchor={metadataAnchor}
              x={metadataPosition.x}
              y={metadataPosition.y}
              textAnchor={metadataAnchor}
              fill={VIEWER_MUTED}
              stroke={VIEWER_SURFACE}
              strokeWidth={NAV_LABEL_HALO.secondary}
              paintOrder="stroke"
              vectorEffect="non-scaling-stroke"
              fontFamily="var(--font-sans)"
              fontSize="var(--caption2-size)"
              fontWeight="var(--fw-semibold)"
            >
              {metadata}
            </text>
          )}
        </g>
        </NavigationAnnotationBlock>
      )}
    </g>
  );
}
