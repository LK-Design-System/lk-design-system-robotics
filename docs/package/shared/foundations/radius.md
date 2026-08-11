# Radius

| Field | Value |
| --- | --- |
| Type | Foundation guide |
| Status | Current |
| Owner | Foundation owner |
| Source | `foundation-content.json#radius` |

표면의 규모·상호작용·포함 관계를 일관된 모서리 체계로 표현하고 중첩 surface의 이중 perimeter를 방지합니다.

## 목적과 원리

- 같은 component family는 같은 radius role을 사용합니다.
- 부모 surface가 perimeter를 소유하면 자식은 embedded variant를 사용합니다.
- pill은 의미 있는 capsule·avatar·tag에 제한합니다.

## Semantic model

| 역할 | 의미 |
| --- | --- |
| Small | checkbox·small chip |
| Medium | button·input·control |
| Frame | card·panel·sheet scale |
| Pill | tag·avatar·indicator |

## 선택 기준

| 상황 | 사용 | 피함 |
| --- | --- | --- |
| control | component radius token | 화면별 10/11/13px |
| card/panel | frame radius | pill |
| nested surface | embedded variant | borderRadius:0 style override |

## 정량 규칙

| 항목 | 기준 |
| --- | --- |
| Base scale | 6·8·10·12·14·16·20·24·32px |
| Frame | 12·14·16·20px |
| Pill | 999px 이상 |

## Do / Don't

| 구분 | 지침 |
| --- | --- |
| Do | component token 또는 scale alias를 사용합니다. |
| Don't | 같은 family에서 임의 radius를 섞습니다. |
| Do | border·overflow·focus ring clipping을 함께 확인합니다. |
| Don't | 중첩 카드마다 외곽 radius와 shadow를 반복합니다. |

## 예외

- 지도 marker와 circular control은 geometry contract가 우선합니다.
- 외부 brand asset의 고유 silhouette는 LDS radius로 자르지 않습니다.

## 접근성

- focus outline이 overflow clipping으로 사라지지 않아야 합니다.
- target 크기는 radius와 무관하게 최소 기준을 만족합니다.

## 국제화

- 긴 번역으로 control이 wrap할 때 capsule이 과도하게 커지지 않는지 확인합니다.

## LDS 예시

| 상황 | 결정 |
| --- | --- |
| Input | --component-input-radius 사용 |
| Embedded DataGrid | 부모가 border/radius를 소유하고 DataGrid는 embedded variant |

## 토큰과 API

### Tokens

- `--radius-*`
- `--radius-frame-*`
- `--component-*-radius`

### Components and checks

- `Card`
- `Banner embedded`
- `DataGrid embedded`
- `ViewerFrame embedded`

## 참고 자료
