import React from 'react';

// Role pictograms for navigation waypoints. Only roles with an unambiguous
// universal symbol earn a glyph; the rest stay terse codes (P for parking is
// already the world-wide symbol; holding/passthrough have none). See
// docs/NAVIGATION_EXPRESSION_CONVENTIONS.md Appendix A.
//
// Authored directly in a ~10-unit box centered on the origin (not the Material
// Symbols 960 box) so `size` maps 1:1 — a lightning bolt for charger.
const ROLE_PATH = {
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
