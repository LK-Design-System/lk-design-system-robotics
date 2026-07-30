// Shared WCAG contrast utilities for the Robotics Navigation story play-tests.
// colorChannels / relativeLuminance / contrastRatio were byte-identical in the
// Lane and Waypoint stories; hoisted here so the pair cannot drift. Consumers
// import only contrastRatio (the other two are its internal steps).

export function colorChannels(value) {
  const numbers = String(value).match(/[\d.]+/g)?.map(Number) ?? [];
  if (String(value).startsWith('color(srgb') && numbers.length >= 3) {
    return numbers.slice(0, 3).map((channel) => channel * 255);
  }
  if (numbers.length >= 3) return numbers.slice(0, 3);
  throw new Error(`Unsupported computed color: ${value}`);
}

export function relativeLuminance(value) {
  const channels = colorChannels(value).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function contrastRatio(foreground, background) {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * For viewer-overlay scrims (DirectionalPad / Joystick on-dark): returns the
 * computed colour with its alpha forced to 1 so contrast is judged against the
 * scrim's own tone — a translucent overlay never sits on the page background
 * that contrastRatio's default compositing assumes. Throws when the colour is
 * fully transparent, because alpha-stripping rgba(0,0,0,0) would masquerade as
 * solid black and hide the "ink floating raw over footage" regression.
 */
export function assertOverlayOpaque(color) {
  if (!color) throw new Error('Overlay surface has no computed colour.');
  if (color.includes('/')) {
    const alpha = Number.parseFloat(color.split('/')[1]);
    if (alpha === 0) throw new Error(`Overlay surface is fully transparent: ${color}`);
    return color.replace(/\/\s*[\d.%]+\s*\)/, '/ 1)');
  }
  const parts = color.split(',');
  if (parts.length === 4) {
    if (Number.parseFloat(parts[3]) === 0) throw new Error(`Overlay surface is fully transparent: ${color}`);
    parts[3] = ' 1)';
    return parts.join(',');
  }
  return color;
}

// Every navigation renderer must draw its focus indicator with the shared
// focus token and a zoom-stable stroke. Each page asserts its own ring against
// this one contract, which keeps the rings consistent across renderers without
// a side-by-side catalog page.
export function assertSharedFocusIndicator(ring, rendererName) {
  if (!ring) throw new Error(`${rendererName} focus indicator is missing.`);
  if (ring.getAttribute('stroke') !== 'var(--color-semantic-focus-indicator)') {
    throw new Error(`${rendererName} focus indicator must stroke with --color-semantic-focus-indicator.`);
  }
  if (ring.getAttribute('vector-effect') !== 'non-scaling-stroke') {
    throw new Error(`${rendererName} focus indicator stroke must be non-scaling.`);
  }
}

// Point and pin renderers sit on arbitrary map imagery, so the semantic focus
// stroke needs a wider surface-colored underlay. The pair is one visible focus
// indicator: the underlay supplies contrast and the foreground supplies the
// stable focus color.
export function assertContrastBackedFocus(root, contrastSelector, ringSelector, rendererName) {
  const contrast = root?.querySelector(contrastSelector);
  const ring = root?.querySelector(ringSelector);
  if (!contrast || !ring) {
    throw new Error(`${rendererName} focus indicator needs both contrast and foreground layers.`);
  }

  assertSharedFocusIndicator(ring, rendererName);
  if (contrast.getAttribute('vector-effect') !== 'non-scaling-stroke') {
    throw new Error(`${rendererName} focus contrast stroke must be non-scaling.`);
  }
  if (Number(contrast.getAttribute('stroke-width')) <= Number(ring.getAttribute('stroke-width'))) {
    throw new Error(`${rendererName} focus contrast layer must be wider than its foreground ring.`);
  }

  for (const geometryAttribute of ['d', 'points', 'r', 'transform']) {
    if (contrast.getAttribute(geometryAttribute) !== ring.getAttribute(geometryAttribute)) {
      throw new Error(`${rendererName} focus layers must share ${geometryAttribute} geometry.`);
    }
  }
}
