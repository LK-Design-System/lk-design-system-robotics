import React from 'react';
import {
  NavigationAnnotationContext,
  createAnnotationStore,
  useIsomorphicLayoutEffect,
} from './_navigationAnnotations.js';

/**
 * SVG `<g>` fragment that coordinates screen-space label collisions across
 * the navigation overlays composed under it. Labels nudge vertically up to
 * `maxLabelDisplacementPx`; when no free slot remains, the lowest-priority
 * label alone is suppressed — markers, state badges, accessible names, and
 * the semantic mirror never change. Overlays rendered without this provider
 * behave exactly as standalone fragments.
 */
export function NavigationAnnotationLayer({
  children,
  maxLabelDisplacementPx = 56,
  labelGapPx = 4,
  ...rest
}) {
  const [store] = React.useState(createAnnotationStore);
  const hostRef = React.useRef(null);

  // Children's layout effects register before this one runs, so the first
  // coordinated layout lands in the same commit, before paint.
  useIsomorphicLayoutEffect(() => {
    store.setOptions({ maxLabelDisplacementPx, labelGapPx, host: hostRef.current });
    store.flush();
  });

  React.useEffect(() => {
    const svg = hostRef.current?.ownerSVGElement;
    let observer;
    if (typeof ResizeObserver === 'function' && svg) {
      observer = new ResizeObserver(() => store.schedule());
      observer.observe(svg);
    }
    let cancelled = false;
    if (typeof document !== 'undefined' && typeof document.fonts?.ready?.then === 'function') {
      document.fonts.ready.then(() => {
        if (!cancelled) store.schedule();
      });
    }
    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [store]);

  return (
    <g {...rest} ref={hostRef} data-lk-navigation-annotation-layer="">
      <NavigationAnnotationContext.Provider value={store}>
        {children}
      </NavigationAnnotationContext.Provider>
    </g>
  );
}
