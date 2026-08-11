import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsRoot = path.join(root, 'docs', 'package');
const snapshotRoot = path.join(root, '.lds-docs-upstream', 'core');

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function posix(value) {
  return value.replaceAll('\\', '/');
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function walk(directory, prefix = '') {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = posix(path.join(prefix, entry.name));
    if (entry.isDirectory()) files.push(...await walk(path.join(directory, entry.name), relative));
    else if (entry.isFile()) files.push(relative);
  }
  return files.sort();
}

function validateWith(schema, data, label) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  invariant(validate(data), `${label} failed schema validation:\n${ajv.errorsText(validate.errors, { separator: '\n' })}`);
}

function localTarget(reference, fromFile, containmentRoot = docsRoot) {
  const cleaned = reference.trim().replace(/^<|>$/g, '');
  if (!cleaned || /^(?:[a-z]+:|#|\/)/i.test(cleaned)) return undefined;
  const withoutFragment = cleaned.split(/[?#]/, 1)[0];
  if (!withoutFragment) return undefined;
  let decoded;
  try {
    decoded = decodeURIComponent(withoutFragment);
  } catch {
    throw new Error(`Invalid encoded documentation reference in ${posix(path.relative(root, fromFile))}: ${reference}`);
  }
  const target = path.resolve(path.dirname(fromFile), decoded);
  const relative = path.relative(containmentRoot, target);
  invariant(!relative.startsWith('..') && !path.isAbsolute(relative), `Documentation reference escapes its package boundary: ${reference}`);
  return target;
}

async function validateMarkdownLinks(files) {
  for (const relative of files.filter((file) => file.endsWith('.md'))) {
    const file = path.join(docsRoot, relative);
    const source = await readFile(file, 'utf8');
    for (const match of source.matchAll(/\]\(([^)]+)\)/g)) {
      const target = localTarget(match[1], file, root);
      if (!target) continue;
      invariant(await exists(target), `${relative} has an unresolved link: ${match[1]}`);
    }
  }
}

async function main() {
  await execFileAsync(process.execPath, [path.join(root, 'scripts', 'project-package-docs.mjs'), '--check'], {
    cwd: root,
    windowsHide: true,
  });

  const [packageManifest, manifest, checklist, contractSchema, reportSchema, reportExample, configSchema, snapshot] = await Promise.all([
    readJson(path.join(root, 'package.json')),
    readJson(path.join(docsRoot, 'manifest.json')),
    readJson(path.join(docsRoot, 'adoption-checklist.json')),
    readJson(path.join(docsRoot, 'LDS_UI_ADOPTION_CONTRACT.schema.json')),
    readJson(path.join(docsRoot, 'adoption-report.schema.json')),
    readJson(path.join(docsRoot, 'adoption-report.example.json')),
    readJson(path.join(docsRoot, 'adoption-config.schema.json')),
    readJson(path.join(docsRoot, 'upstream-snapshot.json')),
  ]);
  const roboticsRefStatus = packageManifest.lds?.refStatus ?? 'release-candidate';

  invariant(manifest.schemaVersion === 1 && manifest.kind === 'lds-package-documentation', 'Invalid Robotics package documentation identity.');
  invariant(JSON.stringify(manifest.package) === JSON.stringify({
    name: packageManifest.name,
    version: packageManifest.version,
    layer: 'robotics',
  }), 'Robotics documentation package identity or version drift.');
  invariant(packageManifest.files?.includes('docs/package'), 'package.json files must include docs/package.');
  for (const entrypoint of ['README.md', 'AGENTS.md', 'CLAUDE.md', 'llms.txt']) {
    invariant(packageManifest.files?.includes(entrypoint), `package.json files must include ${entrypoint}.`);
  }

  const [readme, agents, claude, rootLlms, docsIndex] = await Promise.all([
    readFile(path.join(root, 'README.md'), 'utf8'),
    readFile(path.join(root, 'AGENTS.md'), 'utf8'),
    readFile(path.join(root, 'CLAUDE.md'), 'utf8'),
    readFile(path.join(root, 'llms.txt'), 'utf8'),
    readFile(path.join(root, 'docs', 'README.md'), 'utf8'),
  ]);
  for (const [label, source] of [
    ['README.md', readme],
    ['AGENTS.md', agents],
    ['llms.txt', rootLlms],
  ]) {
    invariant(source.includes('docs/package/adoption-workflow.md'), `${label} must route to the packaged adoption workflow.`);
  }
  invariant(agents.includes('docs/package/domain/ROBOTICS_UI_ADOPTION.md'), 'AGENTS.md must route to the packaged Robotics adoption delta.');
  invariant(rootLlms.includes('docs/package/domain/ROBOTICS_UI_ADOPTION.md'), 'llms.txt must route to the packaged Robotics adoption delta.');
  invariant(await exists(path.join(docsRoot, 'domain', 'ROBOTICS_UI_ADOPTION.md')), 'The packaged Robotics adoption delta is missing.');
  invariant(claude.includes('@AGENTS.md'), 'CLAUDE.md must import the canonical AGENTS.md instructions.');
  invariant(docsIndex.includes('ROBOTICS_UI_ADOPTION.md') && docsIndex.includes('package/adoption-workflow.md'), 'docs/README.md must expose authored and generated adoption entrypoints.');

  const expectedExports = {
    './package.json': './package.json',
    './design-system.json': './docs/package/manifest.json',
    './llms.txt': './docs/package/llms.txt',
    './adoption-checklist.json': './docs/package/adoption-checklist.json',
    './docs/*': './docs/package/*',
  };
  for (const [specifier, target] of Object.entries(expectedExports)) {
    invariant(packageManifest.exports?.[specifier] === target, `${specifier} must export ${target}.`);
  }
  const expectedLds = {
    manifest: './docs/package/manifest.json',
    llms: './docs/package/llms.txt',
    adoptionChecklist: './docs/package/adoption-checklist.json',
    adoptionReportSchema: './docs/package/adoption-report.schema.json',
  };
  invariant(packageManifest.lds?.schemaVersion === 1 && packageManifest.lds?.layer === 'robotics', 'Invalid package.json lds metadata identity.');
  for (const [field, target] of Object.entries(expectedLds)) {
    invariant(packageManifest.lds?.[field] === target, `package.json lds.${field} must target ${target}.`);
  }
  invariant(
    packageManifest.homepage === manifest.publicDocs.storybook
      && packageManifest.lds.storybook === manifest.publicDocs.storybook,
    'package.json homepage/lds.storybook must match the documentation manifest Storybook entrypoint.',
  );

  const actualFiles = (await walk(docsRoot)).filter((file) => file !== 'manifest.json');
  const records = manifest.documents ?? [];
  invariant(JSON.stringify(actualFiles) === JSON.stringify(records.map(({ path: file }) => file).sort()), 'docs/package file set differs from manifest.documents.');
  for (const record of records) {
    const contents = await readFile(path.join(docsRoot, record.path));
    invariant(sha256(contents) === record.sha256, `Documentation hash drift: ${record.path}`);
  }

  invariant(snapshot.kind === 'lds-upstream-documentation-snapshot', 'Invalid upstream snapshot identity.');
  invariant(snapshot.package?.name === '@lk-design-system/lds-core', 'Snapshot is not sourced from LDS Core.');
  const snapshotFiles = await walk(snapshotRoot);
  invariant(JSON.stringify(snapshotFiles) === JSON.stringify(snapshot.files.map(({ path: file }) => file).sort()), 'Committed upstream snapshot file set drift.');
  for (const record of snapshot.files) {
    const source = await readFile(path.join(snapshotRoot, record.path));
    invariant(sha256(source) === record.sha256, `Committed upstream snapshot hash drift: ${record.path}`);
    const projected = await readFile(path.join(docsRoot, 'shared', record.path));
    invariant(source.equals(projected), `Shared package projection differs from upstream snapshot: ${record.path}`);
  }
  const upstreamManifestBytes = await readFile(path.join(snapshotRoot, 'manifest.json'));
  invariant(sha256(upstreamManifestBytes) === snapshot.manifestSha256, 'Upstream manifest SHA-256 drift.');
  const upstreamManifest = JSON.parse(upstreamManifestBytes.toString('utf8'));
  const canonical = upstreamManifest.source.documents.find(({ path: sourcePath }) => sourcePath === 'docs/references/adoption/LDS_UI_ADOPTION_CONTRACT.json');
  invariant(canonical, 'Upstream manifest omits canonical adoption contract provenance.');
  invariant(JSON.stringify(manifest.source.robotics) === JSON.stringify({
    repository: 'LK-Design-System/lk-design-system-robotics',
    ref: `v${packageManifest.version}`,
    refStatus: roboticsRefStatus,
  }), 'Robotics source identity/ref/status drift.');
  invariant(JSON.stringify(manifest.source.canonicalAdoption.source) === JSON.stringify({
    repository: upstreamManifest.source.repository,
    ref: upstreamManifest.source.ref,
    refStatus: 'release-candidate',
    path: canonical.path,
    sha256: canonical.sha256,
  }), 'Canonical adoption source identity/ref/hash drift.');
  invariant(manifest.source.canonicalAdoption.snapshotManifestSha256 === snapshot.manifestSha256, 'Manifest does not pin the committed snapshot manifest.');

  validateWith(contractSchema, checklist, 'Adoption checklist');
  validateWith(reportSchema, reportExample, 'Adoption report example');
  const configAjv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(configAjv);
  configAjv.compile(configSchema);
  invariant(checklist.$schema === './LDS_UI_ADOPTION_CONTRACT.schema.json', 'Checklist schema link must be package-relative.');
  invariant(reportExample.$schema === './adoption-report.schema.json', 'Report example schema link must be package-relative.');

  const machineReferences = [
    checklist.$schema,
    ...checklist.facets.flatMap(({ references }) => references),
    ...checklist.componentMapping.references,
    reportExample.$schema,
    ...Object.values(manifest.entrypoints),
    manifest.resources.tokens.path,
    manifest.resources.domainSymbols.path,
  ];
  for (const reference of machineReferences) {
    invariant(!reference.startsWith('@'), `Package snapshot must be self-contained, found package reference: ${reference}`);
    const target = localTarget(reference, path.join(docsRoot, 'adoption-checklist.json'));
    if (target) invariant(await exists(target), `Unresolved machine reference: ${reference}`);
  }

  for (const domain of manifest.domain.documents) {
    const output = await readFile(path.join(docsRoot, domain.path));
    invariant(sha256(output) === domain.sha256, `Robotics domain document hash drift: ${domain.path}`);
    const source = await readFile(path.join(root, domain.sourcePath));
    invariant(sha256(source) === domain.sourceSha256, `Robotics domain source hash drift: ${domain.sourcePath}`);
  }
  const storyIds = new Set();
  for (const story of manifest.domain.foundationStories) {
    invariant(!storyIds.has(story.storyId), `Duplicate Foundation story id: ${story.storyId}`);
    storyIds.add(story.storyId);
    const source = await readFile(path.join(root, story.source), 'utf8');
    invariant(/export\s+const\s+Overview\b/.test(source), `${story.source} does not expose Overview evidence.`);
  }
  invariant(storyIds.size === 6, `Expected six Robotics Foundation story ids, found ${storyIds.size}.`);

  const tokenManifest = await readJson(path.join(docsRoot, 'tokens', 'manifest.json'));
  invariant(tokenManifest.package.name === packageManifest.name && tokenManifest.package.version === packageManifest.version, 'Token manifest package identity drift.');
  for (const tokenSource of tokenManifest.sources) {
    const source = await readFile(path.join(root, tokenSource.path));
    invariant(sha256(source) === tokenSource.sha256, `Token source hash drift: ${tokenSource.path}`);
  }

  const registry = await readJson(path.join(docsRoot, 'domain-symbol-registry.json'));
  invariant(registry.package.name === packageManifest.name && registry.package.version === packageManifest.version, 'Domain symbol registry package identity drift.');
  const publicIndex = await readFile(path.join(root, 'src', 'index.js'), 'utf8');
  for (const glyph of registry.glyphs) {
    const source = await readFile(path.join(root, glyph.source.repositoryPath));
    invariant(sha256(source) === glyph.source.sha256, `Domain glyph source hash drift: ${glyph.id}`);
    for (const binding of glyph.publicBindings) {
      invariant(publicIndex.includes(binding.export), `Domain glyph public binding is absent from src/index.js: ${binding.export}`);
    }
    invariant(storyIds.has(glyph.storyId), `Domain glyph has an unknown Foundation story id: ${glyph.storyId}`);
  }

  await validateMarkdownLinks(actualFiles);
  console.log(`Validated ${actualFiles.length + 1} Robotics package docs: deterministic projection, strict schemas, hashes, self-contained refs, domain sources, tokens, symbols, and package identity.`);
}

await main();
