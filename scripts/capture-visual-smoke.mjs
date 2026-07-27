import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { chromium } from '@playwright/test';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const root = process.cwd();
const staticDir = path.join(root, 'storybook-static');
const outDir = path.join(root, 'visual-artifacts', 'smoke');
// Keep the migrated Windows baselines stable while CI compares screenshots
// against captures produced by the same Linux rendering stack.
const baselineSet = process.platform === 'linux' ? 'smoke-linux' : 'smoke';
const baselineDir = path.join(root, 'visual-baselines', baselineSet);
const diffDir = path.join(root, 'visual-artifacts', 'smoke-diff');
const updateBaseline = process.argv.includes('--update-baseline');
const checkBaseline = process.argv.includes('--check');
const onlyArguments = process.argv.filter((argument) => argument.startsWith('--only='));
const maxDiffRatio = Number(process.env.VISUAL_MAX_DIFF_RATIO || 0.01);

if (updateBaseline && checkBaseline) {
  throw new Error('Choose either --update-baseline or --check, not both.');
}
if (onlyArguments.length > 1) {
  throw new Error('Pass at most one comma-separated --only= capture list.');
}
if (onlyArguments.length > 0 && !updateBaseline && !checkBaseline) {
  throw new Error('--only= is supported with --update-baseline or --check.');
}

// These are the Robotics-owned captures that moved out of the LDS root repo.
// Match stories by their real split-repository importPath/exportName pair so a
// renamed or removed story fails loudly instead of silently changing coverage.
const targets = [
  {
    name: 'react-robotics-viz',
    match: { importPath: './stories/RoboticsAndViz.stories.jsx', exportName: 'RobotState' },
    viewport: { width: 1180, height: 820 },
  },
  {
    name: 'robotics-navigation-viewer',
    match: { importPath: './stories/RoboticsViewerNavigationViewer.stories.jsx', exportName: 'Overview' },
    viewport: { width: 1180, height: 820 },
  },
  {
    name: 'robotics-navigation-viewer-narrow',
    match: { importPath: './stories/RoboticsViewerNavigationViewer.stories.jsx', exportName: 'NarrowViewport' },
    viewport: { width: 320, height: 720 },
  },
  {
    name: 'robotics-occupancy-map',
    match: { importPath: './stories/RoboticsViewerOccupancyMap.stories.jsx', exportName: 'Overview' },
    viewport: { width: 900, height: 620 },
  },
];

const ATOM_ZOOM = 8;

// Tiny map symbols need their own true-size and nearest-neighbour zoomed
// captures. Full-story screenshots alone do not protect their legibility.
const atomTargets = [
  { name: 'atom-facility-lift-marker', match: { importPath: './stories/RoboticsNavigationFacilities.stories.jsx', exportName: 'FacilityTransitionOverview' }, selector: '[data-transition-kind="lift"] [data-transition-marker]', clip: 46, viewport: { width: 900, height: 720 } },
  { name: 'atom-facility-lift-marker-dark', match: { importPath: './stories/RoboticsNavigationFacilities.stories.jsx', exportName: 'AvailabilityAndSourceStates' }, selector: '[data-transition-kind="lift"] [data-transition-marker]', clip: 46, viewport: { width: 980, height: 760 } },
  { name: 'atom-facility-door-marker', match: { importPath: './stories/RoboticsNavigationFacilities.stories.jsx', exportName: 'AvailabilityAndSourceStates' }, selector: '[data-transition-kind="door"] [data-transition-marker]', clip: 46, viewport: { width: 980, height: 760 } },
  { name: 'atom-facility-dock-marker', match: { importPath: './stories/RoboticsNavigationFacilities.stories.jsx', exportName: 'AvailabilityAndSourceStates' }, selector: '[data-transition-kind="dock"] [data-transition-marker]', clip: 46, viewport: { width: 980, height: 760 } },
  { name: 'atom-waypoint-point', match: { importPath: './stories/RoboticsNavigationWaypoint.stories.jsx', exportName: 'Overview' }, selector: '[data-waypoint-id="wp-holding"][data-selected="false"] [data-waypoint-point]', clip: 28, viewport: { width: 900, height: 720 } },
  // State-glyph shapes are captured from the State Badge catalog — the single
  // canonical source that renders all 11 shapes. (Lifecycle/availability/
  // condition states no longer render as badges on route/lane/trajectory; the
  // line carries them via NAV_PATH_DASH, so their shape lives only here now.)
  { name: 'atom-glyph-unknown', match: { importPath: './stories/RoboticsFoundationStateBadge.stories.jsx', exportName: 'Overview' }, selector: '[data-state-badge-catalog] section:first-of-type [data-navigation-state-glyph="unknown"]', clip: 34, viewport: { width: 900, height: 900 } },
  { name: 'atom-glyph-conflict', match: { importPath: './stories/RoboticsFoundationStateBadge.stories.jsx', exportName: 'Overview' }, selector: '[data-state-badge-catalog] section:first-of-type [data-navigation-state-glyph="conflict"]', clip: 34, viewport: { width: 900, height: 900 } },
  { name: 'atom-glyph-closed', match: { importPath: './stories/RoboticsFoundationStateBadge.stories.jsx', exportName: 'Overview' }, selector: '[data-state-badge-catalog] section:first-of-type [data-navigation-state-glyph="closed"]', clip: 34, viewport: { width: 900, height: 900 } },
  { name: 'atom-glyph-invalid', match: { importPath: './stories/RoboticsFoundationStateBadge.stories.jsx', exportName: 'Overview' }, selector: '[data-state-badge-catalog] section:first-of-type [data-navigation-state-glyph="invalid"]', clip: 34, viewport: { width: 900, height: 900 } },
  { name: 'atom-glyph-waiting', match: { importPath: './stories/RoboticsFoundationStateBadge.stories.jsx', exportName: 'Overview' }, selector: '[data-state-badge-catalog] section:first-of-type [data-navigation-state-glyph="waiting"]', clip: 34, viewport: { width: 900, height: 900 } },
  { name: 'atom-glyph-completed', match: { importPath: './stories/RoboticsFoundationStateBadge.stories.jsx', exportName: 'Overview' }, selector: '[data-state-badge-catalog] section:first-of-type [data-navigation-state-glyph="completed"]', clip: 34, viewport: { width: 900, height: 900 } },
  { name: 'atom-glyph-rerouting', match: { importPath: './stories/RoboticsFoundationStateBadge.stories.jsx', exportName: 'Overview' }, selector: '[data-state-badge-catalog] section:first-of-type [data-navigation-state-glyph="rerouting"]', clip: 34, viewport: { width: 900, height: 900 } },
  { name: 'atom-glyph-stale', match: { importPath: './stories/RoboticsFoundationStateBadge.stories.jsx', exportName: 'Overview' }, selector: '[data-state-badge-catalog] section:first-of-type [data-navigation-state-glyph="stale"]', clip: 34, viewport: { width: 900, height: 900 } },
];

const requestedCaptureNames = onlyArguments.length === 0
  ? null
  : onlyArguments[0].slice('--only='.length).split(',').map((name) => name.trim()).filter(Boolean);
const knownCaptureNames = new Set([
  ...targets.map(({ name }) => name),
  ...atomTargets.flatMap(({ name }) => [name, `${name}@${ATOM_ZOOM}x`]),
]);
const atomCaptureNames = new Set(atomTargets.map(({ name }) => name));
const selectedCaptureNames = requestedCaptureNames === null
  ? null
  : new Set(requestedCaptureNames.flatMap((name) => (
    atomCaptureNames.has(name) ? [name, `${name}@${ATOM_ZOOM}x`] : [name]
  )));

if (selectedCaptureNames?.size === 0) {
  throw new Error('--only= must name at least one capture.');
}
for (const name of selectedCaptureNames || []) {
  if (!knownCaptureNames.has(name)) {
    throw new Error(`Unknown visual capture in --only=: ${name}`);
  }
}

function shouldCapture(name) {
  return selectedCaptureNames === null || selectedCaptureNames.has(name);
}

function shouldCaptureAtom(name) {
  return shouldCapture(name) || shouldCapture(`${name}@${ATOM_ZOOM}x`);
}

function contentType(filePath) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.json')) return 'application/json; charset=utf-8';
  if (filePath.endsWith('.svg')) return 'image/svg+xml';
  if (filePath.endsWith('.png')) return 'image/png';
  if (filePath.endsWith('.webp')) return 'image/webp';
  if (filePath.endsWith('.woff2')) return 'font/woff2';
  return 'application/octet-stream';
}

function startStaticServer() {
  const server = createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url || '/', 'http://127.0.0.1');
      const safePath = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, '') || 'index.html';
      const filePath = path.resolve(staticDir, safePath);
      if (!filePath.startsWith(staticDir)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      const fileStat = await stat(filePath);
      if (!fileStat.isFile()) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      res.writeHead(200, { 'content-type': contentType(filePath) });
      createReadStream(filePath).pipe(res);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({ server, origin: `http://127.0.0.1:${address.port}` });
    });
  });
}

function findStoryId(entries, target) {
  const found = Object.values(entries).find(
    (entry) =>
      entry.type === 'story' &&
      entry.importPath === target.match.importPath &&
      entry.exportName === target.match.exportName
  );
  if (!found) {
    throw new Error(`Unable to find Storybook entry for ${target.name}: ${JSON.stringify(target.match)}`);
  }
  return found.id;
}

function storyUrl(origin, id, query = {}) {
  const params = new URLSearchParams({ id, viewMode: 'story' });
  for (const [key, value] of Object.entries(query)) params.set(key, value);
  return `${origin}/iframe.html?${params.toString()}`;
}

async function sha256(filePath) {
  const hash = createHash('sha256');
  await new Promise((resolve, reject) => {
    createReadStream(filePath)
      .on('data', (chunk) => hash.update(chunk))
      .on('error', reject)
      .on('end', resolve);
  });
  return hash.digest('hex');
}

async function compareScreenshot(name, actualPath) {
  const baselinePath = path.join(baselineDir, `${name}.png`);
  let baselineBuffer;
  try {
    baselineBuffer = await readFile(baselinePath);
  } catch {
    throw new Error(`Missing visual baseline: ${path.relative(root, baselinePath)}. Run npm run update:visual-baseline.`);
  }

  const actual = PNG.sync.read(await readFile(actualPath));
  const baseline = PNG.sync.read(baselineBuffer);
  if (actual.width !== baseline.width || actual.height !== baseline.height) {
    throw new Error(
      `${name} changed dimensions: baseline ${baseline.width}x${baseline.height}, actual ${actual.width}x${actual.height}`
    );
  }

  const diff = new PNG({ width: actual.width, height: actual.height });
  const differentPixels = pixelmatch(
    baseline.data,
    actual.data,
    diff.data,
    actual.width,
    actual.height,
    { threshold: 0.1, includeAA: false }
  );
  const totalPixels = actual.width * actual.height;
  const diffRatio = differentPixels / totalPixels;
  if (differentPixels > 0) {
    await mkdir(diffDir, { recursive: true });
    await writeFile(path.join(diffDir, `${name}.png`), PNG.sync.write(diff));
  }
  return { differentPixels, totalPixels, diffRatio };
}

function upscaleNearest(buffer, factor) {
  const src = PNG.sync.read(buffer);
  const dst = new PNG({ width: src.width * factor, height: src.height * factor });
  for (let y = 0; y < dst.height; y += 1) {
    const sourceRow = Math.floor(y / factor);
    for (let x = 0; x < dst.width; x += 1) {
      const sourceCol = Math.floor(x / factor);
      const si = (src.width * sourceRow + sourceCol) << 2;
      const di = (dst.width * y + x) << 2;
      dst.data[di] = src.data[si];
      dst.data[di + 1] = src.data[si + 1];
      dst.data[di + 2] = src.data[si + 2];
      dst.data[di + 3] = src.data[si + 3];
    }
  }
  return PNG.sync.write(dst);
}

async function loadStoryReady(page, url, name, runtimeErrors) {
  runtimeErrors.length = 0;
  await page.goto(url, { waitUntil: 'networkidle' });
  const readinessHandle = await page.waitForFunction(() => {
    const rootElement = document.querySelector('#storybook-root');
    const bodyText = document.body?.innerText || '';
    const hasStoryError = bodyText.includes('The component failed to render properly')
      || bodyText.includes('Cannot access');
    if (hasStoryError) return { status: 'error', bodyText: bodyText.slice(0, 600) };
    if (rootElement?.children.length) return { status: 'ready' };
    return null;
  }, undefined, { timeout: 30000 });
  const readiness = await readinessHandle.jsonValue();
  if (readiness.status === 'error') {
    throw new Error(`${name} failed to render: ${readiness.bodyText}`);
  }
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
  });
  await page.waitForTimeout(600);
  if (runtimeErrors.length > 0) {
    throw new Error(`${name} emitted runtime errors: ${runtimeErrors.join(' | ')}`);
  }
}

async function applyTargetTheme(page, target) {
  if (!target.theme) return;
  const applied = await page.evaluate((theme) => {
    const storyRoot = document.querySelector('#storybook-root');
    const shell = storyRoot?.querySelector(':scope > [data-theme]') || storyRoot?.querySelector('[data-theme]');
    if (!shell) return false;
    shell.dataset.theme = theme;
    shell.classList.remove('theme-light', 'theme-dark');
    shell.classList.add(`theme-${theme}`);
    return true;
  }, target.theme);
  if (!applied) {
    throw new Error(`${target.name} could not apply its ${target.theme} capture theme.`);
  }
  await page.waitForTimeout(50);
}

async function captureAtom(page, atom, outputDirectory) {
  const element = await page.$(atom.selector);
  if (!element) {
    throw new Error(`Atom "${atom.name}": selector ${atom.selector} not found.`);
  }
  await element.scrollIntoViewIfNeeded();
  const box = await element.boundingBox();
  if (!box || box.width < 1 || box.height < 1) {
    throw new Error(`Atom "${atom.name}": element has no visible bounding box.`);
  }
  const clipSize = atom.clip || 40;
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  const clip = {
    x: Math.max(0, Math.round(centerX - clipSize / 2)),
    y: Math.max(0, Math.round(centerY - clipSize / 2)),
    width: clipSize,
    height: clipSize,
  };
  const truePath = path.join(outputDirectory, `${atom.name}.png`);
  await page.screenshot({ path: truePath, clip, animations: 'disabled' });
  const zoomName = `${atom.name}@${ATOM_ZOOM}x`;
  await writeFile(path.join(outputDirectory, `${zoomName}.png`), upscaleNearest(await readFile(truePath), ATOM_ZOOM));
  return [atom.name, zoomName];
}

async function closeServer(server) {
  if (!server) return;
  await new Promise((resolve) => server.close(resolve));
}

async function main() {
  const indexPath = path.join(staticDir, 'index.json');
  const index = JSON.parse(await readFile(indexPath, 'utf8'));
  await mkdir(outDir, { recursive: true });
  let existingBaselineManifest = null;
  if (updateBaseline && selectedCaptureNames !== null) {
    const baselineManifestPath = path.join(baselineDir, 'manifest.json');
    existingBaselineManifest = JSON.parse(await readFile(baselineManifestPath, 'utf8'));
    const existingNames = new Set(existingBaselineManifest.captures.map(({ name }) => name));
    const missingNames = [...selectedCaptureNames].filter((name) => !existingNames.has(name));
    if (missingNames.length > 0) {
      throw new Error(
        `Selective baseline update only replaces existing manifest entries. Missing: ${missingNames.join(', ')}`
      );
    }
  }

  let server;
  let browser;
  let page;
  const runtimeErrors = [];
  const manifest = {
    generatedAt: new Date().toISOString(),
    storybookStatic: 'storybook-static',
    count: selectedCaptureNames?.size ?? targets.length + atomTargets.length * 2,
    captures: [],
  };
  const regressions = [];

  try {
    const staticServer = await startStaticServer();
    server = staticServer.server;
    browser = await chromium.launch();
    page = await browser.newPage({ viewport: targets[0].viewport, deviceScaleFactor: 1 });
    page.on('pageerror', (error) => runtimeErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') runtimeErrors.push(message.text());
    });

    for (const target of targets) {
      if (!shouldCapture(target.name)) continue;
      const id = findStoryId(index.entries, target);
      await page.setViewportSize(target.viewport);
      const url = storyUrl(staticServer.origin, id, target.query);
      await loadStoryReady(page, url, target.name, runtimeErrors);
      await applyTargetTheme(page, target);

      const outputPath = path.join(outDir, `${target.name}.png`);
      await page.screenshot({ path: outputPath, fullPage: true, animations: 'disabled' });
      const fileStat = await stat(outputPath);
      if (fileStat.size < 1024) {
        throw new Error(`Screenshot is unexpectedly small: ${outputPath} (${fileStat.size} bytes)`);
      }

      manifest.captures.push({
        name: target.name,
        id,
        query: target.query || {},
        viewport: target.viewport,
        path: path.relative(root, outputPath).replaceAll('\\', '/'),
        bytes: fileStat.size,
        sha256: await sha256(outputPath),
      });

      if (updateBaseline) {
        await mkdir(baselineDir, { recursive: true });
        await copyFile(outputPath, path.join(baselineDir, `${target.name}.png`));
      } else if (checkBaseline) {
        const comparison = await compareScreenshot(target.name, outputPath);
        manifest.captures.at(-1).comparison = comparison;
        const percent = (comparison.diffRatio * 100).toFixed(3);
        console.log(`${target.name}: ${percent}% pixel difference`);
        if (comparison.diffRatio > maxDiffRatio) {
          regressions.push(`${target.name} ${percent}% > ${(maxDiffRatio * 100).toFixed(3)}%`);
        }
      }
    }

    for (const atom of atomTargets) {
      if (!shouldCaptureAtom(atom.name)) continue;
      const id = findStoryId(index.entries, atom);
      await page.setViewportSize(atom.viewport);
      await loadStoryReady(page, storyUrl(staticServer.origin, id, atom.query), atom.name, runtimeErrors);
      const captureNames = await captureAtom(page, atom, outDir);
      for (const captureName of captureNames) {
        if (!shouldCapture(captureName)) continue;
        const capturePath = path.join(outDir, `${captureName}.png`);
        const fileStat = await stat(capturePath);
        manifest.captures.push({
          name: captureName,
          id,
          atom: true,
          selector: atom.selector,
          query: atom.query || {},
          viewport: atom.viewport,
          path: path.relative(root, capturePath).replaceAll('\\', '/'),
          bytes: fileStat.size,
          sha256: await sha256(capturePath),
        });
        if (updateBaseline) {
          await mkdir(baselineDir, { recursive: true });
          await copyFile(capturePath, path.join(baselineDir, `${captureName}.png`));
        } else if (checkBaseline) {
          const comparison = await compareScreenshot(captureName, capturePath);
          manifest.captures.at(-1).comparison = comparison;
          const percent = (comparison.diffRatio * 100).toFixed(3);
          console.log(`${captureName}: ${percent}% pixel difference`);
          if (comparison.diffRatio > maxDiffRatio) {
            regressions.push(`${captureName} ${percent}% > ${(maxDiffRatio * 100).toFixed(3)}%`);
          }
        }
      }
    }
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
    await closeServer(server);
  }

  const manifestPath = path.join(outDir, 'manifest.json');
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  if (updateBaseline) {
    const updatedCaptures = manifest.captures.map(({ name, id, query, viewport, bytes, sha256 }) => ({
      name,
      id,
      query,
      viewport,
      bytes,
      sha256,
    }));
    const baselineManifest = existingBaselineManifest === null
      ? {
          schemaVersion: 1,
          count: updatedCaptures.length,
          maxDiffRatio,
          captures: updatedCaptures,
        }
      : {
          ...existingBaselineManifest,
          captures: existingBaselineManifest.captures.map((capture) => (
            updatedCaptures.find(({ name }) => name === capture.name) || capture
          )),
        };
    await writeFile(
      path.join(baselineDir, 'manifest.json'),
      `${JSON.stringify(baselineManifest, null, 2)}\n`,
      'utf8'
    );
    const updateKind = selectedCaptureNames === null ? 'visual baselines' : 'selected visual baselines';
    console.log(`Updated ${manifest.captures.length} ${updateKind} in ${path.relative(root, baselineDir)}.`);
  }
  if (regressions.length > 0) {
    throw new Error(`Visual regressions exceeded the pixel threshold:\n- ${regressions.join('\n- ')}`);
  }
  console.log(`Captured ${manifest.captures.length} visual smoke screenshots to ${path.relative(root, outDir)}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
