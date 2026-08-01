import { defineConfig } from 'tsup';
import { readdirSync } from 'node:fs';
import path from 'node:path';

function sourceEntries(directory = 'src') {
  const entries: Record<string, string> = {};
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      Object.assign(entries, sourceEntries(file));
      continue;
    }
    if (!entry.isFile() || (!file.endsWith('.js') && !file.endsWith('.jsx'))) continue;
    entries[path.relative('src', file).replace(/\\/g, '/').replace(/\.(?:js|jsx)$/, '')] = file;
  }
  return entries;
}

export default defineConfig({
  entry: sourceEntries(),
  format: ['esm'],
  external: [
    'react',
    'react-dom',
    '@lk-design-system/lds-core',
    '@lk-design-system/lds-product',
  ],
  sourcemap: true,
  splitting: true,
  clean: true,
  dts: false,
  outDir: 'dist',
  banner: { js: '"use client";' },
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
});
