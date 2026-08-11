# LDS workspace package migration guide

| Field | Value |
| --- | --- |
| Type | Guide |
| Status | Wave 2 RC published |
| Owner | Design system owner · consumer owners |
| Last reviewed | 2026-08-09 |
| Source | `docs/references/wds/PUBLIC_EXPORT_CLASSIFICATION.json` |

This guide describes the consumer-side import migration that follows the Wave 1
workspace split. `docs/references/package-split/releases/WAVE2_RC_0.1.0-rc.0.json`
is an immutable historical attestation, not the current release pointer. Resolve
current LDS package versions from the workspace and owner package manifests. For
the externally owned Robotics package, use
`docs/references/package-split/ROBOTICS_EXTERNAL_SURFACE.json` as the current
package, vendored-artifact, documentation-path, and SHA-256 contract.

The completed LDS3D docs migration is recorded in
`docs/references/package-split/consumers/lds3d-docs-wave2-rc.json`.

## Target packages

| Owner | Package | Dependencies |
| --- | --- | --- |
| Core | `@lk-design-system/lds-core` | — |
| Theme | `@lk-design-system/lds-theme` | Core |
| Product | `@lk-design-system/lds-product` | Core |
| Robotics UI | `@lk-design-system/lds-robotics-ui` | Core, Product |
| Compatibility only | `@lk-design-system/design-system-core` | all four packages |

Before direct Robotics adoption, read
`@lk-design-system/lds-robotics-ui/llms.txt` and
`@lk-design-system/lds-robotics-ui/design-system.json`. The package also exposes
`@lk-design-system/lds-robotics-ui/adoption-checklist.json` and its complete
self-contained documentation bundle through
`@lk-design-system/lds-robotics-ui/docs/*`. The external repository owns the
[live Robotics Storybook](https://lk-design-system.github.io/lk-design-system-robotics/?path=/docs/lds-robotics-foundation-viewer-tokens--docs)
and [public machine manifest](https://lk-design-system.github.io/lk-design-system-robotics/design-system.json);
the main LDS Storybook does not copy that documentation tree.

The canonical owner for every public export and deep component path is
`docs/references/wds/PUBLIC_EXPORT_CLASSIFICATION.json`. Do not infer a package
from a component folder name.

## Import migration

| Existing import | Replacement |
| --- | --- |
| `@lk-design-system/design-system-core` | Import each symbol from its owner package. |
| `@lk-design-system/design-system-core/core` | `@lk-design-system/lds-core` |
| `@lk-design-system/design-system-core/theme` | `@lk-design-system/lds-theme` |
| `@lk-design-system/design-system-core/product` | `@lk-design-system/lds-product` |
| `@lk-design-system/design-system-core/robotics` | `@lk-design-system/lds-robotics-ui` |
| `@lk-design-system/design-system-core/components/<path>` | `<owner package>/components/<path>` using the classification inventory. |

For example:

```tsx
import { Button } from '@lk-design-system/lds-core';
import { ThemeToggle } from '@lk-design-system/lds-theme';
import { TopBar } from '@lk-design-system/lds-product';
import { Scene3DFrame } from '@lk-design-system/lds-robotics-ui';
```

## CSS and assets

Import the owner package CSS entries in dependency order. Product applications
that use all layers should normally import all four entries:

```ts
import '@lk-design-system/lds-core/styles.css';
import '@lk-design-system/lds-theme/styles.css';
import '@lk-design-system/lds-product/styles.css';
import '@lk-design-system/lds-robotics-ui/styles.css';
```

The legacy `styles.css`, token and asset paths remain available through the
compatibility package during the approved support window. New direct asset paths
must use the owning package only after the consumer has recorded the concrete
path in its migration evidence.

## Consumer release checklist

1. Pin the exact package versions and release-set checksum; never use a sibling
   source path, `link:`, or a mutable branch reference.
2. Replace root, layer and deep imports according to the owner classification.
3. Run the consumer's install, production build, representative workflow smoke,
   and rollback test at the pinned revision.
4. Record the package versions, source commit, checksum, imports removed, test
   output and rollback version in the package-split consumer report.
5. For LDS3D docs, replace the local `link:` dependency only in a separate
   clean checkout; LDS3D renderer packages must not import LDS at runtime.

`ManualControlSession` is a presentation/release seam only. Transport,
authority, watchdog, STOP and safety behavior remain product-owned and are not
part of this package migration.
