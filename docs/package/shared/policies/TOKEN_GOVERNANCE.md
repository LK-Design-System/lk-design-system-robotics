# Token governance

| Field | Value |
| --- | --- |
| Type | Governance policy |
| Status | Current |
| Owner | Foundation owner |
| Last reviewed | 2026-08-23 |
| Source | token 값: `tokens/source.json` · package interface: `packages/*/tokens/semantic-contract.json` |

`tokens/source.json` is the source of truth for the base LK ROBOTICS token
contract. Figma Variables, Storybook examples, React components, and
AI-generated UI must all resolve back to this contract. Theme expression
profiles are the one additive runtime projection: their scope and whitelist
live in [`EXPRESSION_PROFILE_CONTRACT.json`](https://github.com/LK-Design-System/lk-design-system/blob/lds-v0.2.12/docs/references/architecture/EXPRESSION_PROFILE_CONTRACT.json),
and values are limited to `tokens/profiles.css` under the Theme package.

Package별 `tokens/semantic-contract.json`은 runtime source에서 산출·검사하는 semantic
provider interface다. 이 파일은 token 값을 저작하는 두 번째 source가 아니며
`tokens/source.json`의 역할을 대체하지 않는다.

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

### Semantic provider contract

Core와 Product는 자신이 fallback 없이 요구하는 CSS custom property를 consumer contract로,
Theme은 제공하는 property를 provider contract로 선언합니다. 각 package manifest는
`lds.semanticContract`와 요구 contract version을 가리키고, Theme은 같은 version의
`providesSemanticContractVersion`도 선언합니다. Robotics는 독립 release 경계를 유지하므로
현재 외부 surface와 vendored artifact hash에 고정된 adapter로 같은 요구 집합을 검증합니다.

지원 조합은 `Core+Theme`, `Core+Theme+Product`,
`Core+Theme+Product+Robotics`입니다. Core-only 조합은 중립 제품 구성이 아니라 Theme provider
누락이며 `LDS_THEME_PROVIDER_MISSING`과 unresolved semantic variable 진단을 결정적으로
내야 합니다. 제공 variable 누락과 provider version mismatch도 각각 별도 진단으로 실패합니다.

`npm run check:semantic-provider`는 다음을 함께 검사합니다.

- package runtime source를 다시 스캔한 required/provided variable exact set
- package manifest, contract version과 Theme provider 일치
- Core-only negative와 세 supported composition fixture
- variable 누락·version mismatch 양성/음성 fixture
- pinned Robotics external surface·artifact identity와 semantic adapter drift

이 gate는 semantic 값이나 `default | ops` 출력 자체를 바꾸지 않습니다. 값 변경은 이 문서의
기존 token review를, profile 변경은 `npm run check:expression-profile`과 시각 evidence를 별도로
통과해야 합니다.

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
  2.25:1, negative `#EE5656` 3.44:1). 비텍스트 요소도 WCAG 1.4.11의 3:1을
  넘어야 하므로, 점·아이콘·테두리·막대 채움은 `--color-semantic-status-*-foreground`를
  쓴다. light foreground는 positive `#0F953C`(green-40, 3.90:1), cautionary
  `#C97A14`(orange-39, 3.35:1), negative는 기본값 그대로(3.44:1)이며 dark는 기본값과
  같다. 기본값은 `*-surface`·`*-border`의 색 혼합 기준으로 남는다.
  텍스트와 텍스트 배경에는 AA를 만족하는 `--color-semantic-status-*-text`
  (5.47:1 / 7.48:1 / 7.04:1)를 쓴다. 선명색을 배경으로 채우고 흰 글자를 올리는
  solid 변형은 같은 대비값이 그대로 적용되므로 금지한다 — `*-surface` + `*-text`
  쌍을 쓰거나 배경을 더 어둡게 재정의한다.
- Data visualization uses `--color-semantic-data-viz-series-*`. A chart series
  must not use positive, cautionary, or negative unless that series actually
  communicates that status.
- Decorative colors such as ratings and categorical tags use accent or
  data-visualization roles, not status roles.
- 흰 글자나 아이콘을 primary 채움 위에 올릴 때는 `--color-semantic-primary-fill`을 쓴다.
  dark `primary-normal`(`#5390C9`)은 흰색과 3.39:1이라 글자 기준에 못 미치므로,
  이 역할은 dark에서 `primary-heavy`(4.85:1)로 내려간다. 버튼·뱃지·칩의 채움 토큰도 이
  역할을 가리킨다. 흰 내용이 없는 채움(Slider·Switch 트랙, 진행 막대)은
  `primary-normal`을 그대로 쓴다.
- 행·카드·칩·알람·callout의 앞쪽(leading edge)에 색 띠를 두지 않는다. 2px 이상의
  `border-left`/`border-inline-start`, 두꺼운 왼쪽 테두리, `inset Npx 0 0` 줄무늬가 모두
  해당한다. 상태와 선택은 그 역할을 이미 가진 형제 컴포넌트의 방식으로 전달한다:
  공지·사례는 `Banner`의 앞쪽 톤 아이콘과 틴트 면, 짧은 상태 표면은 `StatusBadge`의
  톤 면과 글자, 목록·목차의 현재 항목은 `SideNav`의 선택 글자색과 굵기. 1px 회색
  구분선은 해당하지 않는다. `npm run check:no-leading-bars`가 이를 막는다.
- 색상각이 의미 있는 색과 겹치는 강조색은 그 의미 옆에 두지 않는다.
  `accent-*-light-blue`는 primary와 색상각이 같아(249°) 선택·정보 상태로 읽히므로
  primary·info 요소 옆의 범주 구분에 쓰지 않는다. `accent-*-red-orange`는
  cautionary(69°)와 negative(24°) 사이(47°)에 있어 상태 표시 근처의 범주 구분에
  쓰지 않는다. 차트 계열 7은 같은 이유로 accent light-blue 대신 하늘색 램프
  (light-blue-30 / -70)를 쓴다.
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

### Deprecated · `--color-atomic-neutral-*`, `--color-semantic-accent-violet`, `--color-semantic-accent-cyan` (2026-09)

다음 minor(0.3.0)에서 `tokens/source.json`과 함께 제거한다.

- `--color-atomic-neutral-*` (14단계): `cool-neutral` 램프와 값이 사실상 같다. 모든
  단계에서 16진 채널 차이가 2 이하라 눈으로 구분되지 않는다. semantic 색 중 이 램프에서만
  값을 가져오는 토큰은 0개이고, 모두 `cool-neutral`에서 가져온다. 같은 단계 번호의
  `--color-atomic-cool-neutral-*`로 옮긴다. 이 램프의 모든 단계는 `cool-neutral`에도 있다.
- `--color-semantic-accent-violet`, `--color-semantic-accent-cyan`: 두 모드 모두 값이
  `transparent`여서 이름이 약속하는 색을 내지 않는다. 채움이 필요하면
  `--color-semantic-accent-background-violet|cyan`, 글자·아이콘에는
  `--color-semantic-accent-foreground-violet|cyan`을 쓴다.
- 영향 컴포넌트: 없음. 2026-09-24 기준 Core·Product 컴포넌트와 스토리, Robotics·Slides·3D·Motion,
  LK Portal, 관제 제품 저장소(Daedeok·Gungneung·extended-slim)에서 참조가 0건이다. Robotics의
  Core 문서 사본은 제외한다. atomic 토큰은 원래 컴포넌트가 직접 쓰지 않는다.

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
