import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { closeServer, startStaticServer } from './_storybook-static.mjs';

// Runs every story's play function and fails on any NEW failure.
//
// Storybook play functions are the only place several visual contracts are
// asserted (focus clearance, label attachment, dash/tone identity, target
// size). Nothing in this repo used to execute them: check:storybook builds the
// index, checks style and diffs four screenshots, and a play function only ran
// when a human opened that story. Six Navigation stories had been failing
// silently, and a sample-ring change shipped a regression in two more.
//
// Known failures are pinned in story-play-known-failures.json and the list is a
// ratchet, not a mute button: an unlisted failure fails the run, and so does a
// listed story that now passes, so the list can only ever shrink. Regenerate it
// with `npm run check:story-play -- --update-known-failures` and expect the diff
// to be reviewed.

const root = process.cwd();
const staticDir = path.join(root, 'storybook-static');
const knownFailuresPath = path.join(root, 'story-play-known-failures.json');
const updateKnownFailures = process.argv.includes('--update-known-failures');
const onlyArguments = process.argv.filter((argument) => argument.startsWith('--only='));
const concurrency = Math.max(1, Number(process.env.STORY_PLAY_CONCURRENCY || 4));
// Stories settle well under a second; the ceiling only has to outrun a genuine
// hang so a wedged play function reports instead of stalling the whole run.
const storyTimeoutMs = Number(process.env.STORY_PLAY_TIMEOUT_MS || 30000);

if (onlyArguments.length > 1) {
  throw new Error('Pass at most one comma-separated --only= story list.');
}
const requestedIds = onlyArguments.length === 0
  ? null
  : new Set(onlyArguments[0].slice('--only='.length).split(',').map((id) => id.trim()).filter(Boolean));
if (requestedIds?.size === 0) {
  throw new Error('--only= must name at least one story id.');
}

function storyUrl(origin, id) {
  return `${origin}/iframe.html?${new URLSearchParams({ id, viewMode: 'story' }).toString()}`;
}

// Storybook reports render and play outcomes on its preview channel. Reading
// that instead of scraping console output means an unrelated console error (a
// missing font, a third-party warning) cannot be mistaken for a failed
// assertion, and a play function that throws a non-Error still registers.
function installChannelProbe(page) {
  return page.addInitScript(() => {
    const state = { phase: 'pending', errors: [] };
    window.__storyPlayProbe = state;

    const record = (phase) => (payload) => {
      state.phase = phase;
      const message = payload?.message
        ?? payload?.title
        ?? payload?.description
        ?? (typeof payload === 'string' ? payload : JSON.stringify(payload));
      if (message) state.errors.push(String(message).split('\n')[0]);
    };

    const attach = () => {
      const channel = window.__STORYBOOK_ADDONS_CHANNEL__;
      if (!channel?.on) return false;
      channel.on('playFunctionThrewException', record('play-failed'));
      channel.on('storyThrewException', record('story-failed'));
      channel.on('storyErrored', record('story-errored'));
      channel.on('storyMissing', record('story-missing'));
      channel.on('storyRendered', () => {
        // Never downgrade a recorded failure: Storybook still reports the story
        // as rendered when only the play function threw.
        if (state.phase === 'pending') state.phase = 'rendered';
      });
      return true;
    };

    if (!attach()) {
      const timer = setInterval(() => {
        if (attach()) clearInterval(timer);
      }, 10);
      setTimeout(() => clearInterval(timer), 20000);
    }
  });
}

async function runStory(page, origin, id) {
  await page.goto(storyUrl(origin, id), { waitUntil: 'domcontentloaded' });
  try {
    await page.waitForFunction(
      () => window.__storyPlayProbe && window.__storyPlayProbe.phase !== 'pending',
      undefined,
      { timeout: storyTimeoutMs },
    );
  } catch {
    return { id, ok: false, errors: [`Story never reported a render within ${storyTimeoutMs}ms.`] };
  }
  // `storyRendered` can land before a slow play function finishes, so settle
  // before trusting a pass. Without this a late assertion reads as green.
  await page.waitForTimeout(400);
  const probe = await page.evaluate(() => ({
    phase: window.__storyPlayProbe.phase,
    errors: [...new Set(window.__storyPlayProbe.errors)],
  }));
  return { id, ok: probe.phase === 'rendered', errors: probe.errors, phase: probe.phase };
}

async function loadKnownFailures() {
  try {
    const parsed = JSON.parse(await readFile(knownFailuresPath, 'utf8'));
    return new Map(parsed.failures.map((failure) => [failure.id, failure]));
  } catch (error) {
    if (error.code === 'ENOENT') return new Map();
    throw error;
  }
}

async function main(origin) {
  const index = JSON.parse(await readFile(path.join(staticDir, 'index.json'), 'utf8'));
  const stories = Object.values(index.entries)
    .filter((entry) => entry.type === 'story')
    // `!test` is Storybook's own opt-out tag; honour it so a story can be
    // excluded in one place instead of in every runner.
    .filter((entry) => !(entry.tags || []).includes('!test'))
    .filter((entry) => requestedIds === null || requestedIds.has(entry.id))
    .map((entry) => entry.id)
    .sort();

  if (requestedIds !== null) {
    const missing = [...requestedIds].filter((id) => !stories.includes(id));
    if (missing.length > 0) throw new Error(`Unknown story id in --only=: ${missing.join(', ')}`);
  }
  if (stories.length === 0) throw new Error('No stories to run. Was storybook-static built?');

  const knownFailures = await loadKnownFailures();
  const results = [];
  let browser;
  try {
    browser = await chromium.launch();
    const queue = [...stories];
    const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await installChannelProbe(page);
      try {
        for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
          const result = await runStory(page, origin, id);
          results.push(result);
          if (!result.ok) {
            const known = knownFailures.has(result.id) ? ' (known)' : '';
            console.log(`FAIL${known}  ${result.id}\n        ${result.errors.join('\n        ')}`);
          }
        }
      } finally {
        await page.close();
      }
    });
    await Promise.all(workers);
  } finally {
    if (browser) await browser.close();
  }

  const failed = results.filter((result) => !result.ok).sort((a, b) => a.id.localeCompare(b.id));

  if (updateKnownFailures) {
    if (requestedIds !== null) {
      throw new Error('--update-known-failures rewrites the whole list, so it cannot be combined with --only=.');
    }
    await writeFile(knownFailuresPath, `${JSON.stringify({
      schemaVersion: 1,
      note: 'Stories whose play function is known to fail. A ratchet: check:story-play fails on any unlisted failure, and also when a listed story starts passing. Only ever remove entries.',
      count: failed.length,
      failures: failed.map(({ id, errors }) => ({ id, error: errors[0] ?? 'unknown' })),
    }, null, 2)}\n`, 'utf8');
    console.log(`Pinned ${failed.length} known play failures in ${path.relative(root, knownFailuresPath)}.`);
    return;
  }

  const failedIds = new Set(failed.map(({ id }) => id));
  const regressions = failed.filter(({ id }) => !knownFailures.has(id));
  // Only meaningful on a full run; --only= cannot prove a story stopped failing.
  const fixed = requestedIds !== null
    ? []
    : [...knownFailures.keys()].filter((id) => !failedIds.has(id)).sort();

  console.log(
    `Ran ${results.length} story play functions: `
    + `${results.length - failed.length} passed, ${failed.length} failed `
    + `(${regressions.length} new, ${failed.length - regressions.length} known).`
  );

  const problems = [];
  if (regressions.length > 0) {
    problems.push(
      'New play failures. Fix them, or pin them deliberately with '
      + '`npm run check:story-play -- --update-known-failures`:\n'
      + regressions.map(({ id, errors }) => `- ${id}\n    ${errors.join('\n    ')}`).join('\n')
    );
  }
  if (fixed.length > 0) {
    problems.push(
      'These stories are pinned as known failures but now pass. Remove them from '
      + `${path.relative(root, knownFailuresPath)} so the ratchet keeps its teeth:\n`
      + fixed.map((id) => `- ${id}`).join('\n')
    );
  }
  if (problems.length > 0) throw new Error(problems.join('\n\n'));
}

const staticServer = await startStaticServer(staticDir);
try {
  await main(staticServer.origin);
} catch (error) {
  console.error(error.message ?? error);
  process.exitCode = 1;
} finally {
  await closeServer(staticServer.server);
}
