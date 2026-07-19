import React from 'react';
import { isFocusVisibleTarget } from './_NavigationFocus.js';
import { NavigationStateGlyph } from './_NavigationStateGlyph.js';
import { ANNOTATION_CODE as ANNOTATION_CODES, ROLE_CODE as ROLE_CODES } from './_navigationEncoding.js';
import { NavigationAnnotationBlock, annotationPriority, useNavigationObstacles } from './_navigationAnnotations.js';
import { navStateOpacity, NAV_DASH, NAV_HIT, NAV_STATE_BADGE, NAV_LABEL_HALO, NAV_FOCUS } from './_navigationVocabulary.js';

// Accessible-name copy is Korean to match every sibling navigation overlay
// (Lane / Region / Route / Trajectory / Facility). A Korean-first product must
// not announce mixed-language part names in one map (WCAG 3.1.2 Language of
// Parts). The short on-map visual codes stay language-neutral (H / C / dock).
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

function normalizeViewportScale(value) {
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function semanticSummary(waypoint) {
  const roleCodes = (waypoint.roles || []).map((role) => ROLE_CODES[role]);
  const annotationCodes = (waypoint.annotations || [])
    .map((annotation) => ANNOTATION_CODES[annotation.kind]);
  const codes = [...roleCodes, ...annotationCodes].filter(Boolean);

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
  showLabel = true,
  onActivate,
  role,
  tabIndex,
  onFocus,
  onBlur,
  onMouseDown,
  style,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
  ...rest
}) {
  const [hasDomFocus, setHasDomFocus] = React.useState(false);
  const obstacle = useNavigationObstacles();
  const scale = normalizeViewportScale(viewportScale);
  const inverseScale = 1 / scale;
  const interactive = typeof onActivate === 'function';
  const pointerOnly = ariaHidden === true || ariaHidden === 'true';
  const focusVisible = !pointerOnly && (focused || hasDomFocus);
  const availability = waypoint.availability || 'unknown';
  const compoundUnknownInvalid = availability === 'unknown' && invalid;
  const details = semanticSummary(waypoint);
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
  const stateColor = invalid || availability === 'unavailable'
    ? 'var(--viewer-danger, var(--color-semantic-status-negative-foreground))'
    : availability === 'unknown'
      ? 'var(--viewer-warning, var(--color-semantic-status-cautionary-foreground))'
      : foreground;
  // When the point is filled solid (selected), any mark drawn DIRECTLY on it —
  // the unavailable slash and a lone unknown/invalid state glyph — knocks out to a
  // light ink so it stays legible on the accent fill. Compound state glyphs sit on
  // their own surface chips, so they keep the neutral foreground.
  const selectedGlyphInk = 'var(--color-semantic-static-white)';

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

  return (
    <g
      {...rest}
      data-waypoint-marker=""
      data-waypoint-id={waypoint.id}
      data-map-id={waypoint.mapId}
      data-availability={availability}
      data-selected={selected ? 'true' : 'false'}
      data-focused={focusVisible ? 'true' : 'false'}
      data-disabled={disabled ? 'true' : 'false'}
      data-invalid={invalid ? 'true' : 'false'}
      data-stale={stale ? 'true' : 'false'}
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
      style={{
        cursor: disabled ? 'not-allowed' : interactive ? 'pointer' : 'default',
        opacity: navStateOpacity(disabled, stale),
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
          Decorative depth + salience layers. They carry their own data hooks,
          never the measured `data-waypoint-point`, so the 24px hit target and
          the glyph-in-circle geometry contracts are untouched. The cast shadow
          lifts every marker off the facility grid; the attention ring gives
          alarm states (invalid / unavailable) visual weight so an emergency is
          not painted at the same hairline salience as routine state.
        */}
        <polygon
          data-waypoint-shadow=""
          points="0,-7.5 7.5,0 0,7.5 -7.5,0"
          transform="translate(0 1.4)"
          fill="var(--color-semantic-static-black)"
          opacity="0.16"
          pointerEvents="none"
        />
        {(invalid || availability === 'unavailable') && (
          <circle
            data-waypoint-attention=""
            r="10.5"
            fill="none"
            stroke={stateColor}
            strokeWidth="2.5"
            opacity="0.4"
            vectorEffect="non-scaling-stroke"
            pointerEvents="none"
          />
        )}
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
          Focus traces the point's OWN diamond silhouette (a shell scaled 1.5x)
          rather than a circle — a round ring around a diamond reads as a shape
          mismatch (the same reason selection fills the diamond solid below), and
          it matches how the pin focus scales its silhouette.
        */}
        {focusVisible && (
          <polygon
            data-waypoint-focus-indicator=""
            points="0,-7 7,0 0,7 -7,0"
            transform={`scale(${NAV_FOCUS.waypointShellScale})`}
            fill="none"
            stroke="var(--color-semantic-focus-indicator)"
            strokeWidth={NAV_FOCUS.strokeWidth}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {stale && (
          <circle
            data-waypoint-stale-indicator=""
            r="9.5"
            fill="none"
            stroke={muted}
            strokeWidth="1.5"
            strokeDasharray={NAV_DASH.staleRing}
            vectorEffect="non-scaling-stroke"
          />
        )}

        {/*
          Selection fills the diamond solid in the accent colour rather than
          wrapping it in a round ring — a circular ring around a diamond reads as
          a shape mismatch, and a solid node is the stronger "this one is
          selected" cue. The role stays in the label and alarm states keep their
          own attention/state indicators, so no encoding is lost.
        */}
        <polygon
          {...obstacle(`waypoint:${waypoint.id}:point`)}
          data-waypoint-point=""
          data-waypoint-selected-indicator={selected ? '' : undefined}
          points="0,-7 7,0 0,7 -7,0"
          fill={selected ? 'var(--viewer-accent, var(--color-semantic-primary-normal))' : surface}
          stroke={selected ? 'var(--viewer-accent, var(--color-semantic-primary-normal))' : stateColor}
          strokeWidth="2.25"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {availability === 'unavailable' && (
          <path
            data-waypoint-unavailable-indicator=""
            d="M-4.5 4.5 L4.5 -4.5"
            fill="none"
            stroke={selected ? selectedGlyphInk : 'var(--viewer-danger, var(--color-semantic-status-negative-foreground))'}
            strokeWidth="2"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {availability === 'unknown' && (
          <g
            {...obstacle(`waypoint:${waypoint.id}:unknown`)}
            data-waypoint-unknown-indicator=""
            data-waypoint-state-slot="unknown"
            transform={compoundUnknownInvalid ? 'translate(-8 -8)' : undefined}
            aria-hidden="true"
          >
            {compoundUnknownInvalid && (
              <circle
                data-waypoint-state-circle="unknown"
                r={NAV_STATE_BADGE.radius}
                fill={surface}
                stroke="var(--viewer-warning, var(--color-semantic-status-cautionary-foreground))"
                strokeWidth={NAV_STATE_BADGE.strokeWidth}
                vectorEffect="non-scaling-stroke"
              />
            )}
            <NavigationStateGlyph
              kind="unknown"
              size={10}
              color={selected && !compoundUnknownInvalid ? selectedGlyphInk : foreground}
              data-waypoint-state-glyph-geometry="unknown"
            />
          </g>
        )}

        {invalid && (
          <g
            {...obstacle(`waypoint:${waypoint.id}:invalid`)}
            data-waypoint-invalid-indicator=""
            data-waypoint-state-slot="invalid"
            transform={compoundUnknownInvalid ? 'translate(-8 8)' : undefined}
            aria-hidden="true"
          >
            {compoundUnknownInvalid && (
              <circle
                data-waypoint-state-circle="invalid"
                r={NAV_STATE_BADGE.radius}
                fill={surface}
                stroke="var(--viewer-danger, var(--color-semantic-status-negative-foreground))"
                strokeWidth={NAV_STATE_BADGE.strokeWidth}
                vectorEffect="non-scaling-stroke"
              />
            )}
            <NavigationStateGlyph
              kind="invalid"
              size={10}
              color={selected && !compoundUnknownInvalid ? selectedGlyphInk : foreground}
              data-waypoint-state-glyph-geometry="invalid"
            />
          </g>
        )}

        {showLabel && (
          <NavigationAnnotationBlock
            id={`waypoint:${waypoint.id}:label`}
            kind="waypoint-label"
            anchor={waypoint.position}
            priority={annotationPriority({
              selected,
              focused: focusVisible,
              alarm: invalid || availability === 'unavailable',
            })}
          >
            <g data-waypoint-label="" data-waypoint-label-offset-x="15" pointerEvents="none" aria-hidden="true">
              <text
                data-waypoint-primary-label=""
                x="15"
                y={details ? '-1.5' : '3.5'}
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
                {waypoint.label}
              </text>
              {details && (
                <text
                  data-waypoint-details=""
                  x="15"
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
