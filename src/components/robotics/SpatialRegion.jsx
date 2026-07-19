import React from 'react';
import { isFocusVisibleTarget } from './_NavigationFocus.js';
import { NavigationStateGlyph } from './_NavigationStateGlyph.js';
import { NavigationAnnotationBlock, annotationPriority, useNavigationObstacles } from './_navigationAnnotations.js';
import { navStateOpacity, NAV_DASH, NAV_STATE_BADGE, NAV_LABEL_HALO, NAV_FOCUS, NAV_SELECTION } from './_navigationVocabulary.js';

const CATEGORY_PATTERNS = {
  behavior: 'diagonal',
  facility: 'grid',
  terrain: 'contour',
};

const BEHAVIOR_LABELS = {
  'keep-out': '진입 금지',
  'speed-limit': '속도 제한',
  preferred: '우선 통행',
  'operation-area': '작업 구역',
};

const FACILITY_LABELS = {
  'lift-cabin': '승강기 객실',
  'lift-lobby': '승강기 로비',
  'door-area': '문 주변',
  'dock-area': '도킹 구역',
  'charger-area': '충전 구역',
  custom: '사용자 정의 설비',
};

const TERRAIN_LABELS = {
  slope: '경사 구역',
  rough: '거친 노면',
  clearance: '여유 폭 제한',
  custom: '사용자 정의 지형',
};

const TRAVERSABILITY_LABELS = {
  allowed: '통행 가능',
  restricted: '제한 통행',
  blocked: '통행 불가',
  unknown: '통행 여부 미확인',
};

function safeScale(viewportScale) {
  const scale = Number(viewportScale);
  return Number.isFinite(scale) && scale > 0 ? scale : 1;
}

function polygonPoints(shape) {
  return shape.points.map((point) => `${point.x},${point.y}`).join(' ');
}

function finitePoint(point) {
  return point && Number.isFinite(point.x) && Number.isFinite(point.y);
}

function distanceToSegment(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (dx === 0 && dy === 0) return Math.hypot(point.x - start.x, point.y - start.y);
  const ratio = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(point.x - (start.x + ratio * dx), point.y - (start.y + ratio * dy));
}

function pointInPolygon(point, points) {
  let inside = false;
  for (let index = 0, previous = points.length - 1; index < points.length; previous = index, index += 1) {
    const start = points[previous];
    const end = points[index];
    if (distanceToSegment(point, start, end) < 0.0001) return true;
    const crosses = (end.y > point.y) !== (start.y > point.y)
      && point.x < ((start.x - end.x) * (point.y - end.y)) / (start.y - end.y) + end.x;
    if (crosses) inside = !inside;
  }
  return inside;
}

function polygonCentroid(points) {
  let areaTwice = 0;
  let x = 0;
  let y = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const cross = current.x * next.y - next.x * current.y;
    areaTwice += cross;
    x += (current.x + next.x) * cross;
    y += (current.y + next.y) * cross;
  }
  if (Math.abs(areaTwice) < 0.0001) return undefined;
  return { x: x / (3 * areaTwice), y: y / (3 * areaTwice) };
}

function polygonClearance(point, points) {
  let clearance = Infinity;
  for (let index = 0; index < points.length; index += 1) {
    clearance = Math.min(clearance, distanceToSegment(point, points[index], points[(index + 1) % points.length]));
  }
  return clearance;
}

function scanlineCandidates(points, minY, maxY) {
  const candidates = [];
  const height = maxY - minY;
  for (let sample = 0; sample < 17; sample += 1) {
    const y = height === 0 ? minY : minY + ((sample + 0.5) / 17) * height;
    const intersections = [];
    for (let index = 0; index < points.length; index += 1) {
      const start = points[index];
      const end = points[(index + 1) % points.length];
      if ((start.y > y) === (end.y > y)) continue;
      intersections.push(start.x + ((y - start.y) * (end.x - start.x)) / (end.y - start.y));
    }
    intersections.sort((a, b) => a - b);
    for (let index = 0; index + 1 < intersections.length; index += 2) {
      candidates.push({ x: (intersections[index] + intersections[index + 1]) / 2, y });
    }
  }
  return candidates;
}

function pointOnSurface(shape) {
  if (shape.kind === 'circle') return shape.center;
  const points = (shape.points ?? []).filter(finitePoint);
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length < 3) return points[0];

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const average = points.reduce(
    (next, point) => ({ x: next.x + point.x / points.length, y: next.y + point.y / points.length }),
    { x: 0, y: 0 },
  );
  const candidates = [
    polygonCentroid(points),
    { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
    average,
    ...scanlineCandidates(points, minY, maxY),
  ].filter((point) => point && pointInPolygon(point, points));

  if (candidates.length === 0) return points[0];
  return candidates.reduce((best, candidate) => (
    polygonClearance(candidate, points) > polygonClearance(best, points) ? candidate : best
  ));
}

function RegionShape({ shape, ...props }) {
  if (shape.kind === 'circle') {
    return (
      <circle
        cx={shape.center.x}
        cy={shape.center.y}
        r={shape.radius}
        {...props}
      />
    );
  }

  return <polygon points={polygonPoints(shape)} {...props} />;
}

function patternContent(pattern, stroke) {
  if (pattern === 'grid') {
    return (
      <path
        d="M0 0H10M0 0V10"
        fill="none"
        stroke={stroke}
        strokeOpacity="0.42"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
    );
  }

  if (pattern === 'contour') {
    return (
      <path
        d="M-2 3C1 1 4 1 7 3S13 5 16 3M-2 9C1 7 4 7 7 9S13 11 16 9"
        fill="none"
        stroke={stroke}
        strokeOpacity="0.48"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
    );
  }

  return (
    <path
      d="M-3 12L12-3M3 15L15 3"
      fill="none"
      stroke={stroke}
      strokeOpacity="0.5"
      strokeWidth="1"
      vectorEffect="non-scaling-stroke"
    />
  );
}

function regionKind(region) {
  return region.category === 'behavior' ? region.rule.kind : region.kind;
}

function strokeForRegion(region, { disabled, invalid }) {
  if (invalid) return 'var(--viewer-danger, var(--color-semantic-status-negative-foreground))';
  if (disabled) return 'var(--viewer-muted, var(--color-semantic-label-alternative))';

  if (region.category === 'behavior') {
    if (region.rule.kind === 'keep-out') return 'var(--viewer-danger, var(--color-semantic-status-negative-foreground))';
    if (region.rule.kind === 'speed-limit') return 'var(--viewer-warning, var(--color-semantic-status-cautionary-foreground))';
    return 'var(--viewer-accent, var(--color-semantic-primary-normal))';
  }

  if (region.category === 'terrain') {
    if (region.traversability === 'blocked') return 'var(--viewer-danger, var(--color-semantic-status-negative-foreground))';
    if (region.traversability === 'restricted') return 'var(--viewer-warning, var(--color-semantic-status-cautionary-foreground))';
    if (region.traversability === 'unknown') return 'var(--viewer-muted, var(--color-semantic-label-alternative))';
  }

  return 'var(--viewer-foreground, var(--color-semantic-label-neutral))';
}

function gradeLabel(grade) {
  if (!grade) return undefined;
  const unit = grade.unit === 'percent' ? '%' : '°';
  const direction = Number.isFinite(grade.directionRad)
    ? `방향 ${grade.directionRad} rad`
    : undefined;
  return [`${grade.value}${unit}`, direction].filter(Boolean).join(' · ');
}

function semanticLabel(region) {
  if (region.category === 'behavior') {
    const kind = region.rule.kind === 'custom'
      ? region.rule.label
      : BEHAVIOR_LABELS[region.rule.kind];
    const detail = region.rule.kind === 'speed-limit'
      ? `${region.rule.speedLimitMps} m/s`
      : region.rule.kind === 'operation-area'
        ? region.rule.operation
        : undefined;
    return [kind, detail, region.label].filter(Boolean).join(' · ');
  }

  if (region.category === 'facility') {
    return [FACILITY_LABELS[region.kind], region.label].filter(Boolean).join(' · ');
  }

  return [
    TERRAIN_LABELS[region.kind],
    gradeLabel(region.grade),
    TRAVERSABILITY_LABELS[region.traversability],
    region.label,
  ].filter(Boolean).join(' · ');
}

/**
 * LK Robotics — SpatialRegion
 *
 * Renderer-neutral behavior, facility, and terrain region rendered as an SVG
 * fragment. The application owns map filtering and the surrounding SVG.
 */
export function SpatialRegion({
  region,
  hidden = false,
  viewportScale = 1,
  selected = false,
  focused = false,
  disabled = false,
  invalid = false,
  stale = false,
  showLabel = true,
  onActivate,
  style,
  role,
  tabIndex,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
  onFocus,
  onBlur,
  onMouseDown,
  ...rest
}) {
  const reactId = React.useId();
  const [focusVisible, setFocusVisible] = React.useState(false);
  const obstacle = useNavigationObstacles();
  const kind = regionKind(region);
  const pattern = CATEGORY_PATTERNS[region.category] ?? CATEGORY_PATTERNS.behavior;
  const safeId = `${region.id}-${reactId}`.replace(/[^a-zA-Z0-9_-]/g, '');
  const patternId = `lk-spatial-region-${safeId}`;
  const anchor = pointOnSurface(region.shape);
  const inverseScale = 1 / safeScale(viewportScale);
  const interactive = typeof onActivate === 'function';
  const pointerOnly = ariaHidden === true || ariaHidden === 'true';
  const activeFocus = !pointerOnly && (focused || focusVisible);
  const computedLabel = [
    semanticLabel(region),
    selected ? '선택됨' : undefined,
    activeFocus ? '포커스됨' : undefined,
    invalid ? '잘못된 영역' : undefined,
    stale ? '데이터 지연' : undefined,
    disabled ? '선택할 수 없음' : undefined,
  ].filter(Boolean).join(' · ');
  const stroke = strokeForRegion(region, { disabled, invalid });
  const unknownTerrain = region.category === 'terrain' && region.traversability === 'unknown';
  const stateDash = invalid ? NAV_DASH.invalid : stale ? NAV_DASH.staleShape : unknownTerrain ? NAV_DASH.unknown : undefined;

  if (hidden) return null;

  const activate = (event) => {
    if (disabled || !interactive) return;
    onActivate(region.id, event);
  };

  const handleKeyDown = (event) => {
    if (!pointerOnly) setFocusVisible(true);
    if (pointerOnly || disabled || !interactive || event.repeat) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    activate(event);
  };

  const patternSize = pattern === 'grid' ? 10 : pattern === 'contour' ? 12 : 9;

  return (
    <g
      {...rest}
      role={pointerOnly ? undefined : role ?? (interactive ? 'button' : 'img')}
      tabIndex={pointerOnly ? undefined : interactive ? (disabled ? -1 : (tabIndex ?? 0)) : tabIndex}
      focusable={pointerOnly ? 'false' : interactive && !disabled ? 'true' : undefined}
      aria-hidden={pointerOnly || undefined}
      aria-label={pointerOnly ? undefined : ariaLabel ?? computedLabel}
      aria-pressed={!pointerOnly && interactive ? selected : undefined}
      aria-disabled={!pointerOnly && interactive && disabled ? true : undefined}
      aria-invalid={!pointerOnly && invalid ? true : undefined}
      data-lds-spatial-region=""
      data-region-id={region.id}
      data-map-id={region.mapId}
      data-region-category={region.category}
      data-region-kind={kind}
      data-region-pattern={pattern}
      data-traversability={region.category === 'terrain' ? region.traversability : undefined}
      data-selected={selected || undefined}
      data-focused={activeFocus || undefined}
      data-invalid={invalid || undefined}
      data-stale={stale || undefined}
      data-disabled={disabled || undefined}
      onClick={activate}
      onKeyDown={handleKeyDown}
      onMouseDown={(event) => {
        if (pointerOnly) event.preventDefault();
        onMouseDown?.(event);
      }}
      onFocus={(event) => {
        if (!pointerOnly) setFocusVisible(isFocusVisibleTarget(event.currentTarget));
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocusVisible(false);
        onBlur?.(event);
      }}
      style={{
        cursor: interactive && !disabled ? 'pointer' : disabled ? 'not-allowed' : 'default',
        opacity: navStateOpacity(disabled, stale),
        outline: 'none',
        ...style,
      }}
    >
      <defs>
        <pattern
          id={patternId}
          width={patternSize}
          height={patternSize}
          patternUnits="userSpaceOnUse"
          data-region-pattern-definition={pattern}
        >
          {patternContent(pattern, stroke)}
        </pattern>
      </defs>

      {activeFocus && (
        <RegionShape
          shape={region.shape}
          fill="none"
          stroke="var(--color-semantic-focus-indicator)"
          strokeWidth={NAV_FOCUS.regionStrokeWidth}
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
          data-region-focus-ring=""
        />
      )}
      {selected && (
        <RegionShape
          shape={region.shape}
          fill="none"
          stroke="var(--viewer-accent, var(--color-semantic-primary-normal))"
          strokeWidth={NAV_SELECTION.regionStrokeWidth}
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
          data-region-selection-ring=""
        />
      )}
      <RegionShape
        shape={region.shape}
        fill={`url(#${patternId})`}
        stroke={stroke}
        strokeWidth="1.5"
        strokeDasharray={stateDash}
        vectorEffect="non-scaling-stroke"
        data-region-geometry={region.shape.kind}
      />

      {(invalid || stale) && (
        <g
          {...obstacle(`region:${region.id}:states`)}
          transform={`translate(${anchor.x} ${anchor.y}) scale(${inverseScale})`}
          pointerEvents="none"
          data-region-state-anchor=""
          data-region-anchor-x={anchor.x}
          data-region-anchor-y={anchor.y}
        >
          {invalid && (
            <g transform="translate(0 -18)" data-region-invalid-mark="">
              <circle r={NAV_STATE_BADGE.radius} fill="var(--viewer-surface-elevated, var(--color-semantic-background-elevated-normal))" stroke="var(--viewer-danger, var(--color-semantic-status-negative-foreground))" strokeWidth={NAV_STATE_BADGE.strokeWidth} vectorEffect="non-scaling-stroke" />
              <NavigationStateGlyph kind="invalid" size={10.5} color="var(--viewer-foreground, var(--color-semantic-label-strong))" />
            </g>
          )}
          {stale && (
            <g transform={`translate(0 ${invalid ? 18 : -18})`} data-region-stale-mark="">
              <circle r={NAV_STATE_BADGE.radius} fill="var(--viewer-surface-elevated, var(--color-semantic-background-elevated-normal))" stroke="var(--viewer-muted, var(--color-semantic-label-alternative))" strokeWidth={NAV_STATE_BADGE.strokeWidth} strokeDasharray={NAV_DASH.staleRing} vectorEffect="non-scaling-stroke" />
              <NavigationStateGlyph kind="stale" size={10.5} color="var(--viewer-foreground, var(--color-semantic-label-strong))" />
            </g>
          )}
        </g>
      )}

      {showLabel && (
        <NavigationAnnotationBlock
          id={`region:${region.id}:label`}
          kind="region-label"
          anchor={anchor}
          priority={annotationPriority({
            selected,
            focused: activeFocus,
            alarm: invalid,
          })}
        >
          <g
            transform={`translate(${anchor.x} ${anchor.y}) scale(${inverseScale})`}
            pointerEvents="none"
            data-region-label=""
            data-region-anchor-x={anchor.x}
            data-region-anchor-y={anchor.y}
          >
            <text
              x="0"
              y="0"
              textAnchor="middle"
              dominantBaseline="central"
              fill="var(--viewer-foreground, var(--color-semantic-label-strong))"
              stroke="var(--viewer-surface, var(--color-semantic-background-normal-normal))"
              strokeWidth={NAV_LABEL_HALO.primary}
              paintOrder="stroke"
              vectorEffect="non-scaling-stroke"
              style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--caption1-size)', fontWeight: 'var(--fw-bold)' }}
            >
              {region.label?.trim() || semanticLabel(region)}
            </text>
          </g>
        </NavigationAnnotationBlock>
      )}
    </g>
  );
}
