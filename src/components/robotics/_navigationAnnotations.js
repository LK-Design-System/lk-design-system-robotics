import React from 'react';

/**
 * Shared registry contract between `NavigationAnnotationLayer` and the six
 * navigation overlay fragments. Without a provider the context stays `null`
 * and every participant renders exactly its standalone markup — no transform,
 * no visibility change, no coordination attributes beyond the inert wrapper.
 */
export const NavigationAnnotationContext = React.createContext(null);

export const useIsomorphicLayoutEffect = typeof window === 'undefined'
  ? React.useEffect
  : React.useLayoutEffect;

const INERT_RESOLUTION = Object.freeze({ tx: 0, ty: 0, dyPx: 0, hidden: false });
const noopSubscribe = () => () => {};

/**
 * State-first priority scale: a selected entity's label always outranks any
 * unselected one; kind order only breaks ties between equal states. The kind
 * weights mirror the SVG paint-order contract (region → lane → route →
 * trajectory → waypoint → facility) so topmost-painted point features keep
 * their labels under pressure.
 */
export function annotationPriority({ selected, focused, alarm, emphasized } = {}) {
  return (selected ? 400 : 0)
    + (focused ? 300 : 0)
    + (alarm ? 200 : 0)
    + (emphasized ? 100 : 0);
}

export const KIND_WEIGHT = {
  'region-label': 0,
  'lane-label': 1,
  'route-segment-label': 2,
  'route-progress-label': 2,
  'trajectory-label': 3,
  'waypoint-label': 4,
  'facility-label': 5,
};

/**
 * Pure, deterministic vertical slot negotiation in CSS pixels. Labels are
 * placed greedily by (priority desc, kind weight desc, id asc); obstacles are
 * immovable. A label whose natural spot is free never moves. When every
 * candidate within `maxLabelDisplacementPx` collides, the label is suppressed
 * instead of displaced — visuals only, identity is the caller's concern.
 */
export function solveAnnotationLayout(labels, obstacleRects, options = {}) {
  const gap = Number.isFinite(options.labelGapPx) ? options.labelGapPx : 4;
  const maxNudge = Number.isFinite(options.maxLabelDisplacementPx) ? options.maxLabelDisplacementPx : 56;
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
    const rect = label.rect;
    const height = rect.height;
    const naturalTop = rect.top;
    // Horizontal filter is gap-free on purpose: diagonal corner contact is
    // not a visual collision, and inflating both axes would nudge labels that
    // merely brush an obstacle corner. The vertical intervals below keep the
    // full gap so stacked labels stay separated.
    const blockers = placed.filter((candidate) => (
      candidate.left < rect.right && candidate.right > rect.left
    ));
    // Label top t collides with blocker b iff t ∈ (b.top - gap - height, b.bottom + gap).
    const forbidden = blockers.map((blocker) => [blocker.top - gap - height, blocker.bottom + gap]);
    const isFree = (top) => forbidden.every(([lo, hi]) => top <= lo + 1e-6 || top >= hi - 1e-6);
    const direction = label.meta.nudgeDirection ?? 'any';

    let chosenTop;
    if (isFree(naturalTop)) {
      chosenTop = naturalTop;
    } else {
      let best;
      for (const [lo, hi] of forbidden) {
        for (const candidate of [lo, hi]) {
          const dy = candidate - naturalTop;
          if (direction === 'up' && dy > 1e-6) continue;
          if (direction === 'down' && dy < -1e-6) continue;
          if (Math.abs(dy) > maxNudge) continue;
          if (!isFree(candidate)) continue;
          if (best === undefined) { best = candidate; continue; }
          const bestDy = best - naturalTop;
          if (Math.abs(dy) < Math.abs(bestDy) - 1e-6) best = candidate;
          else if (Math.abs(Math.abs(dy) - Math.abs(bestDy)) <= 1e-6 && dy < bestDy) best = candidate;
        }
      }
      chosenTop = best;
    }

    if (chosenTop === undefined) {
      out.set(label.key, { dyPx: 0, hidden: true });
      continue;
    }
    out.set(label.key, { dyPx: chosenTop - naturalTop, hidden: false });
    placed.push({ left: rect.left, top: chosenTop, right: rect.right, bottom: chosenTop + height });
  }
  return out;
}

function resolutionEquals(a, b) {
  return a.hidden === b.hidden && Math.abs(a.dyPx - b.dyPx) <= 0.5;
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
  let options = { labelGapPx: 4, maxLabelDisplacementPx: 56, host: null };
  let frame = 0;

  const emit = () => { listeners.forEach((listener) => listener()); };

  const updateHostAttributes = () => {
    const host = options.host;
    if (!host) return;
    let displaced = 0;
    let suppressed = 0;
    published.forEach((resolution) => {
      if (resolution.hidden) suppressed += 1;
      else if (Math.abs(resolution.dyPx) > 0.5) displaced += 1;
    });
    host.setAttribute('data-annotation-label-count', String(labels.size));
    host.setAttribute('data-annotation-obstacle-count', String(obstacles.size));
    host.setAttribute('data-annotation-displaced-count', String(displaced));
    host.setAttribute('data-annotation-suppressed-count', String(suppressed));
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
    const obstacleRects = [];
    obstacles.forEach((el) => {
      if (!el || !el.isConnected) return;
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) obstacleRects.push(rect);
    });

    const solved = solveAnnotationLayout(measured, obstacleRects, options);
    const next = new Map();
    let changed = published.size !== measured.length;
    measured.forEach(({ key, ctm }) => {
      const target = solved.get(key) ?? { dyPx: 0, hidden: false };
      const previous = published.get(key);
      if (previous && resolutionEquals(previous, target)) {
        next.set(key, previous);
        return;
      }
      changed = true;
      const det = ctm.a * ctm.d - ctm.b * ctm.c;
      const dyPx = target.hidden ? 0 : target.dyPx;
      next.set(key, {
        tx: det ? (-ctm.c * dyPx) / det : 0,
        ty: det ? (ctm.a * dyPx) / det : dyPx,
        dyPx,
        hidden: target.hidden,
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
      weight: KIND_WEIGHT[kind] ?? 0,
    }, resolution);
    return () => store.unregisterLabel(key);
  });

  const displaced = !resolution.hidden && Math.abs(resolution.dyPx) > 0.5;
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
    'data-annotation-displaced': displaced ? 'true' : undefined,
    'data-annotation-dy': displaced ? Math.round(resolution.dyPx * 100) / 100 : undefined,
    'data-annotation-suppressed': resolution.hidden ? 'true' : undefined,
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
