# Agent Skill Reference

| Field | Value |
| --- | --- |
| Type | Convention |
| Status | Current |
| Owner | Robotics domain engineering |
| Last reviewed | 2026-08-16 |

이 문서는 소비 레포의 **에이전트 스킬이 로보틱스 UI 작업 시점에 로드하는 도메인 규칙 요약**이다. LDS Core 패키지가 배포하는 `lds-ui` 스킬(`@lk-design-system/lds-core/docs/agent-skills/lds-ui/`)이 로보틱스 작업에서 이 문서로 라우팅한다. 설치된 패키지에서는 `@lk-design-system/lds-robotics-ui/docs/domain/AGENT_SKILL_REFERENCE.md`로 도달한다.

상세 정본은 형제 문서들이다: [NAVIGATION_EXPRESSION_CONVENTIONS.md](NAVIGATION_EXPRESSION_CONVENTIONS.md), [NAVIGATION_COORDINATE_CONTRACT.md](NAVIGATION_COORDINATE_CONTRACT.md), [OCCUPANCY_MAP_CONVENTIONS.md](OCCUPANCY_MAP_CONVENTIONS.md), [OVERLAY_STATUS_CHIP.md](OVERLAY_STATUS_CHIP.md), [ROBOTICS_UI_ADOPTION.md](ROBOTICS_UI_ADOPTION.md). 산문과 컴포넌트 동작이 다르면 배포 Storybook의 play 단언이 정본이다.

## 좌표 — 직접 투영 금지

- 원시 world/ROS 좌표를 SVG 오버레이에 직접 넘기지 않는다. `adaptWorld*` / `adaptRos*` + `createNavigationMapTransform`만 통과시키고, 활성 지도는 `NavigationCoordinateBoundary`로 감싼다.
- 모든 지오메트리 레코드는 `mapId` / `frameId` / `mapVersion` / `stamp`를 유지한다. x/y 숫자가 우연히 같다고 같은 좌표계가 아니다.
- ROS yaw를 SVG `rotate()`에 직결하지 않는다 — `worldHeadingToSvg()` / `svgHeadingToWorld()`를 쓴다. 골 배치·영역 편집·히트 검사·측정은 제공된 역변환(`screenToWorld`)을 쓰고, 수식을 제품 코드에 재구현하지 않는다.
- `NavigationCoordinateError`를 잡아서 identity 변환으로 대체하지 않는다 — 그것은 데이터 오류다.

## 톤 위계 — 빨강은 예약어다

- `danger` = 위험·금지·차단·데이터 오류 **전용**.
- **"지금 못 쓴다"는 알람이 아니다**: 운영상 사용 불가는 muted(회색) + 슬래시 도형으로 탈색한다. 빨강을 빌리지 않는다.
- `invalid`는 객체 전체 재도색이 아니라 빨간 `!` 배지 1개 + `aria-invalid`.
- 정상·휴지 상태는 상태색을 싣지 않는다: ready 상태는 초록이 아니고, deadman 해제는 neutral이다.
- 베이스맵(점유 지도)은 중립 3상태(free/occupied/unknown)만 — accent·warning·danger 금지. accent 파랑은 current/active/selected 내비게이션 콘텐츠에 예약.

## 마커와 선의 문법

- **마커당 solid 상태 배지는 1개.** 여러 상태는 우선순위로 접고(Waypoint `invalid > stale`, Facility `invalid > stale > unknown`), 접근성 이름에는 전부 남긴다. 배지 스택 금지.
- **선(Lane/Route/Trajectory)은 배지를 달지 않는다.** 상태는 스트로크 톤 + 텍스트로. Lane은 어떤 상태에서도 `4 6` 대시(1.5px)를 유지하고 톤만 바꾼다. Trajectory는 solid 2.25px + 샘플 점 하나의 정체성을 유지한다.
- **방향 화살표·진행 헤드·재생 커서를 추가하지 않는다.** 현재 위치·헤딩의 유일한 소유자는 `RobotPoseMarker`다.

## 상호작용 4축 — 서로 색을 빌리지 않는다

| 축 | 표현 | 금지 |
| --- | --- | --- |
| highlight (프리뷰) | 1.12× + standoff 링, 포인터와 함께 소멸 | 상태로 고정하기 |
| selection | 1.25× + selection seat (기하만) | accent·focus 색 차용 |
| keyboard focus | `--color-semantic-focus-indicator`, non-scaling, 대비 백킹 | 선택 의미로 오용 |
| data-state | 페인트·대시·배지 | 위 축들과 혼합 |

우선순위: danger/error > 키보드 포커스 > 선택 > 일반 맵 컨텍스트.

## 모션·불투명도

- 정적 심각도(위험 등급)는 절대 펄스하지 않는다. 반복 모션은 명시적으로 모델링된 라이브 상태(`moving` 모션 링, stale 신선도 펄스)에만.
- 공유 어휘: disabled 0.45, stale 0.76.

## 레이블·히트

- 지도 레이블은 기본 `labelVisibility="interaction"`. 여러 오버레이는 하나의 `NavigationAnnotationLayer` 아래에서 충돌 조정한다.
- 모든 인터랙티브 맵 요소는 어느 줌에서도 24×24 CSS px 히트 타깃을 유지한다(측정된 스케일을 내려보낸다). 320px 폭에서 가로 오버플로 금지.

## 안전 컨트롤

- 비활성 사유는 레이아웃을 밀지 않는 칩으로: `position: absolute` + `pointer-events: none` + `role="status"`, **`inert` 서브트리 밖**에 배치.
- 정지 요청 대기 중에는 native `disabled`가 아니라 `aria-disabled` + `aria-busy`(포커스 보존). 잠긴 뒤 포커스가 body로 떨어지면 안 된다.
- "요청됨" ≠ "접수됨(ACK)" ≠ "정지됨"을 카피로 구분한다.

## 플릿 상태

- 로봇 행 전체를 단일 `status` 값에서 유도하지 않는다. Connection / Freshness / Operability / Mission / Safety / Control / Authority / Attention은 직교 축이다.
- offline ≠ stale ≠ unavailable ≠ e-stopped — 서로 다른 사실이다. `unknown`(진실을 모름) ≠ `unsupported`(능력이 없음).
- `attention`은 파생된 정렬·알림 보조일 뿐, 원천 축을 대체하지 않는다.

## 소유 경계

Robotics UI가 소유: 표현 + 순수 투영/검증 헬퍼. 제품이 소유: 라이브 데이터, 권한, 워크플로, 커맨드, 복구 정책, **안전 권한**, TF 권위, 로컬라이제이션. WebGL/Three/R3F는 LDS3D 관할이다.

그래프 데이터는 어댑터/스토어 경계에서 `assertNavigationMapGraph`로 검증한다 — 깨진 참조에 대체 글리프를 그리지 않는다.
