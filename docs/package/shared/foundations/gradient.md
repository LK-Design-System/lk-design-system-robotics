# Gradient

| Field | Value |
| --- | --- |
| Type | Foundation guide |
| Status | Current |
| Owner | Foundation owner |
| Source | `foundation-content.json#gradient` |

gradient를 정보 의미가 아니라 제한된 전환·fade에 사용하고, 장식적 브랜드 배경에는 단색 semantic surface를 사용합니다.

## 목적과 원리

- gradient는 콘텐츠 대비를 해치지 않습니다.
- 방향과 stop은 token으로 재사용합니다.
- 상태·진행률의 유일한 단서로 사용하지 않습니다.

## Semantic model

| 역할 | 의미 |
| --- | --- |
| Solid fade | surface에서 transparent로 한 방향 fade |
| Multiple fade | surface·fill·transparent의 계층 fade |
| Mask fade | 콘텐츠 clipping/fade mask |

## 선택 기준

| 상황 | 사용 | 피함 |
| --- | --- | --- |
| 스크롤 경계 fade | mask token | 불투명 overlay |
| 브랜드 stage | solid semantic surface | 장식 gradient |
| 상태 표현 | solid semantic surface | gradient severity |

## 정량 규칙

| 항목 | 기준 |
| --- | --- |
| Directions | top·right·bottom·left |
| Stops | 승인 token 외 임의 stop 금지 |
| Text contrast | gradient 전체 구간에서 기준 충족 |

## Do / Don't

| 구분 | 지침 |
| --- | --- |
| Do | 콘텐츠가 이어짐을 암시하는 edge mask로 사용합니다. |
| Don't | 읽어야 할 텍스트를 gradient 아래 숨깁니다. |
| Do | light/dark에서 stop 의미를 확인합니다. |
| Don't | 버튼마다 다른 장식 gradient를 만듭니다. |

## 예외

- 승인된 brand asset은 전용 gradient를 가질 수 있습니다.
- 데이터 시각화의 continuous scale은 별도 chart color scale 계약을 따릅니다.

## 접근성

- mask 뒤의 interactive content가 pointer·keyboard로 접근 불가능해지지 않아야 합니다.
- 움직이는 gradient는 reduced-motion에서 정지합니다.

## 국제화

- gradient 안에 포함된 text가 번역 길이로 다른 stop 영역에 이동해도 대비를 유지해야 합니다.

## LDS 예시

| 상황 | 결정 |
| --- | --- |
| ScrollArea 하단 | bottom mask로 더 많은 콘텐츠가 있음을 암시하되 scroll control은 유지 |
| Hero | brand-surface 단색 면 위 텍스트 대비를 light/dark에서 검증 |

## 토큰과 API

### Tokens

- `--decorate-gradient-*`
- `--decorate-mask-fade-*`
- `--color-semantic-brand-surface`

### Components and checks

- `FoundationDecorate story`

## 참고 자료
