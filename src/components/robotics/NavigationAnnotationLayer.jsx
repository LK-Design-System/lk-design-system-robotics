import React from 'react';
import {
  NavigationAnnotationContext,
  NavigationAnnotationDetailContext,
  NavigationLabelPolicyContext,
  createAnnotationStore,
  useIsomorphicLayoutEffect,
} from './_navigationAnnotations.js';

/**
 * SVG `<g>` fragment that coordinates screen-space label collisions across
 * the navigation overlays composed under it. Labels try conventional
 * placements, then a bounded 2D nudge; when no free slot remains, the
 * lowest-priority label alone is suppressed. Markers, state badges, accessible
 * names, and the semantic mirror never change.
 */
export function NavigationAnnotationLayer({
  children,
  detailMode = 'standard',
  labelVisibility = 'interaction',
  detailVisibility = 'selected',
  maxLabelDisplacementPx = 24,
  labelGapPx = 8,
  ...rest
}) {
  const [store] = React.useState(createAnnotationStore);
  const hostRef = React.useRef(null);
  const labelPolicy = React.useMemo(
    () => ({ labelVisibility, detailVisibility }),
    [detailVisibility, labelVisibility],
  );

  // Children's layout effects register before this one runs, so the first
  // coordinated layout lands in the same commit, before paint.
  useIsomorphicLayoutEffect(() => {
    store.setOptions({
      detailMode,
      maxLabelDisplacementPx,
      labelGapPx,
      host: hostRef.current,
    });
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
    <g
      {...rest}
      ref={hostRef}
      data-lk-navigation-annotation-layer=""
      data-label-visibility={labelVisibility}
      data-detail-visibility={detailVisibility}
    >
      <NavigationLabelPolicyContext.Provider value={labelPolicy}>
        <NavigationAnnotationDetailContext.Provider value={detailMode}>
          <NavigationAnnotationContext.Provider value={store}>
            {children}
          </NavigationAnnotationContext.Provider>
        </NavigationAnnotationDetailContext.Provider>
      </NavigationLabelPolicyContext.Provider>
    </g>
  );
}
