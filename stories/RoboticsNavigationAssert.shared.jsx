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
