# Iconography

| Field | Value |
| --- | --- |
| Type | Foundation guide |
| Status | Current |
| Owner | Foundation owner |
| Source | `foundation-content.json#iconography` |

기능·상태·탐색 의미를 일관된 glyph와 이름으로 전달하고, 새 그림을 만들기 전에 공용 registry를 재사용합니다.

## 목적과 원리

- 이름은 모양이 아니라 의미를 표현합니다.
- monochrome glyph는 currentColor를 상속합니다.
- 아이콘은 텍스트를 보조하며 접근 가능한 이름을 중복하지 않습니다.

## Semantic model

| 역할 | 의미 |
| --- | --- |
| Normal | 일반 action·navigation·status glyph |
| Color | 고유 색상이 식별의 일부인 승인 브랜드 자산 |
| Robotics extension | 일반 registry에 없는 로봇·지도 의미 |

## 선택 기준

| 상황 | 사용 | 피함 |
| --- | --- | --- |
| 본문과 함께 | 16–20px | 아이콘을 별도 제목처럼 강조 |
| 버튼/목록 | 20–24px | 행간보다 큰 glyph |
| 독립 상태 그림 | 24–40px + visible label | 색과 모양만 제공 |

## 정량 규칙

| 항목 | 기준 |
| --- | --- |
| Approved sizes | 16·20·24·32·40px |
| Touch target | 아이콘 크기와 별개로 최소 24px, 주요 touch control 44px 권장 |
| Source | manifest와 generator를 통해 추가 |
| Stroke thickness | 외곽선 글리프는 24 그리드에서 1.5–3 (base 중위값 2.25). check:icon-drawing-style이 검사 |
| Ink coverage | 외곽선 글리프는 36% 이하. solid는 -fill 이름을 쓰거나 SOLID_BY_DESIGN에 등록 |

## Do / Don't

| 구분 | 지침 |
| --- | --- |
| Do | search, warning처럼 registry의 semantic name을 사용합니다. |
| Don't | 같은 기능의 inline SVG를 다시 그리지 않습니다. |
| Do | 아이콘과 텍스트의 baseline·gap을 동일 계열에서 맞춥니다. |
| Don't | 장식 아이콘에 중복 aria-label을 붙이지 않습니다. |
| Do | 새 glyph는 base 외곽선 두께(24 그리드에서 2)로 그립니다. |
| Don't | base 이름을 stroke로 그리지 않습니다. 채운 path로 그립니다. |

## 예외

- 브랜드·프로토콜 로고는 원래 색과 비율을 보존할 수 있습니다.
- 지도 geometry는 일반 UI icon과 다른 hit-area·zoom 계약을 가질 수 있습니다.

## 접근성

- 장식용은 aria-hidden, 유일한 정보는 role=img와 의미 이름을 제공합니다.
- icon-only control의 이름은 Icon이 아니라 wrapping control이 소유합니다.

## 국제화

- glyph 방향이 문화권에 따라 달라질 수 있는 back/forward는 logical direction을 확인합니다.
- 아이콘만으로 번역 가능한 의미라고 가정하지 않습니다.

## LDS 예시

| 상황 | 결정 |
| --- | --- |
| 다운로드 버튼 | IconButton label='내보내기' 안의 download glyph는 장식 |
| 경고 상태 | triangle-exclamation + '충돌 감지' 텍스트 |

## 토큰과 API

### Tokens

- `currentColor`
- `semantic foreground tokens`

### Components and checks

- `Icon`
- `IconButton`
- `ICON_NAMES`
- `assets/icons/manifest.json`

## 참고 자료
