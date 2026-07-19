import React from 'react';

// Facility badge glyphs — door, lift, dock, charging, ramp, gate, handoff —
// painted as a knockout fill (white on the state-colored badge) inside the
// FacilityTransition marker.
//
// door/lift/dock/charging/gate are Material Symbols (Google, Apache License 2.0),
// rounded fill: `door_sliding`, `elevator`, `home` (the AGV's return/dock
// station), `bolt` (a charging point), and `shield` (a security gate). `ramp`
// (an incline silhouette) and `handoff` (a load-into-box icon) are LDS-authored:
// Material Symbols has no level-change ramp glyph (its `ramp_*` icons are highway
// on-ramps) and no filled transfer glyph (its arrow icons lack a fill variant, so
// they read too thin at badge size). Each icon's native viewBox is
// `0 -960 960 960`; the shared FIT transform recenters the icon (its center is
// 480,-480) onto the badge origin and scales the 960u artwork down to the ~22px
// badge slot. See docs/references/ATTRIBUTIONS.md for the full license notice.
//
// Internal (underscore-prefixed) shared module — NOT part of the public API.
const h = React.createElement;

// Material Symbols rounded fill paths, verbatim (viewBox 0 -960 960 960); ramp
// and handoff are LDS-authored (incline silhouette; load-into-box) on the grid.
// Exported (still internal — this _-module is never promoted to the public
// entry) so HazardMarker can reuse the same ramp silhouette: the same physical
// slope must read as the same object whether a product classifies it as a
// traversable facility or as a hazard.
export const FACILITY_GLYPH_PATHS = {
  door: 'M393.5-459.5Q404-470 404-484t-10.5-24.5Q383-519 369-519t-24.5 10.5Q334-498 334-484t10.5 24.5Q355-449 369-449t24.5-10.5Zm223 0Q627-470 627-484t-10.5-24.5Q606-519 592-519t-24.5 10.5Q557-498 557-484t10.5 24.5Q578-449 592-449t24.5-10.5ZM150-120q-13 0-21.5-8.5T120-150q0-13 8.5-21.5T150-180h16v-600q0-25 17.5-42.5T226-840h239v660h30v-660h239q25 0 42.5 17.5T794-780v600h16q13 0 21.5 8.5T840-150q0 13-8.5 21.5T810-120H150Z',
  lift: 'M280-400v140q0 13 8.5 21.5T310-230h60q13 0 21.5-8.5T400-260v-140h10q13 0 21.5-8.5T440-430v-80q0-33-23.5-56.5T360-590h-40q-33 0-56.5 23.5T240-510v80q0 13 8.5 21.5T270-400h10Zm99.5-240.5Q396-657 396-680t-16.5-39.5Q363-736 340-736t-39.5 16.5Q284-703 284-680t16.5 39.5Q317-624 340-624t39.5-16.5ZM542-530h146q9 0 13.5-7.5T701-553l-73-117q-5-7-13-7t-13 7l-73 117q-5 8-.5 15.5T542-530Zm86 240 73-117q5-8 .5-15.5T688-430H542q-9 0-13.5 7.5t.5 15.5l73 117q5 7 13 7t13-7ZM180-120q-24 0-42-18t-18-42v-600q0-23 18-41.5t42-18.5h600q23 0 41.5 18.5T840-780v600q0 24-18.5 42T780-120H180Z',
  dock: 'M160-180v-390q0-14.25 6.38-27 6.37-12.75 17.62-21l260-195q15.68-12 35.84-12Q500-825 516-813l260 195q11.25 8.25 17.63 21 6.37 12.75 6.37 27v390q0 24.75-17.62 42.37Q764.75-120 740-120H590q-12.75 0-21.37-8.63Q560-137.25 560-150v-220q0-12.75-8.62-21.38Q542.75-400 530-400H430q-12.75 0-21.37 8.62Q400-382.75 400-370v220q0 12.75-8.62 21.37Q382.75-120 370-120H220q-24.75 0-42.37-17.63Q160-155.25 160-180Z',
  charging: 'M360-360H217q-18 0-26.5-16t2.5-31l338-488q8-11 20-15t24 1q12 5 19 16t5 24l-39 309h176q19 0 27 17t-4 32L388-66q-8 10-20.5 13T344-55q-11-5-17.5-16T322-95l38-265Z',
  ramp: 'M140-280H820V-680H640L140-400Z',
  gate: 'M470.5-85q-4.5-1-9.5-3-139-47-220-168.5T160-523v-196q0-19 11-34.5t28-22.5l260-97q11-4 21-4t21 4l260 97q17 7 28 22.5t11 34.5v196q0 145-81 266.5T499-88q-5 2-9.5 3t-9.5 1q-5 0-9.5-1Z',
  handoff: 'M300-760h360q17 0 28.5 11.5T700-720v70H260v-70q0-17 11.5-28.5T300-760ZM240-590h480q25 0 42.5 17.5T780-530v250q0 25-17.5 42.5T720-220H240q-25 0-42.5-17.5T180-280v-250q0-25 17.5-42.5T240-590Zm240 300 150-150h-90v-90H420v90h-90l150 150Z',
};

// Recenter (icon center 480,-480 → origin) then scale 960u down to the badge.
const FIT = 'scale(0.019) translate(-480 480)';

export function FacilityGlyph({ kind, color }) {
  const d = FACILITY_GLYPH_PATHS[kind] ?? FACILITY_GLYPH_PATHS.dock;
  return h('g', { fill: color, pointerEvents: 'none', transform: FIT }, h('path', { d }));
}

export default FacilityGlyph;
