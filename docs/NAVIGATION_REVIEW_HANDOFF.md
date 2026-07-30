# Navigation 시각 검토 — 인수인계

작성 2026-07-29, 개정 2026-07-30. LDS Robotics `Navigation` 그룹을 **렌더해서 눈으로 보고
수치로 재는** 방식으로 검토한 기록. 픽스처를 읽어서가 아니라 실제 출력에서 나온 결함만 담았다.

7-30 개정에서 **이전 판 §3.1(Lane 폐쇄/충돌)을 철회했다.** "구현 누락"이라고 단정한 건
오진이었고, 그걸 그대로 믿으면 테스트 3개를 깨는 방향으로 들어간다. §6의 첫 항목이 경위다.

---

## 1. 현재 상태

| 레포 | 브랜치 | HEAD | 푸시됨 |
| --- | --- | --- | --- |
| `lk-design-system-robotics` | `main` | 이 커밋 | 푸시 필요 |
| `lk-design-system` | `main` | `162bc0f2` | O |

**CI는 지금 빨간불이다.** `check:storybook`이 `check:visual-regression`에서 죽는다.
원인이 셋이고 §5에 적었다 — 두 개는 베이스라인이 낡은 것이고 하나는 이번 작업의 의도된
시각 변경이다. **베이스라인 재생성은 "지금 렌더가 정답"이라는 승인이라 사람이 판단할 일이다.**

그 외 검사는 전부 통과한다: `types` · `lds-style` · `ownership` · `coordinates` ·
`navigation-graph` · `navigation-encoding` · `representative-stories` · `story-play`(109/109) ·
`build` · `pack`.

---

## 2. 검토 범위 — 어디까지 봤나

### 2.1 시각 검토 (Navigation 그룹 51개 = 개요 12 + 나머지 39)

| 구분 | 방식 | 결과 |
| --- | --- | --- |
| 개요 12개 | **시각 검토** (전수) | 7건 발견 → 7건 수정 |
| 나머지 39개 | **기하 자동 스윕** (전수) | 5건 발견 → 5건 수정 |
| 나머지 39개 중 6개 | **시각 검토** | 5건 발견 → 2건 수정, 3건 미해결 |
| 나머지 33개 | 시각 검토 **안 함** | — |

스윕은 **기하만** 본다(넘침·라벨 충돌·가로 스크롤·타깃 크기). 색 위계, 상태가 제대로
읽히는지, 문구가 맞는지는 검사하지 않는다. 개요에서 나온 7건 중 스윕으로 잡혔을 만한 건
하나도 없었다 — 전부 사람이 봐야 나왔다. **33개를 눈으로 보는 일이 남아 있다.**

시각 검토한 6개: `waypoint--compound-state-priority`, `regions--dark-patterns-and-states`,
`facility-transition--availability-and-source-states`, `hazard-marker--states`,
`path-system-lane--lane-states-and-constraints`, `path-system-trajectory--statuses`

### 2.2 play 함수 전수 실행 (레포 전체 109개)

7-30에 추가했다. **범위가 Navigation이 아니라 레포 전체다.** `check:story-play`가
`storybook-static`의 모든 story 엔트리(109개, `!test` 태그 0개)를 실제로 렌더하고 play를
돌린다. 4-way 병렬로 26초.

**현재 109/109 통과. `story-play-known-failures.json`은 비어 있다(count 0).**
처음 돌렸을 때 7건이 실패했고 전부 수정했다 — 경위는 §4.

---

## 3. play를 아무도 돌리지 않고 있었다

`package.json`에 play를 실행하는 스크립트가 **없었다.** `check:storybook`은 index·style·
스크린샷 4장만 봤다. play는 사람이 그 스토리를 열 때만 돌았다.

그래서 **6건이 조용히 실패한 채 살아 있었고**, `ecd9a00`에서 들어간 회귀 2건도 아무 신호
없이 푸시됐다. Trajectory sample에 표면색 링(`stroke`)을 둘렀는데 play가
`data-trajectory-sample`에 `stroke`가 **없어야** 한다고 단언한다 — 유효한 궤적은 끊김 없는
한 줄이어야 한다는 규약이었다. 반경 2.4는 두고 링만 제거했다(선은 잇고 굵기로만 구분).

`check:story-play`는 **래칫**이다. 목록에 없는 실패가 나면 죽고, **고정된 스토리가 통과해도
죽는다**(목록에서 빼라고 요구한다). 두 번째가 없으면 목록이 조용히 헐거워진다. 양방향 다
조작해서 확인했다.

```bash
npm run check:story-play                                 # 검증
npm run check:story-play -- --only=<id>,<id>             # 일부만
npm run check:story-play -- --update-known-failures      # 목록 재생성(리뷰 대상)
```

실패 판정은 콘솔 스크레이핑이 아니라 **Storybook preview 채널**
(`playFunctionThrewException` / `storyThrewException` / `storyErrored`)에서 읽는다.
콘솔 방식은 폰트 404 같은 무관한 에러를 실패로 오인한다.

---

## 4. 결함 — 전부 수정됨

기록해둔 11건을 모두 닫았다. **남은 미해결 결함은 없다.** 아래는 무엇이 원인이었는지의
기록이고, 대부분이 세 가지 뿌리로 모인다.

### 4.1 뿌리 1 — 라벨 기본값이 `interaction`이다 (5건)

`labelVisibility` 기본값이 `interaction`이라 hover/focus/selected 없이는 라벨이 아예 안
뜬다([`_navigationAnnotations.js:30,44`](../src/components/robotics/_navigationAnnotations.js)).
"N가지를 비교하라"가 본론인 명세 스토리들이 정작 무엇이 무엇인지 못 보여주고 있었고,
라벨 존재를 단언하는 play는 그대로 실패했다.

| 스토리 | 증상 | 처방 |
| --- | --- | --- |
| `path-system-lane--lane-states-and-constraints` | 폐쇄/충돌이 라벨 없이 동일 픽셀 | `labelVisibility="always"` |
| `regions--dark-patterns-and-states` | 4개 중 1개만 이름 | 같음 |
| `path-system-trajectory--statuses` | 3개 다 이름 없음(eyebrow는 셋 다 TRAJECTORY) | 같음 |
| `hazard-marker--narrow-viewport` | 긴 라벨이 주제인데 라벨이 없음 | 같음 |
| `annotation-layer--no-provider-baseline` | layer를 빼니 라벨 요청도 같이 빠짐 | 픽스처에 disclosure 인자 추가 |

**`selected`로 드러내지 말 것.** 선택은 굵기를 바꾼다(Lane casing 4→6·core 1.5→3) —
정작 보여줘야 할 기본 두께가 사라진다. `facility-transition--facility-transition-overview`
한 곳만 `selected`를 쓰는데(`ecd9a00`) 거기는 선택 자체가 주제라 괜찮다.

### 4.2 뿌리 2 — 단언이 실물과 어긋나 있었다 (3건)

- **`path-system--overview`**: `--viewer-route`를 찾는데 그 토큰은 존재하지 않는다(산문 2곳
  + 이 단언에만 있고 정의가 없다). 실제 톤은 `RouteOverlay`의 `ROUTE_IDENTITY_TONE`
  (`--color-semantic-data-viz-series-5`)이고 매니페스트에도 그것만 있다. 단언과 규약 문서를
  실물에 맞췄다.
- **`waypoint--light-and-dark`**: `label.left - focus.right`로 재서, 라벨이 반대쪽으로
  뒤집히면 -73.91px 같은 값이 나왔다. 실제 여유는 2.61px(3px 미달)이었다. 양쪽·양축을 보는
  side-agnostic 측정으로 바꾸고, 픽스처를 패널 안쪽으로 옮겨 뒤집힘 자체를 없앴다.
- **`lane-short-path-compound-states`**: "경로가 glyph 행보다 짧아야 한다"는 노후화 감지
  단언이 제대로 작동한 것. availability/conflict가 점 뱃지를 잃어 행이 2개(32px)로 줄면서
  56단위 경로(35.2px)가 더 넓어졌다. 경로를 42단위로 줄였다.

### 4.3 뿌리 3 — 고정 크기가 폭에 따라 안 맞는다 (3건)

- **`shared-rules--narrow-viewport`**: `minmax(72px…) minmax(110px…) minmax(160px…)` + gap
  = 366px 하한이 320px를 63px 넘겼다. 레포 관용구인
  `repeat(auto-fit, minmax(min(200px, 100%), 1fr))`로 교체.
- **`foundation-viewer-tokens--narrow-viewport`**: 320px에서 스와치가 더 감겨 보드가
  26px 잘렸다. `toneFrameHeight` 640 → 720(Linux 폰트 메트릭 여유 포함).
- **`path-system-trajectory--statuses`**: 3열에서 540폭 지도가 ~152px로 축소되는데 카드는
  270px 고정이라 아래 절반이 비었다. `PathMap`에 옵트인 `aspectRatio`를 추가하고 2열로
  바꿨다. **`height: 'auto'`만 주면 안 된다** — ViewerFrame의 200px 하한이 카드 높이가 되고
  240px 지도가 넘쳐 스케일바가 잘린다.

### 4.4 그 외 2건

- **Regions 패턴 뭉갬**: `invalid-door-area`가 지형 밴드(x 88–412, y 178–254) 안에 있었다.
  (411, 134)로 옮겼다 — x가 424가 아닌 이유는 이 스토리에 annotation layer가 없어서
  424에서는 상세 줄이 패널 경계 안쪽 0.2px에 걸렸기 때문이다.
- **Hazard 선택 4px**: `NAV_SELECTION.pinScale` 1.12 → 1.25(`waypointScale`과 동일).
  Hazard는 외곽선을 severity에 이미 쓰므로 선택에 테두리를 더하면 삼중 윤곽이 된다.
  하드코딩돼 있던 `"1.12"` 단언 4곳도 상수 참조로 바꿨다.

---

## 5. 시각 베이스라인이 깨져 있다

`check:visual-regression`이 죽는 원인이 **둘이고, 성격이 다르다.**

| 문제 | 귀속 |
| --- | --- |
| `smoke-linux`(**CI가 실제로 쓰는 세트**)에 현재 타깃 4개 중 3개가 없다. 37개가 옛 이름(`robotics-viewer-map` 등)으로 남아 있고 `robotics-navigation-viewer`, `-narrow`, `robotics-occupancy-map`이 전부 부재 → Linux에서 `Missing visual baseline`으로 죽는다 | `8800180` 이후 **이전부터** |
| `smoke`(Windows) `robotics-navigation-viewer` 치수 불일치 1180×1501 → 1133 | **`ecd9a00`** — 그 스토리를 66줄, `Stage.shared`를 148줄 고치고 베이스라인을 안 돌렸다 |
| `atom-facility-lift-marker` 7.37% / `@8x` 18.10% 차이 | **§4.4의 `pinScale` 1.12 → 1.25** — 의도된 변경이다. 이 atom은 lift 전이가 **선택된** 스토리에서 잘라내므로 핀이 커진 만큼 달라진다. 같은 스토리의 `atom-facility-door-marker`와 `atom-waypoint-point`는 0.000%로 무변화 |

`capture-visual-smoke.mjs`는 `platform === 'linux' ? 'smoke-linux' : 'smoke'`로 세트를
고른다. 그래서 Windows에서 로컬로 고쳐도 CI는 안 고쳐진다. `smoke-linux`는
`workflow_dispatch`의 `update_visual_baseline: true`로만 만들어진다.

**베이스라인 재생성은 "지금 렌더가 정답"이라는 승인이다.** `ecd9a00`의 시각 변경을 통째로
정답으로 굳히는 일이니 사람이 판단해야 한다.

---

## 6. 함정 — 나를 헤매게 한 것들

앞선 판단이 여러 번 뒤집혔다. 같은 데서 시간 쓰지 않도록 남긴다.

**스토리 `description`을 규약으로 읽지 마라. 테스트를 읽어라.** 이전 판 §3.1은
"Lane의 conflict가 별도 패턴으로 렌더돼야 하는데 누락됐다"고 단정했다. 근거는 스토리
`description` 한 줄이었다. 실제로는 **같은 파일의 play 3곳**(`:266`, `:515`, `:950`)이
`[data-lane-conflict-pattern]`의 존재를 **금지**하고,
`NAVIGATION_EXPRESSION_CONVENTIONS.md:116`이 "closed/conflict is danger"를 규약으로
명시한다. `hasConflict`가 `closed`와 같은 삼항 가지에 있는 건 실수가 아니라 `:264`가
"conflict must take danger precedence over unknown"을 요구해서다. 그대로 만들었으면 테스트
3개를 깼다. **틀린 건 구현이 아니라 스토리 본문이었다**(7-30에 본문을 규약대로 고쳤다).

**표면색 링/knockout을 넣을 때 그 선이 "끊기지 않아야" 하는지 먼저 확인하라.**
Trajectory sample에 링을 둘러 가독성을 올렸는데, 그게 곧 선을 끊는 것이어서 규약 위반이
됐다. 굵기만 키우고 색은 그대로 두는 쪽이 두 요구를 다 만족했다.

**스윕은 네 방향 최대값을 쓴다.** `포인터 전용 7px`이 오른쪽인 줄 알고 오른쪽만 쟀다가
"넘침 없음"이라 오판했다. 실제로는 **위쪽** 7px이었다. 한 스토리는 **왼쪽** 14px, 다른 하나는
**아래쪽** 13px이었다. 반드시 네 방향을 다 재라.

**억제된 라벨도 박스를 갖는다.** `opacity: 0`이라 화면엔 없는데 `getBoundingClientRect`는
값을 준다. 가시성 필터 없이 충돌을 세면 "억제가 잘 된" 라벨끼리 겹친다고 21건 오탐이 났다.
`label-suppression-priority`는 14개 중 6개 억제가 **정상 동작**이다.

**Lane·Regions 스토리는 `NavigationAnnotationLayer`를 안 쓴다.** 그래서 라벨 협상이 아예 안
돌고 `placement=natural`로 앉는다. 여기에 레이어를 씌우면 고쳐질 것 같지만 **Lane은 100%
억제된다** — 라벨이 137×110px인데 패널이 312×142px이라(높이의 77%) 어떤 배치도 안 들어간다.
클램프·nudge 재순회를 넣어도 마찬가지다. 시도 4가지 전부 실패했으니 다시 하지 마라.

**표면색 knockout은 흰 배경에서 사라진다.** 지도 위에서만 검증하면 통과처럼 보인다.
스펙 시트 스토리(흰 카드)에서도 확인해야 한다.

**`LayerPanel`의 `tone`은 고정 의미론 집합**이다(`neutral|signal|positive|cautionary|
negative|warning|danger`). 임의 색을 넘기면 조용히 기본값으로 떨어진다. 실제로 `plan`을
넘겼다가 무시당했다.

**`Map2DCanvas`는 `toolbarPlacement="bottom-right"`를 하드코딩**하고 prop으로 노출하지
않는다. `ViewerFrame`의 `top-right`는 헤더 안 in-flow 자리라 세로 스택을 못 넣는다(그래서
`scope` 슬롯을 새로 만들었다).

**`@lk-robotics/lds-core` / `lds-product`는 고정 버전 설치**(0.1.0-rc.1)다. workspace 링크가
아니라서 robotics 레포에서 못 고친다. 토큰 매니페스트는
`lk-design-system/docs/references/package-split/ROBOTICS_EXTERNAL_SURFACE.json`에 있고,
robotics의 토큰 사용이 바뀌면 저기서 동기화해야 conformance가 통과한다.

**기준선 비교용 워크트리는 Vite에서 안 돌아간다.** `git worktree` + `node_modules` 정션으로
옛 커밋 스토리북을 띄우려 했는데, 스토리가 `@lk-robotics/lds-robotics-ui/...` 자기 참조로
import해서 전부 404가 났다. 되는 방법은 **본 레포에서 `git stash` → `git checkout <기준>` →
측정 → `git checkout main` → `git stash pop`**이다. 이 방식으로 7건의 귀속을 갈랐다.

**스토리 수정 직후 스윕을 돌리면 재컴파일 전 상태를 잰다.** 안정화 대기를 넣어뒀지만
(텍스트 위치가 두 번 연속 같아질 때까지), dev 서버 재컴파일은 별개다. 결과가 이상하면 한 번
더 돌려라.

**어휘 상수를 고치면 스토리와 컴포넌트가 서로 다른 값을 본다.** 컴포넌트는
`../src/index.js`(상대 경로)로 들어오지만 스토리가 쓰는
`@lk-robotics/lds-robotics-ui/components/robotics/_navigationVocabulary`는 `exports` 맵을 타고
**`dist/`로 간다.** `pinScale`을 src에서 1.25로 바꿨더니 컴포넌트는 1.25를 렌더하고 단언은
1.12를 기대해서 실패했다. `npm run build`로도 부족하다 — dev 서버가 그 패키지를 사전 번들해
캐시하므로 **`build:storybook` 후 `storybook-static`에 대고 검증**해야 한다. CI는
`npm run check`(build 포함)를 `check:storybook`보다 먼저 돌려서 자연히 일관된다.

**하드코딩된 상수 리터럴을 단언에 쓰지 마라.** `"1.12"`가 단언 4곳과 산문 3곳에 박혀 있어
값을 못 건드리는 상태였다. `RoboticsNavigationWaypoint.stories.jsx`가 하던 대로
`NAV_SELECTION`을 import해 템플릿으로 쓰면 드리프트가 안 생긴다.

**`annotation-layer--overview`의 hover 단언은 flaky하다.** 3회 중 1회
"Hover must reveal only the inspected waypoint label: 0/3"으로 떨어진다. 내 변경과 무관하며
(hover 시뮬레이션 경합) 아직 안 고쳤다. `check:story-play`가 CI에서 간헐 실패하면 여기다.

---

## 7. 도구

스크래치패드(세션 한정, 사라질 수 있음):
`C:\Users\MSI\AppData\Local\Temp\claude\C--Users-MSI-Documents-lds-ws\09273a33-d985-48a1-ab7a-cc1620f51093\scratchpad`

| 파일 | 용도 |
| --- | --- |
| `shoot-nav.mjs` | 스토리 캡처(포트 6008). `node shoot-nav.mjs <출력폴더> <storyId...>` |
| `shoot-6006.mjs` | 같은 것, 포트 6006(design-system) |
| `sweep.mjs` | 기하 전수 스윕. `node sweep.mjs http://127.0.0.1:6008/iframe.html $(cat ids.txt)` |
| `ids.txt` / `nav-ids.txt` | 나머지 39개 / Navigation 62개 스토리 id |

Playwright는 robotics 레포 `node_modules`에서 절대경로로 import한다(스크래치패드에는
node_modules가 없다). 레포 안 스크립트는 `@playwright/test`를 정상 import한다.

스토리북 실행: `npm run storybook`(6008) — `.claude/launch.json`의 `robotics-storybook`.

---

## 8. 검증 명령

```bash
cd lk-design-system-robotics
npm run check              # lds-style, ownership, coordinates, navigation-*, build, types, pack
npm run check:storybook    # + representative-stories, story-play, visual-regression
```

`check:lds-style`는 `../lk-design-system`의 conformance CLI를 쓴다.

`check:story-play`는 `storybook-static`이 있어야 한다(`check:storybook`이 먼저 빌드한다).
단독으로 돌릴 땐 `npm run build:storybook`을 먼저.

**현재 통과**: `types` · `lds-style` · `ownership` · `coordinates` · `navigation-graph` ·
`navigation-encoding` · `representative-stories` · `story-play` · `build` · `pack`
**현재 실패**: `visual-regression` (§5)

`check:dimension-literals`(design-system 쪽)는 `BatteryGauge`·`ConnectionBadge`·`ViewerFrame`의
기존 리터럴 때문에 실패 상태다. 이번 작업과 무관하다.

---

## 9. 다음 순서 제안

1. **§5 베이스라인** — 이제 유일한 빨간불이고, 이게 빨간 동안은 다른 시각 회귀를 못 잡는다.
   `smoke-linux`는 `workflow_dispatch`(`update_visual_baseline: true`)로만 만들어진다.
   `atom-facility-lift-marker` 하나는 이번 작업의 의도된 변경이라 승인 대상이다.
2. **`annotation-layer--overview` hover flake** — §6 마지막 항목. CI 간헐 실패의 원인이 된다.
3. **나머지 33개 시각 검토** — `상호작용` 계열과 `320px` 계열이 남았다. 결함 목록이 비었으니
   다음 신호는 여기서 나온다. play가 잡는 것은 단언이 걸린 것뿐이고, 색 위계·문구·빈 공간은
   여전히 사람이 봐야 나온다. 이번에 고친 11건 중 **자동 검증이 스스로 찾아낸 것은 7건**이고
   나머지 4건은 사람이 봐서 나왔다 — 그 비율이 33개에도 그대로 적용될 것이다.
