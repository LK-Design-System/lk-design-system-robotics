import React from 'react';
import { NavigationStateGlyph } from '@lk-robotics/lds-robotics-ui/components/robotics/_NavigationStateGlyph';
import { NAV_STATE_BADGE } from '@lk-robotics/lds-robotics-ui/components/robotics/_navigationVocabulary';
import { storyDescription } from './StoryGuide.shared.jsx';

// These render the real NavigationStateGlyph — no hand-drawn geometry. In
// production each glyph sits inside a marker's badge circle (see Facility Glyph
// › 상태 표기 for the composed, in-context badge); here we show the raw glyph
// asset so the 11-shape set can be reviewed and regression-tested on its own.
const GLYPH = 'var(--color-semantic-label-strong)';

// All 11 NavigationStateGlyph kinds, labelled from their canonical consumers:
// FacilityTransition, RouteOverlay, TrajectoryOverlay, LaneOverlay,
// WaypointMarker, and SpatialRegion. A few kinds intentionally SHARE a glyph
// shape — the distinction is semantic, carried by marker context and badge tone,
// not by the drawing.
const STATES = [
  { kind: 'unknown', label: '상태 미확인' },
  { kind: 'invalid', label: '데이터 오류' },
  { kind: 'conflict', label: '충돌' },
  { kind: 'closed', label: '폐쇄', note: 'blocked와 같은 "×" 도형' },
  { kind: 'blocked', label: '차단됨', note: 'closed와 같은 "×" 도형' },
  { kind: 'waiting', label: '대기 중' },
  { kind: 'rerouting', label: '경로 재계산 중' },
  { kind: 'active', label: '이동 중' },
  { kind: 'planned', label: '계획됨' },
  { kind: 'completed', label: '완료됨' },
  { kind: 'stale', label: '오래된 데이터' },
];

const meta = {
  title: 'LDS Robotics/Foundation/State Badge',
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-foundation-state-badge--overview',
      eyebrow: 'Foundation / State Badge',
      title: '상태 글리프는 마커 배지 안에서 진행·오류·가용성을 하나의 도형으로 압축합니다',
      description:
        '설비·경로·궤적·차선·웨이포인트·구역 마커의 모서리 배지에 들어가는 작은 상태 지시자입니다. 내부 모듈 NavigationStateGlyph가 Material Symbols(Apache 2.0)에서 가져온 11종의 상태 글리프를 렌더하며 FacilityTransition·RouteOverlay·TrajectoryOverlay·LaneOverlay·WaypointMarker·SpatialRegion이 공유합니다. 공유 상태 글리프의 선택과 복합 상태 스택 규칙을 검토할 때 사용합니다. 독립적인 상태 라벨이나 완성된 마커를 이 배지로 대신하는 용도에는 사용하지 마세요. 이 페이지는 그 글리프 자산을 그대로(배지 원은 마커가 그리므로 여기선 생략) 나열해 도형 세트를 검토·회귀하고, 한 개체에 여러 상태가 겹칠 때 배지가 오프셋 스택되는 복합 상태 규칙과 렌더러별 스택 축도 함께 보여줍니다. 배지 컨텍스트의 실제 합성은 Facility Glyph의 상태 표기 스토리를, 배지 원 기하(NAV_STATE_BADGE, r=7)는 Navigation Encoding Tokens 페이지를 참고하세요. 공개 API가 아닌 내부 모듈입니다.',
    },
    docs: {
      description: {
        component:
          'NavigationStateGlyph의 상태 글리프 11종을 실제 컴포넌트로 나열합니다. 설비 전이·경로·궤적·차선·웨이포인트·공간 구역 렌더러가 공유하는 내부 자산이며 공개 API가 아닙니다. 배지 원·톤은 마커가 합성하므로 여기서는 글리프 도형만 보여줍니다.',
      },
    },
  },
};

export default meta;

function GlyphTile({ kind, label, note }) {
  return (
    <div
      style={{
        display: 'grid',
        placeItems: 'center',
        gap: 9,
        minHeight: 128,
        padding: 14,
        border: '1px solid var(--color-semantic-line-normal-normal)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-semantic-background-elevated-normal)',
      }}
    >
      <svg width={40} height={40} viewBox="-12 -12 24 24" aria-hidden="true" style={{ display: 'block' }}>
        <NavigationStateGlyph kind={kind} size={20} color={GLYPH} />
      </svg>
      <code style={{ fontSize: 11, color: 'var(--color-semantic-label-neutral)' }}>{kind}</code>
      <span style={{ fontSize: 11, color: 'var(--color-semantic-label-normal)', textAlign: 'center' }}>{label}</span>
      {note ? (
        <span style={{ fontSize: 10, color: 'var(--color-semantic-label-alternative)', textAlign: 'center' }}>{note}</span>
      ) : null}
    </div>
  );
}

const SURFACE = 'var(--color-semantic-background-elevated-normal)';
const WARNING = 'var(--color-semantic-status-cautionary-foreground)';
const DANGER = 'var(--color-semantic-status-negative-foreground)';
const FOREGROUND = 'var(--color-semantic-label-strong)';

// One state badge = the NAV_STATE_BADGE circle + a NavigationStateGlyph. When a
// single object carries MORE THAN ONE state at once (e.g. availability unknown
// AND invalid data), the badges do not overlap — they offset-stack so both stay
// readable. The stacking AXIS differs per renderer because each marker's shape
// and orientation differ, so this is a documented rule with per-renderer axes,
// not one shared offset constant.
function StateBadgeMark({ kind, tone, transform }) {
  return (
    <g transform={transform} data-compound-badge={kind}>
      <circle r={NAV_STATE_BADGE.radius} fill={SURFACE} stroke={tone} strokeWidth={NAV_STATE_BADGE.strokeWidth} vectorEffect="non-scaling-stroke" />
      <NavigationStateGlyph kind={kind} size={10} color={FOREGROUND} />
    </g>
  );
}

// Per-renderer stacking axes, read straight from each renderer's compound-badge
// transform (WaypointMarker translate(-8 ±8); LaneOverlay tangent 18 / normal
// 32; FacilityTransition x 16; SpatialRegion vertical ±18).
const COMPOUND_AXES = [
  { renderer: '웨이포인트', axis: 'x −8 고정 · y ±8 (좌측 세로 스택)' },
  { renderer: '레인', axis: '접선 18 간격 · 법선 32 오프셋' },
  { renderer: '시설 전이', axis: '수평 16 간격' },
  { renderer: '영역', axis: '수직 ±18' },
];

export const Overview = {
  name: '개요',
  parameters: storyDescription(
    '상태 글리프 11종을 실제 컴포넌트로 비교합니다. ~13px 배지 크기에서 각 도형이 서로 구분되는지, invalid/conflict("!")와 closed/blocked("×")처럼 도형을 공유하는 상태쌍이 있는지 확인하세요. 아래 복합 상태 프레임은 한 개체에 여러 상태가 겹칠 때 배지가 어떻게 오프셋 스택되는지 보여줍니다. 배지 원·톤을 포함한 실제 표기는 Facility Glyph › 상태 표기에서 확인할 수 있습니다.',
  ),
  render: () => (
    <main data-state-badge-catalog style={{ width: 'min(880px, 100%)', display: 'grid', gap: 16 }}>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
        {STATES.map((state) => (
          <GlyphTile key={state.kind} {...state} />
        ))}
      </section>
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto minmax(0, 1fr)',
          gap: 'var(--space-4)',
          alignItems: 'center',
          padding: 16,
          border: '1px solid var(--color-semantic-line-normal-normal)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-semantic-background-elevated-normal)',
        }}
      >
        <svg data-compound-stack width={96} height={96} viewBox="-24 -24 48 48" role="img" aria-label="복합 상태: 미확인과 데이터 오류가 겹친 배지 오프셋 스택">
          {/* the marker body the badges ride on, drawn faint for context */}
          <rect x="-9" y="-9" width="18" height="18" rx="3" transform="rotate(45)" fill="var(--color-semantic-fill-normal)" stroke="var(--color-semantic-line-normal-normal)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <StateBadgeMark kind="unknown" tone={WARNING} transform="translate(-8 -8)" />
          <StateBadgeMark kind="invalid" tone={DANGER} transform="translate(-8 8)" />
        </svg>
        <div style={{ display: 'grid', gap: 10, minWidth: 0 }}>
          <div style={{ display: 'grid', gap: 4 }}>
            <h2 style={{ margin: 0, fontSize: 'var(--label1-size)', color: 'var(--color-semantic-label-strong)' }}>복합 상태 오프셋 스택</h2>
            <p style={{ margin: 0, fontSize: 'var(--caption1-size)', color: 'var(--color-semantic-label-neutral)', lineHeight: 1.6 }}>
              한 개체에 상태가 둘 이상 동시에 적용되면(예: 미확인 + 데이터 오류) 배지가 겹치지 않고 오프셋 스택합니다. 스택 축은 마커 모양·방향에 따라 렌더러마다 다릅니다 — 하나의 공유 상수가 아니라 정의된 규칙입니다.
            </p>
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 4 }}>
            {COMPOUND_AXES.map((row) => (
              <li key={row.renderer} style={{ display: 'grid', gridTemplateColumns: 'minmax(64px, auto) 1fr', gap: 'var(--space-3)', fontSize: 'var(--caption1-size)' }}>
                <span style={{ color: 'var(--color-semantic-label-normal)', fontWeight: 'var(--fw-semibold)' }}>{row.renderer}</span>
                <code style={{ color: 'var(--color-semantic-label-neutral)' }}>{row.axis}</code>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  ),
  play: async ({ canvasElement }) => {
    const stack = canvasElement.querySelector('[data-compound-stack]');
    if (!stack) throw new Error('The compound-state stack example must render.');
    const badges = Array.from(stack.querySelectorAll('[data-compound-badge]'));
    if (badges.length !== 2) {
      throw new Error('The compound example must stack exactly two state badges.');
    }
    // The two badges must be vertically offset (not overlapping) — the waypoint
    // axis stacks them along y at a fixed x.
    const [y1, y2] = badges.map((b) => b.getBoundingClientRect().top);
    if (Math.abs(y1 - y2) < 4) {
      throw new Error('Compound-state badges must offset-stack, not overlap.');
    }
    // Each badge renders the shared NAV_STATE_BADGE circle geometry.
    for (const badge of badges) {
      const circle = badge.querySelector('circle');
      if (circle?.getAttribute('r') !== String(NAV_STATE_BADGE.radius)) {
        throw new Error('Each stacked badge must render the NAV_STATE_BADGE circle.');
      }
    }
  },
};
