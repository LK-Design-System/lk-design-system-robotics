---
name: lds-ui
description: LK Design System(@lk-design-system 패키지)으로 제품 UI를 만들거나 고칠 때 사용한다. lds-core/lds-theme/lds-product/lds-robotics-ui 컴포넌트로 화면을 신규 조립·전환·리스타일·확장하는 모든 작업 — "LDS로 만들어줘", "LDS 스타일로", 기존 화면의 LDS 전환, LDS 컴포넌트가 들어가는 화면 수정 — 에서 트리거된다. 컴포넌트 생김새만이 아니라 토큰·상태·모션·한국어 카피·접근성·소유 경계 계약까지 함께 적용하기 위한 결정 규칙과 배포 문서 라우팅을 제공한다.
---

# LDS UI 소비 규칙

LDS는 컴포넌트 카탈로그가 아니라 **결정 체계**다. 컴포넌트를 가져다 쓰면 생김새는 따라오지만, 아래 계약들은 따라오지 않는다 — 이 스킬은 그 나머지 절반을 로드한다.

설치는 에이전트에 따라 두 가지다. 내용은 도구 중립 마크다운이므로 어느 쪽이든 같은 규칙이 로드된다.

- **Claude Code**: 이 디렉터리(`docs/agent-skills/lds-ui/`)를 소비 레포의 `.claude/skills/lds-ui/`로 통째로 복사한다. 이후 LDS UI 작업에서 스킬로 자동 트리거된다.
- **AGENTS.md 기반 에이전트 (Codex 등)**: 소비 레포의 `AGENTS.md`에 아래 라우팅 블록을 추가한다. 전문을 복사하지 않고 라우팅만 하므로, 규칙 본문은 설치된 패키지에서 항상 최신으로 읽힌다.

```markdown
## LDS UI 작업 규칙

@lk-design-system 컴포넌트로 UI를 만들거나 고칠 때는, 코드를 쓰기 전에
node_modules/@lk-design-system/lds-core/docs/agent-skills/lds-ui/SKILL.md
와 그 references/ 문서를 읽고 따른다. 컴포넌트 교체만으로 LDS 적용은
완료되지 않는다.
```

**정본 우선순위**: 이 스킬의 규칙 ≒ 배포된 `docs/` 문서 < **배포 Storybook의 play 단언**. 산문과 실제 컴포넌트 동작이 충돌하면 동작(play 단언)이 정본이고, 이 스킬을 갱신해야 한다.

## 시작 절차 (모든 LDS UI 작업 공통)

1. 설치된 패키지의 AI 진입점을 읽는다: `node_modules/@lk-design-system/lds-core/llms.txt`. 도메인 패키지를 쓰면 그 패키지의 규칙 요약도 로드한다 — 로보틱스 UI면 `@lk-design-system/lds-robotics-ui/llms.txt`·`/design-system.json`과 `@lk-design-system/lds-robotics-ui/docs/domain/AGENT_SKILL_REFERENCE.md`, 슬라이드·에디토리얼이면 `@lk-design-system/lds-slides-ui/docs/AGENT_SKILL_REFERENCE.md`.
2. **기존 화면의 전환·리스타일·마이그레이션이면 adoption 계약이 적용된다.** 컴포넌트 교체만으로 LDS 전환은 완료되지 않는다 — 6개 비컴포넌트 facet(토큰·테마 / 레이아웃·시각 기초 / 상태·모션 / 자산·아이콘·브랜드 / 콘텐츠·국제화 / 접근성) + 컴포넌트 매핑 전부에 증거 딸린 판정이 필요하다. 절차와 스키마: `@lk-design-system/lds-core/docs/adoption-workflow.md`. 기존 화면은 `full-surface`가 기본이다.
3. 스타일은 레이어 순서로 import한다: Core → Theme → Product → Robotics.
4. 화면을 조립하면서 아래 결정 규칙을 적용한다. 카피를 한 줄이라도 쓰면 [references/copy.md](./references/copy.md)를 로드한다.
5. 완료 전 [references/anti-patterns.md](./references/anti-patterns.md)로 자가 점검한다 — 이 목록이 "생김새만 따온" 실패의 전형이다.

## 결정 규칙

### 색 — 쓰기 전에 물어라: 이 색은 역할인가, 값인가?

- **semantic 토큰만 소비한다.** raw hex·rgba·스크린샷에서 딴 값 금지. 토큰 이름은 추측하지 말고 `@lk-design-system/lds-core/docs/token-reference.json`에서 확인한다.
- 상태색은 4역할 가족(foreground/surface/border/text)이다 — 한 값으로 접지 않는다. signal 색은 점·아이콘·보더 전용이고 텍스트에는 `*-text` 역할을 쓴다. **solid signal 채움 + 흰 텍스트는 금지.**
- **정상·휴지 상태의 "배지"는 무채색이다.** 초록 "정상" 램프를 만들지 않는다. 단, 이 규칙은 **상태 배지**의 것이다 — 게이지 눈금·차트처럼 색이 측정값 인코딩인 곳에서 색을 제거하는 것은 오적용이다.
- 톤 어휘는 `positive · cautionary · negative · signal · offline`. 자체 래퍼에 `success/warning/error/info` 축을 만들지 않는다.
- 차트 시리즈는 `data-viz-series-*`를 쓴다. 시리즈가 실제로 긍정/부정을 의미할 때만 상태색을 쓴다.

### 타이포그래피 — 크기가 아니라 역할

- semantic 타입 램프만 쓴다. `font-size: 13px` 같은 임의 px 금지.
- DOM 순서 = 읽기 역할 순서(제목 → 본문 → 메타데이터). 320px 폭과 200% 줌에서 깨지지 않아야 한다.
- 값과 단위는 구조적으로 분리한다(`unit` prop). 문자열 이어붙이기 금지.

### 간격·기하 — 간격은 관계다

- 간격 토큰을 고르기 전에 관계를 명명한다: 포함인가, 분리인가, 순서인가, 밀도인가. 반스텝 토큰(`--space-0-5`~`-4-5`)은 컨트롤 내부 전용이다.
- **이중 테두리 금지.** 표면 안에 표면을 넣을 때는 embedded 변형을 쓴다 — 보더·radius·그림자는 부모가 소유한다. 앱 셸은 카드가 아니라 캔버스다.
- 컴포넌트의 간격 계약을 네거티브 마진으로 상쇄하지 않는다.
- 그림자는 장식이 아니라 겹침의 표현이다: 떠 있는 팝업만 전방향 그림자, 흐름 내 표면은 그림자 없이 디바이더가 경계를 소유한다.

### 상태 — 축을 섞지 않는다

- 상호작용(hover/focus/pressed) / 선택(selected/checked) / 가용성(enabled/disabled) / 비동기(loading/empty/error/stale/offline)는 서로 다른 축이다. "처리 중"을 `disabled`로 표현하지 않는다. `pressed`는 `selected`가 아니다.
- loading/empty/error를 하나의 빈 화면으로 접지 않는다 — 각각 다른 상태다.
- **복구 중 맥락을 보존한다**: 초기 로딩만 콘텐츠를 대체한다. 새로고침·stale·offline·복구 가능한 에러는 마지막 정상 데이터를 유지하고 상태 메시지를 얹는다. 결측을 0으로 지어내지 않는다 — `—`를 쓴다.

### 모션 — 인과를 설명하고, 데이터를 광고하지 않는다

- fast 120ms / base 200ms / slow 320ms 토큰. `transition: all` 금지.
- 라이브 텔레메트리는 값이 바뀔 때마다 펄스하지 않는다. 정적 심각도(위험 등급 등)는 절대 애니메이션으로 표현하지 않는다.
- `prefers-reduced-motion`에서 이동·연속 애니메이션이 제거되고 상태가 즉시 적용되는지 확인한다.

### 접근성 — 색만으로 말하지 않는다

- 모든 상태 표현은 색 + 다른 채널(모양·대시·아이콘·텍스트) 1개 이상. 시각이 여러 상태를 하나로 접어도 접근성 이름에는 원시 상태를 전부 보존한다.
- 인터랙티브 타깃 최소 24×24 CSS px. 텍스트 대비 4.5:1, 비텍스트 상태 그래픽 3:1.
- 커스텀 role보다 native HTML 먼저. 오버레이가 닫히면 포커스는 결정적으로 복원돼야 한다.
- 상세 계약: `@lk-design-system/lds-core/docs/policies/ACCESSIBILITY_CONTRACTS.md`.

### API 사용 — 구조는 데이터로, 조합은 컴포넌트에

- LDS는 "구조는 열되 조합은 열지 않는다". 위계형 컴포넌트에는 선언적 데이터(`items`, `groups[]`)를 넘긴다 — 파트 트리를 흉내 내거나, 닫힌 조합을 CSS 오버라이드로 우회하지 않는다.
- 컴포넌트가 안 되는 것이 있으면 우회 스타일링 대신 **디자인 시스템에 결함/요청으로 보고**한다. 소비 레포에서 LDS 컴포넌트의 내부를 덮어쓰는 순간 계약이 깨진다.

### 소유 경계 — LDS는 표현을, 제품은 의미를

- LDS가 소유: 공간·상호작용·상태 표현·접근성 계약. 제품이 소유: 라우팅·권한·쿼리·임계값·전송·영속·커맨드·도메인 상태기계.
- 화면에 도메인 판단(예: "이 값이면 위험")을 넣을 때, 그 판단은 제품 코드의 것이고 LDS는 판단 결과의 표현만 받는다.

### 한국어 UI 카피

- 카피는 독립된 계약 축이다. 버튼 라벨 하나라도 쓰기 전에 [references/copy.md](./references/copy.md)를 로드한다.
- 최소 요약: 에러는 원인 1문장 + 다음 행동 1문장, 버튼은 구체 동사(확인/처리 금지), ACK ≠ 완료, `…`(`...` 금지), 원시 enum을 사용자에게 노출하지 않는다.

## 배포 문서 라우팅

| 주제 | 경로 (설치 기준) |
|---|---|
| AI 진입점 | `@lk-design-system/lds-core/llms.txt` |
| 채택 절차·판정·증거 스키마 | `lds-core/docs/adoption-workflow.md`, `docs/adoption-checklist.json` |
| 색·타이포·간격·상태·모션·작문 등 기초 16편 | `lds-core/docs/foundations/*.md` |
| 토큰 실명부 | `lds-core/docs/token-reference.json` |
| 접근성·카피 리뷰·토큰 거버넌스 정책 | `lds-core/docs/policies/*.md` |
| 로보틱스 도메인 계약 | `lds-robotics-ui/docs/domain/AGENT_SKILL_REFERENCE.md`(요약), `/docs/domain/*.md`(정본), `/llms.txt` |
| 슬라이드·에디토리얼 도메인 계약 | `lds-slides-ui/docs/AGENT_SKILL_REFERENCE.md`(요약), `/catalogue.json`(기계 계약), `README.md`(소유 철학) |
| 라이브 스토리북 | 각 패키지 `package.json`의 `lds.storybook` 필드 |

## 이 스킬이 다루지 않는 것

- **LDS 자체의 저작·수정** (컴포넌트 추가, 토큰 값 변경, 게이트 갱신): 그것은 lk-design-system 레포의 AGENTS.md 관할이다. 도입 중 공유 컴포넌트/토큰 변경이 필요해 보이면, 이 작업 범위 안에서 고치지 말고 업스트림에 별도 스코프로 보고한다.
- 발표 덱 저작: lk-design-system-slides 레포의 `lds-deck` 스킬 관할.
