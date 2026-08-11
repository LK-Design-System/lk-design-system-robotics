import { createHash } from 'node:crypto';
import { realpath, readFile, readdir, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

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

function posix(value) {
  return value.replaceAll('\\', '/');
}

async function walk(directory, prefix = '') {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = posix(path.join(prefix, entry.name));
    if (entry.isDirectory()) files.push(...await walk(path.join(directory, entry.name), relative));
    else if (entry.isFile()) files.push(relative);
    else throw new Error(`Pinned Core documentation contains a non-file entry: ${relative}`);
  }
  return files.sort();
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

const upstreamManifestPath = path.join(ldsRoot, 'packages', 'core', 'docs', 'manifest.json');
const upstreamDocsRoot = path.dirname(upstreamManifestPath);
const snapshotPath = path.join(repositoryRoot, 'docs', 'package', 'upstream-snapshot.json');
await requireFile(upstreamManifestPath, 'Pinned Core documentation manifest');
await requireFile(snapshotPath, 'Robotics documentation snapshot record');

const [upstreamManifest, snapshot] = await Promise.all([
  readFile(upstreamManifestPath),
  readFile(snapshotPath, 'utf8').then(JSON.parse),
]);
invariant(
  sha256(upstreamManifest) === snapshot.manifestSha256,
  'The pinned LDS checkout did not produce the committed Robotics Core documentation snapshot.',
);

const expectedFiles = snapshot.files.map(({ path: relative }) => relative).sort();
const actualFiles = await walk(upstreamDocsRoot);
invariant(
  JSON.stringify(actualFiles) === JSON.stringify(expectedFiles),
  'The pinned Core documentation file set differs from the committed Robotics snapshot.',
);
for (const record of snapshot.files) {
  invariant(
    typeof record.path === 'string'
      && !path.posix.isAbsolute(record.path)
      && !path.posix.normalize(record.path).startsWith('../')
      && /^[0-9a-f]{64}$/.test(record.sha256),
    `Invalid Core documentation snapshot record: ${JSON.stringify(record)}`,
  );
  const contents = await readFile(path.join(upstreamDocsRoot, ...record.path.split('/')));
  invariant(sha256(contents) === record.sha256, `Pinned Core documentation drift: ${record.path}`);
}

console.log(`Validated immutable LDS release conformance pin ${expectedSha} and ${actualFiles.length} Core documentation files.`);
