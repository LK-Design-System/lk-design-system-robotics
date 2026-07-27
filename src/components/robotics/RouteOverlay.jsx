import React from 'react';
import {
  isNavigationGeometryCompatible,
  useNavigationCoordinateBoundary,
} from './NavigationCoordinateBoundary.jsx';
import { isFocusVisibleTarget } from './_NavigationFocus.js';
import {
  ANNOTATION_IMPORTANCE,
  NavigationAnnotationBlock,
  annotationPriority,
  resolveNavigationLabelDisclosure,
  useNavigationLabelPolicy,
  useNavigationObstacles,
} from './_navigationAnnotations.js';
import { navStateOpacity, NAV_HIT, NAV_LABEL_HALO, NAV_FOCUS, NAV_SELECTION, NAV_LINE_ROLE } from './_navigationVocabulary.js';

// 'active' reads 주행 중, not 이동 중: a route is a PLAN being traversed, while
// 이동 중 is the trajectory/robot's own motion state — two different claims
// that must not share one word on a map that shows both layers.
const STATUS_LABEL = {
  planned: '계획됨',
  active: '주행 중',
  waiting: '대기 중',
  blocked: '차단됨',
  rerouting: '경로 재계산 중',
  completed: '완료됨',
};

const PHASE_LABEL = {
  completed: '통과 완료',
  current: '현재 구간',
  upcoming: '예정 구간',
};

const CONDITION_LABEL = {
  normal: '정상',
  waiting: '대기',
  blocked: '차단',
  conflict: '충돌',
};

// Route is the selected subset of Lane: it keeps the Lane line width and dash
// cadence, changing only to the plan identity tone. Lifecycle phase, condition,
// and executor progress remain data/detail concerns. Data quality applies to the
// complete plan stroke rather than attaching point badges.

function finitePoint(point) {
  return point && Number.isFinite(point.x) && Number.isFinite(point.y);
}

function pathFromPoints(points) {
  if (points.length < 2) return '';
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

function markerTransform(point, inverseScale) {
  return `translate(${point.x} ${point.y}) scale(${inverseScale})`;
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

const ROUTE_IDENTITY_TONE =
  'var(--viewer-route, var(--color-semantic-data-viz-series-5, var(--color-semantic-accent-foreground-orange)))';

// Route is one selected graph plan. Phase, condition, and executor progress
// remain data/detail concerns; the operational map always paints one thick,
// solid identity line so it cannot be mistaken for execution telemetry.

function routeAccessibleName(route, selected, focused, disabled, invalid, stale) {
  const parts = [
    route.label ?? `경로 ${route.id}`,
    STATUS_LABEL[route.status] ?? route.status,
  ];
  if (selected) parts.push('선택됨');
  if (focused) parts.push('포커스됨');
  if (disabled) parts.push('선택할 수 없음');
  if (invalid) parts.push('데이터 오류');
  if (stale) parts.push('오래된 데이터');
  return parts.join(', ');
}

/** Map-filtered SVG fragments for the graph segments of one planned route. */
export function RouteOverlay({
  route,
  activeMapId,
  selectedSegmentId,
  viewportScale = 1,
  selected = false,
  focused = false,
  disabled = false,
  invalid = false,
  stale = false,
  showLabel,
  labelVisibility,
  detailVisibility,
  showTransitions = false,
  onActivate,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
  tabIndex,
  onFocus,
  onBlur,
  onKeyDown,
  onPointerDown,
  onMouseDown,
  style,
  ...rest
}) {
  const [focusedSegment, setFocusedSegment] = React.useState(null);
  const [hoveredSegment, setHoveredSegment] = React.useState(null);
  const [hasRootFocus, setHasRootFocus] = React.useState(false);
  const coordinateBoundary = useNavigationCoordinateBoundary();
  const labelPolicy = useNavigationLabelPolicy();
  const obstacle = useNavigationObstacles();
  const scale = Number.isFinite(viewportScale) && viewportScale > 0 ? viewportScale : 1;
  const inverseScale = 1 / scale;
  const interactive = typeof onActivate === 'function';
  const hiddenFromAccessibility = ariaHidden === true || ariaHidden === 'true';
  const pointerOnly = interactive && hiddenFromAccessibility;
  const visibleSegments = (route?.segments ?? []).filter((segment) => (
    segment.mapId === activeMapId
    && (!segment.source || segment.source.mapId === segment.mapId)
    && isNavigationGeometryCompatible(segment, coordinateBoundary)
    && (segment.points ?? []).filter(finitePoint).length >= 2
  ));
  const baseAccessibleName = ariaLabel
    ?? routeAccessibleName(route, selected, focused, disabled, invalid, stale);

  // An empty map-filtered route, including one with fewer than two finite
  // points per remaining segment, is not a perceivable graphic or control.
  if (visibleSegments.length === 0) return null;

  const activate = (segmentId, event) => {
    if (disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    onActivate?.({ routeId: route.id, segmentId }, event);
  };

  const handleKeyDown = (segmentId, event) => {
    if (!pointerOnly) setFocusedSegment(segmentId);
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    if (!interactive || disabled || event.repeat || pointerOnly) return;
    activate(segmentId, event);
  };

  const handleRootKeyDown = (event) => {
    if (!interactive && !hiddenFromAccessibility) setHasRootFocus(true);
    onKeyDown?.(event);
  };

  const handlePointerDown = (event) => {
    if (pointerOnly) event.preventDefault();
    onPointerDown?.(event);
  };

  const handleMouseDown = (event) => {
    if (pointerOnly) event.preventDefault();
    onMouseDown?.(event);
  };

  const routeTone = invalid
    ? 'var(--viewer-danger, var(--color-semantic-status-negative-foreground))'
    : stale
      ? 'var(--viewer-warning, var(--color-semantic-status-cautionary-foreground))'
      : ROUTE_IDENTITY_TONE;

  return (
    <g
      {...rest}
      data-lk-route-overlay=""
      data-navigation-line-role="route"
      data-line-encoding="graph-plan"
      data-route-id={route?.id}
      data-active-map-id={activeMapId}
      data-source-frame-ids={[...new Set(visibleSegments.map((segment) => segment.source?.frameId).filter(Boolean))].join(' ') || undefined}
      data-source-map-versions={[...new Set(visibleSegments.map((segment) => segment.source?.mapVersion).filter(Boolean))].join(' ') || undefined}
      data-coordinate-space={[...new Set(visibleSegments.map((segment) => segment.coordinateSpace).filter(Boolean))].join(' ') || undefined}
      data-route-status={route?.status}
      data-visible-segment-count={visibleSegments.length}
      data-viewport-scale={scale}
      data-route-quality={invalid ? 'invalid' : stale ? 'stale' : 'valid'}
      data-pointer-only={pointerOnly ? 'true' : undefined}
      data-selected={selected ? 'true' : 'false'}
      data-focused={!hiddenFromAccessibility && (focused || hasRootFocus || focusedSegment != null) ? 'true' : 'false'}
      data-disabled={disabled ? 'true' : 'false'}
      data-invalid={invalid ? 'true' : 'false'}
      data-stale={stale ? 'true' : 'false'}
      role={hiddenFromAccessibility ? undefined : interactive ? 'group' : 'img'}
      tabIndex={hiddenFromAccessibility ? undefined : !interactive ? tabIndex : undefined}
      focusable={hiddenFromAccessibility ? 'false' : !interactive && tabIndex != null ? 'true' : undefined}
      aria-hidden={hiddenFromAccessibility || undefined}
      aria-label={hiddenFromAccessibility ? undefined : baseAccessibleName}
      aria-disabled={hiddenFromAccessibility ? undefined : interactive && disabled ? true : undefined}
      aria-invalid={hiddenFromAccessibility ? undefined : invalid || undefined}
      onKeyDown={((!interactive && !hiddenFromAccessibility) || onKeyDown) ? handleRootKeyDown : undefined}
      onPointerDown={pointerOnly || onPointerDown ? handlePointerDown : undefined}
      onMouseDown={pointerOnly || onMouseDown ? handleMouseDown : undefined}
      onFocus={!interactive && !hiddenFromAccessibility ? (event) => {
        setHasRootFocus(isFocusVisibleTarget(event.currentTarget));
        onFocus?.(event);
      } : undefined}
      onBlur={!interactive && !hiddenFromAccessibility ? (event) => {
        setHasRootFocus(false);
        onBlur?.(event);
      } : undefined}
      style={{ opacity: navStateOpacity(disabled, false), outline: 'none', ...style }}
    >
      <g data-route-casing-layer="" aria-hidden="true" pointerEvents="none">
        {visibleSegments.map((segment) => {
          const pathData = pathFromPoints((segment.points ?? []).filter(finitePoint));
          const segmentSelected = selected || segment.id === selectedSegmentId;
          return pathData ? (
            <path
              key={segment.id}
              data-route-casing=""
              data-segment-id={segment.id}
              data-route-selection-casing={segmentSelected ? '' : undefined}
              data-navigation-selection-geometry=""
              d={pathData}
              fill="none"
              stroke="var(--viewer-surface-elevated, var(--color-semantic-background-elevated-normal))"
              strokeWidth={segmentSelected ? NAV_SELECTION.routeCasingWidth : NAV_LINE_ROLE.route.casingWidth}
              strokeDasharray={NAV_LINE_ROLE.route.dash}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ) : null;
        })}
      </g>
      {visibleSegments.map((segment) => {
        const points = (segment.points ?? []).filter(finitePoint);
        const pathData = pathFromPoints(points);
        const midpoint = pointAlong(points, 0.5);
        const segmentSelected = selected || segment.id === selectedSegmentId;
        const segmentFocused = !pointerOnly && (focused || hasRootFocus || focusedSegment === segment.id);
        const condition = ['normal', 'waiting', 'blocked', 'conflict'].includes(segment.condition)
          ? segment.condition
          : 'normal';
        const phase = ['completed', 'current', 'upcoming'].includes(segment.phase)
          ? segment.phase
          : 'upcoming';
        const disclosure = resolveNavigationLabelDisclosure({
          policy: labelPolicy,
          showLabel,
          labelVisibility,
          detailVisibility,
          hovered: hoveredSegment === segment.id,
          focused: segmentFocused,
          selected: segmentSelected,
          priority: invalid
            || stale
            || condition === 'blocked'
            || condition === 'conflict',
          hasDetails: false,
        });
        const tone = routeTone;
        const segmentName = [
          segment.label ?? `구간 ${segment.id}`,
          PHASE_LABEL[phase],
          CONDITION_LABEL[condition],
          segment.laneIds?.length ? `graph lane ${segment.laneIds.length}개` : null,
          segment.entryTransitionId ? `진입 전환 ${segment.entryTransitionId}` : null,
          segment.exitTransitionId ? `이탈 전환 ${segment.exitTransitionId}` : null,
        ].filter(Boolean).join(', ');

        return (
          <g
            key={segment.id}
            data-route-segment=""
            data-segment-id={segment.id}
            data-map-id={segment.mapId}
            data-phase={phase}
            data-condition={condition}
            data-selected={segmentSelected ? 'true' : 'false'}
            data-focused={segmentFocused ? 'true' : 'false'}
            data-disabled={disabled ? 'true' : 'false'}
            data-invalid={invalid ? 'true' : 'false'}
            data-stale={stale ? 'true' : 'false'}
            data-hovered={hoveredSegment === segment.id ? 'true' : 'false'}
            data-label-visibility={disclosure.labelVisibility}
            data-label-visible={disclosure.labelVisible ? 'true' : 'false'}
            data-detail-visibility={disclosure.detailVisibility}
            role={pointerOnly ? undefined : interactive ? 'button' : undefined}
            tabIndex={pointerOnly ? undefined : interactive ? (disabled ? -1 : tabIndex ?? 0) : undefined}
            focusable={pointerOnly ? 'false' : interactive ? 'true' : undefined}
            aria-label={!pointerOnly && interactive ? `${baseAccessibleName}, ${segmentName}` : undefined}
            aria-pressed={!pointerOnly && interactive ? segmentSelected : undefined}
            aria-disabled={!pointerOnly && interactive && disabled ? true : undefined}
            aria-invalid={!hiddenFromAccessibility && invalid ? true : undefined}
            onClick={interactive ? (event) => activate(segment.id, event) : undefined}
            onKeyDown={interactive && !pointerOnly ? (event) => handleKeyDown(segment.id, event) : undefined}
            onFocus={!pointerOnly ? (event) => {
              setFocusedSegment(isFocusVisibleTarget(event.currentTarget) ? segment.id : null);
              onFocus?.(event);
            } : undefined}
            onBlur={!pointerOnly ? (event) => {
              setFocusedSegment((current) => current === segment.id ? null : current);
              onBlur?.(event);
            } : undefined}
            onPointerEnter={(event) => {
              if (event.pointerType !== 'touch') setHoveredSegment(segment.id);
            }}
            onPointerLeave={() => {
              setHoveredSegment((current) => current === segment.id ? null : current);
            }}
            style={{ cursor: interactive && !disabled ? 'pointer' : disabled ? 'not-allowed' : 'default' }}
          >
            {segmentFocused && pathData && (
              <path
                data-route-focus-ring=""
                d={pathData}
                fill="none"
                stroke="var(--color-semantic-focus-indicator)"
                strokeWidth={NAV_FOCUS.routeHaloWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
              />
            )}
            {pathData && stale && !invalid && (
              <path
                data-route-freshness-pulse=""
                d={pathData}
                fill="none"
                stroke={tone}
                strokeWidth={NAV_LINE_ROLE.route.pulseWidth}
                strokeDasharray={NAV_LINE_ROLE.route.dash}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
              />
            )}
            {pathData && (
              <path
                data-route-path=""
                data-navigation-annotation-path-obstacle=""
                d={pathData}
                fill="none"
                stroke={tone}
                strokeWidth={segmentSelected
                  ? NAV_SELECTION.routeStrokeWidth
                  : NAV_LINE_ROLE.route.coreWidth}
                strokeDasharray={NAV_LINE_ROLE.route.dash}
                data-navigation-selection-geometry=""
                opacity="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
              />
            )}
            {pathData && (
              <>
                <path
                  data-route-hit-target=""
                  data-screen-target-size={NAV_HIT.screenTargetSize}
                  d={pathData}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="24"
                  vectorEffect="non-scaling-stroke"
                  pointerEvents="stroke"
                />
                <circle
                  data-route-hit-target-core=""
                  data-screen-target-size={NAV_HIT.screenTargetSize}
                  cx={midpoint.x}
                  cy={midpoint.y}
                  r={NAV_HIT.radius * inverseScale}
                  fill="transparent"
                  pointerEvents="all"
                />
              </>
            )}
            {showTransitions && [
              segment.entryTransitionId && points[0] ? { kind: 'entry', id: segment.entryTransitionId, point: points[0] } : null,
              segment.exitTransitionId && points[points.length - 1] ? { kind: 'exit', id: segment.exitTransitionId, point: points[points.length - 1] } : null,
            ].filter(Boolean).map((transition) => (
              <g
                key={transition.kind}
                data-route-transition={transition.kind}
                data-transition-id={transition.id}
                transform={`translate(${transition.point.x} ${transition.point.y}) scale(${inverseScale})`}
                aria-hidden="true"
                pointerEvents="none"
              >
                <circle
                  {...obstacle(`route:${route.id}:transition:${segment.id}:${transition.kind}`)}
                  r="7"
                  fill="var(--viewer-surface-elevated, var(--color-semantic-background-elevated-normal))"
                  stroke="var(--viewer-muted, var(--color-semantic-label-neutral))"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  x="0"
                  y="0.5"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="var(--viewer-foreground, var(--color-semantic-label-strong))"
                  stroke="var(--viewer-surface, var(--color-semantic-background-normal-normal))"
                  strokeWidth="2.5"
                  paintOrder="stroke"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--caption2-size)', fontWeight: 'var(--fw-bold)' }}
                >
                  T
                </text>
              </g>
            ))}
            {disclosure.labelVisible && segment.label && (
              <NavigationAnnotationBlock
                id={`route:${route.id}:segment:${segment.id}:label`}
                kind="route-segment-label"
                anchor={midpoint}
                nudgeDirection="up"
                detailLevel={phase === 'current' ? 'overview' : phase === 'upcoming' ? 'standard' : 'detail'}
                priority={annotationPriority({
                  selected: segmentSelected,
                  focused: segmentFocused,
                  alarm: invalid || condition === 'blocked' || condition === 'conflict',
                  importance: phase === 'current'
                    ? ANNOTATION_IMPORTANCE['current-segment']
                    : phase === 'upcoming'
                      ? ANNOTATION_IMPORTANCE.context
                      : ANNOTATION_IMPORTANCE.background,
                })}
              >
                <text
                  data-route-segment-label=""
                  data-route-label-anchor-x={midpoint.x}
                  data-route-label-anchor-y={midpoint.y}
                  x="0"
                  y="-12"
                  textAnchor="middle"
                  transform={markerTransform(midpoint, inverseScale)}
                  fill="var(--viewer-foreground, var(--color-semantic-label-strong))"
                  stroke="var(--viewer-surface, var(--color-semantic-background-normal-normal))"
                  strokeWidth={NAV_LABEL_HALO.primary}
                  paintOrder="stroke"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--caption1-size)', fontWeight: 'var(--fw-bold)' }}
                  aria-hidden="true"
                  pointerEvents="none"
                >
                  {segment.label}
                </text>
              </NavigationAnnotationBlock>
            )}
          </g>
        );
      })}
    </g>
  );
}
