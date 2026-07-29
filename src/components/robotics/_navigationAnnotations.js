import React from 'react';

/**
 * Shared registry contract between `NavigationAnnotationLayer` and the six
 * navigation overlay fragments. Without a provider the context stays `null`
 * and every participant renders exactly its standalone markup — no transform,
 * no visibility change, no coordination attributes beyond the inert wrapper.
 */
export const NavigationAnnotationContext = React.createContext(null);
export const NavigationAnnotationDetailContext = React.createContext(null);
export const NavigationLabelPolicyContext = React.createContext(Object.freeze({
  labelVisibility: 'interaction',
  detailVisibility: 'selected',
}));

const LABEL_VISIBILITY_MODES = new Set(['always', 'interaction', 'priority', 'hidden']);
const DETAIL_VISIBILITY_MODES = new Set(['always', 'selected', 'hidden']);

export function resolveNavigationLabelDisclosure({
  policy,
  showLabel,
  labelVisibility,
  detailVisibility,
  hovered = false,
  focused = false,
  selected = false,
  priority = false,
  hasDetails = false,
}) {
  const inheritedLabelVisibility = policy?.labelVisibility ?? 'interaction';
  const inheritedDetailVisibility = policy?.detailVisibility ?? 'selected';
  const requestedLabelVisibility = labelVisibility
    ?? (showLabel === true ? 'always' : showLabel === false ? 'hidden' : inheritedLabelVisibility);
  const requestedDetailVisibility = detailVisibility
    ?? (showLabel === true ? 'always' : inheritedDetailVisibility);
  const resolvedLabelVisibility = LABEL_VISIBILITY_MODES.has(requestedLabelVisibility)
    ? requestedLabelVisibility
    : 'interaction';
  const resolvedDetailVisibility = DETAIL_VISIBILITY_MODES.has(requestedDetailVisibility)
    ? requestedDetailVisibility
    : 'selected';
  const interactionRevealed = hovered || focused || selected;
  const labelVisible = resolvedLabelVisibility === 'always'
    || (resolvedLabelVisibility === 'interaction' && interactionRevealed)
    || (resolvedLabelVisibility === 'priority' && (interactionRevealed || priority));
  const detailsVisible = labelVisible
    && hasDetails
    && resolvedDetailVisibility !== 'hidden'
    && (
      resolvedDetailVisibility === 'always'
      || selected
      || priority
    );

  return {
    labelVisibility: resolvedLabelVisibility,
    detailVisibility: resolvedDetailVisibility,
    labelVisible,
    detailsVisible,
  };
}

export function useNavigationLabelPolicy() {
  return React.useContext(NavigationLabelPolicyContext);
}

export function useNavigationLabelDisclosure({
  onPointerEnter,
  onPointerLeave,
  ...options
}) {
  const policy = useNavigationLabelPolicy();
  const [hovered, setHovered] = React.useState(false);
  const disclosure = resolveNavigationLabelDisclosure({
    ...options,
    hovered,
    policy,
  });

  return {
    ...disclosure,
    hovered,
    onPointerEnter(event) {
      if (event.pointerType !== 'touch') setHovered(true);
      onPointerEnter?.(event);
    },
    onPointerLeave(event) {
      setHovered(false);
      onPointerLeave?.(event);
    },
  };
}

export const useIsomorphicLayoutEffect = typeof window === 'undefined'
  ? React.useEffect
  : React.useLayoutEffect;

const INERT_RESOLUTION = Object.freeze({
  tx: 0,
  ty: 0,
  dxPx: 0,
  dyPx: 0,
  nudgeDxPx: 0,
  nudgeDyPx: 0,
  placement: 'natural',
  hidden: false,
});
const noopSubscribe = () => () => {};

/**
 * Strict state-first priority scale. Danger/error outranks keyboard focus,
 * focus outranks selection, and selection outranks ordinary map context.
 * `importance` orders labels inside the same state tier.
 */
export function annotationPriority({
  selected,
  focused,
  alarm,
  emphasized,
  importance,
} = {}) {
  const statePriority = alarm ? 5000 : focused ? 4000 : selected ? 3000 : 0;
  const contextPriority = Number.isFinite(importance) ? importance : emphasized ? 500 : 0;
  return statePriority + contextPriority;
}

export const ANNOTATION_IMPORTANCE = Object.freeze({
  background: 0,
  context: 300,
  'active-trajectory': 600,
  'current-segment': 700,
  'robot-pose': 800,
});

export const KIND_WEIGHT = {
  'region-label': 0,
  'lane-label': 1,
  'route-segment-label': 2,
  'trajectory-label': 3,
  'waypoint-label': 4,
  'facility-label': 5,
  'hazard-label': 5,
  'robot-pose-label': 6,
};

const DETAIL_MODE_WEIGHT = Object.freeze({
  overview: 0,
  standard: 1,
  detail: 2,
});
const FORCED_VISIBILITY_PRIORITY = 3000;
const EPSILON = 0.5;

function normalizedDetailMode(value, fallback = 'standard') {
  return Object.hasOwn(DETAIL_MODE_WEIGHT, value) ? value : fallback;
}

function placementCandidates(label) {
  const { kind } = label.meta;
  const { width, height } = label.rect;

  if (kind === 'route-segment-label') {
    const alongPath = Math.max(32, Math.min(80, width * 0.6));
    return [
      { name: 'above', x: 0, y: 0 },
      { name: 'below', x: 0, y: height + 16 },
      { name: 'above-leading', x: -alongPath, y: 0 },
      { name: 'above-trailing', x: alongPath, y: 0 },
      { name: 'below-leading', x: -alongPath, y: height + 16 },
      { name: 'below-trailing', x: alongPath, y: height + 16 },
    ];
  }
  if (kind === 'trajectory-label') {
    const alongPath = Math.max(32, Math.min(80, width * 0.6));
    return [
      { name: 'above', x: 0, y: 0 },
      { name: 'below', x: 0, y: height + 16 },
      { name: 'above-leading', x: -alongPath, y: 0 },
      { name: 'above-trailing', x: alongPath, y: 0 },
      { name: 'below-leading', x: -alongPath, y: height + 16 },
      { name: 'below-trailing', x: alongPath, y: height + 16 },
    ];
  }
  if (kind === 'waypoint-label'
    || kind === 'facility-label'
    || kind === 'hazard-label'
    || kind === 'robot-pose-label') {
    const horizontalSwap = width + 40;
    const lower = height + 16;
    return [
      { name: 'top-right', x: 0, y: 0 },
      { name: 'top-left', x: -horizontalSwap, y: 0 },
      { name: 'bottom-right', x: 0, y: lower },
      { name: 'bottom-left', x: -horizontalSwap, y: lower },
    ];
  }
  return [{ name: 'center', x: 0, y: 0 }];
}

function nudgeCandidates(direction, maxNudge, step) {
  const vectors = [{ x: 0, y: 0 }];
  const safeStep = Math.max(1, step);
  for (let distance = safeStep; distance <= maxNudge + EPSILON; distance += safeStep) {
    if (direction === 'up') {
      vectors.push({ x: 0, y: -distance });
      continue;
    }
    if (direction === 'down') {
      vectors.push({ x: 0, y: distance });
      continue;
    }
    vectors.push(
      { x: 0, y: -distance },
      { x: 0, y: distance },
      { x: distance, y: 0 },
      { x: -distance, y: 0 },
      { x: distance, y: -distance },
      { x: -distance, y: -distance },
      { x: distance, y: distance },
      { x: -distance, y: distance },
    );
  }
  return vectors;
}

function shiftedRect(rect, x, y) {
  return {
    left: rect.left + x,
    top: rect.top + y,
    right: rect.right + x,
    bottom: rect.bottom + y,
    width: rect.width,
    height: rect.height,
  };
}

function rectsConflict(a, b, gap) {
  return a.left < b.right + gap - EPSILON
    && a.right > b.left - gap + EPSILON
    && a.top < b.bottom + gap - EPSILON
    && a.bottom > b.top - gap + EPSILON;
}

/**
 * The rectangle labels must stay inside.
 *
 * Defaults to the owning `<svg>`, but a host that draws its own framed map
 * panel inside that SVG can mark the panel with `data-navigation-label-boundary`
 * and get labels negotiated against the panel instead. Without it a label is
 * "inside the SVG" while visually sitting in the margin outside the drawn map —
 * the panel edge is what a reader perceives as the map's edge, not the SVG box.
 */
function labelBoundaryRect(host) {
  const svg = host?.ownerSVGElement;
  if (!svg) return undefined;
  const panel = svg.querySelector?.('[data-navigation-label-boundary]');
  return (panel ?? svg).getBoundingClientRect?.();
}

function rectInsideBoundary(rect, boundary, gap) {
  if (!boundary) return true;
  const inset = gap + 8;
  return rect.left >= boundary.left + inset - EPSILON
    && rect.right <= boundary.right - inset + EPSILON
    && rect.top >= boundary.top + inset - EPSILON
    && rect.bottom <= boundary.bottom - inset + EPSILON;
}

/**
 * Pure, deterministic 2D label negotiation in CSS pixels. Labels are
 * placed greedily by (priority desc, kind weight desc, id asc); obstacles are
 * immovable. Each kind tries conventional anchor placements before applying a
 * bounded leaderless nudge. When every candidate collides, the label is
 * suppressed; accessible identity remains the caller's concern.
 */
export function solveAnnotationLayout(labels, obstacleRects, options = {}) {
  const gap = Number.isFinite(options.labelGapPx) ? Math.max(0, options.labelGapPx) : 8;
  const maxNudge = Number.isFinite(options.maxLabelDisplacementPx)
    ? Math.max(0, options.maxLabelDisplacementPx)
    : 24;
  const detailMode = normalizedDetailMode(options.detailMode);
  const order = [...labels].sort((a, b) => (
    (b.meta.priority - a.meta.priority)
    || (b.meta.weight - a.meta.weight)
    || String(a.meta.id).localeCompare(String(b.meta.id))
  ));
  const placed = obstacleRects.map((rect) => ({
    left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom,
  }));
  const out = new Map();

  for (const label of order) {
    const requiredDetail = normalizedDetailMode(label.meta.detailLevel);
    const filteredByDensity = DETAIL_MODE_WEIGHT[requiredDetail] > DETAIL_MODE_WEIGHT[detailMode]
      && label.meta.priority < FORCED_VISIBILITY_PRIORITY;
    if (filteredByDensity) {
      out.set(label.key, {
        dxPx: 0,
        dyPx: 0,
        nudgeDxPx: 0,
        nudgeDyPx: 0,
        placement: 'natural',
        hidden: true,
        hiddenReason: 'density',
      });
      continue;
    }

    const placements = placementCandidates(label);
    const nudges = nudgeCandidates(label.meta.nudgeDirection ?? 'any', maxNudge, gap || 8);
    let chosen;
    for (const placement of placements) {
      for (const nudge of nudges) {
        const dxPx = placement.x + nudge.x;
        const dyPx = placement.y + nudge.y;
        const candidateRect = shiftedRect(label.rect, dxPx, dyPx);
        if (
          rectInsideBoundary(candidateRect, options.boundaryRect, gap)
          && placed.every((blocker) => !rectsConflict(candidateRect, blocker, gap))
        ) {
          chosen = {
            dxPx,
            dyPx,
            nudgeDxPx: nudge.x,
            nudgeDyPx: nudge.y,
            placement: placement.name,
            hidden: false,
          };
          placed.push(candidateRect);
          break;
        }
      }
      if (chosen) break;
    }

    if (!chosen && options.boundaryRect) {
      // 후보가 전부 실패하는 흔한 이유는 다른 라벨과의 충돌이 아니라 "경계 밖"이다.
      // 지도 가장자리 마커는 좌우 어느 쪽으로도 라벨이 온전히 들어갈 자리가 없을
      // 뿐인데, 그때 숨기면 읽을 수 있었을 이름이 사라지고 그냥 두면 그려진 지도
      // 밖으로 나간다. 최소 이동으로 경계 안에 밀어넣고, 그렇게 옮긴 자리가 다른
      // 라벨과 부딪힐 때만 비로소 숨긴다 — 억제는 충돌에만 쓴다.
      const inset = gap + 8;
      const natural = shiftedRect(label.rect, 0, 0);
      const dxPx = Math.min(0, options.boundaryRect.right - inset - natural.right)
        + Math.max(0, options.boundaryRect.left + inset - natural.left);
      const dyPx = Math.min(0, options.boundaryRect.bottom - inset - natural.bottom)
        + Math.max(0, options.boundaryRect.top + inset - natural.top);
      // 경계 안으로 민 자리가 곧바로 비어 있으리란 보장은 없다. `placed`는 이미
      // 배치된 라벨뿐 아니라 스케일바·맵 헤더 같은 obstacle로 시작하므로, 최소
      // 이동만 하면 그 위에 앉기 쉽다. 그래서 클램프 지점을 기준으로 기존 nudge
      // 격자를 한 번 더 돌려 경계 안에서 빈자리를 찾는다. 그래도 없으면 그때는
      // 진짜 자리가 없는 것이라 억제한다.
      for (const nudge of nudges) {
        const nx = dxPx + nudge.x;
        const ny = dyPx + nudge.y;
        const candidateRect = shiftedRect(label.rect, nx, ny);
        if (
          rectInsideBoundary(candidateRect, options.boundaryRect, gap)
          && placed.every((blocker) => !rectsConflict(candidateRect, blocker, gap))
        ) {
          chosen = {
            dxPx: nx,
            dyPx: ny,
            nudgeDxPx: nudge.x,
            nudgeDyPx: nudge.y,
            placement: 'clamped',
            hidden: false,
          };
          placed.push(candidateRect);
          break;
        }
      }
    }

    if (!chosen) {
      out.set(label.key, {
        dxPx: 0,
        dyPx: 0,
        nudgeDxPx: 0,
        nudgeDyPx: 0,
        placement: 'natural',
        hidden: true,
        hiddenReason: 'collision',
      });
      continue;
    }
    out.set(label.key, chosen);
  }
  return out;
}

function resolutionEquals(a, b) {
  return a.hidden === b.hidden
    && a.hiddenReason === b.hiddenReason
    && a.placement === b.placement
    && Math.abs(a.dxPx - b.dxPx) <= EPSILON
    && Math.abs(a.dyPx - b.dyPx) <= EPSILON
    && Math.abs(a.nudgeDxPx - b.nudgeDxPx) <= EPSILON
    && Math.abs(a.nudgeDyPx - b.nudgeDyPx) <= EPSILON;
}

/**
 * One store per `NavigationAnnotationLayer` instance. Measurement uses real
 * DOM rects and `getScreenCTM()` so coordination stays correct even when a
 * consumer threads a wrong or stale `viewportScale` (a real situation in
 * existing fixtures). Natural (undisplaced) geometry is reconstructed by
 * mapping each label's currently applied local translate through the CTM's
 * linear part — translation never changes that linear part, so the
 * reconstruction is exact and the measure → solve cycle is idempotent.
 */
export function createAnnotationStore() {
  const labels = new Map();
  const obstacles = new Map();
  const listeners = new Set();
  let published = new Map();
  let options = {
    labelGapPx: 8,
    maxLabelDisplacementPx: 24,
    detailMode: 'standard',
    host: null,
  };
  let frame = 0;

  const emit = () => { listeners.forEach((listener) => listener()); };

  const updateHostAttributes = () => {
    const host = options.host;
    if (!host) return;
    let displaced = 0;
    let suppressed = 0;
    published.forEach((resolution) => {
      if (resolution.hidden) suppressed += 1;
      else if (Math.abs(resolution.dxPx) > EPSILON || Math.abs(resolution.dyPx) > EPSILON) displaced += 1;
    });
    host.setAttribute('data-annotation-label-count', String(labels.size));
    host.setAttribute('data-annotation-obstacle-count', String(obstacles.size));
    host.setAttribute('data-annotation-displaced-count', String(displaced));
    host.setAttribute('data-annotation-suppressed-count', String(suppressed));
    host.setAttribute('data-annotation-detail-mode', normalizedDetailMode(options.detailMode));
    host.setAttribute('data-annotation-label-gap', String(options.labelGapPx));
    host.setAttribute('data-annotation-max-nudge', String(options.maxLabelDisplacementPx));
  };

  const flush = () => {
    if (frame && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    const measured = [];
    labels.forEach((entry, key) => {
      const el = entry.el;
      if (!el || !el.isConnected || typeof el.getScreenCTM !== 'function') return;
      const ctm = el.getScreenCTM();
      const rect = el.getBoundingClientRect();
      if (!ctm || !(rect.width > 0) || !(rect.height > 0)) return;
      const applied = entry.applied;
      let left = rect.left;
      let top = rect.top;
      if (applied && (applied.tx || applied.ty)) {
        left -= ctm.a * applied.tx + ctm.c * applied.ty;
        top -= ctm.b * applied.tx + ctm.d * applied.ty;
      }
      measured.push({
        key,
        meta: entry.meta,
        ctm,
        rect: {
          left, top, right: left + rect.width, bottom: top + rect.height,
          width: rect.width, height: rect.height,
        },
      });
    });
    const obstacleElements = new Set(obstacles.values());
    const obstacleScope = options.host?.ownerSVGElement ?? options.host;
    obstacleScope?.querySelectorAll?.('[data-navigation-annotation-obstacle]').forEach((el) => {
      obstacleElements.add(el);
    });
    const obstacleRects = [];
    obstacleElements.forEach((el) => {
      if (!el || !el.isConnected) return;
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) obstacleRects.push(rect);
    });
    const pathObstacleElements = options.host?.querySelectorAll?.(
      '[data-navigation-annotation-path-obstacle]',
    ) ?? [];
    pathObstacleElements.forEach((el) => {
      if (
        !el?.isConnected
        || typeof el.getTotalLength !== 'function'
        || typeof el.getPointAtLength !== 'function'
        || typeof el.getScreenCTM !== 'function'
      ) return;
      const ctm = el.getScreenCTM();
      const localLength = el.getTotalLength();
      if (!ctm || !(localLength > 0)) return;
      const scaleX = Math.hypot(ctm.a, ctm.b);
      const scaleY = Math.hypot(ctm.c, ctm.d);
      const screenLength = localLength * ((scaleX + scaleY) / 2 || 1);
      const sampleCount = Math.max(1, Math.min(256, Math.ceil(screenLength / 6)));
      const strokeWidth = Number.parseFloat(
        typeof getComputedStyle === 'function' ? getComputedStyle(el).strokeWidth : '',
      );
      const radius = Math.max(2, (Number.isFinite(strokeWidth) ? strokeWidth : 3) / 2 + 1);
      for (let index = 0; index <= sampleCount; index += 1) {
        const point = el.getPointAtLength(localLength * index / sampleCount);
        const x = ctm.a * point.x + ctm.c * point.y + ctm.e;
        const y = ctm.b * point.x + ctm.d * point.y + ctm.f;
        obstacleRects.push({
          left: x - radius,
          top: y - radius,
          right: x + radius,
          bottom: y + radius,
          width: radius * 2,
          height: radius * 2,
        });
      }
    });

    const solved = solveAnnotationLayout(measured, obstacleRects, {
      ...options,
      boundaryRect: labelBoundaryRect(options.host),
    });
    const next = new Map();
    let changed = published.size !== measured.length;
    measured.forEach(({ key, ctm }) => {
      const target = solved.get(key) ?? INERT_RESOLUTION;
      const previous = published.get(key);
      if (previous && resolutionEquals(previous, target)) {
        next.set(key, previous);
        return;
      }
      changed = true;
      const det = ctm.a * ctm.d - ctm.b * ctm.c;
      const dxPx = target.hidden ? 0 : target.dxPx;
      const dyPx = target.hidden ? 0 : target.dyPx;
      next.set(key, {
        tx: det ? (ctm.d * dxPx - ctm.c * dyPx) / det : dxPx,
        ty: det ? (-ctm.b * dxPx + ctm.a * dyPx) / det : dyPx,
        dxPx,
        dyPx,
        nudgeDxPx: target.nudgeDxPx ?? 0,
        nudgeDyPx: target.nudgeDyPx ?? 0,
        placement: target.placement,
        hidden: target.hidden,
        hiddenReason: target.hiddenReason,
      });
    });
    if (changed) {
      published = next;
      emit();
    }
    updateHostAttributes();
  };

  const schedule = () => {
    if (typeof requestAnimationFrame !== 'function') return;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      flush();
    });
  };

  return {
    registerLabel(key, el, meta, applied) {
      labels.set(key, { el, meta, applied });
      schedule();
    },
    unregisterLabel(key) {
      if (labels.delete(key)) schedule();
    },
    registerObstacle(key, el) {
      obstacles.set(key, el);
      schedule();
    },
    unregisterObstacle(key) {
      if (obstacles.delete(key)) schedule();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getResolution(key) {
      return published.get(key) ?? INERT_RESOLUTION;
    },
    setOptions(nextOptions) {
      options = { ...options, ...nextOptions };
    },
    schedule,
    flush,
  };
}

export function useNavigationAnnotationDetailMode() {
  return React.useContext(NavigationAnnotationDetailContext);
}

/**
 * Wrapper for one decorative label block. A component — not a hook — so
 * overlays can use it inside `.map()` loops. With no provider it renders an
 * inert `<g>` with the uniform annotation evidence attributes and nothing
 * else, keeping standalone output pixel-identical to today.
 */
export function NavigationAnnotationBlock({
  id,
  kind,
  anchor,
  priority = 0,
  nudgeDirection = 'any',
  detailLevel = 'standard',
  children,
}) {
  const store = React.useContext(NavigationAnnotationContext);
  const key = React.useId();
  const ref = React.useRef(null);
  const resolution = React.useSyncExternalStore(
    store ? store.subscribe : noopSubscribe,
    store ? () => store.getResolution(key) : () => INERT_RESOLUTION,
    () => INERT_RESOLUTION,
  );

  // No dependency array on purpose: label text changes must re-measure, and
  // re-registration is idempotent (keyed map). The store publishes only on
  // real layout change, so the cycle terminates after one quiet pass.
  useIsomorphicLayoutEffect(() => {
    if (!store || !ref.current) return undefined;
    store.registerLabel(key, ref.current, {
      id,
      kind,
      priority,
      nudgeDirection,
      detailLevel,
      weight: KIND_WEIGHT[kind] ?? 0,
    }, resolution);
    return () => store.unregisterLabel(key);
  });

  const displaced = !resolution.hidden
    && (Math.abs(resolution.dxPx) > EPSILON || Math.abs(resolution.dyPx) > EPSILON);
  // React.createElement keeps this shared module a plain `.js` internal file
  // (JSX would force a `.jsx` extension and leak it into the generated entry).
  return React.createElement('g', {
    ref,
    'data-navigation-annotation': 'label',
    'data-annotation-kind': kind,
    'data-annotation-id': id,
    'data-annotation-anchor-x': anchor?.x,
    'data-annotation-anchor-y': anchor?.y,
    'data-annotation-priority': priority,
    'data-annotation-detail-level': detailLevel,
    'data-annotation-placement': resolution.hidden ? undefined : resolution.placement,
    'data-annotation-displaced': displaced ? 'true' : undefined,
    'data-annotation-dx': displaced ? Math.round(resolution.dxPx * 100) / 100 : undefined,
    'data-annotation-dy': displaced ? Math.round(resolution.dyPx * 100) / 100 : undefined,
    'data-annotation-nudge-x': displaced ? Math.round(resolution.nudgeDxPx * 100) / 100 : undefined,
    'data-annotation-nudge-y': displaced ? Math.round(resolution.nudgeDyPx * 100) / 100 : undefined,
    'data-annotation-suppressed': resolution.hidden ? 'true' : undefined,
    'data-annotation-suppressed-reason': resolution.hidden ? resolution.hiddenReason : undefined,
    transform: displaced ? `translate(${resolution.tx} ${resolution.ty})` : undefined,
    visibility: resolution.hidden ? 'hidden' : undefined,
    pointerEvents: 'none',
  }, children);
}

/**
 * Registers immovable footprints (markers, badge rows, pins) that labels must
 * not cover. Returns an `obstacle(slot)` factory whose result is spread onto
 * an existing element — `{}` without a provider, so standalone DOM stays
 * byte-identical.
 */
export function useNavigationObstacles() {
  const store = React.useContext(NavigationAnnotationContext);
  const base = React.useId();
  const callbacks = React.useRef(new Map());

  React.useEffect(() => () => {
    if (!store) return;
    callbacks.current.forEach((_, slot) => store.unregisterObstacle(`${base}:${slot}`));
    callbacks.current.clear();
  }, [store, base]);

  if (!store) return () => ({});
  return (slot) => {
    let refCallback = callbacks.current.get(slot);
    if (!refCallback) {
      const key = `${base}:${slot}`;
      refCallback = (el) => {
        if (el) store.registerObstacle(key, el);
        else store.unregisterObstacle(key);
      };
      callbacks.current.set(slot, refCallback);
    }
    return { ref: refCallback, 'data-annotation-obstacle': slot };
  };
}
