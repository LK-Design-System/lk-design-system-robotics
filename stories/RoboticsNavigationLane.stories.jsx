import React from 'react';
import { userEvent, waitFor } from 'storybook/test';
import { Button } from '@lk-robotics/lds-core';
import { Map2DCanvas } from '@lk-robotics/lds-product';
import {
  HazardMarker,
  LaneOverlay,
  NavigationCoordinateBoundary,
  adaptWorldLaneToLane,
} from '../src/index.js';
// 스토리는 전부 상대 src 경로만 쓴다(패키지 자기참조는 dist 제2 그래프를 만들어
// 컨텍스트를 복제한다) — check:module-graph가 레포 전체에서 이를 강제한다.
import { NavigationLabelPolicyProvider } from '../src/components/robotics/_navigationAnnotations.js';
import { storyDescription } from './StoryGuide.shared.jsx';
import { NavigationLegend, NavigationMapStage } from './RoboticsNavigationStage.shared.jsx';
import { assertSharedFocusIndicator, contrastRatio } from './RoboticsNavigationAssert.shared.jsx';
import {
  assertPathSystemVisualContract,
  PROJECTED_FRAME_L1,
  ROUTE_TRANSFORM_L1,
} from './RoboticsNavigationRouteTrajectory.shared.jsx';

const meta = {
  title: 'LDS Robotics/Navigation/Path System/Lane',
  tags: ['autodocs'],
  component: LaneOverlay,
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-navigation-path-system-lane--lane-overview',
      eyebrow: 'Robotics / Navigation / Path System / Lane',
      title: '레인은 두 지점을 잇는 선이 아니라 방향과 통행 조건을 가진 그래프 연결입니다',
      description:
        '정적 geometry와 방향, 반대 레인 관계, 속도·상호 배제 정보를 먼저 읽고 현재 폐쇄·충돌 상태를 별도로 확인하세요. 실제 주행 궤적이나 문·엘리베이터 상태에는 이 레인이 적합하지 않습니다.',
    },
    docs: {
      description: {
        component:
          '방향성 navigation-graph lane을 renderer-neutral data와 non-scaling SVG fragment로 표현하는 LK Robotics Extension입니다.',
      },
    },
  },
};

export default meta;

const BASE_LANE = adaptWorldLaneToLane({
  id: 'lane-a-b',
  label: 'A → B',
  mapId: 'L1',
  points: [
    { x: 7.2, y: 7.2 },
    { x: 19, y: 7.2 },
    { x: 28.6, y: 15.8 },
    { x: 44, y: 15.8 },
  ],
  entry: { waypointId: 'A', orientation: 'forward' },
  exit: { waypointId: 'B', orientation: 'forward' },
  relation: { kind: 'paired', pairedLaneId: 'lane-b-a' },
  speedLimitMps: 0.8,
  mutexGroupId: 'C2',
}, { transform: ROUTE_TRANSFORM_L1 });

function StoryPage({ title, description, children, maxWidth = 1040 }) {
  return (
    <main style={{ display: 'grid', gap: 'var(--space-6)', width: '100%', maxWidth, minWidth: 0 }}>
      <section style={{ display: 'grid', gap: 'var(--space-2)', maxWidth: 760 }}>
        <h2 style={{ margin: 0, color: 'var(--color-semantic-label-strong)', fontSize: 'var(--title3-size)', lineHeight: 'var(--title3-line)' }}>{title}</h2>
        <p style={{ margin: 0, color: 'var(--color-semantic-label-neutral)', lineHeight: 1.7 }}>{description}</p>
      </section>
      {children}
    </main>
  );
}

// The card caps at the SVG's own footprint (520 map units + canvas padding).
// Without the cap the Map2DCanvas stretched to the story column while the SVG
// stayed at 520px, leaving a third of every wide card - dark cards especially -
// as empty surface to the right of the map. `aspectRatio` is the vertical
// counterpart (same rationale as PathMap): a fixed `height` only fits one column
// width, so narrow fixtures ended up with an empty band under the scaled map.
function LaneMap({ appearance = 'light', label, children, height = 270, testId, eyebrow = 'LANE · L1', svgHeight = 250, aspectRatio, labelPolicy, detailPolicy }) {
  const svgRef = React.useRef(null);
  const [viewportScale, setViewportScale] = React.useState(1);

  React.useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;

    const updateScale = () => {
      const renderedWidth = svg.getBoundingClientRect().width;
      const viewBoxWidth = svg.viewBox.baseVal.width;
      if (!renderedWidth || !viewBoxWidth) return;
      const nextScale = renderedWidth / viewBoxWidth;
      setViewportScale((current) => (Math.abs(current - nextScale) > 0.001 ? nextScale : current));
    };

    updateScale();
    const ResizeObserverConstructor = svg.ownerDocument.defaultView?.ResizeObserver;
    if (ResizeObserverConstructor) {
      const observer = new ResizeObserverConstructor(updateScale);
      observer.observe(svg);
      return () => observer.disconnect();
    }

    const view = svg.ownerDocument.defaultView;
    view?.addEventListener('resize', updateScale);
    return () => view?.removeEventListener('resize', updateScale);
  }, []);

  const scaledChildren = typeof children === 'function'
    ? children(viewportScale)
    : React.Children.map(children, (child) => (
        React.isValidElement(child) ? React.cloneElement(child, { viewportScale }) : child
      ));

  return (
    <Map2DCanvas
      appearance={appearance}
      label={label}
      controls={false}
      panEnabled={false}
      wheelZoom={false}
      keyboard={false}
      grid={false}
      defaultViewport={{ x: 0, y: 0, z: 1 }}
      data-testid={testId}
      style={aspectRatio
        ? { width: '100%', maxWidth: 552, minWidth: 0, height: 'auto', aspectRatio }
        : { width: '100%', maxWidth: 552, minWidth: 0, height }}
    >
      <svg
        ref={svgRef}
        width="520"
        height={svgHeight}
        viewBox={`0 0 520 ${svgHeight}`}
        data-lane-render-scale={viewportScale}
        role="group"
        aria-label={`${label}의 레인 계층`}
        style={{ display: 'block', width: 'min(520px, calc(100cqw - 32px))', height: 'auto' }}
      >
        <NavigationMapStage width={520} height={svgHeight} eyebrow={eyebrow} scaleBar={{ px: 96, label: '4 m' }}>
          {/* 명세 픽스처는 라벨 정책을 지도 한 곳에서 선언한다. 오버레이마다
              labelVisibility를 반복하다 하나를 빠뜨리는 것이 반복 결함이었다. */}
          <NavigationLabelPolicyProvider labelVisibility={labelPolicy} detailVisibility={detailPolicy}>
            {scaledChildren}
          </NavigationLabelPolicyProvider>
        </NavigationMapStage>
      </svg>
    </Map2DCanvas>
  );
}

export const LaneOverview = {
  name: '개요',
  parameters: storyDescription(
    '대표 지도 하나에서 Lane의 geometry·관계·제한을 설명합니다. 테마 반복은 회귀 검증으로 분리하고, 사용자 문서에는 의미가 다른 사례만 남깁니다.',
  ),
  render: () => (
    <StoryPage
      title="방향·관계·제한은 함께, 시설 상태와 궤적은 따로"
      description="점 순서와 entry·exit가 graph 방향을 소유합니다. 화살표는 Waypoint orientation·RobotPose heading과 혼동되므로 그리지 않고, paired relation은 반대 방향 Lane이 별도 entity라는 뜻입니다."
      maxWidth={720}
    >
      <LaneMap label="Lane 대표 지도">
        {(viewportScale) => (
          <NavigationCoordinateBoundary frame={PROJECTED_FRAME_L1}>
            <LaneOverlay lane={BASE_LANE} viewportScale={viewportScale} />
          </NavigationCoordinateBoundary>
        )}
      </LaneMap>
      {/* A bare dashed line cannot say "topology, not trajectory" on its own —
          the contrast with route and trajectory is what carries the meaning. */}
      <NavigationLegend lines={['lane', 'route', 'trajectory']} />
    </StoryPage>
  ),
  play: async ({ canvasElement }) => {
    assertPathSystemVisualContract(canvasElement, 'Lane overview');
    const lanes = canvasElement.querySelectorAll('[data-lk-lane-overlay]');
    if (lanes.length !== 1) throw new Error(`Lane overview expected one representative lane, found ${lanes.length}.`);
    lanes.forEach((lane) => {
      if (lane.getAttribute('data-coordinate-space') !== 'svg-map') {
        throw new Error('Lane overview must be projected from world coordinates into SVG map space.');
      }
      if (lane.getAttribute('data-relation') !== 'paired') throw new Error('Paired lane relation was not preserved.');
      const path = lane.querySelector('[data-lane-path]');
      if (!path?.getAttribute('d')?.startsWith('M 72 178 L')) throw new Error('Lane geometry did not preserve directed points.');
      if (path.getAttribute('vector-effect') !== 'non-scaling-stroke') throw new Error('Lane stroke must remain non-scaling.');
      if (path.getAttribute('stroke-dasharray') !== '4 6') {
        throw new Error('Every Lane must use the stable 4 6 topology dash.');
      }
      assertDirectionOmitted(lane, 'Lane overview');
      if (lane.querySelector('[data-lane-orientation]')) {
        throw new Error('Lane endpoint orientation must stay in data/detail instead of painting an endpoint arrow.');
      }
    });
  },
};

const STATE_LANES = [
  {
    lane: {
      ...BASE_LANE,
      id: 'lane-open',
      label: '통행 가능',
      points: [{ x: 60, y: 56 }, { x: 460, y: 56 }],
      relation: { kind: 'single' },
    },
    availability: 'available',
  },
  {
    lane: {
      ...BASE_LANE,
      id: 'lane-closed',
      label: '폐쇄',
      points: [{ x: 60, y: 168 }, { x: 460, y: 168 }],
      entry: { waypointId: 'C', orientation: 'forward', transitionIds: ['transition-door-a'] },
      exit: { waypointId: 'D', orientation: 'backward', transitionIds: ['transition-lift-a', 'transition-lift-b'] },
      relation: { kind: 'single' },
    },
    availability: 'closed',
  },
  {
    lane: {
      ...BASE_LANE,
      id: 'lane-unknown-conflict',
      label: '미확인 · 충돌',
      points: [{ x: 60, y: 292 }, { x: 230, y: 292 }, { x: 320, y: 262 }, { x: 460, y: 262 }],
      relation: { kind: 'single' },
    },
    availability: 'unknown',
    conflict: true,
  },
];

export const LaneStatesAndConstraints = {
  name: '변형·상태 · 폐쇄, 충돌, 전환 참조',
  parameters: storyDescription(
    'available/closed/unknown과 conflict를 독립 조합하고 entry/exit 전환 참조를 중립 T/count로 표시합니다. 모든 Lane은 동일한 4 6 topology 점선을 유지하고, 통행 가능은 중립색, 폐쇄·충돌은 danger, 미확인은 warning tone으로 구분합니다. 정확한 상태명은 라벨·상세·접근성 이름이 보존합니다.',
  ),
  render: () => (
    <StoryPage
      title="폐쇄와 충돌은 같은 상태가 아니며 시설 전환은 중립 참조로만 남깁니다"
      description="availability와 conflict는 4 6 topology 대시를 그대로 둔 채 톤만 바꿉니다. 폐쇄와 충돌은 같은 danger 톤을 공유하므로, 쉼 상태의 판별은 충돌 좌표에 놓인 지점 마커(hazard 어휘의 충돌)가 소유하고 정확한 상태명은 라벨·상세·접근성 이름이 보존합니다. 문이나 엘리베이터의 실시간 상태는 Facility Transition이 소유하며, 레인은 해당 경계에 전환이 있다는 사실과 개수만 표시하고 종류를 ID에서 추론하지 않습니다."
      maxWidth={780}
    >
      {/* 라벨 정책은 지도에서 한 번 선언한다. 규약상 폐쇄와 충돌은 톤이 같아 라벨이
          판별 채널이므로 명세 스토리는 항상 노출하되(`selected`는 casing을 굵혀 기본
          두께를 가리므로 쓰지 않는다), 상세는 끈다 — 세 레인이 같은 속도·mutex를
          물려받아 동일 문자열이 세 번 반복될 뿐이다. `showEndpoints`는 전환 참조
          (T/count)의 전제로, 빠지면 play의 전환 개수 단언이 실패한다. */}
      <LaneMap label="레인 복합 상태 지도" height={360} svgHeight={340} labelPolicy="always" detailPolicy="hidden">
        {STATE_LANES.map(({ lane, availability, conflict }) => (
          <LaneOverlay
            key={lane.id}
            lane={lane}
            availability={availability}
            conflict={conflict}
            showEndpoints
          />
        ))}
        {/* 쉼 상태에서 폐쇄와 충돌을 가르는 것은 레인 페인트가 아니라 이 지점
            마커다. 규약이 "충돌은 hazards·alerts·상세가 표면화한다"고 정해 두고
            그 마커를 아무도 그리지 않아 두 상태가 픽셀 동일했다. 충돌은 좌표가
            있는 사건이므로 기존 hazard 어휘(kind `obstacle` = 충돌)를 그 좌표에
            그대로 쓴다 — 레인의 4 6 대시와 톤 규약은 건드리지 않는다. */}
        <HazardMarker
          hazard={{
            id: 'lane-conflict-point',
            kind: 'obstacle',
            label: '경로 충돌',
            mapId: 'L1',
            position: { x: 390, y: 262 },
            severity: 'danger',
          }}
        />
      </LaneMap>
      {/* 두 표기가 이 지도에서만 나오고 스스로를 설명하지 못한다: endpoint 사각형은
          웨이포인트처럼 생겼지만 참조 토큰이고, T2는 순번처럼 읽히지만 개수다. */}
      <NavigationLegend
        notes={[
          { code: '◻', label: '웨이포인트 참조 — 역할·상태·선택은 Waypoint 레이어의 실체가 소유' },
          { code: 'T2', label: '경계의 시설 전환 개수 (T2 = 전환 2개) — 순번이 아니라 개수' },
        ]}
      />
    </StoryPage>
  ),
  play: async ({ canvasElement }) => {
    assertPathSystemVisualContract(canvasElement, 'Lane states and constraints');
    const closed = canvasElement.querySelector('[data-lane-id="lane-closed"]');
    const unknownConflict = canvasElement.querySelector('[data-lane-id="lane-unknown-conflict"]');
    // Dash identifies the Lane role and never changes with runtime state.
    for (const lane of [closed, unknownConflict]) {
      if (lane?.querySelector('[data-lane-path]')?.getAttribute('stroke-dasharray') !== '4 6') {
        throw new Error('Lane runtime state must preserve the stable 4 6 topology dash.');
      }
    }
    // Availability/conflict must NOT restore their retired glyph badges.
    if (canvasElement.querySelector('[data-lane-state-glyph="closed"], [data-lane-state-glyph="unknown"], [data-lane-state-glyph="conflict"]')) {
      throw new Error('Availability and conflict must live on the line, not as point badges.');
    }
    if (closed.querySelectorAll('[data-lane-transition-count]').length !== 2) {
      throw new Error('Entry and exit transition counts must stay independently visible.');
    }
    await canvasElement.ownerDocument.fonts.ready;
    await waitFor(() => {
      [...closed.querySelectorAll('[data-lane-transition-count]')].forEach((badge, index) => {
        assertCircularTextGeometry(badge, `Transition count ${index + 1}`);
      });
    });
    if (!closed?.querySelector('[data-lane-path]')?.getAttribute('stroke')?.includes('--viewer-danger')) {
      throw new Error('Closed Lane must use the danger tone without changing its topology dash.');
    }
    if (!unknownConflict?.querySelector('[data-lane-path]')?.getAttribute('stroke')?.includes('--viewer-danger')) {
      throw new Error('Conflict must take danger precedence over unknown without adding another line pattern.');
    }
    if (canvasElement.querySelector('[data-lane-conflict-pattern]')) {
      throw new Error('Conflict must not add a second pattern over the stable Lane dash.');
    }
    // At rest, closed and conflict share the danger tone by convention, so the
    // thing that separates them is the conflict-point marker — the lane paint
    // stays untouched, the event owns a coordinate.
    const conflictPoint = canvasElement.querySelector('[data-lds-hazard-marker][data-hazard-kind="obstacle"]');
    if (!conflictPoint) {
      throw new Error('The conflict lane must carry a conflict-point marker so closed and conflict differ at rest.');
    }
    assertDirectionOmitted(closed, 'Closed lane');
    assertDirectionOmitted(unknownConflict, 'Unknown/conflict lane');
  },
};

function bboxOverlap(first, second, tolerance = 0.25) {
  const overlapWidth = Math.min(first.right, second.right) - Math.max(first.left, second.left);
  const overlapHeight = Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top);
  return overlapWidth > tolerance && overlapHeight > tolerance;
}

function paintedGlyphBounds(glyph) {
  const view = glyph.ownerDocument.defaultView;
  const painted = [...glyph.querySelectorAll('path, circle, rect, line, polyline, polygon')]
    .map((node) => {
      const style = view.getComputedStyle(node);
      const hasFill = style.fill !== 'none' && Number.parseFloat(style.fillOpacity || '1') > 0;
      const hasStroke = style.stroke !== 'none' && Number.parseFloat(style.strokeOpacity || '1') > 0;
      if (!hasFill && !hasStroke) return null;
      const bounds = node.getBoundingClientRect();
      const strokeInset = hasStroke ? (Number.parseFloat(style.strokeWidth) || 0) / 2 : 0;
      return {
        left: bounds.left - strokeInset,
        right: bounds.right + strokeInset,
        top: bounds.top - strokeInset,
        bottom: bounds.bottom + strokeInset,
      };
    })
    .filter(Boolean);
  if (painted.length === 0) throw new Error('Navigation state glyph has no painted geometry.');
  const left = Math.min(...painted.map((bounds) => bounds.left));
  const right = Math.max(...painted.map((bounds) => bounds.right));
  const top = Math.min(...painted.map((bounds) => bounds.top));
  const bottom = Math.max(...painted.map((bounds) => bounds.bottom));
  return { left, right, top, bottom, width: right - left, height: bottom - top };
}

function assertCircularStateGeometry(container, circle, context, minimumInset = 1) {
  const glyph = container?.querySelector('[data-navigation-state-glyph]');
  if (!container || !circle || !glyph) throw new Error(`${context} state geometry is incomplete.`);
  if (container.querySelector('text')) throw new Error(`${context} state badge regressed to font-rendered text.`);

  const circleBounds = circle.getBoundingClientRect();
  const glyphBounds = paintedGlyphBounds(glyph);
  const centerDeltaX = Math.abs(
    (circleBounds.left + circleBounds.width / 2) - (glyphBounds.left + glyphBounds.width / 2),
  );
  const centerDeltaY = Math.abs(
    (circleBounds.top + circleBounds.height / 2) - (glyphBounds.top + glyphBounds.height / 2),
  );
  if (centerDeltaX > 1 || centerDeltaY > 1) {
    throw new Error(`${context} glyph is off-center by ${centerDeltaX.toFixed(2)}×${centerDeltaY.toFixed(2)}px.`);
  }

  const insets = [
    glyphBounds.left - circleBounds.left,
    circleBounds.right - glyphBounds.right,
    glyphBounds.top - circleBounds.top,
    circleBounds.bottom - glyphBounds.bottom,
  ];
  if (Math.min(...insets) < minimumInset) {
    throw new Error(`${context} glyph lacks ${minimumInset}px circle inset: ${insets.map((value) => value.toFixed(2)).join('/')}.`);
  }
}

function assertCircularTextGeometry(badge, context) {
  const circle = badge?.querySelector('[data-lane-transition-count-circle]');
  const text = badge?.querySelector('[data-lane-transition-count-text]');
  if (!circle || !text) throw new Error(`${context} transition count anatomy is incomplete.`);
  const circleBounds = circle.getBoundingClientRect();
  const rawTextBounds = text.getBoundingClientRect();
  const textStroke = (Number.parseFloat(text.ownerDocument.defaultView.getComputedStyle(text).strokeWidth) || 0) / 2;
  const textBounds = {
    left: rawTextBounds.left - textStroke,
    right: rawTextBounds.right + textStroke,
    top: rawTextBounds.top - textStroke,
    bottom: rawTextBounds.bottom + textStroke,
    width: rawTextBounds.width + textStroke * 2,
    height: rawTextBounds.height + textStroke * 2,
  };
  const centerDeltaX = Math.abs(
    (circleBounds.left + circleBounds.width / 2) - (textBounds.left + textBounds.width / 2),
  );
  const centerDeltaY = Math.abs(
    (circleBounds.top + circleBounds.height / 2) - (textBounds.top + textBounds.height / 2),
  );
  if (centerDeltaX > 1 || centerDeltaY > 1) {
    throw new Error(`${context} transition text is off-center by ${centerDeltaX.toFixed(2)}×${centerDeltaY.toFixed(2)}px.`);
  }
  const insets = [
    textBounds.left - circleBounds.left,
    circleBounds.right - textBounds.right,
    textBounds.top - circleBounds.top,
    circleBounds.bottom - textBounds.bottom,
  ];
  const minimumInset = 1;
  const renderingTolerance = 0.5;
  if (Math.min(...insets) + renderingTolerance < minimumInset) {
    throw new Error(
      `${context} transition text lacks ${minimumInset}px circle inset within ${renderingTolerance}px rendering tolerance: ${insets.map((value) => value.toFixed(2)).join('/')}.`,
    );
  }
}

function assertDirectionOmitted(lane, context) {
  if (lane?.querySelector('[data-lane-direction]')) {
    throw new Error(`${context} must not repeat entry/exit direction with an on-line triangle.`);
  }
}

function paintedPathClearance(path, target) {
  if (!path || !target) return Number.NEGATIVE_INFINITY;
  const matrix = path.getScreenCTM();
  if (!matrix) return Number.NEGATIVE_INFINITY;

  const bounds = target.getBoundingClientRect();
  const totalLength = path.getTotalLength();
  const renderedScale = Math.max(
    Math.hypot(matrix.a, matrix.b),
    Math.hypot(matrix.c, matrix.d),
  );
  const sampleCount = Math.max(2, Math.ceil(totalLength * renderedScale * 2));
  let minimumCenterlineDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index <= sampleCount; index += 1) {
    const point = path.getPointAtLength(totalLength * index / sampleCount);
    const screenPoint = new DOMPoint(point.x, point.y).matrixTransform(matrix);
    const dx = Math.max(bounds.left - screenPoint.x, 0, screenPoint.x - bounds.right);
    const dy = Math.max(bounds.top - screenPoint.y, 0, screenPoint.y - bounds.bottom);
    minimumCenterlineDistance = Math.min(minimumCenterlineDistance, Math.hypot(dx, dy));
  }

  const view = path.ownerDocument.defaultView;
  const pathStroke = Number.parseFloat(view.getComputedStyle(path).strokeWidth) || 0;
  const targetStroke = Number.parseFloat(view.getComputedStyle(target).strokeWidth) || 0;
  return minimumCenterlineDistance - pathStroke / 2 - targetStroke / 2;
}

function assertLaneFocusTextClearance(lane, context) {
  const focusPath = lane?.querySelector('[data-lane-focus-ring]');
  const primaryLabel = lane?.querySelector('[data-lane-primary-label]');
  const metadata = lane?.querySelector('[data-lane-metadata]');
  if (!focusPath || !primaryLabel || !metadata) {
    throw new Error(`${context} focus/label/metadata anatomy is incomplete.`);
  }

  for (const [name, target] of [['primary label', primaryLabel], ['metadata', metadata]]) {
    const clearance = paintedPathClearance(focusPath, target);
    if (clearance < 3) {
      throw new Error(`${context} focus path is only ${clearance.toFixed(2)}px from its ${name}; expected at least 3px.`);
    }
  }
}

function assertLaneFocusStateClearance(lane, context) {
  const focusPath = lane?.querySelector('[data-lane-focus-ring]');
  const layer = lane?.querySelector('[data-lane-state-slot-layer]');
  const states = [...(lane?.querySelectorAll('[data-lane-state]') ?? [])];
  if (!focusPath || !layer || states.length === 0) {
    throw new Error(`${context} focus/state anatomy is incomplete.`);
  }

  const normalX = Number(layer.getAttribute('data-lane-state-normal-x'));
  const normalY = Number(layer.getAttribute('data-lane-state-normal-y'));
  const tangentX = Number(layer.getAttribute('data-lane-state-tangent-x'));
  const tangentY = Number(layer.getAttribute('data-lane-state-tangent-y'));
  states.forEach((state) => {
    const circle = state.querySelector('[data-lane-state-circle]');
    const slotX = Number(state.getAttribute('data-lane-state-slot-x'));
    const slotY = Number(state.getAttribute('data-lane-state-slot-y'));
    const normalProjection = slotX * normalX + slotY * normalY;
    const tangentProjection = slotX * tangentX + slotY * tangentY;
    if (Math.abs(normalProjection - 32) > 0.01 || !Number.isFinite(tangentProjection)) {
      throw new Error(`${context} state slot lost tangent/normal placement: ${tangentProjection}/${normalProjection}.`);
    }
    const clearance = paintedPathClearance(focusPath, circle);
    if (clearance < 3) {
      throw new Error(`${context} focus path is only ${clearance.toFixed(2)}px from a state circle; expected at least 3px.`);
    }
  });
}

export const LaneDarkCompoundStates = {
  name: '변형·상태 · 다크 복합 상태',
  tags: ['!dev', 'regression'],
  parameters: storyDescription(
    '어두운 viewer에서 focused·selected·unknown·conflict·invalid가 한 레인에 함께 있을 때 선택 굵기·포커스 링과 상태 glyph가 서로 독립적으로 남고, stale 레인은 별도 freshness 표식과 0.76 opacity를 유지하는지 확인합니다.',
  ),
  render: () => (
    <StoryPage
      title="Dark 지도에서도 복합 상태의 모양과 읽기 순서를 보존합니다"
      description="상태 색은 path와 glyph 외곽선에 남기고, glyph 전경은 viewer surface와 3:1 이상 대비되는 공통 foreground를 사용합니다. label 충돌과 우선순위는 owning renderer가 결정합니다."
      maxWidth={780}
    >
      <LaneMap appearance="dark" label="Dark 레인 복합 상태 지도" aspectRatio="552 / 282">
        <LaneOverlay
          lane={{
            ...BASE_LANE,
            id: 'lane-dark-compound',
            label: '검증 대기',
            points: [{ x: 60, y: 104 }, { x: 460, y: 104 }],
            relation: { kind: 'single' },
          }}
          availability="unknown"
          conflict
          selected
          focused
          invalid
          onActivate={() => {}}
        />
        <LaneOverlay
          lane={{
            ...BASE_LANE,
            id: 'lane-dark-stale',
            label: '오래된 레인',
            points: [{ x: 60, y: 196 }, { x: 460, y: 196 }],
            relation: { kind: 'single' },
          }}
          stale
          onActivate={() => {}}
        />
      </LaneMap>
    </StoryPage>
  ),
  play: async ({ canvasElement }) => {
    assertPathSystemVisualContract(canvasElement, 'Lane dark compound states');
    const viewer = canvasElement.querySelector('[data-viewer-appearance="dark"]');
    const compound = canvasElement.querySelector('[data-lane-id="lane-dark-compound"]');
    const stale = canvasElement.querySelector('[data-lane-id="lane-dark-stale"]');
    if (!viewer || !compound || !stale) throw new Error('Dark compound lane fixture is incomplete.');
    if (!compound.querySelector('[data-lane-focus-ring]') || !compound.querySelector('[data-lane-selection-casing]')) {
      throw new Error('Focused and selected lane indicators must remain independently visible.');
    }
    assertLaneFocusTextClearance(compound, 'Dark compound lane');
    assertLaneFocusStateClearance(compound, 'Dark compound lane');
    const compoundName = compound.getAttribute('aria-label') ?? '';
    for (const stateName of ['상태 미확인', '충돌 있음', '선택됨', '데이터 오류']) {
      if (!compoundName.includes(stateName)) throw new Error(`Compound lane accessible name lost ${stateName}: ${compoundName}`);
    }
    // Lane role keeps one dash; compound runtime state changes only its tone.
    if (compound.querySelector('[data-lane-path]')?.getAttribute('stroke-dasharray') !== '4 6') {
      throw new Error('Compound Lane must preserve the 4 6 topology dash.');
    }
    if (!compound.querySelector('[data-lane-path]')?.getAttribute('stroke')?.includes('--viewer-danger')) {
      throw new Error('Conflict/invalid compound Lane must use the danger tone.');
    }
    if (compound.querySelector('[data-lane-conflict-pattern]')) {
      throw new Error('Compound Lane must not stack a second conflict pattern.');
    }
    if (compound.querySelector('[data-lane-state-glyph="unknown"], [data-lane-state-glyph="conflict"]')) {
      throw new Error('Availability and conflict must not restore their retired point badges.');
    }
    for (const state of ['invalid']) {
      const marker = compound.querySelector(`[data-lane-state="${state}"]`);
      const glyph = marker?.querySelector('[data-navigation-state-glyph]');
      const surface = marker?.querySelector('circle');
      if (!glyph || !surface) throw new Error(`Dark ${state} glyph anatomy is incomplete.`);
      assertCircularStateGeometry(marker, surface, `Dark ${state}`);
      const view = canvasElement.ownerDocument.defaultView;
      const ratio = contrastRatio(view.getComputedStyle(glyph).color, view.getComputedStyle(surface).fill);
      if (ratio < 3) throw new Error(`Dark ${state} glyph contrast is ${ratio.toFixed(2)}:1, below 3:1.`);
    }
    const staleMarker = stale.querySelector('[data-lane-state="stale"]');
    if (!staleMarker || Number(stale.style.opacity) !== 0.76) {
      throw new Error(`Stale lane must retain its glyph and 0.76 opacity; received ${stale.style.opacity}.`);
    }
    assertCircularStateGeometry(staleMarker, staleMarker.querySelector('[data-lane-state-circle]'), 'Dark stale');
    assertDirectionOmitted(compound, 'Dark compound lane');
    assertDirectionOmitted(stale, 'Dark stale lane');
  },
};

const SHORT_PATH_COMPOUND_LANE = {
  ...BASE_LANE,
  id: 'lane-short-compound',
  label: '짧은 복합 상태 레인',
  // The path must render NARROWER than the state glyph row, or this fixture stops
  // stressing anything and its play function says so. The row shrank when
  // availability/conflict lost their point badges: it is now just invalid+stale,
  // two 14px glyphs at ±9, so 32px screen. At 56 units the path measured 35.2px
  // and had quietly become the wider of the two. 42 units lands near 26px.
  points: [{ x: 232, y: 126 }, { x: 274, y: 126 }],
  entry: { waypointId: 'S' },
  exit: { waypointId: 'E' },
  relation: { kind: 'single' },
};

export const LaneShortPathCompoundStates = {
  name: '변형·상태 · 짧은 경로 복합 상태 표식',
  tags: ['!dev', 'regression'],
  parameters: storyDescription(
    '경로가 상태 marker 행보다 짧고 SVG가 축소되어도 invalid·stale 데이터 품질 glyph가 endpoint·label·metadata와 분리된 screen-space hierarchy를 유지하는지 확인합니다. availability는 고정 topology 점선 위의 tone과 상세 정보로 전달합니다.',
  ),
  render: () => (
    <StoryPage
      title="짧은 경로도 상태 glyph를 한 점에 포개지 않습니다"
      description="기본 endpoint chrome과 label·metadata를 모두 켠 standalone anatomy입니다. 상태 row는 path 위, label은 그보다 위, metadata는 path 아래의 screen-space 층을 사용합니다."
      maxWidth={520}
    >
      <div data-testid="lane-short-compound-frame" style={{ width: 360, maxWidth: '100%', minWidth: 0 }}>
        <LaneMap label="짧은 복합 상태 레인 지도" aspectRatio="552 / 282">
          <LaneOverlay
            lane={SHORT_PATH_COMPOUND_LANE}
            availability="unknown"
            showEndpoints
            selected
            invalid
            stale
            onActivate={() => {}}
          />
        </LaneMap>
      </div>
    </StoryPage>
  ),
  play: async ({ canvasElement }) => {
    assertPathSystemVisualContract(canvasElement, 'Lane short compound states');
    const lane = canvasElement.querySelector('[data-lane-id="lane-short-compound"]');
    const svg = canvasElement.querySelector('[data-testid="lane-short-compound-frame"] svg');
    // Availability (unknown) is a line dash now; the offset-stacking row is the
    // two data-quality badges (invalid + stale).
    const states = ['invalid', 'stale'];
    const markers = states.map((state) => lane?.querySelector(`[data-lane-state="${state}"]`));
    if (!lane || !svg || markers.some((marker) => !marker)) {
      throw new Error('Short-path compound lane is missing a required state glyph.');
    }
    if (lane.querySelector('[data-lane-state-glyph="unknown"]')) {
      throw new Error('Unknown availability must live on the line, not a stacked point badge.');
    }
    if (!lane.querySelector('[data-lane-selection-casing]')) {
      throw new Error('Short-path selected state must retain its widened neutral casing.');
    }
    const accessibleName = lane.getAttribute('aria-label') ?? '';
    for (const stateName of ['상태 미확인', '선택됨', '데이터 오류', '오래된 데이터']) {
      if (!accessibleName.includes(stateName)) throw new Error(`Short-path lane accessible name lost ${stateName}: ${accessibleName}`);
    }
    await waitFor(() => {
      const scale = Number(svg.getAttribute('data-lane-render-scale'));
      if (!(scale > 0 && scale < 1)) throw new Error(`Short-path fixture must exercise CSS/viewBox downscaling; received ${scale}.`);
      const entries = markers.map((marker, index) => ({
        state: states[index],
        slotX: Number(marker.getAttribute('data-lane-state-slot-x')),
        bounds: marker.getBoundingClientRect(),
      }));
      entries.forEach(({ state, bounds }) => {
        if (bounds.width < 13.5 || bounds.height < 13.5) {
          throw new Error(`${state} glyph did not retain its screen-space size: ${bounds.width}×${bounds.height}.`);
        }
      });
      for (let leftIndex = 0; leftIndex < entries.length; leftIndex += 1) {
        for (let rightIndex = leftIndex + 1; rightIndex < entries.length; rightIndex += 1) {
          const left = entries[leftIndex];
          const right = entries[rightIndex];
          const overlapWidth = Math.min(left.bounds.right, right.bounds.right) - Math.max(left.bounds.left, right.bounds.left);
          const overlapHeight = Math.min(left.bounds.bottom, right.bounds.bottom) - Math.max(left.bounds.top, right.bounds.top);
          if (overlapWidth > 0.25 && overlapHeight > 0.25) {
            throw new Error(`${left.state}/${right.state} glyphs overlap by ${overlapWidth}×${overlapHeight} CSS px.`);
          }
          const actualCenterDelta = Math.abs(
            (left.bounds.left + left.bounds.width / 2) - (right.bounds.left + right.bounds.width / 2),
          );
          const expectedCenterDelta = Math.abs(left.slotX - right.slotX);
          if (Math.abs(actualCenterDelta - expectedCenterDelta) > 0.75) {
            throw new Error(`${left.state}/${right.state} slots lost screen-space spacing: ${actualCenterDelta} vs ${expectedCenterDelta}.`);
          }
        }
      }
      const pathBounds = lane.querySelector('[data-lane-path]')?.getBoundingClientRect();
      const glyphLeft = Math.min(...entries.map(({ bounds }) => bounds.left));
      const glyphRight = Math.max(...entries.map(({ bounds }) => bounds.right));
      if (!pathBounds || pathBounds.width >= glyphRight - glyphLeft) {
        throw new Error('Short-path fixture no longer stresses a path shorter than the state glyph row.');
      }
      const stateCircles = states.map((state) => lane.querySelector(`[data-lane-state-circle="${state}"]`));
      const endpointPoints = [...lane.querySelectorAll('[data-lane-endpoint-point]')];
      const endpointGlyphs = [...lane.querySelectorAll('[data-lane-endpoint-glyph]')];
      const primaryLabel = lane.querySelector('[data-lane-primary-label]');
      const metadata = lane.querySelector('[data-lane-metadata]');
      if (
        stateCircles.some((node) => !node)
        || endpointPoints.length !== 2
        || endpointGlyphs.length !== 2
        || !primaryLabel
        || !metadata
      ) {
        throw new Error('Short-path standalone anatomy is incomplete.');
      }
      const surroundingAnatomy = [
        ...endpointPoints.map((node, index) => [`endpoint point ${index + 1}`, node]),
        ...endpointGlyphs.map((node, index) => [`endpoint glyph ${index + 1}`, node]),
        ['primary label', primaryLabel],
        ['metadata', metadata],
      ];
      stateCircles.forEach((circle, stateIndex) => {
        assertCircularStateGeometry(markers[stateIndex], circle, `Short-path ${states[stateIndex]}`);
        const stateBounds = circle.getBoundingClientRect();
        surroundingAnatomy.forEach(([name, node]) => {
          if (bboxOverlap(stateBounds, node.getBoundingClientRect())) {
            throw new Error(`${states[stateIndex]} state circle overlaps ${name}.`);
          }
        });
      });
      const primaryLabelBounds = primaryLabel.getBoundingClientRect();
      const metadataBounds = metadata.getBoundingClientRect();
      [...endpointPoints, ...endpointGlyphs].forEach((node) => {
        const bounds = node.getBoundingClientRect();
        if (bboxOverlap(primaryLabelBounds, bounds) || bboxOverlap(metadataBounds, bounds)) {
          throw new Error('Short-path label or metadata overlaps endpoint chrome.');
        }
      });
      if (bboxOverlap(primaryLabelBounds, metadataBounds)) {
        throw new Error('Short-path primary label overlaps metadata.');
      }
      assertDirectionOmitted(lane, 'Short-path compound lane');
    });
  },
};

function LanePointerOnlyFixture() {
  const [activations, setActivations] = React.useState(0);
  const pointerLane = {
    ...BASE_LANE,
    id: 'lane-pointer-only',
    label: '포인터 전용',
    points: [{ x: 72, y: 104 }, { x: 440, y: 104 }],
  };
  const passiveLane = {
    ...BASE_LANE,
    id: 'lane-passive-disabled',
    label: '수동 포커스 비활성 레인',
    // y 200, not 178: the pointer lane's metadata (below its path) and this
    // lane's label (above this path) shared the 74px gap and visually grouped
    // into one ambiguous text block between the two lines.
    points: [{ x: 72, y: 200 }, { x: 440, y: 200 }],
  };

  return (
    <StoryPage
      title="포인터 전용 레인은 클릭만 유지하고 포커스·키보드·이름을 넘깁니다"
      description="aria-hidden 지도 조각은 클릭 identity만 유지하고 focus·keyboard·접근성 이름은 소비 제품의 이름 있는 컨트롤에 넘깁니다. 유효한 선분이 없는 데이터는 빈 button으로 남지 않습니다."
      maxWidth={780}
    >
      <LaneMap label="포인터 전용과 형상 방어 레인 지도">
        <LaneOverlay
          lane={pointerLane}
          selected
          focused
          invalid
          aria-hidden="true"
          onActivate={() => setActivations((count) => count + 1)}
        />
        <LaneOverlay lane={passiveLane} focused disabled />
        <LaneOverlay
          lane={{ ...BASE_LANE, id: 'lane-insufficient-points', points: [{ x: 260, y: 126 }] }}
          onActivate={() => setActivations((count) => count + 1)}
        />
      </LaneMap>
      <output data-testid="lane-pointer-output" hidden>activation {activations}회</output>
    </StoryPage>
  );
}

export const LanePointerOnlyAndGeometryGuard = {
  name: '상호작용 · 포인터 전용과 형상 방어',
  tags: ['!dev', 'regression'],
  parameters: storyDescription(
    'aria-hidden map fragment가 accessibility tree와 Tab 순서에서 빠지면서 pointer click은 유지하는지, passive focused/disabled 이름과 finite point guard가 일관적인지 확인합니다.',
  ),
  render: () => <LanePointerOnlyFixture />,
  play: async ({ canvasElement }) => {
    assertPathSystemVisualContract(canvasElement, 'Lane pointer-only guard');
    const pointerOnly = canvasElement.querySelector('[data-lane-id="lane-pointer-only"]');
    const passive = canvasElement.querySelector('[data-lane-id="lane-passive-disabled"]');
    const output = () => canvasElement.querySelector('[data-testid="lane-pointer-output"]')?.textContent ?? '';
    if (!pointerOnly || !passive) throw new Error('Lane pointer-only fixture is incomplete.');
    for (const attribute of ['role', 'aria-label', 'aria-pressed', 'aria-disabled', 'aria-invalid', 'tabindex']) {
      if (pointerOnly.hasAttribute(attribute)) throw new Error(`Pointer-only lane retained ${attribute}.`);
    }
    if (pointerOnly.getAttribute('aria-hidden') !== 'true' || pointerOnly.getAttribute('focusable') !== 'false') {
      throw new Error('Pointer-only lane must be aria-hidden and explicitly unfocusable.');
    }
    if (pointerOnly.querySelector('[data-lane-focus-ring]')) {
      throw new Error('Pointer-only lane must suppress controlled focus chrome.');
    }
    await userEvent.click(pointerOnly);
    await waitFor(() => {
      if (!output().includes('activation 1회')) throw new Error('Pointer-only lane click did not preserve its callback.');
    });
    if (canvasElement.ownerDocument.activeElement === pointerOnly) {
      throw new Error('Pointer down focused the pointer-only lane.');
    }
    const view = canvasElement.ownerDocument.defaultView;
    for (const event of [
      new view.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
      new view.KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }),
      new view.KeyboardEvent('keydown', { key: 'Enter', repeat: true, bubbles: true, cancelable: true }),
    ]) pointerOnly.dispatchEvent(event);
    await nextRender();
    if (!output().includes('activation 1회')) throw new Error('Pointer-only lane accepted keyboard activation.');

    const passiveName = passive.getAttribute('aria-label') ?? '';
    if (passive.getAttribute('role') !== 'img' || !passiveName.includes('포커스됨') || !passiveName.includes('선택할 수 없음')) {
      throw new Error(`Passive focused/disabled lane name is incomplete: ${passiveName}`);
    }
    if (!passive.querySelector('[data-lane-focus-ring]')) throw new Error('Passive controlled focus ring is missing.');
    if (canvasElement.querySelector('[data-lane-id="lane-insufficient-points"]')) {
      throw new Error('A lane with fewer than two finite points rendered an invisible control.');
    }
  },
};

function LaneActivationFixture() {
  const [selectedId, setSelectedId] = React.useState('');
  const [activations, setActivations] = React.useState(0);
  const activate = (id) => {
    setSelectedId(id);
    setActivations((count) => count + 1);
  };

  return (
    <StoryPage
      title="선택 가능한 레인은 pointer와 키보드가 같은 identity를 전달합니다"
      description="선택은 상태색을 유지한 path 코어와 중립 casing의 굵기 확대로 남습니다. disabled 레인은 맥락을 보존하지만 Tab 순서와 activation에서 빠지며, 전체 그래프 탐색은 이름 있는 목록을 함께 제공해야 합니다."
      maxWidth={780}
    >
      {/* The selectable lane sits at y 100, not 120: its metadata renders below
          its path and the locked lane's label renders above its own, so at
          120/188 the two text lines sat 25px apart in the gap between the lanes
          and read as one block — you could not tell which line belonged to
          which lane. */}
      <LaneMap label="레인 선택 지도">
        <LaneOverlay
          lane={{ ...BASE_LANE, id: 'lane-selectable', label: '검사할 레인', points: [{ x: 132, y: 100 }, { x: 460, y: 100 }] }}
          selected={selectedId === 'lane-selectable'}
          onActivate={activate}
        />
        <LaneOverlay
          lane={{
            ...BASE_LANE,
            id: 'lane-disabled',
            label: '잠긴 레인',
            points: [{ x: 72, y: 188 }, { x: 440, y: 188 }],
          }}
          availability="closed"
          disabled
          onActivate={activate}
        />
      </LaneMap>
      <output data-testid="lane-activation-output" hidden>
        activation {activations}회
      </output>
    </StoryPage>
  );
}

function nextRender() {
  return new Promise((resolve) => setTimeout(resolve, 20));
}

export const LaneSelectionAndActivation = {
  name: '상호작용 · 선택과 비활성',
  parameters: storyDescription(
    '레인 path를 클릭하거나 focus 후 Enter/Space를 눌러 같은 callback이 실행되는지 확인합니다. disabled path는 activation이 발생하지 않고 tabIndex -1을 유지해야 합니다.',
  ),
  render: () => <LaneActivationFixture />,
  play: async ({ canvasElement }) => {
    assertPathSystemVisualContract(canvasElement, 'Lane selection');
    const enabled = canvasElement.querySelector('[data-lane-id="lane-selectable"]');
    const disabled = canvasElement.querySelector('[data-lane-id="lane-disabled"]');
    const output = () => canvasElement.querySelector('[data-testid="lane-activation-output"]')?.textContent ?? '';
    const view = canvasElement.ownerDocument.defaultView;
    if (!enabled || enabled.getAttribute('role') !== 'button' || !enabled.getAttribute('aria-label')?.includes('검사할 레인')) {
      throw new Error('Interactive lane needs a button role and useful accessible name.');
    }
    const hitCore = enabled.querySelector('[data-lane-actual-hit-core]');
    if (!hitCore || hitCore.getAttribute('data-screen-target-diameter') !== '35') {
      throw new Error('Interactive lane needs the stable 35px midpoint target contract.');
    }
    await waitFor(() => {
      const bounds = hitCore.getBoundingClientRect();
      const minimumCircularBounds = 24 * Math.SQRT2;
      if (bounds.width < minimumCircularBounds || bounds.height < minimumCircularBounds) {
        throw new Error(`Rendered lane hit core is too small: ${bounds.width}×${bounds.height}.`);
      }
    });
    await userEvent.click(enabled);
    enabled.focus();
    const enabledFocusVisible = enabled.matches(':focus-visible');
    await waitFor(() => {
      const hasFocusRing = Boolean(enabled.querySelector('[data-lane-focus-ring]'));
      if (canvasElement.ownerDocument.activeElement !== enabled || hasFocusRing !== enabledFocusVisible) {
        throw new Error('Lane must receive DOM focus and mirror the native :focus-visible state.');
      }
      if (enabledFocusVisible && canvasElement.ownerDocument.defaultView.getComputedStyle(enabled).outlineStyle !== 'none') {
        throw new Error('Lane must use one shape-managed focus ring without the global rectangular outline.');
      }
    });
    if (enabledFocusVisible) assertLaneFocusTextClearance(enabled, 'Diagonal selectable lane');
    const labelLayer = enabled.querySelector('[data-lane-label]');
    const primaryLabel = enabled.querySelector('[data-lane-primary-label]');
    const metadata = enabled.querySelector('[data-lane-metadata]');
    const normalX = Number(labelLayer?.getAttribute('data-lane-label-normal-x'));
    const normalY = Number(labelLayer?.getAttribute('data-lane-label-normal-y'));
    const labelProjection = Number(primaryLabel?.getAttribute('x')) * normalX
      + Number(primaryLabel?.getAttribute('y')) * normalY;
    const metadataProjection = Number(metadata?.getAttribute('x')) * normalX
      + Number(metadata?.getAttribute('y')) * normalY;
    if (Math.abs(Math.hypot(normalX, normalY) - 1) > 0.001 || labelProjection < 21.5 || metadataProjection > -27.5) {
      throw new Error(`Diagonal lane labels lost their screen-normal placement: normal ${normalX},${normalY}; projections ${labelProjection}/${metadataProjection}.`);
    }
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    if (!output().includes('activation 3회') || enabled.getAttribute('data-selected') !== 'true') {
      throw new Error(`Pointer/keyboard activation or selected state failed: ${output()}`);
    }
    if (!enabled.querySelector('[data-lane-focus-ring]')) {
      throw new Error('Lane keyboard input must restore its shape-managed focus ring after pointer modality.');
    }
    assertSharedFocusIndicator(enabled.querySelector('[data-lane-focus-ring]'), 'Lane');
    if (canvasElement.ownerDocument.defaultView.getComputedStyle(enabled).outlineStyle !== 'none') {
      throw new Error('Lane keyboard modality must not restore the global rectangular outline.');
    }
    assertLaneFocusTextClearance(enabled, 'Keyboard-modality lane');
    enabled.dispatchEvent(new view.KeyboardEvent('keydown', { key: 'Enter', repeat: true, bubbles: true, cancelable: true }));
    enabled.dispatchEvent(new view.KeyboardEvent('keydown', { key: ' ', repeat: true, bubbles: true, cancelable: true }));
    await nextRender();
    if (!output().includes('activation 3회')) throw new Error('Repeated lane keydown invoked onActivate.');
    if (disabled.getAttribute('tabindex') !== '-1' || disabled.getAttribute('aria-disabled') !== 'true') {
      throw new Error('Disabled lane must expose aria-disabled and leave the Tab order.');
    }
    if (Number(disabled.style.opacity) !== 0.45) {
      throw new Error(`Disabled lane opacity must align with 0.45; received ${disabled.style.opacity}.`);
    }
    disabled.dispatchEvent(new view.MouseEvent('click', { bubbles: true, cancelable: true }));
    disabled.dispatchEvent(new view.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await nextRender();
    if (!output().includes('activation 3회')) throw new Error('Disabled lane invoked onActivate.');
  },
};

export const LaneNarrow320 = {
  name: '반응형 · 320px 좁은 폭',
  tags: ['!dev', 'regression'],
  parameters: storyDescription(
    '320px 폭에서 지도 viewport가 페이지 폭을 밀어내지 않는지, label과 상태 glyph가 clip되더라도 레인의 accessible name과 semantic mirror가 유지되는지 확인합니다.',
  ),
  render: () => (
    <div data-testid="lane-narrow" style={{ width: 320, maxWidth: '100%', minWidth: 0, overflow: 'hidden' }}>
      <StoryPage
        title="좁은 화면에서는 viewport를 보존하고 상세 탐색은 목록으로 이어집니다"
        description="지도 안 label을 억지로 여러 줄 card로 만들지 않습니다. 보이는 선과 glyph는 유지하고 동일 레인 identity를 아래 목록에서 다시 선택할 수 있게 구성합니다."
      >
        <LaneMap label="320px 레인 지도" aspectRatio="552 / 282">
          <LaneOverlay lane={BASE_LANE} availability="closed" conflict onActivate={() => {}} />
        </LaneMap>
        <Button type="button" variant="secondary" full>A → B 레인 상세 열기 · 폐쇄 · 충돌</Button>
      </StoryPage>
    </div>
  ),
  play: async ({ canvasElement }) => {
    assertPathSystemVisualContract(canvasElement, 'Lane narrow viewport');
    const narrow = canvasElement.querySelector('[data-testid="lane-narrow"]');
    if (!narrow || narrow.scrollWidth > narrow.clientWidth) {
      throw new Error(`Lane narrow story overflowed: ${narrow?.scrollWidth}/${narrow?.clientWidth}`);
    }
    const lane = narrow.querySelector('[data-lk-lane-overlay]');
    if (!lane?.getAttribute('aria-label')?.includes('폐쇄') || !lane.getAttribute('aria-label')?.includes('충돌')) {
      throw new Error('Narrow visual clipping must not remove lane state from the accessible name.');
    }
    const svg = narrow.querySelector('svg[data-lane-render-scale]');
    const hitCore = lane.querySelector('[data-lane-actual-hit-core]');
    if (!svg || !hitCore) throw new Error('Narrow lane viewport scale or actual hit core is missing.');
    await waitFor(() => {
      const expectedScale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
      const suppliedScale = Number(svg.getAttribute('data-lane-render-scale'));
      if (Math.abs(expectedScale - suppliedScale) > 0.01) {
        throw new Error(`Lane viewportScale did not include CSS/viewBox scaling: ${suppliedScale} vs ${expectedScale}.`);
      }
      const bounds = hitCore.getBoundingClientRect();
      const minimumCircularBounds = 24 * Math.SQRT2;
      if (bounds.width < minimumCircularBounds || bounds.height < minimumCircularBounds) {
        throw new Error(`Narrow lane actual hit core is too small: ${bounds.width}×${bounds.height}.`);
      }
    });
    lane.focus();
    await waitFor(() => {
      if (!lane.querySelector('[data-lane-focus-ring]')) throw new Error('Narrow lane focus path is missing.');
      assertLaneFocusTextClearance(lane, '320px lane');
      // Closed + conflict preserve the Lane role dash and use danger tone.
      if (lane.querySelector('[data-lane-path]')?.getAttribute('stroke-dasharray') !== '4 6') {
        throw new Error('Narrow closed Lane must preserve the 4 6 topology dash.');
      }
      if (!lane.querySelector('[data-lane-path]')?.getAttribute('stroke')?.includes('--viewer-danger')) {
        throw new Error('Narrow closed/conflict Lane must retain its danger tone.');
      }
      if (lane.querySelector('[data-lane-conflict-pattern]')) {
        throw new Error('Narrow Lane must not stack a second conflict pattern.');
      }
      if (lane.querySelector('[data-lane-state-glyph]')) {
        throw new Error('A closed/conflict lane must not paint point state badges.');
      }
      assertDirectionOmitted(lane, '320px lane');
    });
  },
};

export const LaneVisualParity = {
  ...LaneStatesAndConstraints,
  name: 'Lane overlay visual parity',
  tags: ['!dev', 'visual-parity'],
};
