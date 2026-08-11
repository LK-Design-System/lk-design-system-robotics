import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'docs', 'package');
const target = path.join(root, '.storybook', 'public-docs');

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true, force: true });

// `manifest.json` is the installed-package filename. The public documentation
// convention uses `/design-system.json`; keep it as a byte-identical alias
// outside the manifest's own inventory to avoid a self-hash cycle.
await writeFile(
  path.join(target, 'design-system.json'),
  await readFile(path.join(source, 'manifest.json')),
);

console.log('Projected Robotics package documentation for Storybook static hosting.');
