import React from 'react';
import { userEvent, waitFor } from 'storybook/test';
import { Map2DCanvas, FacilityTransition, NavigationAnnotationLayer, SpatialRegion } from './lds.js';
import { NavigationMapStage } from './RoboticsNavigationStage.shared.jsx';
import { storyDescription } from './StoryGuide.shared.jsx';
import { assertNoLabelCollisions } from './RoboticsNavigationCollision.shared.jsx';
import { assertSharedFocusIndicator } from './RoboticsNavigationAssert.shared.jsx';

const meta = {
  title: 'LDS Robotics/Navigation/Facility Transition',
  component: FacilityTransition,
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-navigation-facility-transition--facility-transition-overview',
      eyebrow: 'Robotics / Facility Transition',
      title: '설비 전이는 문·승강기·도킹의 위치와 진행 상태를 분리해 보여줍니다',
      description:
        '경로가 문, 승강기, 도크를 통과하면서 어느 endpoint와 설비 상태를 기다리는지 확인해야 할 때 사용합니다. 면적을 가진 객실·로비에는 Spatial Region이, 실제 설비 명령과 세션 제어에는 제품 runtime이 적합합니다.',
    },
    docs: {
      description: {
        component: '제품이 제공한 door/lift/dock 상태를 독립 축으로 표시하는 renderer-neutral LK Robotics SVG fragment입니다.',
      },
    },
  },
};

export default meta;

function assertCenteredStateGlyph(mark, expectedKind) {
  const glyph = mark?.querySelector('[data-navigation-state-glyph]');
  const badge = mark?.querySelector(':scope > circle');
  if (!glyph || !badge) throw new Error(`State badge is missing SVG geometry for ${expectedKind}.`);
  if (mark.querySelector('text')) throw new Error(`${expectedKind} state badge must not use a font glyph.`);
  if (glyph.dataset.navigationStateGlyph !== expectedKind || !glyph.dataset.navigationStateGlyphSource?.startsWith('lds-icon:')) {
    throw new Error(`${expectedKind} state badge must expose its LDS SVG source.`);
  }

  const matrix = glyph.getScreenCTM();
  const badgeBounds = badge.getBoundingClientRect();
  const glyphBounds = glyph.getBoundingClientRect();
  if (!matrix || !badgeBounds.width || !glyphBounds.width || !glyphBounds.height) {
    throw new Error(`${expectedKind} state badge bounds are unavailable.`);
  }
  const badgeCenter = { x: badgeBounds.left + badgeBounds.width / 2, y: badgeBounds.top + badgeBounds.height / 2 };
  if (Math.abs(matrix.e - badgeCenter.x) > 0.75 || Math.abs(matrix.f - badgeCenter.y) > 0.75) {
    throw new Error(`${expectedKind} SVG origin must remain centered in its badge.`);
  }
  if (glyphBounds.left < badgeBounds.left + 0.5 || glyphBounds.right > badgeBounds.right - 0.5
    || glyphBounds.top < badgeBounds.top + 0.5 || glyphBounds.bottom > badgeBounds.bottom - 0.5) {
    throw new Error(`${expectedKind} SVG geometry must retain visible inset inside its badge.`);
  }
}

function TransitionMap({ children, appearance = 'light', width = 400, height = 260, label, testId, eyebrow = 'FACILITY · L1' }) {
  const svgRef = React.useRef(null);
  const [viewBoxScale, setViewBoxScale] = React.useState(1);

  React.useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;

    const measure = () => {
      const nextScale = svg.getBoundingClientRect().width / width;
      if (!Number.isFinite(nextScale) || nextScale <= 0) return;
      setViewBoxScale((current) => (Math.abs(current - nextScale) < 0.0001 ? current : nextScale));
    };

    measure();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : undefined;
    observer?.observe(svg);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [width]);

  return (
    <Map2DCanvas
      data-testid={testId}
      label={label}
      appearance={appearance}
      controls={false}
      panEnabled={false}
      wheelZoom={false}
      keyboard={false}
      grid={false}
      style={{ width: '100%', maxWidth: width, height: 'auto', aspectRatio: `${width} / ${height}` }}
    >
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="group"
        style={{ display: 'block', width: '100%', height: 'auto' }}
        aria-label={label}
        data-transition-map-scale={viewBoxScale}
      >
        <NavigationMapStage width={width} height={height} eyebrow={eyebrow} north />
        {typeof children === 'function' ? children({ viewportScale: viewBoxScale }) : children}
      </svg>
    </Map2DCanvas>
  );
}

function cabinRegion(mapId, id, label, center) {
  return {
    id,
    mapId,
    label,
    category: 'facility',
    kind: 'lift-cabin',
    facilityId: 'lift-a',
    shape: { kind: 'circle', center, radius: 44 },
  };
}

const liftTransition = {
  id: 'lift-a-1f-2f',
  kind: 'lift',
  label: '화물 승강기 A',
  facilityId: 'lift-a',
  from: {
    mapId: 'warehouse-1f',
    position: { x: 54, y: 188 },
    label: '1층 승강기 접근 지점',
    waypointId: 'lift-a-approach-1f',
    regionId: 'lift-cabin-1f',
    doorId: 'lift-a-door-1f',
  },
  to: {
    mapId: 'warehouse-2f',
    position: { x: 54, y: 188 },
    label: '2층 승강기 도착 지점',
    waypointId: 'lift-a-exit-2f',
    regionId: 'lift-cabin-2f',
    doorId: 'lift-a-door-2f',
  },
  availability: 'available',
  phase: 'approach',
  doorState: 'closed',
  motionState: 'stopped',
  operatingMode: 'agv',
  sessionState: 'requested',
  currentMapId: 'warehouse-1f',
  destinationMapId: 'warehouse-2f',
};

const arrivalLiftTransition = {
  ...liftTransition,
  phase: 'arrival',
  doorState: 'open',
  sessionState: 'owned',
  currentMapId: 'warehouse-2f',
  destinationMapId: 'warehouse-2f',
};

const firstFloorCabin = cabinRegion('warehouse-1f', 'lift-cabin-1f', '1층 객실', { x: 326, y: 88 });
const secondFloorCabin = cabinRegion('warehouse-2f', 'lift-cabin-2f', '2층 객실', { x: 326, y: 88 });

export const FacilityTransitionOverview = {
  name: '개요',
  parameters: storyDescription(
    '같은 설비 identity가 1층 접근에서 2층 도착으로 이어지는 multi-map 상황과 from/to endpoint·선택 링을 봅니다. phase·문·이동·운영 모드·세션 상태 등 각 상태축의 독립 표기는 변형·상태 스토리에서 확인하세요.',
  ),
  render: () => (
    <main style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))', gap: 'var(--space-4)', width: '100%', maxWidth: 880 }}>
      <section aria-labelledby="lift-map-1f" style={{ display: 'grid', gap: 'var(--space-2)', minWidth: 0 }}>
        <strong id="lift-map-1f">1층 · 접근</strong>
        <TransitionMap label="1층 승강기 접근 지도" testId="lift-map-from">
          <path d="M54 188H264Q282 188 282 170V132" fill="none" stroke="var(--color-semantic-primary-normal)" strokeWidth="3" strokeDasharray="7 5" vectorEffect="non-scaling-stroke" aria-hidden="true" />
          <SpatialRegion region={firstFloorCabin} />
          <FacilityTransition transition={liftTransition} activeMapId="warehouse-1f" selected />
        </TransitionMap>
      </section>
      <section aria-labelledby="lift-map-2f" style={{ display: 'grid', gap: 'var(--space-2)', minWidth: 0 }}>
        <strong id="lift-map-2f">2층 · 도착 상태</strong>
        <TransitionMap label="2층 승강기 도착 지도" testId="lift-map-to">
          <path d="M54 188H264Q282 188 282 170V132" fill="none" stroke="var(--color-semantic-primary-normal)" strokeWidth="3" strokeDasharray="7 5" vectorEffect="non-scaling-stroke" aria-hidden="true" />
          <SpatialRegion region={secondFloorCabin} />
          <FacilityTransition transition={arrivalLiftTransition} activeMapId="warehouse-2f" />
        </TransitionMap>
      </section>
    </main>
  ),
  play: async ({ canvasElement }) => {
    const transitions = Array.from(canvasElement.querySelectorAll('[data-transition-id="lift-a-1f-2f"]'));
    if (transitions.length !== 2) throw new Error(`Multi-map lift must render one endpoint per map: ${transitions.length}.`);
    if (transitions[0].dataset.visibleEndpoint !== 'from' || transitions[1].dataset.visibleEndpoint !== 'to') {
      throw new Error(`Lift endpoints are not mapped correctly: ${transitions.map((node) => node.dataset.visibleEndpoint).join(',')}`);
    }

    const from = transitions[0];
    const name = from.getAttribute('aria-label') ?? '';
    if (!name.includes('접근')) {
      throw new Error(`Lift overview endpoint must keep its accessible identity: ${name}`);
    }
    if (!from.querySelector('[data-transition-selection-ring]')) throw new Error('Selected lift transition requires a distinct selection ring.');
  },
};

const unavailableDoor = {
  id: 'door-unavailable',
  kind: 'door',
  label: '서측 자동문',
  facilityId: 'door-west',
  from: { mapId: 'warehouse-1f', position: { x: 42, y: 54 }, label: '서측 통로', doorId: 'door-west' },
  to: { mapId: 'warehouse-1f', position: { x: 70, y: 54 }, label: '적재 구역', doorId: 'door-west' },
  availability: 'unavailable',
  doorState: 'open',
  event: 'pass',
};

const offlineLiftMode = {
  ...liftTransition,
  id: 'lift-offline-mode',
  label: '승강기 B',
  facilityId: 'lift-b',
  from: { mapId: 'warehouse-1f', position: { x: 56, y: 146 }, label: '1층 로비' },
  to: { mapId: 'warehouse-2f', position: { x: 56, y: 146 }, label: '2층 로비' },
  availability: 'available',
  phase: 'waiting',
  operatingMode: 'offline',
  sessionState: 'none',
};

const unknownDock = {
  id: 'dock-unknown',
  kind: 'dock',
  label: '도크 03',
  facilityId: 'dock-03',
  from: { mapId: 'warehouse-1f', position: { x: 42, y: 236 }, label: '도크 접근로' },
  availability: 'unknown',
  phase: 'approach',
};

export const AvailabilityAndSourceStates = {
  name: '변형·상태 · 가용성·오프라인·미확인',
  parameters: {
    ...storyDescription(
      '사용 불가이지만 열린 문, source가 available로 보낸 상태에서 operating mode만 offline인 승강기, 가용성을 알 수 없는 도크를 비교합니다. availability를 내부 축에서 추론하지 않고 slash·점선·question SVG와 텍스트로 함께 전달해야 합니다.',
    ),
    backgrounds: { default: 'Navy' },
  },
  render: () => (
    <main style={{ width: 'min(100%, 680px)' }}>
      <TransitionMap appearance="dark" width={520} height={290} label="다크 설비 전이 상태 지도">
        <FacilityTransition transition={unavailableDoor} activeMapId="warehouse-1f" />
        <FacilityTransition transition={offlineLiftMode} activeMapId="warehouse-1f" selected />
        <FacilityTransition transition={unknownDock} activeMapId="warehouse-1f" />
      </TransitionMap>
    </main>
  ),
  play: async ({ canvasElement }) => {
    const door = canvasElement.querySelector('[data-transition-id="door-unavailable"]');
    const lift = canvasElement.querySelector('[data-transition-id="lift-offline-mode"]');
    const dock = canvasElement.querySelector('[data-transition-id="dock-unknown"]');
    if (!door || !lift || !dock) throw new Error('Facility source-state examples are incomplete.');
    if (door.dataset.transitionAvailability !== 'unavailable' || door.dataset.doorState !== 'open' || !door.querySelector('[data-transition-unavailable-mark]')) {
      throw new Error('Door state and unavailable state must remain independent and color-independent.');
    }
    if (lift.dataset.transitionAvailability !== 'available' || lift.dataset.operatingMode !== 'offline') {
      throw new Error('Offline operating mode must not overwrite source-provided availability.');
    }
    const unknownGlyph = dock.querySelector('[data-transition-unknown-mark] [data-navigation-state-glyph="unknown"]');
    if (dock.dataset.transitionAvailability !== 'unknown' || !unknownGlyph || dock.querySelector('[data-transition-unknown-mark] text') || !dock.textContent?.includes('가용성 미확인')) {
      throw new Error('Unknown availability requires the shared question SVG and a text label.');
    }
  },
};

const compoundStateDock = {
  ...unknownDock,
  id: 'dock-compound-state',
  label: '도크 04',
  facilityId: 'dock-04',
  from: { mapId: 'warehouse-1f', position: { x: 112, y: 126 }, label: '도크 04 접근로' },
};

export const ValidationAndFocusStates = {
  name: '변형·상태 · 선택·포커스·오류·지연',
  parameters: storyDescription(
    '수동 설비 전이에 선택·포커스·오류·지연이 동시에 적용된 상황입니다. source의 미확인 question SVG와 네 상태 glyph가 서로 덮이지 않고, 시각 상태와 접근 가능한 이름·aria-invalid가 같은 정보를 제공해야 합니다.',
  ),
  render: () => (
    <main style={{ width: 'min(100%, 520px)' }}>
      <TransitionMap width={420} height={250} label="복합 설비 전이 상태 지도">
        <FacilityTransition
          transition={compoundStateDock}
          activeMapId="warehouse-1f"
          selected
          focused
          invalid
          stale
        />
      </TransitionMap>
    </main>
  ),
  play: async ({ canvasElement }) => {
    const transition = canvasElement.querySelector('[data-transition-id="dock-compound-state"]');
    if (!transition) throw new Error('Compound facility transition state is missing.');
    if (transition.getAttribute('role') !== 'img' || transition.hasAttribute('aria-pressed')) {
      throw new Error('Passive selected transition must remain an image without aria-pressed.');
    }
    if (transition.getAttribute('aria-invalid') !== 'true') {
      throw new Error('Invalid facility transition must expose aria-invalid.');
    }

    const name = transition.getAttribute('aria-label') ?? '';
    for (const state of ['선택됨', '포커스됨', '잘못된 설비 전이', '데이터 지연']) {
      if (!name.includes(state)) throw new Error(`Accessible name is missing the visible state: ${state}.`);
    }
    for (const selector of [
      '[data-transition-selection-ring]',
      '[data-transition-focus-ring]',
      '[data-transition-invalid-mark]',
      '[data-transition-stale-mark]',
    ]) {
      if (!transition.querySelector(selector)) throw new Error(`Compound state glyph is missing: ${selector}.`);
    }
    assertSharedFocusIndicator(transition.querySelector('[data-transition-focus-ring]'), 'Facility transition');
    const unknownMark = transition.querySelector('[data-transition-unknown-mark]');
    const invalidMark = transition.querySelector('[data-transition-invalid-mark]');
    const staleMark = transition.querySelector('[data-transition-stale-mark]');
    const glyphs = [
      unknownMark?.querySelector('circle'),
      invalidMark?.querySelector('circle'),
      staleMark?.querySelector('circle'),
    ];
    if (glyphs.some((glyph) => !glyph)) throw new Error('Unknown, invalid, and stale facility glyphs must all remain visible.');
    assertCenteredStateGlyph(unknownMark, 'unknown');
    assertCenteredStateGlyph(invalidMark, 'invalid');
    assertCenteredStateGlyph(staleMark, 'stale');
    const bounds = glyphs.map((glyph) => glyph.getBoundingClientRect());
    for (let first = 0; first < bounds.length; first += 1) {
      for (let second = first + 1; second < bounds.length; second += 1) {
        const overlapWidth = Math.min(bounds[first].right, bounds[second].right) - Math.max(bounds[first].left, bounds[second].left);
        const overlapHeight = Math.min(bounds[first].bottom, bounds[second].bottom) - Math.max(bounds[first].top, bounds[second].top);
        if (overlapWidth > 0.25 && overlapHeight > 0.25) {
          throw new Error(`Facility compound glyphs ${first}/${second} overlap by ${overlapWidth}×${overlapHeight} CSS px.`);
        }
      }
    }

    const opacity = Number(canvasElement.ownerDocument.defaultView.getComputedStyle(transition).opacity);
    if (Math.abs(opacity - 0.76) > 0.001) throw new Error(`Stale transition opacity must remain 0.76, received ${opacity}.`);
  },
};

const activeDoor = {
  ...unavailableDoor,
  id: 'active-door',
  label: '동측 자동문',
  facilityId: 'door-east',
  from: { mapId: 'warehouse-1f', position: { x: 62, y: 70 }, label: '동측 통로', doorId: 'door-east' },
  to: { mapId: 'warehouse-1f', position: { x: 98, y: 70 }, label: '포장 구역', doorId: 'door-east' },
  availability: 'available',
  doorState: 'moving',
  event: 'open',
};

const pointerOnlyDoor = {
  ...activeDoor,
  id: 'pointer-only-door',
  label: '목록 소유 자동문',
  facilityId: 'door-pointer-only',
  from: { mapId: 'warehouse-1f', position: { x: 180, y: 70 }, label: '목록 소유 입구', doorId: 'door-pointer-only' },
  to: { mapId: 'warehouse-1f', position: { x: 216, y: 70 }, label: '목록 소유 출구', doorId: 'door-pointer-only' },
};

const otherMapLift = {
  ...liftTransition,
  id: 'other-map-lift',
  from: { mapId: 'warehouse-2f', position: { x: 60, y: 140 } },
  to: { mapId: 'warehouse-3f', position: { x: 60, y: 140 } },
  currentMapId: 'warehouse-2f',
  destinationMapId: 'warehouse-3f',
};

const hiddenDock = {
  ...unknownDock,
  id: 'hidden-dock',
  from: { mapId: 'warehouse-1f', position: { x: 60, y: 210 } },
};

const disabledLift = {
  ...liftTransition,
  id: 'disabled-lift',
  label: '권한 제한 승강기',
  from: { mapId: 'warehouse-1f', position: { x: 52, y: 200 } },
  to: undefined,
};

function InteractionFixture() {
  const [activation, setActivation] = React.useState({ id: '없음', count: 0 });
  const activate = (id) => setActivation((current) => ({ id, count: current.count + 1 }));
  return (
    <main style={{ display: 'grid', gap: 'var(--space-3)', width: 'min(100%, 680px)' }}>
      <TransitionMap label="설비 전이 상호작용 지도" testId="facility-interaction-map">
        {({ viewportScale }) => (
          <NavigationAnnotationLayer>
            <FacilityTransition transition={activeDoor} activeMapId="warehouse-1f" viewportScale={viewportScale} onActivate={activate} />
            <FacilityTransition transition={pointerOnlyDoor} activeMapId="warehouse-1f" viewportScale={viewportScale} aria-hidden="true" onActivate={activate} />
            <FacilityTransition transition={otherMapLift} activeMapId="warehouse-1f" viewportScale={viewportScale} onActivate={activate} />
            <FacilityTransition transition={hiddenDock} activeMapId="warehouse-1f" viewportScale={viewportScale} hidden onActivate={activate} />
            <FacilityTransition transition={disabledLift} activeMapId="warehouse-1f" viewportScale={viewportScale} disabled tabIndex={0} onActivate={activate} />
          </NavigationAnnotationLayer>
        )}
      </TransitionMap>
      <output data-testid="facility-activation" data-activation-count={activation.count} hidden>
        {activation.id} · {activation.count}회
      </output>
    </main>
  );
}

function waitForRender() {
  return new Promise((resolve) => setTimeout(resolve, 20));
}

export const InteractionAndMapFiltering = {
  name: '상호작용 · 활성화와 지도 필터',
  parameters: storyDescription(
    'activeMapId로 현재 map endpoint만 선택하고 hidden·disabled를 적용하는 상황입니다. pointer·Enter·Space는 같은 inspect callback을 호출하며, 다른 층 transition과 숨김 transition은 DOM에 남지 않아야 합니다.',
  ),
  render: () => <InteractionFixture />,
  play: async ({ canvasElement }) => {
    const active = canvasElement.querySelector('[data-transition-id="active-door"]');
    const pointerOnly = canvasElement.querySelector('[data-transition-id="pointer-only-door"]');
    const disabled = canvasElement.querySelector('[data-transition-id="disabled-lift"]');
    if (!active || !pointerOnly || !disabled) throw new Error('Active, pointer-only, and disabled facility transitions must render.');
    if (canvasElement.querySelector('[data-transition-id="other-map-lift"]') || canvasElement.querySelector('[data-transition-id="hidden-dock"]')) {
      throw new Error('Unrelated-map and hidden facility transitions must not render.');
    }
    if (disabled.tabIndex !== -1 || disabled.getAttribute('aria-disabled') !== 'true') {
      throw new Error('Disabled transition must override consumer tabIndex and expose aria-disabled.');
    }
    const disabledOpacity = Number(canvasElement.ownerDocument.defaultView.getComputedStyle(disabled).opacity);
    if (Math.abs(disabledOpacity - 0.45) > 0.001) {
      throw new Error(`Disabled transition opacity must remain 0.45, received ${disabledOpacity}.`);
    }
    const hitArea = active.querySelector('[data-transition-hit-area]');
    if (!hitArea || Number(hitArea.getAttribute('r')) * Math.SQRT2 < 24) {
      throw new Error('Interactive facility transition needs a circular target containing 24×24 CSS px.');
    }

    const view = canvasElement.ownerDocument.defaultView;
    await userEvent.click(active);
    const transitionFocusVisible = active.matches(':focus-visible');
    await waitForRender();
    const hasTransitionFocusRing = Boolean(active.querySelector('[data-transition-focus-ring]'));
    if (hasTransitionFocusRing !== transitionFocusVisible
      || (transitionFocusVisible && view.getComputedStyle(active).outlineStyle !== 'none')) {
      throw new Error('Facility transition must mirror :focus-visible with one shape-managed ring and no rectangular outline.');
    }
    active.dispatchEvent(new view.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await waitForRender();
    if (!active.querySelector('[data-transition-focus-ring]') || view.getComputedStyle(active).outlineStyle !== 'none') {
      throw new Error('Facility keyboard input must restore only its shape-managed focus ring after pointer modality.');
    }
    active.dispatchEvent(new view.KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
    await waitForRender();

    const output = canvasElement.querySelector('[data-testid="facility-activation"]');
    if (output?.dataset.activationCount !== '3' || !output.textContent?.includes('active-door')) {
      throw new Error(`Pointer and keyboard activation must share one callback: ${output?.textContent}`);
    }
    active.dispatchEvent(new view.KeyboardEvent('keydown', { key: 'Enter', repeat: true, bubbles: true, cancelable: true }));
    await waitForRender();
    if (output?.dataset.activationCount !== '3') throw new Error('Repeated facility keydown must not emit another inspect activation.');

    if (pointerOnly.hasAttribute('role') || pointerOnly.hasAttribute('tabindex') || pointerOnly.hasAttribute('aria-label')
      || pointerOnly.getAttribute('focusable') !== 'false' || pointerOnly.getAttribute('aria-hidden') !== 'true') {
      throw new Error('Pointer-only facility fragment must be hidden from AT and non-focusable without duplicate control semantics.');
    }
    await userEvent.click(pointerOnly.querySelector('[data-transition-hit-area]'));
    await waitForRender();
    if (output?.dataset.activationCount !== '4' || !output.textContent?.includes('pointer-only-door')) {
      throw new Error(`Pointer-only facility fragment must preserve pointer selection: ${output?.textContent}`);
    }
    const focusedNode = canvasElement.ownerDocument.activeElement;
    if (focusedNode === pointerOnly || pointerOnly.contains(focusedNode)) {
      throw new Error('Pointer-only facility selection moved focus into an aria-hidden SVG fragment.');
    }
    pointerOnly.dispatchEvent(new view.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await waitForRender();
    if (output?.dataset.activationCount !== '4') throw new Error('Pointer-only facility fragment must not provide hidden keyboard activation.');

    disabled.dispatchEvent(new view.MouseEvent('click', { bubbles: true, cancelable: true }));
    disabled.dispatchEvent(new view.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await waitForRender();
    if (output?.dataset.activationCount !== '4') throw new Error('Disabled transition activation must be blocked.');

    // Cross-entity contract: adjacent door labels are coordinated by the
    // annotation layer — no label overlaps another label or a pin/badge
    // footprint, and both pins stay rendered at their true anchors.
    await waitFor(() => {
      const map = canvasElement.querySelector('[data-testid="facility-interaction-map"]');
      assertNoLabelCollisions(map, 'Facility');
      const activeLabel = active.querySelector('[data-transition-label]')?.getBoundingClientRect();
      const pointerOnlyLabel = pointerOnly.querySelector('[data-transition-label]')?.getBoundingClientRect();
      if (!activeLabel || !pointerOnlyLabel) throw new Error('Both door labels must render for the collision contract.');
      const doorLabelsOverlap = activeLabel.left < pointerOnlyLabel.right - 0.5
        && activeLabel.right > pointerOnlyLabel.left + 0.5
        && activeLabel.top < pointerOnlyLabel.bottom - 0.5
        && activeLabel.bottom > pointerOnlyLabel.top + 0.5;
      if (doorLabelsOverlap) throw new Error('Adjacent door labels still overlap across FacilityTransition instances.');
      [active, pointerOnly].forEach((instance) => {
        const pin = instance.querySelector('[data-transition-marker]')?.getBoundingClientRect();
        if (!pin || pin.width <= 0) throw new Error('Coordinated facility pins must keep rendered bounds.');
      });
    });
  },
};

const narrowLift = {
  ...liftTransition,
  id: 'narrow-lift',
  label: '승강기 A',
  from: { ...liftTransition.from, position: { x: 24, y: 62 } },
  phase: 'moving',
  motionState: 'up',
  sessionState: 'owned',
};

const narrowDoor = {
  ...activeDoor,
  id: 'narrow-door',
  label: '자동문 B',
  from: { mapId: 'warehouse-1f', position: { x: 16, y: 192 } },
  to: { mapId: 'warehouse-1f', position: { x: 32, y: 192 } },
};

export const NarrowWidth = {
  name: '반응형 · 320px 좁은 폭',
  parameters: storyDescription(
    '320px 지도에서 이동 중 승강기와 문 전이 라벨을 함께 읽는 상황입니다. screen-space marker와 다중 상태 라벨이 viewport 밖 페이지 overflow를 만들지 않아야 합니다.',
  ),
  render: () => (
    <div data-testid="narrow-facility-shell" style={{ width: 320, maxWidth: '100%', minWidth: 0 }}>
      <TransitionMap width={320} height={280} label="320px 설비 전이 지도" testId="narrow-facility-map">
        {({ viewportScale }) => (
          <>
            <FacilityTransition transition={narrowLift} activeMapId="warehouse-1f" viewportScale={viewportScale} onActivate={() => {}} />
            <FacilityTransition transition={narrowDoor} activeMapId="warehouse-1f" viewportScale={viewportScale} onActivate={() => {}} />
          </>
        )}
      </TransitionMap>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const shell = canvasElement.querySelector('[data-testid="narrow-facility-shell"]');
    const map = canvasElement.querySelector('[data-testid="narrow-facility-map"]');
    if (!shell || !map) throw new Error('Narrow facility fixture is missing.');
    if (shell.scrollWidth > shell.clientWidth || map.scrollWidth > map.clientWidth) {
      throw new Error(`Facility map must not create horizontal overflow: shell ${shell.scrollWidth}/${shell.clientWidth}, map ${map.scrollWidth}/${map.clientWidth}.`);
    }
    if (shell.getBoundingClientRect().width > 320.5) throw new Error('Narrow facility shell exceeds 320px.');

    const svg = map.querySelector('svg[data-transition-map-scale]');
    if (!svg) throw new Error('Narrow facility map scale probe is missing.');
    const viewBoxWidth = svg.viewBox.baseVal.width;
    const measuredScale = svg.getBoundingClientRect().width / viewBoxWidth;
    const reportedScale = Number(svg.dataset.transitionMapScale);
    if (!Number.isFinite(measuredScale) || Math.abs(reportedScale - measuredScale) > 0.01) {
      throw new Error(`CSS/viewBox scale must use the rendered SVG width: reported ${reportedScale}, measured ${measuredScale}.`);
    }

    const transitions = Array.from(map.querySelectorAll('[data-lds-facility-transition]'));
    if (transitions.length !== 2) throw new Error(`Expected two narrow facility targets, received ${transitions.length}.`);
    for (const transition of transitions) {
      const componentScale = Number(transition.dataset.viewportScale);
      if (Math.abs(componentScale - measuredScale) > 0.01) {
        throw new Error(`Facility target must receive actual CSS/viewBox scale: ${componentScale} versus ${measuredScale}.`);
      }
      const hitArea = transition.querySelector('[data-transition-hit-area]');
      if (!hitArea) throw new Error('Interactive narrow facility transition is missing its transparent hit target.');
      const targetBounds = hitArea.getBoundingClientRect();
      const containedSquare = Math.min(targetBounds.width, targetBounds.height) / Math.SQRT2;
      if (containedSquare < 23.9) {
        throw new Error(`Rendered circular target must contain a 24×24 CSS px square: ${containedSquare.toFixed(2)}px.`);
      }
    }
  },
};

export const FacilityTransitionVisualParity = {
  ...AvailabilityAndSourceStates,
  name: 'Facility transition visual parity',
  tags: ['!dev', 'visual-parity'],
};
