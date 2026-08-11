import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access, mkdir, mkdtemp, readFile, rename, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const npmExecPath = process.env.npm_execpath;
const npm = npmExecPath ? process.execPath : (process.platform === 'win32' ? 'npm.cmd' : 'npm');

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

const temporaryRoot = await mkdtemp(path.join(tmpdir(), 'lds-robotics-pack-'));
try {
  const packArguments = [
    'pack',
    '--ignore-scripts',
    '--json',
    '--pack-destination',
    temporaryRoot,
  ];
  const { stdout } = await execFileAsync(
    npm,
    npmExecPath ? [npmExecPath, ...packArguments] : packArguments,
    { windowsHide: true, maxBuffer: 16 * 1024 * 1024 },
  );
  const packed = JSON.parse(stdout)[0];
  invariant(packed.name === '@lk-design-system/lds-robotics-ui', 'Packed Robotics package identity drift.');
  invariant(packed.files.some(({ path: file }) => file === 'AGENTS.md'), 'Packed package is missing AGENTS.md.');
  invariant(packed.files.some(({ path: file }) => file === 'CLAUDE.md'), 'Packed package is missing CLAUDE.md.');
  invariant(!packed.files.some(({ path: file }) => file.startsWith('vendor/')), 'Packed package must not contain development vendor tarballs.');

  const archive = path.join(temporaryRoot, packed.filename);
  const extractRoot = path.join(temporaryRoot, 'extract');
  await mkdir(extractRoot, { recursive: true });
  await execFileAsync('tar', ['-xf', archive, '-C', extractRoot], { windowsHide: true });

  const packageRoot = path.join(temporaryRoot, 'node_modules', '@lk-design-system', 'lds-robotics-ui');
  await mkdir(path.dirname(packageRoot), { recursive: true });
  await rename(path.join(extractRoot, 'package'), packageRoot);
  const requireFromConsumer = createRequire(path.join(temporaryRoot, 'consumer.cjs'));
  const packageName = '@lk-design-system/lds-robotics-ui';
  const specifiers = [
    `${packageName}/package.json`,
    `${packageName}/design-system.json`,
    `${packageName}/llms.txt`,
    `${packageName}/adoption-checklist.json`,
    `${packageName}/docs/adoption-report.schema.json`,
    `${packageName}/docs/adoption-report.example.json`,
    `${packageName}/docs/domain/ROBOTICS_UI_ADOPTION.md`,
    `${packageName}/docs/domain-symbol-registry.json`,
    `${packageName}/docs/tokens/manifest.json`,
  ];
  for (const specifier of specifiers) {
    const resolved = requireFromConsumer.resolve(specifier);
    await access(resolved);
    if (resolved.endsWith('.json')) JSON.parse(await readFile(resolved, 'utf8'));
  }

  const manifest = JSON.parse(await readFile(requireFromConsumer.resolve(`${packageName}/design-system.json`), 'utf8'));
  invariant(manifest.package?.version === packed.version, 'Installed documentation version differs from the tarball.');
  invariant(manifest.domain?.foundationStories?.length === 6, 'Installed package must expose six Robotics Foundation stories.');
  const docsRoot = path.dirname(requireFromConsumer.resolve(`${packageName}/design-system.json`));
  for (const record of manifest.documents ?? []) {
    const contents = await readFile(path.join(docsRoot, record.path));
    invariant(sha256(contents) === record.sha256, `Installed documentation hash drift: ${record.path}`);
  }

  console.log(`Validated isolated Robotics tarball documentation (${packed.entryCount} files, ${manifest.documents.length} hashed documents).`);
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
