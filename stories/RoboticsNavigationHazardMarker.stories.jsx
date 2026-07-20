import React from 'react';
import { HazardMarker } from './lds.js';
import { storyDescription } from './StoryGuide.shared.jsx';
import { assertSharedFocusIndicator } from './RoboticsNavigationAssert.shared.jsx';

const STAGE = 'stage';
const at = (x, y) => ({ x, y });

const STAIRS_CAUTION = {
  id: 'hz-stairs-caution',
  kind: 'stairs',
  label: '중앙 계단',
  mapId: STAGE,
  position: at(28, 26),
  severity: 'caution',
};

const STAIRS_DANGER = {
  id: 'hz-stairs-danger',
  kind: 'stairs',
  label: '하역장 계단',
  mapId: STAGE,
  position: at(28, 26),
  severity: 'danger',
};

// The same physical ramp can be a traversable FacilityTransition for one fleet
// and a hazard for another (max-grade / tip-over limits) — products classify.
const RAMP_CAUTION = {
  id: 'hz-ramp-caution',
  kind: 'ramp',
  label: '출하장 경사로',
  mapId: STAGE,
  position: at(28, 26),
  severity: 'caution',
};

const RAMP_DANGER = {
  id: 'hz-ramp-danger',
  kind: 'ramp',
  label: '지하 진입 경사로',
  mapId: STAGE,
  position: at(28, 26),
  severity: 'danger',
};

const DROPOFF_CAUTION = {
  id: 'hz-dropoff-caution',
  kind: 'dropoff',
  label: '적재 플랫폼 단차',
  mapId: STAGE,
  position: at(28, 26),
  severity: 'caution',
};

const DROPOFF_DANGER = {
  id: 'hz-dropoff-danger',
  kind: 'dropoff',
  label: '하역 도크 낙하 지점',
  mapId: STAGE,
  position: at(28, 26),
  severity: 'danger',
};

// obstacle = registered static collision point (pillar, low clearance, standing
// storage). Dynamic obstacles the robot senses live are the product's layers.
const OBSTACLE_CAUTION = {
  id: 'hz-obstacle-caution',
  kind: 'obstacle',
  label: 'B동 기둥 돌출부',
  mapId: STAGE,
  position: at(28, 26),
  severity: 'caution',
};

const OBSTACLE_DANGER = {
  id: 'hz-obstacle-danger',
  kind: 'obstacle',
  label: '저고도 배관 구간',
  mapId: STAGE,
  position: at(28, 26),
  severity: 'danger',
};

const KINDS = [
  { hazard: STAIRS_CAUTION, label: '계단 · 주의' },
  { hazard: STAIRS_DANGER, label: '계단 · 위험' },
  { hazard: RAMP_CAUTION, label: '경사로 · 주의' },
  { hazard: RAMP_DANGER, label: '경사로 · 위험' },
  { hazard: DROPOFF_CAUTION, label: '단차·낙하 · 주의' },
  { hazard: DROPOFF_DANGER, label: '단차·낙하 · 위험' },
  { hazard: OBSTACLE_CAUTION, label: '충돌 위험물 · 주의' },
  { hazard: OBSTACLE_DANGER, label: '충돌 위험물 · 위험' },
];

const meta = {
  title: 'LDS Robotics/Navigation/Hazard Marker',
  component: HazardMarker,
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-navigation-hazard-marker--overview',
      eyebrow: 'Navigation / Hazard Marker',
      title: 'Hazard 마커는 AGV가 피해야 하는 지점 위험물을 severity 색 핀으로 표시합니다',
      description:
        'FacilityTransition과 같은 map-pin 실루엣을 공유해 한 지도의 marker가 하나의 패밀리로 읽히되, "여기는 피한다"는 severity 색(주의=cautionary, 위험=negative)과 위험물 knockout 글리프, 접근성 이름이 전달합니다. 계단·경사로·단차(낙하)·충돌 위험물 같은 지점 위험물을 제품이 분류한 severity 그대로 보여 주며, 회피 경로를 계획하거나 명령을 내리지 않습니다. 충돌 위험물은 정적으로 등록된 지점(기둥·저고도 배관·상시 적치)만 뜻하고, 센서가 실시간으로 잡는 동적 장애물은 제품의 live 레이어 소관입니다. 같은 경사로도 fleet에 따라 통과 설비(FacilityTransition)일 수도, 회피 대상(Hazard)일 수도 있으며 그 분류는 제품 소유입니다. 넓은 keep-out 구역은 SpatialRegion 소관입니다.',
    },
    docs: {
      description: {
        component:
          'AGV가 피해야 하는 지점 위험물(계단 등)을 severity 색 map-pin + knockout 글리프로 렌더하는 LK Robotics Extension입니다. 회피 계획·명령은 제품 몫입니다.',
      },
    },
  },
};

export default meta;

function HazardTile({ hazard, label, props }) {
  return (
    <div
      style={{
        display: 'grid',
        placeItems: 'center',
        gap: 8,
        minHeight: 132,
        padding: 14,
        border: '1px solid var(--color-semantic-line-normal-normal)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-semantic-background-elevated-normal)',
      }}
    >
      <svg width={92} height={100} viewBox="0 0 56 52" aria-hidden="true" style={{ display: 'block' }}>
        <HazardMarker hazard={hazard} showLabel={false} {...props} />
      </svg>
      <span style={{ fontSize: 12, color: 'var(--color-semantic-label-normal)' }}>{label}</span>
    </div>
  );
}

export const Overview = {
  name: '개요',
  parameters: storyDescription(
    '계단·경사로·단차(낙하)·충돌 위험물을 주의·위험 severity로 비교합니다. severity 색이 설비 핀의 accent와 뚜렷이 구분되고, 핀 안 위험물 글리프가 작은 크기에서도 서로 구분되는지 확인하세요.',
  ),
  render: () => (
    <main style={{ width: 'min(560px, 100%)', display: 'grid', gap: 20 }}>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        {KINDS.map((entry) => (
          <HazardTile key={entry.hazard.id} hazard={entry.hazard} label={entry.label} />
        ))}
      </section>
    </main>
  ),
  play: async ({ canvasElement }) => {
    const markers = Array.from(canvasElement.querySelectorAll('[data-lds-hazard-marker]'));
    if (markers.length !== 8) throw new Error('Overview must render every kind × severity as real HazardMarker fragments.');
    const kinds = new Set(markers.map((m) => m.getAttribute('data-hazard-kind')));
    const severities = new Set(markers.map((m) => m.getAttribute('data-hazard-severity')));
    if (!kinds.has('stairs') || !kinds.has('ramp') || !kinds.has('dropoff') || !kinds.has('obstacle')) {
      throw new Error('Overview must render the stairs, ramp, dropoff, and obstacle hazard kinds.');
    }
    if (!severities.has('caution') || !severities.has('danger')) {
      throw new Error('Overview must render caution and danger severities.');
    }
    const kindLabels = { stairs: '계단 위험', ramp: '경사로 위험', dropoff: '단차·낙하 위험', obstacle: '충돌 위험' };
    for (const marker of markers) {
      if (marker.getAttribute('role') !== 'img') throw new Error('A passive hazard marker must expose role="img".');
      const expected = kindLabels[marker.getAttribute('data-hazard-kind')];
      if (!marker.getAttribute('aria-label')?.includes(expected)) {
        throw new Error('The accessible name must state the hazard kind.');
      }
      if (!marker.querySelector('[data-hazard-sign]') || !marker.querySelector('[data-hazard-glyph]')) {
        throw new Error('Each marker must render its severity pin badge and knockout glyph.');
      }
    }
  },
};

export const States = {
  name: '변형·상태 · 선택·포커스·비활성',
  parameters: storyDescription(
    '같은 계단 위험물이 선택·포커스·비활성 상태로 바뀔 때의 표기입니다. 선택/포커스 outline이 핀 형상을 그대로 따라가고, 별도 원형 ring을 덧그리지 않는지 확인하세요.',
  ),
  render: () => {
    const states = [
      { key: 'base', label: '기본', props: { onActivate: () => {} } },
      { key: 'selected', label: '선택됨', props: { selected: true, onActivate: () => {} } },
      { key: 'focused', label: '포커스됨', props: { focused: true, onActivate: () => {} } },
      { key: 'disabled', label: '선택 불가', props: { disabled: true, onActivate: () => {} } },
    ];
    return (
      <main data-hazard-states style={{ width: 'min(600px, 100%)', display: 'grid', gap: 16 }}>
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          {states.map((state) => (
            <div key={state.key} data-hazard-state={state.key}>
              <HazardTile hazard={STAIRS_DANGER} label={state.label} props={state.props} />
            </div>
          ))}
        </section>
      </main>
    );
  },
  play: async ({ canvasElement }) => {
    const base = canvasElement.querySelector('[data-hazard-state="base"] [data-lds-hazard-marker]');
    const selected = canvasElement.querySelector('[data-hazard-state="selected"] [data-lds-hazard-marker]');
    const focused = canvasElement.querySelector('[data-hazard-state="focused"] [data-lds-hazard-marker]');
    const disabled = canvasElement.querySelector('[data-hazard-state="disabled"] [data-lds-hazard-marker]');
    if (!base || !selected || !focused || !disabled) {
      throw new Error('The hazard state matrix must render base, selected, focused, and disabled fixtures.');
    }
    if (base.querySelector('[data-hazard-selection-ring], [data-hazard-focus-ring]')) {
      throw new Error('The base hazard must not render a selection or focus outline.');
    }
    if (!selected.querySelector('[data-hazard-selection-ring]') || selected.querySelector('[data-hazard-focus-ring]')) {
      throw new Error('A selected hazard must trace a pin-following selection outline.');
    }
    if (
      focused.getAttribute('data-focused') !== 'true'
      || !focused.querySelector('[data-hazard-focus-ring]')
      || focused.querySelector('[data-hazard-selection-ring]')
      || !focused.getAttribute('aria-label')?.includes('포커스됨')
    ) {
      throw new Error('The controlled focused hazard must render only its pin-following focus outline and focused name.');
    }
    assertSharedFocusIndicator(focused.querySelector('[data-hazard-focus-ring]'), 'Hazard pin');
    if (disabled.getAttribute('aria-disabled') !== 'true' || disabled.getAttribute('tabindex') !== '-1') {
      throw new Error('A disabled interactive hazard must block activation and expose aria-disabled.');
    }
  },
};

const NARROW_HAZARD = {
  id: 'hz-narrow',
  kind: 'stairs',
  label: '자재 창고 북측 통로 계단 · 상시 폐쇄 구간',
  mapId: STAGE,
  position: at(24, 24),
  severity: 'danger',
};

export const NarrowViewport = {
  name: '반응형 · 320px 좁은 폭',
  parameters: storyDescription(
    '320px 뷰포트 폭에서 긴 위험물 라벨이 붙은 마커를 확인합니다. 마커 fragment 자체는 SVG 좌표계만 소유하므로, 지도 폭이 좁아져도 핀·글리프가 왜곡되거나 컨테이너 밖으로 넘치지 않아야 합니다.',
  ),
  render: () => (
    <main data-hazard-narrow style={{ width: 320, maxWidth: '100%' }}>
      <svg
        viewBox="0 0 320 96"
        style={{ display: 'block', width: '100%', border: '1px solid var(--color-semantic-line-normal-normal)', borderRadius: 'var(--radius-md)', background: 'var(--color-semantic-background-elevated-normal)' }}
        aria-label="320px 좁은 지도 안의 계단 위험물"
        role="img"
      >
        <HazardMarker hazard={{ ...NARROW_HAZARD, position: at(36, 44) }} />
      </svg>
    </main>
  ),
  play: async ({ canvasElement }) => {
    const fixture = canvasElement.querySelector('[data-hazard-narrow]');
    const marker = fixture?.querySelector('[data-lds-hazard-marker]');
    if (!fixture || !marker) throw new Error('The narrow hazard fixture is missing.');
    if (fixture.scrollWidth > fixture.clientWidth + 1) {
      throw new Error('The hazard marker must not create horizontal overflow at 320px.');
    }
    if (!marker.querySelector('[data-hazard-label]')?.textContent?.includes('계단')) {
      throw new Error('The long hazard label must stay attached to the marker.');
    }
  },
};

export const HazardMarkerVisualParity = {
  ...Overview,
  name: 'Hazard marker visual parity',
  tags: ['!dev', 'visual-parity'],
};
