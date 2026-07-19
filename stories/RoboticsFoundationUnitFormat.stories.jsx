import React from 'react';
import {
  formatValueWithUnit,
  getUnitSeparator,
  isAttachedUnit,
  normalizeUnit,
  normalizeValueText,
} from '@lk-robotics/lds-robotics-ui/components/internal/unit-format';
import { storyDescription } from './StoryGuide.shared.jsx';

// Cross-area value/unit lockup rule, shared across the Robotics areas. The
// internal `unit-format` module is the single source that decides whether a unit
// attaches to the number (%, ‰, °) or is separated by a space (m/s, kg, ℃), and
// it is already consumed by Status (TelemetryGauge · TelemetryValue) and Editor
// (ViewportStatusBar · SelectionInspector). This page renders the rule straight
// from those functions and the play-test asserts the DOM equals their output, so
// the module — not any one component — is the regression baseline. Internal
// module, not part of the public API.
const INK = 'var(--color-semantic-label-strong)';
const MUTED = 'var(--color-semantic-label-neutral)';
const LINE = 'var(--color-semantic-line-normal-normal)';
const SURFACE = 'var(--color-semantic-background-elevated-normal)';

// Live cases drawn from the real product surfaces; `expected` is computed from
// the module so the catalog can never drift from the source rule.
const CASES = [
  { value: 98, unit: '%', label: '백분율' },
  { value: 37.2, unit: '°', label: '각도 기호' },
  { value: 5, unit: '‰', label: '천분율' },
  { value: 1.2, unit: 'm/s', label: '속도' },
  { value: 24.6, unit: 'kg', label: '무게' },
  { value: 48, unit: 'V', label: '전압' },
  { value: 12, unit: '℃', label: '섭씨 (℃는 분리)' },
  { value: 42, unit: '', label: '단위 없음' },
];

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

function UnitTile({ value, unit, label }) {
  const attached = isAttachedUnit(unit);
  const normalizedUnit = normalizeUnit(unit);
  const rendered = normalizeValueText(value);
  const separator = getUnitSeparator(normalizedUnit);
  return (
    <div
      style={{
        display: 'grid',
        placeItems: 'center',
        gap: 8,
        minHeight: 112,
        padding: 12,
        border: `1px solid ${LINE}`,
        borderRadius: 'var(--radius-sm)',
        background: SURFACE,
      }}
    >
      <span
        data-unit-format=""
        data-unit-attached={String(attached)}
        data-unit-case={`${value}|${unit}`}
        style={{ fontSize: 'var(--heading2-size)', color: INK, fontVariantNumeric: 'tabular-nums' }}
      >
        <span>{rendered}</span>
        {normalizedUnit !== '' && (
          <span>
            {separator}
            {normalizedUnit}
          </span>
        )}
      </span>
      <code style={{ fontSize: 11, color: MUTED }}>
        {normalizedUnit === '' ? '구분자 없음' : attached ? '부착 · 공백 없음' : '분리 · 공백'}
      </code>
      <span style={{ fontSize: 11, color: INK, textAlign: 'center' }}>{label}</span>
    </div>
  );
}

function UnitFormatCatalog() {
  return (
    <main data-unit-format-catalog style={{ width: 'min(880px, 100%)', display: 'grid', gap: 16 }}>
      <Card
        title="값 · 단위 결합 규칙"
        hint="%, ‰, ° 세 기호만 숫자에 붙고(공백 없음), 나머지 단위는 한 칸 띄웁니다. ℃는 ° 와 달리 분리됩니다. 규칙은 unit-format 모듈의 isAttachedUnit / getUnitSeparator / formatValueWithUnit에서 그대로 렌더되며, Status·Editor 표면이 이 한 모듈을 공유합니다."
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
          {CASES.map((c) => (
            <UnitTile key={`${c.value}|${c.unit}`} {...c} />
          ))}
        </div>
      </Card>
    </main>
  );
}

const meta = {
  title: 'LDS Robotics/Foundation/Unit Format',
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-foundation-unit-format--overview',
      eyebrow: 'Foundation / Unit Format',
      title: '값과 단위를 결합하는 규칙을 원자 단위로 문서화합니다',
      description:
        'Status와 Editor의 여러 컴포넌트(TelemetryGauge·TelemetryValue·ViewportStatusBar·SelectionInspector)가 숫자 값과 단위를 한 지도에서 동일하게 조판하도록, 결합 규칙을 내부 모듈 unit-format이 단일 소스로 소유합니다. %·‰·° 세 기호만 숫자에 부착되고 나머지 단위는 한 칸 띄우며, ℃는 ° 와 달리 분리됩니다. 로보틱스 상태·편집기 표면의 값과 단위 조판을 통일할 때 사용합니다. 날짜·통화·로케일 변환이나 사용자가 입력한 자유 형식 문자열에는 사용하지 마세요. 이 페이지는 그 규칙을 모듈 함수(isAttachedUnit·getUnitSeparator·formatValueWithUnit)에서 그대로 렌더해, 모듈 자체가 회귀 기준이 되도록 합니다. 공개 API가 아닌 내부 모듈이며, Navigation에 국한되지 않는 교차영역 원자입니다.',
    },
    docs: {
      description: {
        component:
          'Status·Editor 컴포넌트가 공유하는 값·단위 조판 규칙을 내부 모듈 unit-format에서 그대로 렌더해 문서화·회귀합니다: 부착 단위(%·‰·°)는 공백 없이, 나머지는 한 칸 띄우며, formatValueWithUnit이 접근성 텍스트와 시각 텍스트를 같은 규칙으로 결합합니다. 공개 API가 아닌 내부 교차영역 모듈입니다.',
      },
    },
  },
};

export default meta;

export const Overview = {
  name: '개요',
  parameters: storyDescription(
    '값·단위 결합 규칙을 실제 unit-format 함수에서 렌더해 봅니다. 부착(%·‰·°)과 분리(m/s·kg·℃) 사례가 규칙대로 조판되는지 확인하세요. play-test가 렌더된 텍스트와 부착 여부가 모듈 함수의 결과와 일치함을 단언하므로 이 페이지가 곧 규칙의 회귀 기준입니다.',
  ),
  render: () => <UnitFormatCatalog />,
  play: async ({ canvasElement }) => {
    const root = canvasElement;
    const tiles = Array.from(root.querySelectorAll('[data-unit-format]'));
    if (tiles.length !== CASES.length) {
      throw new Error('The unit-format catalog must render exactly one tile per case.');
    }
    for (const c of CASES) {
      const el = root.querySelector(`[data-unit-case="${c.value}|${c.unit}"]`);
      if (!el) throw new Error(`Missing unit-format tile for ${c.value}|${c.unit}.`);
      const expected = formatValueWithUnit(c.value, c.unit);
      if (el.textContent !== expected) {
        throw new Error(`Unit lockup "${c.value}|${c.unit}" must render formatValueWithUnit output "${expected}".`);
      }
      if (el.getAttribute('data-unit-attached') !== String(isAttachedUnit(c.unit))) {
        throw new Error(`Unit "${c.unit}" attachment must match isAttachedUnit.`);
      }
    }
    // Spot-check the separator contract at the boundary the module owns.
    if (getUnitSeparator('%') !== '' || getUnitSeparator('m/s') !== ' ' || getUnitSeparator('°') !== '' || getUnitSeparator('℃') !== ' ') {
      throw new Error('getUnitSeparator must attach %/‰/° and space every other unit.');
    }
  },
};

export const NarrowViewport = {
  name: '반응형 · 320px 좁은 폭',
  parameters: storyDescription(
    '320px 뷰포트 폭에서 단위 결합 카탈로그를 확인합니다. 타일 그리드가 좁은 폭에서 접히되 가로 스크롤을 만들지 않아야 합니다.',
  ),
  render: () => (
    <div data-unit-format-narrow style={{ width: 320, maxWidth: '100%' }}>
      <UnitFormatCatalog />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const fixture = canvasElement.querySelector('[data-unit-format-narrow]');
    if (!fixture) throw new Error('The narrow unit-format fixture is missing.');
    if (fixture.scrollWidth > fixture.clientWidth + 1) {
      throw new Error('The unit-format catalog must not create horizontal overflow at 320px.');
    }
  },
};

export const UnitFormatVisualParity = {
  ...Overview,
  name: 'Unit format visual parity',
  tags: ['!dev', 'visual-parity'],
};
