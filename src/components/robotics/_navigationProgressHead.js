import React from 'react';
import { NAV_PROGRESS_HEAD } from './_navigationVocabulary.js';

const POINT_EPSILON = 0.000001;
const POSITION_JOIN_TOLERANCE_PX = 2;

function pointDistanceSquared(first, second) {
  const dx = first.x - second.x;
  const dy = first.y - second.y;
  return dx * dx + dy * dy;
}

function appendDistinct(points, point) {
  const last = points[points.length - 1];
  if (!last || pointDistanceSquared(last, point) > POINT_EPSILON * POINT_EPSILON) {
    points.push(point);
  }
}

function segmentMetrics(points) {
  return points.slice(0, -1).map((start, index) => {
    const end = points[index + 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    return { index, start, end, dx, dy, length };
  });
}

function pointAtFraction(points, fraction) {
  const metrics = segmentMetrics(points);
  const totalLength = metrics.reduce((sum, segment) => sum + segment.length, 0);
  if (totalLength <= POINT_EPSILON) return undefined;
  const ratio = Math.max(0, Math.min(1, Number(fraction) || 0));
  let remaining = totalLength * ratio;
  const nonZero = metrics.filter((segment) => segment.length > POINT_EPSILON);
  for (let index = 0; index < nonZero.length; index += 1) {
    const segment = nonZero[index];
    if (remaining <= segment.length || index === nonZero.length - 1) {
      const localRatio = Math.max(0, Math.min(1, remaining / segment.length));
      return {
        point: {
          x: segment.start.x + segment.dx * localRatio,
          y: segment.start.y + segment.dy * localRatio,
        },
        segment,
      };
    }
    remaining -= segment.length;
  }
  return undefined;
}

function prefixThrough(points, segmentIndex, endPoint) {
  const prefix = [];
  points.slice(0, segmentIndex + 1).forEach((point) => appendDistinct(prefix, point));
  appendDistinct(prefix, endPoint);
  return prefix;
}

/** Resolves a source-owned Route fraction and an optional visually joined exact position. */
export function routeProgressGeometry(points, fraction, explicitPosition, viewportScale = 1) {
  const fractionResult = pointAtFraction(points, fraction);
  if (!fractionResult) return undefined;
  const prefixPoints = prefixThrough(points, fractionResult.segment.index, fractionResult.point);
  if (!explicitPosition) {
    return {
      point: fractionResult.point,
      angle: Math.atan2(fractionResult.segment.dy, fractionResult.segment.dx) * 180 / Math.PI,
      prefixPoints,
      usesCarrier: prefixPoints.length < 2,
    };
  }

  const scale = Number.isFinite(viewportScale) && viewportScale > 0 ? viewportScale : 1;
  const positionMismatch = Math.sqrt(pointDistanceSquared(explicitPosition, fractionResult.point)) * scale
    > POSITION_JOIN_TOLERANCE_PX;
  if (positionMismatch) {
    return {
      point: fractionResult.point,
      angle: undefined,
      prefixPoints,
      usesCarrier: false,
      positionMismatch: true,
    };
  }

  return {
    point: explicitPosition,
    angle: Math.atan2(fractionResult.segment.dy, fractionResult.segment.dx) * 180 / Math.PI,
    prefixPoints,
    usesCarrier: true,
    positionMismatch: false,
  };
}

/** Resolves a finite Trajectory sample without inferring progress from time. */
export function trajectoryProgressGeometry(points, pointIndex) {
  if (!Number.isInteger(pointIndex) || pointIndex < 0 || pointIndex >= points.length) return undefined;
  const point = points[pointIndex];
  const prefixPoints = [];
  points.slice(0, pointIndex + 1).forEach((item) => appendDistinct(prefixPoints, item));
  const incoming = [...segmentMetrics(points.slice(0, pointIndex + 1))]
    .reverse()
    .find((segment) => segment.length > POINT_EPSILON);
  const outgoing = segmentMetrics(points.slice(pointIndex))
    .find((segment) => segment.length > POINT_EPSILON);
  const tangent = incoming ?? outgoing;
  if (!tangent) return undefined;
  return {
    point,
    angle: Math.atan2(tangent.dy, tangent.dx) * 180 / Math.PI,
    prefixPoints,
    usesCarrier: prefixPoints.length < 2,
  };
}

export function progressCarrierPath(point, angle, inverseScale) {
  if (!Number.isFinite(angle)) return '';
  const radians = angle * Math.PI / 180;
  const length = 16 * inverseScale;
  return `M ${point.x - Math.cos(radians) * length} ${point.y - Math.sin(radians) * length} L ${point.x} ${point.y}`;
}

export function NavigationProgressHeadDefs({
  idPrefix,
  tone,
  surface,
  inverseScale,
  role,
}) {
  const dimensions = NAV_PROGRESS_HEAD[role];
  const marker = (layer, stroke, strokeWidth) => React.createElement('marker', {
    key: layer,
    id: `${idPrefix}-${layer}`,
    viewBox: NAV_PROGRESS_HEAD.viewBox,
    refX: NAV_PROGRESS_HEAD.refX,
    refY: NAV_PROGRESS_HEAD.refY,
    markerWidth: NAV_PROGRESS_HEAD.width * inverseScale,
    markerHeight: NAV_PROGRESS_HEAD.height * inverseScale,
    markerUnits: 'userSpaceOnUse',
    orient: 'auto',
    overflow: 'visible',
  }, React.createElement('path', {
    'data-navigation-progress-head-definition': layer,
    d: NAV_PROGRESS_HEAD.path,
    fill: 'none',
    stroke,
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }));

  return React.createElement('defs', { 'aria-hidden': 'true' },
    marker('casing', surface, dimensions.casingWidth),
    marker('core', tone, dimensions.coreWidth));
}

export function ProgressHeadObstacle({ obstacle, id, point, angle, inverseScale, dataPrefix }) {
  const bounds = NAV_PROGRESS_HEAD.obstacle;
  return React.createElement('g', {
    'data-navigation-progress-head-obstacle': '',
    'data-progress-head-angle': angle,
    'data-route-anchor-x': dataPrefix === 'route' ? point.x : undefined,
    'data-route-anchor-y': dataPrefix === 'route' ? point.y : undefined,
    'data-trajectory-anchor-x': dataPrefix === 'trajectory' ? point.x : undefined,
    'data-trajectory-anchor-y': dataPrefix === 'trajectory' ? point.y : undefined,
    transform: `translate(${point.x} ${point.y}) rotate(${angle}) scale(${inverseScale})`,
    'aria-hidden': 'true',
    pointerEvents: 'none',
  }, React.createElement('rect', {
    ...obstacle(id),
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    fill: 'transparent',
    opacity: 0,
  }));
}
