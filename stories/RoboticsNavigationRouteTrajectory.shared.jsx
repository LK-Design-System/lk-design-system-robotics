import React from 'react';
import { Map2DCanvas } from '@lk-design-system/lds-product';
import {
  NAV_TRAJECTORY_SAMPLE,
} from '../src/components/robotics/_navigationVocabulary.js';
import {
  NavigationAnnotationLayer,
  adaptWorldRobotPoseToPose,
  adaptWorldRouteToRoute,
  adaptWorldTrajectoryToTrajectory,
  createNavigationMapTransform,
} from '../src/index.js';
// 반드시 컴포넌트와 같은 모듈 인스턴스(../src)에서 가져와야 한다. dist 경로로
// 가져오면 React 컨텍스트가 두 개가 되어 프로바이더가 조용히 무력화된다.
import { NavigationLabelPolicyProvider } from '../src/components/robotics/_navigationAnnotations.js';
import { NavigationMapStage } from './RoboticsNavigationStage.shared.jsx';

function createFixtureTransform(mapId, frameId) {
  return createNavigationMapTransform({
    mapId,
    frameId,
    mapVersion: 'fixture-map-v1',
    stamp: { sec: 1_720_000_000, nanosec: 0 },
    widthCells: 54,
    heightCells: 25,
    resolutionMPerCell: 1,
    origin: { xM: 0, yM: 0, yawRad: 0 },
  }, {
    svgUnitsPerMeter: 10,
    svgOrigin: { x: 0, y: 0 },
  });
}

export const ROUTE_TRANSFORM_L1 = createFixtureTransform('L1', 'warehouse_L1/map');
export const ROUTE_TRANSFORM_L2 = createFixtureTransform('L2', 'warehouse_L2/map');
export const PROJECTED_FRAME_L1 = ROUTE_TRANSFORM_L1.metadata;
export const PROJECTED_FRAME_L2 = ROUTE_TRANSFORM_L2.metadata;

export const ACTIVE_ROUTE = adaptWorldRouteToRoute({
  id: 'route-delivery-17',
  label: '배송 경로 17',
  status: 'active',
  segments: [
    {
      id: 'segment-l1-completed',
      mapId: 'L1',
      label: '입구 → 교차로',
      points: [{ x: 4.4, y: 5.4 }, { x: 13, y: 5.4 }, { x: 19, y: 9.6 }],
      laneIds: ['lane-entry', 'lane-corridor-a'],
      phase: 'completed',
      condition: 'normal',
    },
    {
      id: 'segment-l1-current',
      mapId: 'L1',
      label: '교차로 → Lift A',
      points: [{ x: 19, y: 9.6 }, { x: 28.4, y: 13.8 }, { x: 45.6, y: 13.8 }],
      laneIds: ['lane-corridor-b'],
      exitTransitionId: 'transition-lift-a',
      phase: 'current',
      condition: 'normal',
    },
    {
      id: 'segment-l2-upcoming',
      mapId: 'L2',
      label: 'Lift A → 목적지',
      points: [{ x: 7.2, y: 5.4 }, { x: 23, y: 5.4 }, { x: 32.8, y: 15.8 }, { x: 47, y: 15.8 }],
      laneIds: ['lane-l2-main'],
      entryTransitionId: 'transition-lift-a',
      phase: 'upcoming',
      condition: 'normal',
    },
  ],
  progress: { segmentId: 'segment-l1-current', fraction: 0.42 },
}, {
  transformsByMap: {
    L1: ROUTE_TRANSFORM_L1,
    L2: ROUTE_TRANSFORM_L2,
  },
});

export const ACTIVE_TRAJECTORY = adaptWorldTrajectoryToTrajectory({
  id: 'trajectory-robot-2-l1',
  label: 'Robot 2 예상 궤적',
  mapId: 'L1',
  status: 'active',
  samples: [
    { position: { x: 20.2, y: 10.1 }, timeMs: 0, headingRad: 0.42 },
    { position: { x: 23.4, y: 11.6 }, timeMs: 250, headingRad: 0.42 },
    { position: { x: 26.8, y: 13 }, timeMs: 500, headingRad: 0.3 },
    { position: { x: 29.4, y: 13.55 }, timeMs: 750, headingRad: 0.1 },
    { position: { x: 33.4, y: 13.55 }, timeMs: 1000, headingRad: 0 },
    { position: { x: 37.6, y: 13.52 }, timeMs: 1250, headingRad: 0 },
    { position: { x: 41.8, y: 13.48 }, timeMs: 1500, headingRad: -0.01 },
    { position: { x: 45.2, y: 13.5 }, timeMs: 1750, headingRad: 0 },
  ],
  currentSampleIndex: 1,
}, { transform: ROUTE_TRANSFORM_L1 });

export const ACTIVE_ROBOT_POSE = adaptWorldRobotPoseToPose({
  id: 'robot-2-pose',
  label: 'Robot 2',
  mapId: 'L1',
  position: { x: 24.8, y: 12.2 },
  headingRad: 0.4,
  state: 'moving',
}, { transform: ROUTE_TRANSFORM_L1 });

export const L2_TRAJECTORY = adaptWorldTrajectoryToTrajectory({
  id: 'trajectory-robot-2-l2',
  label: 'Robot 2 L2 예상 궤적',
  mapId: 'L2',
  status: 'planned',
  samples: [
    { position: { x: 14.2, y: 3.6 }, timeMs: 2400, headingRad: 0.06 },
    { position: { x: 21.6, y: 5.2 }, timeMs: 2800, headingRad: 0.28 },
    { position: { x: 28.6, y: 9.2 }, timeMs: 3200, headingRad: 0.62 },
    { position: { x: 35.4, y: 13.8 }, timeMs: 3600, headingRad: 0.32 },
    { position: { x: 45.8, y: 14.6 }, timeMs: 4000, headingRad: 0 },
  ],
}, { transform: ROUTE_TRANSFORM_L2 });

export function StoryPage({ title, description, children, maxWidth = 1040 }) {
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

export function PathMap({
  appearance = 'light',
  label,
  children,
  height = 270,
  svgHeight = 250,
  testId,
  eyebrow = 'ROUTE · L1',
  annotationDetailMode,
  // Opt-in ratio sizing. The default fixed `height` is only correct at one column
  // width: the SVG scales with the column, so a card in a multi-column grid ends
  // up either padded with dead space or overflowed. Pass `aspectRatio` (e.g.
  // '540 / 250') to let the card track the map instead. ViewerFrame still floors
  // the card at 200px, which the pinned lds-product build owns.
  //
  // The card also caps at the SVG footprint (540 + canvas padding): the SVG never
  // grows past 540px, so a wider card is just empty surface to the right of it.
  aspectRatio,
  // Spec fixtures declare label disclosure once at the map root instead of on
  // every overlay — forgetting a single per-overlay labelVisibility was the
  // recurring "comparison story with no labels" defect.
  labelPolicy,
  detailPolicy,
}) {
  const svgRef = React.useRef(null);
  const [cssViewBoxScale, setCssViewBoxScale] = React.useState(1);

  React.useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;
    const view = svg.ownerDocument.defaultView;
    const updateScale = () => {
      const width = svg.getBoundingClientRect().width;
      if (width <= 0) return;
      const nextScale = width / 540;
      setCssViewBoxScale((current) => Math.abs(current - nextScale) > 0.001 ? nextScale : current);
    };
    updateScale();
    const observer = view?.ResizeObserver ? new view.ResizeObserver(updateScale) : null;
    observer?.observe(svg);
    view?.addEventListener('resize', updateScale);
    return () => {
      observer?.disconnect();
      view?.removeEventListener('resize', updateScale);
    };
  }, []);

  const stage = (
    <NavigationMapStage width={540} height={svgHeight} eyebrow={eyebrow} scaleBar={{ px: 100, label: '5 m' }}>
      <NavigationLabelPolicyProvider labelVisibility={labelPolicy} detailVisibility={detailPolicy}>
        {typeof children === 'function' ? children(cssViewBoxScale) : children}
      </NavigationLabelPolicyProvider>
    </NavigationMapStage>
  );

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
        ? { width: '100%', maxWidth: 572, minWidth: 0, height: 'auto', aspectRatio }
        : { width: '100%', maxWidth: 572, minWidth: 0, height }}
    >
      <svg
        ref={svgRef}
        width="540"
        height={svgHeight}
        viewBox={`0 0 540 ${svgHeight}`}
        data-css-viewbox-scale={cssViewBoxScale.toFixed(4)}
        role="group"
        aria-label={`${label}의 route와 trajectory 계층`}
        style={{ display: 'block', width: 'min(540px, calc(100cqw - 32px))', height: 'auto' }}
      >
        {annotationDetailMode
          ? <NavigationAnnotationLayer detailMode={annotationDetailMode}>{stage}</NavigationAnnotationLayer>
          : stage}
      </svg>
    </Map2DCanvas>
  );
}

// Route/Trajectory lifecycle status and segment condition stay in labels,
// accessible names, and detail surfaces rather than line glyph badges. Data
// quality applies to the complete stroke; these retired selectors remain only
// as a regression guard.
export const NAVIGATION_STATE_BADGE_SELECTOR = [
  '[data-route-marker-badge]',
  '[data-trajectory-marker-badge]',
].join(',');

export function screenPoint(element, x = 0, y = 0) {
  const matrix = element.getScreenCTM?.();
  if (!matrix) return undefined;
  return {
    x: matrix.a * x + matrix.c * y + matrix.e,
    y: matrix.b * x + matrix.d * y + matrix.f,
  };
}

export function paintedGeometryRect(container) {
  const view = container.ownerDocument.defaultView;
  const shapes = container.matches?.('path, circle, line, polyline, polygon, rect, ellipse')
    ? [container]
    : Array.from(container.querySelectorAll('path, circle, line, polyline, polygon, rect, ellipse'));
  const rects = shapes.map((shape) => {
    const rect = shape.getBoundingClientRect();
    const computed = view.getComputedStyle(shape);
    const strokeWidth = computed.stroke === 'none' ? 0 : Number.parseFloat(computed.strokeWidth) || 0;
    const matrix = shape.getScreenCTM?.();
    const scale = matrix
      ? Math.max(Math.hypot(matrix.a, matrix.b), Math.hypot(matrix.c, matrix.d))
      : 1;
    const nonScaling = shape.getAttribute('vector-effect') === 'non-scaling-stroke'
      || computed.vectorEffect === 'non-scaling-stroke';
    const strokeInset = strokeWidth * (nonScaling ? 1 : scale) / 2;
    return {
      left: rect.left - strokeInset,
      right: rect.right + strokeInset,
      top: rect.top - strokeInset,
      bottom: rect.bottom + strokeInset,
    };
  }).filter((rect) => rect.right > rect.left || rect.bottom > rect.top);
  if (rects.length === 0) return undefined;
  return {
    left: Math.min(...rects.map((rect) => rect.left)),
    right: Math.max(...rects.map((rect) => rect.right)),
    top: Math.min(...rects.map((rect) => rect.top)),
    bottom: Math.max(...rects.map((rect) => rect.bottom)),
  };
}

export function pathAreaCentroid(path) {
  const coordinates = (path.getAttribute('d') ?? '')
    .match(/[-+]?(?:\d*\.?\d+)(?:e[-+]?\d+)?/gi)
    ?.map(Number) ?? [];
  if (coordinates.length < 6 || coordinates.length % 2 !== 0) return undefined;
  const points = [];
  for (let index = 0; index < coordinates.length; index += 2) {
    points.push({ x: coordinates[index], y: coordinates[index + 1] });
  }
  let twiceArea = 0;
  let weightedX = 0;
  let weightedY = 0;
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length];
    const cross = point.x * next.y - next.x * point.y;
    twiceArea += cross;
    weightedX += (point.x + next.x) * cross;
    weightedY += (point.y + next.y) * cross;
  });
  if (Math.abs(twiceArea) < 0.000001) return undefined;
  return {
    x: weightedX / (3 * twiceArea),
    y: weightedY / (3 * twiceArea),
  };
}

export function expectedNavigationStateKind(group) {
  return group.getAttribute('data-route-overlay-state')
    ?? group.getAttribute('data-trajectory-overlay-state');
}

export function assertNavigationStateGlyphGeometry(root, label) {
  // Verifies the optical geometry of every state badge that IS present. Whether
  // a story renders any badge at all is asserted per-story (explicit invalid /
  // stale existence checks), so a badge-less overlay (a plain active route/
  // trajectory) is a valid no-op here rather than a failure.
  const groups = Array.from(root.querySelectorAll(NAVIGATION_STATE_BADGE_SELECTOR));
  groups.forEach((group) => {
    const glyph = group.querySelector(':scope > [data-navigation-state-glyph]');
    const circle = group.querySelector(':scope > [data-navigation-marker-circle]');
    const stateTexts = Array.from(group.querySelectorAll(':scope > text'));
    const expectedKind = expectedNavigationStateKind(group);
    if (!glyph || !circle || stateTexts.length > 0 || glyph.getAttribute('data-navigation-state-glyph') !== expectedKind) {
      throw new Error(`${label} state badge did not preserve its ${expectedKind} SVG glyph mapping.`);
    }
    if (Number(glyph.getAttribute('data-navigation-state-glyph-size')) < 10) {
      throw new Error(`${label} ${expectedKind} glyph rendered below the 10px geometry floor.`);
    }

    const badgeCenter = screenPoint(circle, Number(circle.getAttribute('cx')) || 0, Number(circle.getAttribute('cy')) || 0);
    const glyphAnchor = screenPoint(glyph);
    const painted = paintedGeometryRect(glyph);
    const badgeRect = circle.getBoundingClientRect();
    if (!badgeCenter || !glyphAnchor || !painted || badgeRect.width <= 0 || badgeRect.height <= 0) {
      throw new Error(`${label} ${expectedKind} glyph geometry could not be measured.`);
    }
    const paintedCenter = {
      x: (painted.left + painted.right) / 2,
      y: (painted.top + painted.bottom) / 2,
    };
    const anchorDelta = Math.max(
      Math.abs(glyphAnchor.x - badgeCenter.x),
      Math.abs(glyphAnchor.y - badgeCenter.y),
    );
    const paintedDelta = Math.max(
      Math.abs(paintedCenter.x - badgeCenter.x),
      Math.abs(paintedCenter.y - badgeCenter.y),
    );
    const margin = Math.min(
      painted.left - badgeRect.left,
      badgeRect.right - painted.right,
      painted.top - badgeRect.top,
      badgeRect.bottom - painted.bottom,
    );
    if (anchorDelta > 0.25 || paintedDelta > 1.05 || margin < 0.9) {
      throw new Error(`${label} ${expectedKind} optical geometry failed: anchor ${anchorDelta}, bbox ${paintedDelta}, margin ${margin}.`);
    }
  });
}

export function assertNavigationVectorGeometry(root, label) {
  const vectors = Array.from(root.querySelectorAll('[data-navigation-vector-glyph]'));
  if (vectors.length === 0) throw new Error(`${label} has no navigation vector glyph evidence.`);
  vectors.forEach((vector) => {
    const circle = vector.parentElement?.querySelector(':scope > [data-navigation-marker-circle]');
    const badgeCenter = circle
      ? screenPoint(circle, Number(circle.getAttribute('cx')) || 0, Number(circle.getAttribute('cy')) || 0)
      : undefined;
    const anchor = screenPoint(vector);
    const localCentroid = pathAreaCentroid(vector);
    const centroid = localCentroid ? screenPoint(vector, localCentroid.x, localCentroid.y) : undefined;
    const painted = paintedGeometryRect(vector);
    const badgeRect = circle?.getBoundingClientRect();
    if (!anchor || !centroid || !painted || (circle && (!badgeCenter || !badgeRect))) {
      throw new Error(`${label} vector glyph geometry could not be measured.`);
    }
    const centroidDelta = Math.max(
      Math.abs(centroid.x - anchor.x),
      Math.abs(centroid.y - anchor.y),
    );
    const badgeAnchorDelta = badgeCenter
      ? Math.max(Math.abs(anchor.x - badgeCenter.x), Math.abs(anchor.y - badgeCenter.y))
      : 0;
    const margin = badgeRect
      ? Math.min(
        painted.left - badgeRect.left,
        badgeRect.right - painted.right,
        painted.top - badgeRect.top,
        badgeRect.bottom - painted.bottom,
      )
      : Number.POSITIVE_INFINITY;
    if (centroidDelta > 0.25 || badgeAnchorDelta > 0.25 || margin < 0.9) {
      throw new Error(`${label} ${vector.getAttribute('data-navigation-vector-glyph')} geometry failed: centroid ${centroidDelta}, anchor ${badgeAnchorDelta}, margin ${margin}.`);
    }
  });
}

export function assertTrajectoryTemporalEncoding(
  root,
  label,
  { showTimeCursor = false, showPlaybackProgress = false } = {},
) {
  if (root.getAttribute('data-navigation-line-role') !== 'trajectory'
    || root.getAttribute('data-line-encoding') !== 'temporal-samples') {
    throw new Error(`${label} must expose the trajectory temporal-sample line role.`);
  }
  const samples = [...root.querySelectorAll('[data-trajectory-sample]')];
  if (samples.length < 2 || samples.length > NAV_TRAJECTORY_SAMPLE.maxVisible) {
    throw new Error(`${label} must render a capped sequence of temporal sample dots: ${samples.length}.`);
  }
  const cursor = root.querySelector('[data-trajectory-time-cursor]');
  const outer = cursor?.querySelector('[data-trajectory-cursor-surface]');
  const core = cursor?.querySelector('[data-trajectory-cursor-core]');
  if (root.querySelector('[data-navigation-progress-head="trajectory"], [data-trajectory-direction]')) {
    throw new Error(`${label} must not reuse Route arrowheads or direction chevrons.`);
  }
  if (!showTimeCursor) {
    const progress = root.querySelector('[data-trajectory-progress-past]');
    const progressCasing = root.querySelector('[data-trajectory-progress-casing]');
    if (cursor || (!showPlaybackProgress && (progress || progressCasing))) {
      throw new Error(`${label} must leave playback position cues hidden in an operational map.`);
    }
    if (showPlaybackProgress && (!progress || !progressCasing)) {
      throw new Error(`${label} must render elapsed playback geometry without a map cursor.`);
    }
    if (root.getAttribute('data-time-cursor-visible') !== 'false') {
      throw new Error(`${label} must expose that its playback cursor is disabled.`);
    }
    return;
  }
  if (!cursor || !outer || !core) {
    throw new Error(`${label} needs a circular playback cursor when explicitly requested.`);
  }
  if (Number(outer.getAttribute('r')) !== NAV_TRAJECTORY_SAMPLE.cursorOuterRadius
    || Number(core.getAttribute('r')) !== NAV_TRAJECTORY_SAMPLE.cursorInnerRadius) {
    throw new Error(`${label} playback cursor lost its fixed geometry.`);
  }
  const futurePath = root.querySelector('[data-trajectory-path]');
  const futureOpacity = Number(futurePath?.getAttribute('opacity'));
  if (!(futureOpacity > 0 && futureOpacity < 1)) {
    throw new Error(`${label} needs a recessed future line behind the elapsed samples.`);
  }
}

export function assertPathSystemVisualContract(root, label, { allowTrajectoryPlayback = false } = {}) {
  if (root.querySelector('[data-vector-glyph="direction"], [data-lane-direction], [data-trajectory-direction]')) {
    throw new Error(`${label} must not paint generic direction arrows on Path System lines.`);
  }

  root.querySelectorAll('[data-lk-lane-overlay]').forEach((lane) => {
    const path = lane.querySelector('[data-lane-path]');
    if (path?.getAttribute('stroke-dasharray') !== '4 6') {
      throw new Error(`${label} Lane must keep the stable 4 6 topology dash.`);
    }
  });

  root.querySelectorAll('[data-lk-route-overlay]').forEach((route) => {
    const paths = [...route.querySelectorAll('[data-route-path]')];
    const quality = route.getAttribute('data-route-quality');
const expectedTone = quality === 'invalid'
      ? 'status-negative-foreground'
      : quality === 'stale'
        ? 'status-cautionary-foreground'
        : 'data-viz-series-5';
    const casingLayer = route.querySelector(':scope > [data-route-casing-layer]');
    const casings = [...(casingLayer?.querySelectorAll('[data-route-casing]') ?? [])];
    if (
      paths.length === 0
      || !casingLayer
      || route.firstElementChild !== casingLayer
      || casings.length !== paths.length
      || casings.some((casing) => casing.getAttribute('stroke-dasharray') !== '4 6')
      || paths.some((path) => (
        path.getAttribute('stroke-dasharray') !== '4 6'
        || path.getAttribute('opacity') !== '1'
        || !path.getAttribute('stroke')?.includes(expectedTone)
        || path.getAttribute('stroke-width') !== '1.5'
      ))
    ) {
      throw new Error(`${label} Route must reuse the Lane 4 6 dash and 1.5px width with the correct identity or quality tone.`);
    }
    if (route.querySelector('[data-route-progress-marker], [data-route-progress-label], [data-navigation-progress-head="route"], [data-route-progress-past]')) {
      throw new Error(`${label} Route progress must remain data/detail-only.`);
    }
  });

  root.querySelectorAll('[data-lk-trajectory-overlay]').forEach((trajectory) => {
    const cursor = trajectory.querySelector('[data-trajectory-time-cursor]');
    const path = trajectory.querySelector('[data-trajectory-path]');
    const quality = trajectory.getAttribute('data-trajectory-quality');
const expectedTone = quality === 'invalid'
      ? 'status-negative-foreground'
      : quality === 'stale'
        ? 'status-cautionary-foreground'
        : '--viewer-accent';
    if (!allowTrajectoryPlayback && cursor) {
      throw new Error(`${label} operational Trajectory must not paint a playback cursor.`);
    }
    if (
      !path
      || path.hasAttribute('stroke-dasharray')
      || (!trajectory.matches('[data-selected="true"]') && path.getAttribute('stroke-width') !== '2.25')
      || !path.getAttribute('stroke')?.includes(expectedTone)
      || trajectory.querySelectorAll('[data-trajectory-sample]').length < 2
    ) {
      throw new Error(`${label} Trajectory must remain one solid 2.25px identity line punctuated by sample dots.`);
    }
  });
}

export function nextRender() {
  return new Promise((resolve) => setTimeout(resolve, 20));
}
