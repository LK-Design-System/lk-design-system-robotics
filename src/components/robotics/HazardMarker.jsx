import React from 'react';
import { isFocusVisibleTarget } from './_NavigationFocus.js';
import { FACILITY_GLYPH_PATHS } from './_FacilityGlyph.js';
import { HAZARD_GLYPH_PATHS, HAZARD_GLYPH_FIT } from './_HazardGlyph.js';
import { NavigationAnnotationBlock, annotationPriority, useNavigationObstacles } from './_navigationAnnotations.js';
import { navStateOpacity, NAV_PIN, NAV_HIT, NAV_LABEL_HALO } from './_navigationVocabulary.js';

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
  },
  danger: {
    label: '위험',
    fill: 'var(--viewer-danger, var(--color-semantic-status-negative-foreground))',
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
// the accessible name — not a competing shape. Shared by the fill AND the
// focus/selection outlines so a selected hazard reads as the same pin.
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
  const severity = SEVERITY_PRESENTATION[hazard.severity] ?? SEVERITY_PRESENTATION.caution;
  const glyph = HAZARD_GLYPHS[hazard.kind] ?? HAZARD_GLYPHS.stairs;
  const surface = 'var(--viewer-surface-elevated, var(--color-semantic-static-white))';
  const label = ariaLabel ?? accessibleName(hazard, severity, { selected, focused: focusVisible, disabled });

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

  return (
    <g
      {...rest}
      data-lds-hazard-marker=""
      data-hazard-id={hazard.id}
      data-hazard-kind={hazard.kind}
      data-hazard-severity={hazard.severity}
      data-map-id={hazard.mapId}
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
      <g data-hazard-screen-space="" data-viewport-scale={scale} transform={`scale(${inverseScale})`}>
        {/* Cast shadow + focus/selection outlines all trace the SAME pin
            silhouette (shared with FacilityTransition), so every state reads as
            one marker instead of a pin ringed by a mismatched circle. */}
        <path d={PIN_PATH} transform={NAV_PIN.shadow.transform} fill={NAV_PIN.shadow.fill} opacity={NAV_PIN.shadow.opacity} pointerEvents="none" data-hazard-shadow="" />
        {focusVisible && (
          <path d={PIN_PATH} transform={`scale(${NAV_PIN.focusRing.scale})`} fill="none" stroke="var(--color-semantic-focus-indicator)" strokeWidth={NAV_PIN.focusRing.strokeWidth} strokeLinejoin="round" vectorEffect="non-scaling-stroke" pointerEvents="none" data-hazard-focus-ring="" />
        )}
        {selected && (
          <path d={PIN_PATH} transform={`scale(${NAV_PIN.selectionRing.scale})`} fill="none" stroke="var(--viewer-accent, var(--color-semantic-primary-normal))" strokeWidth={NAV_PIN.selectionRing.strokeWidth} strokeLinejoin="round" vectorEffect="non-scaling-stroke" pointerEvents="none" data-hazard-selection-ring="" />
        )}
        {/* WCAG 2.2 minimum target: a transparent 24px-equivalent hit circle in
            screen space, wider than the pin. */}
        <circle r={NAV_HIT.radius} fill="transparent" stroke="none" pointerEvents={interactive ? 'all' : 'none'} data-hazard-hit-area="" data-screen-target-size={NAV_HIT.screenTargetSize} />
        <path
          {...obstacle(`hazard:${hazard.id}:sign`)}
          d={PIN_PATH}
          fill={severity.fill}
          vectorEffect="non-scaling-stroke"
          data-hazard-sign=""
        />
        <g fill={surface} pointerEvents="none" transform={GLYPH_FIT} data-hazard-glyph="">
          <path d={glyph} />
        </g>

        {showLabel && (
          <NavigationAnnotationBlock
            id={`hazard:${hazard.id}:label`}
            kind="hazard-label"
            anchor={hazard.position}
            priority={annotationPriority({ selected, focused: focusVisible, alarm: hazard.severity === 'danger' })}
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
              {hazard.label} · {severity.label}
            </text>
          </NavigationAnnotationBlock>
        )}
      </g>
    </g>
  );
}
