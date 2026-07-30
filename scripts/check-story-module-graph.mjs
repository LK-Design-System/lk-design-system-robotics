// One module graph for stories: importing this package by its own name
// ('@lk-robotics/lds-robotics-ui/...') resolves through the exports map into
// dist/, while components import each other through relative src/ paths. Mixing
// the two loads the same module twice — constants go stale until a rebuild, and
// React contexts DUPLICATE, so a provider from one graph silently never reaches
// a consumer from the other (this actually happened: a story-mounted
// NavigationLabelPolicyProvider no-opped and only screenshots caught it).
// Stories therefore import ONLY via relative src/ paths; dist stays the
// artifact that check:pack and downstream consumers exercise.
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const violations = [];

function scan(dir) {
  for (const entry of readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) { scan(rel); continue; }
    if (!/\.(jsx?|mjs|ts|tsx)$/.test(entry.name)) continue;
    const source = readFileSync(path.join(root, rel), 'utf8');
    for (const [index, line] of source.split('\n').entries()) {
      if (line.includes("'@lk-robotics/lds-robotics-ui") || line.includes('"@lk-robotics/lds-robotics-ui')) {
        violations.push(`${rel}:${index + 1}  ${line.trim()}`);
      }
    }
  }
}

scan('stories');
scan('src');

if (violations.length > 0) {
  console.error('Self-package imports create a second module graph (dist) beside src — import via relative src paths instead:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}
console.log('Validated story/src module graph: no self-package imports.');
