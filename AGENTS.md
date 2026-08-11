# Repository agent instructions

## LDS UI adoption and migration (MANDATORY)

Treat requests to create, migrate, convert, restyle, or align a product UI with LDS as adoption work. Component replacement alone is not completion.

Before editing UI code:

1. Read [`docs/package/adoption-workflow.md`](docs/package/adoption-workflow.md) and the packaged [Robotics adoption delta](docs/package/domain/ROBOTICS_UI_ADOPTION.md).
2. Inspect the complete requested surface. Existing-surface migration defaults to `full-surface`; use `changed-ui` only for an explicitly bounded incremental adoption.
3. Record all six LDS non-component facets and component mapping. Never omit a facet silently; use `not-applicable` only with a concrete reason and evidence.
4. Apply the Robotics domain contracts for coordinates, navigation expression, occupancy maps, selection/focus, unit formatting, glyphs, and safety/control ownership whenever they are relevant.

If the work reveals a required shared Core, Theme, Product, token, asset, or pattern change, stop at the ownership boundary and scope that authoring separately. A product conversion request does not grant authority to change a shared LDS package.

## Generated documentation

`docs/package/` is a deterministic package projection. Do not edit it by hand. Edit the Robotics-owned source documents under `docs/`, or synchronize the pinned upstream LDS snapshot with the documentation generator, then regenerate and run `npm run check:docs`.

## Verification

Run the narrowest relevant checks while working. Before handoff, run `npm run check:local`; for Storybook or public-documentation changes also run `npm run check:storybook:local`.

Publishing must never use a mutable LDS branch or an obsolete action pin. Run
`.github/workflows/release-gate.yml` with the exact committed LDS candidate SHA;
`prepublishOnly` delegates to the fail-closed `check:release` command.

Preserve unrelated and user-owned worktree changes.
