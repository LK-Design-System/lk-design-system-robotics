# LK Robotics UI

`@lk-design-system/lds-robotics-ui` is the independent Robotics UI package for
LK ROBOTICS products. It owns robot-specific control, status, and spatial
navigation presentation and composes renderer-neutral editor, viewer, telemetry,
and equipment primitives from LDS Product. It owns the renderer-facing navigation
coordinate contract and pure world/SVG/screen projection helpers, but not transport,
TF authority, localization, safety controls, WebGL, Three/R3F, or LDS3D renderer
lifecycle.

## CI·릴리스 실행 위치

다른 PC의 checkout은 실행 호스트 변경 승인이 아니다. 개발은 로컬 미리보기·빠른 검사,
패키지 릴리스는 **server04의 자격검증된 저장소 전용 격리 VM**으로 구분한다.
기존 자동 CI는 아래 현행 경로를 유지한다. 전체 검증을 현재 PC로 fallback하거나 새
VM/runner를 자동 등록하지 않는다. 상세 규칙은 [AGENTS.md](AGENTS.md#ci릴리스-실행-호스트-필수)를 따른다.

CI·release conformance와 Storybook build·Pages publish는 GitHub-hosted Ubuntu다. 2026-10-09부터 Linux가 정본 플랫폼이다(LDS 전체 결정). server04는 발행 전용이다. release-gate는 발행 자체가 아니다. 짝 LDS에 넣는 tgz는 server04 릴리스 환경에서 준비하며 자체 registry publish는 구성되어 있지 않다.

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

Configure GitHub Packages credentials through `NODE_AUTH_TOKEN` for installation.
The full `check:local` below runs in the designated CI/release environment; developer PCs use targeted checks:

```sh
npm ci
npm run check:local
```

Cross-repository release conformance is a separate fail-closed gate. Run the
[`Release conformance gate`](.github/workflows/release-gate.yml) with the exact
40-character commit SHA of the LDS candidate that produced the packaged Core
documentation snapshot. The gate fails unless that clean immutable checkout is
available through the required environment.

Robotics RCs are delivered as an exact tgz vendored by the paired LDS release;
this repository does not publish them to a package registry.

## Ownership

`@jinhyuk2me` owns package release, dependency updates, and security response.
