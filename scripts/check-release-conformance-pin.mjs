import { createHash } from 'node:crypto';
import { realpath, readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { derivedInputsFingerprint } from './derived-inputs.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function git(root, args) {
  const result = spawnSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
    windowsHide: true,
  });
  if (result.error) throw result.error;
  invariant(result.status === 0, result.stderr.trim() || `git ${args.join(' ')} failed.`);
  return result.stdout.trim();
}

function sha256(contents) {
  return createHash('sha256').update(contents).digest('hex');
}

async function requireFile(file, label) {
  const metadata = await stat(file).catch(() => null);
  invariant(metadata?.isFile(), `${label} is missing: ${file}`);
}

const expectedSha = process.env.LDS_CONFORMANCE_SHA?.toLowerCase();
invariant(/^[0-9a-f]{40}$/.test(expectedSha ?? ''), 'LDS_CONFORMANCE_SHA must be an exact 40-character Git commit SHA.');

const ldsRootInput = process.env.LDS_CONFORMANCE_ROOT;
const cliInput = process.env.LDS_CONFORMANCE_CLI;
invariant(ldsRootInput && cliInput, 'LDS_CONFORMANCE_ROOT and LDS_CONFORMANCE_CLI are required.');

const ldsRoot = await realpath(path.resolve(ldsRootInput));
const cli = await realpath(path.resolve(cliInput));
const expectedCli = await realpath(path.join(ldsRoot, 'packages', 'conformance', 'src', 'cli.mjs'));
invariant(cli === expectedCli, 'LDS_CONFORMANCE_CLI must be the CLI inside the pinned LDS checkout.');
invariant(git(ldsRoot, ['rev-parse', 'HEAD']).toLowerCase() === expectedSha, 'The LDS checkout HEAD does not match LDS_CONFORMANCE_SHA.');
invariant(git(ldsRoot, ['status', '--porcelain=v1']).length === 0, 'The pinned LDS checkout must be clean.');

// Robotics pins only the Core inputs it derives output from. The pinned LDS
// checkout must still hold those exact bytes; the rest of Core's docs may
// have moved on without a Robotics release.
const upstreamDocsRoot = path.join(ldsRoot, 'packages', 'core', 'docs');
const snapshotPath = path.join(repositoryRoot, 'docs', 'package', 'upstream-snapshot.json');
await requireFile(snapshotPath, 'Robotics derived-input snapshot record');
const snapshot = JSON.parse(await readFile(snapshotPath, 'utf8'));
invariant(snapshot.kind === 'lds-upstream-derived-inputs', 'Robotics snapshot record is not a derived-input record.');
invariant(
  snapshot.inputs.some(({ path: relative }) => relative === 'adoption-checklist.json'),
  'Derived inputs must include adoption-checklist.json.',
);
for (const record of snapshot.inputs) {
  invariant(
    typeof record.path === 'string'
      && !path.posix.isAbsolute(record.path)
      && !path.posix.normalize(record.path).startsWith('../')
      && /^[0-9a-f]{64}$/.test(record.sha256),
    `Invalid Core derived-input record: ${JSON.stringify(record)}`,
  );
  const file = path.join(upstreamDocsRoot, ...record.path.split('/'));
  await requireFile(file, `Pinned Core derived input ${record.path}`);
  invariant(sha256(await readFile(file)) === record.sha256, `Pinned Core derived input drift: ${record.path}`);
}
invariant(
  derivedInputsFingerprint(snapshot.inputs) === snapshot.derivedInputsSha256,
  'Robotics derived-input fingerprint does not match its records.',
);

console.log(`Validated immutable LDS release conformance pin ${expectedSha} and ${snapshot.inputs.length} Core derived inputs.`);
