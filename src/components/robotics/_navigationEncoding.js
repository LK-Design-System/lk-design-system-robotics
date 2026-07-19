/**
 * Single source of truth for the language-neutral on-map codes shared by the
 * navigation marker badges and the map legend. Before this module the codes
 * were declared twice — once in WaypointMarker and again in the story-level
 * legend helper — so the map and its key could silently drift apart. Import
 * these everywhere a role/annotation code is rendered or decoded.
 *
 * These are terse codes only (H / T / P / C, dock / disp / ...). Human-facing
 * labels stay with each surface because the accessible-name copy and the
 * visible legend copy have different audiences and languages.
 */

export const ROLE_CODE = {
  holding: 'H',
  passthrough: 'T',
  parking: 'P',
  charger: 'C',
};

export const ANNOTATION_CODE = {
  dock: 'dock',
  cleaning: 'clean',
  dispenser: 'disp',
  ingestor: 'ing',
  'lift-approach': 'lift',
  'door-approach': 'door',
  mutex: 'mutex',
  custom: 'custom',
};
