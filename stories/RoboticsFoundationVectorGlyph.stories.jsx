import React from 'react';
import {
  NAVIGATION_DIRECTION_PATH,
  NAVIGATION_ENDPOINT_ORIENTATION_PATH,
} from '@lk-robotics/lds-robotics-ui/components/robotics/_navigationVectorGlyph';
import { NAV_PROGRESS_HEAD } from '@lk-robotics/lds-robotics-ui/components/robotics/_navigationVocabulary';
import { storyDescription } from './StoryGuide.shared.jsx';

// Renders the shared arrow vocabulary where it actually appears — straight from
// the _navigationVectorGlyph / _navigationVocabulary constants, so the catalog
// is the atom in context. The play-test asserts every rendered path equals its
// constant. Three families, three jobs:
//   - filled direction chevron  — heading ON a path (lane/route/trajectory)
//   - open-V progress head      — current position AT the line end (marker-end)
//   - stroked orientation arrow — approach orientation AT a lane endpoint
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

// Faint map-canvas grid behind every illustration. The renderers always paint
// over a busy map, and the casing layer only reads against SOMETHING — a bare
// card background hides exactly the thing the casing exists for.
function CanvasGrid({ width, height, step = 22 }) {
  const columns = [];
  for (let x = step; x < width; x += step) columns.push(x);
  const rows = [];
  for (let y = step; y < height; y += step) rows.push(y);
  return (
    <g aria-hidden="true">
      {columns.map((x) => (
        <line key={`c${x}`} x1={x} y1="0" x2={x} y2={height} stroke={LINE} strokeWidth="1" opacity="0.5" />
      ))}
      {rows.map((y) => (
        <line key={`r${y}`} x1="0" y1={y} x2={width} y2={y} stroke={LINE} strokeWidth="1" opacity="0.5" />
      ))}
    </g>
  );
}

// A route that bends through two turns; one filled chevron sits at each segment
// midpoint rotated to that segment's travel direction — exactly how LaneOverlay
// and RouteOverlay place NAVIGATION_DIRECTION_PATH. Middle segment
// (120,104)->(196,58) runs about -31 deg.
function DirectionOnPath() {
  return (
    <svg width="100%" viewBox="0 0 316 140" role="img" aria-label="경로 세그먼트 중점의 진행 방향 셰브론" style={{ display: 'block' }}>
      <CanvasGrid width={316} height={140} />
      <path d="M36 104 H120 L196 58 H280" fill="none" stroke={SURFACE} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M36 104 H120 L196 58 H280" fill="none" stroke={PATHINK} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="36" cy="104" r="4.5" fill={SURFACE} stroke={PATHINK} strokeWidth="2" />
      <circle cx="280" cy="58" r="4.5" fill={SURFACE} stroke={PATHINK} strokeWidth="2" />
      <path d={NAVIGATION_DIRECTION_PATH} transform="translate(78 104) scale(1.9)" fill={ACCENT} stroke={SURFACE} strokeWidth="1" strokeLinejoin="round" vectorEffect="non-scaling-stroke" data-vector-glyph="direction" />
      <path d={NAVIGATION_DIRECTION_PATH} transform="translate(158 81) rotate(-31) scale(1.9)" fill={ACCENT} stroke={SURFACE} strokeWidth="1" strokeLinejoin="round" vectorEffect="non-scaling-stroke" data-vector-glyph="direction" />
      <path d={NAVIGATION_DIRECTION_PATH} transform="translate(238 58) scale(1.9)" fill={ACCENT} stroke={SURFACE} strokeWidth="1" strokeLinejoin="round" vectorEffect="non-scaling-stroke" data-vector-glyph="direction" />
    </svg>
  );
}

// The same chevron the way the renderers actually paint it at viewportScale 1:
// casing+core path, ONE chevron per path, tone fill with a 1px surface
// knockout, no magnification. Fixed pixel size on purpose — a responsive width
// would silently re-scale it and the frame would stop being "actual size".
function DirectionActualSize() {
  return (
    <svg
      width={316}
      height={88}
      viewBox="0 0 316 88"
      role="img"
      aria-label="실측 크기의 진행 방향 셰브론"
      style={{ display: 'block', margin: '0 auto', maxWidth: '100%' }}
    >
      <CanvasGrid width={316} height={88} />
      <path d="M36 60 H130 L210 34 H280" fill="none" stroke={SURFACE} strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M36 60 H130 L210 34 H280" fill="none" stroke={ACCENT} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d={NAVIGATION_DIRECTION_PATH}
        transform="translate(170 47) rotate(-18)"
        fill={ACCENT}
        stroke={SURFACE}
        strokeWidth="1"
        strokeLinejoin="round"
        data-vector-glyph="direction"
      />
    </svg>
  );
}

// The three arrow families side by side, each on the geometry it actually
// annotates, so "which arrow do I reach for" is answered in one frame. All
// three are drawn at the same ~2x review scale on the same grid, with the same
// accent tone, so the only thing that varies between frames is the SHAPE.
function ArrowVocabulary() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
      <Frame caption="방향 셰브론 — 선 위 heading" mono="NAVIGATION_DIRECTION_PATH">
        <svg width="100%" viewBox="0 0 200 88" role="img" aria-label="선 위의 채워진 방향 셰브론" style={{ display: 'block' }}>
          <CanvasGrid width={200} height={88} />
          <path d="M24 44 H176" fill="none" stroke={SURFACE} strokeWidth="7" strokeLinecap="round" />
          <path d="M24 44 H176" fill="none" stroke={ACCENT} strokeWidth="3.5" strokeLinecap="round" />
          <path
            d={NAVIGATION_DIRECTION_PATH}
            transform="translate(100 44) scale(2)"
            fill={ACCENT}
            stroke={SURFACE}
            strokeWidth="1"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            data-vector-glyph="direction"
          />
        </svg>
      </Frame>
      <Frame caption="진행 헤드 — 선 끝 현재 위치" mono="NAV_PROGRESS_HEAD.path">
        <svg width="100%" viewBox="0 0 200 88" role="img" aria-label="선 끝의 열린 V 진행 헤드" style={{ display: 'block' }}>
          <CanvasGrid width={200} height={88} />
          <path d="M24 44 H144" fill="none" stroke={SURFACE} strokeWidth="7" strokeLinecap="round" />
          <path d="M24 44 H144" fill="none" stroke={ACCENT} strokeWidth="3.5" strokeLinecap="round" />
          {/* head tip lands exactly on the line end (refX 16 · refY 8), like marker-end */}
          <g transform="translate(144 44) scale(2) translate(-16 -8)">
            <path d={NAV_PROGRESS_HEAD.path} fill="none" stroke={SURFACE} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d={NAV_PROGRESS_HEAD.path} fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" data-vector-glyph="progress-head" />
          </g>
        </svg>
      </Frame>
      <Frame caption="종점 방위 화살표 — 진입·이탈 방향" mono="NAVIGATION_ENDPOINT_ORIENTATION_PATH">
        <svg width="100%" viewBox="0 0 200 88" role="img" aria-label="차선 종점의 방위 화살표" style={{ display: 'block' }}>
          <CanvasGrid width={200} height={88} />
          <path d="M24 44 H84" fill="none" stroke={SURFACE} strokeWidth="7" strokeLinecap="round" />
          <path d="M24 44 H84" fill="none" stroke={ACCENT} strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="94" cy="44" r="8" fill={SURFACE} stroke={ACCENT} strokeWidth="3" />
          <g transform="translate(94 44) scale(2)">
            <path
              d={NAVIGATION_ENDPOINT_ORIENTATION_PATH}
              transform="translate(14 0)"
              fill="none"
              stroke={INK}
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              data-vector-glyph="endpoint-orientation"
            />
          </g>
        </svg>
      </Frame>
    </div>
  );
}

function VectorGlyphCatalog() {
  return (
    <main data-vector-glyph-catalog style={{ width: 'min(880px, 100%)', display: 'grid', gap: 16 }}>
      <Card
        title="이동 방향 셰브론 — 경로 위"
        hint="차선·경로·궤적이 선 위에 공통으로 얹는 진행(heading) 표식입니다. 무게중심이 로컬 원점이라 회전만으로 각 세그먼트의 방향을 가리키며, 값은 NAVIGATION_DIRECTION_PATH에서 그대로 렌더됩니다."
      >
        <Frame caption="꺾이는 세그먼트마다 진행 방향 (검토용 1.9배 확대)" mono="NAVIGATION_DIRECTION_PATH">
          <DirectionOnPath />
        </Frame>
        <Frame caption="실사용 표기 — casing+core 선 위 실측 크기, 경로당 1개, 톤 채움 + 1px 배경 아웃라인" mono="viewportScale 1 기준 실측">
          <DirectionActualSize />
        </Frame>
      </Card>
      <Card
        title="화살표 어휘 — 셰브론 · 진행 헤드 · 종점 방위"
        hint="세 화살표는 도형이 다른 만큼 역할도 다릅니다. 선 위 heading은 채워진 셰브론, 선 끝의 현재 위치는 casing+core 열린 V 진행 헤드(marker-end), 차선 종점의 진입·이탈 방위는 스트로크 화살표가 담당합니다. 서로 바꿔 쓰지 말고, 한 선(경로 구간)에는 화살표를 하나만 그립니다 — 진행 헤드가 있는 선·구간에서는 방향 중복을 피해 셰브론을 생략합니다."
      >
        <ArrowVocabulary />
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
      title: '내비게이션 화살표 어휘를 원자 단위로 문서화합니다',
      description:
        'LaneOverlay·RouteOverlay·TrajectoryOverlay가 선 위에 공통으로 그리는 이동 방향(heading) 셰브론과, 함께 쓰이는 나머지 화살표 두 계열(선 끝 진행 헤드, 차선 종점 방위 화살표)을 문서화합니다. 어떤 화살표를 어디에 쓰는지 — 선 위 heading은 채워진 셰브론(NAVIGATION_DIRECTION_PATH), 선 끝의 현재 위치는 casing+core 열린 V 진행 헤드(NAV_PROGRESS_HEAD), 종점의 진입·이탈 방위는 스트로크 화살표(NAVIGATION_ENDPOINT_ORIENTATION_PATH) — 를 한 페이지에서 비교·검토할 때 사용합니다. 로봇 pose·heading 자체를 표시하는 용도에는 사용하지 마세요. 글리프 기하는 내부 모듈 _navigationVectorGlyph·_navigationVocabulary가 단일 소스로 소유하며, 이 페이지는 그 상수를 실제 쓰임 위에 그대로 렌더하고(확대 검토 프레임과 viewportScale 1 실측 프레임을 나란히) play-test로 렌더된 모든 화살표의 path가 각 상수와 일치함을 단언합니다. 공개 API가 아닌 내부 글리프 모듈입니다.',
    },
    docs: {
      description: {
        component:
          '내비게이션 렌더러들이 공유하는 화살표 어휘 세 계열을 내부 모듈 상수에서 실제 쓰임 위에 그대로 렌더해 문서화·회귀합니다: 선 위 방향 셰브론(NAVIGATION_DIRECTION_PATH), 선 끝 진행 헤드(NAV_PROGRESS_HEAD), 차선 종점 방위 화살표(NAVIGATION_ENDPOINT_ORIENTATION_PATH). 확대 검토 프레임과 실측 크기 프레임을 나란히 보여줍니다. 공개 API가 아닌 내부 글리프 모듈입니다.',
      },
    },
  },
};

export default meta;

export const Overview = {
  name: '개요',
  parameters: storyDescription(
    '공용 화살표 어휘를 실제 쓰임 위에서 봅니다. 방향 셰브론은 확대 검토 프레임과 실측 크기 프레임을 나란히 비교하고, 아래 카드에서 셰브론·진행 헤드·종점 방위 화살표가 각각 어떤 자리에 쓰이는지 대조합니다. play-test가 렌더된 모든 화살표의 d가 각 상수와 일치함을 단언하므로 이 페이지가 곧 기하의 회귀 기준입니다.',
  ),
  render: () => <VectorGlyphCatalog />,
  play: async ({ canvasElement }) => {
    const root = canvasElement;
    const expectations = [
      ['[data-vector-glyph="direction"]', NAVIGATION_DIRECTION_PATH, 'direction chevron', 2],
      ['[data-vector-glyph="progress-head"]', NAV_PROGRESS_HEAD.path, 'progress head', 1],
      ['[data-vector-glyph="endpoint-orientation"]', NAVIGATION_ENDPOINT_ORIENTATION_PATH, 'endpoint orientation arrow', 1],
    ];
    for (const [selector, expected, label, minCount] of expectations) {
      const rendered = Array.from(root.querySelectorAll(selector));
      if (rendered.length < minCount) {
        throw new Error(`The catalog must render at least ${minCount} ${label}(s).`);
      }
      for (const el of rendered) {
        if (el.getAttribute('d') !== expected) {
          throw new Error(`Every ${label} must render its vocabulary constant.`);
        }
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
