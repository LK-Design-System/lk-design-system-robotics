# Repository agent instructions

## LDS UI adoption and migration (MANDATORY)

Treat requests to create, migrate, convert, restyle, or align a product UI with LDS as adoption work. Component replacement alone is not completion.

Before editing UI code:

1. Read [`docs/package/adoption-workflow.md`](docs/package/adoption-workflow.md) and the packaged [Robotics adoption delta](docs/package/domain/ROBOTICS_UI_ADOPTION.md).
2. Inspect the complete requested surface. Existing-surface migration defaults to `full-surface`; use `changed-ui` only for an explicitly bounded incremental adoption.
3. Record all six LDS non-component facets and component mapping. Never omit a facet silently; use `not-applicable` only with a concrete reason and evidence.
4. Apply the Robotics domain contracts for coordinates, navigation expression, occupancy maps, selection/focus, unit formatting, glyphs, and safety/control ownership whenever they are relevant.

If the work reveals a required shared Core, Theme, Product, token, asset, or pattern change, stop at the ownership boundary and scope that authoring separately. A product conversion request does not grant authority to change a shared LDS package.

## Generated documentation

`docs/package/` is a deterministic package projection. Do not edit it by hand. Edit the Robotics-owned source documents under `docs/`, or refresh the pinned LDS Core adoption inputs with the documentation generator, then regenerate and run `npm run check:docs`.

## Verification

Run the narrowest relevant checks while working. Reuse exact-SHA CI evidence for `check:local` and Storybook gates; handoff alone does not authorize a full developer-PC run. Apply the execution-host policy below.

Publishing must never use a mutable LDS branch or an obsolete action pin. Run
`.github/workflows/release-gate.yml` with the exact committed LDS candidate SHA;
`prepublishOnly` delegates to the fail-closed `check:release` command.

Preserve unrelated and user-owned worktree changes.

## CI·릴리스 실행 호스트 (필수)

- 다른 PC에서 이 저장소를 열거나 clone해도 그 PC가 CI·릴리스 실행 호스트가 되지 않는다. 개발 PC는 소스 편집, 로컬 미리보기와 변경 범위의 빠른 검사만 수행한다. 작업 종료만을 이유로 전체 suite·Storybook sweep·전체 영상 렌더·패키지 pack을 로컬에서 실행하지 않는다.
- LDS 시리즈의 패키지 릴리스·발행 준비는 **server04의 승인·자격검증된 격리 VM**에서 수행한다(2026-10-08 소유자 결정). server04 호스트에서 직접 빌드하지 않는다. 저장소별 selected-repo/workflow 권한과 별도 runner 등록·디스크·최소권한 credential을 유지하며 Portal VM/runner를 재사용하지 않는다.
- 기존 자동 CI·Pages·교차 OS 검증의 실제 실행 경로는 아래 현행 표와 workflow가 정본이다. 이 지침을 추가했다고 runner 이관이 완료된 것은 아니다. 기존 Windows 검증을 Linux로 대체하거나 runner를 새로 등록하는 것은 별도 승인·자격검증 없이 수행하지 않는다. 공개 저장소의 표준 GitHub-hosted runner를 유료 runner로 오인하지 않는다.
- 정확한 source SHA의 자동 CI 결과를 재사용한다. 전체 검증은 기존 승인된 CI 또는 자격검증된 server04 릴리스 VM에 맡기며 로컬 전체 검증이나 수동 dispatch로 중복하지 않는다. 전체 검증이 필요한 변경인데 승인된 실행 환경이 없으면 `release_environment_unavailable`로 보고하고 멈춘다. 현재 PC, aipc1, 노트북, server02로 fallback하지 않는다.
- 새 PC의 누락된 VM·runner·SSH 설정은 자동 생성/등록/credential 복사의 근거가 아니다. 등록 상태와 host identity를 먼저 조회하고 기존 승인 범위 안에서만 진행한다. 편집·push 승인은 태그 push, 패키지 발행, 제품 배포, 서버 변경 승인이 아니다.
- 빌드·발행을 시작한 경우 정확한 SHA/run을 종료까지 감시하고 실패 원인을 비밀값 없이 보고한다. 무관한 dirty 작업과 타인 배포를 보존한다.
- 공통 절차: [LDS 실행 호스트 정책](https://github.com/LK-Design-System/lk-design-system/blob/main/docs/OPERATIONS.md#execution-host-policy). 형제 checkout이 없는 단독 clone에서도 이 원격 문서를 읽을 수 있다.
- 저장소 규칙을 수정할 때 `AGENTS.md`와 `CLAUDE.md`를 함께 갱신한다.

### 이 저장소의 현행 실행 경로

CI·release conformance는 GitHub-hosted Ubuntu, Storybook build는 Windows/Pages publish는 Ubuntu다. release-gate는 발행 자체가 아니다. 짝 LDS에 넣는 tgz는 server04 릴리스 환경에서 준비하며 자체 registry publish는 구성되어 있지 않다.
