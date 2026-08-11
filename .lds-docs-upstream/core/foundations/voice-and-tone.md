# Voice and Tone

| Field | Value |
| --- | --- |
| Type | Foundation guide |
| Status | Current |
| Owner | Foundation owner |
| Source | `foundation-content.json#voice-and-tone` |

LK 운영 제품이 정확하고 차분하며 책임 있게 말하도록 고정된 voice와 상황별 tone 변화를 정의합니다.

## 목적과 원리

- 정확성은 친근함보다 우선합니다.
- 사용자의 다음 안전한 행동을 돕습니다.
- 시스템 능력과 확인 수준을 과장하지 않습니다.
- 권한·보안·삭제·보존·외부 영향은 부드러운 표현을 위해 의미를 약화하지 않습니다.

## Semantic model

| 역할 | 의미 |
| --- | --- |
| Voice | precise·calm·dependable·operational |
| Neutral tone | 일반 안내·설명 |
| Urgent tone | 안전·중단·데이터 손실 위험 |
| Supportive tone | 복구·학습·빈 상태 |
| Destructive tone | 대상·결과·외부 영향·복구 가능성을 직접 설명 |

## 선택 기준

| 상황 | 사용 | 피함 |
| --- | --- | --- |
| 일반 상태 | 간결한 사실형 | 마케팅 표현 |
| 안전 경고 | 직접적이며 영향·행동 명시 | 유머·완곡어 |
| 복구 가능 오류 | 원인+다음 행동 | 사용자 탓 |
| 성공 | 검증된 결과만 확인 | 요청 접수를 완료로 표현 |
| 권한·보안 | 현재 제한과 실제 요청 경로를 명시 | 완곡어로 제한을 숨기거나 없는 해결책 제시 |
| 삭제·연결 해제 | 대상·영향·복구 가능성을 구체적으로 설명 | 서로 다른 결과를 제거·정리 같은 말로 통합 |

## 정량 규칙

| 항목 | 기준 |
| --- | --- |
| Error | 원인 1문장 + 다음 행동 1문장 |
| Critical | 대상·영향·즉시 행동을 첫 화면에 |
| Terminology | sent·accepted·applied·confirmed를 구분 |
| Destructive confirmation | 대상·결과·복구 가능성과 구체적인 확인 action을 첫 화면에 |

## Do / Don't

| 구분 | 지침 |
| --- | --- |
| Do | 로봇 A의 연결이 끊겼습니다. 네트워크를 확인한 뒤 다시 연결해 주세요. |
| Don't | 오류가 발생했습니다! |
| Do | 설정 요청을 전송했습니다. 적용 여부를 확인하는 중입니다. |
| Don't | 설정이 완료되었습니다. |
| Do | 경로 3개를 삭제합니다. 삭제한 경로는 복구할 수 없습니다. |
| Don't | 선택한 항목을 정리할까요? |

## 예외

- 법적·보안 문구는 승인된 원문과 tone을 우선합니다.
- 현장 안전 절차는 간결성을 이유로 필수 단계를 생략하지 않습니다.

## 접근성

- 긴급성은 색·느낌표·motion이 아니라 heading·명시적 문구·순서로 전달합니다.
- screen reader announcement도 같은 의미와 urgency를 사용합니다.

## 국제화

- voice는 유지하되 존대·문장 구조는 locale 문화와 glossary에 맞춥니다.
- 직역으로 책임 주체나 시제가 사라지지 않게 검토합니다.

## LDS 예시

| 상황 | 결정 |
| --- | --- |
| Offline | 현재 사실→영향→복구 행동 순서 |
| Empty | 없음의 종류를 구분하고 가능한 다음 행동만 제시 |
| Permission | 현재 제한→영향을 받는 행동→실제로 가능한 요청 경로 순서 |
| Destructive | 대상→결과→외부 영향→복구 가능성→구체적 확인 action 순서 |

## 토큰과 API

### Tokens

- `status color roles`
- `typography hierarchy`

### Components and checks

- `DESIGN.md`
- `AI_DESIGN_SYSTEM_GUIDE.md`
- `Writing foundation`
- `COPY_REVIEW_CONTRACT.md`

## 참고 자료
