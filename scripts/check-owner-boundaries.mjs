import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

const productOwnedModules = [
  'src/components/editor/CanvasEditorCommandBar',
  'src/components/editor/CanvasEditorShell',
  'src/components/editor/EditorToolbar',
  'src/components/editor/HistoryToolbar',
  'src/components/editor/LayerPanel',
  'src/components/editor/SelectionInspector',
  'src/components/editor/ViewportStatusBar',
  'src/components/navigation/FloorSelector',
  'src/components/robotics/BatteryGauge',
  'src/components/robotics/ConnectionBadge',
  'src/components/robotics/EquipmentStatusCard',
  'src/components/viz/Map2DCanvas',
  'src/components/viz/Scene3DFrame',
  'src/components/viz/TelemetryGauge',
  'src/components/viz/TelemetryValue',
  'src/components/viz/VideoStreamTile',
  'src/components/viz/ViewerFrame',
  'src/components/viz/ViewerToolbar',
];

const productOwnedStories = [
  'EditorCommandBar.stories.jsx',
  'EditorHistoryToolbar.stories.jsx',
  'EditorLayerPanel.stories.jsx',
  'EditorSelectionInspector.stories.jsx',
  'EditorShell.stories.jsx',
  'EditorToolbar.stories.jsx',
  'EditorViewportStatusBar.stories.jsx',
  'RoboticsBatteryGauge.stories.jsx',
  'RoboticsConnectionBadge.stories.jsx',
  'RoboticsEquipment.stories.jsx',
  'RoboticsTelemetryGauge.stories.jsx',
  'RoboticsTelemetryValue.stories.jsx',
  'Viewer3D.stories.jsx',
  'ViewerFloorSelector.stories.jsx',
  'ViewerFrame.stories.jsx',
  'ViewerMap.stories.jsx',
  'ViewerToolbar.stories.jsx',
  'ViewerVideo.stories.jsx',
];

function fail(message) {
  failures.push(message);
}

async function collect(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collect(absolute));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

function namedImports(source, specifier) {
  const escaped = specifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*['"]${escaped}['"]`, 'g');
  return [...source.matchAll(pattern)].flatMap((match) =>
    match[1]
      .split(',')
      .map((entry) => entry.trim().split(/\s+as\s+/)[0])
      .filter(Boolean)
  );
}

const indexPath = path.join(root, 'src', 'index.js');
const indexSource = await readFile(indexPath, 'utf8');
const localExports = new Set(
  [...indexSource.matchAll(/export\s+\{([^}]+)\}\s+from/g)].flatMap((match) =>
    match[1]
      .split(',')
      .map((entry) => entry.trim().split(/\s+as\s+/).at(-1))
      .filter(Boolean)
  ),
);

for (const modulePath of productOwnedModules) {
  for (const extension of ['.jsx', '.d.ts']) {
    if (existsSync(path.join(root, `${modulePath}${extension}`))) {
      fail(`${modulePath}${extension} is Product-owned and must not be implemented or re-exported by Robotics.`);
    }
  }
}

const storiesRoot = path.join(root, 'stories');
const storyFiles = (await collect(storiesRoot)).filter((file) => file.endsWith('.stories.jsx'));
for (const storyPath of storyFiles) {
  const relative = path.relative(root, storyPath).replaceAll('\\', '/');
  const source = await readFile(storyPath, 'utf8');
  const title = source.match(/\btitle:\s*['"]([^'"]+)['"]/)?.[1];
  if (!title?.startsWith('LDS Robotics/')) {
    fail(`${relative} must use an LDS Robotics/* Storybook title.`);
  }
  if (/from\s*['"]\.\/lds\.js['"]/.test(source)) {
    fail(`${relative} imports the removed aggregate stories/lds.js; import the owning package directly.`);
  }
  for (const imported of namedImports(source, '../src/index.js')) {
    if (!localExports.has(imported)) {
      fail(`${relative} imports ${imported} from Robotics even though it is not in the Robotics public surface.`);
    }
  }
}

for (const filename of productOwnedStories) {
  if (existsSync(path.join(storiesRoot, filename))) {
    fail(`stories/${filename} is Product-owned; its canonical story belongs in the main LDS Storybook.`);
  }
}

if (existsSync(path.join(storiesRoot, 'lds.js'))) {
  fail('stories/lds.js must not recreate a cross-owner aggregate entrypoint.');
}

const storyGuidePath = path.join(storiesRoot, 'StoryGuide.shared.jsx');
const storyGuideSource = await readFile(storyGuidePath, 'utf8');
if (!/import\s*\{\s*PageHeader\s*\}\s*from\s*['"]@lk-design-system\/lds-product['"]/.test(storyGuideSource)) {
  fail('stories/StoryGuide.shared.jsx must use the LDS Product PageHeader contract.');
}
if (/<h1\b/.test(storyGuideSource)) {
  fail('stories/StoryGuide.shared.jsx must not maintain a private h1 treatment.');
}

const previewPath = path.join(root, '.storybook', 'preview.jsx');
const previewSource = await readFile(previewPath, 'utf8');
if (!/from\s*['"]@lk-design-system\/lds-product\/storybook['"]/.test(previewSource)) {
  fail('.storybook/preview.jsx must consume the main LDS Storybook Docs surface.');
}
if (/\b(?:DOCS_SURFACE|DOCS_MOTION|guideShell)\b/.test(previewSource)) {
  fail('.storybook/preview.jsx must not copy the main LDS Docs style or layout contract.');
}
if (!/<LdsStorybookDecisionGuide\b/.test(previewSource)) {
  fail('.storybook/preview.jsx must render the shared LDS decision-guide section in Docs.');
}
if (!/description=\{guide\.docsDescription\s*\?\?\s*guide\.description\}/.test(previewSource)) {
  fail('.storybook/preview.jsx must keep detailed copy in Docs while Canvas consumes the concise description.');
}
const docsPageSource = previewSource.match(
  /function\s+RoboticsGuideDocsPage\(\)\s*\{([\s\S]*?)\n\}\n\nexport const decorators/,
)?.[1] ?? '';
if (/<StoryGuide\b/.test(docsPageSource)) {
  fail('RoboticsGuideDocsPage must not repeat the Canvas PageHeader inside Docs.');
}

const storybookIndexArgument = process.argv.findIndex((argument) => argument === '--storybook-index');
const storybookIndexInline = process.argv.find((argument) => argument.startsWith('--storybook-index='));
const storybookIndex = storybookIndexInline?.slice('--storybook-index='.length)
  ?? (storybookIndexArgument >= 0 ? process.argv[storybookIndexArgument + 1] : null);
if (storybookIndex) {
  const index = JSON.parse(await readFile(path.resolve(root, storybookIndex), 'utf8'));
  const entries = Object.values(index.entries || index.stories || {});
  for (const entry of entries) {
    if (!entry.title?.startsWith('LDS Robotics/')) {
      fail(`Built Storybook entry ${entry.id || entry.name} is outside the LDS Robotics owner tree.`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.map((message) => `[OWNER_BOUNDARY] ${message}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Robotics owner boundaries passed (${localExports.size} public exports, ${storyFiles.length} story modules).`);
}
