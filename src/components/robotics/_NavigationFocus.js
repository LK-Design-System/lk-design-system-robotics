/**
 * Mirrors the shared `:focus-visible` contract for SVG fragments that render
 * a shape-following focus indicator instead of the global rectangular ring.
 * Falling back to visible focus is the safer behavior in older environments.
 */
export function isFocusVisibleTarget(target) {
  if (!target || typeof target.matches !== 'function') return true;

  try {
    return target.matches(':focus-visible');
  } catch {
    return true;
  }
}
