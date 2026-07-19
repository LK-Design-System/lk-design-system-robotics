import React from 'react';
import { ROLE_CODE, ANNOTATION_CODE } from '@lk-robotics/lds-robotics-ui/components/robotics/_navigationEncoding';
import { storyDescription } from './StoryGuide.shared.jsx';

// This page renders the REAL on-map code registry — every role letter and
// annotation code is drawn straight from the internal `_navigationEncoding`
// constants (ROLE_CODE / ANNOTATION_CODE), not a hand-typed approximation. The
// marker badges and the map legend both decode this one registry, so the map
// and its key can never silently drift; the play-test asserts each rendered
// chip's text equals its source code value, which makes the registry its own
// regression baseline.
const INK = 'var(--color-semantic-label-strong)';
const MUTED = 'var(--color-semantic-label-neutral)';
const LINE = 'var(--color-semantic-line-normal-normal)';
const SURFACE = 'var(--color-semantic-background-elevated-normal)';
const ACCENT = 'var(--viewer-accent, var(--color-semantic-primary-normal))';

// Human-facing gloss lives with each surface, not in the registry, because the
// accessible-name copy and the visible legend copy have different audiences.
// Here we only annotate the role letters so the terse codes read at a glance.
const ROLE_GLOSS = {
  holding: '대기 지점',
  passthrough: '통과 지점',
  parking: '주차 지점',
  charger: '충전 지점',
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

// A single-glyph role badge. The badge element carries data-code-role={key} and
// its ONLY text child is the ROLE_CODE value, so textContent === the code.
function RoleCodes() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
      {Object.entries(ROLE_CODE).map(([key, code]) => (
        <Tile key={key} label={ROLE_GLOSS[key]} mono={key}>
          <span
            data-code-role={key}
            style={{
              display: 'grid',
              placeItems: 'center',
              width: 34,
              height: 34,
              borderRadius: '50%',
              border: `1px solid ${LINE}`,
              background: 'var(--color-semantic-background-normal-normal)',
              color: ACCENT,
              fontSize: 15,
              fontWeight: 'var(--fw-bold)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {code}
          </span>
        </Tile>
      ))}
    </div>
  );
}

// An annotation code chip. The chip element carries data-code-annotation={key}
// and its ONLY text child is the ANNOTATION_CODE value.
function AnnotationCodes() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
      {Object.entries(ANNOTATION_CODE).map(([key, code]) => (
        <Tile key={key} label={key}>
          <span
            data-code-annotation={key}
            style={{
              display: 'inline-grid',
              placeItems: 'center',
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              border: `1px solid ${LINE}`,
              background: 'var(--color-semantic-background-normal-normal)',
              color: INK,
              fontSize: 12,
              fontWeight: 'var(--fw-bold)',
              fontFamily: 'var(--font-mono, var(--font-sans))',
              letterSpacing: '0.02em',
            }}
          >
            {code}
          </span>
        </Tile>
      ))}
    </div>
  );
}

function CodesCatalog() {
  return (
    <main data-codes-catalog style={{ width: 'min(880px, 100%)', display: 'grid', gap: 16 }}>
      <Card
        title="역할 코드"
        hint="웨이포인트 역할을 한 글자로 압축한 코드입니다. 마커 배지와 지도 범례가 ROLE_CODE 한 집합에서 같은 글자를 읽습니다."
      >
        <RoleCodes />
      </Card>
      <Card
        title="주석 코드"
        hint="독·청소·디스펜서 같은 지점 주석을 짧게 표기한 코드입니다. ANNOTATION_CODE가 코드와 키를 단일 소스로 소유합니다."
      >
        <AnnotationCodes />
      </Card>
    </main>
  );
}

const meta = {
  title: 'LDS Robotics/Foundation/Codes',
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-foundation-codes--overview',
      eyebrow: 'Foundation / Codes',
      title: '지도와 범례가 공유하는 온맵 역할·주석 코드 레지스트리를 원자 단위로 문서화합니다',
      description:
        '지도 위에서 언어에 상관없이 읽히는 짧은 코드를 내부 모듈 _navigationEncoding이 단일 소스로 소유합니다: 웨이포인트 역할 코드 ROLE_CODE(H·T·P·C)와 지점 주석 코드 ANNOTATION_CODE(dock·clean·disp 등). 마커 배지와 지도 범례가 같은 이 코드 집합을 함께 디코드하므로 지도와 범례가 서로 어긋나지 않습니다. 지도와 범례가 동일한 짧은 역할·주석 코드를 공유하는지 검토할 때 사용합니다. 제품 문구나 설명이 필요한 긴 라벨을 이 코드로 대체하는 용도에는 사용하지 마세요. 이 페이지는 두 레지스트리를 그대로 렌더해 각 칩의 텍스트가 소스 코드 값과 일치함을 회귀로 못 박습니다. 공개 API가 아닌 내부 코드 레지스트리입니다.',
    },
    docs: {
      description: {
        component:
          '지도 위에서 언어 중립적으로 읽히는 짧은 온맵 코드를 내부 모듈 _navigationEncoding에서 그대로 렌더해 문서화·회귀합니다: 웨이포인트 역할 코드 ROLE_CODE(H·T·P·C)와 지점 주석 코드 ANNOTATION_CODE(dock·clean·disp 등). 마커 배지와 지도 범례가 이 한 집합을 공유하므로 지도와 범례가 어긋나지 않습니다. 공개 API가 아닌 내부 코드 레지스트리입니다.',
      },
    },
  },
};

export default meta;

export const Overview = {
  name: '개요',
  parameters: storyDescription(
    '역할 코드와 주석 코드 레지스트리를 한 페이지에서 비교합니다. 각 칩은 _navigationEncoding 상수(ROLE_CODE·ANNOTATION_CODE)에서 직접 렌더되고, play-test가 렌더된 각 칩의 텍스트가 소스 코드 값과 일치하며 칩 수가 레지스트리 키 수와 같음을 단언하므로 이 페이지가 곧 코드 레지스트리의 회귀 기준입니다.',
  ),
  render: () => <CodesCatalog />,
  play: async ({ canvasElement }) => {
    const root = canvasElement;

    // Role codes — every ROLE_CODE entry renders exactly one chip whose text is
    // its exact code letter, and the chip set matches the registry key set (a
    // dropped or renamed key breaks this).
    const roleChips = Array.from(root.querySelectorAll('[data-code-role]'));
    if (roleChips.length !== Object.keys(ROLE_CODE).length) {
      throw new Error('The role-code catalog must render exactly one chip per ROLE_CODE entry.');
    }
    for (const [key, code] of Object.entries(ROLE_CODE)) {
      const chip = root.querySelector(`[data-code-role="${key}"]`);
      if (chip?.textContent !== code) {
        throw new Error(`Role code "${key}" must render a chip whose text equals ROLE_CODE.${key} ("${code}").`);
      }
    }

    // Annotation codes — same contract against ANNOTATION_CODE.
    const annotationChips = Array.from(root.querySelectorAll('[data-code-annotation]'));
    if (annotationChips.length !== Object.keys(ANNOTATION_CODE).length) {
      throw new Error('The annotation-code catalog must render exactly one chip per ANNOTATION_CODE entry.');
    }
    for (const [key, code] of Object.entries(ANNOTATION_CODE)) {
      const chip = root.querySelector(`[data-code-annotation="${key}"]`);
      if (chip?.textContent !== code) {
        throw new Error(
          `Annotation code "${key}" must render a chip whose text equals ANNOTATION_CODE.${key} ("${code}").`,
        );
      }
    }
  },
};

export const NarrowViewport = {
  name: '반응형 · 320px 좁은 폭',
  parameters: storyDescription(
    '320px 뷰포트 폭에서 코드 레지스트리를 확인합니다. 카드와 칩 그리드가 좁은 폭에서 접히되 가로 스크롤을 만들지 않아야 합니다.',
  ),
  render: () => (
    <div data-codes-narrow style={{ width: 320, maxWidth: '100%' }}>
      <CodesCatalog />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const fixture = canvasElement.querySelector('[data-codes-narrow]');
    if (!fixture) throw new Error('The narrow codes fixture is missing.');
    if (fixture.scrollWidth > fixture.clientWidth + 1) {
      throw new Error('The codes catalog must not create horizontal overflow at 320px.');
    }
  },
};

export const CodesVisualParity = {
  ...Overview,
  name: 'Foundation codes visual parity',
  tags: ['!dev', 'visual-parity'],
};
