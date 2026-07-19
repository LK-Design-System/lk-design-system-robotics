import React from 'react';
import { FacilityTransition } from './lds.js';
import { storyDescription } from './StoryGuide.shared.jsx';

// Everything here renders the real FacilityTransition marker (no hand-drawn
// badge geometry) so the catalog is byte-for-byte what ships. A single endpoint
// on one stage map centers the pin; the label is suppressed so the glyph reads
// on its own.
const STAGE = 'stage';
const at = (x, y) => ({ mapId: STAGE, position: { x, y } });

const DOOR = {
  id: 'glyph-door',
  kind: 'door',
  label: '자동문',
  facilityId: 'door',
  from: at(28, 30),
  availability: 'available',
  event: 'open',
  doorState: 'moving',
};

const LIFT = {
  id: 'glyph-lift',
  kind: 'lift',
  label: '승강기',
  facilityId: 'lift',
  from: at(28, 30),
  availability: 'available',
  phase: 'approach',
  doorState: 'closed',
  motionState: 'stopped',
  operatingMode: 'agv',
  sessionState: 'requested',
  currentMapId: STAGE,
  destinationMapId: STAGE,
};

const DOCK = {
  id: 'glyph-dock',
  kind: 'dock',
  label: '도킹',
  facilityId: 'dock',
  from: at(28, 30),
  availability: 'available',
  phase: 'docking',
};

// ramp/charging are passive facilities — only availability, no phase/state axes.
const RAMP = {
  id: 'glyph-ramp',
  kind: 'ramp',
  label: '경사로',
  facilityId: 'ramp',
  from: at(28, 30),
  to: { mapId: STAGE, position: { x: 28, y: 30 } },
  availability: 'available',
};

const CHARGING = {
  id: 'glyph-charging',
  kind: 'charging',
  label: '충전소',
  facilityId: 'charging',
  from: at(28, 30),
  availability: 'available',
};

const GATE = {
  id: 'glyph-gate',
  kind: 'gate',
  label: '보안 게이트',
  facilityId: 'gate',
  from: at(28, 30),
  to: { mapId: STAGE, position: { x: 28, y: 30 } },
  availability: 'available',
};

const HANDOFF = {
  id: 'glyph-handoff',
  kind: 'handoff',
  label: '핸드오프',
  facilityId: 'handoff',
  from: at(28, 30),
  availability: 'available',
};

const KINDS = [
  { transition: DOOR, label: '문 · door' },
  { transition: LIFT, label: '승강기 · lift' },
  { transition: DOCK, label: '도킹 · dock' },
  { transition: RAMP, label: '경사로 · ramp' },
  { transition: CHARGING, label: '충전 · charging' },
  { transition: GATE, label: '보안 게이트 · gate' },
  { transition: HANDOFF, label: '핸드오프 · handoff' },
];

// State treatments come straight from the component's own props: the unavailable
// slash, the corner state badges, and the stale badge's dashed ring are the real
// thing. The pin body is fill-only — it has no dashed outline.
const LIFT_STATES = [
  { key: 'available', label: '사용 가능', transition: LIFT },
  { key: 'unavailable', label: '사용 불가', transition: { ...LIFT, availability: 'unavailable' } },
  { key: 'unknown', label: '가용성 미확인', transition: { ...LIFT, availability: 'unknown' } },
  { key: 'invalid', label: '데이터 오류', transition: LIFT, props: { invalid: true } },
  { key: 'stale', label: '데이터 지연', transition: LIFT, props: { stale: true } },
];

const meta = {
  title: 'LDS Robotics/Foundation/Facility Glyph',
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-foundation-facility-glyph--overview',
      eyebrow: 'Foundation / Facility Glyph',
      title: '설비 글리프는 Facility Transition 마커 위에서 문·승강기·도킹·경사로·충전·보안 게이트·핸드오프를 구분합니다',
      description:
        '문·승강기·도킹·경사로·충전·보안 게이트·핸드오프 일곱 종류를 실제 FacilityTransition 마커로 나란히 비교합니다. 배지 도형을 따로 그리지 않고 프로덕션 컴포넌트를 그대로 렌더하므로, 여기 보이는 핀·글리프·상태 표기는 마커에 실제로 나타나는 것과 동일합니다. 종류를 결정하는 knockout 글리프는 경사로·핸드오프를 뺀 다섯이 Material Symbols(Apache 2.0)이고, 경사로·핸드오프는 Material Symbols에 층간 경사로·filled transfer 글리프가 없어 LDS가 그린 것이며, 내부 모듈 _FacilityGlyph가 렌더하고 공개 API가 아닙니다. 글리프 도형 자체를 검토·회귀할 때 적합하며, 제품 지도 구현에는 이 페이지 대신 FacilityTransition을 사용하세요.',
    },
    docs: {
      description: {
        component:
          '실제 FacilityTransition 마커로 문·승강기·도킹·경사로·충전·보안 게이트·핸드오프 글리프와 그 상태 표기를 문서화·회귀합니다. 글리프 자체는 내부 모듈 _FacilityGlyph 소관이며 공개 API가 아닙니다.',
      },
    },
  },
};

export default meta;

function MarkerTile({ transition, label, props, minHeight = 132 }) {
  return (
    <div
      style={{
        display: 'grid',
        placeItems: 'center',
        gap: 8,
        minHeight,
        padding: 14,
        border: '1px solid var(--color-semantic-line-normal-normal)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-semantic-background-elevated-normal)',
      }}
    >
      <svg width={92} height={105} viewBox="0 -14 56 64" aria-hidden="true" style={{ display: 'block' }}>
        <FacilityTransition transition={transition} activeMapId={STAGE} showLabel={false} {...props} />
      </svg>
      <code style={{ fontSize: 12, color: 'var(--color-semantic-label-normal)' }}>{label}</code>
    </div>
  );
}

export const Overview = {
  name: '개요',
  parameters: storyDescription(
    '문·승강기·도킹·경사로·충전·보안 게이트·핸드오프를 실제 마커로 비교합니다. 배지 위 knockout 글리프가 작은 크기에서 서로 뚜렷이 구분되는지 확인하세요.',
  ),
  render: () => (
    <main style={{ width: 'min(720px, 100%)', display: 'grid', gap: 20 }}>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        {KINDS.map((entry) => (
          <MarkerTile key={entry.transition.kind} transition={entry.transition} label={entry.label} />
        ))}
      </section>
    </main>
  ),
};

export const States = {
  name: '변형·상태 · 상태 표기',
  parameters: storyDescription(
    '같은 승강기 마커가 가용성·오류·지연 상태로 바뀔 때의 실제 표기입니다. 사용 불가 슬래시와 unknown·invalid·stale 코너 배지(지연은 점선 링)는 모두 컴포넌트가 직접 렌더한 것입니다. 핀 몸통은 채움 전용이라 점선 외곽선은 없습니다(문·도킹도 동일하게 동작).',
  ),
  render: () => (
    <main style={{ width: 'min(760px, 100%)', display: 'grid', gap: 16 }}>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
        {LIFT_STATES.map((state) => (
          <div key={state.key} style={{ display: 'grid', gap: 6, justifyItems: 'center' }}>
            <MarkerTile transition={state.transition} label={state.label} props={state.props} minHeight={128} />
          </div>
        ))}
      </section>
    </main>
  ),
};
