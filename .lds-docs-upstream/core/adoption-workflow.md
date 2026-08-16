# LDS UI 적용·전환 워크플로

| Field | Value |
| --- | --- |
| Type | Generated canonical workflow |
| Status | Current |
| Owner | Design system owner |
| Source | `docs/references/adoption/LDS_UI_ADOPTION_CONTRACT.json` |
| Contract version | `1` |

> 컴포넌트 교체만으로 LDS 전환은 완료되지 않는다.

이 문서는 `docs/references/adoption/LDS_UI_ADOPTION_CONTRACT.json`에서 생성됩니다. 직접 수정하지 않습니다. 계약 자체를 바꿀 때는 JSON과 schema를 검토한 뒤 `node scripts/generate-lds-adoption-docs.mjs`를 실행합니다.

## 적용 범위

다음 요청은 LDS UI adoption 작업입니다.

- new product UI
- LDS adoption
- LDS migration
- LDS conversion
- UI restyle
- UI parity implementation
- material product UI redesign

제품의 실제 동작·데이터·권한·route·backend orchestration은 제품이 소유합니다. LDS adoption은 그 위에 component뿐 아니라 token/theme, layout과 시각 foundation, state/pattern/motion, asset/iconography/brand, content/internationalization, accessibility 계약을 함께 적용합니다.

전환 중 shared component, token, asset, pattern의 변경 필요가 발견되어도 제품 전환 요청이 그 변경 권한을 자동으로 부여하지 않습니다. 해당 변경은 [컴포넌트 워크플로](./policies/COMPONENT_WORKFLOW.md), [토큰 거버넌스](./policies/TOKEN_GOVERNANCE.md), 저장소의 scope escalation gate를 따로 적용합니다.

## 판정과 typed evidence

각 surface는 6개 facet과 component mapping을 모두 기록합니다. 아래 세 verdict는 facet decision에 적용하며, `componentMapping`은 `reviewed` 또는 `blocked`만 허용합니다.

- `reviewed`: 결정을 검토했고 typed evidence가 하나 이상 있습니다.
- `not-applicable`: 적용되지 않는 구체적 이유를 `reasonCode`와 `detail`로 기록합니다.
- `blocked`: 완료를 선언하지 않고 차단 원인을 `detail`로 기록합니다.

허용 evidence kind:

- `source`
- `token`
- `story`
- `check`
- `visual`
- `asset`
- `copy-catalog`
- `decision`

`source`, `asset`, `visual`, `copy-catalog`, `check`의 `ref`는 소비 저장소 안에 실제 존재하는 repo-relative 파일 또는 검사 산출물 경로여야 합니다. Bare 검사 명령이나 자유문장은 `check` evidence가 아닙니다. `token`은 pinned LDS token inventory에 존재하는 이름이나 경로를, `story`는 built Storybook index에 존재하는 exact story ID를 가리키며 story evidence를 쓰거나 story hard trigger가 발생하면 CLI의 `--storybook-index`가 필수입니다. `decision`은 다른 근거를 설명하는 보조 링크일 뿐 각 세부 결정의 유일한 evidence가 될 수 없습니다.

## 작업 전 탐색 순서

1. 대상 route·surface·source file과 실제 ready/non-ready 상태, 사용자 문구, asset을 inventory합니다.
2. [Foundation index](./foundations/README.md)에서 관련 원리와 선택 기준을 읽습니다. 단일 AI context가 필요하면 [Foundation LLM bundle](./foundations/llms.txt)을 대신 사용합니다.
3. 관련 CSS 이름과 설명을 [token source](./token-reference.json)에서 확인합니다. generated CSS 값만 보고 의미를 추론하지 않습니다.
4. 후보 component를 정한 뒤 [component index](./components/README.md)와 해당 targeted guide를 읽습니다. 전체 [component LLM bundle](https://github.com/LK-Design-System/lk-design-system/blob/lds-v0.1.0-rc.69.17/docs/components/llms.txt)은 retrieval/indexing 용도이며 매 작업에서 통째로 읽는 필수 입력이 아닙니다.
5. hard trigger가 있으면 해당 facet이 요구하는 evidence kind와 전문 계약을 반드시 확인합니다.
6. 아래 report schema에 surface별 판정을 기록한 뒤에 component mapping을 확정합니다.

## 필수 facet

### Tokens and theme runtime (`tokensAndTheme`)

Install the complete LDS runtime and map visual values to the owned semantic and component token layers.

Foundation: `design-token` · `color`

필수 결정:

- `owner-package-css-order`: owner package and CSS import order
- `font-theme-scope`: font and theme provider scope
- `color-scheme-behavior`: light, dark, and auto behavior
- `token-mapping`: semantic or component token mapping
- `raw-visual-literals`: raw visual literal disposition

Hard trigger:

| ID | 관찰 사실 | 필수 evidence kind |
| --- | --- | --- |
| `visual-source-change` | A changed UI source or stylesheet contains visual declarations or LDS imports. | `source` · `token` · `check` |

참조:

- [docs/TOKEN_GOVERNANCE.md](./policies/TOKEN_GOVERNANCE.md)
- [docs/PACKAGE_MIGRATION_GUIDE.md](./policies/PACKAGE_MIGRATION_GUIDE.md)
- [docs/foundations/design-token.md](./foundations/design-token.md)
- [docs/foundations/color.md](./foundations/color.md)
- [tokens/source.json](./token-reference.json)

### Layout and visual foundations (`layoutAndVisualFoundations`)

Preserve information hierarchy across real content, narrow viewports, overflow, and the LDS visual foundation scales.

Foundation: `typography` · `layout` · `spacing` · `radius` · `elevation` · `gradient` · `aspect-ratio`

필수 결정:

- `semantic-reading-order`: semantic structure and reading order
- `grid-container-mapping`: grid and container mapping
- `responsive-overflow-ownership`: responsive and overflow ownership
- `typography-data-formatting`: typography hierarchy and data formatting
- `visual-foundation-mapping`: spacing, radius, elevation, gradient, and aspect-ratio mapping

Hard trigger:

| ID | 관찰 사실 | 필수 evidence kind |
| --- | --- | --- |
| `layout-source-change` | A changed UI source or stylesheet changes layout, dimensions, typography, or overflow. | `source` · `visual` |

참조:

- [docs/foundations/typography.md](./foundations/typography.md)
- [docs/foundations/layout.md](./foundations/layout.md)
- [docs/foundations/spacing.md](./foundations/spacing.md)
- [docs/foundations/radius.md](./foundations/radius.md)
- [docs/foundations/elevation.md](./foundations/elevation.md)
- [docs/foundations/gradient.md](./foundations/gradient.md)
- [docs/foundations/aspect-ratio.md](./foundations/aspect-ratio.md)

### State, cross-component patterns, and motion (`statePatternsAndMotion`)

Model asynchronous and interaction states explicitly and select feedback and motion patterns by scope and duration.

Foundation: `state` · `motion`

필수 결정:

- `async-state-model`: ready, loading, empty, error, stale, offline, disabled, and recovery states
- `loading-pattern-scope`: Loading pattern element and scope
- `retained-content-refresh`: retained-content and refreshing behavior
- `motion-reduced-motion`: motion purpose, duration, and reduced-motion behavior

Hard trigger:

| ID | 관찰 사실 | 필수 evidence kind |
| --- | --- | --- |
| `async-state-change` | A changed UI source adds a loading indicator, aria-busy, loading prop, or asynchronous state surface. | `source` · `story` · `decision` |
| `motion-change` | A changed UI source or stylesheet adds animation, transition, or motion behavior. | `source` · `check` |

참조:

- [docs/foundations/state.md](./foundations/state.md)
- [docs/foundations/motion.md](./foundations/motion.md)
- [docs/LOADING_PATTERN.md](./patterns/loading.md)

### Assets, iconography, and brand (`assetsIconographyAndBrand`)

Reuse owned registries and preserve provenance, semantic meaning, accessibility, and brand boundaries for every visual asset.

Foundation: `iconography`

필수 결정:

- `registry-search`: existing icon and asset registry search
- `asset-owner-public-path`: asset owner package and public path
- `provenance-license`: provenance and license
- `asset-semantics-alt`: decorative or informative semantics and alternative text
- `theme-suitability`: light and dark suitability

Hard trigger:

| ID | 관찰 사실 | 필수 evidence kind |
| --- | --- | --- |
| `asset-change` | A changed UI surface adds or modifies SVG, raster image, font, inline SVG, or image markup. | `source` · `asset` |

참조:

- [docs/foundations/iconography.md](./foundations/iconography.md)
- [packages/core/assets/icons/manifest.json](./assets/icons/manifest.json)

### Content and internationalization (`contentAndInternationalization`)

Keep product meaning, voice, locale boundaries, and user-visible data formatting explicit and reviewable.

Foundation: `writing` · `voice-and-tone` · `international-design`

필수 결정:

- `copy-product-truth`: user-visible copy set and product truth
- `writing-voice`: Writing and Voice disposition
- `locale-language-boundary`: locale and document language boundary
- `data-formatting`: date, time, number, unit, and missing-value formatting
- `translation-truncation`: translation and truncation behavior

Hard trigger:

| ID | 관찰 사실 | 필수 evidence kind |
| --- | --- | --- |
| `visible-copy-change` | A changed UI source adds or modifies visible text or an accessible text prop. | `source` · `copy-catalog` |

참조:

- [docs/foundations/writing.md](./foundations/writing.md)
- [docs/foundations/voice-and-tone.md](./foundations/voice-and-tone.md)
- [docs/foundations/international-design.md](./foundations/international-design.md)
- [docs/COPY_REVIEW_CONTRACT.md](./policies/COPY_REVIEW_CONTRACT.md)

### Accessibility and inclusive interaction (`accessibility`)

Verify semantic structure, keyboard and focus behavior, perceivable state, target size, contrast, and inclusive use.

Foundation: `inclusive-design`

필수 결정:

- `landmarks-dom-order`: landmarks and semantic DOM order
- `keyboard-focus-restoration`: keyboard path and focus restoration
- `accessible-name-role-state`: accessible names, roles, states, and messages
- `target-pointer-alternatives`: target size and pointer alternatives
- `contrast-non-color-cues`: contrast and non-color state cues
- `reduced-motion`: reduced-motion behavior

Hard trigger:

| ID | 관찰 사실 | 필수 evidence kind |
| --- | --- | --- |
| `interactive-source-change` | A changed UI source adds or modifies an interactive element, handler, or LDS control. | `source` · `story` · `check` |

참조:

- [docs/foundations/inclusive-design.md](./foundations/inclusive-design.md)
- [docs/ACCESSIBILITY_CONTRACTS.md](./policies/ACCESSIBILITY_CONTRACTS.md)

## Component and composition mapping (`componentMapping`)

Choose owner-package components only after the applicable non-component decisions have been recorded.

필수 결정:

- `owner-public-export`: owner package public export
- `reuse-composition-choice`: existing component or composition choice
- `product-orchestration-boundary`: product-owned orchestration boundary
- `exception-shared-authoring`: remaining exception or shared LDS authoring need

참조:

- [docs/components/README.md](./components/README.md)
- [docs/PACKAGE_MIGRATION_GUIDE.md](./policies/PACKAGE_MIGRATION_GUIDE.md)
- [docs/COMPONENT_WORKFLOW.md](./policies/COMPONENT_WORKFLOW.md)

component mapping은 6개 비컴포넌트 facet을 대신하지 않습니다. 기존 component를 재사용했더라도 surrounding layout, theme runtime, copy, state, asset과 accessibility 판정은 별도로 남깁니다.

## Report 작성 계약

검증 가능한 attestation은 [`LDS_UI_ADOPTION_REPORT.schema.json`](./adoption-report.schema.json)을 따릅니다. 한 report는 scope와 하나 이상의 surface를 가지며, 각 surface에는 다음 항목이 모두 있어야 합니다.

| 키 | 역할 | 판정 | 최소 기록 |
| --- | --- | --- | --- |
| `tokensAndTheme` | Tokens and theme runtime | `reviewed` / `not-applicable` / `blocked` | 관찰·결정·typed evidence 또는 N/A·차단 이유 |
| `layoutAndVisualFoundations` | Layout and visual foundations | `reviewed` / `not-applicable` / `blocked` | 관찰·결정·typed evidence 또는 N/A·차단 이유 |
| `statePatternsAndMotion` | State, cross-component patterns, and motion | `reviewed` / `not-applicable` / `blocked` | 관찰·결정·typed evidence 또는 N/A·차단 이유 |
| `assetsIconographyAndBrand` | Assets, iconography, and brand | `reviewed` / `not-applicable` / `blocked` | 관찰·결정·typed evidence 또는 N/A·차단 이유 |
| `contentAndInternationalization` | Content and internationalization | `reviewed` / `not-applicable` / `blocked` | 관찰·결정·typed evidence 또는 N/A·차단 이유 |
| `accessibility` | Accessibility and inclusive interaction | `reviewed` / `not-applicable` / `blocked` | 관찰·결정·typed evidence 또는 N/A·차단 이유 |
| `componentMapping` | Component and composition mapping | `reviewed` / `blocked` | owner package·reuse/composition·제품 경계 evidence |
| `verification` | 대표 렌더와 상호작용 검증 | 별도 verdict 없음 | viewport·theme·state·typed evidence |

Report의 기본 `scope.mode`는 `full-surface`입니다. Required for adoption, migration, conversion, restyle, parity, or material redesign of an existing UI surface. Inspect every in-scope source file, including unchanged legacy code.

`changed-ui`는 자동 축소 모드가 아닙니다. Allowed only for an explicitly bounded incremental adoption whose unchanged legacy UI is outside the requested scope. Document that boundary and inspect the relevant changed UI lines. 기존 화면을 "LDS로 전환", migrate, convert, restyle, parity 구현하거나 materially redesign하는 요청에는 반드시 `full-surface`를 사용합니다. 제외 경로는 조용히 생략하지 않고 `scope.excluded`에 reason code와 detail을 둡니다.

### Consumer repository setup and enforcement

`adoption-checklist.json`은 읽기 전용 계약입니다. 이 파일을 수정하지 않습니다. [Schema-valid report template](./adoption-report.example.json)을 소비 저장소의 `.lds/adoption-report.json`으로 복사할 때, template의 상대 `$schema`가 가리키는 [report schema](./adoption-report.schema.json)도 같은 디렉터리에 그 basename 그대로 함께 복사합니다. Placeholder를 실제 outcome과 evidence로 모두 교체하며, copied schema는 pinned LDS revision에서 온 read-only 입력으로 관리합니다.

소비 저장소에 [config schema](./adoption-config.schema.json)를 따르는 `.lds/adoption.config.json`을 둡니다. 기본 report 경로는 `.lds/adoption-report.json`이며 config의 `reportDirectory`와 CLI `--report`로 명시적으로 바꿀 수 있습니다.

```json
{
  "schemaVersion": 1,
  "kind": "lds-ui-adoption-config",
  "repository": "consumer-ui",
  "uiRoots": ["src/**"],
  "styleEntry": "src/styles.css",
  "requiredStyleImports": [
    "@lk-design-system/lds-core/styles.css",
    "@lk-design-system/lds-theme/styles.css",
    "@lk-design-system/lds-product/styles.css"
  ],
  "excludedPaths": ["src/generated/**"],
  "reportDirectory": ".lds"
}
```

로컬과 CI는 동일한 pinned LDS checkout의 CLI를 실행합니다.

```sh
node <pinned-lds>/packages/conformance/src/cli.mjs check-adoption --root . --lds-root <pinned-lds> --config .lds/adoption.config.json --report .lds/adoption-report.json --base <base-sha> --head <head-sha> --output visual-artifacts/adoption/check-result.json
```

GitHub Actions에서는 [composite action](https://github.com/LK-Design-System/lk-design-system/blob/lds-v0.1.0-rc.69.17/.github/actions/lds-adoption/action.yml)을 immutable LDS commit SHA로 pin합니다. diff base를 읽을 수 있게 caller의 `actions/checkout`에 `fetch-depth: 0`을 설정합니다.

```yaml
- uses: actions/checkout@<immutable-sha>
  with:
    fetch-depth: 0
- uses: LK-Design-System/lk-design-system/.github/actions/lds-adoption@<immutable-lds-sha>
  with:
    root: .
    config: .lds/adoption.config.json
    report: .lds/adoption-report.json
    base: ${{ github.event.pull_request.base.sha }}
    head: ${{ github.sha }}
```

## 예외 계약

허용된 예외도 영구적인 무기명 면제가 아닙니다. 각 예외는 다음 필드를 모두 가집니다.

- `rule`
- `path`
- `signature`
- `owner`
- `reason`
- `expiresAt`

`signature`는 예외가 허용하는 정확한 현재 위반의 SHA-256이며, 내용이 달라지면 다시 검토합니다. `expiresAt` 이후의 예외는 완료 evidence로 사용할 수 없습니다.

## 완료 조건

- 필수 facet: `tokensAndTheme` · `layoutAndVisualFoundations` · `statePatternsAndMotion` · `assetsIconographyAndBrand` · `contentAndInternationalization` · `accessibility`
- `componentMapping` 필수: 예
- `blocked` 판정이 있으면 완료 실패: 예
- `not-applicable`은 이유 필수: 예

검증 범위:

- normal and narrow viewport
- light and dark appearance when supported
- representative ready and non-ready states
- keyboard and focus path
- reduced motion when motion exists
- remaining exceptions and product-owned seams

마지막 보고에는 대상 surface, 6개 facet과 component mapping 판정, 사용한 evidence, 남은 예외와 product-owned seam, 실행한 검증을 요약합니다.
