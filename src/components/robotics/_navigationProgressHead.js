const POINT_EPSILON = 0.000001;

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
    return { start, end, dx, dy, length };
  });
}

/** Resolves a finite Trajectory playback sample without implying robot pose. */
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
