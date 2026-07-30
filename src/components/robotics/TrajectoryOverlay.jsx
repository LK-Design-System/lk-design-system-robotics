import React from 'react';
import {
  isNavigationGeometryCompatible,
  useNavigationCoordinateBoundary,
} from './NavigationCoordinateBoundary.jsx';
import { isFocusVisibleTarget } from './_NavigationFocus.js';
import {
  trajectoryProgressGeometry,
} from './_navigationProgressHead.js';
import {
  ANNOTATION_IMPORTANCE,
  NavigationAnnotationBlock,
  annotationPriority,
  useNavigationAnnotationDetailMode,
  useNavigationLabelDisclosure,
  useNavigationObstacles,
} from './_navigationAnnotations.js';
import { navStateOpacity, NAV_HIT, NAV_LABEL_HALO, NAV_FOCUS, NAV_SELECTION, NAV_LINE_ROLE, NAV_TRAJECTORY_SAMPLE } from './_navigationVocabulary.js';

const STATUS_LABEL = {
  planned: '계획됨',
  active: '이동 중',
  waiting: '대기 중',
  blocked: '차단됨',
  rerouting: '경로 재계산 중',
  completed: '완료됨',
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

// Lifecycle status must not change the Trajectory identity stroke. Exact status
// belongs to labels, accessible names, and detail surfaces. Invalid/stale are
// whole-dataset quality treatments, never point markers.
const TRAJECTORY_IDENTITY_TONE = 'var(--viewer-accent, var(--color-semantic-primary-normal))';

function trajectoryAccessibleName(
  trajectory,
  selected,
  focused,
  disabled,
  invalid,
  stale,
  showTimeCursor,
  playbackTimeMs,
) {
  const samples = trajectory?.samples ?? [];
  const currentIndex = Number.isInteger(trajectory?.currentSampleIndex)
    && trajectory.currentSampleIndex >= 0
    && trajectory.currentSampleIndex < samples.length
    ? trajectory.currentSampleIndex
    : undefined;
  const timedSamples = samples.filter((sample) => Number.isFinite(sample.timeMs));
  const firstTime = timedSamples[0]?.timeMs;
  const lastTime = timedSamples[timedSamples.length - 1]?.timeMs;
  const currentTime = Number.isFinite(playbackTimeMs)
    ? playbackTimeMs
    : currentIndex == null
      ? undefined
      : samples[currentIndex]?.timeMs;
  const parts = [
    trajectory.label ?? `궤적 ${trajectory.id}`,
    `지도 ${trajectory.mapId}`,
    STATUS_LABEL[trajectory.status] ?? trajectory.status,
    `sample ${samples.length}개`,
  ];
  if (firstTime != null && lastTime != null) parts.push(`시간 ${firstTime}에서 ${lastTime} 밀리초`);
  if (showTimeCursor && !Number.isFinite(playbackTimeMs) && currentIndex != null) {
    parts.push(`재생 sample ${currentIndex + 1}`);
  }
  if (showTimeCursor && currentTime != null) parts.push(`재생 시간 ${Math.round(currentTime)} 밀리초`);
  if (selected) parts.push('선택됨');
  if (focused) parts.push('포커스됨');
  if (disabled) parts.push('선택할 수 없음');
  if (invalid) parts.push('데이터 오류');
  if (stale) parts.push('오래된 데이터');
  return parts.join(', ');
}

function trajectoryTimeProgressGeometry(samples, finiteSamples, playbackTimeMs) {
  if (!Number.isFinite(playbackTimeMs)) return undefined;
  const timed = finiteSamples
    .map(({ sourceIndex, point }, pointIndex) => ({
      point,
      pointIndex,
      timeMs: samples[sourceIndex]?.timeMs,
    }))
    .filter(({ timeMs }) => Number.isFinite(timeMs));
  if (
    timed.length < 2
    || timed.some((sample, index) => index > 0 && sample.timeMs < timed[index - 1].timeMs)
  ) return undefined;

  const first = timed[0];
  const last = timed[timed.length - 1];
  const clampedTimeMs = Math.max(first.timeMs, Math.min(last.timeMs, playbackTimeMs));
  const exact = timed.find((sample) => sample.timeMs === clampedTimeMs);
  if (exact) {
    return {
      ...trajectoryProgressGeometry(finiteSamples.map(({ point }) => point), exact.pointIndex),
      playbackTimeMs: clampedTimeMs,
      exactPointIndex: exact.pointIndex,
    };
  }

  const upperIndex = timed.findIndex((sample) => sample.timeMs > clampedTimeMs);
  const lower = timed[Math.max(0, upperIndex - 1)];
  const upper = timed[upperIndex];
  if (!lower || !upper || upper.timeMs === lower.timeMs) return undefined;

  const ratio = (clampedTimeMs - lower.timeMs) / (upper.timeMs - lower.timeMs);
  const point = {
    x: lower.point.x + (upper.point.x - lower.point.x) * ratio,
    y: lower.point.y + (upper.point.y - lower.point.y) * ratio,
  };
  return {
    point,
    angle: Math.atan2(upper.point.y - lower.point.y, upper.point.x - lower.point.x) * 180 / Math.PI,
    prefixPoints: [...finiteSamples.slice(0, lower.pointIndex + 1).map(({ point: item }) => item), point],
    usesCarrier: false,
    playbackTimeMs: clampedTimeMs,
    exactPointIndex: -1,
  };
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
  showLabel,
  labelVisibility,
  detailVisibility,
  showTimeCursor = false,
  playbackTimeMs,
  onActivate,
  tabIndex,
  onFocus,
  onBlur,
  onPointerEnter,
  onPointerLeave,
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
  const {
    hovered,
    labelVisibility: resolvedLabelVisibility,
    detailVisibility: resolvedDetailVisibility,
    labelVisible,
    onPointerEnter: handleLabelPointerEnter,
    onPointerLeave: handleLabelPointerLeave,
  } = useNavigationLabelDisclosure({
    showLabel,
    labelVisibility,
    detailVisibility,
    selected,
    focused: focusVisible,
    priority: invalid
      || stale
      || trajectory?.status === 'blocked',
    hasDetails: false,
    onPointerEnter,
    onPointerLeave,
  });
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
  const visibleCurrentPointIndex = showTimeCursor ? currentPointIndex : -1;
  const timeProgress = Number.isFinite(playbackTimeMs)
    ? trajectoryTimeProgressGeometry(samples, finiteSamples, playbackTimeMs)
    : undefined;
  const currentProgress = timeProgress ?? (showTimeCursor
    ? trajectoryProgressGeometry(points, visibleCurrentPointIndex)
    : undefined);
  const cursorPointIndex = timeProgress?.exactPointIndex ?? visibleCurrentPointIndex;
  const markerPoint = currentProgress?.point ?? pointAlong(points, 0.5);
  const currentPrefixPath = currentProgress ? pathFromPoints(currentProgress.prefixPoints) : '';
  const statePoint = pointAlong(points, 0.12);
  // Sample visibility is capped so temporal density stays bounded.
  const sampleIndexes = visibleSampleIndexes(points.length, visibleCurrentPointIndex);
  const tone = invalid
    ? 'var(--viewer-danger, var(--color-semantic-status-negative-foreground))'
    : stale
      ? 'var(--viewer-warning, var(--color-semantic-status-cautionary-foreground))'
      : TRAJECTORY_IDENTITY_TONE;
  const foreground = 'var(--viewer-foreground, var(--color-semantic-label-strong))';
  const surface = 'var(--viewer-surface-elevated, var(--color-semantic-background-elevated-normal))';
  // Playback position is opt-in and never claims to be the physical robot
  // pose. Data quality applies to the complete dataset, so it changes the
  // complete stroke instead of attaching a point badge.

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
      data-playback-time-ms={timeProgress?.playbackTimeMs}
      data-time-cursor-visible={showTimeCursor ? 'true' : 'false'}
      data-viewport-scale={scale}
      data-pointer-only={pointerOnly ? 'true' : undefined}
      data-selected={selected ? 'true' : 'false'}
      data-focused={focusVisible ? 'true' : 'false'}
      data-disabled={disabled ? 'true' : 'false'}
      data-invalid={invalid ? 'true' : 'false'}
      data-stale={stale ? 'true' : 'false'}
      data-trajectory-quality={invalid ? 'invalid' : stale ? 'stale' : 'valid'}
      data-hovered={hovered ? 'true' : 'false'}
      data-label-visibility={resolvedLabelVisibility}
      data-label-visible={labelVisible ? 'true' : 'false'}
      data-detail-visibility={resolvedDetailVisibility}
      role={hiddenFromAccessibility ? undefined : interactive ? 'button' : 'img'}
      tabIndex={hiddenFromAccessibility ? undefined : interactive ? (disabled ? -1 : tabIndex ?? 0) : tabIndex}
      focusable={hiddenFromAccessibility ? 'false' : interactive ? 'true' : undefined}
      aria-hidden={hiddenFromAccessibility || undefined}
      aria-label={hiddenFromAccessibility
        ? undefined
        : ariaLabel ?? trajectoryAccessibleName(
          trajectory,
          selected,
          focused,
          disabled,
          invalid,
          stale,
          showTimeCursor,
          timeProgress?.playbackTimeMs,
        )}
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
      onPointerEnter={handleLabelPointerEnter}
      onPointerLeave={handleLabelPointerLeave}
      style={{
        cursor: disabled ? 'not-allowed' : interactive ? 'pointer' : 'default',
        opacity: navStateOpacity(disabled, false),
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
      {pathData && stale && !invalid && (
        <path
          data-trajectory-freshness-pulse=""
          d={pathData}
          fill="none"
          stroke={tone}
          strokeWidth={NAV_LINE_ROLE.trajectory.pulseWidth}
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
            : NAV_LINE_ROLE.trajectory.activeWidth}
          data-navigation-selection-geometry=""
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
        if (sampleIndex === cursorPointIndex) return null;
        const sample = points[sampleIndex];
        const sourceSample = samples[finiteSamples[sampleIndex]?.sourceIndex];
        const phase = !currentProgress
          ? 'planned'
          : timeProgress && Number.isFinite(sourceSample?.timeMs)
            ? sourceSample.timeMs < timeProgress.playbackTimeMs
              ? 'past'
              : 'future'
            : sampleIndex < visibleCurrentPointIndex
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
            opacity={phase === 'planned'
              ? 1
              : phase === 'past'
                ? NAV_TRAJECTORY_SAMPLE.pastOpacity
                : NAV_TRAJECTORY_SAMPLE.futureOpacity}
            vectorEffect="non-scaling-stroke"
            pointerEvents="none"
          />
        );
      })}
      {showTimeCursor && currentProgress && (
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
      {pathData && (
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
      {labelVisible && trajectory?.label && pathData && (
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
            data-trajectory-label-anchor-x={markerPoint.x}
            data-trajectory-label-anchor-y={markerPoint.y}
            x="0"
            y="-13"
            textAnchor="middle"
            transform={markerTransform(markerPoint, inverseScale)}
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
