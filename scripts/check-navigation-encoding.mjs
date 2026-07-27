import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ANNOTATION_CODE, ROLE_CODE } from '../src/components/robotics/_navigationEncoding.js';
import { ROLE_GLYPH_KINDS } from '../src/components/robotics/_navigationRoleGlyph.js';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const EXPECTED_ROLE_CODE = {
  holding: 'H',
  passthrough: 'T',
  parking: 'P',
  charger: 'C',
};

const EXPECTED_ANNOTATION_CODE = {
  dock: 'dock',
  cleaning: 'clean',
  dispenser: 'disp',
  ingestor: 'ing',
  'lift-approach': 'lift',
  'door-approach': 'door',
  mutex: 'mutex',
  custom: 'custom',
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sameRecord(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

async function source(relativePath) {
  return readFile(path.join(repositoryRoot, relativePath), 'utf8');
}

assert(
  sameRecord(ROLE_CODE, EXPECTED_ROLE_CODE),
  'ROLE_CODE changed. Update the serialization contract deliberately instead of changing a Storybook chip.',
);
assert(
  sameRecord(ANNOTATION_CODE, EXPECTED_ANNOTATION_CODE),
  'ANNOTATION_CODE changed. Update the compact annotation contract deliberately.',
);

const roleKeys = Object.keys(ROLE_CODE).sort();
const glyphKeys = [...ROLE_GLYPH_KINDS].sort();
assert(
  JSON.stringify(roleKeys) === JSON.stringify(glyphKeys),
  `Every serialized waypoint role must have one real vector glyph. Codes: ${roleKeys.join(', ')}. Glyphs: ${glyphKeys.join(', ')}.`,
);
assert(
  new Set(Object.values(ROLE_CODE)).size === roleKeys.length,
  'ROLE_CODE values must remain unique.',
);
assert(
  new Set(Object.values(ANNOTATION_CODE)).size === Object.keys(ANNOTATION_CODE).length,
  'ANNOTATION_CODE values must remain unique.',
);

const waypointSource = await source('src/components/robotics/WaypointMarker.jsx');
assert(
  waypointSource.includes('data-role-codes={(waypoint.roles || []).map((role) => ROLE_CODES[role])'),
  'WaypointMarker must retain ROLE_CODE only as internal/data serialization evidence.',
);
assert(
  waypointSource.includes('<NavigationRoleGlyph kind={primaryRole}'),
  'WaypointMarker must render the real vector role glyph instead of ROLE_CODE text.',
);
assert(
  waypointSource.includes('.map((annotation) => ANNOTATION_CODES[annotation.kind])'),
  'WaypointMarker compact annotation text must resolve through ANNOTATION_CODE.',
);

const stageSource = await source('stories/RoboticsNavigationStage.shared.jsx');
assert(
  stageSource.includes('if (ROLE_GLYPH_KINDS.has(key))')
    && stageSource.includes('<RoleGlyphSwatch role={key}'),
  'Navigation legends must render waypoint roles with vector glyphs, not serialization letters.',
);

const conventions = await source('docs/NAVIGATION_EXPRESSION_CONVENTIONS.md');
assert(
  !conventions.includes('Codes foundation story'),
  'Internal navigation codes must not be documented as a Foundation Storybook surface.',
);

try {
  await access(path.join(repositoryRoot, 'stories/RoboticsFoundationCodes.stories.jsx'));
  throw new Error('Internal navigation code registries must not have a public Foundation Storybook page.');
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

console.log(
  `Navigation encoding passed (${roleKeys.length} serialized roles with vector glyphs, ${Object.keys(ANNOTATION_CODE).length} compact annotation codes, no public code-registry story).`,
);
