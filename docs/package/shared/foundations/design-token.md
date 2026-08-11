# Design Token

| Field | Value |
| --- | --- |
| Type | Foundation guide |
| Status | Current |
| Owner | Foundation owner |
| Source | `foundation-content.json#design-token` |

LDS의 시각 결정이 코드·Storybook·Figma·AI 출력에서 같은 의미를 유지하도록 primitive, semantic, component 계층과 runtime projection을 관리합니다.

## 목적과 원리

- 제품은 값이 아니라 의미 역할을 소비합니다.
- 하위 계층의 값은 상위 계층 계약을 우회하지 않습니다.
- 토큰 변경은 영향 표면과 migration을 함께 기록합니다.

## Semantic model

| 역할 | 의미 |
| --- | --- |
| Primitive | 원천 스케일과 브랜드 값 |
| Semantic | 제품에서 사용하는 의미 역할 |
| Component | 재사용 컴포넌트의 안정된 계약 |
| Runtime projection | CSS와 패키지 산출물 |

## 선택 기준

| 상황 | 사용 | 피함 |
| --- | --- | --- |
| 일반 제품 UI | semantic token | primitive 또는 raw literal |
| 공용 컴포넌트 내부 | component token | 화면별 임시 변수 |
| 새 값이 필요함 | 기존 역할·alias 가능성을 먼저 검토 | 이름만 다른 중복 토큰 |

## 정량 규칙

| 항목 | 기준 |
| --- | --- |
| Theme modes | 모든 semantic color는 light/dark 값 필수 |
| Naming | kebab-case CSS, 역할 중심 JSON path |
| Lifecycle | proposed → active → deprecated → removed |

## Do / Don't

| 구분 | 지침 |
| --- | --- |
| Do | surface/card처럼 목적을 표현합니다. |
| Don't | blue-500처럼 시각값을 제품 계약으로 노출하지 않습니다. |
| Do | 변경과 함께 Storybook 영향 예시를 남깁니다. |
| Don't | generated CSS만 직접 수정하지 않습니다. |

## 예외

- 외부 라이브러리의 고정 변수는 adapter에서만 허용하고 LDS token으로 위장하지 않습니다.
- 실험 토큰은 proposed 상태이며 public component에서 소비하지 않습니다.

## 접근성

- 대비·focus·target size에 영향을 주는 토큰은 해당 접근성 gate를 통과해야 합니다.
- 색·motion 토큰은 단독으로 의미를 전달하지 않습니다.

## 국제화

- 토큰 이름은 번역하지 않지만 description과 example은 한국어·영어 소비자가 이해할 수 있게 작성합니다.
- locale별 값이 필요한 경우 이름을 복제하지 않고 mode 또는 제품 formatter를 사용합니다.

## LDS 예시

| 상황 | 결정 |
| --- | --- |
| 상태 텍스트 | status-negative-text와 status-negative-surface를 함께 사용해 신호색과 읽기색을 분리합니다. |
| 컴포넌트 추가 | primitive를 직접 참조하지 않고 component token이 semantic role을 alias합니다. |

## 토큰과 API

### Tokens

- `tokens/source.json`
- `tokens/*.css`

### Components and checks

- `styles.css`
- `npm run check:tokens`
- `npm run check:colors`

## 참고 자료

- LDS token governance: `docs/TOKEN_GOVERNANCE.md`
