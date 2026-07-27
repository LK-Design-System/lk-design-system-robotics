// Optional topology/debug direction cue. Normal Lane and Route views omit it;
// Trajectory uses temporal samples and RobotPose owns physical heading.
// Internal `_`-prefixed geometry, not part of the public package entry.
export const NAVIGATION_DIRECTION_PATH = 'M -4 -6 L 8 0 L -4 6 Z';

// The stroked shaft-and-head arrow that annotates a lane ENDPOINT's approach
// orientation — pointing away from the path rather than riding on it, which is
// why it is a different shape from the on-path chevron. Promoted here (single
// consumer today: LaneOverlay) so the Foundation catalog can document and
// regression-test the whole arrow vocabulary from one source.
export const NAVIGATION_ENDPOINT_ORIENTATION_PATH = 'M -5 0 H 5 M 2 -3 L 5 0 L 2 3';
