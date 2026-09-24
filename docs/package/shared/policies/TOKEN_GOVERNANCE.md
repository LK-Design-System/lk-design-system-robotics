# Token governance

| Field | Value |
| --- | --- |
| Type | Governance policy |
| Status | Current |
| Owner | Foundation owner |
| Last reviewed | 2026-09-25 |
| Source | token 값: `tokens/source.json` · package interface: `packages/*/tokens/semantic-contract.json` |

`tokens/source.json` is the source of truth for the base LK ROBOTICS token
contract. Figma Variables, Storybook examples, React components, and
AI-generated UI must all resolve back to this contract. Theme expression
profiles are the one additive runtime projection: their scope and whitelist
live in [`EXPRESSION_PROFILE_CONTRACT.json`](https://github.com/LK-Design-System/lk-design-system/blob/lds-v0.4.2/docs/references/architecture/EXPRESSION_PROFILE_CONTRACT.json),
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
- 새 semantic 값은 atomic 램프 단계를 `var(--color-atomic-*)`로 참조한다. 램프에 없는
  hex·rgba를 직접 적으면 `npm run check:token-hygiene`의 `rawColorLiterals` 래칫이 막는다.
  기존 직접 값은 기준선에 남은 부채이며 줄이는 방향으로만 갱신한다. 램프 단계와 채널당
  몇 단위만 다른 값(근사 중복)은 램프 단계로 합친다 — 2026-09에 primary(`#3878B3` =
  `blue-50`), accent cyan·light-blue, cautionary foreground(`orange-39` → `orange-40`)를
  이렇게 합쳤다. 대비 때문에 중간 단계가 필요해 보이면 끼워 넣기 전에 기존 단계로 기준을
  만족하는지 먼저 측정한다.
- Component tokens (`--component-*`) bind a reusable component to a stable
  combination of semantic roles.
- Status is a role family: `foreground`, `surface`, `border`, `text`, and
  `signal` (plus `fill`/`on-fill` for negative). Every status reference names
  its role; there is no bare `--color-semantic-status-positive|cautionary|negative`
  to reach for (deprecated, see below). Do not reuse one status value for all jobs.
- `--color-semantic-status-*-signal`은 **신호용 선명색**이며 텍스트 대비를
  만족하지 않는다(흰 배경 기준 positive `#13BE4C` 2.47:1, cautionary `#EB9C33`
  2.25:1, negative `#EE5656` 3.44:1). `*-surface`·`*-border`의 색 혼합 기준이고,
  직접 칠하는 곳은 어두운 면(inverse 표면, 뷰어, 로그 콘솔)이나 사진 위처럼 선명색이
  대비를 확보하는 자리뿐이다. 비텍스트 요소도 WCAG 1.4.11의 3:1을 넘어야 하므로,
  밝은 면 위의 점·아이콘·테두리·막대 채움·차트 계열은 `--color-semantic-status-*-foreground`를
  쓴다. light foreground는 positive `#0F953C`(green-40, 3.90:1), cautionary
  `#CC7C14`(orange-40, 3.25:1), negative는 signal 그대로(3.44:1)이며 dark는 signal과
  같다. 텍스트와 텍스트 배경에는 AA를 만족하는 `--color-semantic-status-*-text`
  (5.47:1 / 7.48:1 / 7.04:1)를 쓴다. signal을 배경으로 채우고 흰 글자를 올리는
  solid 변형은 같은 대비값이 그대로 적용되므로 금지한다 — `*-surface` + `*-text`
  쌍을 쓴다.
- 운영자가 즉시 대응해야 하는 위급(화재·쓰러짐·비상정지 알람, 파괴적 확인)을 멀리서도
  한눈에 보이게 칠해야 할 때만 `--color-semantic-status-negative-fill`과
  `--color-semantic-status-negative-on-fill` 쌍을 쓴다. 두 모드 모두 `red-30`(`#AA1C1C`)
  위의 흰색으로 7.26:1이다. `Button variant="danger"`와 `SpeedDial`의 위험 동작이 이
  역할을 쓴다. 틴트 면(`*-surface`)으로 충분한 일반 오류·검증 실패에는 쓰지 않는다 —
  화면에 강한 빨강 면이 여럿이면 진짜 위급이 묻힌다.
- Data visualization uses `--color-semantic-data-viz-series-*`. A chart series
  must not use positive, cautionary, or negative unless that series actually
  communicates that status.
- 범주 구분(여러 계열·유형을 색으로 나누는 것)은 `--color-semantic-data-viz-series-*`
  한 계열로만 한다. 강조색(`accent-*`)은 작은 고정 집합의 장식 태그에만 쓰며, 배경
  강조색은 의미색과 색상각이 겹치지 않는 lime · cyan · violet · purple · pink 5종이다.
  전경 강조색 red · orange · green · blue는 달력의 일요일·토요일, 별점, 태그처럼 관례로
  굳은 표시에만 쓰고, 상태 표시 옆에는 두지 않는다. 어느 쪽도 status 역할을 대신하지 않는다.
- info와 primary는 같은 색이다(`status-info-*`가 `primary-normal`에서 파생). 관제 화면에서
  "선택된 대상"과 "정보 알림"이 겹칠 수 있어 분리 여부는 **열린 결정**이다. 결정 전까지
  한 화면에서 선택 강조와 info 상태를 같은 요소에 겹쳐 쓰지 않는다. 분리할 때는 관제
  제품(궁릉·대덕) 화면을 놓고 판단한다.
- UI primary와 브랜드색의 관계: primary(`#3878B3`, HSL 209°)는 브랜드 LK Navy(`#05132B`, 218°)와
  LK Accent(`#6BBBDD`, 198°) 사이의 파랑 계열에서 **색상각만** 따르고, 명도는 UI 대비 기준
  (흰 글자 4.5:1, 페이지 위 글자 4.5:1)으로 따로 정한다. 네이비는 거의 검정이라 상호작용
  색으로 쓰면 본문·비활성 요소와 구분되지 않는다. 브랜드 셸이 필요한 곳(`SideNav`
  `appearance="brand"`)은 네이비 위에 흰색을 합성한 `navy-shell` 램프를 쓴다. 로고 색은
  UI 토큰으로 대체하지 않는다([로고 표준 §6](https://github.com/LK-Design-System/lk-design-system/blob/lds-v0.4.2/docs/brand/LK_LOGO_STANDARD.md#6-색상과-배경)).
  외부 고객 화면에서 브랜드 인상이 목표가 되면 primary를 Accent 쪽으로 옮길지 이 단락에서
  다시 결정한다.
- 흰 글자나 아이콘을 primary 채움 위에 올릴 때는 `--color-semantic-primary-fill`을 쓴다.
  dark `primary-normal`(`#5390C9`)은 흰색과 3.39:1이라 글자 기준에 못 미치므로,
  이 역할은 dark에서 `primary-heavy`(`blue-50`, 4.66:1)로 내려간다. 버튼·뱃지·칩의 채움 토큰도 이
  역할을 가리킨다. 흰 내용이 없는 채움(Slider·Switch 트랙, 진행 막대)은
  `primary-normal`을 그대로 쓴다.
- `primary-strong`·`primary-heavy`는 **채움 단계**(hover·pressed 채움, dark의
  `primary-fill`)다. 두 모드 모두 점점 어두워지므로 dark 바탕 위 글자로 쓰면 강할수록
  대비가 떨어진다(dark 페이지 기준 normal 5.04 → strong 4.09 → heavy 3.51:1). primary
  색상의 글자·링크·1px 강조 테두리는 `--color-semantic-primary-ink`(light `blue-45`
  5.53:1, dark `primary-normal` 5.04:1)를, 틴트 면 위에서 더 도드라져야 하는 라벨은
  `--color-semantic-primary-ink-strong`(light는 더 어둡게, dark는 더 밝게)을 쓴다.
  `ink` 계열은 모드와 관계없이 강할수록 대비가 오른다.
- 행·카드·칩·알람·callout의 앞쪽(leading edge)에 색 띠를 두지 않는다. 2px 이상의
  `border-left`/`border-inline-start`, 두꺼운 왼쪽 테두리, `inset Npx 0 0` 줄무늬가 모두
  해당한다. 상태와 선택은 그 역할을 이미 가진 형제 컴포넌트의 방식으로 전달한다:
  공지·사례는 `Banner`의 앞쪽 톤 아이콘과 틴트 면, 짧은 상태 표면은 `StatusBadge`의
  톤 면과 글자, 목록·목차의 현재 항목은 `SideNav`의 선택 글자색과 굵기. 1px 회색
  구분선은 해당하지 않는다. `npm run check:no-leading-bars`가 이를 막는다.
- 색상각이 의미 있는 색과 겹치는 강조색은 두지 않는다. `accent-*-light-blue`는
  primary와 색상각이 같아(OKLCH 249°) 선택·정보 상태로 읽히고, `accent-*-red-orange`는
  cautionary(69°)와 negative(24°) 사이(47°)에 있어 상태로 읽힌다. 두 쌍은
  deprecated다(아래). 차트 계열 7은 같은 이유로 하늘색 램프(light-blue-30 / -70)를 쓴다.
- **Inverse surfaces.** `inverse-background`·`inverse-label`은 모드에 따라 뒤집히지만(dark에서
  흰 면·검은 글자), `inverse-label-*-soft`·`inverse-fill-*`·`inverse-line-*`·`inverse-icon-muted`는
  두 모드 모두 흰색 알파다. 사진·영상 위처럼 늘 어두운 면에서 쓰기 위한 값이라서다. 그래서
  한 표면에서 둘을 섞으면 dark에서 흰 바탕 위 흰 글자가 된다(2026-09: LogViewer WARN 1.92:1,
  ERROR 2.90:1, DEBUG 거의 0). 로그 콘솔·툴팁·스낵바·사이트 푸터·이미지 레터박스처럼
  **어두운 것이 관례인 표면**은 루트에 `data-theme="light"`를 걸어 두 모드 모두 어두운 면으로
  고정한다. 그 하위는 light 모드와 똑같이 해석되므로 이미 검증된 조합이 그대로 쓰인다. 스크롤
  영역이면 `color-scheme: dark`도 함께 준다. `LogViewer`, `Tooltip`, `Snackbar`, `Footer`,
  `AnnotatedImage`가 이렇게 한다. 모드를 따라 뒤집혀야 하는 표면은 soft·fill·line 대신
  `inverse-label`과 일반 semantic 역할만 쓴다.
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
the planned removal timing. LDS itself stops using a token the moment it is
deprecated: `npm run check:deprecated-tokens` fails on any reference from
`components/`, `stories/` or hand-written `tokens/*.css` to a token whose
`tokens/source.json` entry starts its `$description` with `Deprecated`.

### Deprecated · `accent-*-light-blue`, `accent-*-red-orange`, `--color-atomic-orange-39` (removal 0.5.0)

- `--color-semantic-accent-background-light-blue`, `-foreground-light-blue`: primary와
  색상각이 같아 범주 태그가 선택·정보로 읽힌다. 범주 계열은 `data-viz-series-*`(계열 7이
  하늘색 램프), 장식 태그는 cyan을 쓴다. LDS 영향: `LogViewer`의 INFO 로그 색은 반전
  표면용 `--color-semantic-inverse-primary`로 옮겼다(반전 면 위 대비가 오른다).
- `--color-semantic-accent-background-red-orange`, `-foreground-red-orange`: 상태색 사이에
  있어 상태로 읽힌다. 장식 태그는 pink를 쓴다. LDS 영향: 스와치 스토리만.
- `--color-atomic-orange-39`: `orange-40`과 채널당 3/255 이내. cautionary foreground가
  `orange-40`으로 옮겼다.
- 소비자 영향(2026-09-25 조사): Robotics·3D·Slides·LK Portal 모두 0곳.

### Deprecated · `--color-semantic-status-positive|cautionary|negative` (removal 0.5.0)

접미사 없는 상태색 이름은 가장 먼저 손이 가는 이름인데, 글자 대비를 만족하지 못하는
신호용 선명색(흰 배경 2.25~3.44:1)을 담고 있었다. 문서가 막아도 LDS 자체 컴포넌트
32곳이 이 이름을 직접 썼고, 그중 `SpeedDial`의 위험 동작은 금지된 solid 채움이었다.
이름은 `-signal`로 옮겼고 기존 이름은 같은 값을 가리키는 deprecated 별칭으로 남는다.

| 용도 | 대체 |
| --- | --- |
| 글자, 글자 배경의 전경 | `--color-semantic-status-*-text` |
| 밝은 면 위의 점·아이콘·테두리·막대·차트 계열 | `--color-semantic-status-*-foreground` |
| 틴트 배경 | `--color-semantic-status-*-surface` |
| 어두운 면·사진 위의 선명색, 색 혼합 기준 | `--color-semantic-status-*-signal` |
| 운영자가 즉시 대응할 위급 채움 | `--color-semantic-status-negative-fill` + `-on-fill` |

- LDS 영향: `components/`와 `stories/`의 모든 참조를 위 표대로 옮겼다. 화면 값은
  바뀌지 않는다(`-foreground`의 negative는 signal과 같은 값이고, positive·cautionary는
  이미 문서가 요구하던 더 진한 값이다).
- 소비자 영향(2026-09-25 조사): Robotics 2곳, 3D 8곳, Slides 28곳, LK Portal 6곳.
  새 이름은 이 릴리스부터 존재하므로 각 소비자는 이 버전 이상으로 올릴 때 옮긴다.
- 제거: 0.5.0. 그 전까지 별칭은 같은 값을 유지한다.

### Removed in 0.4.0 · `--interaction-*`

2026-07에 deprecated로 표시했고 0.4.0에서 제거했다. Decorate / Interaction 블록(`--interaction-layer-*`,
`--interaction-opacity-*`, 8개)은 `tokens/effects.css`와 `tokens/source.json`에서 빠졌다.
이름을 다시 쓰지 않는다.

- 영향: 제거 시점(2026-09-24)에 LDS 컴포넌트·스토리·스크립트, Robotics·Slides·3D·Motion,
  LK Portal, 관제 제품 저장소의 참조가 0건이었다.
- 폐기 사유: 모든 인터랙션 상태를 하나의 불투명도 램프로 모델링한 초기 WDS 매핑
  시도였으나, 실제 시스템은 hover/pressed를 컴포넌트 계열별 semantic token으로,
  focus는 링으로만 표현한다. 특히 `--interaction-opacity-focused: 0.84`가 전제하는
  "불투명도로 포커스를 표현한다"는 모델은 `tokens/focus.css`의 포커스 링 계약과
  충돌하며 WCAG 2.4.7 / 2.4.11을 만족할 수 없다. 재도입 불가.
- 대체:

  | 제거 토큰 | 대체 |
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

### Removed in 0.3.0 · `--color-atomic-neutral-*`, `--color-semantic-accent-violet`, `--color-semantic-accent-cyan`

2026-09에 deprecated로 표시했고 0.3.0에서 `tokens/source.json`과 생성 CSS에서 제거했다.
이름을 다시 쓰지 않는다.

| 제거 토큰 | 대체 |
| --- | --- |
| `--color-atomic-neutral-<step>` (14단계) | 같은 단계의 `--color-atomic-cool-neutral-<step>` |
| `--color-semantic-accent-violet` | 채움 `--color-semantic-accent-background-violet`, 글자·아이콘 `--color-semantic-accent-foreground-violet` |
| `--color-semantic-accent-cyan` | 채움 `--color-semantic-accent-background-cyan`, 글자·아이콘 `--color-semantic-accent-foreground-cyan` |

- `neutral` 램프는 `cool-neutral`과 모든 단계에서 16진 채널 차이가 2 이하였다. 모든 단계가
  `cool-neutral`에도 있으므로 단계 번호만 유지해 옮기면 된다.
- `accent-violet`, `accent-cyan`은 두 모드 모두 `transparent`여서 칠해지는 색이 없었다.
  옛 이름을 그대로 쓰면 이전과 같이 아무것도 칠해지지 않으므로 화면 변화는 없다. 대체 토큰으로
  옮기면 실제 색이 칠해진다.
- 영향: 제거 시점(2026-09-24)에 Core·Product 컴포넌트와 스토리, Robotics·Slides·3D·Motion,
  LK Portal, 관제 제품 저장소(Daedeok·Gungneung·extended-slim)의 참조가 0건이었다.

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
