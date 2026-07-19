# LK Robotics UI

`@lk-robotics/lds-robotics-ui` is the independent Robotics UI package for
LK ROBOTICS products. It owns DOM, SVG, editor, viewer, telemetry, and robotics
operation UI; it does not own transport, authority, safety controls, coordinates,
WebGL, Three/R3F, or LDS3D renderer lifecycle.

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
