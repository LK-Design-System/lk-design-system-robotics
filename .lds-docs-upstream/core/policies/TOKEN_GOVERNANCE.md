# Token governance

| Field | Value |
| --- | --- |
| Type | Governance policy |
| Status | Current |
| Owner | Foundation owner |
| Last reviewed | 2026-08-22 |
| Source | `tokens/source.json` |

`tokens/source.json` is the source of truth for the base LK ROBOTICS token
contract. Figma Variables, Storybook examples, React components, and
AI-generated UI must all resolve back to this contract. Theme expression
profiles are the one additive runtime projection: their scope and whitelist
live in [`EXPRESSION_PROFILE_CONTRACT.json`](https://github.com/LK-Design-System/lk-design-system/blob/lds-v0.1.0/docs/references/architecture/EXPRESSION_PROFILE_CONTRACT.json),
and values are limited to `tokens/profiles.css` under the Theme package.

## Token layers

| Layer | Role | Product usage |
| --- | --- | --- |
| Primitive | Brand raw values, scales, type, radius, shadow, motion | Only referenced by semantic or component tokens |
| Semantic | Product meaning such as surface, text, action, status, border, focus | Preferred token layer for general UI |
| Component | Component-specific contracts such as Button, Input, Card | Preferred inside that component implementation |
| Runtime CSS | Importable CSS variables and base styles | Shipped through `styles.css` and `tokens/*.css` |

Rules:

- Do not use primitive values directly in components.
- Prefer role names over visual names, for example `semantic.action.primary`
  instead of `blue500`.
- Use modes for density or theme differences rather than inventing unrelated
  token names.
- Component tokens must point back to semantic or primitive tokens unless a
  documented exception exists.

### Expression profiles

`default` is the unmodified base expression. The opt-in `ops` profile may
override only approved component density, motion timing, and decorative depth
variables. It must not redefine semantic colors, status meaning, contrast,
component anatomy, or product/Robotics behavior. The profile CSS is projected
to `@lk-design-system/lds-theme/tokens/profiles.css`; it is not a second
primitive or semantic source. Run `npm run check:expression-profile` when
changing the profile contract or its projection.

## Color architecture

`tokens/source.json` is also the only editable runtime source for color. The
WDS `.fig`, PDFs, screenshots, and `docs/references/wds/COLOR_ARCHITECTURE.json`
are traceable evidence, not runtime inputs.

The generated color flow is:

```text
tokens/source.json
  -> tokens/color-atomic.css
  -> tokens/color-semantic.css
  -> tokens/color-components.css
  -> stories/color-system.data.js
```

Run `npm run generate:colors` after editing the source contract. Generated
files must not be edited by hand. `npm run check:colors` verifies generated
drift, layer boundaries, and the approved light/dark contrast pairs.

Color usage rules:

- Atomic tokens (`--color-atomic-*`) exist for palette construction. Component
  implementations must not reference them directly.
- Semantic tokens (`--color-semantic-*`) express product meaning and are the
  default choice for general UI.
- Component tokens (`--component-*`) bind a reusable component to a stable
  combination of semantic roles.
- Status is a four-role family: `foreground`, `surface`, `border`, and `text`.
  Do not reuse one status value for all four jobs.
- `--color-semantic-status-*`의 기본값은 **신호용 선명색**이며 텍스트 대비를
  만족하지 않는다(흰 배경 기준 positive `#13BE4C` 2.47:1, cautionary `#EB9C33`
  2.25:1, negative `#EE5656` 3.44:1). 점·아이콘·테두리 등 비텍스트 요소에만 쓰고,
  텍스트와 텍스트 배경에는 AA를 만족하는 `--color-semantic-status-*-text`
  (5.47:1 / 7.48:1 / 7.04:1)를 쓴다. 선명색을 배경으로 채우고 흰 글자를 올리는
  solid 변형은 같은 대비값이 그대로 적용되므로 금지한다 — `*-surface` + `*-text`
  쌍을 쓰거나 배경을 더 어둡게 재정의한다.
- Data visualization uses `--color-semantic-data-viz-series-*`. A chart series
  must not use positive, cautionary, or negative unless that series actually
  communicates that status.
- Decorative colors such as ratings and categorical tags use accent or
  data-visualization roles, not status roles.
- Light and dark values are mandatory for every semantic color. Component
  color contracts are emitted in light, dark, and auto selectors so aliases
  resolve inside the correct theme scope.

### Removed compatibility names

The former `--bw-*` palette and `tokens/colors.css` compatibility layer are not
shipped. Product and design-system code must migrate directly to semantic or
component roles. `npm run check:colors` blocks reintroduction of the removed
names. This is an intentional breaking cleanup; no new compatibility aliases
may be added without an explicit product migration decision.

## Lifecycle

| State | Meaning | Allowed usage |
| --- | --- | --- |
| proposed | Experimental or draft token | Prototype and Storybook exploration only |
| active | Approved product token | Public components and templates |
| deprecated | Replaced token that still exists for compatibility | Keep with migration note for at least one minor cycle |
| removed | No longer available | Remove only in an explicit breaking change |

Deprecation notes must state the replacement token, affected components, and
the planned removal timing.

### Deprecated · `--interaction-*` (2026-07)

`tokens/effects.css`의 Decorate / Interaction 블록(`--interaction-layer-*`,
`--interaction-opacity-*`)은 **deprecated** 상태다. 다음 minor 사이클 이후
`tokens/source.json`과 함께 제거를 검토한다.

- 영향 컴포넌트: **없음**. `components/` 전체에서 이 토큰을 참조하는 코드가 0건이다.
  소비처가 없으므로 제품 마이그레이션 부담도 없다.
- 폐기 사유: 모든 인터랙션 상태를 하나의 불투명도 램프로 모델링한 초기 WDS 매핑
  시도였으나, 실제 시스템은 hover/pressed를 컴포넌트 계열별 semantic token으로,
  focus는 링으로만 표현한다. 특히 `--interaction-opacity-focused: 0.84`가 전제하는
  "불투명도로 포커스를 표현한다"는 모델은 `tokens/focus.css`의 포커스 링 계약과
  충돌하며 WCAG 2.4.7 / 2.4.11을 만족할 수 없다. 재도입 불가.
- 대체 토큰:

  | 폐기 토큰 | 대체 |
  | --- | --- |
  | `--interaction-layer-normal` | 없음 — 상태 배경을 지정하지 않는다 |
  | `--interaction-layer-light` | `--color-semantic-fill-alternative` (동일 값) |
  | `--interaction-layer-default` | `--color-semantic-fill-normal` (동일 값) |
  | `--interaction-layer-strong` | `--color-semantic-fill-strong` (0.16, 근사값) |
  | `--interaction-opacity-normal` | 없음 — 상태를 불투명도로 표현하지 않는다 |
  | `--interaction-opacity-hovered` | 계열별 hover 표현 (Fill · Elevation · Ring) |
  | `--interaction-opacity-focused` | `tokens/focus.css`의 전역 포커스 링 계약 |
  | `--interaction-opacity-pressed` | 계열별 pressed 표현 (Fill · Elevation · Ring) |

- 기준 문서: `stories/FoundationInteraction.stories.jsx`가 실제 인터랙션 계약
  (공통 상태 축 · 전역 포커스 링 · 계열별 hover/pressed 표현)을 기술한다.
- 값 자체는 `tokens/effects.css`와 `tokens/source.json`에 그대로 남아 있다.
  `tokens/source.json`이 색상·토큰의 단일 원본이므로, 런타임 CSS만 먼저 지우면
  생성물 드리프트가 발생한다. 제거는 source 계약과 함께 한 번에 진행한다.

## Figma sync contract

Figma Variables and code tokens must stay aligned.

1. Keep Primitive, Semantic, and Component collections separate in Figma.
2. Semantic and Component variables should alias Primitive variables where
   Figma supports aliases.
3. Exported Figma Variables must be normalized into `tokens/source.json`.
4. Runtime CSS changes must be generated from, or justified against,
   `tokens/source.json`.
5. Token change reviews must include affected component and Storybook evidence.

### Figma Variables workflow

Use these Figma collections and modes:

| Collection | Purpose | Examples |
| --- | --- | --- |
| Primitive | Brand raw values and scales | `color/brand/navy`, `space/4`, `radius/md` |
| Semantic | Product meaning | `surface/card`, `text/body`, `action/primary`, `status/danger` |
| Component | Component contracts | `button/primary/bg`, `input/border/focus`, `card/shadow/md` |

Supported modes are `light`, `dark`, and `auto`. Use `auto` only as
documentation when the tool cannot directly resolve OS mode.

Figma names must map predictably:

| Figma | JSON | CSS |
| --- | --- | --- |
| `semantic/color/brand/ink` | `semantic.colorRoles.brand-ink` | `--color-semantic-brand-ink` |
| `semantic/action/primary` | `semantic.action.primary` | `--color-primary` |
| `component/button/primary/bg` | `component.button.tokens.primaryBg` | `--component-button-primary-bg` |
| `component/input/border/focus` | `component.input.tokens.borderColorFocus` | `--component-input-border-color-focus` |
| `component/card/shadow/md` | `component.card.tokens.shadowMd` | `--component-card-shadow-md` |

Export flow:

1. Designers update reviewed Figma Variables.
2. Export through a reviewed plugin or Figma API script.
3. Normalize the export into the `tokens/source.json` structure.
4. Regenerate or update runtime CSS under `tokens/`.
5. Run `npm run check:tokens` and the relevant component checks.

Import flow:

1. Start from `tokens/source.json`, not generated CSS.
2. Preserve Primitive, Semantic, and Component boundaries.
3. Preserve light/dark modes.
4. Preserve aliases wherever Figma supports them.
5. Validate visual impact in Storybook before replacing shared Variables.

Review checklist:

- Raw values belong first in Primitive tokens.
- Product roles are expressed as Semantic tokens.
- Component-only values belong under Component tokens.
- Component CSS must not introduce untracked hex, rgba, shadow, radius, or
  control-height decisions.
- Affected Storybook stories show the token impact.
- `npm run check:tokens` passes.

Automation backlog:

- Figma Variables export script or documented plugin preset
- Token-change report for reviews

## Elevation (shadow) usage rules

`--shadow-*` 토큰은 "이 표면 아래로 콘텐츠가 지나간다"는 깊이 신호이며, 표면의
부착 방식에 따라 적용 범위가 달라진다. 표면은 세 부류로 나뉜다:

| 표면 부류 | 그림자 규칙 | 예 |
| --- | --- | --- |
| 부유 팝업 (어디에도 부착되지 않은 분리 레이어) | 사방 그림자 (`shadow-md`~`xl` 그대로) | DropdownMenu, Menubar 패널, UserMenu 메뉴, Tooltip, Toast/Snackbar, Modal/Alert, CommandPalette, 플로팅 버튼 |
| 엣지 부착 오버레이 (한 변이 셸·캔버스 경계에 붙은 채 콘텐츠를 덮음) | **덮는 쪽에만** 그림자 — 나머지 변은 `clip-path`로 잘라낸다 | SideNav overlay (`inset(0 -120px 0 0)`), 전체 높이 Drawer(위·아래·부착면이 뷰포트 밖이면 클립 생략 가능), DockPanel(풀하이트 부착이면 동등) |
| in-flow 표면 (콘텐츠를 밀어내며 배치에 참여) | 그림자 없음 — 경계는 divider 한 줄 | SideNav docked, TopBar/NavRail/BottomNav 바, 카드·패널의 기본 상태 |

Rules:

- 엣지 부착 오버레이에 사방 그림자를 그대로 두면 표면이 페이지에서 분리된
  모달처럼 읽힌다. 실제로 콘텐츠를 덮는 변에만 elevation을 남긴다
  (`components/navigation/SideNav.jsx`의 overlay 표면이 기준 구현).
- in-flow 표면에 그림자를 추가하지 않는다. 밀어내는 표면의 경계는 elevation이
  아니라 divider의 책임이다.
- 접힘/펼침처럼 상태에 따라 덮기 여부가 바뀌는 표면은 그림자도 상태와 함께
  전환한다(덮지 않는 상태 = `none`).

## Change impact levels

| Level | Example | Requirement |
| --- | --- | --- |
| Patch | Description or alias metadata change | Token check passes |
| Minor | New semantic or component token | Storybook usage evidence |
| Minor with migration | Token deprecation | Replacement token and migration note |
| Major | Active token removal or role change | Migration guide and visual diff |

## Release gate

- `npm run check:tokens` must pass.
- Component token changes must be verified in the relevant Storybook story.
- Color and status token changes must include light/dark or surface contrast
  review.
- Removed tokens must have a deprecation period and migration note.
- Figma Variables workflow changes are updated in this document, not in a
  separate Markdown file.
