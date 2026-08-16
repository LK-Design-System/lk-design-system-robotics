# UI Copy Review Contract

| Field | Value |
| --- | --- |
| Type | Contract |
| Status | Current |
| Owner | Foundation owner · Design system owner |
| Last reviewed | 2026-08-04 |
| Source | `foundations/writing.md` · `foundations/voice-and-tone.md` · `foundations/international-design.md` |

이 계약은 사람과 AI가 UI 문구를 검토할 때 제품 의미를 보존하고, 결정적 자동 검사와 사람 판단의 경계를 유지하기 위한 공통 구조를 정의한다. 제품별 정식 명칭·상태 전이·권한·보존 정책은 제품 저장소가 소유한다.

## 적용 범위

다음처럼 제품이 소유하며 사용자에게 직접 전달되는 문구에 적용할 수 있다.

- 내비게이션·페이지·탭·섹션·객체 이름
- 제목·설명·버튼·링크·필드 라벨·placeholder·도움말
- 로딩·빈 화면·오류·권한 제한·성공·확인창
- `aria-label`, live region과 스크린 리더용 상태 안내
- 제품이 사용자에게 반환하는 API 오류와 background job 상태
- 보고서·채팅·PDF의 제품 소유 고정 템플릿

사용자 작성 내용, 외부 서비스 원문, 코드 식별자, 로그, 내부 프롬프트와 생성 본문은 자동 윤문 대상이 아니다. 제품은 생성 본문의 별도 계약을 소유할 수 있지만 이 계약의 의미 보존 원칙은 유지한다.

## 권한과 우선순위

1. 제품의 실제 동작·권한·소유권·보존·상태 전이
2. 제품의 승인된 canonical name과 상태 사전
3. LDS Writing·Voice and Tone·International Design
4. 화면별 현재 문구
5. AI 또는 교정 도구의 제안

문구로 제품 계약의 모순을 덮지 않는다. 실제 동작이나 기준이 불명확하면 추측하지 않고 `BLOCKED`로 분류한다.

## LDS와 제품의 소유권

| 영역 | LDS 소유 | 제품 소유 |
| --- | --- | --- |
| 문장 역할 | heading·label·button·description·status 등의 공통 형태 | 화면별 역할 배정과 실제 문구 |
| 상태 카피 | loading·empty·error·permission·success·confirmation의 정보 순서 | 상태값·상태 전이·복구 경로 |
| 용어 | 문맥형 용어 선택과 고유명사 보존 원칙 | 정식 명칭·도메인 glossary |
| 위험도 | 의미 변화 가능성에 따른 공통 하한선 | 정책 tag와 필수 승인자 |
| 자동 검사 | schema·placeholder·보호 항목 검증 구조 | 대상 파일·copy set·예외·baseline |

LDS 저장소에는 특정 제품의 route, 객체명, 상태 enum 또는 승인 조직을 공통값으로 복사하지 않는다.

## Copy set

문자열 하나만 분리해 검토하지 않는다. 같은 사용자 흐름에서 함께 읽히거나 상태에 따라 바뀌는 문구를 하나의 copy set으로 묶는다.

예:

- 제목·설명·기본 버튼·진행 중 버튼
- 빈 화면 제목·설명·행동
- 오류의 실패 대상·알려진 원인·복구 행동
- 확인창 제목·결과·복구 가능성·취소·확인 action

최소 입력 구조는 다음과 같다.

```json
{
  "schemaVersion": "1",
  "rulesetVersion": "<version>",
  "id": "<product-owned-copy-set-id>",
  "sourceHash": "<pipeline-computed-hash>",
  "surface": "<route-or-workflow>",
  "audience": "<audience>",
  "task": "<user-task>",
  "policyTags": [],
  "items": [
    { "key": "heading", "role": "heading", "text": "<text>" },
    { "key": "description", "role": "description", "text": "<text>" },
    { "key": "action.idle", "role": "button", "text": "<text>" },
    { "key": "action.busy", "role": "button_status", "text": "<text>" }
  ],
  "protected": {
    "machine": {
      "properNouns": [],
      "placeholders": [],
      "numbersAndUnits": [],
      "literals": []
    },
    "humanReview": {
      "facts": [],
      "behavior": [],
      "permissionsAndLifecycle": []
    }
  }
}
```

`sourceHash`와 이후의 `candidateHash`는 파이프라인이 canonical serialization으로 계산한다. 모델이 hash를 만들거나 기존 값을 바꾸지 않는다.

공통 machine-readable 계약은 [`references/quality/KOREAN_UI_COPY_CONTRACT.schema.json`](https://github.com/LK-Design-System/lk-design-system/blob/lds-v0.1.0-rc.69.16/docs/references/quality/KOREAN_UI_COPY_CONTRACT.schema.json)에 있다. 소비 제품은 계약 ID `https://design.lk-robotics.com/contracts/korean-ui-copy/v1`과 `contractVersion`을 함께 고정한다. 제품은 copy set의 `id`·문맥·policy tag·items·보호 항목을 key 정렬 JSON으로 직렬화하고 UTF-8 SHA-256을 계산한다. `sourceHash`는 원문 items, `candidateHash`는 `REVISE` 결정만 반영한 items에 묶인다. review와 approval 자체는 hash 입력에서 제외하며 각 기록이 두 hash와 `rulesetVersion`을 참조한다.

## 보호 항목

다음 항목은 자연스러움을 이유로 뜻을 바꾸지 않는다.

- 제품·회사·프로토콜·API의 고유명사와 대소문자
- 숫자·기간·날짜·단위·제한·실행 주기
- placeholder, 의도적으로 노출한 URL·route·ID
- 부정·한정·필수·선택·최대·직후·이후 같은 제한 표현
- 권한·보안·보존·외부 시스템 영향
- 삭제·연결 해제·숨김·보관·게시 철회처럼 서로 다른 동작
- 상태 전이·인과관계·복구 가능성·확인 수준

`protected.machine`은 결정적 verifier가 원문과 후보에서 정확히 비교한다. 제품 동작·권한·생명주기처럼 구조만으로 판정할 수 없는 `protected.humanReview`는 필수 담당자가 검토한다. 모델의 자기 진술은 의미 보존의 증거가 아니다.

## 검토 순서

1. 실제 동작과 사용자가 얻게 되는 결과를 확인한다.
2. 고유명사·수치·placeholder·권한·보안·상태 전이를 보호한다.
3. 제품 glossary와 사용자의 과업을 확인한다.
4. 번역투·불필요한 피동·명사화·추상어를 국소 수정한다.
5. 제목·버튼·설명·오류 등 UI 역할에 맞는 형태와 길이를 확인한다.
6. 맞춤법·띄어쓰기·조사·어미·문장부호를 확인한다.
7. 좁은 화면·긴 이름·200% 확대·accessible name과 live region을 확인한다.
8. 새 사실이나 의미 변화가 생기지 않았는지 다시 감사한다.

맞춤법 검사, 문법 교정, 같은 locale 안의 윤문, UI 적합성 검토는 서로 다른 단계다. 하나의 도구 결과를 전체 판정으로 사용하지 않는다.

## 판정 계약

| 판정 | 조건 |
| --- | --- |
| `KEEP` | 자연스럽고 기준을 만족하며 의미 변화가 없음 |
| `REVISE` | 명확성·자연스러움·UI 적합성을 국소 수정할 수 있고 의미 변화가 없음 |
| `BLOCKED` | 실제 동작이 불명확하거나 기준이 충돌하거나 보호 항목을 보존할 수 없음 |

출력은 입력의 모든 key를 같은 순서로 한 번씩 포함한다. `REVISE` 항목만 후보 `text`를 갖는다. `KEEP`과 `BLOCKED`에는 후보 문구를 넣지 않는다.

```json
{
  "schemaVersion": "1",
  "rulesetVersion": "<input-version>",
  "id": "<input-id>",
  "sourceHash": "<input-hash>",
  "verdict": "REVISE",
  "decisions": [
    { "key": "heading", "verdict": "KEEP", "reasonCodes": ["NO_CHANGE_REQUIRED"] },
    { "key": "description", "verdict": "REVISE", "text": "<candidate>", "reasonCodes": ["COPY_NATURAL"] }
  ],
  "semanticDelta": "NONE",
  "questions": []
}
```

항목 하나라도 `BLOCKED`이거나 `semanticDelta`가 `POSSIBLE`·`UNKNOWN`이면 copy set 전체를 원자적으로 `BLOCKED` 처리한다. 이때 후보를 반영하지 않고 확인할 질문을 남긴다.

## 위험도와 승인

| 등급 | 예 | 최소 처리 |
| --- | --- | --- |
| LOW | 확정적인 구두점·등록된 표기 수정 | 결정적 verifier 통과 후 제품 정책에 따라 자동화 가능 |
| MEDIUM | 설명·도움말·빈 화면·복구 문구의 의미 동일 재작성 | 카피 또는 제품 검토 |
| HIGH | 이름·권한·보안·삭제·보존·상태 전이·수치·외부 영향 | 제품 담당자와 필요한 전문 담당자 승인 |
| BLOCKED | 의미 불명확·계약 충돌·보호 항목 위반 | 수정하지 않고 제품 결정을 요청 |

위험도는 모델이 낮출 수 없는 하한선이다. 제품은 role과 policy tag로 위험도와 필수 검토자를 계산한다. 규칙이 겹치면 가장 높은 위험도와 필수 검토자의 합집합을 사용한다.

AI가 `KEEP`을 반환해도 제품이 요구하는 검토를 생략하지 않는다. HIGH 승인은 `id`, `sourceHash`, `candidateHash`, `rulesetVersion`, reviewer role에 묶어 기록한다.

## 결정적 검사와 사람 판단

### 차단 가능한 검사

- ASCII `...`처럼 확정적인 구두점 위반
- 원문과 후보의 placeholder 집합 불일치
- 보호한 고유명사·숫자·기간·단위 불일치
- 제품이 등록한 canonical name·상태 사전과의 불일치
- 일반 사용자 UI에 raw enum·내부 식별자가 노출되는 명백한 경우

### 경고 또는 사람 검토

- 번역투·불필요한 피동·명사화·추상어
- 대상 없는 모호한 버튼과 링크
- 설명문의 정보량과 문장부호
- 과도한 길이 증가나 대규모 재작성
- tone·정보 위계·실제 다음 행동의 유효성

자연스러움은 결정적인 문자열 검사로 차단하지 않는다. 자연스러운 원문은 유지하며 수정률을 품질 지표로 사용하지 않는다.

## Reason code

공통 reason code는 문제 유형만 표현하고 제품 결정을 내리지 않는다.

| Code | Meaning |
| --- | --- |
| `NO_CHANGE_REQUIRED` | 수정할 결정적 이유가 없어 원문 유지 |
| `COPY_INTERNAL` | 사용자 UI에 내부 용어·raw enum·식별자 노출 |
| `COPY_CANONICAL` | 제품이 등록한 canonical name과 불일치 |
| `COPY_PLACEHOLDER` | placeholder 집합 불일치 |
| `COPY_FACT` | 보호한 고유명사·수치·단위·제한 불일치 |
| `COPY_STATE` | 제품 상태 사전 또는 상태 전이와 불일치 |
| `COPY_VAGUE` | 대상·행동·결과가 불명확함 |
| `COPY_SENTENCE` | UI 역할에 맞지 않는 문장 형태·문장부호 |
| `COPY_NATURAL` | 번역투·피동·명사화·추상어가 문맥상 어색함 |
| `COPY_OVEREDIT` | 의미 동일성 검토가 필요할 정도로 수정 범위가 큼 |

## 제품 adapter

제품은 공통 schema를 소비하면서 다음 데이터를 자체 저장소에서 소유한다.

- canonical name과 legacy name
- 도메인별 상태 사전과 raw enum mapping
- copy set ID, route·workflow, role과 policy tag
- 위험도 하한선과 필수 승인자
- baseline과 만료일이 있는 예외

제품의 copy inventory에는 사용자에게 직접 노출되는 API 오류와 background job 상태를 포함한다. 보고서·채팅·PDF는 고정 템플릿과 사용자·AI 생성 본문을 분리한다.

LDS는 schema와 결정적 fixture를 소유한다. 제품 저장소는 `canonical-names.json`, `state-dictionaries.json`, `copy-sets.json`, `exceptions.json`, baseline과 source mapping을 소유한다. [`references/quality/KOREAN_UI_COPY_BASELINE.json`](https://github.com/LK-Design-System/lk-design-system/blob/lds-v0.1.0-rc.69.16/docs/references/quality/KOREAN_UI_COPY_BASELINE.json)은 LDS 공통 verifier의 신규 finding ratchet이며 제품 위반을 대신 보관하지 않는다.

## 도입과 회귀 gate

새 verifier는 처음부터 저장소 전체를 차단하지 않는다.

1. report-only로 현재 위반과 false positive를 수집한다.
2. 제품 소유자와 copy set 범위를 확정한다.
3. 결정적 검사 fixture와 예외의 owner·reason·expiry를 추가한다.
4. 소비 제품과 ruleset version 정합을 확인한다.
5. 영향 범위와 기존 위반 처리 방식을 별도 승인받은 뒤 신규 회귀에 한해 차단한다.

자동 수정은 LOW allowlist와 결정적 verifier가 있는 항목으로 제한한다. 생성형 AI 후보는 자동 반영하지 않는다.

## 채택 체크리스트

- [ ] 실제 사용자 과업과 결과를 확인했다.
- [ ] 제품 canonical name과 상태 사전을 연결했다.
- [ ] 보호 항목과 policy tag를 등록했다.
- [ ] API 오류와 background job 상태를 inventory에 포함했다.
- [ ] 사용자 작성 내용·외부 원문·로그·내부 프롬프트를 제외했다.
- [ ] `KEEP`·`REVISE`·`BLOCKED` 결과를 schema로 검증했다.
- [ ] 필요한 사람이 의미 보존과 위험 문구를 승인했다.
- [ ] 기본·로딩·빈 화면·오류·권한·성공 상태를 확인했다.
- [ ] 좁은 화면·긴 이름·200% 확대·스크린 리더 문구를 확인했다.
- [ ] 차단형 gate 도입 시 영향 범위를 별도로 승인받았다.
