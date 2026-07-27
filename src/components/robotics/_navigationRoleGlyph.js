import React from 'react';

// Role pictograms for navigation waypoints. All primary roles use the same
// compact, font-independent SVG language so the waypoint marker never mixes
// text codes and icons. See docs/NAVIGATION_EXPRESSION_CONVENTIONS.md.
//
// Authored directly in a ~10-unit box centered on the origin (not the Material
// Symbols 960 box) so `size` maps 1:1.
const ROLE_PATH = {
  holding: 'M-4.2 -5 H-1.2 V5 H-4.2 Z M1.2 -5 H4.2 V5 H1.2 Z',
  passthrough: 'M-5 -1.4 H0.8 L-1.6 -3.8 L0.2 -5.6 L6 0 L0.2 5.6 L-1.6 3.8 L0.8 1.4 H-5 Z',
  parking: 'M-4 -5 H0.6 C3.8 -5 5 -3.2 5 -0.8 C5 1.7 3.4 3.2 0.5 3.2 H-1.2 V5 H-4 Z M-1.2 -2.4 V0.6 H0.3 C1.5 0.6 2.2 0.1 2.2 -0.9 C2.2 -1.9 1.5 -2.4 0.3 -2.4 Z',
  charger: 'M1.5 -5.5 L-3.5 1 L-0.3 1 L-1.5 5.5 L3.5 -1.2 L0.3 -1.2 Z',
};

export const ROLE_GLYPH_KINDS = new Set(Object.keys(ROLE_PATH));

/** Internal, font-independent role pictogram for Robotics Navigation SVG. */
export function NavigationRoleGlyph({
  kind,
  size = 10,
  color = 'currentColor',
  haloColor,
  haloWidth = 1.5,
  ...rest
}) {
  const d = ROLE_PATH[kind];
  if (!d) return null;
  const resolvedSize = Math.max(8, Number(size) || 10);
  const scale = resolvedSize / 10;

  return React.createElement(
    'g',
    {
      ...rest,
      'data-navigation-role-glyph': kind,
      'aria-hidden': 'true',
      focusable: 'false',
      pointerEvents: 'none',
      style: { color },
    },
    React.createElement(
      'path',
      {
        d,
        transform: scale === 1 ? undefined : `scale(${scale})`,
        fill: 'currentColor',
        fillRule: 'evenodd',
        clipRule: 'evenodd',
        // A knockout halo keeps the bolt legible over busy map content, matching
        // the detail-text halo it sits beside.
        stroke: haloColor,
        strokeWidth: haloColor ? haloWidth : undefined,
        strokeLinejoin: 'round',
        paintOrder: 'stroke',
        vectorEffect: 'non-scaling-stroke',
      },
    ),
  );
}

export default NavigationRoleGlyph;
