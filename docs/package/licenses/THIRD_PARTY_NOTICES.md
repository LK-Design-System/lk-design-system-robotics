# Third-party notices

This file records third-party material distributed with LK Robotics UI. It
must be retained with copies or substantial portions of that material.

## Montage / Wanted Design System

The LK Design System (LDS) packages used by this repository and bundled into
the public Storybook artifact are based on **Montage, the Wanted Design System
by Wantedlab**. WDS/Montage-derived material, including modifications to it,
remains available under the MIT License.

**Attribution:** [Montage by Wantedlab](https://github.com/wanteddev/montage-web)

- License: MIT
- Changes: adapted, rebranded, and extended for LK ROBOTICS.
- Branding: Wanted logos, wordmarks, and other brand assets are not included
  in the LK Robotics UI license grant.

The full MIT License is included in
[`licenses/MIT-WDS.txt`](MIT-WDS.txt).

## Material Symbols

The following internal modules embed selected **Material Symbols Rounded** SVG
path data, modified only for placement, scale, and presentation in LK
Robotics UI:

- `src/components/robotics/_NavigationStateGlyph.js`
- `src/components/robotics/_FacilityGlyph.js`
- `src/components/robotics/_HazardGlyph.js`

**Attribution:** [Material Symbols by Google](https://github.com/google/material-design-icons)

- License: Apache License 2.0
- Changes: selected paths are embedded as SVG path data and composed with
  LK-authored marker geometry; the `ramp`, `handoff`, `dropoff`, and
  `collision` glyphs are LK-authored.

The upstream repository does not grant permission to use Google's trademarks
except as needed to describe the material's origin.

The full Apache-2.0 license is included in
[`licenses/Apache-2.0.txt`](Apache-2.0.txt).

## Pretendard

The GitHub Pages Storybook artifact embeds Pretendard webfont files received
from `@lk-design-system/lds-theme`. Pretendard is distributed under the SIL Open
Font License 1.1 (OFL-1.1).

**Attribution:** [Pretendard by Kil Hyung-jin](https://github.com/orioncactus/pretendard)

- License: SIL Open Font License 1.1
- Copyright and reserved font names: retained in
  [`licenses/PRETENDARD-OFL-1.1.txt`](PRETENDARD-OFL-1.1.txt).
- Changes: none. The static artifacts contain the distributed webfont files.
