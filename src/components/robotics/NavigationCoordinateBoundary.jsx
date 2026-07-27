import React from 'react';
import { assertNavigationFrameCompatible, createNavigationFrameRef } from './NavigationCoordinateSystem.js';

const NavigationCoordinateBoundaryContext = React.createContext(null);

export function isNavigationSourceCompatible(source, boundary) {
  if (!boundary) return true;
  if (!source) return !boundary.requireSource;
  try {
    assertNavigationFrameCompatible(source, boundary.frame, {
      maxAgeMs: boundary.maxAgeMs,
    });
    return true;
  } catch {
    return false;
  }
}

export function isNavigationGeometryCompatible(geometry, boundary) {
  return isNavigationSourceCompatible(geometry?.source, boundary)
    && (!boundary?.requireProjectedCoordinates || geometry?.coordinateSpace === 'svg-map');
}

export function useNavigationCoordinateBoundary() {
  return React.useContext(NavigationCoordinateBoundaryContext);
}

/**
 * Establishes the frame/version contract for SVG navigation layers below it.
 * Participating overlays suppress data from another map frame or immutable map
 * version instead of silently drawing it in the active map.
 */
export function NavigationCoordinateBoundary({
  frame,
  requireSource = true,
  requireProjectedCoordinates = true,
  maxAgeMs,
  children,
  ...groupProps
}) {
  const normalizedFrame = React.useMemo(
    () => createNavigationFrameRef(frame),
    [frame?.mapId, frame?.frameId, frame?.mapVersion, frame?.stamp?.sec, frame?.stamp?.nanosec],
  );
  const boundary = React.useMemo(() => ({
    frame: normalizedFrame,
    requireSource,
    requireProjectedCoordinates,
    maxAgeMs,
  }), [normalizedFrame, requireSource, requireProjectedCoordinates, maxAgeMs]);

  return (
    <g
      {...groupProps}
      data-navigation-coordinate-boundary=""
      data-source-map-id={normalizedFrame.mapId}
      data-source-frame-id={normalizedFrame.frameId}
      data-source-map-version={normalizedFrame.mapVersion}
      data-require-projected-coordinates={requireProjectedCoordinates ? 'true' : 'false'}
    >
      <NavigationCoordinateBoundaryContext.Provider value={boundary}>
        {children}
      </NavigationCoordinateBoundaryContext.Provider>
    </g>
  );
}
