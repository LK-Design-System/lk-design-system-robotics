# International Design

| Field | Value |
| --- | --- |
| Type | Foundation guide |
| Status | Current |
| Owner | Foundation owner |
| Source | `foundation-content.json#international-design` |

번역을 넘어 날짜·시간·숫자·단위·통화·방향·문자열 길이가 달라도 의미와 레이아웃이 유지되도록 합니다.

## 목적과 원리

- 표시 문자열과 canonical value를 분리합니다.
- locale formatter를 제품 경계에서 주입합니다.
- 한국어 길이를 최대 길이로 가정하지 않습니다.
- 번역은 locale 사이의 의미 이전이고 윤문은 같은 locale 안의 명확성과 자연스러움을 개선하는 작업으로 구분합니다.
- 동적 값이 있는 문장도 조각을 이어 붙이지 않고 locale별 완성 문장으로 관리합니다.

## Semantic model

| 역할 | 의미 |
| --- | --- |
| Locale data | date·time·number·plural·currency |
| Content expansion | 번역 후 길이와 줄바꿈 |
| Direction | logical properties와 bidirectional content |
| Input | IME·decimal separator·canonical storage |
| Translation | locale 간 의미·권한·상태·인과관계 보존 |
| Copy editing | 같은 locale 안에서 문법·명확성·자연스러움 개선 |

## 선택 기준

| 상황 | 사용 | 피함 |
| --- | --- | --- |
| 표시 날짜 | locale formatter | YYYY-MM-DD를 모든 사용자에게 강제 |
| 저장/전송 값 | ISO 8601 canonical | 표시 문자열 저장 |
| 숫자+단위 | 분리된 value/unit | 하나의 문자열 prop |
| 긴 번역 | wrap·fluid width | ellipsis로 핵심 action 삭제 |
| 동적 문장 | locale별 완성 문장과 placeholder | 여러 문자열 조각을 고정 순서로 연결 |

## 정량 규칙

| 항목 | 기준 |
| --- | --- |
| Expansion ≤10 chars | 150–250% 공간 테스트 |
| Expansion 11–20 | 130–150% |
| Minimum fixtures | ko-KR·en-US·ja-JP + longest-label pseudo locale |
| Time zone | absolute time에는 zone 또는 offset 명시 |

## Do / Don't

| 구분 | 지침 |
| --- | --- |
| Do | Intl API 또는 검증된 formatter로 locale 차이를 처리합니다. |
| Don't | 문자열을 잘라 plural·통화 형식을 조립합니다. |
| Do | logical margin/padding/inset을 사용합니다. |
| Don't | left/right icon 의미가 모든 locale에서 같다고 가정합니다. |
| Do | 번역과 같은 언어 안의 윤문을 별도 단계로 검토합니다. |
| Don't | 한국어 원문을 번역 결과처럼 취급해 의미 확인 없이 다시 씁니다. |

## 예외

- 로그·프로토콜·식별자는 canonical 원문을 유지할 수 있으나 주변 설명은 번역합니다.
- 운영 안전 용어는 제품 승인 glossary를 우선합니다.

## 접근성

- 페이지와 반복 landmark에 올바른 lang을 제공합니다.
- 번역문에서도 accessible name과 visible label의 의미가 일치해야 합니다.

## 국제화

- locale별 decimal separator를 표시하되 내부 numeric value는 canonical로 유지합니다.
- RTL·mixed-direction 문자열에서 순서와 punctuation을 테스트합니다.
- 번역과 윤문 전후에 권한·보안·상태 전이·부정·한정 표현이 유지되는지 검토합니다.

## LDS 예시

| 상황 | 결정 |
| --- | --- |
| Freshness | 제품 formatter가 '5분 전' 또는 locale equivalent를 전달하고 LDS가 timestamp를 추론하지 않음 |
| Telemetry | value=12.3, unit='m/s'로 분리하여 locale formatter와 screen-reader text를 독립 제공 |
| 동적 사용자 이름 | 이름 placeholder를 보존한 locale별 완성 문장을 제공하고 조사·어순을 문자열 조각으로 조립하지 않음 |

## 토큰과 API

### Tokens

- `typography and spacing tokens`
- `logical CSS properties`

### Components and checks

- `Intl.DateTimeFormat`
- `Intl.NumberFormat`
- `locale props`
- `VirtualKeypad`
- `COPY_REVIEW_CONTRACT.md`

## 참고 자료

- [W3C Internationalization](https://www.w3.org/International/)
