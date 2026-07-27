// Shared collision assertions for robotics navigation stories. Rects are
// measured from the real DOM so these gates observe exactly what a viewer
// sees, independent of any convention-based layout math in the components.

function elementEvidenceName(element) {
  return element.getAttribute('data-annotation-id')
    ?? element.getAttribute('data-route-screen-slot')
    ?? element.getAttribute('data-trajectory-screen-slot')
    ?? element.getAttribute('data-route-marker-badge')
    ?? element.getAttribute('data-trajectory-marker-badge')
    ?? element.getAttribute('data-route-screen-row')
    ?? element.getAttribute('data-trajectory-screen-row')
    ?? element.getAttribute('data-route-overlay-state')
    ?? element.getAttribute('data-trajectory-overlay-state')
    ?? element.getAttribute('data-annotation-obstacle')
    ?? element.tagName;
}

export function assertPairwiseNonOverlap(elements, label, gap = 0) {
  const rectangles = elements.map((element) => ({
    name: elementEvidenceName(element),
    rect: element.getBoundingClientRect(),
  }));
  rectangles.forEach(({ name, rect }) => {
    if (rect.width <= 0 || rect.height <= 0) {
      throw new Error(`${label} ${name} marker has no rendered CSS-pixel bounds.`);
    }
  });
  for (let first = 0; first < rectangles.length; first += 1) {
    for (let second = first + 1; second < rectangles.length; second += 1) {
      const a = rectangles[first];
      const b = rectangles[second];
      const overlaps = a.rect.left < b.rect.right + gap - 0.5
        && a.rect.right > b.rect.left - gap + 0.5
        && a.rect.top < b.rect.bottom + gap - 0.5
        && a.rect.bottom > b.rect.top - gap + 0.5;
      if (overlaps) {
        throw new Error(`${label} ${a.name}/${b.name} markers overlap in CSS pixels.`);
      }
    }
  }
}

/** Visible coordinated label blocks; suppressed labels are intentionally excluded. */
export function collectAnnotationLabels(root) {
  return [...root.querySelectorAll('[data-navigation-annotation="label"]:not([data-annotation-suppressed])')];
}

/**
 * Cross-entity contract: no two visible coordinated labels overlap, and no
 * visible coordinated label covers a registered marker/badge obstacle.
 */
export function assertNoLabelCollisions(root, label, gap = 8) {
  const labels = collectAnnotationLabels(root);
  assertPairwiseNonOverlap(labels, `${label} 라벨`, gap);
  const registeredObstacles = [...root.querySelectorAll('[data-annotation-obstacle]')];
  const stageObstacles = [...root.querySelectorAll('[data-navigation-annotation-obstacle]')];
  const pathObstacles = [...root.querySelectorAll('[data-navigation-annotation-path-obstacle]')];
  labels.forEach((labelElement) => {
    const a = labelElement.getBoundingClientRect();
    const obstacles = [...registeredObstacles, ...stageObstacles];
    obstacles.forEach((obstacleElement) => {
      if (obstacleElement.contains(labelElement) || labelElement.contains(obstacleElement)) return;
      const b = obstacleElement.getBoundingClientRect();
      const overlaps = a.left < b.right + gap - 0.5
        && a.right > b.left - gap + 0.5
        && a.top < b.bottom + gap - 0.5
        && a.bottom > b.top - gap + 0.5;
      if (overlaps) {
        throw new Error(`${label} ${elementEvidenceName(labelElement)} 라벨이 ${elementEvidenceName(obstacleElement)} 장애물을 덮습니다.`);
      }
    });
    pathObstacles.forEach((pathElement) => {
      const ctm = pathElement.getScreenCTM();
      const length = pathElement.getTotalLength();
      if (!ctm || !(length > 0)) return;
      const scaleX = Math.hypot(ctm.a, ctm.b);
      const scaleY = Math.hypot(ctm.c, ctm.d);
      const screenLength = length * ((scaleX + scaleY) / 2 || 1);
      const samples = Math.max(1, Math.ceil(screenLength / 6));
      const strokeWidth = Number.parseFloat(getComputedStyle(pathElement).strokeWidth);
      const clearance = gap + Math.max(2, (Number.isFinite(strokeWidth) ? strokeWidth : 3) / 2 + 1);
      for (let index = 0; index <= samples; index += 1) {
        const point = pathElement.getPointAtLength(length * index / samples);
        const x = ctm.a * point.x + ctm.c * point.y + ctm.e;
        const y = ctm.b * point.x + ctm.d * point.y + ctm.f;
        if (
          x > a.left - clearance + 0.5
          && x < a.right + clearance - 0.5
          && y > a.top - clearance + 0.5
          && y < a.bottom + clearance - 0.5
        ) {
          throw new Error(`${label} ${elementEvidenceName(labelElement)} 라벨이 경로선을 덮습니다.`);
        }
      }
    });
    const svgBounds = labelElement.ownerSVGElement?.getBoundingClientRect();
    if (
      svgBounds
      && (
        a.left < svgBounds.left + 16 - 0.5
        || a.right > svgBounds.right - 16 + 0.5
        || a.top < svgBounds.top + 16 - 0.5
        || a.bottom > svgBounds.bottom - 16 + 0.5
      )
    ) {
      throw new Error(`${label} ${elementEvidenceName(labelElement)} 라벨이 SVG 16px 안전 여백을 벗어납니다.`);
    }
  });
}
