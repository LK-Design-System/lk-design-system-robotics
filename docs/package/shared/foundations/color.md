# Color

| Field | Value |
| --- | --- |
| Type | Foundation guide |
| Status | Current |
| Owner | Foundation owner |
| Source | `foundation-content.json#color` |

색을 장식이 아니라 surface, foreground, border, action, status, data visualization 역할로 사용하고 모든 theme에서 의미와 대비를 보존합니다.

## 목적과 원리

- 역할이 값보다 우선합니다.
- 상태는 foreground·surface·border·text의 묶음입니다.
- 상태와 데이터 범주는 서로 대체하지 않습니다.

## Semantic model

| 역할 | 의미 |
| --- | --- |
| Atomic | 팔레트 생성용 원색 |
| Semantic | background·label·line·status·data-viz 역할 |
| Component | 컴포넌트별 안정 alias |
| Mode | light·dark·auto |

## 선택 기준

| 상황 | 사용 | 피함 |
| --- | --- | --- |
| 본문과 라벨 | label-strong/normal/neutral/alternative | assistive/disable을 필수 텍스트에 사용 |
| 상태 문구 | status-*-text + status-*-surface | 선명한 signal 색 위 흰 글자 |
| 차트 계열 | data-viz-series-* | positive/negative를 단순 범주색으로 사용 |

## 정량 규칙

| 항목 | 기준 |
| --- | --- |
| Text contrast | 일반 텍스트 WCAG 4.5:1 이상 |
| Focus/non-text | 필수 시각 경계 3:1 이상 |
| Status | 색과 텍스트 또는 아이콘을 항상 함께 제공 |

## Do / Don't

| 구분 | 지침 |
| --- | --- |
| Do | 상태 surface·border·text를 같은 tone family로 조합합니다. |
| Don't | 한 상태색 하나를 배경·글자·테두리에 반복하지 않습니다. |
| Do | light/dark 양쪽에서 실제 조합을 검증합니다. |
| Don't | atomic palette를 component에서 직접 참조하지 않습니다. |

## 예외

- 브랜드 로고처럼 고유색이 식별 의미인 자산은 승인된 color icon으로 유지합니다.
- disabled 표현은 핵심 정보를 전달하지 않는 경우에만 낮은 대비를 허용합니다.

## 접근성

- 색만으로 상태·선택·경로·심각도를 전달하지 않습니다.
- 대비 gate가 없는 새 조합은 public contract로 승인하지 않습니다.

## 국제화

- 색 이름으로 지시하지 말고 위치·기능·상태 이름을 사용합니다.
- 문화권마다 다른 색 의미를 안전·오류의 유일한 단서로 사용하지 않습니다.

## LDS 예시

| 상황 | 결정 |
| --- | --- |
| 장비 경고 | negative surface + text + triangle icon + '연결 끊김' 문구 |
| 차트 | series token과 Legend의 shape/dash label을 함께 사용 |

## 토큰과 API

### Tokens

- `--color-atomic-*`
- `--color-semantic-*`
- `--component-*-bg/fg/border`

### Components and checks

- `npm run check:colors`
- `stories/Foundations.stories.jsx`

## 참고 자료
