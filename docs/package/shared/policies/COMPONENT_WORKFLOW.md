# 컴포넌트 워크플로

| Field | Value |
| --- | --- |
| Type | Canonical workflow |
| Status | Current |
| Owner | Design system owner |
| Last reviewed | 2026-07-24 |

Storybook 페이지 소유권, 공개/숨김 역할, 영역별 설명 순서는 [`STORYBOOK_INFORMATION_ARCHITECTURE.md`](https://github.com/LK-Design-System/lk-design-system/blob/lds-v0.1.0-rc.69.31/docs/STORYBOOK_INFORMATION_ARCHITECTURE.md)를 따른다. 전수 판정 원장은 `docs/references/quality/STORYBOOK_INFORMATION_ARCHITECTURE_AUDIT.json`에서 관리한다.

이 문서는 신규 컴포넌트, 대규모 재설계, 재사용 패턴, 신규·변경 icon/asset/map symbol의 **공식 검토 진입점**이다. 구현 파일을 추가하는 순서만이 아니라 문제 근거, 제품 워크플로우, 공개 계약, 시각·접근성, asset 적합성, 검증과 완료 기록까지 모두 적용한다. 세부 계약 문서가 서로 다르게 읽히면 이 문서에서 요구하는 검토 순서를 먼저 따르고, 발견된 불일치는 관련 계약 문서에 함께 반영한다.

이 레포는 운영 품질 게이트를 기준으로 관리합니다.

1. 패키지 빌드: `npm run build`
2. 토큰/타입 surface/contract/publish policy 검증: `npm run check:tokens`, `npm run check:type-surface`, `npm run check:contracts`, `npm run check:publish-policy`
3. 소비 앱 smoke: `npm run check:consumer`
4. 문서 구조·링크·IA 수치와 인벤토리 drift guard: `npm run check:docs`, `npm run report:inventory`, `npm run check:inventory`
5. 정적 문서 빌드와 접근성 guard: `npm run build:storybook`, `npm run check:a11y`
6. CI 게이트: `.github/workflows/ci.yml`

## 로컬 개발

의존성은 한 번 설치합니다.

```powershell
npm install
```

CI는 npm과 `package-lock.json`을 기준으로 합니다. 다만 로컬에 npm이 없고 pnpm만 있는 환경에서는 같은 이름의 `pnpm run <script>`를 사용할 수 있습니다. 패키지 스크립트는 내부에서 특정 package manager를 재호출하지 않도록 구성합니다.

Storybook 실행:

```powershell
npm run storybook
```

일상 개발 중 빠른 검사를 실행:

```powershell
npm run check:fast
```

Storybook 빌드와 public/accessibility/inventory guard를 실행:

```powershell
npm run check:storybook
```

CI가 확인하는 전체 검사를 로컬에서 실행:

```powershell
npm run check
npm run check:audit
```

시각 diff와 원본 preview 전수 렌더까지 포함한 릴리스 직전 운영 품질 검사는 아래를 실행합니다.

```powershell
npm run check:ops-release
```

## 설계 원칙

WDS Makers' Principle 중 코드로 이식 가능한 항목 (근거:
`docs/references/wds/WDS_NONCOMPONENT_RECONCILIATION.md`):

- **최소 기능 우선**: 처음에는 최소 기능/최소 prop 표면으로 만들고 필요에 따라
  넓힙니다. Variant·prop이 너무 많으면 어떤 옵션이 무슨 의미인지 파악이 어렵습니다.
- **이름 규칙 일관성**: React export는 PascalCase, 파일은 `components/<group>/`에
  그룹으로 둡니다. 유사 컴포넌트의 prop/state 이름을 계승해
  `COMPONENT_API_STATE_MATRIX.md`와 일치시킵니다 (예: `disabled`/`size`/`variant`).

Storybook 표면의 LDS 자체 규칙:

- **이름 언어 규칙**: 사이드바 위계(title 경로)는 영어, story 표시 이름(`name`)은
  한국어로 씁니다. 컴포넌트 이름은 한국어 문장 안에서도 Latin 그대로 유지합니다
  (예: `TopBar 기본`, `Toast 변형`). 숨김 visual parity story는 영어
  `<X> card parity` 관례를 유지합니다.
- **페이지 주제 선언**: docs description에 Latin 컴포넌트명을 쓰면 그 페이지가 해당
  컴포넌트의 홈 페이지입니다. 다른 페이지에서 같은 컴포넌트를 지칭할 때는 한국어
  일반명사(예: "상단 바", "데이터 표")를 씁니다. 홈 중복은
  `npm run check:story-subjects`가 차단합니다.

## 행동 엔진 사용 규칙

이 저장소에는 계약(`.d.ts` + `.prompt.md`)과 전용 테스트를 가진 headless 행동 엔진 계층이 있다.
새 컴포넌트는 아래 행동을 **손으로 재구현하지 않고** 해당 엔진을 사용한다. 이 규율은 리뷰가
아니라 게이트로 지킨다: `npm run check:engine-reuse`가 엔진을 우회한 시그니처 패턴(수동 roving
menu, 자체 focus trap, document 수준 outside-dismiss listener, 조건부 마운트 `aria-live`, 수동
필드 메타데이터 배선)을 감지하며, 기존 위반은
`docs/references/quality/ENGINE_REUSE_BASELINE.json` 래칫에 잠겨 있고 새 위반만 실패한다.
엔진 계약 자체는 `npm run check:engine-contracts`(Playwright 하네스,
`scripts/check-engine-contracts.mjs`)가 소비자 없이 검증한다.

| 행동 | 엔진 | 계약 문서 |
| --- | --- | --- |
| 메뉴 roving focus·typeahead·Escape 스택 | `components/internal/useMenuKeyboard.js` | [`useMenuKeyboard.prompt.md`](https://github.com/LK-Design-System/lk-design-system/blob/lds-v0.1.0-rc.69.31/components/internal/useMenuKeyboard.prompt.md) |
| 서브메뉴(드릴) 브랜치·포탈 배치 | `components/internal/useSubmenuBranch.jsx` | [`useSubmenuBranch.prompt.md`](https://github.com/LK-Design-System/lk-design-system/blob/lds-v0.1.0-rc.69.31/components/internal/useSubmenuBranch.prompt.md) |
| light dismiss(바깥 클릭·최상단 Escape·재오픈 래치)·anchored 배치·열림 triad | `components/overlay/anchored-overlay.js` | [`anchored-overlay.prompt.md`](https://github.com/LK-Design-System/lk-design-system/blob/lds-v0.1.0-rc.69.31/components/overlay/anchored-overlay.prompt.md) |
| 모달 초점 트랩·복원·오버레이 스택·스크롤 잠금 | `components/overlay/dialog-focus.js` | [`dialog-focus.prompt.md`](https://github.com/LK-Design-System/lk-design-system/blob/lds-v0.1.0-rc.69.31/components/overlay/dialog-focus.prompt.md) |
| 폼 필드 라벨·메시지·`aria-describedby` 메타데이터와 상태 토큰 | `components/forms/field-shared.js` | [`field-shared.prompt.md`](https://github.com/LK-Design-System/lk-design-system/blob/lds-v0.1.0-rc.69.31/components/forms/field-shared.prompt.md) |

- 엔진 구현을 바꾸면 모든 소비자가 함께 바뀐다. 동작 수정은 엔진의 `.prompt.md` 계약·전용
  테스트와 함께 진행하고, 특정 소비자만을 위한 분기를 엔진에 넣지 않는다.
- 엔진이 계약상 소유하지 않는 요구(예: 포탈된 앵커드 패널의 light dismiss)는 우회 구현 대신
  엔진 확장으로 해결하고, 불가피한 예외는 `--update-baseline`으로 래칫에 기록하며 사유를 PR에
  남긴다.
- 엔진은 내부 계층이다: public export로 승격하지 않고
  [`OWNER_AUTHORITY_CONTRACT.json`](https://github.com/LK-Design-System/lk-design-system/blob/lds-v0.1.0-rc.69.31/docs/references/architecture/OWNER_AUTHORITY_CONTRACT.json)이
  가리키는 owner package의 private source에 둔다. 호환 source가 남아 있으면
  `PUBLIC_EXPORT_CLASSIFICATION.json`의 `internalModules` historical projection도
  동기화하며 `npm run check:layers`로 live owner와 projection의 일치를 검증한다.

## 컴포넌트 추가 및 재설계 검토

### 0. 적용 범위와 검토 방식

다음 변경은 이 절차를 필수로 적용한다.

- 새로운 public component 또는 reusable pattern
- 기존 컴포넌트의 anatomy, 상태 모델, 공개 API, 시각 문법을 바꾸는 재설계
- 제품·로보틱스 도메인 계약을 새로 공유 계층으로 올리는 변경
- 신규 또는 변경 icon, SVG, 이미지 asset, map marker·line·region symbol

검토와 수정은 분리한다. 먼저 현재 구현과 근거를 읽고 finding을 `P0`(런타임·데이터·안전), `P1`(접근성·핵심 API·워크플로우 차단), `P2`(상태·반응형·LDS 일관성), `P3`(문서·명명·polish)로 확정한다. shared token 값, public API 대량 변경, repository-wide gate 확대처럼 요청 범위를 넘는 수정은 finding과 영향 범위를 제시한 뒤 별도 승인을 받는다.

### 1. 문제, 분류, 중복 여부

1. 어떤 사용자의 어떤 반복 문제와 실제 업무 결정을 지원하는지 한 문장으로 쓴다.
2. [`OWNER_AUTHORITY_CONTRACT.json`](https://github.com/LK-Design-System/lk-design-system/blob/lds-v0.1.0-rc.69.31/docs/references/architecture/OWNER_AUTHORITY_CONTRACT.json)의 물리 package와 domain boundary를 기준으로 Runtime owner layer를 `core`, `theme`, `product`, `robotics` 중 하나로 정하고, 설계 provenance를 `direct-wds`, `wds-adjacent`, `theme-override`, `product-extension`, `robotics-extension` 중 하나로 별도 기록한다. WDS 근거와 코드 소유 계층을 같은 축으로 취급하지 않는다.
3. 같은 family의 기존 component, `.prompt.md`, Storybook story, token, 관련 문서를 조사한다.
4. 기존 component의 확장 또는 여러 primitive의 composition으로 해결 가능한지 먼저 판단한다.
5. 새 component가 필요하면 기존 sibling과의 책임·API·시각 차이를 명시한다. 이름이나 제품 영역이 다르다는 이유만으로 새 component를 만들지 않는다.

### 2. 설계 근거

구현 구조를 결정하기 전에 내부 근거와 외부 근거를 모두 확보한다.

- 내부 근거: 가장 가까운 LDS sibling, WDS 원본 component-set 또는 확정된 WDS evidence, 기존 token과 interaction 문법
- 외부 근거: 가능한 경우 공식 design system, platform HIG, 접근성 표준, 도메인 표준·공식 제품 문서 중 권위 자료 최소 2개
- 비교 항목: anatomy, 정보 위계, 상태 모델, placement, layout, keyboard/ARIA, responsive behavior, 오류·복구, 일반적인 실패 사례
- 기록 위치: component `.prompt.md` 또는 가장 가까운 기존 설계 문서에 링크와 실제로 영향을 준 결론을 남긴다.

외부 자료는 카테고리 기대치를 확인하는 근거이며 스타일을 그대로 복사하는 템플릿이 아니다. 외부 조사나 WDS 원본 확인이 필요한데 수행할 수 없으면 기억으로 설계하지 않고 `unverified`로 중단한다.

제품 frontend는 이 절의 설계 근거가 아니다. 제품 source가 증명할 수 있는 것은 필요한 component 종류, 실제 workflow·상태·데이터 밀도, 소비 가능 여부와 ownership seam뿐이다. 제품의 현재 anatomy, 화면 배치, 치수, 색, 시각 위계, prop 이름이나 로컬 컴포넌트 경계를 LDS 공용 설계로 승격하지 않는다. 같은 결과가 필요해 보여도 LDS sibling·WDS evidence·권위 있는 외부 category reference에서 독립적으로 다시 도출하고, 그 근거가 없으면 public API나 시각 차이로 채택하지 않는다.

### 3. LK 제품 자산과 실제 워크플로우

신규·재설계 component가 회사 자산의 실제 workflow와 기존 frontend를 지원할 수 있는지 코드 근거로 확인한다. 최소 검토 대상은 **LK Web Viz**, **LK Control Full Daedeok**, **LK Portal**이며, 관련이 없으면 생략하지 말고 `not applicable`과 이유를 기록한다.

1. repository, commit, frontend root, route/page/container와 핵심 source file을 고정한다.
2. 사용자 진입점, 판단 정보, action, 데이터·권한 전제조건, 완료 조건을 추출한다.
3. loading, empty, error, stale, offline, disabled, partial failure와 recovery 경로를 확인한다.
4. 제품별 관계를 `supported`, `supported by composition`, `gap`, `not applicable`로 판정한다.
5. gap이 LDS 공개 계약의 책임인지 product orchestration, backend, transport의 책임인지 분리한다.
6. source pin과 판정은 [`PRODUCT_FRONTEND_COVERAGE.md`](https://github.com/LK-Design-System/lk-design-system/blob/lds-v0.1.0-rc.69.31/docs/PRODUCT_FRONTEND_COVERAGE.md)와 `docs/references/product-frontends/COVERAGE_AUDIT.json`에 남긴다.

제품 page, route, backend policy, transport logic, 완성 workflow를 Storybook component로 복제하지 않는다. 이 절의 source pin과 판정은 2절에서 독립적으로 정한 설계를 실제 제품이 조합할 수 있는지 확인하는 **coverage gate**이며, 설계 선택을 승인하거나 public component의 생성·삭제·API·스타일을 단독으로 결정하는 authority가 아니다. LDS는 제품이 자체 스타일이나 접근성 동작을 다시 만들지 않고 workflow를 조합할 수 있는 primitive와 public contract를 제공한다.

### 4. 공개 API와 코드 계약

- prop과 event 이름이 같은 family의 문법과 일치하는지 확인한다.
- controlled/uncontrolled 축, default, empty, loading, error, stale, disabled, read-only, invalid 상태를 명시한다.
- 잘못된 prop 조합을 타입이 허용하지 않는지, callback payload가 제품에 필요한 identity와 reason을 전달하는지 확인한다.
- DOM order, focus order, visible reading order가 일치하는지 확인한다.
- listener, timer, observer cleanup, async race, stale closure, stable key/ID, SSR hydration을 점검한다.
- 긴 목록, SVG 지도, 차트, scroll/resize/pointer 처리에서 불필요한 전체 render와 고빈도 계산을 점검한다.
- React 18/19 declaration, public export, package subpath, `"use client"`, tree-shaking 경계를 확인한다.
- 새 코드는 소유 계층의 `/core`, `/theme`, `/product`, `/robotics` 진입점으로 공개한다. Aggregate root는 호환용 합집합이며 별도 소유권을 만들지 않는다.
- Core→Product/Robotics, Product→Robotics와 계층 순환을 만들지 않는다. 내부 helper는 owner package의 private source에 두고, compatibility source와 WDS provenance projection이 있으면 함께 동기화한 뒤 `npm run check:layers`를 통과한다.
- 앱 route, 권한 정책, API 호출, transport 상태 머신은 public component contract에 넣지 않는다.
- renderer-neutral `editor`와 `viz` 구현은 Product package가 이 저장소에서 소유한다. 외부 Robotics 저장소와의 이음새는 `ROBOTICS_EXTERNAL_SURFACE.json`에서 Robotics owner로 분류된 control·status·spatial navigation 계약에만 적용한다. 이 영역의 공개 prop을 바꾸면 in-repo `check:api-drift`에 더해 `npm run check:robotics-contract-drift`(형제 checkout 대상, `--root=`로 위치 지정)를 통과해야 한다. 이 검사는 **양방향**이다: 구현에 있는데 계약 문서에 없는 prop(`undocumentedProps`)과, 반대로 계약 예제가 홍보하지만 구현에 없는 prop(`phantomProps` — 계약이 구현에 대해 거짓말하는 경우)을 모두 잡는다. 메인 Product와 외부 Robotics가 조합하는 이름(예: generic `Map2DCanvas`와 Robotics navigation overlay)은 이름이나 폴더가 아니라 live owner contract와 external surface로 경계를 판정한다. 기존 드리프트는 `docs/references/robotics/CONTRACT_DRIFT_BASELINE.json` 래칫에 기록되어 있으며 새 드리프트만 실패한다.

API와 상태 증거는 [`COMPONENT_API_STATE_MATRIX.md`](https://github.com/LK-Design-System/lk-design-system/blob/lds-v0.1.0-rc.69.31/docs/COMPONENT_API_STATE_MATRIX.md), 접근성 증거는 [`ACCESSIBILITY_CONTRACTS.md`](./ACCESSIBILITY_CONTRACTS.md)에 반영한다.

### 5. Icon, asset, map symbol 적합성

새 icon이나 map geometry는 구현자가 그릴 수 있다는 이유만으로 채택하지 않는다. component가 icon·SVG·이미지·지도 요소를 추가하거나 바꾸면 아래 gate를 별도로 통과한다.

1. 변경되는 icon/asset/symbol inventory와 각각의 semantic role을 작성한다.
2. 기존 `Icon` registry, brand asset, WDS asset, 가까운 LK domain symbol을 먼저 검색하고 재사용·조합 가능성을 판단한다.
3. elevator/lift, door, dock, waypoint, charger, robot pose, route, restricted region처럼 도메인 의미가 있는 표시는 권위 있는 지도·시설 안내·로봇 관제 관례에서 보통 어떻게 표현되는지 조사한다.
4. 기존 관례와 다른 geometry를 유지하면 기능, 접근성, 공식 도메인 관례 또는 확정된 LDS/WDS 근거로 차이를 정당화한다. LK 제품 source는 어떤 의미와 상태가 필요한지는 증명할 수 있지만 geometry의 정답은 아니며, 현재 구현이나 기존 screenshot 자체도 근거가 아니다.
5. viewBox, stroke/fill 비율, corner와 line-cap, optical size, pixel alignment, `currentColor`/token 사용, path 복잡도, light/dark 대비를 확인한다.
6. map symbol은 point/line/polygon 역할, paint order와 z-index, screen-space 크기, minimum hit target, zoom 단계별 visibility, label collision, clustering/overlap, selected/focused/error/unavailable 상태를 확인한다.
7. 색상만으로 의미를 전달하지 않고 shape, line pattern, glyph, text 중 필요한 단서를 함께 제공한다.
8. 장식 asset의 assistive-tech 숨김과 의미 asset의 accessible name·semantic mirror를 구분한다.
9. source, license, provenance, 중복 여부와 최적화 전후 품질을 기록한다.
10. 대표 최소·기준·최대 zoom, normal/narrow, light/dark, 실제 제품 데이터 밀도에서 현재안과 대안을 나란히 렌더해 비교한다.

근거가 부족한 symbol은 완료된 디자인이 아니라 `provisional`로 판정한다. 특히 지도 위 facility point와 transition marker는 작은 glyph 하나만 보지 않고 주변 waypoint, lane, route, region, label과 함께 전체 지도 문법으로 판단한다.

### 6. 시각, 반응형, 접근성 검토

- 선택·활성 상태의 작은 텍스트는 light/dark 모두 4.5:1 이상을 유지한다. 낮은 강조나 선택 의미는 저대비 텍스트가 아니라 기존 surface, border, check/pressed semantics, font weight로 전달한다. 이 판정은 [WCAG 2.2 Contrast (Minimum)](https://www.w3.org/TR/WCAG22/#contrast-minimum), [Fluent 2 Button usage](https://fluent2.microsoft.design/components/web/react/core/button/usage), [Carbon Button usage](https://carbondesignsystem.com/components/button/usage/)를 근거로 하며, 외부 시스템의 색상은 복제하지 않고 LDS semantic foreground와 상태 문법으로 적용한다.
- 가장 가까운 sibling과 동일 상태로 나란히 렌더해 control/icon size, spacing, typography, radius, border/divider, fill/foreground, shadow, hover/focus/disabled를 비교한다.
- 대표 실제 콘텐츠로 normal width와 320~400px narrow width를 확인한다.
- light와 dark/inverse, 긴 한국어·영어 label, 복수 action, mixed status, progress, error, disabled를 포함한 compound state를 확인한다.
- 정보의 시각 reading order와 DOM/keyboard order가 같은지 확인한다.
- wrapping, truncation, overflow, scroll ownership, vertical rhythm, alignment, card-within-card 효과를 확인한다.
- keyboard-only, focus 이동·복원, screen reader name/state, 24px 이상 target, reduced motion, 색 외 상태 단서를 수동으로 확인한다.
- 실제 LK 제품 viewport와 데이터 밀도에서도 같은 hierarchy와 조작 가능성이 유지되는지 확인한다.

타입, axe, token, interaction check 통과는 시각 완성의 증거가 아니다. 결과가 단지 이전보다 나아진 정도라면 sibling, 외부 근거, 실제 제품 조건에 다시 대조한다.

### 7. 구현과 문서 등록

1. React 컴포넌트를 알맞은 `components/<group>/` 디렉터리에 추가한다.
2. 대응하는 `.d.ts` 계약을 추가하거나 수정한다.
3. component `.prompt.md`에 분류, sibling, 외부 근거, 제품 boundary, 의도적 차이와 제외를 기록한다.
4. 재사용 가능한 시각 결정이 있으면 `tokens/components.css`에 component token을 추가하고 `tokens/source.json`에 구조화된 source를 추가한다.
5. `npm run build`로 `src/`와 `dist/`를 재생성한다.
6. `stories/` 아래에 실제 component 계약을 보여주는 대표 Storybook story를 추가한다.
7. `docs/COMPONENT_API_STATE_MATRIX.md`의 API/state/story evidence를 갱신한다.
8. `docs/ACCESSIBILITY_CONTRACTS.md`의 keyboard/focus/screen-reader 근거를 갱신한다.
9. 원본 카드와 대응되면 `stories/Audit.data.jsx`에 숨김 매핑 데이터를 갱신한다.
10. public export, Storybook story, 문서 수치가 바뀌면 `npm run report:inventory`로 값을 확인하고 관련 문서를 갱신한다.

### 8. Storybook 증거

관련 있는 상태를 실제 콘텐츠로 렌더한다.

- 기본과 주요 variant
- disabled/read-only, loading/empty/error/stale
- long content와 compound state
- normal/narrow와 light/dark 또는 inverse
- 핵심 keyboard/pointer interaction을 검증하는 `play`

Storybook에는 audit dashboard, 제품 완성 화면, workflow template를 만들지 않는다. 제품 source trace와 coverage matrix는 `docs/`와 audit JSON에 두고, Storybook은 재사용 component의 실제 상태와 상호작용만 보여준다.

### 9. 완료 기록

검토 또는 PR 요약에는 다음을 남긴다.

- 분류와 해결하는 사용자 문제
- 확인한 sibling과 유지·제거한 visual delta
- 외부 근거 링크와 영향을 받은 설계 결론
- LK 제품별 source revision, workflow, coverage 판정
- icon/asset/map symbol inventory와 재사용·신규·provisional 결정
- normal/narrow/light/dark에서 확인한 대표 story와 viewport
- `P0`~`P3` finding, 의도적 deviation, 제품 계층에 남긴 책임
- 실행한 표적 검사와 최종 검사 결과

### 10. 검증 cadence

구현 중에는 해당 component/story/type/accessibility contract의 가장 작은 표적 검사를 사용한다. 관련 수정을 묶은 뒤 Storybook build, 전체 접근성 sweep, visual regression, `npm run check` 같은 전체 검사는 최종 checkpoint에서 한 번 실행한다. full-suite failure를 수정할 때도 특정 실패 검사를 먼저 통과시킨 뒤 전체 suite를 재실행한다.

검토 완료 조건은 다음과 같다.

- [ ] 문제, 분류, 중복·composition 판정이 기록됐다.
- [ ] LDS sibling과 권위 외부 근거를 검토했다.
- [ ] 세 LK 제품 자산을 실제 source 기준으로 판정하거나 `not applicable` 이유를 남겼다.
- [ ] API/state/code와 accessibility 계약이 문서 및 타입과 일치한다.
- [ ] icon/asset/map symbol이 있으면 전용 suitability gate를 통과했다.
- [ ] normal/narrow/light/dark와 compound state를 수동 검토했다.
- [ ] Storybook이 component 계약만 보여주고 제품 화면을 복제하지 않는다.
- [ ] 표적 검사와 최종 검사를 기록했다.

## 토큰 소스 범위

AI/Figma가 읽는 토큰 맵은 `tokens/source.json`에 있습니다.
런타임 component token layer는 `tokens/components.css`에 있습니다.
AI 도구로 UI를 생성하기 전에는 `docs/AI_DESIGN_SYSTEM_GUIDE.md`를 읽습니다.
Figma Variables export/import, 토큰 lifecycle, deprecation, breaking change 기준은 `docs/TOKEN_GOVERNANCE.md`를 우선합니다.

## Storybook 범위

Storybook은 모든 구현 세부사항이 아니라 실제로 필요한 컴포넌트 상태를 문서화합니다. 원본 카드와 1:1 비교하기 위한 `visual-parity` story는 `!dev` 태그로 sidebar에서 숨기고, public story에는 대표 상태만 남깁니다.
Public Storybook title은 사용자 탐색 기준입니다. `LDS Core/Foundation`, `LDS Core/Components/<family>`, `LDS Theme/...`, `LDS Product/...`, `LDS Robotics/...`를 사용하고, `1 Theme`, `2 Element`, `3 Component / 2 Action` 같은 WDS 원천 번호 체계는 `docs/references/wds/`의 근거 데이터에만 남깁니다.
Public export의 canonical Storybook evidence 최상위 prefix는 [`OWNER_AUTHORITY_CONTRACT.json`](https://github.com/LK-Design-System/lk-design-system/blob/lds-v0.1.0-rc.69.31/docs/references/architecture/OWNER_AUTHORITY_CONTRACT.json)의 live `storybookPrefix` owner와 일치해야 합니다. `direct-wds` 같은 provenance는 WDS 추적 근거이지 Storybook 또는 package owner를 자동으로 결정하지 않습니다. Core renderer로 Theme variant나 Robotics 전용 asset vocabulary를 설명하는 별도 확장 페이지는 실제 title owner를 유지하면서 `LAYER_CLASSIFICATION.json`의 `storyLayerExceptions` historical evidence projection에 primary export owner와 구체적 이유를 동기화합니다. 이 projection은 cross-layer evidence를 감사하기 위한 것이며 live page/package owner를 만들거나 덮어쓰지 않습니다.
`LDS Product`와 `LDS Robotics` story는 재사용 가능한 확장 컴포넌트나 패턴이어야 합니다. 완성 앱 화면, 템플릿, 워크플로우, 데모 페이지는 Storybook public surface로 추가하지 않습니다.
디자인 시스템 계약은 Storybook 문서 페이지가 아니라 `docs/` 아래 Markdown 문서와 검증 스크립트에 둡니다. 도메인별 기준은 별도 결과 화면을 만들지 않고 관련 컴포넌트 story와 `docs/ROBOTICS_PATTERNS.md` 같은 문서 계약에 반영합니다.
우선순위:

- 기본 상태
- disabled 또는 error 상태
- 밀도 높은 dashboard 상태
- 관련 있는 경우 inverse/dark 상태
- 도메인 운영에 특화된 상태

## CI 범위

GitHub Actions workflow는 `main` push, pull request, manual dispatch에서 실행됩니다.
검증 항목:

- `npm ci`로 의존성 설치
- 패키지 빌드
- 기계가 읽을 수 있는 토큰 소스 검증
- public `.d.ts` surface와 `any` 누출 검증
- 디자인 시스템 계약 문서와 자동 contract 검증
- `private: true` 내부 Git 소비 / GitHub Packages 전환 정책 검증
- 실제 소비 앱 Vite production smoke
- TypeScript typecheck
- 생성된 source와 `dist/` drift 검사
- Storybook 정적 빌드
- 인벤토리/문서 수치 drift 검사
- Storybook public surface 중복/숨김 guard
- Storybook 구현 story 접근성 guard
- package dry run
- 런타임 dependency audit


## Publish policy

현재 패키지는 `private: true` 상태로 유지합니다. 기본 운영 모델은 내부 Git 소비이며, npm publish가 필요해지는 시점에만 GitHub Packages registry 설정과 함께 `package.json`, 문서, CI 정책을 명시적으로 변경합니다. `npm run check:pack`은 사용 가능한 package manager로 pack dry run을 실행해 패키지 파일 구성이 깨지지 않는지 확인합니다.
