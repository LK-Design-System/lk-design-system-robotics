# LK Robotics UI

`@lk-robotics/lds-robotics-ui` is the independent Robotics UI package for
LK ROBOTICS products. It owns DOM, SVG, editor, viewer, telemetry, and robotics
operation UI. It owns the renderer-facing navigation coordinate contract and
pure world/SVG/screen projection helpers, but not transport, TF authority,
localization, safety controls, WebGL, Three/R3F, or LDS3D renderer lifecycle.

Route, Trajectory, and Lane geometry should enter the renderer through the
world/ROS projection adapters. A `NavigationCoordinateBoundary` rejects line
data that lacks `svg-map` projection proof or targets another frame/version.

See [Navigation Coordinate Contract](docs/NAVIGATION_COORDINATE_CONTRACT.md)
before integrating ROS maps, paths, poses, multi-floor frames, or map editing.

## Dependencies

The package consumes released `@lk-robotics/lds-core` and
`@lk-robotics/lds-product` versions. It must not add an LDS3D runtime dependency.
Products and documentation integrations compose Robotics UI with LDS3D when needed.

## Development

Configure GitHub Packages credentials through `NODE_AUTH_TOKEN`, then run:

```sh
npm ci
npm run check
```

The package is released to `https://npm.pkg.github.com` as a restricted package.

## Ownership

`@jinhyuk2me` owns package release, dependency updates, and security response.
