import React from 'react';
import { NavigationStateGlyph } from '@lk-robotics/lds-robotics-ui/components/robotics/_NavigationStateGlyph';
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
// NavigationMapStage — the framed, gridded backdrop. Renders an SVG <g> meant
// to be the first child of a story's own <svg width/height/viewBox>. Marker,
// lane, and region fragments are drawn on top of it in the same coordinates.
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
        {children}
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

      {eyebrow && (
        <text
          data-navigation-stage-eyebrow=""
          x={fx + 14}
          y={fy + 20}
          fill={STAGE_MUTED}
          style={{ fontFamily: MONO_FONT, fontSize: '10px', fontWeight: 'var(--fw-bold)', letterSpacing: '1.4px' }}
        >
          {eyebrow}
        </text>
      )}

      {north && (
        <g data-navigation-stage-north="" transform={`translate(${fx + fw - 20} ${fy + 22})`}>
          <path d="M0 -9 L4 6 L0 2 L-4 6 Z" fill={STAGE_MUTED} />
          <text x="0" y="17" textAnchor="middle" fill={STAGE_MUTED} style={{ fontFamily: MONO_FONT, fontSize: '8px', fontWeight: 'var(--fw-bold)', letterSpacing: '0.5px' }}>N</text>
        </g>
      )}

      {scaleBar && (
        <g data-navigation-stage-scalebar="" transform={`translate(${fx + 14} ${fy + fh - 16})`}>
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
            style={{ fontFamily: MONO_FONT, fontSize: '9px', fontWeight: 'var(--fw-semibold)', letterSpacing: '0.4px' }}
          >
            {scaleBar.label}
          </text>
        </g>
      )}
    </g>
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

function LegendGroup({ title, children }) {
  return (
    <div style={{ display: 'grid', gap: 'var(--space-2)', minWidth: 0 }}>
      <div
        style={{
          fontFamily: MONO_FONT,
          fontSize: 10,
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
            fontSize: 11,
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
 */
export function NavigationLegend({ title = '지도 범례', roles, annotations, states, style, ...rest }) {
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
            return <LegendRow key={key} code={entry.code} label={entry.label} />;
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
      {states?.length > 0 && (
        <LegendGroup title="상태">
          {states.map((key) => {
            const entry = NAV_STATE_LEGEND[key];
            if (!entry) return null;
            return <LegendRow key={key} swatch={<StateSwatch kind={key} />} label={entry.label} />;
          })}
        </LegendGroup>
      )}
    </aside>
  );
}
