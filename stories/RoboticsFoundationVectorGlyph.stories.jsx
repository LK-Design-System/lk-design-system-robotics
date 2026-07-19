import React from 'react';
import { NAVIGATION_DIRECTION_PATH } from '@lk-robotics/lds-robotics-ui/components/robotics/_navigationVectorGlyph';
import { storyDescription } from './StoryGuide.shared.jsx';

// Renders the shared direction chevron where it actually appears — on a route's
// segments, rotated to each segment's travel direction — straight from the
// _navigationVectorGlyph constant, so the catalog is the atom in context. The
// play-test asserts every rendered path equals NAVIGATION_DIRECTION_PATH.
// (The lane endpoint-orientation arrow is LaneOverlay-local, not a shared atom,
// so it is documented on the lane renderer rather than promoted here.)
const INK = 'var(--color-semantic-label-strong)';
const MUTED = 'var(--color-semantic-label-neutral)';
const LINE = 'var(--color-semantic-line-normal-normal)';
const SURFACE = 'var(--color-semantic-background-elevated-normal)';
const ACCENT = 'var(--viewer-accent, var(--color-semantic-primary-normal))';
const PATHINK = 'var(--color-semantic-label-alternative)';

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

function Frame({ children, caption, mono }) {
  return (
    <figure
      style={{
        margin: 0,
        minWidth: 0,
        display: 'grid',
        gap: 8,
        padding: 14,
        border: `1px solid ${LINE}`,
        borderRadius: 'var(--radius-sm)',
        background: SURFACE,
      }}
    >
      {children}
      <figcaption style={{ display: 'grid', gap: 3, textAlign: 'center' }}>
        <span style={{ fontSize: 12, color: INK }}>{caption}</span>
        <code style={{ fontSize: 11, color: MUTED, maxWidth: '100%', overflowWrap: 'anywhere' }}>{mono}</code>
      </figcaption>
    </figure>
  );
}

// A route that bends through two turns; one filled chevron sits at each segment
// midpoint rotated to that segment's travel direction — exactly how LaneOverlay
// and RouteOverlay place NAVIGATION_DIRECTION_PATH. Middle segment
// (120,104)->(196,58) runs about -31 deg.
function DirectionOnPath() {
  return (
    <svg width="100%" viewBox="0 0 316 140" role="img" aria-label="경로 세그먼트 중점의 진행 방향 셰브론" style={{ display: 'block' }}>
      <path d="M36 104 H120 L196 58 H280" fill="none" stroke={PATHINK} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="36" cy="104" r="4.5" fill={SURFACE} stroke={PATHINK} strokeWidth="2" />
      <circle cx="280" cy="58" r="4.5" fill={SURFACE} stroke={PATHINK} strokeWidth="2" />
      <path d={NAVIGATION_DIRECTION_PATH} transform="translate(78 104) scale(1.9)" fill={ACCENT} data-vector-glyph="direction" />
      <path d={NAVIGATION_DIRECTION_PATH} transform="translate(158 81) rotate(-31) scale(1.9)" fill={ACCENT} data-vector-glyph="direction" />
      <path d={NAVIGATION_DIRECTION_PATH} transform="translate(238 58) scale(1.9)" fill={ACCENT} data-vector-glyph="direction" />
    </svg>
  );
}

function VectorGlyphCatalog() {
  return (
    <main data-vector-glyph-catalog style={{ width: 'min(880px, 100%)', display: 'grid', gap: 16 }}>
      <Card
        title="이동 방향 셰브론 — 경로 위"
        hint="차선과 경로가 선 위에 공통으로 얹는 진행(heading) 표식입니다. 무게중심이 로컬 원점이라 회전만으로 각 세그먼트의 방향을 가리키며, 값은 NAVIGATION_DIRECTION_PATH에서 그대로 렌더됩니다."
      >
        <Frame caption="꺾이는 세그먼트마다 진행 방향" mono="NAVIGATION_DIRECTION_PATH">
          <DirectionOnPath />
        </Frame>
      </Card>
    </main>
  );
}

const meta = {
  title: 'LDS Robotics/Foundation/Vector Glyph',
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-foundation-vector-glyph--overview',
      eyebrow: 'Foundation / Vector Glyph',
      title: '내비게이션 이동 방향 벡터 글리프를 원자 단위로 문서화합니다',
      description:
        'LaneOverlay와 RouteOverlay가 선 위에 공통으로 그리는 이동 방향(heading) 셰브론을 문서화합니다. 차선·경로 세그먼트의 진행 방향을 같은 셰브론 기하로 검토할 때 사용합니다. 궤적의 현재 진행 헤드나 로봇 pose·heading을 표시하는 용도에는 사용하지 마세요. 이 글리프의 path 기하는 내부 모듈 _navigationVectorGlyph가 단일 소스로 소유하며(NAVIGATION_DIRECTION_PATH), 무게중심이 로컬 원점이라 회전만으로 각 세그먼트의 진행 방향을 가리킵니다. 이 페이지는 그 상수를 실제 쓰임(경로 세그먼트 중점) 위에 그대로 렌더해 방향 지시자로 읽히는지 보이고 play-test로 렌더된 모든 셰브론의 path가 상수와 일치함을 단언합니다. 차선 종점 방향 화살표는 소비자가 차선 렌더러 하나뿐이라 공용 원자로 승격하지 않고 해당 컴포넌트 로컬 geometry로 둡니다. 공개 API가 아닌 내부 글리프 모듈입니다.',
    },
    docs: {
      description: {
        component:
          'LaneOverlay와 RouteOverlay가 공유하는 이동 방향 벡터 글리프의 path 기하를 내부 모듈 _navigationVectorGlyph에서 실제 쓰임 위에 그대로 렌더해 문서화·회귀합니다: 채워진 이동 방향 셰브론(NAVIGATION_DIRECTION_PATH). 차선 종점 방향 화살표는 소비자가 차선 렌더러 하나뿐이라 공용 원자로 올리지 않고 컴포넌트 로컬 geometry로 둡니다. 공개 API가 아닌 내부 글리프 모듈입니다.',
      },
    },
  },
};

export default meta;

export const Overview = {
  name: '개요',
  parameters: storyDescription(
    '공용 이동 방향 셰브론을 실제 쓰임 위에서 봅니다. 경로가 꺾이는 각 세그먼트 중점에 얹혀 진행 방향을 가리키며, play-test가 렌더된 모든 셰브론의 d가 NAVIGATION_DIRECTION_PATH와 일치함을 단언하므로 이 페이지가 곧 기하의 회귀 기준입니다.',
  ),
  render: () => <VectorGlyphCatalog />,
  play: async ({ canvasElement }) => {
    const root = canvasElement;
    const directions = Array.from(root.querySelectorAll('[data-vector-glyph="direction"]'));
    if (directions.length < 1) {
      throw new Error('The route illustration must render at least one direction chevron.');
    }
    for (const el of directions) {
      if (el.getAttribute('d') !== NAVIGATION_DIRECTION_PATH) {
        throw new Error('The direction chevron must render NAVIGATION_DIRECTION_PATH.');
      }
    }
  },
};

export const NarrowViewport = {
  name: '반응형 · 320px 좁은 폭',
  parameters: storyDescription(
    '320px 뷰포트 폭에서 벡터 글리프 카탈로그를 확인합니다. 경로 도해가 좁은 폭에 맞춰 줄되 가로 스크롤을 만들지 않아야 합니다.',
  ),
  render: () => (
    <div data-vector-glyph-narrow style={{ width: 320, maxWidth: '100%' }}>
      <VectorGlyphCatalog />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const fixture = canvasElement.querySelector('[data-vector-glyph-narrow]');
    if (!fixture) throw new Error('The narrow vector-glyph fixture is missing.');
    if (fixture.scrollWidth > fixture.clientWidth + 1) {
      throw new Error('The vector-glyph catalog must not create horizontal overflow at 320px.');
    }
  },
};

export const VectorGlyphVisualParity = {
  ...Overview,
  name: 'Vector glyph visual parity',
  tags: ['!dev', 'visual-parity'],
};
