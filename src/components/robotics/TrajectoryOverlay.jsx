import React from 'react';
import {
  isNavigationGeometryCompatible,
  useNavigationCoordinateBoundary,
} from './NavigationCoordinateBoundary.jsx';
import { isFocusVisibleTarget } from './_NavigationFocus.js';
import { NavigationStateGlyph } from './_NavigationStateGlyph.js';
import {
  trajectoryProgressGeometry,
} from './_navigationProgressHead.js';
import {
  ANNOTATION_IMPORTANCE,
  NavigationAnnotationBlock,
  annotationPriority,
  useNavigationAnnotationDetailMode,
  useNavigationObstacles,
} from './_navigationAnnotations.js';
import { navStateOpacity, NAV_DASH, NAV_PATH_DASH, NAV_HIT, NAV_STATE_BADGE, NAV_LABEL_HALO, NAV_FOCUS, NAV_SELECTION, NAV_LINE_ROLE, NAV_TRAJECTORY_SAMPLE } from './_navigationVocabulary.js';

const STATUS_LABEL = {
  planned: '계획됨',
  active: '이동 중',
  waiting: '대기 중',
  blocked: '차단됨',
  rerouting: '경로 재계산 중',
  completed: '완료됨',
};

const MARKER_GAP_PX = 4;
const MARKER_ROW_CLEARANCE_PX = 8;
const LABEL_ROW_GAP_PX = 12;
// Outline-inclusive footprints for the screen-slot collision layout — derived
// from the shared badge tokens (painted radius + half the outline stroke) so
// the layout can never underestimate what the circles actually paint.
const STATE_BADGE_FOOTPRINT_PX = NAV_STATE_BADGE.radius + NAV_STATE_BADGE.strokeWidth / 2;
const MARKER_RADIUS_PX = {
  invalid: STATE_BADGE_FOOTPRINT_PX,
  stale: STATE_BADGE_FOOTPRINT_PX,
};
function finitePoint(point) {
  return point && Number.isFinite(point.x) && Number.isFinite(point.y);
}

function pathFromPoints(points) {
  if (points.length < 2) return '';
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

function visibleSampleIndexes(sampleCount, currentIndex) {
  if (sampleCount <= NAV_TRAJECTORY_SAMPLE.maxVisible) {
    return Array.from({ length: sampleCount }, (_, index) => index);
  }
  const indexes = new Set();
  const step = (sampleCount - 1) / (NAV_TRAJECTORY_SAMPLE.maxVisible - 1);
  for (let index = 0; index < NAV_TRAJECTORY_SAMPLE.maxVisible; index += 1) {
    indexes.add(Math.round(index * step));
  }
  if (currentIndex >= 0) indexes.add(currentIndex);
  return [...indexes].sort((first, second) => first - second);
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

// Midpoint (+heading) of the longest polyline segment. The direction chevron
// anchors here instead of at a fixed path fraction: a fraction can land on a
// bend vertex, where the rotated chevron juts off the corner and reads as
// detached from its own line.
// Lifecycle status drives the line + head tone. `invalid` (a data-quality flag)
// is carried by its own red badge, not by repainting the whole path + progress
// head red — that stacked two red signals and made an invalid-but-active
// trajectory read like a blocked one.
function statusTone(status) {
  if (status === 'blocked') return 'var(--viewer-danger, var(--color-semantic-status-negative-foreground))';
  if (status === 'waiting' || status === 'rerouting') return 'var(--viewer-warning, var(--color-semantic-status-cautionary-foreground))';
  if (status === 'completed') return 'var(--viewer-positive, var(--color-semantic-status-positive-foreground))';
  if (status === 'active') return 'var(--viewer-accent, var(--color-semantic-primary-normal))';
  return 'var(--viewer-muted, var(--color-semantic-label-alternative))';
}

function statusDash(status) {
  if (status === 'planned') return NAV_PATH_DASH.pending;
  if (status === 'waiting') return NAV_PATH_DASH.waiting;
  if (status === 'blocked') return NAV_PATH_DASH.blocked;
  if (status === 'rerouting') return NAV_PATH_DASH.rerouting;
  if (status === 'completed') return NAV_PATH_DASH.completed;
  return undefined;
}

function trajectoryAccessibleName(trajectory, selected, focused, disabled, invalid, stale) {
  const samples = trajectory?.samples ?? [];
  const currentIndex = Number.isInteger(trajectory?.currentSampleIndex)
    && trajectory.currentSampleIndex >= 0
    && trajectory.currentSampleIndex < samples.length
    ? trajectory.currentSampleIndex
    : undefined;
  const timedSamples = samples.filter((sample) => Number.isFinite(sample.timeMs));
  const firstTime = timedSamples[0]?.timeMs;
  const lastTime = timedSamples[timedSamples.length - 1]?.timeMs;
  const currentTime = currentIndex == null ? undefined : samples[currentIndex]?.timeMs;
  const parts = [
    trajectory.label ?? `궤적 ${trajectory.id}`,
    `지도 ${trajectory.mapId}`,
    STATUS_LABEL[trajectory.status] ?? trajectory.status,
    `sample ${samples.length}개`,
  ];
  if (firstTime != null && lastTime != null) parts.push(`시간 ${firstTime}에서 ${lastTime} 밀리초`);
  if (currentIndex != null) parts.push(`현재 sample ${currentIndex + 1}`);
  if (currentTime != null) parts.push(`현재 시간 ${currentTime} 밀리초`);
  if (selected) parts.push('선택됨');
  if (focused) parts.push('포커스됨');
  if (disabled) parts.push('선택할 수 없음');
  if (invalid) parts.push('데이터 오류');
  if (stale) parts.push('오래된 데이터');
  return parts.join(', ');
}

function compactLabel(label, limit = 16) {
  if (typeof label !== 'string' || label.length <= limit) return label;
  return `${label.slice(0, limit - 1).trimEnd()}…`;
}

/** SVG fragment for one dense, single-map trajectory supplied by the runtime. */
export function TrajectoryOverlay({
  trajectory,
  viewportScale = 1,
  selected = false,
  focused = false,
  disabled = false,
  invalid = false,
  stale = false,
  showLabel = true,
  onActivate,
  tabIndex,
  onFocus,
  onBlur,
  onPointerDown,
  onMouseDown,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
  style,
  ...rest
}) {
  const [hasDomFocus, setHasDomFocus] = React.useState(false);
  const coordinateBoundary = useNavigationCoordinateBoundary();
  const annotationDetailMode = useNavigationAnnotationDetailMode();
  const obstacle = useNavigationObstacles();
  const scale = Number.isFinite(viewportScale) && viewportScale > 0 ? viewportScale : 1;
  const inverseScale = 1 / scale;
  const interactive = typeof onActivate === 'function';
  const hiddenFromAccessibility = ariaHidden === true || ariaHidden === 'true';
  const pointerOnly = interactive && hiddenFromAccessibility;
  const focusVisible = !hiddenFromAccessibility && (focused || hasDomFocus);
  const samples = trajectory?.samples ?? [];
  const finiteSamples = samples.map((sample, sourceIndex) => ({
    sourceIndex,
    point: sample.position,
  })).filter(({ point }) => finitePoint(point));
  const points = finiteSamples.map(({ point }) => point);
  const pathData = pathFromPoints(points);
  if (
    (trajectory?.source && trajectory.source.mapId !== trajectory.mapId)
    || !isNavigationGeometryCompatible(trajectory, coordinateBoundary)
  ) return null;
  if (points.length < 2) return null;
  const currentIndex = Number.isInteger(trajectory?.currentSampleIndex)
    && trajectory.currentSampleIndex >= 0
    && trajectory.currentSampleIndex < samples.length
    ? trajectory.currentSampleIndex
    : undefined;
  const currentPointIndex = currentIndex == null
    ? -1
    : finiteSamples.findIndex(({ sourceIndex }) => sourceIndex === currentIndex);
  const currentProgress = trajectoryProgressGeometry(points, currentPointIndex);
  const markerPoint = currentProgress?.point ?? pointAlong(points, 0.5);
  const currentPrefixPath = currentProgress ? pathFromPoints(currentProgress.prefixPoints) : '';
  const statePoint = pointAlong(points, 0.12);
  // Heading chevron anchor — longest-segment midpoint, so a trajectory without
  // a progress head still reads a travel direction, matching the Route/Lane
  // direction chevron.
  const sampleIndexes = visibleSampleIndexes(points.length, currentPointIndex);
  const tone = statusTone(trajectory?.status);
  const dash = statusDash(trajectory?.status);
  const foreground = 'var(--viewer-foreground, var(--color-semantic-label-strong))';
  const surface = 'var(--viewer-surface-elevated, var(--color-semantic-background-elevated-normal))';
  const trajectoryStateMarkers = [
    invalid ? {
      state: 'invalid',
      glyphKind: 'invalid',
      point: pointAlong(points, 0.8),
      tone: 'var(--viewer-danger, var(--color-semantic-status-negative-foreground))',
    } : null,
    stale ? {
      state: 'stale',
      glyphKind: 'stale',
      point: pointAlong(points, invalid ? 0.9 : 0.8),
      tone: 'var(--viewer-muted, var(--color-semantic-label-alternative))',
    } : null,
  ].filter(Boolean);
  // Lifecycle status lives on the LINE itself — tone plus the shared
  // NAV_PATH_DASH patterns (and the progress head for the current position).
  // Badges are point-vocabulary; the only glyph badges a trajectory keeps are
  // the data-quality flags (invalid/stale), whose one non-color channel is the
  // badge because the dash channel is already spent on status.
  const naturalMarkers = trajectoryStateMarkers.map((item) => ({
    name: item.state,
    point: item.point,
    radius: MARKER_RADIUS_PX[item.state],
  }));
  const fixedProgressMarkers = currentProgress ? [{
    name: 'current',
    point: currentProgress.point,
    radius: NAV_TRAJECTORY_SAMPLE.cursorCollisionRadius,
  }] : [];
  const markerLayout = markerCollisionLayout(naturalMarkers, scale, fixedProgressMarkers);
  const trajectoryMarkerSlot = (name) => markerLayout?.slots[name];
  const trajectoryLabelSlot = labelScreenSlot(markerPoint, markerLayout, scale);

  const activate = (event) => {
    if (disabled || !interactive) return;
    onActivate(trajectory.id, event);
  };

  const handleKeyDown = (event) => {
    if (!hiddenFromAccessibility) setHasDomFocus(true);
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    if (!interactive || disabled || event.repeat || pointerOnly) return;
    activate(event);
  };

  const handlePointerDown = (event) => {
    if (pointerOnly) event.preventDefault();
    onPointerDown?.(event);
  };

  const handleMouseDown = (event) => {
    if (pointerOnly) event.preventDefault();
    onMouseDown?.(event);
  };

  return (
    <g
      {...rest}
      data-lk-trajectory-overlay=""
      data-navigation-line-role="trajectory"
      data-line-encoding="temporal-samples"
      data-trajectory-id={trajectory?.id}
      data-map-id={trajectory?.mapId}
      data-source-frame-id={trajectory?.source?.frameId}
      data-source-map-version={trajectory?.source?.mapVersion}
      data-coordinate-space={trajectory?.coordinateSpace}
      data-trajectory-status={trajectory?.status}
      data-current-sample-index={currentIndex}
      data-viewport-scale={scale}
      data-trajectory-marker-layout={markerLayout ? 'screen-slots' : 'path-anchored'}
      data-trajectory-marker-row-width={markerLayout?.totalWidth}
      data-pointer-only={pointerOnly ? 'true' : undefined}
      data-selected={selected ? 'true' : 'false'}
      data-focused={focusVisible ? 'true' : 'false'}
      data-disabled={disabled ? 'true' : 'false'}
      data-invalid={invalid ? 'true' : 'false'}
      data-stale={stale ? 'true' : 'false'}
      role={hiddenFromAccessibility ? undefined : interactive ? 'button' : 'img'}
      tabIndex={hiddenFromAccessibility ? undefined : interactive ? (disabled ? -1 : tabIndex ?? 0) : tabIndex}
      focusable={hiddenFromAccessibility ? 'false' : interactive ? 'true' : undefined}
      aria-hidden={hiddenFromAccessibility || undefined}
      aria-label={hiddenFromAccessibility
        ? undefined
        : ariaLabel ?? trajectoryAccessibleName(trajectory, selected, focused, disabled, invalid, stale)}
      aria-pressed={!hiddenFromAccessibility && interactive ? selected : undefined}
      aria-disabled={!hiddenFromAccessibility && interactive && disabled ? true : undefined}
      aria-invalid={!hiddenFromAccessibility && invalid ? true : undefined}
      onClick={activate}
      onKeyDown={!hiddenFromAccessibility ? handleKeyDown : undefined}
      onPointerDown={pointerOnly || onPointerDown ? handlePointerDown : undefined}
      onMouseDown={pointerOnly || onMouseDown ? handleMouseDown : undefined}
      onFocus={!hiddenFromAccessibility ? (event) => {
        setHasDomFocus(isFocusVisibleTarget(event.currentTarget));
        onFocus?.(event);
      } : undefined}
      onBlur={!hiddenFromAccessibility ? (event) => {
        setHasDomFocus(false);
        onBlur?.(event);
      } : undefined}
      style={{
        cursor: disabled ? 'not-allowed' : interactive ? 'pointer' : 'default',
        opacity: navStateOpacity(disabled, stale),
        outline: 'none',
        ...style,
      }}
    >
      {focusVisible && pathData && (
        <path
          data-trajectory-focus-indicator=""
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
          data-trajectory-casing=""
          data-trajectory-selection-casing={selected ? '' : undefined}
          data-navigation-selection-geometry=""
          d={pathData}
          fill="none"
          stroke={surface}
          strokeWidth={selected ? NAV_SELECTION.pathCasingWidth : NAV_LINE_ROLE.trajectory.casingWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
      )}
      {pathData && (
        <path
          data-trajectory-path=""
          data-navigation-annotation-path-obstacle=""
          d={pathData}
          fill="none"
          stroke={tone}
          strokeWidth={selected
            ? NAV_SELECTION.trajectoryStrokeWidth
            : trajectory?.status === 'active'
              ? NAV_LINE_ROLE.trajectory.activeWidth
              : NAV_LINE_ROLE.trajectory.coreWidth}
          data-navigation-selection-geometry=""
          strokeDasharray={dash}
          opacity={currentProgress ? NAV_LINE_ROLE.trajectory.futureOpacity : undefined}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
      )}
      {currentProgress && currentPrefixPath && (
        <>
          <path
            data-trajectory-progress-casing=""
            d={currentPrefixPath}
            fill="none"
            stroke={surface}
            strokeWidth={NAV_LINE_ROLE.trajectory.casingWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            pointerEvents="none"
          />
          <path
            data-trajectory-progress-past=""
            d={currentPrefixPath}
            fill="none"
            stroke={tone}
            strokeWidth={NAV_LINE_ROLE.trajectory.activeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            pointerEvents="none"
          />
        </>
      )}
      {pathData && sampleIndexes.map((sampleIndex) => {
        if (sampleIndex === currentPointIndex) return null;
        const sample = points[sampleIndex];
        const phase = currentPointIndex < 0
          ? 'planned'
          : sampleIndex < currentPointIndex
            ? 'past'
            : 'future';
        return (
          <circle
            key={`sample-${sampleIndex}`}
            data-trajectory-sample=""
            data-sample-index={sampleIndex}
            data-sample-phase={phase}
            cx={sample.x}
            cy={sample.y}
            r={NAV_TRAJECTORY_SAMPLE.radius * inverseScale}
            fill={tone}
            stroke={surface}
            strokeWidth="0.75"
            opacity={phase === 'past'
              ? NAV_TRAJECTORY_SAMPLE.pastOpacity
              : NAV_TRAJECTORY_SAMPLE.futureOpacity}
            vectorEffect="non-scaling-stroke"
            pointerEvents="none"
          />
        );
      })}
      {currentProgress && (
        <g
          {...obstacle(`trajectory:${trajectory.id}:time-cursor`)}
          data-trajectory-time-cursor=""
          data-navigation-temporal-cursor="trajectory"
          data-trajectory-current-marker=""
          data-trajectory-anchor-x={currentProgress.point.x}
          data-trajectory-anchor-y={currentProgress.point.y}
          transform={`translate(${currentProgress.point.x} ${currentProgress.point.y}) scale(${inverseScale})`}
          aria-hidden="true"
          pointerEvents="none"
        >
          <circle
            data-trajectory-cursor-surface=""
            r={NAV_TRAJECTORY_SAMPLE.cursorOuterRadius}
            fill={surface}
            stroke={tone}
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
          <circle
            data-trajectory-cursor-core=""
            r={NAV_TRAJECTORY_SAMPLE.cursorInnerRadius}
            fill={tone}
          />
        </g>
      )}
      {pathData && interactive && (
        <>
          <path
            data-trajectory-hit-target=""
            data-screen-target-size={NAV_HIT.screenTargetSize}
            d={pathData}
            fill="none"
            stroke="transparent"
            strokeWidth="24"
            vectorEffect="non-scaling-stroke"
            pointerEvents="stroke"
          />
          <circle
            data-trajectory-hit-target-core=""
            data-trajectory-actual-hit-core=""
            data-screen-target-size={NAV_HIT.screenTargetSize}
            data-screen-target-diameter="35"
            cx={statePoint.x}
            cy={statePoint.y}
            r={NAV_HIT.radius * inverseScale}
            fill="transparent"
            pointerEvents="all"
          />
        </>
      )}
      {/* The progress head already points the travel direction — one arrow per
          line, so the chevron renders only on head-less trajectories. */}
      {pathData && trajectoryStateMarkers.map((item) => {
        const point = item.point;
        const stateSlot = trajectoryMarkerSlot(item.state);
        return (
          <g
            key={item.state}
            data-trajectory-overlay-state={item.state}
            data-trajectory-screen-slot={stateSlot ? item.state : undefined}
            data-trajectory-anchor-x={point.x}
            data-trajectory-anchor-y={point.y}
            transform={markerTransform(point, inverseScale, stateSlot)}
            aria-hidden="true"
            pointerEvents="none"
          >
            <circle
              {...obstacle(`trajectory:${trajectory.id}:state:${item.state}`)}
              data-trajectory-marker-badge={item.state}
              data-navigation-marker-circle=""
              r={NAV_STATE_BADGE.radius}
              fill={surface}
              stroke={item.tone}
              strokeWidth={NAV_STATE_BADGE.strokeWidth}
              strokeDasharray={item.state === 'stale' ? NAV_DASH.staleRing : undefined}
              vectorEffect="non-scaling-stroke"
            />
            <NavigationStateGlyph kind={item.glyphKind} size={10} color={foreground} />
          </g>
        );
      })}
      {showLabel && trajectory?.label && pathData && (
        <NavigationAnnotationBlock
          id={`trajectory:${trajectory.id}:label`}
          kind="trajectory-label"
          anchor={markerPoint}
          nudgeDirection="up"
          detailLevel={trajectory?.status === 'active' ? 'overview' : 'standard'}
          priority={annotationPriority({
            selected,
            focused: focusVisible,
            alarm: invalid || trajectory?.status === 'blocked',
            importance: trajectory?.status === 'active'
              ? ANNOTATION_IMPORTANCE['active-trajectory']
              : ANNOTATION_IMPORTANCE.background,
          })}
        >
          <text
            data-trajectory-label=""
            data-trajectory-screen-row={trajectoryLabelSlot ? 'label' : undefined}
            data-trajectory-label-anchor-x={markerPoint.x}
            data-trajectory-label-anchor-y={markerPoint.y}
            x="0"
            y={trajectoryLabelSlot ? 0 : -13}
            textAnchor="middle"
            transform={markerTransform(markerPoint, inverseScale, trajectoryLabelSlot)}
            fill={foreground}
            stroke={surface}
            strokeWidth={NAV_LABEL_HALO.primary}
            strokeLinejoin="round"
            paintOrder="stroke"
            vectorEffect="non-scaling-stroke"
            fontFamily="var(--font-sans)"
            fontSize="var(--caption1-size)"
            fontWeight="var(--fw-bold)"
            aria-hidden="true"
            pointerEvents="none"
          >
            {annotationDetailMode == null || annotationDetailMode === 'detail'
              ? trajectory.label
              : compactLabel(trajectory.label)}
          </text>
        </NavigationAnnotationBlock>
      )}
    </g>
  );
}
