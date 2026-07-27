import React from 'react';
import {
  isNavigationSourceCompatible,
  useNavigationCoordinateBoundary,
} from './NavigationCoordinateBoundary.jsx';

const OCCUPANCY_FILL = {
  free: 'var(--component-viewer-light-map-free)',
  occupied: 'var(--component-viewer-light-map-occupied)',
  unknown: 'var(--component-viewer-light-map-unknown)',
};

function finiteOr(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function positiveInteger(value) {
  return Number.isInteger(value) && value > 0 ? value : 0;
}

function occupancyState(value, freeThreshold, occupiedThreshold, unknownValue) {
  if (!Number.isFinite(value) || value === unknownValue) return 'unknown';
  if (value <= freeThreshold) return 'free';
  if (value >= occupiedThreshold) return 'occupied';
  return 'unknown';
}

function rowRuns(map, freeThreshold, occupiedThreshold, unknownValue, rowOrder) {
  const width = positiveInteger(map?.width);
  const height = positiveInteger(map?.height);
  if (!width || !height) return [];

  const data = map?.data ?? [];
  const runs = [];
  for (let sourceRow = 0; sourceRow < height; sourceRow += 1) {
    const displayRow = rowOrder === 'bottom-to-top' ? height - sourceRow - 1 : sourceRow;
    let startColumn = 0;
    let state = occupancyState(data[sourceRow * width], freeThreshold, occupiedThreshold, unknownValue);

    for (let column = 1; column <= width; column += 1) {
      const nextState = column < width
        ? occupancyState(data[sourceRow * width + column], freeThreshold, occupiedThreshold, unknownValue)
        : undefined;
      if (nextState === state) continue;
      runs.push({
        column: startColumn,
        row: displayRow,
        length: column - startColumn,
        state,
      });
      startColumn = column;
      state = nextState;
    }
  }
  return runs;
}

/**
 * SVG occupancy-grid fragment for an application-owned map coordinate system.
 *
 * Values at or below `freeThreshold` are free, values at or above
 * `occupiedThreshold` are occupied, and all other or missing values are
 * unknown. The renderer never infers free space from closed wall geometry.
 */
export function OccupancyMapLayer({
  map,
  freeThreshold = 25,
  occupiedThreshold = 65,
  unknownValue = -1,
  rowOrder = 'bottom-to-top',
  showBoundary = true,
  decorative = true,
  label = '점유 지도',
  style,
  ...groupProps
}) {
  const coordinateBoundary = useNavigationCoordinateBoundary();
  const width = positiveInteger(map?.width);
  const height = positiveInteger(map?.height);
  const resolution = finiteOr(map?.resolution, 1);
  if (!isNavigationSourceCompatible(map?.source, coordinateBoundary)) return null;
  if (!width || !height || resolution <= 0) return null;

  const resolvedFreeThreshold = finiteOr(freeThreshold, 25);
  const resolvedOccupiedThreshold = Math.max(
    resolvedFreeThreshold,
    finiteOr(occupiedThreshold, 65),
  );
  const originX = finiteOr(map?.origin?.x, 0);
  const originY = finiteOr(map?.origin?.y, 0);
  const headingRad = finiteOr(map?.origin?.headingRad, 0);
  const headingDeg = headingRad * (180 / Math.PI);
  const runs = rowRuns(
    map,
    resolvedFreeThreshold,
    resolvedOccupiedThreshold,
    unknownValue,
    rowOrder,
  );

  return (
    <g
      {...groupProps}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : label}
      data-occupancy-map-layer=""
      data-occupancy-row-order={rowOrder}
      data-source-map-id={map?.source?.mapId}
      data-source-frame-id={map?.source?.frameId}
      data-source-map-version={map?.source?.mapVersion}
      transform={`translate(${originX} ${originY}) rotate(${headingDeg})`}
      style={{ pointerEvents: 'none', ...style }}
    >
      {!decorative && <title>{label}</title>}
      <g shapeRendering="crispEdges">
        {runs.map((run) => (
          <rect
            key={`${run.row}-${run.column}-${run.state}`}
            x={run.column * resolution}
            y={run.row * resolution}
            width={run.length * resolution}
            height={resolution}
            fill={OCCUPANCY_FILL[run.state]}
            data-occupancy-state={run.state}
          />
        ))}
      </g>
      {showBoundary && (
        <rect
          width={width * resolution}
          height={height * resolution}
          fill="none"
          stroke="var(--component-viewer-light-map-boundary)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          data-occupancy-boundary=""
        />
      )}
    </g>
  );
}
