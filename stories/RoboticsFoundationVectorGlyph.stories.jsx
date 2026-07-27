import React from 'react';
import {
  NAVIGATION_ENDPOINT_ORIENTATION_PATH,
} from '@lk-robotics/lds-robotics-ui/components/robotics/_navigationVectorGlyph';
import {
  NAV_PROGRESS_HEAD,
  NAV_TRAJECTORY_SAMPLE,
} from '@lk-robotics/lds-robotics-ui/components/robotics/_navigationVocabulary';
import { storyDescription } from './StoryGuide.shared.jsx';

const INK = 'var(--color-semantic-label-strong)';
const MUTED = 'var(--color-semantic-label-neutral)';
const LINE = 'var(--color-semantic-line-normal-normal)';
const SURFACE = 'var(--color-semantic-background-elevated-normal)';
const ACCENT = 'var(--viewer-accent, var(--color-semantic-primary-normal))';
const PATH_INK = 'var(--color-semantic-label-alternative)';

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

function CanvasGrid({ width, height, step = 22 }) {
  const columns = [];
  const rows = [];
  for (let x = step; x < width; x += step) columns.push(x);
  for (let y = step; y < height; y += step) rows.push(y);
  return (
    <g aria-hidden="true">
      {columns.map((x) => (
        <line key={`c${x}`} x1={x} y1="0" x2={x} y2={height} stroke={LINE} strokeWidth="1" opacity="0.42" />
      ))}
      {rows.map((y) => (
        <line key={`r${y}`} x1="0" y1={y} x2={width} y2={y} stroke={LINE} strokeWidth="1" opacity="0.42" />
      ))}
    </g>
  );
}

function DecisionRow({ role, defaultCue, exception }) {
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
      <span style={{ color: INK, fontSize: 'var(--caption1-size)' }}>{defaultCue}</span>
      <span style={{ color: MUTED, fontSize: 'var(--caption1-size)', lineHeight: 1.55 }}>{exception}</span>
    </div>
  );
}

function RouteProgressCue() {
  return (
    <svg viewBox="0 0 260 92" role="img" aria-label="Route 현재 계획 경계" style={{ display: 'block', width: '100%' }}>
      <CanvasGrid width={260} height={92} />
      <path d="M28 58 H146" fill="none" stroke={SURFACE} strokeWidth="7" strokeLinecap="round" />
      <path d="M28 58 H146" fill="none" stroke={ACCENT} strokeWidth="4" strokeLinecap="round" />
      <path d="M146 58 H232" fill="none" stroke={SURFACE} strokeWidth="7" strokeLinecap="round" opacity="0.42" />
      <path d="M146 58 H232" fill="none" stroke={ACCENT} strokeWidth="4" strokeLinecap="round" opacity="0.28" />
      <g transform="translate(146 58) translate(-16 -8)">
        <path d={NAV_PROGRESS_HEAD.path} fill="none" stroke={SURFACE} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <path
          d={NAV_PROGRESS_HEAD.path}
          fill="none"
          stroke={ACCENT}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          data-vector-glyph="progress-head"
        />
      </g>
      <text x="146" y="28" textAnchor="middle" fill={INK} style={{ fontSize: 11, fontWeight: 700 }}>현재 계획 경계</text>
    </svg>
  );
}

function LaneConstraintCue() {
  return (
    <svg viewBox="0 0 260 92" role="img" aria-label="Lane endpoint 방위 제약" style={{ display: 'block', width: '100%' }}>
      <CanvasGrid width={260} height={92} />
      <path d="M34 52 H218" fill="none" stroke={SURFACE} strokeWidth="4" strokeLinecap="round" />
      <path d="M34 52 H218" fill="none" stroke={PATH_INK} strokeWidth="1.5" strokeLinecap="round" />
      <rect x="30" y="48" width="8" height="8" rx="1.5" fill={SURFACE} stroke={PATH_INK} strokeWidth="1.5" />
      <rect x="214" y="48" width="8" height="8" rx="1.5" fill={SURFACE} stroke={PATH_INK} strokeWidth="1.5" />
      <path
        d={NAVIGATION_ENDPOINT_ORIENTATION_PATH}
        transform="translate(232 52)"
        fill="none"
        stroke={INK}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        data-vector-glyph="endpoint-orientation"
      />
      <text x="218" y="28" textAnchor="middle" fill={INK} style={{ fontSize: 11, fontWeight: 700 }}>방위 제약이 있을 때만</text>
    </svg>
  );
}

const TEMPORAL_POINTS = [
  { x: 28, y: 64 },
  { x: 68, y: 62 },
  { x: 108, y: 54 },
  { x: 148, y: 42 },
  { x: 190, y: 36 },
  { x: 232, y: 34 },
];

function TrajectoryTimeCue() {
  const path = TEMPORAL_POINTS.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const currentIndex = 3;
  const current = TEMPORAL_POINTS[currentIndex];
  return (
    <svg viewBox="0 0 260 92" role="img" aria-label="Trajectory 시간 sample과 현재 cursor" style={{ display: 'block', width: '100%' }}>
      <CanvasGrid width={260} height={92} />
      <path d={path} fill="none" stroke={SURFACE} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={path} fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.58" />
      {TEMPORAL_POINTS.map((point, index) => index === currentIndex ? null : (
        <circle
          key={index}
          data-trajectory-sample=""
          cx={point.x}
          cy={point.y}
          r={NAV_TRAJECTORY_SAMPLE.radius}
          fill={ACCENT}
          stroke={SURFACE}
          strokeWidth="0.75"
          opacity={index < currentIndex ? NAV_TRAJECTORY_SAMPLE.pastOpacity : NAV_TRAJECTORY_SAMPLE.futureOpacity}
        />
      ))}
      <g data-trajectory-time-cursor="" transform={`translate(${current.x} ${current.y})`}>
        <circle r={NAV_TRAJECTORY_SAMPLE.cursorOuterRadius} fill={SURFACE} stroke={ACCENT} strokeWidth="1.5" />
        <circle r={NAV_TRAJECTORY_SAMPLE.cursorInnerRadius} fill={ACCENT} />
      </g>
      <text x={current.x} y="22" textAnchor="middle" fill={INK} style={{ fontSize: 11, fontWeight: 700 }}>현재 sample</text>
    </svg>
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
          <DecisionRow role="Lane" defaultCue="추가 표식 없음" exception="endpoint를 숨긴 토폴로지 디버그에서만 방향을 opt-in합니다." />
          <DecisionRow role="Route" defaultCue="현재 계획 경계" exception="진행 중인 Route에만 열린 V head를 한 번 표시합니다." />
          <DecisionRow role="Trajectory" defaultCue="sample + 시간 cursor" exception="방향 화살표를 사용하지 않습니다. 실제 heading은 RobotPose가 소유합니다." />
          <DecisionRow role="Endpoint" defaultCue="제약이 있을 때만" exception="forward/backward 방위 제약이 없으면 화살표도 생략합니다." />
        </div>
      </Card>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(250px, 100%), 1fr))', gap: 12 }}>
        <Card title="Route · 현재 계획 경계" hint="굵은 계획선 위에 한 번만 표시합니다. 일반 segment 방향 삼각형은 제거했습니다.">
          <RouteProgressCue />
        </Card>
        <Card title="Trajectory · 시간 표본" hint="얇은 선, sample 점, 원형 current-sample cursor가 시간 계층을 만듭니다.">
          <TrajectoryTimeCue />
        </Card>
        <Card title="Lane · endpoint 방위 제약" hint="기본 Lane에는 화살표가 없습니다. 명시적 방위 제약만 상세 단계에서 표시합니다.">
          <LaneConstraintCue />
        </Card>
      </section>
    </main>
  );
}

const meta = {
  title: 'LDS Robotics/Foundation/Vector Glyph',
  tags: ['autodocs'],
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-foundation-vector-glyph--overview',
      eyebrow: 'Foundation / Directional Cue',
      title: '방향 표식은 필요한 판단에만 사용합니다',
      description:
        'Lane·Route·Trajectory에 공용 화살표를 반복하지 않습니다. 역할이 이미 가진 구조를 우선 사용하고, 현재 계획 경계나 endpoint 방위 제약처럼 별도 표식이 필요한 정보만 남깁니다.',
      docsDescription:
        '공용 벡터 자산 카탈로그가 아니라 표시 여부를 결정하는 기준입니다. 기본 Lane과 Route segment에서 방향 삼각형을 제거하고, Route progress head·Trajectory sample cursor·Lane endpoint orientation을 역할별 기하로 분리합니다.',
    },
    docs: {
      description: {
        component:
          '내비게이션 방향·시간 단서를 역할별로 검토합니다. 추가 표식을 기본값으로 가정하지 않으며, Route의 현재 계획 경계, Trajectory의 시간 sample, Lane endpoint 방위 제약만 실제 크기와 맥락에서 회귀 검증합니다.',
      },
    },
  },
};

export default meta;

export const Overview = {
  name: '개요',
  parameters: storyDescription(
    '범용 선 위 삼각형은 렌더하지 않습니다. 역할별 기본 표현과 예외 조건을 먼저 읽고, 필요한 단서만 실제 지도 크기로 비교합니다.',
  ),
  render: () => <CueCatalog />,
  play: async ({ canvasElement }) => {
    if (canvasElement.querySelector('[data-vector-glyph="direction"]')) {
      throw new Error('The foundation must not restore a generic on-line direction triangle.');
    }
    const progress = canvasElement.querySelector('[data-vector-glyph="progress-head"]');
    const endpoint = canvasElement.querySelector('[data-vector-glyph="endpoint-orientation"]');
    const samples = canvasElement.querySelectorAll('[data-trajectory-sample]');
    const cursor = canvasElement.querySelector('[data-trajectory-time-cursor]');
    if (progress?.getAttribute('d') !== NAV_PROGRESS_HEAD.path) {
      throw new Error('Route progress cue must use the Route-owned open-V geometry.');
    }
    if (endpoint?.getAttribute('d') !== NAVIGATION_ENDPOINT_ORIENTATION_PATH) {
      throw new Error('Lane endpoint orientation cue lost its constraint geometry.');
    }
    if (samples.length !== TEMPORAL_POINTS.length - 1 || !cursor) {
      throw new Error('Trajectory cue must use sample dots and one circular current cursor.');
    }
  },
};

export const NarrowViewport = {
  name: '반응형 · 320px 좁은 폭',
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
