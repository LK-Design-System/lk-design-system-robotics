# LK Design System Foundations

| Field | Value |
| --- | --- |
| Type | Foundation guide index |
| Status | Current |
| Owner | Foundation owner |
| Source | `foundation-content.json` |

Foundation은 토큰 목록이 아니라 디자인 결정을 반복 가능하게 만드는 공개 계약입니다. 각 문서는 목적·semantic model·선택 기준·정량 규칙·Do/Don't·예외·접근성·국제화·LDS 예시·토큰/API 연결을 모두 포함해야 완료입니다.

## Completion contract

1. `purpose-and-principles`
2. `semantic-model`
3. `selection-criteria`
4. `quantitative-rules`
5. `do-dont`
6. `exceptions`
7. `accessibility`
8. `internationalization`
9. `lds-examples`
10. `token-api-links`
11. `machine-readable-reference`

## Guides

- [Design Token](./design-token.md) — LDS의 시각 결정이 코드·Storybook·Figma·AI 출력에서 같은 의미를 유지하도록 primitive, semantic, component 계층과 runtime projection을 관리합니다.
- [Color](./color.md) — 색을 장식이 아니라 surface, foreground, border, action, status, data visualization 역할로 사용하고 모든 theme에서 의미와 대비를 보존합니다.
- [Typography](./typography.md) — 글자 크기보다 정보의 역할과 읽는 순서를 먼저 정하고, 한글·라틴·가나가 같은 위계와 리듬으로 읽히도록 합니다.
- [Iconography](./iconography.md) — 기능·상태·탐색 의미를 일관된 glyph와 이름으로 전달하고, 새 그림을 만들기 전에 공용 registry를 재사용합니다.
- [Elevation](./elevation.md) — 표면의 물리적 장식이 아니라 겹침·소유권·주의 우선순위를 일관되게 표현하고 z-index 경쟁을 방지합니다.
- [Gradient](./gradient.md) — gradient를 정보 의미가 아니라 제한된 전환·fade에 사용하고, 장식적 브랜드 배경에는 단색 semantic surface를 사용합니다.
- [Inclusive Design](./inclusive-design.md) — 시각·청각·운동·인지 능력과 일시적 제약이 달라도 핵심 정보와 작업을 동등하게 이용하도록 설계합니다.
- [International Design](./international-design.md) — 번역을 넘어 날짜·시간·숫자·단위·통화·방향·문자열 길이가 달라도 의미와 레이아웃이 유지되도록 합니다.
- [Layout](./layout.md) — 콘텐츠 목적·밀도·작업 관계에 따라 grid, container, shell, region을 선택하고 viewport 변화에도 읽는 순서와 작업 맥락을 유지합니다.
- [Motion](./motion.md) — 전환의 원인과 결과를 설명하고 공간·상태 연속성을 보존하되 주의를 빼앗거나 실시간 데이터를 과장하지 않습니다.
- [Radius](./radius.md) — 표면의 규모·상호작용·포함 관계를 일관된 모서리 체계로 표현하고 중첩 surface의 이중 perimeter를 방지합니다.
- [Spacing](./spacing.md) — 간격을 빈 공간이 아니라 포함·분리·순서·밀도를 표현하는 관계 토큰으로 사용합니다.
- [State](./state.md) — 사용 가능성·상호작용·선택·비동기·오류·freshness를 서로 다른 상태 축으로 표현하고 시각·API·접근성 계약을 일치시킵니다.
- [Voice and Tone](./voice-and-tone.md) — LK 운영 제품이 정확하고 차분하며 책임 있게 말하도록 고정된 voice와 상황별 tone 변화를 정의합니다.
- [Writing](./writing.md) — 사용자가 빠르게 이해하고 안전하게 행동할 수 있도록 UI 문장의 어휘·문법·숫자·상태·문장부호 규칙을 제공합니다.
- [Aspect Ratio](./aspect-ratio.md) — 미디어 프레임의 가로세로 비율을 임의 높이가 아니라 공용 ratio 토큰으로 고정해, 콘텐츠가 도착하기 전에 자리를 예약하고 같은 종류의 미디어가 목록·카드·뷰어에서 같은 형태로 보이게 합니다.

## Machine-readable surfaces

- [Foundation content](./foundation-content.json) — canonical structured guidance
- [JSON Schema](./foundation-content.schema.json) — required section contract
- [Token reference](./TOKEN_REFERENCE.md) — generated token index
- [LLM bundle](./llms.txt) — generated full-text context

## Refresh and verification

```bash
npm run generate:foundations
npm run check:foundations
```
