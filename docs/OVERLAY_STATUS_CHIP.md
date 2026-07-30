# Overlay Status Chip — 표면 위 비차단 상태 칩

| Field | Value |
| --- | --- |
| Type | Convention |
| Status | Current |
| Owner | Robotics domain engineering |
| Last reviewed | 2026-07-30 |
| Source | `src/components/robotics/_OverlayStatusChip.jsx` (internal) · 업스트림 제안: `lk-design-system/docs/OVERLAY_STATUS_CHIP_PROPOSAL.md` |

상호작용 표면(제어 영역, 뷰어 프레임)이 **떠 있는 채로 비활성**일 때, 그 이유를
표면 위에 얹어 말하는 알약형 상태 표시다. 업스트림 표현 규약의 "새 표현은
문서에 먼저 정의한다" 원칙에 따라 이 문서가 정의를 소유한다.

## 이 표현이 존재하는 이유

문제는 장식이 아니라 **레이아웃 불변**이다. 활성화 장치(deadman)는 초당 여러 번
눌렀다 떼는 물건이라, 차단 사유를 흐름 내 요소(Banner·Callout·notice bar)로
끼우면 누를 때마다 제어가 상하로 출렁인다. 조작 중인 컨트롤과 비상 정지 버튼의
위치 불변은 안전 HMI의 기본이므로, 사유 표시는 레이아웃에 참여하지 않아야 한다.

기존 하우스 요소가 못 맞는 이유:

| 후보 | 탈락 사유 |
| --- | --- |
| `Banner` / `Callout` | 블록 요소 — 삽입 시 컨트롤을 민다 |
| `Notification` | 화면 구석의 일시 알림 — 표면에 앵커된 상시 상태가 아니다 |
| `Tooltip` | 호버 트리거 — 상태는 포인터와 무관하게 보여야 한다 |
| `StatusIndicator` | 고정된 코어 버전에 아직 없음(코어 범프 시 재검토) |

## 계약

1. **레이아웃 불참**: `position: absolute`, 호출부 컨테이너(`position: relative`)
   기준 상단 중앙. 등장·소멸이 어떤 요소도 밀지 않는다.
2. **포인터 불참**: `pointer-events: none`. 칩은 컨트롤을 설명하는 것이지
   컨트롤이 아니며, 재활성화 입력을 가로채면 안 된다.
3. **inert 밖**: 설명 대상 컨트롤이 `inert`여도 칩은 그 서브트리 밖에 있어
   스크린리더가 계속 읽는다. `role="status"`.
4. **하우스 톤 문법 미러링**: 글리프는 코어 `STATUS_TONE_STYLE`을 따른다
   (neutral=`circle-info`, cautionary=`triangle-exclamation-fill`,
   negative=`circle-close-fill`). 로보틱스가 제2의 톤 매핑을 만들지 않는다.
5. **휴지 상태는 무채색**: hold-to-run 컨트롤에서 활성화 장치 해제는 기본
   상태이지 결함이 아니다. `neutral`은 상태색을 싣지 않고, cautionary/negative는
   실제로 격상되는 경우(포커스 상실 등)에만 쓴다.

## 소비처 (2026-07-30)

- `ManualControlSession` — deadman 대기(`neutral`), 포커스 상실(`cautionary`).
  play 단언이 계약 1·2·3을 고정한다(`RoboticsManualControlSession.stories.jsx`).

## 승격 경로

내부 모듈(`_OverlayStatusChip.jsx`, 공개 export 아님) → 제품 근거 축적 →
업스트림 제안 문서 심사 → 코어 `Status` 가족 편입 시 이 파일 삭제 후 코어
import로 교체. 어두운 영상 위 변형(`VIEWER_OVERLAY` 스크림)은 소비처가 생기기
전까지 만들지 않는다 — 확장 지점으로만 제안 문서에 기록한다.
