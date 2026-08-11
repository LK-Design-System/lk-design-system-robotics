# Elevation

| Field | Value |
| --- | --- |
| Type | Foundation guide |
| Status | Current |
| Owner | Foundation owner |
| Source | `foundation-content.json#elevation` |

표면의 물리적 장식이 아니라 겹침·소유권·주의 우선순위를 일관되게 표현하고 z-index 경쟁을 방지합니다.

## 목적과 원리

- Global context와 local context를 분리합니다.
- 높이는 surface·stroke·shadow 중 가장 절제된 수단으로 표현합니다.
- in-flow 표면은 기본적으로 떠 있지 않습니다.

## Semantic model

| 역할 | 의미 |
| --- | --- |
| Global 0 | application basement |
| Global 1 | page/shell default |
| Global 2 | temporary overlay, sheet, menu |
| Global 3 | critical modal |
| Local 1–3 | content→floating action→transient feedback |

## 선택 기준

| 상황 | 사용 | 피함 |
| --- | --- | --- |
| 일반 카드/도킹 navigation | surface+divider | shadow |
| 부유 menu/tooltip | shadow-md | 새 전역 z-index |
| edge-attached overlay | 덮는 변만 shadow | 사방 shadow |
| critical confirmation | top overlay context | toast보다 낮은 임의 layer |

## 정량 규칙

| 항목 | 기준 |
| --- | --- |
| Shadow ramp | xs·sm·md·lg·xl |
| Global levels | 0–3 |
| Local levels | 1–3, 부모 global context 내부 |

## Do / Don't

| 구분 | 지침 |
| --- | --- |
| Do | 부모 stacking context 안에서 local layer를 해결합니다. |
| Don't | 자식이 전역 z-index 숫자를 올려 문제를 회피하지 않습니다. |
| Do | dark mode에서는 stroke/surface로 경계를 보완합니다. |
| Don't | 중요도를 그림자 크기로만 표현하지 않습니다. |

## 예외

- 지도·canvas renderer 내부 paint order는 DOM overlay elevation과 별도로 관리합니다.
- native popover/top-layer를 사용하면 CSS z-index 표를 우회하므로 focus·dismiss 계약을 함께 검증합니다.

## 접근성

- 겹침으로 focus target이나 읽기 순서가 가려지지 않아야 합니다.
- modal context는 focus trap과 deterministic restore를 가집니다.

## 국제화

- elevation 의미는 언어와 무관해야 하며 label을 대체하지 않습니다.
- RTL에서 attached edge와 shadow clipping 방향을 logical side로 계산합니다.

## LDS 예시

| 상황 | 결정 |
| --- | --- |
| SideNav overlay | logical end 쪽 shadow만 유지하고 docked 상태에서는 divider로 전환 |
| AlertDialog | 다른 sheet 위에서도 critical global context와 focus ownership 유지 |

## 토큰과 API

### Tokens

- `--shadow-xs`
- `--shadow-sm`
- `--shadow-md`
- `--shadow-lg`
- `--shadow-xl`
- `surface/line semantic tokens`

### Components and checks

- `Modal`
- `Drawer`
- `Sheet`
- `Tooltip`
- `Popover`
- `SideNav`

## 참고 자료
