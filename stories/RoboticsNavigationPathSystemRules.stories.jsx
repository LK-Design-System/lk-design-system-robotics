import React from 'react';
// Shared Path System rules; component-specific examples stay in Lane, Route, and Trajectory stories.
import { storyDescription } from './StoryGuide.shared.jsx';
import { LineRoleSwatch } from './RoboticsNavigationStage.shared.jsx';

const INK = 'var(--color-semantic-label-strong)';
const MUTED = 'var(--color-semantic-label-neutral)';
const LINE = 'var(--color-semantic-line-normal-normal)';

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
        minWidth: 0,
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

// 이 표는 "선이 어떻게 보이는가"를 정의하는데, 이전에는 그걸 전부 산문으로만
// 적었다. 규칙을 정하는 자리에 그 규칙의 실물이 없으면 독자가 글을 그림으로
// 번역해야 한다. 스와치는 지도가 그리는 것과 같은 dash·굵기·색을 쓴다.
function DecisionRow({ role, lineRole, defaultCue, exception }) {
  return (
    <div
      data-cue-decision={role.toLowerCase()}
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(72px, 0.7fr) minmax(110px, 1fr) minmax(160px, 1.8fr)',
        gap: 12,
        alignItems: 'start',
        padding: '10px 0',
        borderTop: `1px solid ${LINE}`,
      }}
    >
      <strong style={{ color: INK, fontSize: 'var(--caption1-size)' }}>{role}</strong>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: INK, fontSize: 'var(--caption1-size)' }}>
        {lineRole && <LineRoleSwatch kind={lineRole} />}
        {defaultCue}
      </span>
      <span style={{ color: MUTED, fontSize: 'var(--caption1-size)', lineHeight: 1.55 }}>{exception}</span>
    </div>
  );
}

function CueCatalog() {
  return (
    <main data-vector-glyph-catalog style={{ width: 'min(920px, 100%)', display: 'grid', gap: 16 }}>
      <Card
        title="표식 여부를 역할에서 먼저 결정합니다"
        hint="공통 화살표를 먼저 고르지 않습니다. 사용자가 판단해야 할 정보가 이미 선의 순서·endpoint·sample에 있으면 추가 표식을 그리지 않습니다."
      >
        <div style={{ display: 'grid' }}>
          <DecisionRow role="Lane" lineRole="lane" defaultCue="화살표 없음" exception="방향은 entry·exit와 선택 상세에서 확인합니다. 지도 위 방향 표식은 Waypoint·RobotPose와 혼동되므로 사용하지 않습니다." />
          <DecisionRow role="Route" lineRole="route" defaultCue="선택 Lane의 계획색 점선" exception="선택된 Lane 기본선은 숨기고 같은 1.5px·4 6 점선을 계획색으로 대체합니다. phase·condition·진행률은 상세 패널에서 확인합니다." />
          <DecisionRow role="Trajectory" lineRole="trajectory" defaultCue="sample만" exception="시간 cursor는 기록 재생·디버그에서만 사용합니다. 실제 위치는 RobotPose가 소유합니다." />
        </div>
      </Card>
    </main>
  );
}

const meta = {
  title: 'LDS Robotics/Navigation/Path System/Shared Rules',
  tags: ['autodocs'],
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-navigation-path-system-shared-rules--overview',
      eyebrow: 'Robotics / Navigation / Path System / Shared Rules',
      title: '경로 계층의 공통 표현 규칙을 한곳에서 관리합니다',
      description:
        'Lane·Route·Trajectory에 위치처럼 보이는 표식을 반복하지 않습니다. Route progress는 지도에서 제거하고 Trajectory cursor는 재생 모드로 제한하며 실제 위치와 heading은 RobotPose가 소유합니다.',
      docsDescription:
        '공용 벡터 자산 카탈로그가 아니라 표시 여부를 결정하는 기준입니다. Route는 선택 Lane을 같은 굵기·점선의 계획색으로 대체하고 Trajectory cursor는 기록 재생에서만 사용합니다.',
    },
    docs: {
      description: {
        component:
          '내비게이션 방향·시간 단서를 역할별로 검토합니다. RobotPose가 실제 위치를 독점하고 Route에는 위치형 표식이 없으며 Trajectory의 기록 재생 예시는 전용 스토리에서 다룹니다.',
      },
    },
  },
};

export default meta;

export const Overview = {
  name: '공통 표현 규칙',
  parameters: storyDescription(
    '범용 선 위 삼각형은 렌더하지 않습니다. 역할별 기본 표현과 예외 조건을 먼저 읽고, 필요한 단서만 실제 지도 크기로 비교합니다.',
  ),
  render: () => <CueCatalog />,
  play: async ({ canvasElement }) => {
    if (canvasElement.querySelector('[data-vector-glyph="direction"]')) {
      throw new Error('The foundation must not restore a generic on-line direction triangle.');
    }
    if (canvasElement.querySelector('[data-vector-glyph="progress-head"], [data-navigation-progress-head="route"]')) {
      throw new Error('Route progress cues must not return to the map vocabulary.');
    }
    if (canvasElement.querySelector('[data-vector-glyph="endpoint-orientation"]')) {
      throw new Error('Lane endpoint orientation must not return as a map arrow.');
    }
    if (canvasElement.querySelector('[data-trajectory-time-cursor], [data-lk-trajectory-overlay]')) {
      throw new Error('Shared Rules must not embed a Trajectory-specific playback example.');
    }
  },
};

export const NarrowViewport = {
  name: '반응형 · 320px 좁은 폭',
  tags: ['!dev', 'regression'],
  parameters: storyDescription(
    '320px 폭에서 판단 기준과 역할별 실제 크기 예제가 가로 스크롤 없이 한 열로 정렬되는지 확인합니다.',
  ),
  render: () => (
    <div data-vector-glyph-narrow style={{ width: 320, maxWidth: '100%' }}>
      <CueCatalog />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const fixture = canvasElement.querySelector('[data-vector-glyph-narrow]');
    if (!fixture) throw new Error('The narrow directional-cue fixture is missing.');
    if (fixture.scrollWidth > fixture.clientWidth + 1) {
      throw new Error('The directional-cue catalog must not overflow at 320px.');
    }
  },
};

export const VectorGlyphVisualParity = {
  ...Overview,
  name: 'Vector glyph visual parity',
  tags: ['!dev', 'visual-parity'],
};
