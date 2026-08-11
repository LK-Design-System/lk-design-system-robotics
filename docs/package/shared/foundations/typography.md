# Typography

| Field | Value |
| --- | --- |
| Type | Foundation guide |
| Status | Current |
| Owner | Foundation owner |
| Source | `foundation-content.json#typography` |

글자 크기보다 정보의 역할과 읽는 순서를 먼저 정하고, 한글·라틴·가나가 같은 위계와 리듬으로 읽히도록 합니다.

## 목적과 원리

- semantic text role을 우선합니다.
- 같은 역할은 화면이 달라도 같은 스타일을 유지합니다.
- 밀도를 이유로 가독성·행간·확대 대응을 희생하지 않습니다.

## Semantic model

| 역할 | 의미 |
| --- | --- |
| Display/Title | 페이지와 핵심 표제 |
| Heading/Headline | 섹션과 강조 본문 |
| Body | 일반·reading 본문 |
| Label/Caption | control·metadata·보조 설명 |

## 선택 기준

| 상황 | 사용 | 피함 |
| --- | --- | --- |
| 페이지 제목 | Title | 임의 bold+font-size |
| 긴 설명 | Body reading | Caption으로 축소 |
| 수치 강조 | Display/Title + 단위 Label | 값과 단위를 한 문자열로 동일 크기 처리 |

## 정량 규칙

| 항목 | 기준 |
| --- | --- |
| Scale | 16 semantic styles |
| Body | 기본 15–16px, 22–24px line-height |
| Narrow | 텍스트 확대·긴 번역에서 clipping 금지 |

## Do / Don't

| 구분 | 지침 |
| --- | --- |
| Do | 제목→본문→메타데이터의 role을 DOM 순서와 맞춥니다. |
| Don't | 시각 크기만 맞추려고 새 pixel 값을 만듭니다. |
| Do | 실제 한글·영문·숫자 샘플로 확인합니다. |
| Don't | placeholder나 caption에 필수 지시를 숨깁니다. |

## 예외

- 데이터 테이블의 숫자는 tabular numerals를 사용할 수 있습니다.
- 코드·식별자는 mono font를 사용하되 설명 문장까지 mono로 바꾸지 않습니다.

## 접근성

- 200% 확대와 320px에서 내용 손실이 없어야 합니다.
- heading level은 시각 style과 독립적으로 올바른 문서 구조를 유지합니다.

## 국제화

- Pretendard JP fallback으로 한글·라틴·일본어를 확인합니다.
- 언어별 줄바꿈과 단어 길이가 달라도 고정 높이로 자르지 않습니다.

## LDS 예시

| 상황 | 결정 |
| --- | --- |
| 운영 카드 | Title 3 제목, Body 2 설명, Caption 1 freshness |
| 계측값 | Display 3 값, Label 1 단위, Caption 1 기준 시각 |

## 토큰과 API

### Tokens

- `--display*-*`
- `--title*-*`
- `--heading*-*`
- `--headline*-*`
- `--body*-*`
- `--label*-*`
- `--caption*-*`

### Components and checks

- `.type-*`
- `stories/FoundationsTypography.stories.jsx`

## 참고 자료
