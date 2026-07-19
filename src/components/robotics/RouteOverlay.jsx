import React from 'react';
import { isFocusVisibleTarget } from './_NavigationFocus.js';
import { NavigationStateGlyph } from './_NavigationStateGlyph.js';
import { NAVIGATION_DIRECTION_PATH } from './_navigationVectorGlyph.js';
import {
  NavigationProgressHeadDefs,
  ProgressHeadObstacle,
  progressCarrierPath,
  routeProgressGeometry,
} from './_navigationProgressHead.js';
import { NavigationAnnotationBlock, annotationPriority, useNavigationObstacles } from './_navigationAnnotations.js';
import { navStateOpacity, NAV_DASH, NAV_HIT, NAV_STATE_BADGE, NAV_PROGRESS_HEAD, NAV_LABEL_HALO, NAV_FOCUS, NAV_SELECTION } from './_navigationVocabulary.js';

const STATUS_LABEL = {
  planned: '계획됨',
  active: '이동 중',
  waiting: '대기 중',
  blocked: '차단됨',
  rerouting: '경로 재계산 중',
  completed: '완료됨',
};

const STATUS_GLYPH_KIND = {
  planned: 'planned',
  active: 'active',
  waiting: 'waiting',
  blocked: 'blocked',
  rerouting: 'rerouting',
  completed: 'completed',
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

const CONDITION_GLYPH_KIND = {
  waiting: 'waiting',
  blocked: 'blocked',
  conflict: 'conflict',
};

const MARKER_GAP_PX = 4;
const MARKER_ROW_CLEARANCE_PX = 8;
const LABEL_ROW_GAP_PX = 12;
const STATE_BADGE_FOOTPRINT_PX = NAV_STATE_BADGE.radius + NAV_STATE_BADGE.strokeWidth / 2;
const MARKER_RADIUS_PX = {
  condition: 8.75,
  status: STATE_BADGE_FOOTPRINT_PX,
  invalid: 8.75,
  stale: 8.75,
};

function finitePoint(point) {
  return point && Number.isFinite(point.x) && Number.isFinite(point.y);
}

function pathFromPoints(points) {
  if (points.length < 2) return '';
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

function markerTransform(point, inverseScale, screenSlot) {
  const anchor = `translate(${point.x} ${point.y}) scale(${inverseScale})`;
  return screenSlot ? `${anchor} translate(${screenSlot.x} ${screenSlot.y})` : anchor;
}

function markerCollisionLayout(markers, scale, fixedMarkers = []) {
  const candidates = [...markers, ...fixedMarkers];
  if (candidates.length < 2) return undefined;
  const collisionParticipants = new Set();
  const collidingMovableIndexes = new Set();
  for (let first = 0; first < candidates.length; first += 1) {
    for (let second = first + 1; second < candidates.length; second += 1) {
      const a = candidates[first];
      const b = candidates[second];
      const naturalDistance = Math.hypot(
        a.point.x - b.point.x,
        a.point.y - b.point.y,
      ) * scale;
      if (naturalDistance < a.radius + b.radius + MARKER_GAP_PX) {
        collisionParticipants.add(first);
        collisionParticipants.add(second);
        if (first < markers.length) collidingMovableIndexes.add(first);
        if (second < markers.length) collidingMovableIndexes.add(second);
      }
    }
  }
  if (collidingMovableIndexes.size === 0) return undefined;

  const collisionMarkers = [...collisionParticipants].map((index) => candidates[index]);
  const reference = collisionMarkers.reduce((point, marker) => ({
    x: point.x + marker.point.x / collisionMarkers.length,
    y: point.y + marker.point.y / collisionMarkers.length,
  }), { x: 0, y: 0 });
  const maxRadius = Math.max(...markers.map((marker) => marker.radius));
  const totalWidth = markers.reduce((width, marker) => width + marker.radius * 2, 0)
    + MARKER_GAP_PX * (markers.length - 1);
  const rowY = -(maxRadius + MARKER_ROW_CLEARANCE_PX);
  const slots = {};
  let cursor = -totalWidth / 2;
  markers.forEach((marker) => {
    const centerX = cursor + marker.radius;
    slots[marker.name] = {
      x: (reference.x - marker.point.x) * scale + centerX,
      y: (reference.y - marker.point.y) * scale + rowY,
    };
    cursor += marker.radius * 2 + MARKER_GAP_PX;
  });
  return {
    reference,
    slots,
    totalWidth,
    labelY: rowY - maxRadius - LABEL_ROW_GAP_PX,
  };
}

function labelScreenSlot(point, layout, scale) {
  if (!layout) return undefined;
  return {
    x: (layout.reference.x - point.x) * scale,
    y: (layout.reference.y - point.y) * scale + layout.labelY,
  };
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

function normalizedProgress(route) {
  if (!route?.progress) return undefined;
  return {
    segmentId: route.progress.segmentId,
    fraction: Math.max(0, Math.min(1, Number(route.progress.fraction) || 0)),
    position: finitePoint(route.progress.position) ? route.progress.position : undefined,
  };
}

function statusTone(status) {
  if (status === 'waiting' || status === 'rerouting') return 'var(--viewer-warning, var(--color-semantic-status-cautionary-foreground))';
  if (status === 'blocked') return 'var(--viewer-danger, var(--color-semantic-status-negative-foreground))';
  if (status === 'completed') return 'var(--viewer-positive, var(--color-semantic-status-positive-foreground))';
  if (status === 'active') return 'var(--viewer-accent, var(--color-semantic-primary-normal))';
  return 'var(--viewer-muted, var(--color-semantic-label-alternative))';
}

function segmentTone(segment, invalid) {
  if (invalid || segment.condition === 'blocked' || segment.condition === 'conflict') {
    return 'var(--viewer-danger, var(--color-semantic-status-negative-foreground))';
  }
  if (segment.condition === 'waiting') return 'var(--viewer-warning, var(--color-semantic-status-cautionary-foreground))';
  if (segment.phase === 'completed') return 'var(--viewer-positive, var(--color-semantic-status-positive-foreground))';
  if (segment.phase === 'current') return 'var(--viewer-accent, var(--color-semantic-primary-normal))';
  return 'var(--viewer-muted, var(--color-semantic-label-alternative))';
}

function segmentDash(segment) {
  if (segment.condition === 'waiting') return '10 3 2 3';
  if (segment.condition === 'blocked') return '1 5';
  if (segment.condition === 'conflict') return '5 3 1 3';
  if (segment.phase === 'completed') return '7 4';
  if (segment.phase === 'upcoming') return '2 6';
  return undefined;
}

function routeAccessibleName(route, progress, selected, focused, disabled, invalid, stale) {
  const parts = [
    route.label ?? `경로 ${route.id}`,
    STATUS_LABEL[route.status] ?? route.status,
  ];
  if (progress) parts.push(`현재 구간 ${Math.round(progress.fraction * 100)}%`);
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
  showLabel = true,
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
  const [hasRootFocus, setHasRootFocus] = React.useState(false);
  const obstacle = useNavigationObstacles();
  const progressHeadId = `lk-route-progress-${React.useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const scale = Number.isFinite(viewportScale) && viewportScale > 0 ? viewportScale : 1;
  const inverseScale = 1 / scale;
  const interactive = typeof onActivate === 'function';
  const hiddenFromAccessibility = ariaHidden === true || ariaHidden === 'true';
  const pointerOnly = interactive && hiddenFromAccessibility;
  const visibleSegments = (route?.segments ?? []).filter((segment) => (
    segment.mapId === activeMapId
    && (segment.points ?? []).filter(finitePoint).length >= 2
  ));
  const routeProgress = normalizedProgress(route);
  const progressSegment = routeProgress
    ? visibleSegments.find((segment) => segment.id === routeProgress.segmentId)
    : undefined;
  // Progress belongs to one concrete segment. Once map filtering removes that
  // segment, neither the accessibility name nor diagnostic data may imply that
  // its progress is visible on the active map.
  const progress = progressSegment ? routeProgress : undefined;
  const baseAccessibleName = ariaLabel
    ?? routeAccessibleName(route, progress, selected, focused, disabled, invalid, stale);

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

  const statusSegment = progressSegment
    ?? visibleSegments.find((segment) => segment.phase === 'current')
    ?? visibleSegments[0];
  const statusPoints = statusSegment?.points?.filter(finitePoint) ?? [];
  const progressGeometry = progressSegment
    ? routeProgressGeometry(statusPoints, progress.fraction, progress.position, scale)
    : undefined;
  const progressPoint = progressGeometry?.point;
  const progressHeadVisible = Number.isFinite(progressGeometry?.angle);
  const progressPrefixPath = progressGeometry ? pathFromPoints(progressGeometry.prefixPoints) : '';
  const progressCarrier = progressHeadVisible && progressGeometry?.usesCarrier
    ? progressCarrierPath(progressGeometry.point, progressGeometry.angle, inverseScale)
    : '';
  const routeStatusPoint = pointAlong(statusPoints, 0.18);
  const statusCondition = ['normal', 'waiting', 'blocked', 'conflict'].includes(statusSegment?.condition)
    ? statusSegment.condition
    : 'normal';
  const statusMidpoint = pointAlong(statusPoints, 0.5);
  const routeStateMarkers = [
    invalid ? {
      state: 'invalid',
      glyphKind: 'invalid',
      point: pointAlong(statusPoints, 0.82),
      tone: 'var(--viewer-danger, var(--color-semantic-status-negative-foreground))',
    } : null,
    stale ? {
      state: 'stale',
      glyphKind: 'stale',
      point: pointAlong(statusPoints, invalid ? 0.9 : 0.82),
      tone: 'var(--viewer-muted, var(--color-semantic-label-alternative))',
    } : null,
  ].filter(Boolean);
  const naturalMarkers = statusPoints.length >= 2 ? [
    CONDITION_GLYPH_KIND[statusCondition]
      ? { name: 'condition', point: statusMidpoint, radius: MARKER_RADIUS_PX.condition }
      : null,
    { name: 'status', point: routeStatusPoint, radius: MARKER_RADIUS_PX.status },
    ...routeStateMarkers.map((item) => ({
      name: item.state,
      point: item.point,
      radius: MARKER_RADIUS_PX[item.state],
    })),
  ].filter(Boolean) : [];
  const fixedProgressMarkers = progressHeadVisible ? [{
    name: 'progress',
    point: progressPoint,
    radius: NAV_PROGRESS_HEAD.collisionRadius,
  }] : [];
  const markerLayout = markerCollisionLayout(naturalMarkers, scale, fixedProgressMarkers);
  const routeMarkerSlot = (name) => markerLayout?.slots[name];
  const markerForeground = 'var(--viewer-foreground, var(--color-semantic-label-strong))';
  const surface = 'var(--viewer-surface-elevated, var(--color-semantic-background-elevated-normal))';

  return (
    <g
      {...rest}
      data-lk-route-overlay=""
      data-route-id={route?.id}
      data-active-map-id={activeMapId}
      data-route-status={route?.status}
      data-visible-segment-count={visibleSegments.length}
      data-viewport-scale={scale}
      data-progress-segment-id={progress?.segmentId}
      data-progress-fraction={progress?.fraction}
      data-progress-position-mismatch={progressGeometry?.positionMismatch ? 'true' : undefined}
      data-route-marker-layout={markerLayout ? 'screen-slots' : 'path-anchored'}
      data-route-marker-row-width={markerLayout?.totalWidth}
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
      style={{ opacity: navStateOpacity(disabled, stale), outline: 'none', ...style }}
    >
      {visibleSegments.map((segment) => {
        const points = (segment.points ?? []).filter(finitePoint);
        const pathData = pathFromPoints(points);
        const midpoint = pointAlong(points, 0.5);
        const directionPoint = pointAlong(points, 0.7);
        const segmentSelected = selected || segment.id === selectedSegmentId;
        const segmentFocused = !pointerOnly && (focused || hasRootFocus || focusedSegment === segment.id);
        const condition = ['normal', 'waiting', 'blocked', 'conflict'].includes(segment.condition)
          ? segment.condition
          : 'normal';
        const phase = ['completed', 'current', 'upcoming'].includes(segment.phase)
          ? segment.phase
          : 'upcoming';
        const normalizedSegment = { ...segment, condition, phase };
        const tone = segmentTone(normalizedSegment, invalid);
        const dash = segmentDash(normalizedSegment);
        const isProgressSegment = segment.id === progressSegment?.id && Boolean(progressGeometry);
        const conditionGlyphKind = CONDITION_GLYPH_KIND[condition];
        const conditionSlot = segment.id === statusSegment?.id ? routeMarkerSlot('condition') : undefined;
        const segmentLabelSlot = segment.id === statusSegment?.id
          ? labelScreenSlot(midpoint, markerLayout, scale)
          : undefined;
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
            {segmentSelected && pathData && (
              <path
                data-route-selection-halo=""
                d={pathData}
                fill="none"
                stroke="var(--viewer-accent, var(--color-semantic-primary-normal))"
                strokeWidth={NAV_SELECTION.routeHaloWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={NAV_SELECTION.haloOpacity}
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
              />
            )}
            {pathData && !segmentSelected && !segmentFocused && (
              <path
                data-route-casing=""
                d={pathData}
                fill="none"
                stroke="var(--viewer-surface-elevated, var(--color-semantic-background-elevated-normal))"
                strokeWidth="6.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
              />
            )}
            {pathData && (
              <path
                data-route-path=""
                d={pathData}
                fill="none"
                stroke={tone}
                strokeWidth={isProgressSegment ? 3 : phase === 'current' || segmentSelected ? 4 : 3}
                strokeDasharray={dash}
                opacity={isProgressSegment ? NAV_PROGRESS_HEAD.route.futureOpacity : undefined}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
              />
            )}
            {isProgressSegment && progressHeadVisible && (
              <NavigationProgressHeadDefs
                idPrefix={progressHeadId}
                tone={tone}
                surface={surface}
                inverseScale={inverseScale}
                role="route"
              />
            )}
            {isProgressSegment && progressPrefixPath && (
              <>
                <path
                  data-route-progress-casing=""
                  d={progressPrefixPath}
                  fill="none"
                  stroke={surface}
                  strokeWidth={NAV_PROGRESS_HEAD.route.casingWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  markerEnd={progressHeadVisible && !progressCarrier ? `url(#${progressHeadId}-casing)` : undefined}
                  pointerEvents="none"
                />
                <path
                  data-route-progress-past=""
                  data-route-progress-marker={progressHeadVisible && !progressCarrier ? '' : undefined}
                  data-navigation-progress-head={progressHeadVisible && !progressCarrier ? 'route' : undefined}
                  data-head-rendering={progressHeadVisible && !progressCarrier ? 'marker-end' : undefined}
                  data-current-segment-id={progressHeadVisible && !progressCarrier ? progressSegment.id : undefined}
                  data-route-anchor-x={progressHeadVisible && !progressCarrier ? progressPoint.x : undefined}
                  data-route-anchor-y={progressHeadVisible && !progressCarrier ? progressPoint.y : undefined}
                  d={progressPrefixPath}
                  fill="none"
                  stroke={tone}
                  strokeWidth={NAV_PROGRESS_HEAD.route.coreWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  markerEnd={progressHeadVisible && !progressCarrier ? `url(#${progressHeadId}-core)` : undefined}
                  pointerEvents="none"
                />
              </>
            )}
            {isProgressSegment && progressCarrier && (
              <>
                <path
                  data-route-progress-carrier="casing"
                  data-route-progress-casing=""
                  d={progressCarrier}
                  fill="none"
                  stroke={surface}
                  strokeWidth={NAV_PROGRESS_HEAD.route.casingWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  markerEnd={`url(#${progressHeadId}-casing)`}
                  pointerEvents="none"
                />
                <path
                  data-route-progress-carrier="core"
                  data-route-progress-marker=""
                  data-navigation-progress-head="route"
                  data-head-rendering="marker-end"
                  data-current-segment-id={progressSegment.id}
                  data-route-anchor-x={progressPoint.x}
                  data-route-anchor-y={progressPoint.y}
                  d={progressCarrier}
                  fill="none"
                  stroke={tone}
                  strokeWidth={NAV_PROGRESS_HEAD.route.coreWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  markerEnd={`url(#${progressHeadId}-core)`}
                  pointerEvents="none"
                />
              </>
            )}
            {pathData && interactive && (
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
            {pathData && (
              <path
                data-route-direction=""
                data-navigation-vector-glyph="direction"
                d={NAVIGATION_DIRECTION_PATH}
                transform={`translate(${directionPoint.x} ${directionPoint.y}) rotate(${directionPoint.angle}) scale(${inverseScale})`}
                fill={tone}
                stroke="var(--viewer-surface-elevated, var(--color-semantic-background-elevated-normal))"
                strokeWidth="1"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
              />
            )}
            {conditionGlyphKind && (
              <g
                data-route-condition-glyph={condition}
                data-route-screen-slot={conditionSlot ? 'condition' : undefined}
                data-route-anchor-x={midpoint.x}
                data-route-anchor-y={midpoint.y}
                transform={markerTransform(midpoint, inverseScale, conditionSlot)}
                aria-hidden="true"
                pointerEvents="none"
              >
                <circle
                  {...obstacle(`route:${route.id}:condition:${segment.id}`)}
                  data-route-marker-badge="condition"
                  data-navigation-marker-circle=""
                  r={NAV_STATE_BADGE.radius}
                  fill="var(--viewer-surface-elevated, var(--color-semantic-background-elevated-normal))"
                  stroke={tone}
                  strokeWidth={NAV_STATE_BADGE.strokeWidth}
                  vectorEffect="non-scaling-stroke"
                />
                <NavigationStateGlyph kind={conditionGlyphKind} size={10} color={markerForeground} />
              </g>
            )}
            {[
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
            {showLabel && segment.label && (
              <NavigationAnnotationBlock
                id={`route:${route.id}:segment:${segment.id}:label`}
                kind="route-segment-label"
                anchor={midpoint}
                nudgeDirection="up"
                priority={annotationPriority({
                  selected: segmentSelected,
                  focused: segmentFocused,
                  alarm: invalid || condition === 'blocked' || condition === 'conflict',
                  emphasized: phase === 'current',
                })}
              >
                <text
                  data-route-segment-label=""
                  data-route-screen-row={segmentLabelSlot ? 'label' : undefined}
                  data-route-label-anchor-x={midpoint.x}
                  data-route-label-anchor-y={midpoint.y}
                  x="0"
                  y={segmentLabelSlot ? 0 : -12}
                  textAnchor="middle"
                  transform={markerTransform(midpoint, inverseScale, segmentLabelSlot)}
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
      {statusPoints.length >= 2 && routeStateMarkers.map((item) => {
        const point = item.point;
        const stateSlot = routeMarkerSlot(item.state);
        return (
          <g
            key={item.state}
            data-route-overlay-state={item.state}
            data-route-screen-slot={stateSlot ? item.state : undefined}
            data-route-anchor-x={point.x}
            data-route-anchor-y={point.y}
            transform={markerTransform(point, inverseScale, stateSlot)}
            aria-hidden="true"
            pointerEvents="none"
          >
            <circle
              {...obstacle(`route:${route.id}:state:${item.state}`)}
              data-route-marker-badge={item.state}
              data-navigation-marker-circle=""
              r={NAV_STATE_BADGE.radius}
              fill="var(--viewer-surface-elevated, var(--color-semantic-background-elevated-normal))"
              stroke={item.tone}
              strokeWidth={NAV_STATE_BADGE.strokeWidth}
              strokeDasharray={item.state === 'stale' ? NAV_DASH.staleRing : undefined}
              vectorEffect="non-scaling-stroke"
            />
            <NavigationStateGlyph kind={item.glyphKind} size={10} color={markerForeground} />
          </g>
        );
      })}
      {progressHeadVisible && (
        <ProgressHeadObstacle
          obstacle={obstacle}
          id={`route:${route.id}:progress-head`}
          point={progressPoint}
          angle={progressGeometry.angle}
          inverseScale={inverseScale}
          dataPrefix="route"
        />
      )}
      {statusSegment && statusPoints.length >= 2 && (
        <g
          data-route-status-marker=""
          data-route-screen-slot={routeMarkerSlot('status') ? 'status' : undefined}
          data-route-anchor-x={routeStatusPoint.x}
          data-route-anchor-y={routeStatusPoint.y}
          transform={markerTransform(routeStatusPoint, inverseScale, routeMarkerSlot('status'))}
          aria-hidden="true"
          pointerEvents="none"
        >
          <circle
            {...obstacle(`route:${route.id}:status`)}
            data-route-marker-badge="status"
            data-navigation-marker-circle=""
            r={NAV_STATE_BADGE.radius}
            fill={surface}
            stroke={statusTone(route.status)}
            strokeWidth={NAV_STATE_BADGE.strokeWidth}
            vectorEffect="non-scaling-stroke"
          />
          <NavigationStateGlyph
            kind={STATUS_GLYPH_KIND[route.status] ?? 'unknown'}
            size={10}
            color={markerForeground}
          />
        </g>
      )}
      {showLabel && progressPoint && (
        <NavigationAnnotationBlock
          id={`route:${route.id}:progress:label`}
          kind="route-progress-label"
          anchor={progressPoint}
          nudgeDirection="down"
          priority={annotationPriority({
            selected,
            focused: focused || hasRootFocus || focusedSegment != null,
            alarm: invalid,
            emphasized: route.status === 'active',
          })}
        >
          <text
            data-route-progress-label=""
            data-route-label-anchor-x={progressPoint.x}
            data-route-label-anchor-y={progressPoint.y}
            x="0"
            y="24"
            textAnchor="middle"
            transform={markerTransform(progressPoint, inverseScale)}
            fill="var(--viewer-foreground, var(--color-semantic-label-strong))"
            stroke="var(--viewer-surface, var(--color-semantic-background-normal-normal))"
            strokeWidth={NAV_LABEL_HALO.caption}
            paintOrder="stroke"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--caption2-size)', fontWeight: 'var(--fw-bold)' }}
            aria-hidden="true"
            pointerEvents="none"
          >
            현재 {Math.round(progress.fraction * 100)}%
          </text>
        </NavigationAnnotationBlock>
      )}
    </g>
  );
}
