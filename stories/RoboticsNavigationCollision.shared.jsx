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

export function assertPairwiseNonOverlap(elements, label) {
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
      const overlaps = a.rect.left < b.rect.right - 0.5
        && a.rect.right > b.rect.left + 0.5
        && a.rect.top < b.rect.bottom - 0.5
        && a.rect.bottom > b.rect.top + 0.5;
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
export function assertNoLabelCollisions(root, label) {
  const labels = collectAnnotationLabels(root);
  assertPairwiseNonOverlap(labels, `${label} 라벨`);
  const obstacles = [...root.querySelectorAll('[data-annotation-obstacle]')];
  labels.forEach((labelElement) => {
    const a = labelElement.getBoundingClientRect();
    obstacles.forEach((obstacleElement) => {
      if (obstacleElement.contains(labelElement) || labelElement.contains(obstacleElement)) return;
      const b = obstacleElement.getBoundingClientRect();
      const overlaps = a.left < b.right - 0.5
        && a.right > b.left + 0.5
        && a.top < b.bottom - 0.5
        && a.bottom > b.top + 0.5;
      if (overlaps) {
        throw new Error(`${label} ${elementEvidenceName(labelElement)} 라벨이 ${elementEvidenceName(obstacleElement)} 장애물을 덮습니다.`);
      }
    });
  });
}
