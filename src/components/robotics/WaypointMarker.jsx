import React from 'react';
import {
  isNavigationSourceCompatible,
  useNavigationCoordinateBoundary,
} from './NavigationCoordinateBoundary.jsx';
import { isFocusVisibleTarget } from './_NavigationFocus.js';
import { NavigationStateGlyph } from './_NavigationStateGlyph.js';
import { NavigationRoleGlyph } from './_navigationRoleGlyph.js';
import { ANNOTATION_CODE as ANNOTATION_CODES, ROLE_CODE as ROLE_CODES } from './_navigationEncoding.js';
import {
  ANNOTATION_IMPORTANCE,
  NavigationAnnotationBlock,
  annotationPriority,
  useNavigationAnnotationDetailMode,
  useNavigationLabelDisclosure,
  useNavigationObstacles,
} from './_navigationAnnotations.js';
import {
  navStateOpacity,
  NAV_NODE,
  NAV_HIT,
  NAV_LABEL_HALO,
  NAV_FOCUS,
  NAV_SELECTION,
  NAV_WAYPOINT_STATUS_BADGE,
  NAV_WAYPOINT_AVAILABILITY_FILL,
} from './_navigationVocabulary.js';

// Accessible-name copy is Korean to match every sibling navigation overlay
// (Lane / Region / Route / Trajectory / Facility). A Korean-first product must
// not announce mixed-language part names in one map (WCAG 3.1.2 Language of
// Parts). Primary roles use language-neutral vector icons; facility annotation
// codes such as `dock` remain terse secondary labels.
const ROLE_LABELS = {
  holding: '대기 지점',
  passthrough: '통과 지점',
  parking: '주차 지점',
  charger: '충전 지점',
};

const ANNOTATION_LABELS = {
  dock: '도킹',
  cleaning: '청소',
  dispenser: '자재 공급',
  ingestor: '자재 수거',
  'lift-approach': '승강기 접근',
  'door-approach': '문 접근',
  mutex: '상호 배제',
  custom: '사용자 정의',
};

const AVAILABILITY_LABELS = {
  available: '사용 가능',
  unavailable: '사용 불가',
  unknown: '상태 미확인',
};

// One compact rounded square can carry one readable role. Prefer the most specific
// operational role; the complete role set remains in the accessible name and
// selection-inspector data.
const ROLE_VISUAL_PRIORITY = ['charger', 'parking', 'holding', 'passthrough'];

function normalizeViewportScale(value) {
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function compactLabel(label, limit = 14) {
  if (typeof label !== 'string' || label.length <= limit) return label;
  return `${label.slice(0, limit - 1).trimEnd()}…`;
}

function primaryVisualRole(waypoint) {
  const roles = waypoint.roles || [];
  return ROLE_VISUAL_PRIORITY.find((role) => roles.includes(role));
}

function annotationSummary(waypoint) {
  const annotationCodes = (waypoint.annotations || [])
    .map((annotation) => ANNOTATION_CODES[annotation.kind]);
  const codes = annotationCodes.filter(Boolean);

  if (codes.length <= 3) return codes.join(' · ');
  return `${codes.slice(0, 3).join(' · ')} +${codes.length - 3}`;
}

function accessibleName(waypoint, { selected, focused, disabled, invalid, stale }) {
  const roles = (waypoint.roles || []).map((role) => ROLE_LABELS[role] || role);
  const annotations = (waypoint.annotations || [])
    .map((annotation) => {
      const kind = ANNOTATION_LABELS[annotation.kind] || annotation.kind;
      return annotation.label ? `${annotation.label} (${kind})` : kind;
    });
  const availability = waypoint.availability || 'unknown';
  const states = [
    `가용성 ${AVAILABILITY_LABELS[availability] || availability}`,
    selected && '선택됨',
    focused && '포커스됨',
    disabled && '선택할 수 없음',
    invalid && '데이터 오류',
    stale && '오래된 데이터',
  ].filter(Boolean);

  return [
    waypoint.label,
    `지도 ${waypoint.mapId}`,
    roles.length > 0 && `역할 ${roles.join(', ')}`,
    annotations.length > 0 && `주석 ${annotations.join(', ')}`,
    ...states,
  ].filter(Boolean).join(', ');
}

/**
 * LK Robotics Extension — renderer reference for one navigation-graph waypoint.
 *
 * The component deliberately returns an SVG `g` fragment. The owning map
 * supplies the SVG root, world transform, clipping, and semantic mirror list.
 */
export function WaypointMarker({
  waypoint,
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
  const annotationDetailMode = useNavigationAnnotationDetailMode();
  const obstacle = useNavigationObstacles();
  const scale = normalizeViewportScale(viewportScale);
  const inverseScale = 1 / scale;
  const interactive = typeof onActivate === 'function';
  const pointerOnly = ariaHidden === true || ariaHidden === 'true';
  const focusVisible = !pointerOnly && (focused || hasDomFocus);
  const availability = waypoint.availability || 'unknown';
  const primaryRole = primaryVisualRole(waypoint);
  const details = annotationSummary(waypoint);
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
    priority: invalid || stale || availability === 'unavailable',
    hasDetails: Boolean(details),
    onPointerEnter,
    onPointerLeave,
  });
  const visualLabel = annotationDetailMode === 'standard'
    ? compactLabel(waypoint.label)
    : waypoint.label;
  const label = ariaLabel ?? accessibleName(waypoint, {
    selected,
    focused: focusVisible,
    disabled,
    invalid,
    stale,
  });
  const foreground = 'var(--viewer-foreground, var(--color-semantic-label-strong))';
  const muted = 'var(--viewer-muted, var(--color-semantic-label-neutral))';
  const surface = 'var(--viewer-surface-elevated, var(--color-semantic-background-elevated-normal))';
  const danger = 'var(--viewer-danger, var(--color-semantic-status-negative-foreground))';
  // Availability remains on the body. Exceptional data quality uses one
  // top-right solid micro badge, matching the RobotPoseMarker attachment grammar.
  // Invalid wins over stale visually; the accessible name still announces
  // every raw state without growing a badge stack.
  const statusBadgeKind = invalid
    ? 'invalid'
    : stale
      ? 'stale'
      : null;
  const stateFill = NAV_WAYPOINT_AVAILABILITY_FILL[availability]
    ?? NAV_WAYPOINT_AVAILABILITY_FILL.unknown;
  const statusBadgeTone = statusBadgeKind === 'invalid' ? danger : muted;
  const activate = (event) => {
    if (disabled || !interactive) return;
    onActivate(waypoint.id, event);
  };

  const handleKeyDown = (event) => {
    if (!pointerOnly) setHasDomFocus(true);
    if (pointerOnly || disabled || !interactive || event.repeat) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    activate(event);
  };

  if (
    (waypoint?.source && waypoint.source.mapId !== waypoint.mapId)
    || !isNavigationSourceCompatible(waypoint?.source, coordinateBoundary)
  ) return null;

  return (
    <g
      {...rest}
      data-waypoint-marker=""
      data-waypoint-id={waypoint.id}
      data-map-id={waypoint.mapId}
      data-source-frame-id={waypoint?.source?.frameId}
      data-source-map-version={waypoint?.source?.mapVersion}
      data-availability={availability}
      data-selected={selected ? 'true' : 'false'}
      data-focused={focusVisible ? 'true' : 'false'}
      data-disabled={disabled ? 'true' : 'false'}
      data-invalid={invalid ? 'true' : 'false'}
      data-stale={stale ? 'true' : 'false'}
      data-hovered={hovered ? 'true' : 'false'}
      data-label-visibility={resolvedLabelVisibility}
      data-label-visible={labelVisible ? 'true' : 'false'}
      data-detail-visibility={resolvedDetailVisibility}
      data-detail-visible={detailsVisible ? 'true' : 'false'}
      data-role-codes={(waypoint.roles || []).map((role) => ROLE_CODES[role]).filter(Boolean).join('')}
      data-annotation-count={(waypoint.annotations || []).length}
      transform={`translate(${waypoint.position.x} ${waypoint.position.y})`}
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
        opacity: navStateOpacity(disabled, stale && !invalid),
        outline: 'none',
        ...style,
      }}
    >
      <g
        data-waypoint-screen-space=""
        data-viewport-scale={scale}
        transform={`scale(${inverseScale})`}
      >
        {/*
          WCAG 2.2 sets the minimum interactive target at 24 screen px. This
          transparent hit circle lives inside the inverse-scaled screen-space
          group, so its radius is already measured in screen px. A circle must
          be at least 24*sqrt(2) across to contain a 24 by 24 CSS px square, so
          r=17.5 leaves enough rendering tolerance for the required square.
        */}
        <circle
          data-waypoint-hit-area=""
          data-screen-target-size={NAV_HIT.screenTargetSize}
          r={NAV_HIT.radius}
          fill="transparent"
          pointerEvents={interactive ? 'all' : 'none'}
        />

        {/*
          Focus traces the point's OWN rounded-square silhouette instead of the
          browser's rectangular outline. A surface-colored contrast underlay
          makes the focus indicator survive both light/dark maps and separates
          it from selection without introducing a dashed interaction state.

          The shell is deliberately NOT an annotation obstacle even though it
          scales the point's silhouette out past the registered 20px point.
          Registering it does buy a focused marker's own label more room, but the
          obstacle list is global and unscoped, so it also pushes other entities'
          labels - it displaced the danger label in label-suppression-priority,
          where the contract is that the highest-priority label keeps its natural
          position. Fixture placement is the cheaper lever: a label only crowds
          this shell once the solver has flipped it to escape the panel edge.
        */}
        {focusVisible && (
          <>
            <rect
              data-waypoint-focus-contrast=""
              {...NAV_NODE.rect(NAV_NODE.radius, NAV_NODE.cornerRadius)}
              transform={`scale(${NAV_FOCUS.waypointShellScale})`}
              fill="none"
              stroke={surface}
              strokeWidth={NAV_FOCUS.contrastStrokeWidth}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
            <rect
              data-waypoint-focus-indicator=""
              data-waypoint-focus-ring=""
              {...NAV_NODE.rect(NAV_NODE.radius, NAV_NODE.cornerRadius)}
              transform={`scale(${NAV_FOCUS.waypointShellScale})`}
              fill="none"
              stroke="var(--color-semantic-focus-indicator)"
              strokeWidth={NAV_FOCUS.strokeWidth}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
          </>
        )}

        {/*
          Selection enlarges the complete visual marker from 20px to 25px
          without changing its semantic state color. The one-shot transition
          lives in tokens/components.css and is suppressed for reduced motion.
          Keyboard focus stays outside this group as a transient input-location
          cue.
        */}
        <g
          data-navigation-selection-scale=""
          data-waypoint-selection-visual=""
          data-waypoint-selected-scale={selected ? NAV_SELECTION.waypointScale : undefined}
          style={{ transform: `scale(${selected ? NAV_SELECTION.waypointScale : 1})` }}
        >
          {/*
            Decorative depth is independent from semantic state. It scales with
            the selected marker so the body still reads as one elevated object.
          */}
          <rect
            data-waypoint-shadow=""
            {...NAV_NODE.rect(NAV_NODE.radius + 0.5, NAV_NODE.cornerRadius + 0.5)}
            transform="translate(0 1.4)"
            fill="var(--color-semantic-static-black)"
            opacity="0.16"
            pointerEvents="none"
          />
          <rect
            {...obstacle(`waypoint:${waypoint.id}:point`)}
            data-waypoint-point=""
            data-waypoint-status-kind={availability}
            data-waypoint-state-color=""
            {...NAV_NODE.rect(NAV_NODE.radius, NAV_NODE.cornerRadius)}
            fill={stateFill}
            stroke={surface}
            strokeWidth="1.5"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {primaryRole && (
            <g
              data-waypoint-role-slot=""
              data-waypoint-primary-role={primaryRole}
              aria-hidden="true"
              pointerEvents="none"
            >
              <NavigationRoleGlyph kind={primaryRole} size={11} color={surface} />
            </g>
          )}
        </g>

        {statusBadgeKind && (
          <g
            {...obstacle(`waypoint:${waypoint.id}:status`)}
            transform={`translate(${NAV_WAYPOINT_STATUS_BADGE.offsetX} ${NAV_WAYPOINT_STATUS_BADGE.offsetY})`}
            data-waypoint-status-badge={statusBadgeKind}
            data-waypoint-status-badge-style="solid"
            data-waypoint-status-badge-offset-x={NAV_WAYPOINT_STATUS_BADGE.offsetX}
            data-waypoint-status-badge-offset-y={NAV_WAYPOINT_STATUS_BADGE.offsetY}
            pointerEvents="none"
          >
            <circle
              data-waypoint-status-badge-circle=""
              r={NAV_WAYPOINT_STATUS_BADGE.radius}
              fill={statusBadgeTone}
              stroke={surface}
              strokeWidth={NAV_WAYPOINT_STATUS_BADGE.strokeWidth}
              vectorEffect="non-scaling-stroke"
            />
            <NavigationStateGlyph
              kind={statusBadgeKind}
              size={NAV_WAYPOINT_STATUS_BADGE.glyphSize}
              color={surface}
              data-waypoint-status-glyph=""
            />
          </g>
        )}

        {labelVisible && (
          <NavigationAnnotationBlock
            id={`waypoint:${waypoint.id}:label`}
            kind="waypoint-label"
            anchor={waypoint.position}
            detailLevel="standard"
            priority={annotationPriority({
              selected,
              focused: focusVisible,
              alarm: invalid || availability === 'unavailable',
              importance: ANNOTATION_IMPORTANCE.context,
            })}
          >
            <g data-waypoint-label="" data-waypoint-label-offset-x={NAV_NODE.labelOffsetX} pointerEvents="none" aria-hidden="true">
              <text
                data-waypoint-primary-label=""
                x={NAV_NODE.labelOffsetX}
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
                {visualLabel}
              </text>
              {detailsVisible && (
                <text
                  data-waypoint-details=""
                  x={NAV_NODE.labelOffsetX}
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
                  {details}
                </text>
              )}
            </g>
          </NavigationAnnotationBlock>
        )}
      </g>
    </g>
  );
}
