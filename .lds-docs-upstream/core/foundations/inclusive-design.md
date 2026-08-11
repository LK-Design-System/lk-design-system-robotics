# Inclusive Design

| Field | Value |
| --- | --- |
| Type | Foundation guide |
| Status | Current |
| Owner | Foundation owner |
| Source | `foundation-content.json#inclusive-design` |

시각·청각·운동·인지 능력과 일시적 제약이 달라도 핵심 정보와 작업을 동등하게 이용하도록 설계합니다.

## 목적과 원리

- 접근성은 별도 모드가 아니라 기본 계약입니다.
- 색·motion·pointer 하나에 의미나 조작을 의존하지 않습니다.
- 실패 이유와 회복 경로를 affected surface 가까이에 둡니다.

## Semantic model

| 역할 | 의미 |
| --- | --- |
| Perceivable | text alternative·contrast·hierarchy |
| Operable | keyboard·touch·gesture alternatives |
| Understandable | 일관된 navigation·명확한 오류 |
| Robust | native semantics·assistive technology |

## 선택 기준

| 상황 | 사용 | 피함 |
| --- | --- | --- |
| native element 가능 | native HTML | custom role |
| drag/pinch 작업 | button/keyboard alternative 병행 | gesture only |
| 비동기 상태 | visible text + 적절한 live region | spinner only |

## 정량 규칙

| 항목 | 기준 |
| --- | --- |
| Target | 24×24px minimum, 주요 touch action 44×44px 권장 |
| Text contrast | 4.5:1, 큰 글자 3:1 |
| Motion | reduced-motion 지원, 초당 3회 이상 flash 금지 |
| Zoom | 200% 확대와 320px reflow |

## Do / Don't

| 구분 | 지침 |
| --- | --- |
| Do | 오류 원인과 수정 방법을 field 가까이에 연결합니다. |
| Don't | 빨간 테두리만으로 오류를 알립니다. |
| Do | keyboard 순서와 읽는 순서를 시각 순서와 맞춥니다. |
| Don't | hover만으로 기능을 노출합니다. |

## 예외

- 빠른 telemetry 값은 live region으로 반복 발표하지 않습니다.
- disabled control을 focusable하게 유지해야 하는 특수 widget은 이유와 keyboard model을 문서화합니다.

## 접근성

- ACCESSIBILITY_CONTRACTS.md의 semantic·keyboard·focus·screen reader 계약을 따릅니다.
- Storybook Axe는 수동 keyboard·zoom·screen-reader 검토를 대체하지 않습니다.

## 국제화

- lang 속성과 locale별 accessible name을 제공합니다.
- 긴 번역과 IME 조합 중에도 keyboard action이 오작동하지 않아야 합니다.

## LDS 예시

| 상황 | 결정 |
| --- | --- |
| 아이콘 버튼 | 44px hit area와 visible tooltip, control이 accessible name 소유 |
| 로딩 데이터 | aria-busy와 상태 문구를 제공하고 last-good content를 안전하게 보존 |

## 토큰과 API

### Tokens

- `--color-semantic-focus-*`
- `--control-h-*`
- `motion tokens`

### Components and checks

- `ACCESSIBILITY_CONTRACTS.md`
- `npm run check:a11y`
- `npm run check:motion-hygiene`

## 참고 자료
