# LK Robotics UI documentation

| Field | Value |
| --- | --- |
| Type | Documentation index |
| Status | Current |
| Owner | Robotics domain engineering |
| Last reviewed | 2026-07-30 |

`docs/`의 탐색 진입점이다. 문서 규약(메타데이터 헤더, source-of-truth 순서)은
업스트림 [`lk-design-system/docs/README.md`](../../lk-design-system/docs/README.md)를
따른다. 여기서는 로보틱스 소관 문서만 나열한다.

## 규약과 계약 (Current)

| Document | Role |
| --- | --- |
| [`NAVIGATION_EXPRESSION_CONVENTIONS.md`](NAVIGATION_EXPRESSION_CONVENTIONS.md) | Navigation 오버레이가 지도 위에서 의미를 그리는 규약 — 업스트림 동명 문서가 공유 정책의 authoritative이고, 이 문서는 consumer 특화. 값의 단일 소스는 `_navigationVocabulary` |
| [`NAVIGATION_COORDINATE_CONTRACT.md`](NAVIGATION_COORDINATE_CONTRACT.md) | frame·timestamp·projection 증명 계약 — ROS 지도/경로/포즈 통합 전 필독. `check:coordinates`가 검증 |
| [`OCCUPANCY_MAP_CONVENTIONS.md`](OCCUPANCY_MAP_CONVENTIONS.md) | 구조 베이스맵의 free/occupied/unknown 시각 규약 — 지도는 무채색, accent는 내비게이션 콘텐츠 전용 |

## 감사와 평가 (Audit)

| Document | Role |
| --- | --- |
| [`SELECTION_FOCUS_AUDIT.md`](SELECTION_FOCUS_AUDIT.md) | 선택(정적 기하) vs 키보드 포커스(포커스 색)의 소유 경계 원장 — 값의 소스는 `NAV_SELECTION`/`NAV_FOCUS` |
| [`STRUCTURE_ASSESSMENT.md`](STRUCTURE_ASSESSMENT.md) | LDS 전반 구조 건강도 스냅숏 — 부채 목록(이중 모듈 그래프, 업스트림 조율)과 갱신 규칙 |

## 계획 (Plan)

| Document | Status |
| --- | --- |
| [`FLEET_UI_REFERENCE_PLAN.md`](FLEET_UI_REFERENCE_PLAN.md) | Phase 0–2 첫 증분 구현됨; 이후 단계 미착수 |

## 근거 자료

- [`references/ATTRIBUTIONS.md`](references/ATTRIBUTIONS.md): 외부 자료 출처

## 계약의 소재

디자인 계약의 1차 소스는 문서가 아니라 실행 코드다: 스토리 play 단언(111개),
`_navigationVocabulary`·`_viewerOverlay` 상수 모듈, conformance 검사. 문서
산문과 코드가 충돌하면 코드·play가 우선하고, 문서를 갱신한다.
