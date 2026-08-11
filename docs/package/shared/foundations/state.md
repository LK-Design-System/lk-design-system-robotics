# State

| Field | Value |
| --- | --- |
| Type | Foundation guide |
| Status | Current |
| Owner | Foundation owner |
| Source | `foundation-content.json#state` |

사용 가능성·상호작용·선택·비동기·오류·freshness를 서로 다른 상태 축으로 표현하고 시각·API·접근성 계약을 일치시킵니다.

## 목적과 원리

- interaction state와 domain state를 혼합하지 않습니다.
- 상태 이름은 family를 넘어 일관되게 사용합니다.
- 색·opacity만으로 상태를 전달하지 않습니다.

## Semantic model

| 역할 | 의미 |
| --- | --- |
| Interaction | normal·hovered·focused·pressed |
| Selection | selected·checked·expanded |
| Availability | enabled·disabled·restricted |
| Async/resource | loading·refreshing·empty·error·stale·offline |

## 선택 기준

| 상황 | 사용 | 피함 |
| --- | --- | --- |
| 잠시 처리 중 | loading/pending | disabled로만 표현 |
| 선택됨 | selected + aria state | hovered |
| 권한 없음 | restricted + reason | empty |
| 연결 오래됨 | stale + freshness | error로 단순화 |

## 정량 규칙

| 항목 | 기준 |
| --- | --- |
| Focus | 전역 focus-visible ring |
| Disabled opacity | 필요한 visual에만 0.45 |
| Resource states | ready·loading·refreshing·empty·error·stale·offline·restricted |

## Do / Don't

| 구분 | 지침 |
| --- | --- |
| Do | 상태 원인·범위·다음 행동을 함께 제공합니다. |
| Don't | ACK를 완료 상태라고 부릅니다. |
| Do | pressed와 selected를 별도 axis로 유지합니다. |
| Don't | loading·empty·error를 빈 화면 하나로 합칩니다. |

## 예외

- read-only는 disabled와 다르며 내용은 읽고 복사할 수 있습니다.
- offline에서도 안전한 last-good content는 stale 표시와 함께 유지할 수 있습니다.

## 접근성

- aria-pressed·selected·expanded·busy·invalid를 실제 상태와 동기화합니다.
- live region은 edge transition만 알리고 고빈도 값을 반복 발표하지 않습니다.

## 국제화

- 상태 label은 locale별 번역을 주입하고 코드 enum을 화면에 그대로 노출하지 않습니다.
- 시간·freshness는 locale formatter가 소유합니다.

## LDS 예시

| 상황 | 결정 |
| --- | --- |
| 명령 제출 | sent→accepted→applied→confirmed를 구분 |
| ResourceState | refreshing은 last-good content 유지, initial loading은 없는 content를 대체 |

## 토큰과 API

### Tokens

- `focus tokens`
- `status semantic tokens`
- `component state tokens`

### Components and checks

- `interaction prop`
- `COMPONENT_API_STATE_MATRIX.md`
- `ResourceState`

## 참고 자료
