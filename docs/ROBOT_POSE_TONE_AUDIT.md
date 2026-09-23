# RobotPose 상태 톤 감사

| Field | Value |
| --- | --- |
| Type | Audit |
| Status | Open |
| Owner | Robotics domain engineering |
| Last reviewed | 2026-09-24 |
| Reported by | `lkrobotics-control-gungneung` (관제 대시보드 지도 도입 중) |
| Source | `RobotPoseMarker.jsx`의 `poseBodyPresentation`, 소비자 런타임 실측 |

## 요약

`offline`과 `idle`은 서로 다른 fallback 토큰을 지정하지만, **실제 뷰어 안에서는 언제나 같은
색으로 해석된다.** 두 상태를 다르게 보이게 하려는 의도가 코드에는 남아 있으나 런타임에서는
사라진다.

WCAG 문제는 아니다. 두 상태는 배지와 접근 가능한 이름으로 여전히 구분된다. 문제는 의도한
색 구분이 조용히 무효가 되어, 코드를 읽는 사람과 화면을 보는 사람의 이해가 갈린다는 점이다.

## 관측

`poseBodyPresentation`(`RobotPoseMarker.jsx:59`)의 두 분기:

```js
// state === 'offline'
color: 'var(--viewer-muted, var(--color-semantic-label-alternative))'

// state === 'idle'
color: 'var(--viewer-muted, var(--color-semantic-label-neutral))'
```

두 선언의 **1차 값이 `--viewer-muted`로 동일**하다. 서로 다른 것은 fallback뿐인데, fallback은
`--viewer-muted`가 정의되지 않았을 때만 쓰인다. 그리고 `RobotPoseMarker`가 놓이는 자리 —
`Map2DCanvas`·`ViewerFrame` 내부 — 는 항상 이 토큰을 정의한다.

소비자 런타임에서 측정한 값(light appearance, `Map2DCanvas` 내부):

| 항목 | 값 |
| --- | --- |
| 뷰어가 제공하는 `--viewer-muted` | `color-mix(in srgb, #000000 68%, transparent)` |
| fallback `--color-semantic-label-alternative` | `rgba(55, 56, 60, 0.74)` |
| fallback `--color-semantic-label-neutral` | `rgba(46, 47, 51, 0.88)` |
| `offline` 본체 실제 계산값 | `color(srgb 0 0 0 / 0.68)` |
| `idle` 본체 실제 계산값 | `color(srgb 0 0 0 / 0.68)` |

2026-09-24 재확인(`main` `c94b5c6`, Storybook `LDS Robotics/Navigation/Robot Pose` 개요): 라이트 뷰어에서는
두 본체가 모두 `color(srgb 0 0 0 / 0.68)`, 다크 뷰어에서는 모두 `color(srgb 1 1 1 / 0.72)`로 계산된다.
두 마커의 칠해진 요소 중 서로 다른 것은 `offline` 배지의 외곽선뿐이다.

fallback 두 값은 실제로 다르다. 즉 구분하려는 의도는 분명했다. 그러나 뷰어 안에서는 둘 다
`--viewer-muted`로 해석되어 **동일한 색**이 된다.

같은 실측에서 나머지 상태는 정상적으로 갈린다.

| 상태 | tone | 본체 색 | 배지 |
| --- | --- | --- | --- |
| `offline` | offline | `#000000` 68% | offline |
| `idle` | neutral | `#000000` 68% | 없음 |
| `moving` | moving | `#3878B3` | 없음 (모션 표현) |
| `paused` | cautionary | `#EB9C33` | 없음 |
| `fault` | negative | `#EE5656` | fault |

## 남아 있는 구분

색이 겹쳐도 두 상태가 완전히 같지는 않다.

- `offline`에만 `statusBadgeKind`가 `offline` 배지를 붙인다(`RobotPoseMarker.jsx:98`).
- 접근 가능한 이름이 각각 "오프라인"과 "대기 중"으로 다르다.
- `data-robot-pose-tone`이 `offline` / `neutral`로 갈려 검사와 테스트는 구분할 수 있다.

따라서 "색만으로 상태를 전달하지 않는다"는 규칙은 지켜지고 있다. 이 감사는 그 규칙을 문제
삼는 것이 아니라, **의도된 색 차이가 무효화된 사실**을 기록한다.

## 운영상의 무게

관제 화면에서 이 둘은 성격이 정반대다.

- `idle`: 연결되어 있고 명령을 받을 수 있으며, 지금 보이는 위치가 현재 위치다.
- `offline`: 연결이 끊겼고 명령이 차단되며, 보이는 위치는 **마지막 수신 시점의 기록**이다.

보고한 소비자 환경에서는 등록된 로봇 7대 중 다수가 `offline`이었고, 지도에는 `idle`과
구분되지 않는 같은 색 마커만 놓였다. 배지를 확인하기 전까지는 어느 쪽인지 알 수 없다.

## 선택지

정책 판단이 필요해 결론을 내리지 않고 선택지만 남긴다.

1. **`offline` 전용 뷰어 토큰 도입** — `--viewer-offline`을 정의하고 `poseBodyPresentation`이
   그것을 1차 값으로 쓴다. 뷰어가 appearance(light/dark)별로 값을 통제할 수 있고, 다른 상태의
   토큰 구조와도 일관된다(`--viewer-danger`, `--viewer-warning`이 이미 그렇다). 다만 뷰어
   토큰 집합이 늘어난다.
2. **`idle`을 `--viewer-muted`에서 떼어낸다** — `idle`이 뷰어의 중립 전경(예:
   `--viewer-foreground`를 낮춘 값)을 쓰고 `--viewer-muted`는 비활성/오프라인 의미로 남긴다.
   토큰을 늘리지 않지만 "muted"의 의미를 재정의하는 셈이라 다른 컴포넌트 영향 검토가 필요하다.
3. **현 상태를 의도로 확정하고 문서화한다** — 두 상태가 같은 본체 톤을 공유하며 배지가
   유일한 시각 구분자임을 `NAVIGATION_EXPRESSION_CONVENTIONS.md`에 명시하고,
   `poseBodyPresentation`의 서로 다른 fallback을 하나로 합쳐 오해의 소지를 없앤다.

어느 쪽을 택하든 **fallback이 갈라져 있는 현재 상태는 정리되어야 한다.** 지금은 코드가 두
색을 약속하고 런타임이 하나를 그린다.

## 권장

**1번**을 권한다. `offline`은 "값을 신뢰할 수 없다"는 뜻이라 다른 상태와 같은 급의 의미
축이고, `--viewer-danger`·`--viewer-warning`과 나란히 뷰어가 소유하는 편이 구조적으로 맞다.
3번을 택하더라도 fallback 통합은 함께 해야 한다.

## 재현

`Map2DCanvas` 안에 `RobotPoseMarker`를 놓고 `pose.state`를 `offline`과 `idle`로 바꿔가며
본체의 계산된 `fill`을 비교한다. 두 값이 같으면 이 감사가 여전히 유효하다.
