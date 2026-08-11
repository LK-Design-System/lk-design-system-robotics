# 로딩 패턴

| Field | Value |
| --- | --- |
| Type | Cross-component pattern guide |
| Status | Current |
| Owner | Design system owner |
| Last reviewed | 2026-07-24 |

로딩을 표현하는 컴포넌트는 여섯 개다. 이 문서는 컴포넌트 각각의 계약(각 `.prompt.md`)이 아니라
**그 사이의 선택** — 어떤 상황에서 무엇을, 예상 시간에 따라 어떻게 고르고, 시작→진행→완료→실패
단계마다 무엇을 보여주는가 — 를 소유한다. 시나리오는 소비 제품이 붙기 전까지 설계 가설이며,
실사용 데이터가 생기면 이 문서의 숫자부터 다시 검증한다.

## 요소 선택

| | Spinner | Skeleton | ProgressBar / CircularProgress | Dimmer | ResourceState |
| --- | --- | --- | --- | --- | --- |
| 형태 | 회전 인디케이터 | 콘텐츠 구조의 회색 예고 | 확정(determinate) 진행률, 선형/원형 | 영역을 덮는 스크림 | 상태 머신을 가진 리소스 표면 |
| 적합 | 짧고 범위가 좁은 작업 | 레이아웃이 예측 가능한 콘텐츠 | 시작·끝이 있는 연속 작업(업로드·변환·내보내기) | 이미 보이는 영역의 일시 차단 | 위젯·표·차트처럼 수명 내내 상태가 바뀌는 표면 |
| 시간대 | ~4초 | 1~10초 | 4초 이상, 특히 10초+ | 재요청·재계산 동안 | 전 구간(loading→ready→stale→error) |
| 유의 | 여러 개 동시 사용 금지 — 화면이 깜빡이는 인상 | 실제 레이아웃과 다르면 역효과 | 진행률을 모르면 쓰지 않는다(indeterminate 변형은 Spinner와 동일 역할) | 페이지 전체를 막지 않는다 | 직접 조립하지 말고 이것을 쓴다 |

**Skeleton과 Spinner 사이의 선택**: 로드될 콘텐츠의 구조를 미리 알면 Skeleton, 모르면(또는
공간이 좁으면) Spinner. 같은 화면에서 두 방식을 섞으면 로딩의 심각도가 두 가지로 읽힌다.

### 제한적 Theme 변형: Brand Spinner

기본 로딩 신호는 Core Spinner다. 브랜드 진입점이나 제품 전환처럼 기다림과 함께
LK ROBOTICS라는 출처를 강조해야 할 때만 Brand Spinner를 사용한다. 일반 콘텐츠·버튼·부분
영역 로딩에는 사용하지 않는다. Brand Spinner도 이 문서의 범위·시간·배치·접근성 규약을
그대로 따르며, 동작과 API의 정본은 Core Spinner다.

## 범위와 위치 계약

로딩 표시는 **무엇이 기다리는가**와 같은 범위에 둔다. 표시가 놓인 위치보다 넓은 영역을
막거나, 더 좁은 영역만 갱신하는 것처럼 오해하게 만들지 않는다.

| Loading scope | 표시 위치 | 기본 선택 | 금지 |
| --- | --- | --- | --- |
| 단일 control | Button·입력 control 내부 | control의 `loading` 상태 | 페이지 Spinner·Dimmer를 함께 표시 |
| 특정 region | 카드·표·차트·뷰어 내부 | `ResourceState`, Skeleton 또는 중앙 Spinner | 관련 없는 sibling까지 차단 |
| 기존 콘텐츠가 있는 region | 해당 region 위 | 콘텐츠 유지 + refreshing, 정말 막아야 할 때만 `Dimmer` | 콘텐츠를 지우고 새 Skeleton으로 교체 |
| page·route | 유지되는 shell 안의 바뀌는 content region | Skeleton, region Spinner, 측정 가능한 route progress | navigation·shell까지 무조건 전체 차단 |
| 장기 작업 | 작업이 시작된 위치 + 지속 상태 표면 | 확정 progress, 남은 단계, 취소·background 처리 | 화면을 떠나면 진행 상태를 잃는 일회성 Spinner |

### 한 범위에는 하나의 주 로딩 신호

같은 loading scope에는 **dominant indicator를 하나만** 둔다. Skeleton 위 Spinner,
`Button loading`과 page Dimmer, indeterminate ring과 indeterminate bar를 같은 작업에
겹치지 않는다. 별개의 region이 독립적으로 로드되는 대시보드는 region마다 하나씩 가질 수
있지만, page 전체에 다시 하나를 더 얹지 않는다.

Overlay 여부는 콘텐츠 존재와 실제 상호작용 가능 여부로 결정한다.

- 첫 진입처럼 뒤에 유효한 콘텐츠가 없으면 Skeleton 또는 Spinner만 두고 빈 overlay를 만들지 않는다.
- 기존 콘텐츠를 보존하면서 읽기만 허용할 수 있으면 `refreshing`으로 표시하고 차단하지 않는다.
- 데이터 정합성 때문에 상호작용을 막아야 할 때만 해당 region에 `Dimmer`를 두고
  `inert`·`aria-busy`까지 함께 소유한다.

## 시간 기준

임계값은 [Nielsen의 응답 시간 한계](https://www.nngroup.com/articles/response-times-3-important-limits/)
(0.1초/1초/10초)를 기준으로 하며, 아직 실사용 데이터로 보정되지 않았다.

- **~1초**: 아무것도 표시하지 않는다. 이 구간에 인디케이터를 넣으면 플리커가 된다. 지연이
  1초를 넘길 수 있는 작업만 인디케이터를 예약한다.
- **1~4초**: Spinner 또는 Skeleton. 진행률 표시는 오히려 과하다.
- **4~10초**: Skeleton(구조를 알 때) 또는 진행률(`ProgressBar`/`CircularProgress`, 진행을
  측정할 수 있을 때). 사용자가 지루함을 느끼기 시작하는 구간이므로 무엇이 진행 중인지
  텍스트로 밝힌다.
- **10초 이상**: 확정 진행률 + 예상 시간 또는 남은 단계. 시스템이 살아 있다는 증거를
  주기적으로 갱신한다(`RefreshControl`의 "마지막 업데이트" 문법).
- **1분 이상**: 진행률 + 취소 수단 + 가능하면 백그라운드 처리 후 완료 통지(`Toast`).
  `DataExportAction`이 이 계약의 선례다(진행 중 상태·취소·완료 통지).

시간 구간은 indicator 선택을 위한 기본값이지 네트워크 timeout 정책이 아니다. 특정 제품
사례의 “5초에 안내, 10초에 실패” 같은 숫자를 공통 규칙으로 복사하지 않는다. 실패 시점은
API·재시도·안전 정책을 소유한 제품이 정하고, LDS는 느려진 작업에 설명을 추가하고 측정 가능한
진행으로 승격하는 표현 계약만 소유한다.

## 범용 상황 매트릭스

로보틱스 사례를 보기 전에 제품 종류와 무관한 여섯 상황으로 loading scope를 정한다.

| 상황 | 유지할 것 | 권장 신호 | 완료·실패 전환 |
| --- | --- | --- | --- |
| 첫 진입 | 준비된 shell과 navigation | 구조를 알면 Skeleton, 모르면 region Spinner | 콘텐츠 또는 blocking error로 대체 |
| page·route 전환 | 이전 shell·이동 맥락 | 바뀌는 content region의 Skeleton·Spinner, 측정 가능하면 progress | 새 route focus와 제목을 갱신 |
| 추가 데이터 로드 | 이미 읽고 있는 목록·스크롤 위치 | 목록 끝의 작은 Spinner 또는 placeholder row | 도착분만 추가하고 실패는 inline retry |
| 데이터 재요청 | 마지막 정상 데이터 | `ResourceState refreshing`, 필요 시 region Dimmer | freshness 갱신 또는 보존 데이터 + error |
| 저장·제출 | 입력값·활성 control의 focus | 실행 control 자체의 `loading` | 성공 통지 또는 field/summary 오류 |
| 상태·미디어 전환 | 안정적으로 표시 가능한 이전 상태 | 바뀌는 subregion의 Spinner·Skeleton | 새 상태로 원자적 교체하거나 이전 상태 유지 |

## 상황별 선택 (로보틱스 운영 도메인 — 설계 가설)

- **route 전환**(시설·로봇 상세 이동): app shell과 navigation은 유지하고 본문 region만 로드한다.
  이동 대상의 구조를 알면 Skeleton, 모르면 region Spinner를 쓰며 전체 app을 Dimmer로 막지 않는다.
- **대시보드 첫 진입**(위젯별 텔레메트리 로드): 위젯마다 `ResourceState state="loading"` —
  Skeleton을 자체 렌더하고 `aria-busy`와 polite 공지를 소유한다. 페이지 전체 Spinner로
  개별 위젯의 실패를 가리지 않는다.
- **맵·비디오 등 무거운 뷰어 진입**: 뷰어 프레임의 상태 슬롯(로딩 라벨)을 쓰고, 프레임
  바깥에 별도 인디케이터를 두지 않는다.
- **데이터 재요청**(새로고침·필터 변경): 콘텐츠를 지우지 않는다. `ResourceState
  state="refreshing"`은 기존 콘텐츠를 유지한 채 상태만 알리고, 영역 단위 차단이 필요하면
  `Dimmer`(+`Spinner`)가 해당 영역만 덮고 `aria-busy`·`inert`로 실제 차단까지 소유한다.
- **명령 제출**(수동 제어·설정 저장): 제출 컨트롤 자체의 `Button loading` — 버튼은
  포커스를 유지한 채(`aria-disabled`) "불러오는 중"을 낭독하고, 성공·실패는 `Toast`/`Banner`가
  이어받는다. 폼 전체를 Dimmer로 덮지 않는다.
- **추가 로드**(로그 테일·목록 더보기): 뷰포트를 live region으로 만들지 않는다. `LogViewer`가
  선례다 — 도착분 요약만 상시 announcer로 공지하고 뷰포트는 `aria-live="off"`.

## 단계별 피드백

`ResourceState`의 상태 머신이 이 절의 코드 구현이다. 직접 조립하는 표면도 같은 순서를 따른다.

1. **시작**: 1초 규칙을 넘길 작업만 인디케이터 표시. 컨테이너에 `aria-busy` — 시각과 보조기술이
   같은 시점에 "진행 중"을 안다.
2. **진행**: 측정 가능하면 확정 진행률로 승격. 진행 표시의 reduced-motion 정지는 컴포넌트가
   소유하므로(`!important` 계약) 소비자가 재구현하지 않는다.
3. **완료**: 짧은 작업은 조용히 콘텐츠로 대체. 사용자가 명시적으로 시작한 작업만 완료를
   통지(`Toast`)하고, 신선도는 `RefreshControl`의 "마지막 업데이트"로 남긴다.
4. **실패**: 무엇이 실패했고 다음에 뭘 할 수 있는지를 함께 — 콘텐츠가 남아 있으면 비차단
   (`ResourceState`의 preserved `error`: 기존 콘텐츠 유지 + polite), 콘텐츠가 없으면 차단
   (`EmptyState` 표면 + assertive alert). 재시도 액션은 실패 메시지 옆에 둔다. 실패를
   성공처럼 표시하지 않는다 — `CopyButton`의 실패 상태 계약이 선례다.

## 관련 계약

각 컴포넌트의 정확한 API·접근성 계약은 `components/status/Spinner.prompt.md`,
`Skeleton.prompt.md`, `ProgressBar.prompt.md`, `CircularProgress.prompt.md`,
`components/overlay/Dimmer.prompt.md`, `components/data/ResourceState.prompt.md`,
`components/data/RefreshControl.prompt.md`가 소유한다. Storybook에서 실물은
`LDS Core/Patterns/Loading`, `LDS Product/Status/Progress`,
`LDS Core/Components/Overlay/Dimmer`, `LDS Product/Data/Operations` 그룹에서 확인한다.
