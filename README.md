# LK Robotics UI

`@lk-design-system/lds-robotics-ui` is the independent Robotics UI package for
LK ROBOTICS products. It owns DOM, SVG, editor, viewer, telemetry, and robotics
operation UI. It owns the renderer-facing navigation coordinate contract and
pure world/SVG/screen projection helpers, but not transport, TF authority,
localization, safety controls, WebGL, Three/R3F, or LDS3D renderer lifecycle.

## AI and LDS adoption start here

Component replacement alone is not LDS adoption completion.

Before implementing or converting a product UI:

1. Repository agents read [`AGENTS.md`](AGENTS.md) and [`llms.txt`](llms.txt).
2. Read the generated [adoption workflow](docs/package/adoption-workflow.md) and [machine checklist](docs/package/adoption-checklist.json).
3. Read the [Robotics adoption delta](docs/package/domain/ROBOTICS_UI_ADOPTION.md) and every applicable coordinate, navigation, map, focus, unit, glyph, and safety contract.
4. Copy the packaged report example and its sibling schema together, replace every placeholder with real evidence, and validate the result. Component mapping is only one part of the report.

Installed-package entrypoints are `@lk-design-system/lds-robotics-ui/llms.txt`, `@lk-design-system/lds-robotics-ui/design-system.json`, `@lk-design-system/lds-robotics-ui/adoption-checklist.json`, and `@lk-design-system/lds-robotics-ui/docs/*`.

Route, Trajectory, and Lane geometry should enter the renderer through the
world/ROS projection adapters. A `NavigationCoordinateBoundary` rejects line
data that lacks `svg-map` projection proof or targets another frame/version.

See [Navigation Coordinate Contract](docs/package/domain/NAVIGATION_COORDINATE_CONTRACT.md)
before integrating ROS maps, paths, poses, multi-floor frames, or map editing.

## Dependencies

The package consumes released `@lk-design-system/lds-core` and
`@lk-design-system/lds-product` versions. It must not add an LDS3D runtime dependency.
Products and documentation integrations compose Robotics UI with LDS3D when needed.

Import styles in layer order: Core, Theme, Product, then Robotics.

## Documentation

- [Package documentation manifest](docs/package/manifest.json)
- [AI context](docs/package/llms.txt)
- [Live Robotics Storybook](https://lk-design-system.github.io/lk-design-system-robotics/)

## Development

Configure GitHub Packages credentials through `NODE_AUTH_TOKEN`, then run:

```sh
npm ci
npm run check:local
```

Cross-repository release conformance is a separate fail-closed gate. Run the
[`Release conformance gate`](.github/workflows/release-gate.yml) with the exact
40-character commit SHA of the LDS candidate that produced the packaged Core
documentation snapshot. `npm publish` also runs `check:release` and fails unless
that clean immutable checkout is available through the required environment.

The package is released to `https://npm.pkg.github.com` as a restricted package.

## Ownership

`@jinhyuk2me` owns package release, dependency updates, and security response.
