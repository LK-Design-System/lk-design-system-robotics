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
  useNavigationLabelDisclosure,
  useNavigationObstacles,
} from './_navigationAnnotations.js';
import {
  NAV_FOCUS,
  NAV_HIT,
  NAV_LABEL_HALO,
  NAV_SELECTION,
  navStateOpacity,
} from './_navigationVocabulary.js';

const STATE_LABEL = {
  moving: '이동 중',
  idle: '정지',
  paused: '일시 정지',
  fault: '오류',
  offline: '오프라인',
  unknown: '상태 미확인',
};

const BODY_RADIUS = 10;
const FOCUS_RADIUS = 17;

const BADGE_PRESENTATION = {
  idle: {
    tone: 'var(--viewer-muted, var(--color-semantic-label-neutral))',
    glyph: 'var(--viewer-surface, var(--color-semantic-static-white))',
  },
  paused: {
    tone: 'var(--viewer-warning, var(--color-semantic-status-cautionary-foreground))',
    glyph: 'var(--color-semantic-static-black)',
  },
  fault: {
    tone: 'var(--viewer-danger, var(--color-semantic-status-negative-foreground))',
    glyph: 'var(--color-semantic-static-white)',
  },
  invalid: {
    tone: 'var(--viewer-danger, var(--color-semantic-status-negative-foreground))',
    glyph: 'var(--color-semantic-static-white)',
  },
  offline: {
    tone: 'var(--viewer-muted, var(--color-semantic-label-alternative))',
    glyph: 'var(--viewer-surface, var(--color-semantic-static-white))',
  },
  stale: {
    tone: 'var(--viewer-muted, var(--color-semantic-label-alternative))',
    glyph: 'var(--viewer-surface, var(--color-semantic-static-white))',
  },
  unknown: {
    tone: 'var(--viewer-warning, var(--color-semantic-status-cautionary-foreground))',
    glyph: 'var(--color-semantic-static-black)',
  },
};

function normalizeViewportScale(value) {
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function headingDegrees(value) {
  return Number.isFinite(value) ? value * 180 / Math.PI : 0;
}

function statusBadgeKind(state, invalid, stale) {
  if (invalid) return 'invalid';
  if (state === 'fault') return 'fault';
  if (state === 'offline') return 'offline';
  if (stale) return 'stale';
  if (state === 'paused') return 'paused';
  if (state === 'idle') return 'idle';
  if (state === 'unknown') return 'unknown';
  return undefined;
}

function accessibleName(pose, stateLabel, {
  selected,
  focused,
  disabled,
  invalid,
  stale,
}) {
  return [
    pose.label,
    `지도 ${pose.mapId}`,
    stateLabel,
    `방향 ${Math.round(headingDegrees(pose.headingRad))}도`,
    selected && '선택됨',
    focused && '포커스됨',
    disabled && '선택할 수 없음',
    invalid && '데이터 오류',
    stale && '오래된 데이터',
  ].filter(Boolean).join(', ');
}

/**
 * Renderer-neutral robot pose marker for a 2D navigation map.
 *
 * The owning map supplies the SVG root and world transform. Position follows
 * world coordinates, while the marker, hit target, focus ring, and label remain
 * screen-legible through `viewportScale`.
 */
export function RobotPoseMarker({
  pose,
  context = 'live',
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
  role,
  tabIndex,
  onFocus,
  onBlur,
  onPointerEnter,
  onPointerLeave,
  onMouseDown,
  style,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
  ...rest
}) {
  const [hasDomFocus, setHasDomFocus] = React.useState(false);
  const coordinateBoundary = useNavigationCoordinateBoundary();
  const obstacle = useNavigationObstacles();
  const scale = normalizeViewportScale(viewportScale);
  const inverseScale = 1 / scale;
  const interactive = typeof onActivate === 'function';
  const pointerOnly = ariaHidden === true || ariaHidden === 'true';
  const focusVisible = !pointerOnly && (focused || hasDomFocus);
  const poseContext = context === 'replay' ? 'replay' : 'live';
  const state = STATE_LABEL[pose.state] ? pose.state : 'unknown';
  const stateLabel = poseContext === 'replay' ? '기록 재생' : STATE_LABEL[state];
  const angle = headingDegrees(pose.headingRad);
  const label = ariaLabel ?? accessibleName(pose, stateLabel, {
    selected,
    focused: focusVisible,
    disabled,
    invalid,
    stale,
  });
  const surface = 'var(--viewer-surface, var(--color-semantic-background-normal-normal))';
  const foreground = 'var(--viewer-foreground, var(--color-semantic-label-strong))';
  const muted = 'var(--viewer-muted, var(--color-semantic-label-neutral))';
  const fleetColor = pose.color ?? 'var(--color-semantic-primary-normal)';
  const badgeKind = statusBadgeKind(state, invalid, stale);
  const badge = BADGE_PRESENTATION[badgeKind];
  const motionVisible = poseContext !== 'replay' && state === 'moving' && !disabled && !invalid && !stale;
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
    focused: focusVisible,
    priority: ['fault', 'invalid', 'offline', 'stale'].includes(badgeKind),
    hasDetails: true,
    onPointerEnter,
    onPointerLeave,
  });
  const localizationEllipse = pose?.localization?.ellipse;
  const ellipseVisible = Number.isFinite(localizationEllipse?.majorRadius)
    && localizationEllipse.majorRadius > 0
    && Number.isFinite(localizationEllipse?.minorRadius)
    && localizationEllipse.minorRadius > 0;
  const ellipseAngle = ellipseVisible
    ? headingDegrees(localizationEllipse.headingRad)
    : 0;

  const activate = (event) => {
    if (disabled || !interactive) return;
    onActivate(pose.id, event);
  };

  const handleKeyDown = (event) => {
    if (!pointerOnly) setHasDomFocus(true);
    if (pointerOnly || disabled || !interactive || event.repeat) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    activate(event);
  };

  if (
    (pose?.source && pose.source.mapId !== pose.mapId)
    || !isNavigationGeometryCompatible(pose, coordinateBoundary)
  ) return null;

  return (
    <g
      {...rest}
      data-robot-pose-marker=""
      data-robot-id={pose.id}
      data-map-id={pose.mapId}
      data-source-frame-id={pose?.source?.frameId}
      data-source-map-version={pose?.source?.mapVersion}
      data-coordinate-space={pose?.coordinateSpace}
      data-robot-state={state}
      data-robot-pose-context={poseContext}
      data-selected={selected ? 'true' : 'false'}
      data-focused={focusVisible ? 'true' : 'false'}
      data-disabled={disabled ? 'true' : 'false'}
      data-invalid={invalid ? 'true' : 'false'}
      data-stale={stale ? 'true' : 'false'}
      data-status-badge-kind={badgeKind}
      data-motion-visible={motionVisible ? 'true' : 'false'}
      data-hovered={hovered ? 'true' : 'false'}
      data-label-visibility={resolvedLabelVisibility}
      data-label-visible={labelVisible ? 'true' : 'false'}
      data-detail-visibility={resolvedDetailVisibility}
      data-detail-visible={detailsVisible ? 'true' : 'false'}
      data-heading-degrees={angle}
      transform={`translate(${pose.position.x} ${pose.position.y})`}
      role={pointerOnly ? undefined : role ?? (interactive ? 'button' : 'img')}
      tabIndex={pointerOnly ? undefined : interactive ? (disabled ? -1 : tabIndex ?? 0) : tabIndex}
      focusable={pointerOnly ? 'false' : interactive && !disabled ? 'true' : undefined}
      aria-hidden={pointerOnly || undefined}
      aria-label={pointerOnly ? undefined : label}
      aria-pressed={!pointerOnly && interactive ? selected : undefined}
      aria-disabled={!pointerOnly && interactive && disabled ? true : undefined}
      aria-invalid={!pointerOnly && invalid ? true : undefined}
      onClick={activate}
      onKeyDown={handleKeyDown}
      onMouseDown={(event) => {
        if (pointerOnly) event.preventDefault();
        onMouseDown?.(event);
      }}
      onFocus={(event) => {
        if (!pointerOnly) setHasDomFocus(isFocusVisibleTarget(event.currentTarget));
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setHasDomFocus(false);
        onBlur?.(event);
      }}
      onPointerEnter={handleLabelPointerEnter}
      onPointerLeave={handleLabelPointerLeave}
      style={{
        cursor: disabled ? 'not-allowed' : interactive ? 'pointer' : 'default',
        opacity: navStateOpacity(disabled, false),
        outline: 'none',
        ...style,
      }}
    >
      {ellipseVisible && (
        <ellipse
          data-robot-pose-covariance=""
          data-standard-deviations={localizationEllipse.standardDeviations}
          rx={localizationEllipse.majorRadius}
          ry={localizationEllipse.minorRadius}
          transform={`rotate(${ellipseAngle})`}
          fill={fleetColor}
          fillOpacity="0.08"
          stroke={fleetColor}
          strokeOpacity="0.52"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
      )}
      <g
        data-robot-pose-screen-space=""
        data-viewport-scale={scale}
        transform={`scale(${inverseScale})`}
      >
        {motionVisible && (
          <circle
            data-robot-pose-motion-indicator=""
            r={BODY_RADIUS + 3}
            fill="none"
            stroke={fleetColor}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            pointerEvents="none"
          />
        )}

        {focusVisible && (
          <g data-robot-pose-focus-indicator="" pointerEvents="none">
            <circle
              data-robot-pose-focus-contrast=""
              r={FOCUS_RADIUS}
              fill="none"
              stroke={surface}
              strokeWidth={NAV_FOCUS.contrastStrokeWidth}
              vectorEffect="non-scaling-stroke"
            />
            <circle
              data-robot-pose-focus-ring=""
              r={FOCUS_RADIUS}
              fill="none"
              stroke="var(--color-semantic-focus-indicator)"
              strokeWidth="2.5"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        )}

        <circle
          data-robot-pose-hit-area=""
          data-screen-target-size={NAV_HIT.screenTargetSize}
          r={NAV_HIT.radius}
          fill="transparent"
          pointerEvents={interactive ? 'all' : 'none'}
        />

        <g
          data-navigation-selection-scale=""
          data-robot-pose-selection-visual=""
          data-robot-pose-selected-scale={selected ? NAV_SELECTION.robotPoseScale : undefined}
          style={{ transform: `scale(${selected ? NAV_SELECTION.robotPoseScale : 1})` }}
        >
          <circle
            data-robot-pose-shadow=""
            cx="0"
            cy="1.5"
            r={BODY_RADIUS + 1}
            fill="var(--color-semantic-static-black)"
            opacity="0.18"
            pointerEvents="none"
          />
          <g
            {...obstacle(`robot-pose:${pose.id}:body`)}
            data-robot-pose-body=""
            transform={`rotate(${angle})`}
          >
            <circle
              r={BODY_RADIUS}
              fill={fleetColor}
              stroke={fleetColor}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            <path
              data-robot-pose-heading=""
              data-heading-anchor="center"
              d="M12 0 L-3 -6 L0 0 L-3 6 Z"
              transform="translate(-3 0)"
              fill="var(--color-semantic-static-white)"
              pointerEvents="none"
            />
          </g>
        </g>

        {badge && (
          <g
            {...obstacle(`robot-pose:${pose.id}:status`)}
            data-robot-pose-status-badge=""
            data-status-badge-kind={badgeKind}
            transform="translate(10 -10)"
            pointerEvents="none"
            aria-hidden="true"
          >
            <circle
              r="6.5"
              fill={badge.tone}
              stroke={surface}
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
            {badgeKind === 'idle' && (
              <rect x="-2.7" y="-2.7" width="5.4" height="5.4" rx="0.7" fill={badge.glyph} />
            )}
            {badgeKind === 'paused' && (
              <path d="M-2.4 -3.2 V3.2 M2.4 -3.2 V3.2" fill="none" stroke={badge.glyph} strokeWidth="2" strokeLinecap="round" />
            )}
            {(badgeKind === 'fault' || badgeKind === 'invalid') && (
              <path d="M0 -3.5 V1 M0 3.5 V3.7" fill="none" stroke={badge.glyph} strokeWidth="1.8" strokeLinecap="round" />
            )}
            {badgeKind === 'offline' && (
              <path d="M-3 -3 L3 3 M3 -3 L-3 3" fill="none" stroke={badge.glyph} strokeWidth="1.8" strokeLinecap="round" />
            )}
            {badgeKind === 'stale' && (
              <>
                <circle r="3.4" fill="none" stroke={badge.glyph} strokeWidth="1.3" />
                <path d="M0 -2 V0 L1.8 1" fill="none" stroke={badge.glyph} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </>
            )}
            {badgeKind === 'unknown' && (
              <text x="0" y="3.1" textAnchor="middle" fill={badge.glyph} fontFamily="var(--font-sans)" fontSize="9" fontWeight="var(--fw-bold)">?</text>
            )}
          </g>
        )}

        {labelVisible && (
          <NavigationAnnotationBlock
            id={`robot-pose:${pose.id}:label`}
            kind="robot-pose-label"
            anchor={pose.position}
            detailLevel="overview"
            priority={annotationPriority({
              selected,
              focused: focusVisible,
              alarm: badgeKind === 'invalid' || badgeKind === 'fault',
              importance: ANNOTATION_IMPORTANCE['robot-pose'],
            })}
          >
            <g data-robot-pose-label="" pointerEvents="none" aria-hidden="true">
              <text
                x="20"
                y={detailsVisible ? '-1.5' : '3.5'}
                fill={foreground}
                stroke={surface}
                strokeWidth={NAV_LABEL_HALO.primary}
                strokeLinejoin="round"
                paintOrder="stroke"
                vectorEffect="non-scaling-stroke"
                fontFamily="var(--font-sans)"
                fontSize="var(--label2-size)"
                fontWeight="var(--fw-bold)"
              >
                {pose.label}
              </text>
              {detailsVisible && (
                <text
                  x="20"
                  y="10"
                  fill={muted}
                  stroke={surface}
                  strokeWidth={NAV_LABEL_HALO.secondary}
                  strokeLinejoin="round"
                  paintOrder="stroke"
                  vectorEffect="non-scaling-stroke"
                  fontFamily="var(--font-sans)"
                  fontSize="var(--caption2-size)"
                  fontWeight="var(--fw-semibold)"
                >
                  {stateLabel}
                </text>
              )}
            </g>
          </NavigationAnnotationBlock>
        )}
      </g>
    </g>
  );
}
