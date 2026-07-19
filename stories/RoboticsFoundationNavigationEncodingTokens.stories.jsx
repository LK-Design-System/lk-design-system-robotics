import React from 'react';
import { NavigationStateGlyph } from '@lk-robotics/lds-robotics-ui/components/robotics/_NavigationStateGlyph';
import {
  navStateOpacity,
  NAV_STATE_OPACITY,
  NAV_PROGRESS_HEAD,
  NAV_DASH,
  NAV_HIT,
  NAV_STATE_BADGE,
  NAV_LABEL_HALO,
} from '@lk-robotics/lds-robotics-ui/components/robotics/_navigationVocabulary';
import { NavigationProgressHeadDefs } from '@lk-robotics/lds-robotics-ui/components/robotics/_navigationProgressHead';
import { annotationPriority, KIND_WEIGHT } from '@lk-robotics/lds-robotics-ui/components/robotics/_navigationAnnotations';
import { WaypointMarker, FacilityTransition, SpatialRegion, LaneOverlay } from './lds.js';
import { storyDescription } from './StoryGuide.shared.jsx';

// This page renders the REAL shared encoding tokens — every dash, opacity, badge,
// hit target, and halo swatch is drawn straight from the internal
// `_navigationVocabulary` constants. So the catalog is not a hand-drawn
// approximation: it IS the tokens, and the play-test asserts the rendered DOM
// equals the constants, which makes the vocabulary its own regression baseline.
// (The shared map-pin BODY, NAV_PIN, is a drawable marker silhouette rather than
// a scalar token, so it lives on its own Foundation/Marker Pin page.)
const INK = 'var(--color-semantic-label-strong)';
const MUTED = 'var(--color-semantic-label-neutral)';
const LINE = 'var(--color-semantic-line-normal-normal)';
const SURFACE = 'var(--color-semantic-background-elevated-normal)';
const ACCENT = 'var(--viewer-accent, var(--color-semantic-primary-normal))';
const ROUTE_TONE = 'var(--viewer-warning, var(--color-semantic-status-cautionary-foreground))';

// The shared, unifiable dash tokens (small ring + region/shape outline). Path
// dashes stay component-local by design, so they are named here but not owned.
const DASH_ROWS = [
  { key: 'staleRing', label: '오래된 상태 링 (badge·indicator)' },
  { key: 'staleShape', label: '오래된 데이터 (구역·설비 외곽선)' },
  { key: 'unknown', label: '미확인 (traversability/availability)' },
  { key: 'invalid', label: '데이터 오류 (shape·ring)' },
];

const OPACITY_ROWS = [
  { key: 'default', disabled: false, stale: false, label: '기본' },
  { key: 'stale', disabled: false, stale: true, label: '지연 데이터' },
  { key: 'disabled', disabled: true, stale: false, label: '비활성' },
];

const HALO_ROWS = [
  { key: 'primary', label: '식별 라벨 (primary)' },
  { key: 'secondary', label: '상세 라벨 (secondary)' },
  { key: 'caption', label: '메타 라벨 (caption)' },
];

function Card({ title, hint, children }) {
  return (
    <section
      style={{
        display: 'grid',
        gap: 12,
        padding: 16,
        border: `1px solid ${LINE}`,
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-semantic-background-normal-normal)',
      }}
    >
      <header style={{ display: 'grid', gap: 4 }}>
        <h2 style={{ margin: 0, fontSize: 'var(--label1-size)', color: INK }}>{title}</h2>
        <p style={{ margin: 0, fontSize: 'var(--caption1-size)', color: MUTED, lineHeight: 1.6 }}>{hint}</p>
      </header>
      {children}
    </section>
  );
}

function Tile({ children, label, mono }) {
  return (
    <div
      style={{
        display: 'grid',
        placeItems: 'center',
        gap: 8,
        minHeight: 108,
        padding: 12,
        border: `1px solid ${LINE}`,
        borderRadius: 'var(--radius-sm)',
        background: SURFACE,
      }}
    >
      {children}
      {mono ? <code style={{ fontSize: 11, color: MUTED }}>{mono}</code> : null}
      <span style={{ fontSize: 11, color: INK, textAlign: 'center' }}>{label}</span>
    </div>
  );
}

function DashSwatches() {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {DASH_ROWS.map((row) => (
        <div key={row.key} style={{ display: 'grid', gridTemplateColumns: '150px 1fr', alignItems: 'center', gap: 12 }}>
          <code style={{ fontSize: 11, color: MUTED }}>{`NAV_DASH.${row.key} · ${NAV_DASH[row.key]}`}</code>
          <div style={{ display: 'grid', gap: 3 }}>
            <svg width="100%" height={14} viewBox="0 0 240 14" preserveAspectRatio="none" aria-hidden="true" style={{ display: 'block' }}>
              <line
                x1="2"
                y1="7"
                x2="238"
                y2="7"
                stroke={INK}
                strokeWidth="2"
                strokeDasharray={NAV_DASH[row.key]}
                data-encoding-dash={row.key}
              />
            </svg>
            <span style={{ fontSize: 11, color: INK }}>{row.label}</span>
          </div>
        </div>
      ))}
      <p style={{ margin: '4px 0 0', fontSize: 11, color: MUTED, lineHeight: 1.6 }}>
        availability-unavailable dash와 lane/route/trajectory의 path·segment·status dash는 서로 다른 stroke 기하에
        얹히는 component 고유 encoding이라 이 공용 집합에 넣지 않습니다.
      </p>
    </div>
  );
}

function OpacitySwatches() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
      {OPACITY_ROWS.map((row) => (
        <Tile key={row.key} label={row.label} mono={`${navStateOpacity(row.disabled, row.stale)}`}>
          <svg width={44} height={44} viewBox="-22 -22 44 44" aria-hidden="true" style={{ display: 'block' }}>
            <circle
              r="12"
              fill={ACCENT}
              opacity={navStateOpacity(row.disabled, row.stale)}
              data-encoding-opacity={row.key}
            />
          </svg>
        </Tile>
      ))}
    </div>
  );
}

function BadgeAndHit() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 10 }}>
      <Tile label={`상태 badge · r=${NAV_STATE_BADGE.radius}, stroke=${NAV_STATE_BADGE.strokeWidth}`} mono="NAV_STATE_BADGE">
        <svg width={44} height={44} viewBox="-16 -16 32 32" aria-hidden="true" style={{ display: 'block' }}>
          <circle
            r={NAV_STATE_BADGE.radius}
            fill={SURFACE}
            stroke={MUTED}
            strokeWidth={NAV_STATE_BADGE.strokeWidth}
            vectorEffect="non-scaling-stroke"
            data-encoding-badge=""
          />
          <NavigationStateGlyph kind="unknown" size={10} color={INK} />
        </svg>
      </Tile>
      <Tile label={`현재 진행 head · ${NAV_PROGRESS_HEAD.width}×${NAV_PROGRESS_HEAD.height}px open V`} mono="NAV_PROGRESS_HEAD">
        <svg width={72} height={44} viewBox="0 0 72 44" aria-hidden="true" style={{ display: 'block' }}>
          <NavigationProgressHeadDefs
            idPrefix="encoding-progress-head"
            tone={ACCENT}
            surface={SURFACE}
            inverseScale={1}
            role="route"
          />
          <line
            x1="8"
            y1="22"
            x2="58"
            y2="22"
            stroke={SURFACE}
            strokeWidth={NAV_PROGRESS_HEAD.route.casingWidth}
            strokeLinecap="round"
            markerEnd="url(#encoding-progress-head-casing)"
          />
          <line
            data-encoding-progress-head=""
            x1="8"
            y1="22"
            x2="58"
            y2="22"
            stroke={ACCENT}
            strokeWidth={NAV_PROGRESS_HEAD.route.coreWidth}
            strokeLinecap="round"
            markerEnd="url(#encoding-progress-head-core)"
          />
        </svg>
      </Tile>
      <Tile label={`hit target · r=${NAV_HIT.radius}, 최소 ${NAV_HIT.screenTargetSize} CSS px`} mono="NAV_HIT">
        <svg width={60} height={60} viewBox="-26 -26 52 52" aria-hidden="true" style={{ display: 'block' }}>
          <circle
            r={NAV_HIT.radius}
            fill="none"
            stroke={LINE}
            strokeWidth="1"
            strokeDasharray="2 3"
            data-encoding-hit=""
            data-screen-target-size={NAV_HIT.screenTargetSize}
          />
          <circle r="6.5" fill={ACCENT} />
        </svg>
      </Tile>
    </div>
  );
}

function HaloSwatches() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
      {HALO_ROWS.map((row) => (
        <Tile key={row.key} label={row.label} mono={`NAV_LABEL_HALO.${row.key} · ${NAV_LABEL_HALO[row.key]}`}>
          <svg width={160} height={30} viewBox="0 0 160 30" aria-hidden="true" style={{ display: 'block' }}>
            <text
              x="80"
              y="20"
              textAnchor="middle"
              fill={INK}
              stroke="var(--color-semantic-background-normal-normal)"
              strokeWidth={NAV_LABEL_HALO[row.key]}
              paintOrder="stroke"
              vectorEffect="non-scaling-stroke"
              data-encoding-halo={row.key}
              style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--caption1-size)', fontWeight: 'var(--fw-bold)' }}
            >
              라벨 halo
            </text>
          </svg>
        </Tile>
      ))}
    </div>
  );
}

// Screen-constant markers under zoom, shown with the REAL components. Both
// panels render the same real WaypointMarker and SpatialRegion; only the
// panel's zoom differs (its viewBox is halved for zoom 2, and each component
// gets the matching viewportScale). The marker inverse-scales, so it holds the
// same on-screen size in both, while the region is world geometry, so it grows
// with the zoom. No hand-drawn simulation — the components do it.
const ZOOM_MAP = 'zoom';
const ZOOM_REGION = { id: 'zoom-rg', mapId: ZOOM_MAP, category: 'behavior', rule: { kind: 'speed-limit' }, shape: { kind: 'circle', center: { x: 18, y: 16 }, radius: 8 } };
const ZOOM_WAYPOINT = { id: 'zoom-wp', mapId: ZOOM_MAP, position: { x: 36, y: 16 }, roles: ['holding'], availability: 'available' };

const ZOOM_PANELS = [
  { z: 1, viewBox: '-24 -16 96 64', label: '줌 1×' },
  { z: 2, viewBox: '0 0 48 32', label: '줌 2×' },
];

function ZoomPanel({ z, viewBox, label }) {
  return (
    <figure data-zoom-panel={z} style={{ margin: 0, display: 'grid', gap: 8, justifyItems: 'center' }}>
      <svg width={96} height={64} viewBox={viewBox} aria-hidden="true" style={{ display: 'block', border: `1px solid ${LINE}`, borderRadius: 'var(--radius-sm)', background: SURFACE }}>
        <SpatialRegion region={ZOOM_REGION} viewportScale={z} showLabel={false} />
        <WaypointMarker waypoint={ZOOM_WAYPOINT} viewportScale={z} showLabel={false} />
      </svg>
      <span style={{ fontSize: 11, color: INK, fontVariantNumeric: 'tabular-nums' }}>{label}</span>
    </figure>
  );
}

function ZoomCard() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(112px, max-content))', gap: 16, justifyContent: 'center' }}>
      {ZOOM_PANELS.map((panel) => (
        <ZoomPanel key={panel.z} z={panel.z} viewBox={panel.viewBox} label={panel.label} />
      ))}
    </div>
  );
}

// Label priority ladder. When two labels contend for one slot, the higher
// annotationPriority wins; ties break by KIND_WEIGHT (paint order), then id.
// Both scales are rendered straight from the source functions.
const STATE_WEIGHTS = [
  { key: 'selected', label: '선택됨' },
  { key: 'focused', label: '포커스됨' },
  { key: 'alarm', label: '경보' },
  { key: 'emphasized', label: '강조' },
];
const KIND_LADDER = [
  { label: '영역', kind: 'region-label' },
  { label: '레인', kind: 'lane-label' },
  { label: '경로', kind: 'route-segment-label' },
  { label: '궤적', kind: 'trajectory-label' },
  { label: '웨이포인트', kind: 'waypoint-label' },
  { label: '설비', kind: 'facility-label' },
];

function Pill({ children, hook }) {
  return (
    <span
      {...hook}
      style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, padding: '3px 9px', borderRadius: 'var(--radius-sm)', border: `1px solid ${LINE}`, background: SURFACE, fontSize: 'var(--caption1-size)', color: INK }}
    >
      {children}
    </span>
  );
}

function PriorityLadder() {
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontSize: 11, color: MUTED }}>상태 가중치 · annotationPriority()</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {STATE_WEIGHTS.map((state) => (
            <Pill key={state.key} hook={{ 'data-priority-state': state.key }}>
              <span>{state.label}</span>
              <code style={{ fontSize: 11, color: ACCENT, fontVariantNumeric: 'tabular-nums' }}>{annotationPriority({ [state.key]: true })}</code>
            </Pill>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontSize: 11, color: MUTED }}>동점 tie-break · KIND_WEIGHT (paint order)</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
          {KIND_LADDER.map((entry, index) => (
            <React.Fragment key={entry.kind}>
              {index > 0 && <span aria-hidden="true" style={{ color: MUTED }}>›</span>}
              <Pill hook={{ 'data-kind-weight': entry.kind }}>
                <span>{entry.label}</span>
                <code style={{ fontSize: 11, color: ACCENT, fontVariantNumeric: 'tabular-nums' }}>{KIND_WEIGHT[entry.kind]}</code>
              </Pill>
            </React.Fragment>
          ))}
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 11, color: MUTED, lineHeight: 1.6 }}>
        최종 규칙: 우선순위 내림차순 → 같으면 KIND_WEIGHT 내림차순(위에 그려지는 점 개체가 라벨을 지킴) → 그래도 같으면 id 오름차순. 마커·배지·핀은 부동 장애물이고 <b style={{ color: INK }}>라벨만</b> 재배치됩니다.
      </p>
    </div>
  );
}

// State layering, rendered with the REAL components (not hand-drawn) so the
// catalog is exactly what ships. Each renderer is shown in four states — base,
// focused, selected, focused+selected — proving focus (blue silhouette, outer)
// and selection (accent, inner) are independent axes that compose.
const SL_MAP = 'sl';
const SL_WAYPOINT = { id: 'sl-wp', mapId: SL_MAP, position: { x: 24, y: 26 }, roles: ['holding'], availability: 'available' };
const SL_REGION = { id: 'sl-rg', mapId: SL_MAP, category: 'behavior', rule: { kind: 'speed-limit' }, shape: { kind: 'circle', center: { x: 24, y: 24 }, radius: 13 } };
const SL_FACILITY = {
  id: 'sl-fc', kind: 'lift', label: '승강기', facilityId: 'lift',
  from: { mapId: SL_MAP, position: { x: 28, y: 30 } },
  availability: 'available', phase: 'approach', doorState: 'closed',
  motionState: 'stopped', operatingMode: 'agv', sessionState: 'requested',
  currentMapId: SL_MAP, destinationMapId: SL_MAP,
};
const SL_LANE = { id: 'sl-ln', mapId: SL_MAP, label: '차선', points: [{ x: 8, y: 40 }, { x: 24, y: 22 }, { x: 44, y: 12 }], relation: { kind: 'single' }, availability: 'available' };

const SL_STATES = [
  { key: 'base', label: '기본', props: {} },
  { key: 'focused', label: '포커스', props: { focused: true } },
  { key: 'selected', label: '선택', props: { selected: true } },
  { key: 'both', label: '포커스+선택', props: { focused: true, selected: true } },
];

const SL_ROWS = [
  { key: 'waypoint', label: '웨이포인트', viewBox: '2 4 44 44',
    render: (p) => <WaypointMarker waypoint={SL_WAYPOINT} showLabel={false} {...p} /> },
  { key: 'facility', label: '핀 (시설·해저드)', viewBox: '0 -14 56 64',
    render: (p) => <FacilityTransition transition={SL_FACILITY} activeMapId={SL_MAP} showLabel={false} {...p} /> },
  { key: 'region', label: '영역', viewBox: '0 0 48 48',
    render: (p) => <SpatialRegion region={SL_REGION} showLabel={false} {...p} /> },
  { key: 'lane', label: '경로 (레인·루트·궤적)', viewBox: '0 0 52 52',
    render: (p) => <LaneOverlay lane={SL_LANE} viewportScale={1} showLabel={false} showEndpoints={false} {...p} /> },
];

function StateLayerCard() {
  return (
    <div data-state-layer style={{ display: 'grid', gap: 12, minWidth: 0 }}>
      <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(64px, auto) repeat(4, 64px)', gap: 8, alignItems: 'center', width: 'min-content' }}>
        <span />
        {SL_STATES.map((s) => (
          <span key={s.key} style={{ fontSize: 11, fontWeight: 'var(--fw-semibold)', color: MUTED, textAlign: 'center' }}>{s.label}</span>
        ))}
        {SL_ROWS.map((row) => (
          <React.Fragment key={row.key}>
            <span style={{ fontSize: 12, fontWeight: 'var(--fw-semibold)', color: INK }}>{row.label}</span>
            {SL_STATES.map((s) => (
              <figure key={s.key} data-state-cell={`${row.key}:${s.key}`} style={{ margin: 0, display: 'grid', placeItems: 'center', padding: 4, border: `1px solid ${LINE}`, borderRadius: 'var(--radius-sm)', background: SURFACE }}>
                <svg width={64} height={64} viewBox={row.viewBox} aria-hidden="true" style={{ display: 'block' }}>
                  {row.render(s.props)}
                </svg>
              </figure>
            ))}
          </React.Fragment>
        ))}
      </div>
      </div>
      <p style={{ margin: 0, fontSize: 11, color: MUTED, lineHeight: 1.6 }}>
        파랑 = 포커스(실루엣 추적, 바깥) · accent = 선택(피처 강조, 안쪽). 둘은 독립이라 마지막 열처럼 동시에 성립하며, 포커스가 선택보다 바깥/위에 렌더됩니다. 실제 컴포넌트를 그대로 렌더한 것입니다.
      </p>
    </div>
  );
}

const PROGRESS_HEAD_REFERENCES = [
  {
    label: 'Mapbox Navigation · Route arrow',
    href: 'https://docs.mapbox.com/android/navigation/guides/ui-components/route-arrow/',
  },
  {
    label: 'TomTom · Route progress and instructions',
    href: 'https://developer.tomtom.com/navigation/android/guides/map-display/map-display-for-views/routes',
  },
  {
    label: 'W3C SVG · Path markers',
    href: 'https://www.w3.org/TR/svg-markers/',
  },
];

const PROGRESS_HEAD_STYLES = {
  open: {
    label: 'Line-integrated open progress head',
    note: 'active path 자체가 shaft이고 끝점에 열린 V만 marker-end로 붙습니다. Route와 Trajectory가 공유하는 확정된 현재 진행 문법입니다.',
  },
};

function ProgressHeadMarkerDefs({ idPrefix, scale = 1 }) {
  return (
    <>
      <NavigationProgressHeadDefs idPrefix={`${idPrefix}-route`} tone={ROUTE_TONE} surface={SURFACE} inverseScale={scale} role="route" />
      <NavigationProgressHeadDefs idPrefix={`${idPrefix}-trajectory`} tone={ACCENT} surface={SURFACE} inverseScale={scale} role="trajectory" />
    </>
  );
}

function ProgressHeadSpecimen({ kind }) {
  const idPrefix = `progress-specimen-${kind}`;
  return (
    <svg
      width="148"
      height="52"
      viewBox="0 0 148 52"
      role="img"
      aria-label={`${PROGRESS_HEAD_STYLES[kind].label} 확대 표본`}
      style={{ display: 'block', flex: '0 0 auto' }}
    >
      <ProgressHeadMarkerDefs idPrefix={idPrefix} />
      <line x1="8" y1="16" x2="66" y2="16" stroke={SURFACE} strokeWidth="7" strokeLinecap="round" markerEnd={`url(#${idPrefix}-route-casing)`} />
      <line x1="8" y1="16" x2="66" y2="16" stroke={ROUTE_TONE} strokeWidth="4" strokeLinecap="round" markerEnd={`url(#${idPrefix}-route-core)`} />
      <line x1="76" y1="36" x2="136" y2="36" stroke={SURFACE} strokeWidth="6.5" strokeLinecap="round" markerEnd={`url(#${idPrefix}-trajectory-casing)`} />
      <line x1="76" y1="36" x2="136" y2="36" stroke={ACCENT} strokeWidth="3.5" strokeLinecap="round" markerEnd={`url(#${idPrefix}-trajectory-core)`} />
    </svg>
  );
}

function ProgressHeadScene({ headStyle }) {
  const svgRef = React.useRef(null);
  const [headScale, setHeadScale] = React.useState(1);
  const gridId = `progress-head-grid-${headStyle}`;
  const markerId = `progress-scene-${headStyle}`;

  React.useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;
    const updateHeadScale = () => {
      const width = svg.getBoundingClientRect().width;
      if (width > 0) setHeadScale(720 / width);
    };
    updateHeadScale();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateHeadScale);
    observer?.observe(svg);
    window.addEventListener('resize', updateHeadScale);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateHeadScale);
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      width="100%"
      viewBox="0 0 720 250"
      role="img"
      aria-label={`${PROGRESS_HEAD_STYLES[headStyle].label}, active line과 결합한 Route 62% 및 Trajectory 현재 sample`}
      style={{ display: 'block' }}
      data-progress-head-scene={headStyle}
    >
      <defs>
        <pattern id={gridId} width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke={LINE} strokeWidth="0.75" opacity="0.55" />
        </pattern>
      </defs>
      <ProgressHeadMarkerDefs idPrefix={markerId} scale={headScale} />
      <rect x="0.5" y="0.5" width="719" height="249" rx="12" fill="var(--color-semantic-background-normal-normal)" stroke={LINE} />
      <rect x="1" y="1" width="718" height="248" rx="12" fill={`url(#${gridId})`} />

      <text x="24" y="32" fill={INK} style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 'var(--fw-bold)' }}>
        Route / Trajectory · active line + progress head
      </text>

      <path
        d="M48 176 L192 176 L316 92 L672 68"
        fill="none"
        stroke={SURFACE}
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M48 176 L192 176 L316 92 L672 68"
        fill="none"
        stroke={ROUTE_TONE}
        strokeWidth="3"
        strokeDasharray="8 6"
        opacity="0.34"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        data-route-path=""
      />
      <path
        d="M48 176 L192 176 L316 92 L508 79"
        fill="none"
        stroke={SURFACE}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        markerEnd={`url(#${markerId}-route-casing)`}
      />
      <path
        d="M48 176 L192 176 L316 92 L508 79"
        fill="none"
        stroke={ROUTE_TONE}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        data-route-progress-path=""
        data-progress-head={headStyle}
        data-head-role="route"
        data-screen-fixed="true"
        data-head-rendering="marker-end"
        markerEnd={`url(#${markerId}-route-core)`}
      />
      <path
        d="M48 202 C188 202 250 190 346 136 S522 91 672 88"
        fill="none"
        stroke={SURFACE}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M48 202 C188 202 250 190 346 136 S522 91 672 88"
        fill="none"
        stroke={ACCENT}
        strokeWidth="2.5"
        opacity="0.28"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        data-trajectory-path=""
      />
      <path
        d="M48 202 C188 202 250 190 346 136"
        fill="none"
        stroke={SURFACE}
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        markerEnd={`url(#${markerId}-trajectory-casing)`}
      />
      <path
        d="M48 202 C188 202 250 190 346 136"
        fill="none"
        stroke={ACCENT}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        data-trajectory-progress-path=""
        data-progress-head={headStyle}
        data-head-role="trajectory"
        data-screen-fixed="true"
        data-head-rendering="marker-end"
        markerEnd={`url(#${markerId}-trajectory-core)`}
      />

      <g transform="translate(24 226)" aria-hidden="true">
        <line x1="0" y1="0" x2="30" y2="0" stroke={ROUTE_TONE} strokeWidth="4" />
        <text x="40" y="4" fill={INK} style={{ fontFamily: 'var(--font-sans)', fontSize: 11 }}>Route · 진행 62%</text>
        <line x1="190" y1="0" x2="220" y2="0" stroke={ACCENT} strokeWidth="3.5" />
        <text x="230" y="4" fill={INK} style={{ fontFamily: 'var(--font-sans)', fontSize: 11 }}>Trajectory · current sample</text>
      </g>
    </svg>
  );
}

function ProgressHeadCandidate({ headStyle }) {
  const style = PROGRESS_HEAD_STYLES[headStyle];
  return (
    <section
      style={{
        display: 'grid',
        gap: 12,
        padding: 14,
        border: `1px solid ${LINE}`,
        borderRadius: 'var(--radius-sm)',
        background: SURFACE,
      }}
    >
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0, flex: '1 1 360px' }}>
          <h3 style={{ margin: 0, color: INK, fontSize: 'var(--body2-size)' }}>{style.label}</h3>
          <p style={{ margin: '4px 0 0', color: MUTED, fontSize: 11, lineHeight: 1.6 }}>{style.note}</p>
        </div>
        <ProgressHeadSpecimen kind={headStyle} />
      </header>
      <ProgressHeadScene headStyle={headStyle} />
    </section>
  );
}

function CurrentPositionComparisonDemo() {
  return (
    <main data-progress-head-standard style={{ width: 'min(980px, 100%)', display: 'grid', gap: 16 }}>
      <Card
        title="현재 진행 방향 · line-integrated standard"
        hint="별도 puck을 경로 위에 얹지 않습니다. 현재 지점까지의 active line이 local tangent를 따라 open V로 끝나는 확정 문법입니다."
      >
        <div style={{ display: 'grid', gap: 14, minWidth: 0 }}>
          <ProgressHeadCandidate headStyle="open" />
        </div>
        <p style={{ margin: 0, color: MUTED, fontSize: 11, lineHeight: 1.6 }}>
          progress head의 방향은 robot bearing이 아니라 경로 접선입니다. pose가 필요하면 별도 robot/avatar layer가 맡고, 이 표식에는 circle·backing·shadow를 사용하지 않습니다.
        </p>
        <nav data-progress-head-references aria-label="경로 진행 화살표 시각 레퍼런스" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px' }}>
          {PROGRESS_HEAD_REFERENCES.map((reference) => (
            <a key={reference.href} href={reference.href} target="_blank" rel="noreferrer" style={{ color: ACCENT, fontSize: 11, fontWeight: 'var(--fw-semibold)' }}>
              {reference.label}
            </a>
          ))}
        </nav>
      </Card>
    </main>
  );
}

function EncodingCatalog() {
  return (
    <main data-encoding-catalog style={{ width: 'min(880px, 100%)', display: 'grid', gap: 16 }}>
      <Card title="선(dash) 어휘" hint="작은 링과 구역·설비 외곽선에서 같은 상태는 같은 dash로 읽힙니다. 값은 NAV_DASH에서 그대로 렌더됩니다.">
        <DashSwatches />
      </Card>
      <Card title="상태 opacity" hint="비활성 0.45, 지연 0.76, 기본 1 — navStateOpacity() 한 함수를 일곱 렌더러가 공유합니다.">
        <OpacitySwatches />
      </Card>
      <Card title="상태 badge · 현재 진행 head · hit target" hint="상태 글리프 뒤 원형 chip(NAV_STATE_BADGE), 경로·궤적의 선에 결합하는 open progress head(NAV_PROGRESS_HEAD), 투명 WCAG 2.2 타깃(NAV_HIT). 진행 head는 pose badge가 아니며 path tangent를 따릅니다.">
        <BadgeAndHit />
      </Card>
      <Card title="라벨 halo 계층" hint="paint-order stroke로 텍스트 뒤에 깔리는 legibility halo. 식별·상세·메타 세 단계를 NAV_LABEL_HALO가 소유합니다.">
        <HaloSwatches />
      </Card>
      <Card title="화면 고정 크기 · scale(1/viewportScale)" hint="지도를 확대·축소해도 마커·배지·글리프는 화면상 같은 크기를 유지하고, 영역처럼 지도(world) 기하로 그려지는 것은 줌과 함께 커집니다. 마커가 scale(1/viewportScale)로 자기 크기를 되돌리기 때문입니다. 두 패널은 같은 실제 WaypointMarker·SpatialRegion을 줌 1×·2×로 렌더한 것입니다 — 영역은 2배 커지고 마커는 그대로입니다.">
        <ZoomCard />
      </Card>
      <Card title="라벨 우선순위 사다리" hint="두 라벨이 한 자리를 다투면 더 중요한 개체의 라벨이 이깁니다. 상태 가중치(annotationPriority)와 동점 tie-break(KIND_WEIGHT)를 소스 함수에서 그대로 렌더합니다. 실제 재배치 동작은 Navigation/Annotation Layer 페이지가 보여줍니다.">
        <PriorityLadder />
      </Card>
      <Card title="상태 계층 · 포커스 vs 선택" hint="포커스(파랑, 실루엣 추적, 바깥)와 선택(accent, 피처 강조, 안쪽)은 독립 축이라 동시에 성립합니다. 실제 컴포넌트를 기본·포커스·선택·포커스+선택으로 렌더합니다 — 손으로 그린 근사가 아닙니다. 기하 값은 NAV_FOCUS·NAV_SELECTION(핀은 NAV_PIN)이 소유합니다.">
        <StateLayerCard />
      </Card>
    </main>
  );
}

const meta = {
  title: 'LDS Robotics/Foundation/Navigation Encoding Tokens',
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-foundation-navigation-encoding-tokens--overview',
      eyebrow: 'Foundation / Navigation Encoding Tokens',
      title: '내비게이션 렌더러가 공유하는 인코딩 토큰을 원자 단위로 문서화합니다',
      description:
        '웨이포인트·설비·해저드·차선·경로·궤적·구역 렌더러가 한 지도에서 하나의 시스템으로 읽히도록, 이들이 공유하는 선·상태·상호작용·라벨 인코딩 토큰을 내부 모듈 _navigationVocabulary가 단일 소스로 소유합니다. 여러 렌더러가 같은 opacity·dash·hit target·badge·label halo 규칙을 공유하는지 검토할 때 사용합니다. 렌더러 고유 기하나 제품 상태를 공용 토큰으로 끌어올리는 용도에는 사용하지 마세요. 이 페이지는 그 값(상태 opacity·dash·hit target·상태 badge·line-integrated progress head·label halo 계층)을 상수에서 그대로 렌더해 회귀 기준으로 삼습니다. 공유되는 map-pin 몸통 기하(NAV_PIN)는 Marker Pin 페이지로, component 고유 encoding은 각 렌더러 로컬로 남습니다. 공개 API가 아닌 내부 모듈입니다.',
    },
    docs: {
      description: {
        component:
          '내비게이션 렌더러들이 공유하는 인코딩 토큰을 내부 모듈 _navigationVocabulary에서 그대로 렌더해 문서화·회귀합니다: 상태 opacity(navStateOpacity), NAV_DASH, NAV_HIT, NAV_STATE_BADGE, NAV_PROGRESS_HEAD, NAV_LABEL_HALO. 공개 API가 아닌 내부 어휘 모듈입니다.',
      },
    },
  },
};

export default meta;

export const Overview = {
  name: '개요',
  parameters: storyDescription(
    '공유 인코딩 토큰을 한 페이지에서 비교합니다. 각 swatch는 _navigationVocabulary 상수에서 직접 렌더됩니다. play-test가 렌더된 DOM이 상수와 일치함을 단언하므로 이 페이지가 곧 토큰의 회귀 기준입니다.',
  ),
  render: () => <EncodingCatalog />,
  play: async ({ canvasElement }) => {
    const root = canvasElement;

    // Dash vocabulary — every shared dash renders its exact NAV_DASH value, and
    // the swatch set matches the module's key set (a dropped key breaks this).
    const dashEls = Array.from(root.querySelectorAll('[data-encoding-dash]'));
    if (dashEls.length !== Object.keys(NAV_DASH).length) {
      throw new Error('The dash catalog must render exactly one swatch per NAV_DASH token.');
    }
    for (const el of dashEls) {
      const key = el.getAttribute('data-encoding-dash');
      if (el.getAttribute('stroke-dasharray') !== NAV_DASH[key]) {
        throw new Error(`Dash swatch "${key}" must render NAV_DASH.${key}.`);
      }
    }

    // Label halo tiers — each text carries its tier stroke width.
    for (const tier of Object.keys(NAV_LABEL_HALO)) {
      const el = root.querySelector(`[data-encoding-halo="${tier}"]`);
      if (el?.getAttribute('stroke-width') !== String(NAV_LABEL_HALO[tier])) {
        throw new Error(`Halo tier "${tier}" must render NAV_LABEL_HALO.${tier}.`);
      }
    }

    // State opacity — the stale swatch renders the shared stale opacity.
    const staleDot = root.querySelector('[data-encoding-opacity="stale"]');
    if (Number(staleDot?.getAttribute('opacity')) !== NAV_STATE_OPACITY.stale) {
      throw new Error('The stale opacity swatch must render NAV_STATE_OPACITY.stale.');
    }

    // State badge + hit target contracts.
    const badge = root.querySelector('[data-encoding-badge]');
    if (badge?.getAttribute('r') !== String(NAV_STATE_BADGE.radius)) {
      throw new Error('The state-badge swatch must render NAV_STATE_BADGE.radius.');
    }
    const progressHead = root.querySelector('[data-encoding-progress-head]');
    const progressMarker = root.querySelector('#encoding-progress-head-core');
    if (
      progressHead?.getAttribute('stroke-width') !== String(NAV_PROGRESS_HEAD.route.coreWidth) ||
      progressMarker?.querySelector('[data-navigation-progress-head-definition="core"]')?.getAttribute('d') !== NAV_PROGRESS_HEAD.path
    ) {
      throw new Error('The progress-head swatch must render NAV_PROGRESS_HEAD geometry.');
    }
    const hit = root.querySelector('[data-encoding-hit]');
    if (
      hit?.getAttribute('r') !== String(NAV_HIT.radius) ||
      hit?.getAttribute('data-screen-target-size') !== String(NAV_HIT.screenTargetSize)
    ) {
      throw new Error('The hit-target swatch must render NAV_HIT radius and screen target size.');
    }

    // Screen-constant marker under zoom, proven with the REAL components: both
    // panels render the same WaypointMarker and SpatialRegion at viewportScale
    // 1 vs 2, so the marker holds its on-screen size (inverse-scale) while the
    // region — world geometry — grows with the zoom.
    const zoomPanels = Array.from(root.querySelectorAll('[data-zoom-panel]'));
    if (zoomPanels.length !== 2) {
      throw new Error('The zoom card must render two real-component panels.');
    }
    const zoomMeasure = zoomPanels.map((panel) => ({
      marker: panel.querySelector('[data-waypoint-point]')?.getBoundingClientRect().width ?? 0,
      region: panel.querySelector('[data-region-geometry]')?.getBoundingClientRect().width ?? 0,
    }));
    const [za, zb] = zoomMeasure;
    if (!(za.marker > 0) || Math.abs(za.marker - zb.marker) > 1.5) {
      throw new Error(`Marker must hold a constant screen size across zoom: ${za.marker} vs ${zb.marker}.`);
    }
    if (!(za.region > 0) || !(zb.region > za.region * 1.6)) {
      throw new Error(`Region (world geometry) must grow with zoom: ${za.region} vs ${zb.region}.`);
    }

    // Priority ladder: state weights and kind weights render straight from the
    // source functions, so the page is the ladder's regression baseline.
    for (const state of ['selected', 'focused', 'alarm', 'emphasized']) {
      const pill = root.querySelector(`[data-priority-state="${state}"]`);
      if (!pill?.textContent?.includes(String(annotationPriority({ [state]: true })))) {
        throw new Error(`Priority pill "${state}" must render annotationPriority({${state}: true}).`);
      }
    }
    const kinds = Array.from(root.querySelectorAll('[data-kind-weight]'));
    if (kinds.length !== KIND_LADDER.length) {
      throw new Error('The kind-weight ladder must render one pill per rung.');
    }
    let previousWeight = -1;
    for (const pill of kinds) {
      const weight = KIND_WEIGHT[pill.getAttribute('data-kind-weight')];
      if (!pill.textContent?.includes(String(weight))) {
        throw new Error('Each kind-weight pill must render its KIND_WEIGHT value.');
      }
      if (weight < previousWeight) {
        throw new Error('The kind-weight ladder must render in ascending paint-order weight.');
      }
      previousWeight = weight;
    }

    // State layering — the real components render focus and selection as
    // independent axes that compose. Verify each renderer's focus/selection
    // indicator appears exactly in the states that should have it.
    const SL_INDICATORS = {
      waypoint: { focus: '[data-waypoint-focus-indicator]', select: '[data-waypoint-selected-indicator]' },
      facility: { focus: '[data-transition-focus-ring]', select: '[data-transition-selection-ring]' },
      region: { focus: '[data-region-focus-ring]', select: '[data-region-selection-ring]' },
      lane: { focus: '[data-lane-focus-ring]', select: '[data-lane-selection-halo]' },
    };
    for (const [renderer, sel] of Object.entries(SL_INDICATORS)) {
      const cellHas = (state, indicator) => {
        const cell = root.querySelector(`[data-state-cell="${renderer}:${state}"]`);
        if (!cell) throw new Error(`State-layer cell ${renderer}:${state} must render.`);
        return Boolean(cell.querySelector(indicator));
      };
      if (cellHas('base', sel.focus) || cellHas('base', sel.select)) {
        throw new Error(`${renderer} base state must show no focus or selection indicator.`);
      }
      if (!cellHas('focused', sel.focus) || cellHas('focused', sel.select)) {
        throw new Error(`${renderer} focused state must show only the focus indicator.`);
      }
      if (!cellHas('selected', sel.select) || cellHas('selected', sel.focus)) {
        throw new Error(`${renderer} selected state must show only the selection indicator.`);
      }
      if (!cellHas('both', sel.focus) || !cellHas('both', sel.select)) {
        throw new Error(`${renderer} focused+selected state must show BOTH indicators (independent axes).`);
      }
      // The SHARED focus rule (color + non-scaling-stroke) verified on the REAL
      // rendered indicator, not a hand-drawn swatch. Geometry differs per shape.
      const focusEl = root
        .querySelector(`[data-state-cell="${renderer}:focused"]`)
        .querySelector(sel.focus);
      if (
        !focusEl?.getAttribute('stroke')?.includes('focus-indicator') ||
        focusEl?.getAttribute('vector-effect') !== 'non-scaling-stroke'
      ) {
        throw new Error(`${renderer} focus indicator must trace in --color-semantic-focus-indicator with non-scaling-stroke.`);
      }
    }
  },
};

export const NarrowViewport = {
  name: '반응형 · 320px 좁은 폭',
  parameters: storyDescription(
    '320px 뷰포트 폭에서 인코딩 토큰 카탈로그를 확인합니다. 카드와 swatch 그리드가 좁은 폭에서 접히되 가로 스크롤을 만들지 않아야 합니다.',
  ),
  render: () => (
    <div data-encoding-narrow style={{ width: 320, maxWidth: '100%' }}>
      <EncodingCatalog />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const fixture = canvasElement.querySelector('[data-encoding-narrow]');
    if (!fixture) throw new Error('The narrow encoding fixture is missing.');
    if (fixture.scrollWidth > fixture.clientWidth + 1) {
      throw new Error('The encoding catalog must not create horizontal overflow at 320px.');
    }
  },
};

export const CurrentPositionComparison = {
  name: '시나리오 · 경로·궤적 현재 진행 헤드',
  parameters: storyDescription(
    'Route와 Trajectory의 current progress를 별도 puck이 아니라 active line과 결합된 open progress head로 표현합니다. 방향은 robot bearing이 아닌 path local tangent를 사용합니다.',
  ),
  render: () => <CurrentPositionComparisonDemo />,
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-progress-head-standard]');
    if (!root) throw new Error('The progress-head standard fixture is missing.');

    const scenes = Array.from(root.querySelectorAll('[data-progress-head-scene]'));
    if (scenes.length !== 1 || scenes[0].dataset.progressHeadScene !== 'open') {
      throw new Error('The standard must render only the selected open progress head.');
    }
    if (root.scrollWidth > root.clientWidth + 1) {
      throw new Error('The current-position comparison must not create horizontal overflow.');
    }

    const routeGeometry = 'M48 176 L192 176 L316 92 L508 79';
    for (const scene of scenes) {
      const routeProgressPath = scene.querySelector('[data-route-progress-path]');
      const heads = Array.from(scene.querySelectorAll('[data-progress-head]'));
      if (routeProgressPath?.getAttribute('d') !== routeGeometry || routeProgressPath.getAttribute('stroke') !== ROUTE_TONE) {
        throw new Error('The progress-head standard must keep the approved active route geometry and tone.');
      }
      if (
        heads.length !== 2
        || heads.some((head) => head.dataset.progressHead !== scene.dataset.progressHeadScene)
        || heads.some((head) => head.dataset.screenFixed !== 'true')
        || heads.some((head) => head.dataset.headRendering !== 'marker-end')
        || heads.some((head) => !head.getAttribute('marker-end')?.startsWith('url(#progress-scene-'))
        || !heads.some((head) => head.dataset.headRole === 'route')
        || !heads.some((head) => head.dataset.headRole === 'trajectory')
      ) {
        throw new Error('The scene must join the shared marker-end progress head to both active lines.');
      }
      const definitions = Array.from(scene.querySelectorAll('[data-navigation-progress-head-definition="core"]'));
      if (definitions.length !== 2 || definitions.some((definition) => definition.getAttribute('d') !== NAV_PROGRESS_HEAD.path)) {
        throw new Error('The specimen must render the production NAV_PROGRESS_HEAD geometry.');
      }
      if (scene.querySelector('[data-current-position-marker]')) throw new Error('Detached current-position markers must not return.');
    }

    const references = Array.from(root.querySelectorAll('[data-progress-head-references] a'));
    if (references.length !== PROGRESS_HEAD_REFERENCES.length || references.some((link) => !link.href.startsWith('https://'))) {
      throw new Error('The comparison must expose every authoritative reference as an HTTPS link.');
    }
  },
};

export const EncodingVisualParity = {
  ...Overview,
  name: 'Navigation encoding visual parity',
  tags: ['!dev', 'visual-parity'],
};
