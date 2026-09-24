import { createHash } from 'node:crypto';

export const corePackage = '@lk-design-system/lds-core';

// The only Core documentation inputs Robotics derives output from. The rest of
// Core's docs reaches consumers through the lds-core peer package, so a Core
// documentation change outside this list needs no Robotics release. The Core
// release gate recomputes derivedInputsSha256 from these paths.
export const derivedInputs = [
  'LDS_UI_ADOPTION_CONTRACT.schema.json',
  'adoption-checklist.json',
  'adoption-config.schema.json',
  'adoption-report.example.json',
  'adoption-report.schema.json',
];

// Mirrors computeDerivedInputsFingerprint in lk-design-system
// scripts/robotics-canonical-snapshot.mjs; change both together.
export function derivedInputsFingerprint(inputs) {
  const lines = [...inputs]
    .sort((left, right) => left.path.localeCompare(right.path))
    .map(({ path: inputPath, sha256 }) => `${inputPath}\n${sha256}\n`)
    .join('');
  return createHash('sha256').update(lines).digest('hex');
}
