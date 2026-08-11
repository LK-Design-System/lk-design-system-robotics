# Accessibility contracts

| Field | Value |
| --- | --- |
| Type | Stable contract |
| Status | Current |
| Owner | Design system owner · Accessibility reviewer |
| Last reviewed | 2026-08-11 |

LK 디자인 시스템의 접근성 기준은 컴포넌트를 사용하는 제품 팀이 매번 새로 판단하지 않도록 하는 계약입니다. 모든 interactive 컴포넌트는 아래 항목을 Storybook 예시, 코드, 또는 테스트 근거로 증명해야 합니다.

## Required contract

| 항목 | 기준 | 증거 |
| --- | --- | --- |
| Semantic | 가능한 경우 native HTML element를 우선 사용한다. custom role은 native로 표현할 수 없을 때만 쓴다. | 컴포넌트 JSX, Storybook accessibility 패널 |
| Keyboard | Tab 순서, Enter/Space, Escape, Arrow key 동작을 명시한다. | Storybook interaction 또는 prompt 문서 |
| Focus | focus visible, focus trap, focus restore, disabled focus 정책을 명시한다. | 컴포넌트 예시와 수동 QA |
| Screen reader | accessible name, aria state, live region 문구를 명시한다. | JSX와 Storybook text |
| State | default, hover, focus, active, selected, disabled, loading, invalid 상태를 가능한 범위에서 노출한다. | 상태 매트릭스 |
| Motion | 중요한 상태 변화는 색상만으로 전달하지 않는다. motion은 prefers-reduced-motion을 존중한다. | CSS token 또는 component style |

## Keyboard baseline

| 컴포넌트 계열 | 필수 키보드 동작 |
| --- | --- |
| Button, IconButton, SplitButton | Tab으로 진입, Enter/Space로 실행, disabled는 실행 불가 |
| Checkbox, Switch, Radio | Space로 토글, RadioGroup은 Arrow key로 이동 |
| Select, Combobox, AutoComplete | Arrow key로 옵션 이동, Enter로 선택, Escape로 닫기 |
| ScrollArea와 내부 스크롤 표면 | 실제로 넘치는 독립 영역은 접근 가능한 이름과 Tab 정지점을 가져 방향키·Page Up/Down·Home/End로 이동할 수 있어야 한다. 기본 스크롤바는 OS 설정을 유지하고, `compact`는 공간이 제한된 표면만 선택한다. 숨김은 대체 위치 단서와 이동 수단이 검증된 명시적 예외만 허용하며 forced-colors에서는 사용자 에이전트 표현으로 복귀한다. |
| Tabs, SegmentedControl | Arrow key로 인접 항목 이동, Home/End는 첫/마지막 항목. 스크롤 가능한 Tabs의 2px 활성 지표는 tablist 경계 안에 온전히 남고 자체 세로 스크롤을 만들지 않는다. |
| PageIndicator, Carousel | interactive dots는 이름 있는 native button group이며 standalone은 `aria-current="page"`와 24×24px target, media는 slide label·position, `aria-current="true"` + focusable `aria-disabled="true"`, 32×44px target을 제공한다. Carousel 자동 회전 control은 첫 Tab 대상이고 focus 진입·명시적 navigation 시 멈추며 reduced-motion에서 track/pill transition을 제거한다. |
| LanguageSwitcher, DropdownMenu | 아이콘 전용 trigger는 주변 UI 언어로 번역된 이름을 가지며 Enter/Space/Arrow Down으로 첫 항목, Arrow Up으로 마지막 항목을 연다. menu는 Up/Down·Home/End·typeahead·Escape focus 복원을 지원한다. LanguageSwitcher의 native-name label은 각 `lang`을 가지며 현재 locale은 inline-end visible check와 `menuitemradio`의 `aria-checked`로 함께 노출한다. |
| PageHeader, RecordHeader | 자체 키보드 상태는 만들지 않는다. DOM과 읽기 순서는 context/visual→제목·상태→설명·세부 정보→actions를 유지하고 CSS reflow로 바꾸지 않는다. heading 단계는 주변 문서 구조와 연결하며 icon-only action은 이름을 가져야 한다. `size`는 제목·간격의 시각 밀도만 바꾸며 heading 단계, description/details 본문 크기, DOM·focus 순서를 바꾸지 않는다. |
| ConnectionRow | DOM과 읽기 순서는 visual→name→visible status→detail→actions를 유지한다. name과 중복되는 visual은 `aria-hidden`으로 제외하고 interactive content를 넣지 않는다. 상태는 색만으로 전달하지 않으며 action target은 최소 24×24 CSS px, 320px에서는 actions를 다음 line으로 내려 가로 scroll을 만들지 않는다. |
| Modal, Drawer, Sheet, Alert, ConfirmDialog | Escape 닫기, 내부 focus trap, 닫힌 뒤 trigger로 focus restore. Drawer의 짧은 visible subtitle은 `aria-describedby`로 연결하고 복잡한 지시는 body에 둔다. Drawer는 **body에만** bounded density scope를 제공하고 compact일 때 eligible form/selection/status 자식의 omitted 크기를 줄이며, 명시적 `size`/`padding`/`density`는 항상 우선한다. header의 닫기 control과 footer는 scope 밖에 있고 `Button`은 inherited density를 소비하지 않으며, 전역 `LdsProvider`에도 density를 추가하지 않는다. 따라서 target과 순서는 바뀌지 않고 footer Button은 기존 `md` 크기를 유지한다. compact Checkbox/Radio의 시각 glyph가 작아져도 실제 native pointer target은 [WCAG 2.2 SC 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)에 따라 최소 24×24 CSS px를 유지한다. |
| Toast, Notification, Banner, Callout | 자동 소멸 정보는 live region 정책을 명시, 중요한 알림은 수동 dismiss 제공. standing Callout은 기본 live region이 아니며 실제 하위 절을 시작할 때만 주변 문서 계층에 맞는 `headingLevel`을 쓴다. |
| OverlayStatusChip | `role="status"` polite live region으로 표면 상태를 알리고, 설명 대상 컨트롤이 `inert`여도 읽히도록 호출부가 그 서브트리 밖에 배치한다. `pointer-events: none`으로 재활성화 입력을 가로채지 않으며, 상태는 색만이 아니라 톤 글리프와 필수 텍스트 라벨로 전달한다 |
| DataGrid, Table, Tree, TopicTree | row/cell/treeitem focus 기준, 확장/축소 키, 선택 상태를 명시. 정적 Table의 `getRowProps`는 native `<tr>` 메타데이터만 확장하고 자동으로 focus·selection·grid role을 만들지 않는다. |
| DataCollectionPanel | toolbar → resource message → 현재 표시 content → freshness → footer의 DOM/읽기 순서를 유지한다. compact content가 있으면 wide/compact 중 하나만 display와 접근성 트리에 참여하고, 없으면 native Table 구조와 가로 overflow를 유지한다. root section을 landmark로 사용할 때는 `aria-label` 또는 `aria-labelledby`로 이름을 제공한다. |
| ProductLockup | 독립 사용은 하나의 `role="img"`와 registry canonical name에서 만든 `LK {canonical name}` 이름을 제공하고 내부 SVG path의 중복 낭독을 막는다. `compact`는 제품명 outline을 시각적으로만 생략하며 같은 접근성 이름을 유지한다. 홈 링크·버튼이 `LK Console 홈`처럼 동작 이름을 소유하면 자식 로크업은 `decorative`/`aria-hidden`으로 둔다. 보이는 대문자 outline을 접근성 이름에 그대로 복제하거나 registry 밖 이름을 호출부에서 합성하지 않는다. |
| SideNav | native `nav` 이름, `ul`/`li` 계층, disclosure의 `aria-expanded`, 현재 leaf의 `aria-current="page"`를 유지한다. 접힌 레일에서 현재 leaf가 숨겨지면 부모가 시각 선택 프록시를 표시하지만 `aria-current`는 부모로 옮기지 않는다. 접기 토글은 제품 셸이 소유하고 SideNav id를 `aria-controls`로 참조하며, 접힌 레일의 스크롤은 wheel·keyboard 도달성을 보존한다. 자식 아이콘 슬롯은 장식으로 숨기고 라벨 이름을 유지하며, 비제어 런타임 overlay 전환은 진입 시 접고 이탈 시 이전 persistent 상태를 복원한다. `appearance="brand"`는 평면 브랜드 네이비 표면에서 section text와 muted destination 7.48:1, active ink 8.08:1을 유지하고 선택색과 별도의 2px focus indicator(8.08:1)를 사용한다. |
| SearchableMultiSelect, DataGrid, FileBrowser | stable item name/ID, listbox 또는 row activation, 선택 상태, bulk action 진입 순서, 빈/loading/error announcement를 명시 |
| Button, ActionArea, ConfirmDialog | product-owned disabled reason과 blocker를 action보다 먼저 읽을 수 있고 pending 중 중복 실행이 차단되어야 함 |
| StatusBadge, StatusIndicator, Timeline, ProgressBar, ConnectionBadge, EquipmentStatusCard | StatusBadge는 색과 무관하게 읽히는 lifecycle/result 라벨을 제공하고 자동 live region을 만들지 않는다. StatusIndicator의 dot은 장식으로 숨기고 live availability/freshness 라벨을 반드시 표시하며 pulse는 reduced motion에서 정지한다. 설비 카드는 heading → visible status → labeled facts → actions 순서를 유지하고 live region이 과도하게 반복되지 않아야 함 |
| ManualControlSession | keyboard 입력은 focus 범위 안에서만 처리하고 textarea/input 입력과 단축키가 충돌하지 않아야 함 |
| Tree, ReorderList | treeitem/listitem은 키보드로 탐색 가능하고 expand/collapse 또는 move action에 accessible name이 있어야 함 |
| ValidationSummary | 하나 이상의 차단 오류를 텍스트로 식별하고 모든 항목을 required native `href`로 실제 field/step에 연결한다. SPA activation은 anchor fallback을 보존하면서 focus·scroll을 옮기고, action name은 field label과 동일 inline message를 함께 포함한다. 원래 field는 같은 message를 `aria-describedby`로 연결하고 오류일 때 `aria-invalid="true"`를 가진다. submit 뒤 summary focus와 opt-in live count는 기본적으로 중복하지 않으며 warning-only·valid 결과는 별도 Callout/Notification을 사용한다. |
| FieldAction | field와 action은 별도 native control과 별도 Tab stop을 유지하며 DOM·읽기·focus 순서는 field → action이다. 제출 조합은 `as="form"`과 `Button type="submit"`을 사용해 field의 Enter가 native submit 경로를 따른다. shared label은 `htmlFor`로 field에 연결하고 helper/error는 FormField 계약을 사용한다. 360px 이하에서는 기능 손실 없이 한 열로 reflow하며 action을 field와 같은 너비로 확장한다. |
| Card, FeatureCard | 비대화형 문서 표면은 `as="article|section|li"`로 native 구조를 보존할 수 있다. `interactive`/`onClick`은 루트를 button role로 바꾸므로 문서 구조용 root와 함께 사용하지 않고, 내부에 별도 링크·버튼이 있으면 비대화형 루트를 유지한다. `density`는 spacing과 FeatureCard icon tile만 바꾸며 heading, 본문 타이포, 접근 이름, target, DOM·focus 순서를 바꾸지 않는다. |
| AnnotatedImage, SourceDisclosure | 시각 overlay와 source provenance에는 텍스트 요약, availability, 원본으로 돌아가는 경로가 있어야 함 |
| Product-owned conversation composition, SourceDisclosure, TreePicker, ConfirmDialog | message role과 streaming/error 상태를 semantic list에서 텍스트로 제공하고 unavailable composer는 이유를 연결하며 scope reset은 확인 가능해야 함 |
| ContentEditor | 제목 input, 본문 textarea, toolbar button, 상태 live region 순서가 자연스러워야 함 |
| CanvasEditorShell, CanvasEditorCommandBar, EditorToolbar, LayerPanel, SelectionInspector, ViewerToolbar | viewport와 toolbar/panel 사이 이동 순서, collapse/restore handle과 keyboard splitter의 accessible name, 방향키 scope, LayerPanel의 단일 roving Tab stop·typeahead·F2 row-action mode, 단축키 충돌, undo/redo 상태, 선택 해제 버튼의 accessible name |
| Map2DCanvas, Scene3DFrame | viewport region name, keyboard zoom/pan 정책, 앱 캔버스 이벤트와 DS pan interaction 충돌 방지 |
| ElevatorFleetOverview | 가로 overflow가 생기면 이름 있는 `ScrollArea`만 Tab 정지점이 되고, 각 위치 열은 `role="img"` 요약으로 제공한다. 설비별 live 상태는 visible-label `StatusIndicator`, 건물·fleet attention 집계는 `StatusBadge`로 구분한다. 동일한 현재 층·단일 방향 신호·상태는 열 안의 visible text로 반복하고 freshness는 비정상 설비에만 보조 정보로 표시한다. offline 열은 stale 방향 대신 마지막 확인 층을 visible text와 accessible name에서 동일하게 제공한다. 열 header, 층 row와 landing-door symbol은 읽기 전용이며 별도 Tab 정지점을 만들지 않는다. |
| WaypointMarker, LaneOverlay, RouteOverlay, TrajectoryOverlay, SpatialRegion, FacilityTransition, NavigationAnnotationLayer | SVG fragment의 이름, pointer와 Enter/Space activation parity, disabled Tab 제외, selected/invalid state, zoom과 무관한 hit/stroke, 색 외 pattern·glyph·visible state text, 이름 있는 semantic mirror 목록. annotation layer의 라벨 이동·숨김은 aria-hidden 장식 텍스트에만 적용되고 accessible name·24px target·Tab 순서·목록 선택 경로·live region 부재 계약은 그대로 유지 |
| ConversationMessage, MessageFeed, MessageComposer | feed만 role="log" polite live-region을 소유하고 개별 message·날짜/첫 미읽음 separator는 live region이 없음, feed 자체에 focus가 있을 때만 Home/End/Page Up/Page Down viewport 이동, document/bubble presentation과 optional direction은 읽기 의미를 대체하지 않으며 author identity를 텍스트로 유지, 기본 message DOM 순서는 identity→body→response status→attachments→sources→delivery/static status→actions이고 `inlineSources` footer는 actions→sources 형제 순서, 완료 AI 응답의 복사·재생성·긍정/부정 평가 action과 failed-only retry, 선택형 평가의 aria-pressed+시각 selected surface, response pending/streaming/stopping만 aria-busy, stop은 composer가 소유, composer는 IME 조합 중 Enter 오발송 방지·Shift+Enter 줄바꿈·disabled 시 disabledReason을 shell/control 앞에 두고 aria-describedby로 연결·submit/stop 후 상태 미추론, `density`는 spacing만 바꾸고 DOM·accessible name·keyboard 순서·24px 이상 action target을 바꾸지 않음 |
| VirtualKeypad | role="group"과 접근 가능한 이름, 각 키의 이름 있는 label과 48px touch target, aria-controls로 대상 input 연결, targetId input이 이미 focus된 경우에만 pointer preventDefault로 focus 보존, min/max는 confirm 유효성에만 적용, document/global keydown·long-press·VirtualKeyboard API 의존 없음 |

## Conversation accessibility contract

- `authorRole`은 user·assistant·human-agent·system의 기본 시각 presentation을 고르지만 작성자 이름과 역할 텍스트를 대체하지 않는다. assistant의 borderless document, user의 solid primary bubble, human-agent의 neutral fill bubble과 alignment·색만으로 발신자를 구분하지 않고 이름·역할 텍스트를 함께 제공한다.
- `direction`은 non-system message의 선택적 배치 override일 뿐 DOM 순서, 작성자 의미, delivery/response lifecycle을 바꾸지 않는다. system role은 avatar나 bubble 없이 이름 있는 중앙 neutral 칩으로 읽힌다.
- 한 message article의 기본 순서는 identity → body → response status → attachments → sources → delivery/static status → actions다. `inlineSources`에서는 본문 뒤 단일 footer 안에 action group → sources 순서로 두 요소를 형제로 렌더해, provenance가 action group에 포함되지 않으면서 화면의 canonical action 순서를 먼저 유지한다. action group 안에서는 `응답 복사` → `응답 다시 생성` → 긍정 평가 → 부정 평가 순서를 유지한다. 선택형 평가는 제품 상태를 `aria-pressed`와 시각 selected surface로 함께 노출하고, streaming 중에는 이 후속 action을 비활성화하며, failed 상태에는 오류와 재시도만 둔다. response stop은 `MessageComposer` 한 곳이 소유해 중복 control을 만들지 않는다.
- `MessageFeed` 하나만 이름 있는 `role="log"`, `aria-live="polite"`, `aria-relevant="additions"`를 소유한다. history prepend 중에는 live announcement를 억제하고 scroll anchor 복원 뒤 다시 polite로 전환한다. 무결과·실패·`hasPrevious=false` 경로에서도 억제를 해제한다. 날짜와 첫 미읽음 경계는 기존 `Divider`의 이름 있는 `role="separator"` 조합이며 focus target이나 별도 announcement region이 아니다.
- `MessageFeed` viewport 자체에 focus가 있을 때만 Home/End로 처음·끝, Page Up/Page Down으로 한 viewport를 이동하고 `aria-keyshortcuts`로 이를 노출한다. modifier가 있거나 message 내부 action에 focus가 있으면 키를 가로채지 않는다.
- `MessageComposer`는 label → description → disabled reason → 한 elevated shell 안 attachments → textarea → 하단 leading actions → trailing actions → send-or-stop → status/counter 순서로 읽힌다. 32px icon action은 이름을 가지며, `disabled` shell의 slot control도 inert subtree에서 focus와 activation이 차단된다. 한글·일본어·중국어 IME 확정 Enter를 submit으로 재처리하지 않으며 Enter/modifier-enter/button-only 제출 정책을 명시적으로 선택한다. modifier-enter는 Alt가 없는 Ctrl/Meta+Enter만 허용해 AltGr 문자 입력과 충돌하지 않는다.
- `density="compact"`는 세 컴포넌트의 의미나 상호작용 축이 아니라 좁은 persistent panel용 spacing 축이다. 이름·role·live-region 소유권·DOM/Tab 순서·IME 정책은 comfortable과 같고, composer의 send/stop 및 message action target은 WCAG 2.2 Target Size (Minimum)의 24×24 CSS px 하한을 유지한다.
- 약 760px reading column과 320px narrow, 460/360/296px compact conversation column, light/dark에서 긴 rich assistant document, multiline user solid primary bubble, human-agent neutral fill bubble, streaming/error, disabled composer, 날짜/미읽음 separator를 확인한다. 320 CSS px reflow에서 가로 스크롤이 생기지 않고 source/action wrapping이 DOM·keyboard 순서를 바꾸지 않는지, bubble·칩·배지 대비가 WCAG AA를 유지하는지 검증한다.

## Viewer accessibility contract

- `ViewerFrame`, `Map2DCanvas`, `Scene3DFrame`, `VideoStreamTile`은 고유한 accessible region name을 가진다.
- `ElevatorFleetOverview`는 fleet 요약 → 건물 identity → 엘리베이터 열 header → 현재 층 요약 → 전체 층 목록 → 방향·상태·비정상 freshness 순서를 DOM과 화면에서 동일하게 유지한다. offline 열은 현재 층 대신 마지막 확인 층임을 명시하고 stale 방향을 요약에서 제외한다. 색상은 보조 cue이며 상태 text와 fault/offline의 solid/dashed 경계를 함께 제공한다. 가로 스크롤은 `ScrollArea`의 keyboard 계약을 재사용하고, 빈 fleet와 건물별 empty state를 정적인 status text로 구분한다.
- `VideoStreamTile`의 interaction toolbar는 시각적으로 숨겨진 동안에도 DOM과 키보드 순서를 유지하며, 포커스가 진입하면 즉시 표시된다. 차단 상태에서는 기존 `ViewerFrame` 계약대로 toolbar와 renderer를 `inert`·`aria-hidden` 처리한다.
- blocking state에서는 가려진 media와 control을 접근성 트리 및 keyboard focus 순서에서 제외하되 source identity는 유지한다. 현재 focus가 가려지면 recovery action 또는 blocking-state group으로 이동하고, 복구 후 원래 control이 남아 있으면 그 정확한 위치로 돌아간다. `degraded`, `stale`, `paused`는 콘텐츠를 가리지 않고 텍스트 상태와 freshness를 함께 제공한다.
- edge state live region은 상태 전환 문구만 포함한다. FPS, resolution, freshness처럼 자주 바뀌는 passive metadata는 live region 밖에 둔다.
- `Map2DCanvas`는 toolbar, button, input, slider에서 발생한 방향키를 pan으로 재처리하지 않는다. drag와 wheel만으로 가능한 조작에는 button 및 keyboard 대안이 있어야 한다.
- Navigation SVG fragment는 `onActivate`가 있을 때만 interactive button semantics를 갖고 pointer와 Enter/Space가 같은 identity callback을 호출한다. disabled feature는 activation과 Tab 순서에서 제외하되 ordinary text mirror에서 상태와 identity를 계속 읽을 수 있어야 한다.
- waypoint marker의 투명 hit area와 lane/route/trajectory hit stroke는 zoom과 무관하게 최소 24 CSS px를 유지한다. 겹치거나 조밀해져 SVG 자체 keyboard traversal이 불안정한 지도는 모든 feature를 Tab stop으로 만들지 않고 동일 순서·이름·상태의 목록 선택 경로를 제공한다.
- Navigation paint order는 screen-reader와 keyboard order가 아니다. `LayerPanel`은 layer 표시/잠금, 이름 있는 semantic mirror는 feature 선택, `SelectionInspector`는 선택 객체 세부 정보를 맡으며 세 표면은 같은 stable ID를 공유한다.
- closed/conflict/waiting/blocked/rerouting, unavailable/unknown/stale/invalid, region rule/traversability는 색 외 dash, slash, glyph, pattern, label을 함께 사용한다. SVG fragment는 live region을 만들지 않으며 source/runtime 상태 announcement는 제품이 소유한다.
- `ViewerToolbar`는 한 개의 Tab stop을 사용하고 orientation에 맞는 Arrow key와 Home/End를 지원한다. command에는 `aria-pressed`를 붙이지 않고 toggle은 `true`와 `false`를 모두 노출한다.
- `TelemetryGauge`는 `meter` name, min, max, current value와 사람이 읽는 `aria-valuetext`를 제공한다. 빠른 telemetry 값 자체는 live region으로 반복 발표하지 않는다.
- live, loading, stale, no-signal, error는 색이나 motion만으로 구분하지 않는다. pulse/spinner는 `prefers-reduced-motion`에서 정지하며 visible text를 함께 제공한다.

## Focus policy

- Focus ring은 브랜드 색상보다 `semantic.control.focusRing` 또는 동등한 component token을 우선 사용한다.
- Focus ring은 hover style과 별도로 보여야 한다.
- Disabled control은 focusable하지 않게 두는 것을 기본값으로 한다. 설명이 필요한 disabled 항목은 tooltip이나 adjacent text로 이유를 제공한다.
- Modal 계열은 열린 순간 첫 interactive element 또는 heading에 focus를 보낸다.
- Overlay가 닫히면 원래 trigger로 focus를 복귀시킨다.

## Screen reader policy

- icon-only button은 `aria-label` 또는 visible hidden label이 필요하다.
- 상태 badge는 색상과 텍스트를 함께 제공한다.
- loading은 `aria-busy` 또는 live text를 제공한다.
- progress는 `aria-valuemin`, `aria-valuemax`, `aria-valuenow`를 갖는다.
- domain safety state는 축약어만 쓰지 않는다. 예: 긴급 정지, 위치 기준, 연결 상태는 주변 문맥에서 풀어 쓴다.

## Release gate

새 컴포넌트 또는 interactive 상태를 추가할 때 PR은 아래를 충족해야 한다.

- Storybook에 keyboard/focus가 확인 가능한 예시가 있다.
- component prompt 문서에 접근성 계약이 있다.
- `pnpm run check:a11y` 또는 Storybook accessibility 패널에서 blocking violation이 없다.
- icon-only control은 accessible name이 있다.
- 색상만으로 상태를 전달하지 않는다.
