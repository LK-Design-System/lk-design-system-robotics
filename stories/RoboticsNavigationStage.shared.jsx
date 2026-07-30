import React from 'react';
import { NavigationStateGlyph } from '@lk-robotics/lds-robotics-ui/components/robotics/_NavigationStateGlyph';
import { NavigationRoleGlyph, ROLE_GLYPH_KINDS } from '../src/components/robotics/_navigationRoleGlyph.js';
import {
  NAV_NODE,
  NAV_WAYPOINT_AVAILABILITY_FILL,
} from '../src/components/robotics/_navigationVocabulary.js';
import { ANNOTATION_CODE, ROLE_CODE } from '@lk-robotics/lds-robotics-ui/components/robotics/_navigationEncoding';

/**
 * Shared visual foundation for the LDS Robotics / Navigation story groups
 * (Waypoint, Lane, Regions, Route & Trajectory, Facility Transition).
 *
 * Before this module each group drew its own ad-hoc backdrop — a flat grey
 * rect here, a crosshair there, a bare grid elsewhere — so the series read as
 * five unfinished wireframes instead of one facility-map system. These helpers
 * give every group the same framed, gridded "stage" with depth and a scale
 * bar, plus a Legend that decodes the terse on-map role/state codes.
 *
 * Everything is theme-aware through the same `--viewer-*` tokens the overlay
 * components already use, so light and dark maps stay in sync.
 */

const STAGE_SURFACE = 'var(--viewer-surface-elevated, var(--color-semantic-background-elevated-normal))';
const STAGE_SUNKEN = 'var(--viewer-surface, var(--color-semantic-background-normal-alternative))';
const STAGE_BORDER = 'var(--viewer-border, var(--color-semantic-line-normal-normal))';
const STAGE_GRID = 'var(--viewer-border, var(--color-semantic-line-normal-neutral))';
const STAGE_FOREGROUND = 'var(--viewer-foreground, var(--color-semantic-label-strong))';
const STAGE_MUTED = 'var(--viewer-muted, var(--color-semantic-label-neutral))';

const MONO_FONT = 'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)';

/**
 * One size for every ambient mark on the stage — map id, compass, scale bar,
 * legend group headings, legend codes. These were previously hand-set to 8, 9,
 * 10, and 11 raw px, which put four unrelated sizes on a single map and pushed
 * the compass below any legible floor. The overlays themselves already ride a
 * three-step token ramp (label2 · caption1 · caption2); chrome now sits on its
 * bottom step instead of inventing a scale beneath it.
 */
const STAGE_CHROME_SIZE = 'var(--caption2-size)';

// ---------------------------------------------------------------------------
// Shared semantic encoding — a single source the map badges and the Legend
// both read from, so what the operator sees on the floor plan matches the key.
// ---------------------------------------------------------------------------

// Codes come from the shared _navigationEncoding source so the map badges and
// this legend can never drift; only the Korean display copy lives here.
export const NAV_ROLE_LEGEND = {
  holding: { code: ROLE_CODE.holding, label: '대기 가능' },
  passthrough: { code: ROLE_CODE.passthrough, label: '정차 금지 통과' },
  parking: { code: ROLE_CODE.parking, label: '비상 주차' },
  charger: { code: ROLE_CODE.charger, label: '충전' },
};

export const NAV_ANNOTATION_LEGEND = {
  dock: { code: ANNOTATION_CODE.dock, label: '도킹' },
  cleaning: { code: ANNOTATION_CODE.cleaning, label: '청소 스테이션' },
  dispenser: { code: ANNOTATION_CODE.dispenser, label: '자재 공급' },
  ingestor: { code: ANNOTATION_CODE.ingestor, label: '자재 수거' },
  'lift-approach': { code: ANNOTATION_CODE['lift-approach'], label: '승강기 접근' },
  'door-approach': { code: ANNOTATION_CODE['door-approach'], label: '문 접근' },
  mutex: { code: ANNOTATION_CODE.mutex, label: '상호 배제' },
  custom: { code: ANNOTATION_CODE.custom, label: '사용자 정의' },
};

/**
 * Region fill patterns and path stroke roles are the two encodings on these
 * maps that a reader cannot infer from the shape alone — a hatch is not
 * self-evidently "behaviour rule", and a dashed line is not self-evidently
 * "topology". Both were previously undecodable because the groups that use
 * them shipped without a key.
 *
 * The geometry below mirrors what SpatialRegion and the path overlays actually
 * paint (tile sizes, dash arrays, and core widths were read off the rendered
 * output), so the swatch is the same mark as the map rather than an
 * approximation of it.
 */
export const NAV_REGION_LEGEND = {
  behavior: {
    pattern: 'diagonal',
    tile: 9,
    color: 'var(--viewer-danger, var(--color-semantic-status-negative-foreground))',
    label: '동작 규칙',
  },
  facility: {
    pattern: 'dot',
    tile: 8,
    color: 'var(--viewer-accent, var(--color-semantic-primary-normal))',
    label: '설비 범위',
  },
  terrain: {
    pattern: 'contour',
    tile: 12,
    color: 'var(--viewer-warning, var(--color-semantic-status-cautionary-foreground))',
    label: '지형 통행성',
  },
};

export const NAV_LINE_LEGEND = {
  lane: { color: STAGE_MUTED, width: 1.5, dash: '4 6', label: '레인 · 정적 토폴로지' },
  route: { color: 'var(--color-semantic-data-viz-series-5)', width: 1.5, dash: '4 6', label: 'Route · 선택된 계획' },
  trajectory: {
    color: 'var(--viewer-accent, var(--color-semantic-primary-normal))',
    width: 2.25,
    dash: null,
    label: '궤적 · 실제 주행',
  },
};

// state key -> { label, glyph kind for NavigationStateGlyph | null, tone token }
export const NAV_STATE_LEGEND = {
  available: { label: '사용 가능', glyph: null, tone: 'var(--color-semantic-status-positive-foreground)' },
  unknown: { label: '상태 미확인', glyph: 'unknown', tone: 'var(--color-semantic-status-cautionary-foreground)' },
  unavailable: { label: '사용 불가', glyph: 'slash', tone: 'var(--color-semantic-status-negative-foreground)' },
  invalid: { label: '데이터 오류', glyph: 'invalid', tone: 'var(--color-semantic-status-negative-foreground)' },
  stale: { label: '오래된 데이터', glyph: 'stale', tone: STAGE_MUTED },
  closed: { label: '폐쇄', glyph: 'closed', tone: 'var(--color-semantic-status-negative-foreground)' },
  conflict: { label: '충돌', glyph: 'conflict', tone: 'var(--color-semantic-status-negative-foreground)' },
};

// ---------------------------------------------------------------------------
// NavigationMapStage — the framed, gridded backdrop. Renders into a story's
// own <svg width/height/viewBox>. Marker, lane, and region fragments belong in
// its `children` slot, which paints BETWEEN the backdrop and the map chrome
// (eyebrow · north · scale bar): fixture geometry is free to route through any
// corner, and the chrome stays on top with a surface-halo knockout — the same
// legibility contract the annotation labels use — instead of silently
// disappearing under a path.
// ---------------------------------------------------------------------------

function buildGridPath(x0, y0, x1, y1, step, origin = 0) {
  const lines = [];
  const first = origin + Math.ceil((x0 - origin) / step) * step;
  for (let x = first; x <= x1; x += step) {
    lines.push(`M${round(x)} ${round(y0)}V${round(y1)}`);
  }
  const firstY = origin + Math.ceil((y0 - origin) / step) * step;
  for (let y = firstY; y <= y1; y += step) {
    lines.push(`M${round(x0)} ${round(y)}H${round(x1)}`);
  }
  return lines.join('');
}

function round(value) {
  return Math.round(value * 100) / 100;
}

export function NavigationMapStage({
  width,
  height,
  margin = 12,
  radius = 14,
  minorGrid = 26,
  majorGrid,
  scaleBar = { px: 104, label: '5 m' },
  eyebrow,
  north = false,
  children,
}) {
  const reactId = React.useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const clipId = `nav-stage-clip-${reactId}`;
  const vignetteId = `nav-stage-vignette-${reactId}`;
  const sheenId = `nav-stage-sheen-${reactId}`;

  const fx = margin;
  const fy = margin;
  const fw = width - margin * 2;
  const fh = height - margin * 2;
  const major = majorGrid ?? minorGrid * 4;

  const minorD = buildGridPath(fx, fy, fx + fw, fy + fh, minorGrid, fx);
  const majorD = buildGridPath(fx, fy, fx + fw, fy + fh, major, fx);

  return (
    <>
      <g data-navigation-stage="" aria-hidden="true" pointerEvents="none">
        <defs>
          <clipPath id={clipId}>
            <rect x={fx} y={fy} width={fw} height={fh} rx={radius} ry={radius} />
          </clipPath>
          <radialGradient id={vignetteId} cx="50%" cy="42%" r="75%">
            <stop offset="60%" stopColor="var(--color-semantic-static-black)" stopOpacity="0" />
            <stop offset="100%" stopColor="var(--color-semantic-static-black)" stopOpacity="0.06" />
          </radialGradient>
          <linearGradient id={sheenId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-semantic-static-white)" stopOpacity="0.10" />
            <stop offset="16%" stopColor="var(--color-semantic-static-white)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Soft cast shadow gives the panel a lifted, physical edge. */}
        <rect
          x={fx}
          y={fy + 3}
          width={fw}
          height={fh}
          rx={radius}
          ry={radius}
          fill="var(--color-semantic-static-black)"
          opacity="0.05"
        />

        {/* Panel surface. */}
        <rect
          data-navigation-stage-surface=""
          // 라벨 협상의 경계를 SVG 박스가 아니라 이 패널로 잡는다. 패널은 SVG
          // 안쪽으로 margin만큼 들어와 있어서, 경계가 SVG면 라벨이 "안에 있다"고
          // 판정되면서도 화면에서는 그려진 지도 밖 여백에 앉는다.
          data-navigation-label-boundary=""
          x={fx}
          y={fy}
          width={fw}
          height={fh}
          rx={radius}
          ry={radius}
          fill={STAGE_SURFACE}
          stroke={STAGE_BORDER}
          vectorEffect="non-scaling-stroke"
        />

        <g clipPath={`url(#${clipId})`}>
          <path d={minorD} fill="none" stroke={STAGE_GRID} strokeWidth="1" strokeOpacity="0.4" vectorEffect="non-scaling-stroke" />
          <path d={majorD} fill="none" stroke={STAGE_GRID} strokeWidth="1" strokeOpacity="0.75" vectorEffect="non-scaling-stroke" />
          <rect x={fx} y={fy} width={fw} height={fh} fill={`url(#${vignetteId})`} />
          <rect x={fx} y={fy} width={fw} height={fh} fill={`url(#${sheenId})`} />
        </g>

        {/* Crisp inner keyline over the grid for a finished frame. */}
        <rect
          x={fx}
          y={fy}
          width={fw}
          height={fh}
          rx={radius}
          ry={radius}
          fill="none"
          stroke={STAGE_BORDER}
          vectorEffect="non-scaling-stroke"
        />
      </g>

      {/* Map content: paints above the backdrop, below the chrome. Lives
          outside the aria-hidden/pointer-events:none stage groups so
          interactive fragments keep their semantics and hit targets. */}
      {children}

      {/* Map chrome stays legible above any fixture geometry: each mark wears
          the surface-halo knockout (paint-order: stroke) the annotation labels
          already use, instead of vanishing under a path that crosses its
          corner. */}
      <g data-navigation-stage-chrome="" aria-hidden="true" pointerEvents="none">
        {eyebrow && (
          <text
            data-navigation-stage-eyebrow=""
            data-navigation-annotation-obstacle="map-header"
            x={fx + 14}
            y={fy + 20}
            fill={STAGE_MUTED}
            stroke={STAGE_SURFACE}
            strokeWidth="3"
            strokeLinejoin="round"
            paintOrder="stroke"
            style={{ fontFamily: MONO_FONT, fontSize: STAGE_CHROME_SIZE, fontWeight: 'var(--fw-bold)', letterSpacing: '1.4px' }}
          >
            {eyebrow}
          </text>
        )}

        {north && (
          <g
            data-navigation-stage-north=""
            data-navigation-annotation-obstacle="north-indicator"
            transform={`translate(${fx + fw - 20} ${fy + 22})`}
          >
            <path d="M0 -9 L4 6 L0 2 L-4 6 Z" fill={STAGE_MUTED} stroke={STAGE_SURFACE} strokeWidth="2.5" strokeLinejoin="round" paintOrder="stroke" />
            <text x="0" y="17" textAnchor="middle" fill={STAGE_MUTED} stroke={STAGE_SURFACE} strokeWidth="2.5" strokeLinejoin="round" paintOrder="stroke" style={{ fontFamily: MONO_FONT, fontSize: STAGE_CHROME_SIZE, fontWeight: 'var(--fw-bold)', letterSpacing: '0.5px' }}>N</text>
          </g>
        )}

        {scaleBar && (
          <g
            data-navigation-stage-scalebar=""
            data-navigation-annotation-obstacle="scale-bar"
            transform={`translate(${fx + 14} ${fy + fh - 16})`}
          >
            <path
              d={`M0 0 H${scaleBar.px} M0 -3 V3 M${scaleBar.px} -3 V3`}
              fill="none"
              stroke={STAGE_SURFACE}
              strokeWidth="4.5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={`M0 0 H${scaleBar.px} M0 -3 V3 M${scaleBar.px} -3 V3`}
              fill="none"
              stroke={STAGE_MUTED}
              strokeWidth="1.25"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            <text
              x={scaleBar.px / 2}
              y="-6"
              textAnchor="middle"
              fill={STAGE_MUTED}
              stroke={STAGE_SURFACE}
              strokeWidth="3"
              strokeLinejoin="round"
              paintOrder="stroke"
              style={{ fontFamily: MONO_FONT, fontSize: STAGE_CHROME_SIZE, fontWeight: 'var(--fw-semibold)', letterSpacing: '0.4px' }}
            >
              {scaleBar.label}
            </text>
          </g>
        )}
      </g>
    </>
  );
}

// ---------------------------------------------------------------------------
// Legend — decodes the terse on-map codes (H·P·C, disp·ing, ?, !) next to the
// map so the abbreviations stop being a private cipher.
// ---------------------------------------------------------------------------

function StateSwatch({ kind }) {
  const entry = NAV_STATE_LEGEND[kind];
  const tone = entry?.tone ?? STAGE_MUTED;
  return (
    <svg width="20" height="20" viewBox="-10 -10 20 20" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
      {kind === 'available' ? (
        <circle r="5.5" fill={STAGE_SURFACE} stroke={tone} strokeWidth="2" />
      ) : kind === 'unavailable' ? (
        <>
          <circle r="6" fill={STAGE_SURFACE} stroke={tone} strokeWidth="2" />
          <path d="M-4 4 L4 -4" stroke={tone} strokeWidth="2" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle r="7" fill={STAGE_SURFACE} stroke={tone} strokeWidth="1.5" />
          {entry?.glyph && <NavigationStateGlyph kind={entry.glyph} size={11} color={STAGE_FOREGROUND} />}
        </>
      )}
    </svg>
  );
}

function WaypointStateSwatch({ kind }) {
  const fill = NAV_WAYPOINT_AVAILABILITY_FILL[kind]
    ?? NAV_WAYPOINT_AVAILABILITY_FILL.unknown;
  return (
    <svg
      width="24"
      height="24"
      viewBox="-12 -12 24 24"
      aria-hidden="true"
      data-waypoint-legend-state={kind}
      style={{ display: 'block', flexShrink: 0 }}
    >
      <rect
        {...NAV_NODE.rect(NAV_NODE.radius + 0.5, NAV_NODE.cornerRadius + 0.5)}
        transform="translate(0 1.4)"
        fill="var(--color-semantic-static-black)"
        opacity="0.16"
      />
      <rect
        {...NAV_NODE.rect(NAV_NODE.radius, NAV_NODE.cornerRadius)}
        fill={fill}
        stroke={STAGE_SURFACE}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Every waypoint role shows its glyph in a code-sized chip so the legend mirrors
// what the map draws.
function RoleGlyphSwatch({ role }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 20,
        height: 20,
        padding: '0 6px',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--color-semantic-fill-normal)',
      }}
    >
      <svg width="12" height="12" viewBox="-7 -7 14 14" aria-hidden="true" style={{ display: 'block' }}>
        <NavigationRoleGlyph kind={role} size={11} color="var(--color-semantic-label-strong)" />
      </svg>
    </span>
  );
}

function RegionPatternSwatch({ kind }) {
  const entry = NAV_REGION_LEGEND[kind];
  const reactId = React.useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const patternId = `nav-legend-region-${kind}-${reactId}`;
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
      <defs>
        <pattern id={patternId} width={entry.tile} height={entry.tile} patternUnits="userSpaceOnUse">
          {entry.pattern === 'dot' && (
            <circle cx="4" cy="4" r="1.35" fill={entry.color} fillOpacity="0.5" />
          )}
          {entry.pattern === 'contour' && (
            <path
              d="M-2 3C1 1 4 1 7 3S13 5 16 3M-2 9C1 7 4 7 7 9S13 11 16 9"
              fill="none"
              stroke={entry.color}
              strokeOpacity="0.48"
              strokeWidth="1"
            />
          )}
          {entry.pattern === 'diagonal' && (
            <path d="M-3 12L12-3M3 15L15 3" fill="none" stroke={entry.color} strokeOpacity="0.5" strokeWidth="1" />
          )}
        </pattern>
      </defs>
      <rect
        x="0.75"
        y="0.75"
        width="18.5"
        height="18.5"
        rx="3"
        fill={`url(#${patternId})`}
        stroke={entry.color}
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function LineRoleSwatch({ kind }) {
  const entry = NAV_LINE_LEGEND[kind];
  return (
    <svg width="28" height="20" viewBox="0 0 28 20" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
      {/* Same casing-then-core order the overlays use, so the swatch keeps its
          contrast on the legend surface exactly as it does on the map. */}
      <path d="M2 10H26" fill="none" stroke={STAGE_SURFACE} strokeWidth={entry.width + 2.5} strokeLinecap="round" />
      <path
        d="M2 10H26"
        fill="none"
        stroke={entry.color}
        strokeWidth={entry.width}
        strokeDasharray={entry.dash ?? undefined}
        strokeLinecap="round"
      />
    </svg>
  );
}

function LegendGroup({ title, children }) {
  return (
    <div style={{ display: 'grid', gap: 'var(--space-2)', minWidth: 0 }}>
      <div
        style={{
          fontFamily: MONO_FONT,
          fontSize: STAGE_CHROME_SIZE,
          fontWeight: 'var(--fw-extra)',
          letterSpacing: '1.4px',
          textTransform: 'uppercase',
          color: 'var(--color-semantic-label-neutral)',
        }}
      >
        {title}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2) var(--space-4)' }}>{children}</div>
    </div>
  );
}

function LegendRow({ swatch, code, label }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0 }}>
      {swatch}
      {code != null && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 20,
            height: 20,
            padding: '0 6px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-semantic-fill-normal)',
            color: 'var(--color-semantic-label-strong)',
            fontFamily: MONO_FONT,
            fontSize: STAGE_CHROME_SIZE,
            fontWeight: 'var(--fw-bold)',
            lineHeight: 1,
          }}
        >
          {code}
        </span>
      )}
      <span style={{ fontSize: 'var(--caption1-size)', color: 'var(--color-semantic-label-normal)' }}>{label}</span>
    </div>
  );
}

/**
 * @param {object} props
 * @param {string} [props.title]
 * @param {string[]} [props.roles]        role keys from NAV_ROLE_LEGEND
 * @param {string[]} [props.annotations]  annotation keys from NAV_ANNOTATION_LEGEND
 * @param {string[]} [props.states]       state keys from NAV_STATE_LEGEND
 * @param {string[]} [props.regions]      category keys from NAV_REGION_LEGEND
 * @param {string[]} [props.lines]        role keys from NAV_LINE_LEGEND
 * @param {'glyph'|'waypoint'} [props.statePresentation]
 */
export function NavigationLegend({
  title = '지도 범례',
  roles,
  annotations,
  states,
  regions,
  lines,
  // Free-form notation rows ({ code | swatch, label }) for marks that are not in
  // the fixed vocabulary groups — e.g. the lane endpoint reference token, or the
  // T-count badge whose "T2" otherwise reads as an ordinal instead of a count.
  notes,
  statePresentation = 'glyph',
  style,
  ...rest
}) {
  return (
    <aside
      data-navigation-legend=""
      style={{
        display: 'grid',
        gap: 'var(--space-4)',
        alignContent: 'start',
        padding: 'var(--space-4)',
        border: '1px solid var(--color-semantic-line-normal-normal)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-semantic-background-elevated-normal)',
        minWidth: 0,
        ...style,
      }}
      {...rest}
    >
      {title && (
        <div style={{ fontSize: 'var(--label2-size)', fontWeight: 'var(--fw-bold)', color: 'var(--color-semantic-label-strong)' }}>
          {title}
        </div>
      )}
      {roles?.length > 0 && (
        <LegendGroup title="역할">
          {roles.map((key) => {
            const entry = NAV_ROLE_LEGEND[key];
            if (!entry) return null;
            if (ROLE_GLYPH_KINDS.has(key)) {
              return <LegendRow key={key} swatch={<RoleGlyphSwatch role={key} />} label={entry.label} />;
            }
            return <LegendRow key={key} code={entry.code} label={entry.label} />;
          })}
        </LegendGroup>
      )}
      {regions?.length > 0 && (
        <LegendGroup title="영역 분류">
          {regions.map((key) => {
            const entry = NAV_REGION_LEGEND[key];
            if (!entry) return null;
            return <LegendRow key={key} swatch={<RegionPatternSwatch kind={key} />} label={entry.label} />;
          })}
        </LegendGroup>
      )}
      {lines?.length > 0 && (
        <LegendGroup title="경로 표현">
          {lines.map((key) => {
            const entry = NAV_LINE_LEGEND[key];
            if (!entry) return null;
            return <LegendRow key={key} swatch={<LineRoleSwatch kind={key} />} label={entry.label} />;
          })}
        </LegendGroup>
      )}
      {annotations?.length > 0 && (
        <LegendGroup title="시설 주석">
          {annotations.map((key) => {
            const entry = NAV_ANNOTATION_LEGEND[key];
            if (!entry) return null;
            return <LegendRow key={key} code={entry.code} label={entry.label} />;
          })}
        </LegendGroup>
      )}
      {notes?.length > 0 && (
        <LegendGroup title="표기">
          {notes.map((note) => (
            <LegendRow key={note.label} code={note.code} swatch={note.swatch} label={note.label} />
          ))}
        </LegendGroup>
      )}
      {states?.length > 0 && (
        <LegendGroup title="상태">
          {states.map((key) => {
            const entry = NAV_STATE_LEGEND[key];
            if (!entry) return null;
            const swatch = statePresentation === 'waypoint'
              ? <WaypointStateSwatch kind={key} />
              : <StateSwatch kind={key} />;
            return <LegendRow key={key} swatch={swatch} label={entry.label} />;
          })}
        </LegendGroup>
      )}
    </aside>
  );
}
