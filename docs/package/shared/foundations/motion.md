# Motion

| Field | Value |
| --- | --- |
| Type | Foundation guide |
| Status | Current |
| Owner | Foundation owner |
| Source | `foundation-content.json#motion` |

전환의 원인과 결과를 설명하고 공간·상태 연속성을 보존하되 주의를 빼앗거나 실시간 데이터를 과장하지 않습니다.

## 목적과 원리

- motion은 관계와 상태 변화를 설명합니다.
- macro와 micro motion을 구분합니다.
- reduced-motion에서도 정보와 완료 신호가 남습니다.

## Semantic model

| 역할 | 의미 |
| --- | --- |
| Macro | 화면·region·navigation 전환 |
| Micro | control feedback·disclosure·progress |
| Enter/Exit | 등장과 퇴장의 방향·속도 |
| Expressive | 드물게 쓰는 브랜드 강조 |

## 선택 기준

| 상황 | 사용 | 피함 |
| --- | --- | --- |
| hover/press | fast duration | slow decorative animation |
| drawer/sheet | base/slow + spatial continuity | opacity만으로 순간 교체 |
| live telemetry | 대부분 무모션 | 값마다 pulse |
| progress | determinate motion | 완료를 animation만으로 전달 |

## 정량 규칙

| 항목 | 기준 |
| --- | --- |
| Fast | 120ms |
| Base | 200ms |
| Slow | 320ms |
| Reduced motion | transform·continuous animation 제거, 상태는 즉시 반영 |

## Do / Don't

| 구분 | 지침 |
| --- | --- |
| Do | enter와 exit의 origin을 trigger/region 관계에 맞춥니다. |
| Don't | 모든 component에 같은 transition: all을 적용합니다. |
| Do | interrupt와 rapid repeat 상태를 검증합니다. |
| Don't | 색·motion만으로 severity를 전달합니다. |

## 예외

- loading spinner는 작업이 진행 중임을 텍스트/aria-busy와 함께 표현합니다.
- 사용자 직접 manipulation은 reduced-motion에서도 즉시 pointer를 따라갈 수 있습니다.

## 접근성

- prefers-reduced-motion을 존중하고 flash를 제한합니다.
- focus 이동을 animation 종료에 의존시키지 않습니다.

## 국제화

- motion 자체는 번역되지 않지만 방향성 transition은 RTL logical direction을 확인합니다.
- 상태 문구 길이가 달라도 duration을 텍스트 길이에 맞춰 임의 연장하지 않습니다.

## LDS 예시

| 상황 | 결정 |
| --- | --- |
| SideNav | 폭 전환은 200ms 이내, reduced-motion에서는 즉시 전환하고 focus는 같은 control에 유지 |
| Toast | 등장은 transient feedback을 알리지만 결과 텍스트와 dismiss action이 의미를 소유 |

## 토큰과 API

### Tokens

- `--dur-fast`
- `--dur-base`
- `--dur-slow`
- `--ease-*`

### Components and checks

- `npm run check:motion-hygiene`
- `prefers-reduced-motion`

## 참고 자료
