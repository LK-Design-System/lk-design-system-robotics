// Direction / heading vector glyphs shared across the Navigation renderers.
// Internal `_`-prefixed module: geometry-only string constants, imported by the
// renderers but never exported from the public entry.
//
// The filled direction chevron is the compact "direction of travel / heading"
// marker painted on a path — lane mid-direction, route direction, trajectory
// heading. Its area centroid is the local origin — (-4 - 4 + 8) / 3 = 0 — so it
// sits on the path anchor after rotation. Sized 12x12px at viewportScale 1:
// clearly legible on a 2.5-4px path stroke at map zoom, while staying visually
// subordinate to the ~18px progress head (current position outranks heading).
export const NAVIGATION_DIRECTION_PATH = 'M -4 -6 L 8 0 L -4 6 Z';

// The stroked shaft-and-head arrow that annotates a lane ENDPOINT's approach
// orientation — pointing away from the path rather than riding on it, which is
// why it is a different shape from the on-path chevron. Promoted here (single
// consumer today: LaneOverlay) so the Foundation catalog can document and
// regression-test the whole arrow vocabulary from one source.
export const NAVIGATION_ENDPOINT_ORIENTATION_PATH = 'M -5 0 H 5 M 2 -3 L 5 0 L 2 3';
