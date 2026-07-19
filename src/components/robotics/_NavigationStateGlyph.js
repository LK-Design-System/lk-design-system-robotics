import React from 'react';

const KINDS = new Set([
  'unknown', 'conflict', 'invalid', 'closed', 'blocked',
  'waiting', 'rerouting', 'completed', 'planned', 'active', 'stale',
]);

// State badge glyphs sourced from Material Symbols (Google, Apache License 2.0),
// rounded fill. Each icon's native viewBox is `0 -960 960 960`; MAT_FIT recenters
// the icon (center 480,-480) on the badge origin and scales the 960u artwork into
// the ~10u badge slot, painted 1:1 as currentColor. Some states intentionally
// share a symbol (closed/blocked → ×). See docs/references/ATTRIBUTIONS.md.
const MAT = {
  unknown: 'M593-646.63q0-48.37-31.24-76.87Q530.52-752 479-752q-31.81 0-57.58 14.03T377-697q-11 16-29.5 20t-35.5-5q-19-11-23-27t8-35q30-46 77.62-71 47.62-25 104.38-25 94 0 151 52.24 57 52.23 57 136.76 0 46-20 85t-66 84q-37 35-50 55.72T534-379q-3 21-18 35t-34.8 14q-19.79 0-34-13.5Q433-357 433-375q0-34 18-66t55.36-66.22Q554-550 573.5-582t19.5-64.63ZM478.91-80Q450-80 429.5-100.59q-20.5-20.59-20.5-49.5t20.59-49.41q20.59-20.5 49.5-20.5t49.41 20.59q20.5 20.59 20.5 49.5t-20.59 49.41Q507.82-80 478.91-80Z',
  invalid: 'M479.91-120q-28.91 0-49.41-20.59-20.5-20.59-20.5-49.5t20.59-49.41q20.59-20.5 49.5-20.5t49.41 20.59q20.5 20.59 20.5 49.5t-20.59 49.41q-20.59 20.5-49.5 20.5Zm0-240q-28.91 0-49.41-20.56Q410-401.13 410-430v-340q0-28.88 20.59-49.44t49.5-20.56q28.91 0 49.41 20.56Q550-798.88 550-770v340q0 28.87-20.59 49.44Q508.82-360 479.91-360Z',
  conflict: 'M92-120q-9 0-15.5-4T66-135q-4-7-4.5-14.5T66-165l388-670q5-8 11.5-11.5T480-850q8 0 14.5 3.5T506-835l388 670q5 8 4.5 15.5T894-135q-4 7-10.5 11t-15.5 4H92Zm52-60h672L480-760 144-180Zm361.5-65.5Q514-254 514-267t-8.5-21.5Q497-297 484-297t-21.5 8.5Q454-280 454-267t8.5 21.5Q471-237 484-237t21.5-8.5Zm0-111Q514-365 514-378v-164q0-13-8.5-21.5T484-572q-13 0-21.5 8.5T454-542v164q0 13 8.5 21.5T484-348q13 0 21.5-8.5ZM480-470Z',
  closed: 'M480-438 270-228q-9 9-21 9t-21-9q-9-9-9-21t9-21l210-210-210-210q-9-9-9-21t9-21q9-9 21-9t21 9l210 210 210-210q9-9 21-9t21 9q9 9 9 21t-9 21L522-480l210 210q9 9 9 21t-9 21q-9 9-21 9t-21-9L480-438Z',
  blocked: 'M480-438 270-228q-9 9-21 9t-21-9q-9-9-9-21t9-21l210-210-210-210q-9-9-9-21t9-21q9-9 21-9t21 9l210 210 210-210q9-9 21-9t21 9q9 9 9 21t-9 21L522-480l210 210q9 9 9 21t-9 21q-9 9-21 9t-21-9L480-438Z',
  waiting: 'M585-200q-24.75 0-42.37-17.63Q525-235.25 525-260v-440q0-24.75 17.63-42.38Q560.25-760 585-760h115q24.75 0 42.38 17.62Q760-724.75 760-700v440q0 24.75-17.62 42.37Q724.75-200 700-200H585Zm-325 0q-24.75 0-42.37-17.63Q200-235.25 200-260v-440q0-24.75 17.63-42.38Q235.25-760 260-760h115q24.75 0 42.38 17.62Q435-724.75 435-700v440q0 24.75-17.62 42.37Q399.75-200 375-200H260Z',
  rerouting: 'M220-477q0 63 23.5 109.5T307-287l30 21v-94q0-13 8.5-21.5T367-390q13 0 21.5 8.5T397-360v170q0 13-8.5 21.5T367-160H197q-13 0-21.5-8.5T167-190q0-13 8.5-21.5T197-220h100l-15-12q-64-51-93-111t-29-134q0-94 49.5-171.5T342-766q11-5 21 0t14 16q5 11 0 22.5T361-710q-64 34-102.5 96.5T220-477Zm520-6q0-48-23.5-97.5T655-668l-29-26v94q0 13-8.5 21.5T596-570q-13 0-21.5-8.5T566-600v-170q0-13 8.5-21.5T596-800h170q13 0 21.5 8.5T796-770q0 13-8.5 21.5T766-740H665l15 14q60 56 90 120t30 123q0 93-48 169.5T623-195q-11 6-22.5 1.5T584-210q-5-11 0-22.5t16-17.5q65-33 102.5-96T740-483Z',
  active: 'M320-258v-450q0-14 9-22t21-8q4 0 8 1t8 3l354 226q7 5 10.5 11t3.5 14q0 8-3.5 14T720-458L366-232q-4 2-8 3t-8 1q-12 0-21-8t-9-22Z',
  planned: 'M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-156t86-127Q252-817 325-848.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 82-31.5 155T763-197.5q-54 54.5-127 86T480-80Zm0-60q142 0 241-99.5T820-480q0-142-99-241t-241-99q-141 0-240.5 99T140-480q0 141 99.5 240.5T480-140Z',
  completed: 'm378-332 363-363q9-9 21.5-9t21.5 9q9 9 9 21.5t-9 21.5L399-267q-9 9-21 9t-21-9L175-449q-9-9-8.5-21.5T176-492q9-9 21.5-9t21.5 9l159 160Z',
  stale: 'M477-120q-142 0-243.5-95.5T121-451q-1-12 7.5-21t21.5-9q12 0 20.5 8.5T181-451q11 115 95 193t201 78q127 0 215-89t88-216q0-124-89-209.5T477-780q-68 0-127.5 31T246-667h75q13 0 21.5 8.5T351-637q0 13-8.5 21.5T321-607H172q-13 0-21.5-8.5T142-637v-148q0-13 8.5-21.5T172-815q13 0 21.5 8.5T202-785v76q52-61 123.5-96T477-840q75 0 141 28t115.5 76.5Q783-687 811.5-622T840-482q0 75-28.5 141t-78 115Q684-177 618-148.5T477-120Zm34-374 115 113q9 9 9 21.5t-9 21.5q-9 9-21 9t-21-9L460-460q-5-5-7-10.5t-2-11.5v-171q0-13 8.5-21.5T481-683q13 0 21.5 8.5T511-653v159Z',
};

// Recenter (icon center 480,-480 → origin) then scale 960u into the ~10u slot.
const MAT_FIT = 'scale(0.0095) translate(-480 480)';

function glyphShapes(kind) {
  const d = MAT[kind] ?? MAT.unknown;
  return [
    React.createElement(
      'g',
      { key: 'mat', transform: MAT_FIT, fill: 'currentColor' },
      React.createElement('path', { d }),
    ),
  ];
}

/** Internal, font-independent state geometry for Robotics Navigation SVG badges. */
export function NavigationStateGlyph({
  kind,
  size = 10,
  color = 'currentColor',
  ...rest
}) {
  const resolvedKind = KINDS.has(kind) ? kind : 'unknown';
  const resolvedSize = Math.max(10, Number(size) || 10);
  const scale = resolvedSize / 10;

  return React.createElement(
    'g',
    {
      ...rest,
      'data-navigation-state-glyph': resolvedKind,
      'data-navigation-state-glyph-source': 'lds-icon:material-symbols',
      'data-navigation-state-glyph-size': resolvedSize,
      'aria-hidden': 'true',
      focusable: 'false',
      pointerEvents: 'none',
      style: { color },
    },
    React.createElement(
      'g',
      { transform: scale === 1 ? undefined : `scale(${scale})` },
      ...glyphShapes(resolvedKind),
    ),
  );
}

export default NavigationStateGlyph;
