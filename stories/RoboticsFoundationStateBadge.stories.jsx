import React from 'react';
import { NavigationStateGlyph } from '@lk-robotics/lds-robotics-ui/components/robotics/_NavigationStateGlyph';
import { FacilityTransition, WaypointMarker } from '../src/index.js';
import { NAV_WAYPOINT_STATUS_BADGE } from '../src/components/robotics/_navigationVocabulary.js';
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
  tags: ['autodocs'],
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-foundation-state-badge--overview',
      eyebrow: 'Foundation / State Badge',
      title: '상태 글리프는 내비게이션 상태 어휘의 표준 도형이며, 점 요소는 배지로·선 요소는 대시로 표현합니다',
      description:
        '점 요소의 상태 배지와 선 요소의 대시 패턴이 같은 내비게이션 상태 어휘를 사용하는지 검토할 때 사용합니다. 독립 상태 라벨이나 완성된 마커를 이 글리프로 대신하지 마세요.',
      docsDescription:
          '내부 모듈 NavigationStateGlyph가 Material Symbols(Apache 2.0)에서 가져온 11종의 상태 도형을 렌더합니다. 마커 계열은 가용성을 본체에 두고 렌더러 우선순위에 따른 solid badge 한 개만 겹칩니다. Waypoint는 invalid > stale, FacilityTransition은 invalid > stale > unknown 순서입니다. 모든 원시 상태는 접근성 이름에 유지합니다. 선은 stroke/dash, 영역은 category pattern과 상태색 면·외곽선 채널을 사용하며 영역에는 badge를 올리지 않습니다. 독립 상태 라벨이나 완성된 마커를 이 글리프로 대신하지 마세요.',
    },
    docs: {
      description: {
        component:
          'NavigationStateGlyph의 상태 도형 11종을 실제 컴포넌트로 나열합니다. Waypoint와 FacilityTransition 같은 마커는 가용성 본체 위에 단일 solid badge를 합성하고, 선·영역은 자체 geometry 채널을 사용합니다. 이 페이지는 도형 어휘와 마커 단일 배지 규칙의 기준입니다.',
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

const COMPOUND_WAYPOINT = {
  id: 'state-badge-compound-waypoint',
  label: '복합 상태 웨이포인트',
  mapId: 'L1',
  position: { x: 0, y: 0 },
  roles: ['charger'],
  availability: 'unknown',
};

const COMPOUND_FACILITY = {
  id: 'state-badge-compound-facility',
  kind: 'charging',
  label: '복합 상태 충전 지점',
  facilityId: 'charger-1',
  from: {
    mapId: 'L1',
    position: { x: 0, y: 0 },
    label: '충전 지점',
  },
  availability: 'unknown',
};

// Marker renderers share one prioritized solid badge. Lines and regions spend
// their own stroke/fill channel on state because their geometry is not a small
// attached marker.
const COMPOUND_CHANNELS = [
  { renderer: '마커', channel: '가용성은 본체 · renderer priority solid badge 1슬롯' },
  { renderer: '선', channel: '가용성·충돌은 stroke/dash · 데이터 품질은 path anchor 표식' },
  { renderer: '영역', channel: '종류는 pattern · 상태는 면·외곽선 색 · badge 없음' },
];

export const Overview = {
  name: '개요',
  parameters: storyDescription(
    '상태 글리프 11종과 실제 마커의 단일 solid badge 합성을 비교합니다. 마커는 여러 원시 상태를 접근성 이름에 유지하면서 invalid > stale > unknown 중 하나만 표시하고, 선·영역은 자체 geometry 채널을 사용합니다.',
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
          gridTemplateColumns: 'minmax(180px, auto) minmax(0, 1fr)',
          gap: 'var(--space-4)',
          alignItems: 'center',
          padding: 16,
          border: '1px solid var(--color-semantic-line-normal-normal)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-semantic-background-elevated-normal)',
        }}
      >
        <div
          aria-label="복합 상태 채널 비교"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(80px, 1fr))',
            gap: 'var(--space-3)',
          }}
        >
          <figure style={{ margin: 0, display: 'grid', justifyItems: 'center', gap: 6 }}>
            <svg width={88} height={72} viewBox="-24 -24 48 48" role="img" aria-label="미확인 가용성과 데이터 오류를 채움·단일 solid badge로 표현한 웨이포인트">
              <WaypointMarker
                waypoint={COMPOUND_WAYPOINT}
                invalid
                stale
                showLabel={false}
              />
            </svg>
            <figcaption style={{ fontSize: 'var(--caption2-size)', color: 'var(--color-semantic-label-neutral)' }}>
              웨이포인트 · 채움 + 배지
            </figcaption>
          </figure>
          <figure style={{ margin: 0, display: 'grid', justifyItems: 'center', gap: 6 }}>
            <svg width={88} height={72} viewBox="-24 -24 48 48" role="img" aria-label="여러 상태를 단일 solid 배지로 정리한 시설 전이">
              <FacilityTransition
                transition={COMPOUND_FACILITY}
                activeMapId="L1"
                invalid
                stale
                showLabel={false}
              />
            </svg>
            <figcaption style={{ fontSize: 'var(--caption2-size)', color: 'var(--color-semantic-label-neutral)' }}>
              시설 전이 · 단일 배지
            </figcaption>
          </figure>
        </div>
        <div style={{ display: 'grid', gap: 10, minWidth: 0 }}>
          <div style={{ display: 'grid', gap: 4 }}>
            <h2 style={{ margin: 0, fontSize: 'var(--label1-size)', color: 'var(--color-semantic-label-strong)' }}>상태 표현 채널</h2>
            <p style={{ margin: 0, fontSize: 'var(--caption1-size)', color: 'var(--color-semantic-label-neutral)', lineHeight: 1.6 }}>
              Waypoint와 FacilityTransition 같은 마커는 가용성을 본체로 표시하고 렌더러 우선순위에 따라 우측 상단 solid badge 하나만 사용합니다. 선은 자체 stroke와 anchor 표식을 사용하고, 영역은 category pattern 위에 상태색 면·외곽선만 사용합니다. 모든 원시 상태는 접근성 이름에 남습니다.
            </p>
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 4 }}>
            {COMPOUND_CHANNELS.map((row) => (
              <li key={row.renderer} style={{ display: 'grid', gridTemplateColumns: 'minmax(64px, auto) 1fr', gap: 'var(--space-3)', fontSize: 'var(--caption1-size)' }}>
                <span style={{ color: 'var(--color-semantic-label-normal)', fontWeight: 'var(--fw-semibold)' }}>{row.renderer}</span>
                <code style={{ color: 'var(--color-semantic-label-neutral)' }}>{row.channel}</code>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  ),
  play: async ({ canvasElement }) => {
    const waypoint = canvasElement.querySelector('[data-waypoint-id="state-badge-compound-waypoint"]');
    const waypointPoint = waypoint?.querySelector('[data-waypoint-point][data-waypoint-status-kind="unknown"]');
    const waypointBadge = waypoint?.querySelector('[data-waypoint-status-badge="invalid"]');
    if (!waypoint || !waypointPoint || !waypointBadge) {
      throw new Error('The compound waypoint must keep unknown on its fill and resolve invalid + stale to one invalid solid badge.');
    }
    if (
      waypoint.querySelectorAll('[data-waypoint-status-badge]').length !== 1
      || !waypointBadge.querySelector('[data-navigation-state-glyph="invalid"]')
    ) {
      throw new Error('The compact waypoint must render one prioritized invalid solid badge without stacking stale.');
    }
    const waypointBadgeCircle = waypointBadge.querySelector('[data-waypoint-status-badge-circle]');
    if (
      waypointBadgeCircle?.getAttribute('r') !== String(NAV_WAYPOINT_STATUS_BADGE.radius)
      || waypointBadge.getAttribute('data-waypoint-status-badge-style') !== 'solid'
      || waypointBadgeCircle.hasAttribute('stroke-dasharray')
    ) {
      throw new Error('The compact waypoint must use the shared solid waypoint badge geometry.');
    }
    const waypointName = waypoint.getAttribute('aria-label') ?? '';
    for (const stateName of ['가용성 상태 미확인', '데이터 오류', '오래된 데이터']) {
      if (!waypointName.includes(stateName)) {
        throw new Error(`The compound waypoint accessible name is missing ${stateName}.`);
      }
    }

    const facility = canvasElement.querySelector('[data-transition-id="state-badge-compound-facility"]');
    const facilityBadge = facility?.querySelector('[data-transition-state-slot="invalid"]');
    if (
      !facility
      || !facilityBadge
      || facility.querySelectorAll('[data-transition-state-slot]').length !== 1
      || facilityBadge.getAttribute('data-transition-status-badge-style') !== 'solid'
      || facility.querySelector('[data-transition-unknown-mark], [data-transition-stale-mark]')
    ) {
      throw new Error('Facility marker must resolve invalid > stale > unknown into one solid badge.');
    }
    const facilityName = facility.getAttribute('aria-label') ?? '';
    for (const stateName of ['가용성 미확인', '잘못된 설비 전이', '데이터 지연']) {
      if (!facilityName.includes(stateName)) {
        throw new Error(`The compound facility accessible name is missing ${stateName}.`);
      }
    }
  },
};
