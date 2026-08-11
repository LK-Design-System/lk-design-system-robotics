# Aspect Ratio

| Field | Value |
| --- | --- |
| Type | Foundation guide |
| Status | Current |
| Owner | Foundation owner |
| Source | `foundation-content.json#aspect-ratio` |

미디어 프레임의 가로세로 비율을 임의 높이가 아니라 공용 ratio 토큰으로 고정해, 콘텐츠가 도착하기 전에 자리를 예약하고 같은 종류의 미디어가 목록·카드·뷰어에서 같은 형태로 보이게 합니다.

## 목적과 원리

- 한 변은 레이아웃이 정하고 나머지 한 변은 비율이 계산합니다.
- 같은 종류의 미디어는 같은 비율을 반복합니다.
- 비율은 콘텐츠가 도착하기 전에 자리를 예약하는 계약입니다.
- 잘라내기는 기본값이 아니라 objectFit으로 내리는 결정입니다.

## Semantic model

| 역할 | 의미 |
| --- | --- |
| 가로형 | 너비가 정해진 프레임, 1:1부터 21:9까지 9종 |
| 세로형 | 높이나 컬럼이 정해진 프레임, 1:2부터 9:21까지 8종 |
| Golden | 1.618 / 1과 1 / 1.618의 광학 비율 |
| Primitive | AspectRatio가 비율과 클리핑을 소유 |

## 선택 기준

| 상황 | 사용 | 피함 |
| --- | --- | --- |
| 영상·스트림 타일 | --ratio-16-9 | 임의 height로 letterbox 만들기 |
| 목록 썸네일 | --ratio-1-1, Thumbnail 기본값 | 카드마다 다른 비율 |
| 세로 사진과 모바일 프리뷰 | --ratio-4-5 또는 --ratio-9-16 | 가로 프레임에 cover로 밀어 넣기 |
| 차트와 SVG | viewBox 크기에서 계산한 비율 | --ratio-* 토큰 |
| 읽는 텍스트 블록 | 콘텐츠가 정하는 높이 | 고정 비율 상자 |

## 정량 규칙

| 항목 | 기준 |
| --- | --- |
| Scale | --ratio-* 17개, 가로 9종·세로 8종 |
| Defaults | AspectRatio 16 / 9, Thumbnail 1 / 1, AnnotatedImage 16 / 9 |
| Axis | 가로형은 너비를, 세로형은 높이나 컬럼을 지정하고 나머지 한 변은 토큰이 계산 |
| Overflow | AspectRatio는 overflow: hidden이므로 프레임을 넘는 콘텐츠는 잘림 |

## Do / Don't

| 구분 | 지침 |
| --- | --- |
| Do | 비율을 var(--ratio-16-9)처럼 토큰으로 지정합니다. |
| Don't | height: 220px로 비율을 흉내 내지 않습니다. |
| Do | 원본 비율에 맞는 프리셋을 고르고 전체를 보여야 하면 contain을 씁니다. |
| Don't | 16:9 프레임에 세로 사진을 cover로 넣어 피사체를 잘라내지 않습니다. |
| Do | 이미지가 도착하기 전에 비율로 자리를 예약합니다. |
| Don't | 로드된 뒤에 높이가 정해지도록 두어 레이아웃을 밀지 않습니다. |

## 예외

- Sparkline과 LineChart는 viewBox 크기에서 비율을 계산하므로 --ratio-* 토큰을 쓰지 않습니다.
- AnnotatedImage는 프레임 비율과 원본 비율이 달라도 contain으로 전체를 보존하고 주석 좌표를 실제 이미지 영역에 맞춥니다.
- 프리셋에 없는 원본 비율은 AspectRatio와 Thumbnail이 숫자나 CSS 문자열로 그대로 받지만, 반복해서 쓰이면 토큰으로 승격합니다.

## 접근성

- 고정 비율 상자는 overflow: hidden이므로 200% 확대나 긴 번역으로 늘어나는 텍스트를 담지 않습니다.
- 비율 프레임 안의 interactive 요소는 focus ring이 클리핑되지 않는 위치에 둡니다.
- 프레임 안의 이미지는 장식이면 alt를 비우고, 정보를 가지면 의미 있는 alt와 대체 설명을 제공합니다.

## 국제화

- 비율 값은 번역되지 않지만 프레임 위 오버레이·캡션은 번역으로 길어져도 잘리지 않아야 합니다.
- Thumbnail의 overlayAlign은 물리적 모서리 이름이므로 RTL에서 의도한 방향인지 확인합니다.

## LDS 예시

| 상황 | 결정 |
| --- | --- |
| 카드 커버 | NewsCard·ListingCard·FeedCard는 16 / 9 프레임에 objectFit cover |
| 제품 사진 | ProductCard는 4 / 5 세로 무대를 쓰고 로드 전에 레이아웃을 예약 |
| 첨부 미리보기 | FileUploadQueue 썸네일은 1 / 1 정사각 격자 |

## 토큰과 API

### Tokens

- `--ratio-*`
- `--ratio-1-1`
- `--ratio-16-9`
- `--ratio-4-5`
- `--ratio-golden`
- `--ratio-golden-vertical`

### Components and checks

- `AspectRatio`
- `Thumbnail`
- `AnnotatedImage`
- `tokens/spacing.css`
- `stories/FoundationBasic.stories.jsx`

## 참고 자료

- LDS ratio tokens: `tokens/spacing.css`
