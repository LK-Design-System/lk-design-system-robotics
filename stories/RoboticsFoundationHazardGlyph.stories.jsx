import React from 'react';
import { HAZARD_GLYPH_PATHS, HAZARD_GLYPH_FIT } from '@lk-robotics/lds-robotics-ui/components/robotics/_HazardGlyph';
import { FACILITY_GLYPH_PATHS } from '@lk-robotics/lds-robotics-ui/components/robotics/_FacilityGlyph';
import { storyDescription } from './StoryGuide.shared.jsx';

// Renders the hazard knockout glyphs straight from the _HazardGlyph atom (path +
// fit transform), so the catalog IS the atom rather than a hand-drawn copy. The
// play-test asserts each rendered path equals the source constant.
const INK = 'var(--color-semantic-label-strong)';
const MUTED = 'var(--color-semantic-label-neutral)';
const LINE = 'var(--color-semantic-line-normal-normal)';
const SURFACE = 'var(--color-semantic-background-elevated-normal)';

const KIND_LABELS = {
  stairs: '계단',
  dropoff: '단차·낙하',
  obstacle: '충돌 위험물',
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
        minHeight: 116,
        minWidth: 0,
        padding: 12,
        border: `1px solid ${LINE}`,
        borderRadius: 'var(--radius-sm)',
        background: SURFACE,
      }}
    >
      {children}
      {mono ? <code style={{ fontSize: 11, color: MUTED, maxWidth: '100%', overflowWrap: 'anywhere' }}>{mono}</code> : null}
      <span style={{ fontSize: 11, color: INK, textAlign: 'center', maxWidth: '100%', overflowWrap: 'anywhere' }}>{label}</span>
    </div>
  );
}

// The 960-grid glyph (centered 480,-480) is recentered to the origin and scaled
// by HAZARD_GLYPH_FIT; a viewBox around the origin frames the ~15u result.
function HazardGlyphs() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
      {Object.entries(HAZARD_GLYPH_PATHS).map(([kind, d]) => (
        <Tile key={kind} label={KIND_LABELS[kind]} mono={`HAZARD_GLYPH_PATHS.${kind}`}>
          <svg width={52} height={52} viewBox="-9 -9 18 18" aria-hidden="true" style={{ display: 'block' }}>
            <g transform={HAZARD_GLYPH_FIT} fill={INK}>
              <path d={d} data-hazard-glyph={kind} />
            </g>
          </svg>
        </Tile>
      ))}
    </div>
  );
}

function SharedRampGlyph() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
      <Tile label="경사로 (Facility Glyph 공유)" mono="FACILITY_GLYPH_PATHS.ramp">
        <svg width={52} height={52} viewBox="-9 -9 18 18" aria-hidden="true" style={{ display: 'block' }}>
          <g transform={HAZARD_GLYPH_FIT} fill={INK}>
            <path d={FACILITY_GLYPH_PATHS.ramp} data-hazard-glyph="ramp" />
          </g>
        </svg>
      </Tile>
    </div>
  );
}

function HazardGlyphCatalog() {
  return (
    <main data-hazard-glyph-catalog style={{ width: 'min(880px, 100%)', display: 'grid', gap: 16 }}>
      <Card
        title="위험물 knockout 글리프"
        hint="해저드 마커 핀 배지 위에 흰색으로 찍히는 위험물 종류 글리프입니다. 계단은 Material Symbols(Apache 2.0) stairs_2, 단차·낙하와 충돌 위험물은 LDS가 같은 960 grid에 그린 실루엣이며, 값은 내부 원자 _HazardGlyph에서 그대로 렌더됩니다."
      >
        <HazardGlyphs />
      </Card>
      <Card
        title="경사로(ramp)는 설비 글리프를 공유"
        hint="같은 물리적 경사로가 fleet에 따라 통과 설비일 수도, 회피 대상일 수도 있어 ramp 글리프는 여기서 중복 정의하지 않고 Facility Glyph 원자(_FacilityGlyph)를 그대로 재사용합니다 — 어느 쪽으로 분류돼도 같은 대상으로 읽히도록."
      >
        <SharedRampGlyph />
      </Card>
    </main>
  );
}

const meta = {
  title: 'LDS Robotics/Foundation/Hazard Glyph',
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-foundation-hazard-glyph--overview',
      eyebrow: 'Foundation / Hazard Glyph',
      title: '해저드 위험물 knockout 글리프를 원자 단위로 문서화합니다',
      description:
        '해저드 마커가 severity 색 핀 배지 위에 찍는 위험물 종류 글리프입니다. 계단·단차(낙하)·충돌 위험물 세 실루엣은 내부 원자 _HazardGlyph가 단일 소스로 소유하고(HAZARD_GLYPH_PATHS), 경사로는 같은 물리적 대상이 통과 설비일 수도 회피 대상일 수도 있어 Facility Glyph 원자를 공유합니다. 해저드 마커의 내부 글리프 자산과 배지 크기 판독성을 검토할 때 사용합니다. 제품 지도에 글리프를 직접 배치하거나 해저드 마커 전체를 대신하는 용도에는 사용하지 마세요. 이 페이지는 그 path를 fit 변환과 함께 그대로 렌더해 배지 크기에서 서로 구분되는지 보이고, play-test로 렌더된 path가 상수와 일치함을 단언합니다. 공개 API가 아닌 내부 글리프 모듈입니다.',
    },
    docs: {
      description: {
        component:
          '해저드 마커가 공유하는 위험물 knockout 글리프의 path를 내부 원자 _HazardGlyph에서 그대로 렌더해 문서화·회귀합니다: 계단(Material Symbols stairs_2)·단차/낙하·충돌 위험물(LDS 작성). 경사로는 Facility Glyph 원자를 공유해 중복 정의하지 않습니다. 공개 API가 아닌 내부 글리프 모듈입니다.',
      },
    },
  },
};

export default meta;

export const Overview = {
  name: '개요',
  parameters: storyDescription(
    '위험물 글리프 세 종을 실제 원자 값으로 비교합니다. 배지 크기에서 계단의 다단 지그재그, 단차의 한 단 + 낙하 화살표, 충돌 위험물의 콘 실루엣이 서로 구분되는지 확인하세요. play-test가 렌더된 path의 d가 HAZARD_GLYPH_PATHS 상수와 일치함을 단언하므로 이 페이지가 곧 글리프의 회귀 기준입니다.',
  ),
  render: () => <HazardGlyphCatalog />,
  play: async ({ canvasElement }) => {
    const root = canvasElement;
    const keys = Object.keys(HAZARD_GLYPH_PATHS);
    const rendered = Array.from(root.querySelectorAll('[data-hazard-glyph]')).filter(
      (el) => el.getAttribute('data-hazard-glyph') !== 'ramp',
    );
    if (rendered.length !== keys.length) {
      throw new Error('The hazard glyph catalog must render exactly one path per HAZARD_GLYPH_PATHS key.');
    }
    for (const el of rendered) {
      const kind = el.getAttribute('data-hazard-glyph');
      if (el.getAttribute('d') !== HAZARD_GLYPH_PATHS[kind]) {
        throw new Error(`Hazard glyph "${kind}" must render HAZARD_GLYPH_PATHS.${kind}.`);
      }
    }
    // ramp is documented as a shared Facility Glyph atom, not duplicated here.
    const ramp = root.querySelector('[data-hazard-glyph="ramp"]');
    if (ramp?.getAttribute('d') !== FACILITY_GLYPH_PATHS.ramp) {
      throw new Error('The shared ramp glyph must render the Facility Glyph atom (FACILITY_GLYPH_PATHS.ramp).');
    }
  },
};

export const NarrowViewport = {
  name: '반응형 · 320px 좁은 폭',
  parameters: storyDescription(
    '320px 뷰포트 폭에서 위험물 글리프 카탈로그를 확인합니다. 카드와 글리프 타일이 좁은 폭에서 접히되 가로 스크롤을 만들지 않아야 합니다.',
  ),
  render: () => (
    <div data-hazard-glyph-narrow style={{ width: 320, maxWidth: '100%' }}>
      <HazardGlyphCatalog />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const fixture = canvasElement.querySelector('[data-hazard-glyph-narrow]');
    if (!fixture) throw new Error('The narrow hazard-glyph fixture is missing.');
    if (fixture.scrollWidth > fixture.clientWidth + 1) {
      throw new Error('The hazard glyph catalog must not create horizontal overflow at 320px.');
    }
  },
};

export const HazardGlyphVisualParity = {
  ...Overview,
  name: 'Hazard glyph visual parity',
  tags: ['!dev', 'visual-parity'],
};
