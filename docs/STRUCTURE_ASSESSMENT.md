# LDS 구조 평가 — 뼈대는 상급, 갚아야 할 빚 두 갈래

| Field | Value |
| --- | --- |
| Type | Audit |
| Status | Current |
| Owner | Design system owner · Robotics domain engineering |
| Last reviewed | 2026-07-30 |
| Scope | lk-design-system(업스트림) · lk-design-system-robotics · 워크스페이스 배치 |

이 문서는 Navigation 그룹 전수 검토와 on-dark 오버레이 작업(e89bba7까지)을 마친
시점에서, 실제 작업 중 부딪힌 마찰을 근거로 LDS 전반의 구조 건강도를 평가한
스냅숏이다. 추측이 아니라 이 기간에 실제로 발생한 사건을 증거로 쓴다.

## 판정

구조 자체는 잘 잡혀 있다. 레이어링(뼈대)과 자동 강제 장치(면역계)는 평균
이상이고, 구조적 부채는 두 갈래 — **이중 모듈 그래프**와 **고정 업스트림 조율
비용** — 로 국한된다. 둘 다 현재 크기에서는 관리 가능하고, 방치하면 커지는
종류다.

## 잘 잡힌 것

### 레이어링이 실제로 지켜진다

토큰·코어(`@lk-robotics/lds-core`·`lds-product`, 고정 버전 소비) → 로보틱스
도메인 레이어 → 스토리/문서. 로보틱스에서 코어를 못 고치는 불편(예:
`ViewerFrame`의 200px min-height)이 곧 레이어가 살아있다는 증거다. 경계 위반이
물리적으로 불가능하다.

### 규약이 문서가 아니라 실행 코드로 존재한다

- **conformance RAW_COLOR** — on-dark 오버레이 작업에서 복사해온 `#101b26`
  리터럴을 실제로 잡아냈다. 룰이 장식이 아님을 스스로 증명.
- **play 함수 111개가 디자인 계약** — "충돌 표기는 pin이 소유, lane은 대시
  하나" 같은 결정을 사람이 아니라 CI가 기억한다. 산문 description은 드리프트한
  전례가 있으므로 계약의 소재는 항상 play 단언이다.
- **값의 출처가 한 곳씩** — `_navigationVocabulary`(선택·seat 어휘),
  `_viewerOverlay`(스크림 레시피), 공유 assert 모듈. 드리프트가 구조적으로
  어렵다.

### 문서 체계 (2026-07-30 확인)

업스트림 `docs/`는 색인(README) + 문서 메타데이터 규약(Type/Status/Owner/Last
reviewed) + source-of-truth 우선순위 + 날짜별 immutable handoff까지 갖춘
상급 체계다. 양 레포에 같은 이름으로 존재하는
`NAVIGATION_EXPRESSION_CONVENTIONS.md`는 중복이 아니라 의도된 분업이며,
로보틱스 쪽 문서가 서두에서 업스트림을 authoritative로 선언한다.

## 갚아야 할 빚

### 1. dist/src 이중 모듈 그래프 — 최우선

스토리가 패키지 서브패스(`@lk-robotics/lds-robotics-ui/components/robotics/*`)로
import하면 dist를, 컴포넌트가 상대경로로 import하면 src를 읽어 같은 모듈이 두
번 존재한다. React 컨텍스트가 복제되면 Provider가 **조용히** 무력화된다 —
`NavigationLabelPolicyProvider`에서 실제 발생했고 play는 못 잡았으며
스크린샷으로만 발견했다. 현재 방어는 "스토리에서 Provider는
`../src/...`에서 import" 관례+주석뿐이다. 관례는 언젠가 뚫린다.

**맞는 수리**: 스토리 전체를 한쪽 그래프로 통일(전부 src 상대경로, 또는 전부
패키지 경로 + 컨텍스트 모듈의 단일화). lint 룰로 강제할 수 있으면 더 좋다.

### 2. 고정 업스트림과의 조율 부채

하나하나는 사소하지만 쌓이면 로보틱스 쪽에 로컬 우회 레이어가 자라기 시작하고,
그것이 레이어링을 안에서부터 썩게 한다. 업스트림 반영 대기 목록:

| 항목 | 현재 상태 |
| --- | --- |
| ~~`ViewerFrame` 200px min-height 미오버라이드~~ | 2026-07-30 재조사: 오기록. `Map2DCanvas`의 `minHeight: 200`은 소비자 `style` 스프레드보다 앞이라 `style={{minHeight}}`로 오버라이드 가능(고정 dist 동일). 부채 아님 |
| ~~뷰어 위 표면 불투명도 이원화~~ | 2026-07-30 청산: 업스트림 `_viewerOverlaySurface.js`가 strong(94)/soft(72) 두 레벨을 한 소스로 정의, ViewerToolbar와 로보틱스 킷이 각자 레벨을 소비(lds-product 0.1.0-rc.2) |

2026-07-30 릴리즈 사이클(코어·프로덕트 0.1.0-rc.2)로 업스트림 조율 부채가
일괄 청산됐다: OverlayStatusChip 코어 편입(내부 모듈 삭제), Button
`loading="inline"`(정지 버튼 채택), ConnectionBadge 절단 슬래시,
StatusIndicator 채택(체크리스트 수제 행 대체), 오버레이 표면 단일 소스.

### 3. 산문과 계약의 이중 진실

스토리 description이 구현과 정반대였던 전례가 있다. 방향: 산문은 "왜"만 말하고
"무엇"은 play에 맡긴다. 현재 그렇게 수렴 중이며, 신규 문서·스토리에서 이
원칙을 유지한다.

### 4. 워크스페이스 위생

레포 밖 문제. `LK Design System/`(공백 이름)과 `lk-design-system/` 류의 중복
디렉터리 쌍이 워크스페이스에 병존한다. 진본을 아는 사람이 지금은 있지만, 구조란
모르는 사람이 와도 안 헤매는 상태여야 한다. 어느 쪽이 진본인지 결정하고
나머지를 정리(또는 README로 명시)할 것.

## 문서 체계 점검에서 나온 결함 (2026-07-30 해소)

1. ~~**`SELECTION_FOCUS_AUDIT.md` 낡음**~~ — 점 마커 전부 1.25× + selection
   seat, highlight 1.12×(`NAV_SELECTION`)로 갱신함.
2. ~~**로보틱스 `docs/`에 색인·메타데이터 규약 부재**~~ — [`README.md`](README.md)
   색인을 만들고 전 문서에 업스트림 메타데이터 헤더(Type/Status/Owner/Last
   reviewed)를 부착함. 규약 자체는 업스트림 문서 체계를 따른다고 명시.
3. (참고, 유지) 같은 파일명 `NAVIGATION_EXPRESSION_CONVENTIONS.md`의 양 레포
   병존은 분업이 명시돼 있어 결함은 아니나, 링크·검색 시 혼동 여지는 있다.

## 이 문서의 갱신 규칙

부채가 청산되거나 새 구조적 사건이 생기면 해당 절을 갱신하고 Last reviewed를
올린다. 과거 판정을 현재 상태의 근거로 단독 사용하지 않는다(업스트림
source-of-truth 순서를 따른다).
