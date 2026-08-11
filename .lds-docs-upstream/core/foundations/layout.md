# Layout

| Field | Value |
| --- | --- |
| Type | Foundation guide |
| Status | Current |
| Owner | Foundation owner |
| Source | `foundation-content.json#layout` |

콘텐츠 목적·밀도·작업 관계에 따라 grid, container, shell, region을 선택하고 viewport 변화에도 읽는 순서와 작업 맥락을 유지합니다.

## 목적과 원리

- 레이아웃 유형은 콘텐츠 목적에서 결정합니다.
- grid는 정렬 도구이지 모든 영역을 같은 중요도로 만드는 장치가 아닙니다.
- 시각·DOM·keyboard 순서를 일치시킵니다.

## Semantic model

| 역할 | 의미 |
| --- | --- |
| Content layout | 읽기와 정보 전달 중심 |
| Dashboard layout | 운영·관리·데이터 작업 |
| Grid | columns·gutter·margin·span |
| Regions | header·navigation·main·aside |

## 선택 기준

| 상황 | 사용 | 피함 |
| --- | --- | --- |
| 읽기 중심 페이지 | Container + Section | DashboardGrid |
| 동등한 반복 surface | DashboardGrid | 중요도가 다른 surface를 자동-fit |
| 목록+상세 | PrimaryDetail/Split | 두 독립 카드 임의 배치 |
| 캔버스 도구 | CanvasEditorShell | 일반 dashboard shell에 도구 패널 누적 |

## 정량 규칙

| 항목 | 기준 |
| --- | --- |
| Breakpoints | sm 768·md 992·lg 1200·xl 1600px |
| Grid | mobile 2·tablet 3·desktop 12 columns |
| Gutter/margin | 20px base |
| Narrow | 320px에서 page-level horizontal overflow 금지 |

## Do / Don't

| 구분 | 지침 |
| --- | --- |
| Do | span으로 정보 중요도와 읽는 순서를 표현합니다. |
| Don't | 모든 KPI를 화면 맨 위 동일 카드로 강제합니다. |
| Do | 좁은 폭에서 region 전환과 focus restore를 정의합니다. |
| Don't | CSS order로 DOM 읽기 순서를 뒤집습니다. |

## 예외

- DataGrid처럼 열 맥락이 필수인 component만 자체 horizontal scroll을 소유합니다.
- 지도·영상 canvas는 renderer viewport를 유지하되 controls와 text alternative가 reflow합니다.

## 접근성

- 한 개의 main과 이름 있는 반복 landmark를 유지합니다.
- skip link·focus order·zoom reflow를 layout 완료 조건에 포함합니다.

## 국제화

- 긴 번역·RTL에서 action group이 의미 순서를 바꾸지 않고 wrap해야 합니다.
- safe area는 화면 소유 layout에서 한 번만 적용합니다.

## LDS 예시

| 상황 | 결정 |
| --- | --- |
| 운영 대시보드 | DashboardShell→PageHeader→상태/작업→supporting data 순서 |
| 320px | navigation은 임시 surface로 전환하고 content는 한 열로 수렴 |

## 토큰과 API

### Tokens

- `--bp-*`
- `--grid-*`
- `--container-*`
- `--gap-*`
- `--mobile-safe-area-*`

### Components and checks

- `Container`
- `Grid`
- `Columns`
- `Col`
- `Split`
- `DashboardShell`
- `PrimaryDetail`

## 참고 자료
