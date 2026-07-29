# Navigation 시각 검토 — 인수인계

작성 2026-07-30. LDS Robotics `Navigation` 그룹을 **렌더해서 눈으로 보고 수치로 재는** 방식으로
검토한 기록. 픽스처를 읽어서가 아니라 실제 출력에서 나온 결함만 담았다.

---

## 1. 현재 상태

| 레포 | 브랜치 | HEAD | 푸시됨 |
| --- | --- | --- | --- |
| `lk-design-system-robotics` | `main` | `8a371f3` | O |
| `lk-design-system` | `main` | `162bc0f2` | O |

### 미커밋 (중요)

`lk-design-system-robotics`에 **`src/components/robotics/HazardMarker.jsx` 1개가 미커밋**이다.
severity 이중 윤곽 수정으로, 검사(`check:types` / `check:lds-style` / `check:ownership` /
`build`) 전부 통과했고 시각 확인도 끝났다. 커밋만 안 됐다.

---

## 2. 검토 범위 — 어디까지 봤나

`Navigation` 그룹 스토리는 개요 12 + 나머지 39 = 51개(Docs·parity 제외).

| 구분 | 방식 | 결과 |
| --- | --- | --- |
| 개요 12개 | **시각 검토** (전수) | 7건 발견 → 7건 수정 |
| 나머지 39개 | **자동 스윕** (전수) | 5건 발견 → 5건 수정 |
| 나머지 39개 중 6개 | **시각 검토** | 5건 발견 → 1건 수정, **4건 미해결** |
| 나머지 33개 | 시각 검토 **안 함** | — |

스윕은 **기하만** 본다(넘침·라벨 충돌·가로 스크롤·타깃 크기). 색 위계, 상태가 제대로
읽히는지, 문구가 맞는지는 검사하지 않는다. 개요에서 나온 7건 중 스윕으로 잡혔을 만한 건
하나도 없었다 — 전부 사람이 봐야 나왔다. **33개를 눈으로 보는 일이 남아 있다.**

시각 검토한 6개: `waypoint--compound-state-priority`, `regions--dark-patterns-and-states`,
`facility-transition--availability-and-source-states`, `hazard-marker--states`,
`path-system-lane--lane-states-and-constraints`, `path-system-trajectory--statuses`

---

## 3. 미해결 결함

### 3.1 Lane — 폐쇄와 충돌이 시각적으로 동일 (최우선)

`lds-robotics-navigation-path-system-lane--lane-states-and-constraints`

```
lane-closed            availability=closed   #EE5656  dash 4 6  1.5px
lane-unknown-conflict  availability=unknown  #EE5656  dash 4 6  1.5px   ← 완전히 같음
```

스토리 제목이 "폐쇄와 충돌은 **같은 상태가 아니며**"이고 본문이 "conflict는 그 위에
**겹치는 별도 패턴**입니다(점 뱃지가 아니라)"라고 명시하는데, **그 패턴이 렌더되지
않는다.** `[data-lk-lane-overlay]` 안의 추가 패스는 casing(표면색 4px)과 히트 영역
(투명 24px)뿐이다.

부수적으로 `availability=unknown`이 `closed`와 같은 빨강을 쓴다.

컴포넌트가 문서화한 표현이 구현되지 않은 케이스라 `LaneOverlay.jsx`를 봐야 한다.

### 3.2 라벨이 하나만 뜸 — 3개 스토리 반복

| 스토리 | 개체 | 라벨 |
| --- | --- | --- |
| `regions--dark-patterns-and-states` | 4 | 1 |
| `path-system-trajectory--statuses` | 3 | 0 |
| `facility-transition--availability-and-source-states` | 3 | 1 |

전부 "N가지를 비교하라"가 본론인데 무엇이 무엇인지 알 수 없다.

**처방은 이미 검증됐다** — `facility-transition--facility-transition-overview`에서 각 개체에
`selected`를 주어 해결했다(커밋 `ecd9a00`). 라벨 정책이 `interaction` 기본이라 선택된 것만
이름이 뜬다.

### 3.3 Trajectory 다크 카드 하단 절반이 빔

`path-system-trajectory--statuses` — 카드 ~420px에 지도 ~220px. 어두운 배경이라 빈 공간이
특히 두드러진다.

### 3.4 Regions — 오류 영역이 경사면 영역과 겹침

`regions--dark-patterns-and-states`의 `invalid-door-area`(center 420,214 r30)가
`slopeRegion`(x 88–412, y 178–254)과 겹쳐 두 패턴이 뭉갠다. 픽스처 좌표 문제.

### 3.5 Hazard — 선택 표시가 4px 차이뿐

`기본` 35×42 → `선택됨` 39×47 (`NAV_SELECTION.pinScale` 1.12). 지도 위에 흩어져 있으면
비교 대상이 없어 구분 불가.

`SpatialRegion`은 선택 시 외곽선 1.5→3.5, `LaneOverlay`는 casing 확대인데 Hazard만 배율이다.
**다만 3.6의 이중 윤곽과 충돌한다** — 선택에도 테두리를 쓰면 `위험 + 선택됨`이 삼중 윤곽이
된다. 배율을 키우는 쪽(1.12 → 1.25)이 덜 충돌한다.

### 3.6 (완료·미커밋) Hazard severity 이중 윤곽

주의/위험이 같은 실루엣에 색만 달라 라벨이 억제되면 색이 유일한 채널이었다(WCAG 1.4.1).

1차 시도(표면색 한 겹)는 **흰 카드·밝은 지도에서 배경에 묻혀 무력**했다. 2차로 바깥 severity
색 5px + 안쪽 표면색 2.5px 두 겹으로 바꿔 어느 배경에서도 "윤곽이 두 줄"이라는 실루엣 차이가
남는다. 시각 확인 완료.

---

## 4. 도구

스크래치패드:
`C:\Users\MSI\AppData\Local\Temp\claude\C--Users-MSI-Documents-lds-ws\09273a33-d985-48a1-ab7a-cc1620f51093\scratchpad`

| 파일 | 용도 |
| --- | --- |
| `shoot-nav.mjs` | 스토리 캡처(포트 6008). `node shoot-nav.mjs <출력폴더> <storyId...>` |
| `shoot-6006.mjs` | 같은 것, 포트 6006(design-system) |
| `sweep.mjs` | 기하 전수 스윕. `node sweep.mjs http://127.0.0.1:6008/iframe.html $(cat ids.txt)` |
| `ids.txt` | 나머지 39개 스토리 id |

Playwright는 robotics 레포 `node_modules`에서 절대경로로 import한다(스크래치패드에는
node_modules가 없다).

스토리북 실행: `npm run storybook`(6008) — `.claude/launch.json`의 `robotics-storybook`.

---

## 5. 함정 — 나를 헤매게 한 것들

앞선 판단이 여러 번 뒤집혔다. 같은 데서 시간 쓰지 않도록 남긴다.

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

**스토리 수정 직후 스윕을 돌리면 재컴파일 전 상태를 잰다.** 안정화 대기를 넣어뒀지만
(텍스트 위치가 두 번 연속 같아질 때까지), dev 서버 재컴파일은 별개다. 결과가 이상하면 한 번
더 돌려라.

---

## 6. 검증 명령

```bash
cd lk-design-system-robotics
npm run check:types
npm run check:lds-style      # ../lk-design-system의 conformance CLI를 씀
npm run check:ownership
npm run build
```

`check:dimension-literals`(design-system)는 `BatteryGauge`·`ConnectionBadge`·`ViewerFrame`의
기존 리터럴 때문에 실패 상태다. 이번 작업과 무관하다.

시각 회귀는 `npm run check:visual-regression`인데 `storybook-static` 재빌드가 선행돼야 하고,
캡처 대상이 4개(`react-robotics-viz`, `robotics-navigation-viewer`,
`robotics-navigation-viewer-narrow`, `robotics-occupancy-map`)뿐이라 Fleet·Navigation 스토리는
포함되지 않는다.

---

## 7. 다음 순서 제안

1. **`HazardMarker.jsx` 커밋** — 이미 검증 끝, 커밋만 남음
2. **3.1 Lane 폐쇄/충돌** — 구현 누락이라 영향이 가장 크다
3. **3.2 라벨 부재 3건** — 처방이 검증돼 있어 빠르다
4. **3.3~3.5** — 픽스처·배율 조정
5. **나머지 33개 시각 검토** — `상호작용` 계열과 `320px` 계열이 남았다
