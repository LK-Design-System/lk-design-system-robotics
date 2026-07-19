// Direction / heading vector glyph shared across the Navigation renderers.
// Internal `_`-prefixed module: a geometry-only string constant, imported by the
// renderers but never exported from the public entry.
//
// The filled direction chevron is the compact "direction of travel / heading"
// marker painted on a path — lane mid-direction, route direction, trajectory
// heading. Its area centroid is the local origin — (-2 - 2 + 4) / 3 = 0 — so it
// sits on the path anchor after rotation. (The lane endpoint-orientation arrow is
// used by LaneOverlay only, so it stays local there rather than as a shared atom.)
export const NAVIGATION_DIRECTION_PATH = 'M -2 -3.4 L 4 0 L -2 3.4 Z';
