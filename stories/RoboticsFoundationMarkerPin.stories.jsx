import React from 'react';
import { FacilityTransition, HazardMarker, WaypointMarker } from '../src/index.js';
import { NAV_PIN } from '@lk-robotics/lds-robotics-ui/components/robotics/_navigationVocabulary';
import { storyDescription } from './StoryGuide.shared.jsx';

// The shared map-pin BODY, shown where it actually appears: the real
// FacilityTransition and HazardMarker are both knocked out of the SAME NAV_PIN
// silhouette (severity/accent fill + a knockout glyph distinguish them, not the
// shape), and the contrasting rounded-square graph node sits alongside to show
// what is deliberately NOT a pin. Rendered from production components — the
// catalog IS the atom in context — and the play asserts the hazard marker
// consumes NAV_PIN.path. Focus traces the silhouette at scale 1.34; selection
// enlarges the complete pin body to NAV_SELECTION.pinScale without recoloring it.
const STAGE = 'stage';

const INK = 'var(--color-semantic-label-strong)';
const MUTED = 'var(--color-semantic-label-neutral)';
const LINE = 'var(--color-semantic-line-normal-normal)';
const SURFACE = 'var(--color-semantic-background-elevated-normal)';

// Facility + Hazard render the shared NAV_PIN body; the waypoint origin is the
// contrasting rounded-square graph node, not a pin.
const ORIGIN_WAYPOINT = {
  id: 'pin-wp',
  label: '원점',
  mapId: STAGE,
  position: { x: 28, y: 26 },
  roles: ['holding'],
  availability: 'available',
};
const ACCENT_FACILITY = {
  id: 'pin-fac',
  kind: 'door',
  label: '자동문',
  facilityId: 'door',
  from: { mapId: STAGE, position: { x: 28, y: 30 } },
  availability: 'available',
  event: 'open',
  doorState: 'moving',
};
const HAZARD_PIN = {
  id: 'pin-hz',
  kind: 'stairs',
  label: '계단',
  mapId: STAGE,
  position: { x: 28, y: 26 },
  severity: 'danger',
};

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

function PinFamily() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
      <Tile label="설비 핀 (accent · NAV_PIN)" mono="NAV_PIN">
        <svg width={88} height={100} viewBox="0 -14 56 64" aria-hidden="true" style={{ display: 'block' }}>
          <FacilityTransition transition={ACCENT_FACILITY} activeMapId={STAGE} showLabel={false} />
        </svg>
      </Tile>
      <Tile label="해저드 핀 (severity · NAV_PIN)" mono="NAV_PIN">
        <svg width={88} height={92} viewBox="0 0 56 52" aria-hidden="true" style={{ display: 'block' }}>
          <HazardMarker hazard={HAZARD_PIN} showLabel={false} />
        </svg>
      </Tile>
      <Tile label="웨이포인트 원점 (라운드 스퀘어 그래프 노드 · 핀 아님)" mono="rounded square">
        <svg width={88} height={92} viewBox="0 0 56 52" aria-hidden="true" style={{ display: 'block' }}>
          <WaypointMarker waypoint={ORIGIN_WAYPOINT} showLabel={false} />
        </svg>
      </Tile>
    </div>
  );
}

function MarkerPinCatalog() {
  return (
    <main data-marker-pin-catalog style={{ width: 'min(880px, 100%)', display: 'grid', gap: 16 }}>
      <Card
        title="핀 패밀리"
        hint="설비·해저드 마커는 같은 map-pin 실루엣(NAV_PIN)을 공유하고, 형태가 아니라 accent·severity 색과 knockout 글리프로만 구분됩니다. focus는 같은 실루엣을 따라가고 selection은 상태색을 유지한 핀 본체를 확대합니다. 웨이포인트 원점은 대비를 위해 나란히 둔 라운드 스퀘어 그래프 노드로, 핀이 아닙니다. 배지 글리프 세트는 State Badge, 핀 위 knockout 글리프는 Facility·Hazard Glyph 페이지를 참고하세요."
      >
        <PinFamily />
      </Card>
    </main>
  );
}

const meta = {
  title: 'LDS Robotics/Foundation/Marker Pin',
  tags: ['autodocs'],
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-foundation-marker-pin--overview',
      eyebrow: 'Foundation / Marker Pin',
      title: '설비·해저드 마커가 공유하는 map-pin 몸통을 원자 단위로 문서화합니다',
      description:
        'FacilityTransition과 HazardMarker가 공유하는 map-pin 몸통과 Waypoint의 그래프 노드를 구분할 때 사용합니다. 웨이포인트·로봇 위치·임의 지점을 map-pin으로 통일하지 마세요.',
      docsDescription:
        '설비 전이·해저드 마커가 한 지도에서 하나의 마커 패밀리로 읽히도록, 두 마커는 같은 map-pin 실루엣(NAV_PIN)을 몸통으로 공유하고 severity·accent 색과 knockout 글리프로만 구분됩니다. 설비·해저드가 공유하는 핀 몸통과 웨이포인트의 라운드 스퀘어 그래프 노드를 구분할 때 사용합니다. 웨이포인트·로봇 위치·임의 지점을 map-pin으로 통일하는 용도에는 사용하지 마세요. 이 페이지는 그 몸통을 실제 FacilityTransition·HazardMarker로 그대로 렌더하고, 대비되는 라운드 스퀘어 웨이포인트 원점을 나란히 놓아 무엇이 핀이고 무엇이 아닌지 보입니다. NAV_PIN의 path·그림자·focus 링과 selection 확대 기하는 내부 모듈 _navigationVocabulary가 단일 소스로 소유하며, play-test는 실제 해저드 마커가 NAV_PIN.path 실루엣을 소비함을 단언합니다. 공개 API가 아닌 내부 모듈입니다.',
    },
    docs: {
      description: {
        component:
          '설비·해저드 마커가 공유하는 map-pin 몸통(NAV_PIN)을 실제 마커로 렌더해 문서화·회귀합니다. 두 마커는 같은 실루엣을 쓰고 색·knockout 글리프로만 구분되며, 웨이포인트 원점은 대비되는 라운드 스퀘어 그래프 노드입니다. NAV_PIN 기하는 내부 모듈 _navigationVocabulary가 소유하고, 핀 위에 얹히는 상태·설비·해저드 글리프 세트는 각 글리프 카탈로그 페이지가 별도로 다룹니다. 공개 API가 아닌 내부 모듈입니다.',
      },
    },
  },
};

export default meta;

export const Overview = {
  name: '개요',
  parameters: storyDescription(
    '공유 map-pin 몸통을 실제 마커 위에서 봅니다. 설비·해저드 핀은 같은 NAV_PIN 실루엣을 쓰고, 웨이포인트 원점은 대비되는 라운드 스퀘어 그래프 노드입니다. play-test가 실제 해저드 마커의 실루엣 d가 NAV_PIN.path와 일치함을 단언하므로 이 페이지가 곧 몸통 기하의 회귀 기준입니다.',
  ),
  render: () => <MarkerPinCatalog />,
  play: async ({ canvasElement }) => {
    const root = canvasElement;
    const hazardSign = root.querySelector('[data-hazard-sign]');
    if (hazardSign?.getAttribute('d') !== NAV_PIN.path) {
      throw new Error('The hazard pin must consume the shared NAV_PIN.path silhouette.');
    }
    if (!root.querySelector('[data-transition-kind]') || !root.querySelector('[data-waypoint-point]')) {
      throw new Error('The pin family must render the facility pin and the waypoint origin.');
    }
  },
};

export const NarrowViewport = {
  name: '반응형 · 320px 좁은 폭',
  parameters: storyDescription(
    '320px 뷰포트 폭에서 핀 패밀리를 확인합니다. 마커 타일 그리드가 좁은 폭에서 접히되 가로 스크롤을 만들지 않아야 합니다.',
  ),
  render: () => (
    <div data-marker-pin-narrow style={{ width: 320, maxWidth: '100%' }}>
      <MarkerPinCatalog />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const fixture = canvasElement.querySelector('[data-marker-pin-narrow]');
    if (!fixture) throw new Error('The narrow marker-pin fixture is missing.');
    if (fixture.scrollWidth > fixture.clientWidth + 1) {
      throw new Error('The marker-pin catalog must not create horizontal overflow at 320px.');
    }
  },
};

export const MarkerPinVisualParity = {
  ...Overview,
  name: 'Marker pin visual parity',
  tags: ['!dev', 'visual-parity'],
};
