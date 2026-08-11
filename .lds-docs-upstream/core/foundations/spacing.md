# Spacing

| Field | Value |
| --- | --- |
| Type | Foundation guide |
| Status | Current |
| Owner | Foundation owner |
| Source | `foundation-content.json#spacing` |

간격을 빈 공간이 아니라 포함·분리·순서·밀도를 표현하는 관계 토큰으로 사용합니다.

## 목적과 원리

- 같은 관계에는 같은 간격을 반복합니다.
- 내부 padding과 형제 gap과 section gutter를 구분합니다.
- 밀도는 장식을 줄이지 target·가독성을 줄이는 방식으로 만들지 않습니다.
- 레이아웃 간격은 4px 스텝을 쓰고, 컨트롤 내부의 요소 간 미세 간격에만 half step을 씁니다.

## Semantic model

| 역할 | 의미 |
| --- | --- |
| Inline | icon-label·label-value 관계 |
| Component | component 내부 padding/gap |
| Section | 콘텐츠 그룹 사이 수직 rhythm |
| Safe area | device inset과 fixed action |

## 선택 기준

| 상황 | 사용 | 피함 |
| --- | --- | --- |
| icon+label | space-1/2 | section gap |
| field label+control | space-1/2 | card gutter |
| peer cards | grid gap | 서로 다른 우선순위까지 같은 gap |
| page sections | gap-section | component padding 반복 |
| 아이콘과 라벨처럼 한 컨트롤 안의 요소 사이 | half step (--space-0-5 ~ --space-4-5) | 전체 스텝 — 한 덩어리가 두 덩어리로 읽힘 |

## 정량 규칙

| 항목 | 기준 |
| --- | --- |
| Scale | 레이아웃 0·4·8·12·16·20·24·32·40·48·64·80·112·128px |
| Half steps | 컨트롤 내부 전용 2·6·10·14·18px (--space-0-5 ~ --space-4-5) |
| Base unit | 4px |
| Safe area | layout owner가 한 번 적용 |

## Do / Don't

| 구분 | 지침 |
| --- | --- |
| Do | 관계를 먼저 이름 붙이고 token을 고릅니다. |
| Don't | 비슷해 보이는 임의 pixel을 추가합니다. |
| Do | 좁은 폭에서 gap보다 wrapping과 target을 우선합니다. |
| Don't | negative margin으로 component contract를 상쇄합니다. |

## 예외

- hairline optical alignment는 geometry상 필요한 경우 component contract에 기록합니다.
- 지도 label collision offset은 일반 spacing scale과 별도 renderer geometry일 수 있습니다.

## 접근성

- touch target 사이 accidental activation을 막을 충분한 간격을 둡니다.
- text zoom에서 line overlap이 없어야 합니다.

## 국제화

- 번역 확장 시 horizontal gap을 줄여 억지로 한 줄을 유지하지 않고 wrap합니다.
- safe area와 logical inline spacing을 사용합니다.

## LDS 예시

| 상황 | 결정 |
| --- | --- |
| PageHeader | title/meta/actions를 별도 relationship group으로 배치 |
| Bottom action | space-4 + mobile safe-area-bottom을 layout에서 적용 |

## 토큰과 API

### Tokens

- `--space-*`
- `--gap-*`
- `--mobile-safe-area-*`
- `--space-0-5`
- `--space-1-5`
- `--space-2-5`
- `--space-3-5`
- `--space-4-5`

### Components and checks

- `Stack`
- `Cluster`
- `Section`
- `Spacer`
- `ActionArea`

## 참고 자료
