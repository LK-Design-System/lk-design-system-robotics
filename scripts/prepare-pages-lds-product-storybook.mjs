import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const productRoot = path.join(root, 'node_modules', '@lk-design-system', 'lds-product');
const manifestPath = path.join(productRoot, 'package.json');
const storybookRoot = path.join(productRoot, 'storybook');

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
manifest.exports ??= {};
manifest.exports['./storybook'] = {
  types: './storybook/index.d.ts',
  import: './storybook/index.js',
};

const source = String.raw`"use client";

import React from 'react';

const docsStyles = [
  '.sbdocs-content * { font-family: var(--font-sans); }',
  '.sbdocs-content :is(code, pre, kbd, samp) { font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace); }',
  '.sbdocs-content :is(h1, h2, h3, h4, h5, h6) { color: var(--color-semantic-label-strong); font-weight: 700; border: 0; padding: 0; text-transform: none; letter-spacing: normal; }',
  '.sbdocs-content h1 { margin: 0 0 var(--space-4); }',
  '.sbdocs-content h2 { margin: var(--space-12) 0 var(--space-5); }',
  '.sbdocs-content h3 { margin: var(--space-8) 0 var(--space-3); }',
  '.sbdocs-content > p { margin: 0 0 var(--space-6); }',
].join('\\n');

const guideLayoutStyle = {
  marginTop: 'var(--space-8)',
  minWidth: 0,
  fontFamily: 'var(--font-sans)',
  color: 'var(--color-semantic-label-normal)',
};

export function LdsStorybookDocsStyles() {
  return React.createElement('style', { 'data-lds-storybook-docs-styles': true }, docsStyles);
}

export function LdsStorybookGuideLayout({ children, className = 'theme-light', style, ...props }) {
  return React.createElement(
    'div',
    { 'data-theme': 'light', className, style: { ...guideLayoutStyle, ...style }, ...props },
    children,
  );
}

export function LdsStorybookDecisionGuide({ label = 'Usage guidance', title, description }) {
  const headingId = React.useId();
  return React.createElement(
    'section',
    { 'aria-labelledby': headingId, 'data-lds-storybook-decision-guide': true, style: { display: 'grid', gap: 'var(--space-3)', minWidth: 0 } },
    React.createElement('h2', { id: headingId, style: { margin: 0, fontSize: 'var(--body1-size)' } }, label),
    title ? React.createElement('p', { style: { margin: 0, fontWeight: 700, color: 'var(--color-semantic-label-strong)' } }, title) : null,
    description ? React.createElement('p', { style: { margin: 0, maxWidth: '72ch' } }, description) : null,
  );
}
`;

const declarations = `import type { CSSProperties, ReactNode } from 'react';

export function LdsStorybookDocsStyles(): ReactNode;
export function LdsStorybookGuideLayout(props: { children?: ReactNode; className?: string; style?: CSSProperties }): ReactNode;
export function LdsStorybookDecisionGuide(props: { label?: string; title?: string; description?: string }): ReactNode;
`;

await mkdir(storybookRoot, { recursive: true });
await Promise.all([
  writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`),
  writeFile(path.join(storybookRoot, 'index.js'), source),
  writeFile(path.join(storybookRoot, 'index.d.ts'), declarations),
]);

console.log('Prepared the LDS Product Storybook compatibility surface for Pages.');
