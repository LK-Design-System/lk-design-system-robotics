import { createHash } from 'node:crypto';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const staticRoot = path.join(root, 'storybook-static');
const packageRoot = path.join(root, 'docs', 'package');
const publicBase = '/lk-design-system-robotics/';

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
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
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path.join(directory, entry.name), relative));
    else if (entry.isFile()) files.push(relative);
  }
  return files.sort();
}

function relativeTarget(owner, href) {
  const clean = href.split(/[?#]/, 1)[0];
  if (!clean || clean.startsWith('#') || /^[a-z][a-z+.-]*:/i.test(clean) || clean.startsWith('@')) return undefined;
  return path.resolve(path.dirname(owner), clean);
}

async function checkRelativeLinks(files) {
  for (const relative of files.filter((file) => /\.(?:md|txt)$/i.test(file))) {
    const owner = path.join(staticRoot, relative);
    const source = await readFile(owner, 'utf8');
    for (const match of source.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const raw = match[1].replace(/^<|>$/g, '');
      const target = relativeTarget(owner, raw);
      if (target) invariant(await exists(target), `${relative}: unresolved relative link ${raw}`);
    }
  }
}

async function checkJsonReferences(files) {
  for (const relative of files.filter((file) => file.endsWith('.json'))) {
    const owner = path.join(staticRoot, relative);
    let value;
    try {
      value = JSON.parse(await readFile(owner, 'utf8'));
    } catch {
      continue;
    }
    const refs = [];
    if (typeof value.$schema === 'string') refs.push(value.$schema);
    if (value.kind === 'lds-ui-adoption-contract') {
      for (const facet of value.facets ?? []) refs.push(...(facet.references ?? []));
      refs.push(...(value.componentMapping?.references ?? []));
    }
    if (value.kind === 'lds-package-documentation') refs.push(...Object.values(value.entrypoints ?? {}));
    for (const ref of refs) {
      const target = relativeTarget(owner, ref);
      if (target) invariant(await exists(target), `${relative}: unresolved JSON reference ${ref}`);
    }
  }
}

const manifestBytes = await readFile(path.join(staticRoot, 'manifest.json'));
const aliasBytes = await readFile(path.join(staticRoot, 'design-system.json'));
invariant(manifestBytes.equals(aliasBytes), 'Public design-system.json must be byte-identical to package manifest.json.');
const manifest = JSON.parse(manifestBytes);
invariant(manifest.package?.name === '@lk-design-system/lds-robotics-ui', 'Public documentation package identity drift.');
const storybookIndex = JSON.parse(await readFile(path.join(staticRoot, 'index.json'), 'utf8'));
const storyIds = new Set(Object.keys(storybookIndex.entries ?? {}));
for (const story of manifest.domain?.foundationStories ?? []) {
  invariant(storyIds.has(story.storyId), `Declared Robotics Foundation story is absent from the built index: ${story.storyId}.`);
}

for (const record of manifest.documents ?? []) {
  const file = path.join(staticRoot, record.path);
  invariant(await exists(file), `Public bundle is missing ${record.path}.`);
  invariant(sha256(await readFile(file)) === record.sha256, `Public bundle hash drift: ${record.path}.`);
}

for (const [key, rawUrl] of Object.entries(manifest.publicDocs ?? {})) {
  if (key === 'storybook') continue;
  const url = new URL(rawUrl);
  invariant(url.pathname.startsWith(publicBase), `publicDocs.${key} escapes the Robotics Pages base path.`);
  const relative = decodeURIComponent(url.pathname.slice(publicBase.length));
  invariant(relative && await exists(path.join(staticRoot, relative)), `publicDocs.${key} does not resolve in Storybook: ${relative || '/'}.`);
}

const files = await walk(staticRoot);
await checkRelativeLinks(files);
await checkJsonReferences(files);

for (const required of [
  'design-system.json',
  'llms.txt',
  'adoption-checklist.json',
  'adoption-report.schema.json',
  'adoption-report.example.json',
  'adoption-workflow.md',
  'domain-symbol-registry.json',
  'tokens/manifest.json',
]) invariant(files.includes(required), `Storybook public documentation is missing ${required}.`);

const sourceManifest = await readFile(path.join(packageRoot, 'manifest.json'));
invariant(sourceManifest.equals(manifestBytes), 'Built Storybook documentation differs from the package projection.');

console.log(`Validated Robotics Storybook documentation (${manifest.documents.length} hashed documents, ${files.length} public files).`);
