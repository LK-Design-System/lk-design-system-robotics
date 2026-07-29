import React from 'react';
import {
  isNavigationSourceCompatible,
  useNavigationCoordinateBoundary,
} from './NavigationCoordinateBoundary.jsx';
import { isFocusVisibleTarget } from './_NavigationFocus.js';
import { FACILITY_GLYPH_PATHS } from './_FacilityGlyph.js';
import { HAZARD_GLYPH_PATHS, HAZARD_GLYPH_FIT } from './_HazardGlyph.js';
import {
  ANNOTATION_IMPORTANCE,
  NavigationAnnotationBlock,
  annotationPriority,
  useNavigationLabelDisclosure,
  useNavigationObstacles,
} from './_navigationAnnotations.js';
import { navStateOpacity, NAV_PIN, NAV_HIT, NAV_LABEL_HALO, NAV_FOCUS, NAV_SELECTION } from './_navigationVocabulary.js';

// Accessible-name copy is Korean to match every sibling navigation overlay
// (Waypoint / Lane / Region / Route / Trajectory / Facility) so a Korean-first
// product never announces mixed-language part names in one map (WCAG 3.1.2).
const KIND_LABELS = {
  stairs: '계단',
  ramp: '경사로',
  dropoff: '단차·낙하',
  // Reads as "충돌 위험" in the `${kind} 위험` accessible-name slot.
  obstacle: '충돌',
};

// Hazard severity is the visual axis (not availability): products classify the
// avoidance weight; the marker never infers it from position or kind.
const SEVERITY_PRESENTATION = {
  caution: {
    label: '주의',
    fill: 'var(--viewer-warning, var(--color-semantic-status-cautionary-foreground))',
    ring: 0,
  },
  danger: {
    label: '위험',
    fill: 'var(--viewer-danger, var(--color-semantic-status-negative-foreground))',
    // 심각도를 채움만으로 나누면 주의와 위험이 색상만 다른 동일 실루엣이 되어,
    // 지도에서 라벨이 억제되면 색이 유일한 채널로 남는다(WCAG 1.4.1).
    //
    // 표면색 한 겹으로는 부족하다: 흰 카드나 밝은 지도 위에서는 흰 테두리가
    // 배경에 묻혀 아무 차이도 남지 않는다. 그래서 바깥은 severity 색, 안쪽은
    // 표면색으로 두 겹을 두른다. 어떤 배경에서도 "테두리가 겹쳐 있다"는 실루엣
    // 차이가 남으므로 색을 못 읽어도 주의와 구분된다.
    ring: 2.5,
    ringOuter: 5,
  },
};

// Knockout hazard glyphs, painted white on the severity-colored pin badge. The
// hazard-specific silhouettes (stairs / dropoff / obstacle) live in the shared
// `_HazardGlyph` atom; `ramp` reuses the LDS incline silhouette from
// `_FacilityGlyph` so the same physical slope reads as the same object whether a
// product classifies it as a traversable facility or a hazard.
const HAZARD_GLYPHS = { ...HAZARD_GLYPH_PATHS, ramp: FACILITY_GLYPH_PATHS.ramp };
const GLYPH_FIT = HAZARD_GLYPH_FIT;

// The same map-pin silhouette as FacilityTransition, so hazards read as part of
// the one marker family; what marks them as "avoid" is the severity fill
// (cautionary/negative instead of the facility accent), the hazard glyph, and
// the accessible name — not a competing shape. Focus follows the silhouette;
// selection enlarges the same severity-filled pin body.
const PIN_PATH = NAV_PIN.path;

function normalizeViewportScale(value) {
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function accessibleName(hazard, severity, { selected, focused, disabled }) {
  const kind = KIND_LABELS[hazard.kind] || hazard.kind;
  return [
    hazard.label,
    `지도 ${hazard.mapId}`,
    `${kind} 위험`,
    `심각도 ${severity.label}`,
    selected && '선택됨',
    focused && '포커스됨',
    disabled && '선택할 수 없음',
  ].filter(Boolean).join(', ');
}

/**
 * LK Robotics Extension — renderer reference for one point hazard the AGV must
 * avoid (stairs, and future drop-offs / obstacles). It visualizes product-owned
 * classification and never plans avoidance or issues a command.
 *
 * Returns an SVG `g` fragment: the owning map supplies the root, world
 * transform, clipping, and named semantic mirror. Not a transition — facility
 * passages the AGV *uses* are `FacilityTransition`; broad keep-out *areas* are
 * `SpatialRegion`.
 */
export function HazardMarker({
  hazard,
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
  const severity = SEVERITY_PRESENTATION[hazard.severity] ?? SEVERITY_PRESENTATION.caution;
  const glyph = HAZARD_GLYPHS[hazard.kind] ?? HAZARD_GLYPHS.stairs;
  const surface = 'var(--viewer-surface-elevated, var(--color-semantic-static-white))';
  const label = ariaLabel ?? accessibleName(hazard, severity, { selected, focused: focusVisible, disabled });
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
    priority: invalid || stale || hazard.severity === 'danger',
    hasDetails: true,
    onPointerEnter,
    onPointerLeave,
  });

  const activate = (event) => {
    if (disabled || !interactive) return;
    onActivate(hazard.id, event);
  };

  const handleKeyDown = (event) => {
    if (!pointerOnly) setHasDomFocus(true);
    if (pointerOnly || disabled || !interactive || event.repeat) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    activate(event);
  };

  if (
    (hazard?.source && hazard.source.mapId !== hazard.mapId)
    || !isNavigationSourceCompatible(hazard?.source, coordinateBoundary)
  ) return null;

  return (
    <g
      {...rest}
      data-lds-hazard-marker=""
      data-hazard-id={hazard.id}
      data-hazard-kind={hazard.kind}
      data-hazard-severity={hazard.severity}
      data-map-id={hazard.mapId}
      data-source-frame-id={hazard?.source?.frameId}
      data-source-map-version={hazard?.source?.mapVersion}
      data-selected={selected ? 'true' : 'false'}
      data-focused={focusVisible ? 'true' : 'false'}
      data-disabled={disabled ? 'true' : 'false'}
      transform={`translate(${hazard.position.x} ${hazard.position.y})`}
      role={pointerOnly ? undefined : role ?? (interactive ? 'button' : 'img')}
      tabIndex={pointerOnly ? undefined : interactive ? (disabled ? -1 : tabIndex ?? 0) : tabIndex}
      focusable={pointerOnly ? 'false' : interactive && !disabled ? 'true' : undefined}
      aria-hidden={pointerOnly || undefined}
      aria-label={pointerOnly ? undefined : label}
      aria-pressed={!pointerOnly && interactive ? selected : undefined}
      aria-disabled={!pointerOnly && interactive && disabled ? true : undefined}
      aria-invalid={!pointerOnly && invalid ? true : undefined}
      data-invalid={invalid ? 'true' : 'false'}
      data-stale={stale ? 'true' : 'false'}
      data-hovered={hovered ? 'true' : 'false'}
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
        opacity: navStateOpacity(disabled, stale),
        outline: 'none',
        ...style,
      }}
    >
      <g data-hazard-screen-space="" data-viewport-scale={scale} transform={`scale(${inverseScale})`}>
        {/* Focus traces the shared pin silhouette. Selection enlarges the body
            without changing severity paint or implying an active alarm. */}
        {focusVisible && (
          <>
            <path d={PIN_PATH} transform={`scale(${NAV_PIN.focusRing.scale})`} fill="none" stroke={surface} strokeWidth={NAV_FOCUS.contrastStrokeWidth} strokeLinejoin="round" vectorEffect="non-scaling-stroke" pointerEvents="none" data-hazard-focus-contrast="" />
            <path d={PIN_PATH} transform={`scale(${NAV_PIN.focusRing.scale})`} fill="none" stroke="var(--color-semantic-focus-indicator)" strokeWidth={NAV_PIN.focusRing.strokeWidth} strokeLinejoin="round" vectorEffect="non-scaling-stroke" pointerEvents="none" data-hazard-focus-ring="" />
          </>
        )}
        {/* WCAG 2.2 minimum target: a transparent 24px-equivalent hit circle in
            screen space, wider than the pin. */}
        <circle r={NAV_HIT.radius} fill="transparent" stroke="none" pointerEvents={interactive ? 'all' : 'none'} data-hazard-hit-area="" data-screen-target-size={NAV_HIT.screenTargetSize} />
        <g
          data-navigation-selection-scale=""
          data-hazard-selection-visual=""
          data-hazard-selected-scale={selected ? NAV_SELECTION.pinScale : undefined}
          style={{ transform: `scale(${selected ? NAV_SELECTION.pinScale : 1})` }}
        >
          <path d={PIN_PATH} transform={NAV_PIN.shadow.transform} fill={NAV_PIN.shadow.fill} opacity={NAV_PIN.shadow.opacity} pointerEvents="none" data-hazard-shadow="" />
          {severity.ring ? (
            <path
              d={PIN_PATH}
              fill="none"
              stroke={severity.fill}
              strokeWidth={severity.ringOuter}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
              aria-hidden="true"
              data-hazard-ring-outer=""
            />
          ) : null}
          <path
            {...obstacle(`hazard:${hazard.id}:sign`)}
            d={PIN_PATH}
            fill={severity.fill}
            stroke={severity.ring ? surface : undefined}
            strokeWidth={severity.ring || undefined}
            strokeLinejoin={severity.ring ? 'round' : undefined}
            paintOrder={severity.ring ? 'stroke' : undefined}
            vectorEffect="non-scaling-stroke"
            data-hazard-sign=""
            data-hazard-ring={severity.ring ? 'true' : 'false'}
          />
          <g fill={surface} pointerEvents="none" transform={GLYPH_FIT} data-hazard-glyph="">
            <path d={glyph} />
          </g>
        </g>

        {labelVisible && (
          <NavigationAnnotationBlock
            id={`hazard:${hazard.id}:label`}
            kind="hazard-label"
            anchor={hazard.position}
            detailLevel="standard"
            priority={annotationPriority({
              selected,
              focused: focusVisible,
              alarm: invalid || hazard.severity === 'danger',
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
              data-hazard-label=""
              style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--caption1-size)', fontWeight: 'var(--fw-bold)' }}
            >
              {hazard.label}{detailsVisible ? ` · ${severity.label}` : ''}
            </text>
          </NavigationAnnotationBlock>
        )}
      </g>
    </g>
  );
}
