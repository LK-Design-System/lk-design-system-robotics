import React from 'react';
import { Icon, Popover, Switch, ViewerToolbar, ViewerToolbarButton } from './lds.js';
import { ViewerToolbarCard as ViewerToolbarCardStory } from './RoboticsAndViz.shared.jsx';
import { storyDescription } from './StoryGuide.shared.jsx';

const meta = {
  title: 'LDS Robotics/Viewer/Toolbar',
  component: ViewerToolbar,
  parameters: {
    storyGuide: {
      storyId: 'lds-robotics-viewer-toolbar--viewer-toolbar-overview',
      eyebrow: 'Robotics / Viewer Toolbar',
      title: '뷰어 툴바는 현재 장면에만 영향을 주는 탐색 명령을 모읍니다',
      description:
        '운영자가 지도·3D·영상에서 확대·맞춤·레이어 토글 같은 로컬 도구를 사용할 때 적합합니다. 저장·내보내기처럼 문서 전체에 영향을 주는 명령에는 Viewer Toolbar 대신 Command Bar를 사용하세요.',
    },
    docs: {
      description: {
        component: '지도·3D·영상 viewport에 귀속되는 command와 persistent toggle을 모으는 roving-focus icon toolbar입니다.',
      },
    },
  },
};

export default meta;

function ToolbarIcon({ name }) {
  return <Icon name={name} size={16} aria-hidden="true" />;
}

function MiniMapPreview({ layers, zoom }) {
  return (
    <svg width="360" height="220" viewBox="0 0 360 220" style={{ display: 'block', width: 'min(360px, calc(100vw - 48px))', height: 'auto', transform: `scale(${zoom / 100})`, transformOrigin: 'center', transition: 'transform var(--dur-fast) var(--ease-out)' }} role="img" aria-label="툴바가 놓인 지도 예시">
      {layers.map && <rect x="28" y="24" width="304" height="172" fill="none" stroke="var(--component-viewer-muted)" strokeWidth="2.5" />}
      {layers.map && <path d="M28 118 H132 M132 24 V118 M214 118 V196 M214 150 H332" fill="none" stroke="var(--component-viewer-subtle)" strokeWidth="2.5" />}
      {layers.path && <polyline points="64,162 64,86 164,86 164,58 286,58" fill="none" stroke="var(--color-semantic-primary-normal)" strokeWidth="2.5" strokeDasharray="6 6" />}
      {layers.robots && <circle cx="64" cy="162" r="6" fill="var(--color-semantic-primary-normal)" />}
      {layers.robots && <circle cx="286" cy="58" r="6" fill="var(--color-semantic-primary-normal)" />}
    </svg>
  );
}

function SelfManagedToolbarControl({ onAction }) {
  const [visible, setVisible] = React.useState(false);
  const [disabled, setDisabled] = React.useState(false);
  return (
    <>
      <button data-testid="mount-self-managed-control" type="button" hidden onClick={() => setVisible(true)}>
        자체 상태 control 추가
      </button>
      <button data-testid="disable-self-managed-control" type="button" hidden onClick={() => setDisabled(true)}>
        자체 상태 control 비활성
      </button>
      {visible && (
        <ViewerToolbarButton data-testid="self-managed-control" label="자체 상태 control" disabled={disabled} onClick={onAction}>
          <ToolbarIcon name="crosshair" />
        </ViewerToolbarButton>
      )}
    </>
  );
}

function ToolbarInteractionFixture() {
  const [pathVisible, setPathVisible] = React.useState(false);
  const [pathAvailable, setPathAvailable] = React.useState(true);
  const [zoomAvailable, setZoomAvailable] = React.useState(true);
  const [extraVisible, setExtraVisible] = React.useState(false);
  const [ownershipProbeVisible, setOwnershipProbeVisible] = React.useState(false);
  const [lastAction, setLastAction] = React.useState('없음');

  return (
    <main style={{ display: 'grid', gap: 'var(--space-3)' }}>
      <ViewerToolbar orientation="horizontal" appearance="surface" label="키보드 검증 툴바">
        <ViewerToolbarButton label="확대" disabled={!zoomAvailable} onClick={() => setLastAction('확대')}><ToolbarIcon name="plus" /></ViewerToolbarButton>
        <ViewerToolbarButton label="축소 사용할 수 없음" aria-disabled="true" onClick={() => setLastAction('축소')}><ToolbarIcon name="minus" /></ViewerToolbarButton>
        <ViewerToolbarButton label="경로 표시" kind="toggle" pressed={pathVisible} aria-disabled={!pathAvailable || undefined} onPressedChange={setPathVisible}>
          <ToolbarIcon name="route" />
        </ViewerToolbarButton>
        <ViewerToolbarButton data-testid="add-control" label="나침반 조작 추가" onClick={() => setExtraVisible(true)}>
          <ToolbarIcon name="plus" />
        </ViewerToolbarButton>
        <SelfManagedToolbarControl onAction={() => setLastAction('자체 상태 control')} />
        {extraVisible && (
          <ViewerToolbarButton label="나침반 초기화" onClick={() => setLastAction('나침반 초기화')}>
            <ToolbarIcon name="reset" />
          </ViewerToolbarButton>
        )}
      </ViewerToolbar>
      <button data-testid="disable-zoom" type="button" hidden onClick={() => setZoomAvailable(false)}>확대 비활성</button>
      <button data-testid="disable-path" type="button" hidden onClick={() => setPathAvailable(false)}>경로 제어 비활성</button>
      <button data-testid="mount-toolbar-ownership-probe" type="button" hidden onClick={() => setOwnershipProbeVisible(true)}>소유권 검증 마운트</button>
      <button data-testid="unmount-toolbar-ownership-probe" type="button" hidden onClick={() => setOwnershipProbeVisible(false)}>소유권 검증 해제</button>
      <ViewerToolbar data-testid="vertical-toolbar" orientation="vertical" appearance="surface" label="세로 키보드 검증 툴바">
        <ViewerToolbarButton label="위로 이동" onClick={() => setLastAction('위로 이동')}><ToolbarIcon name="arrow-up" /></ViewerToolbarButton>
        <ViewerToolbarButton label="아래로 이동" onClick={() => setLastAction('아래로 이동')}><ToolbarIcon name="arrow-down" /></ViewerToolbarButton>
        <ViewerToolbarButton label="중앙으로 이동" onClick={() => setLastAction('중앙으로 이동')}><ToolbarIcon name="crosshair" /></ViewerToolbarButton>
      </ViewerToolbar>
      {ownershipProbeVisible && (
        <ViewerToolbar data-testid="toolbar-ownership-probe" orientation="horizontal" appearance="surface" label="역할 소유권 검증 툴바">
          <ViewerToolbarButton label="직접 소유 제어" onClick={() => {}}><ToolbarIcon name="plus" /></ViewerToolbarButton>
          <span role="presentation">
            <ViewerToolbarButton label="presentation 래퍼 제어" onClick={() => {}}><ToolbarIcon name="minus" /></ViewerToolbarButton>
          </span>
          <span role="none">
            <ViewerToolbarButton label="none 래퍼 제어" onClick={() => {}}><ToolbarIcon name="crosshair" /></ViewerToolbarButton>
          </span>
          <ViewerToolbar data-testid="nested-toolbar-ownership-probe" orientation="horizontal" appearance="minimal" label="중첩 역할 소유권 검증 툴바">
            <ViewerToolbarButton label="중첩 툴바 제어" onClick={() => {}}><ToolbarIcon name="reset" /></ViewerToolbarButton>
          </ViewerToolbar>
        </ViewerToolbar>
      )}
      <output data-testid="toggle-state" style={{ color: 'var(--color-semantic-label-neutral)', fontSize: 'var(--caption1-size)' }}>
        경로 표시: {pathVisible ? '켜짐' : '꺼짐'} · 마지막 동작: {lastAction}
      </output>
    </main>
  );
}

function waitForRender() {
  return new Promise((resolve) => setTimeout(resolve, 20));
}

export const ViewerToolbarOverview = {
  name: '개요',
  parameters: storyDescription(
    '지도 위에서 확대·축소·초기화·로봇 표시와 레이어 설정을 사용하는 기본 상황입니다. 즉시 명령과 지속 토글이 구분되고 팝오버 설정이 현재 장면과 같은 문맥으로 읽히는지 확인하세요.',
  ),
  render: () => {
    const [zoom, setZoom] = React.useState(100);
    const [layers, setLayers] = React.useState({ map: true, path: true, robots: true });

    return (
      <main style={{ display: 'grid', gap: 'var(--space-5)', width: '100%', maxWidth: 760 }}>
        <section style={{ position: 'relative', height: 300, borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--component-viewer-surface)', border: '1px solid var(--component-viewer-border)' }}>
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
            <MiniMapPreview layers={layers} zoom={zoom} />
          </div>
          <ViewerToolbar orientation="horizontal" appearance="on-dark" label="지도 보기" style={{ position: 'absolute', top: 'var(--space-3)', right: 'var(--space-3)' }}>
            <ViewerToolbarButton label="확대" onClick={() => setZoom((value) => Math.min(160, value + 10))}><ToolbarIcon name="plus" /></ViewerToolbarButton>
            <ViewerToolbarButton label="축소" onClick={() => setZoom((value) => Math.max(60, value - 10))}><ToolbarIcon name="minus" /></ViewerToolbarButton>
            <ViewerToolbarButton label="보기 초기화" onClick={() => setZoom(100)}><ToolbarIcon name="home" /></ViewerToolbarButton>
            <ViewerToolbarButton
              label="로봇 표시"
              kind="toggle"
              pressed={layers.robots}
              onPressedChange={(pressed) => setLayers((value) => ({ ...value, robots: pressed }))}
            >
              <ToolbarIcon name="location" />
            </ViewerToolbarButton>
            <Popover align="right" width={168} trigger={<ViewerToolbarButton label="레이어 설정"><ToolbarIcon name="filter" /></ViewerToolbarButton>}>
              <strong style={{ display: 'block', fontSize: 'var(--caption1-size)', color: 'var(--color-semantic-label-strong)', margin: '0 0 var(--space-2)' }}>
                레이어 표시
              </strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <Switch size="sm" label="지도" checked={layers.map} onChange={() => setLayers((value) => ({ ...value, map: !value.map }))} />
                <Switch size="sm" label="경로" checked={layers.path} onChange={() => setLayers((value) => ({ ...value, path: !value.path }))} />
                <Switch size="sm" label="로봇" checked={layers.robots} onChange={() => setLayers((value) => ({ ...value, robots: !value.robots }))} />
              </div>
            </Popover>
          </ViewerToolbar>
          <span style={{ position: 'absolute', left: 'var(--space-3)', bottom: 'var(--space-3)', minHeight: 24, display: 'inline-flex', alignItems: 'center', padding: '0 var(--space-2)', borderRadius: 'var(--radius-sm)', color: 'var(--component-viewer-foreground)', background: 'var(--component-viewer-surface-elevated)', fontSize: 'var(--caption1-size)', fontWeight: 'var(--fw-bold)', fontVariantNumeric: 'tabular-nums' }}>
            {zoom}%
          </span>
        </section>
      </main>
    );
  },
};

export const AppearanceAndDisabledStates = {
  name: '변형·상태 · 최소·표면·어두운 배경·비활성',
  parameters: storyDescription(
    'minimal·surface·on-dark appearance와 비활성 명령을 서로 다른 뷰어 배경에서 비교합니다. 각 표면에서 아이콘 대비와 그룹 경계가 유지되고 disabled 제어가 실행되지 않는지 확인하세요.',
  ),
  render: () => {
    const [lastAction, setLastAction] = React.useState('없음');
    return (
    <main style={{ display: 'grid', gap: 'var(--space-4)', width: '100%', maxWidth: 640 }}>
      <section aria-label="Minimal toolbar" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', background: 'var(--color-semantic-background-normal-alternative)' }}>
        <ViewerToolbar orientation="horizontal" appearance="minimal" label="Minimal 보기">
          <ViewerToolbarButton label="확대" onClick={() => setLastAction('Minimal 확대')}><ToolbarIcon name="plus" /></ViewerToolbarButton>
          <ViewerToolbarButton label="축소" disabled><ToolbarIcon name="minus" /></ViewerToolbarButton>
          <ViewerToolbarButton label="격자 표시" kind="toggle" defaultPressed><ToolbarIcon name="layers" /></ViewerToolbarButton>
        </ViewerToolbar>
      </section>
      <section aria-label="Surface toolbar" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', background: 'var(--color-semantic-background-normal-alternative)' }}>
        <ViewerToolbar orientation="horizontal" appearance="surface" label="Surface 보기">
          <ViewerToolbarButton label="확대" onClick={() => setLastAction('Surface 확대')}><ToolbarIcon name="plus" /></ViewerToolbarButton>
          <ViewerToolbarButton label="축소" onClick={() => setLastAction('Surface 축소')}><ToolbarIcon name="minus" /></ViewerToolbarButton>
          <ViewerToolbarButton label="레이어 표시" kind="toggle"><ToolbarIcon name="filter" /></ViewerToolbarButton>
        </ViewerToolbar>
      </section>
      <section aria-label="On dark toolbar" style={{ minHeight: 80, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', background: 'var(--component-viewer-surface)' }}>
        <ViewerToolbar orientation="vertical" appearance="on-dark" label="어두운 장면 보기">
          <ViewerToolbarButton label="확대" onClick={() => setLastAction('On dark 확대')}><ToolbarIcon name="plus" /></ViewerToolbarButton>
          <ViewerToolbarButton label="축소" onClick={() => setLastAction('On dark 축소')}><ToolbarIcon name="minus" /></ViewerToolbarButton>
          <ViewerToolbarButton label="경로 표시" kind="toggle" defaultPressed><ToolbarIcon name="route" /></ViewerToolbarButton>
        </ViewerToolbar>
      </section>
      <output aria-live="polite" style={{ color: 'var(--color-semantic-label-neutral)', fontSize: 'var(--caption1-size)' }}>마지막 동작: {lastAction}</output>
    </main>
    );
  },
};

export const RovingFocusAndToggleContract = {
  name: '상호작용 · 키보드 탐색과 토글',
  parameters: storyDescription(
    '도구의 가용성과 자식 구성이 실행 중 바뀌는 가운데 키보드로 명령과 토글을 탐색합니다. 비활성 항목을 건너뛰고 하나의 Tab stop과 현재 포커스·pressed 상태가 안정적으로 유지되는지 확인하세요.',
  ),
  render: () => <ToolbarInteractionFixture />,
  play: async ({ canvasElement }) => {
    const view = canvasElement.ownerDocument.defaultView;
    const toolbar = canvasElement.querySelector('[role="toolbar"]');
    if (!toolbar) throw new Error('ViewerToolbar is missing.');

    let items = Array.from(toolbar.querySelectorAll('[data-lk-viewer-toolbar-item]'));
    const enabledItems = items.filter((item) => !item.disabled && item.getAttribute('aria-disabled') !== 'true');
    if (enabledItems.filter((item) => item.tabIndex === 0).length !== 1) {
      throw new Error('ViewerToolbar must expose exactly one enabled Tab stop.');
    }

    enabledItems[0].focus();
    enabledItems[0].dispatchEvent(new view.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
    const pathToggle = toolbar.querySelector('button[aria-label="경로 표시"]');
    if (canvasElement.ownerDocument.activeElement !== pathToggle) {
      throw new Error('Roving focus did not skip the disabled toolbar item.');
    }

    enabledItems[0].focus();
    canvasElement.querySelector('[data-testid="disable-zoom"]')?.click();
    await waitForRender();
    if (canvasElement.ownerDocument.activeElement !== pathToggle || enabledItems[0].tabIndex !== -1) {
      throw new Error('Focus was not restored after a parent-controlled ViewerToolbar item became native-disabled.');
    }

    items[1].click();
    await waitForRender();
    if (!canvasElement.querySelector('[data-testid="toggle-state"]').textContent.includes('마지막 동작: 없음')) {
      throw new Error('An aria-disabled ViewerToolbar command must not activate.');
    }

    pathToggle.click();
    await waitForRender();
    if (pathToggle.getAttribute('aria-pressed') !== 'true') {
      throw new Error('Toggle did not expose its pressed state.');
    }

    pathToggle.focus();
    toolbar.querySelector('[data-testid="mount-self-managed-control"]')?.click();
    await waitForRender();
    const selfManagedControl = toolbar.querySelector('[data-testid="self-managed-control"]');
    if (!selfManagedControl || selfManagedControl.tabIndex !== -1 || canvasElement.ownerDocument.activeElement !== pathToggle) {
      throw new Error('A self-managed child update broke the remembered ViewerToolbar Tab stop.');
    }
    if (toolbar.querySelectorAll('[data-lk-viewer-toolbar-item][tabindex="0"]').length !== 1) {
      throw new Error('A self-managed child update created multiple ViewerToolbar Tab stops.');
    }

    selfManagedControl.focus();
    toolbar.querySelector('[data-testid="disable-self-managed-control"]')?.click();
    await waitForRender();
    const addControlButton = toolbar.querySelector('[data-testid="add-control"]');
    if (canvasElement.ownerDocument.activeElement !== addControlButton || selfManagedControl.tabIndex !== -1) {
      throw new Error('Focus was not restored after a self-managed ViewerToolbar item became native-disabled.');
    }

    pathToggle.focus();
    toolbar.querySelector('[data-testid="add-control"]')?.click();
    await waitForRender();
    items = Array.from(toolbar.querySelectorAll('[data-lk-viewer-toolbar-item]'));
    if (canvasElement.ownerDocument.activeElement !== pathToggle || pathToggle.tabIndex !== 0) {
      throw new Error('A child update reset the remembered roving focus item.');
    }
    if (items.filter((item) => !item.disabled && item.getAttribute('aria-disabled') !== 'true' && item.tabIndex === 0).length !== 1) {
      throw new Error('A child update created multiple toolbar Tab stops.');
    }

    canvasElement.querySelector('[data-testid="disable-path"]')?.click();
    await waitForRender();
    const addControl = toolbar.querySelector('[data-testid="add-control"]');
    if (canvasElement.ownerDocument.activeElement !== addControl || pathToggle.tabIndex !== -1) {
      throw new Error('Focus was not restored when the active ViewerToolbar item became unavailable.');
    }

    addControl.dispatchEvent(new view.KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }));
    const compassReset = toolbar.querySelector('button[aria-label="나침반 초기화"]');
    if (canvasElement.ownerDocument.activeElement !== compassReset) {
      throw new Error('End did not move focus to the final toolbar item.');
    }

    compassReset.dispatchEvent(new view.KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }));
    if (canvasElement.ownerDocument.activeElement !== addControl) {
      throw new Error('Home did not move focus to the first enabled toolbar item.');
    }

    const verticalToolbar = canvasElement.querySelector('[data-testid="vertical-toolbar"]');
    const verticalItems = Array.from(verticalToolbar.querySelectorAll('[data-lk-viewer-toolbar-item]'));
    if (verticalToolbar.getBoundingClientRect().width > 48) {
      throw new Error('A vertical ViewerToolbar must keep its intrinsic control width inside a stretching layout.');
    }
    verticalItems[0].focus();
    verticalItems[0].dispatchEvent(new view.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    if (canvasElement.ownerDocument.activeElement !== verticalItems[1]) {
      throw new Error('ArrowDown did not advance focus in a vertical toolbar.');
    }

    canvasElement.querySelector('[data-testid="mount-toolbar-ownership-probe"]')?.click();
    await waitForRender();
    const ownershipToolbar = canvasElement.querySelector('[data-testid="toolbar-ownership-probe"]');
    const directControl = ownershipToolbar?.querySelector('button[aria-label="직접 소유 제어"]');
    const presentationControl = ownershipToolbar?.querySelector('button[aria-label="presentation 래퍼 제어"]');
    const noneControl = ownershipToolbar?.querySelector('button[aria-label="none 래퍼 제어"]');
    const nestedControl = ownershipToolbar?.querySelector('button[aria-label="중첩 툴바 제어"]');
    if (!ownershipToolbar || !directControl || !presentationControl || !noneControl || !nestedControl) {
      throw new Error('The toolbar role-ownership fixture is incomplete.');
    }
    directControl.focus();
    directControl.dispatchEvent(new view.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
    if (canvasElement.ownerDocument.activeElement !== presentationControl) {
      throw new Error('A presentation wrapper must not take ownership away from its toolbar item.');
    }
    presentationControl.dispatchEvent(new view.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
    if (canvasElement.ownerDocument.activeElement !== noneControl) {
      throw new Error('A role=none wrapper must not take ownership away from its toolbar item.');
    }
    noneControl.dispatchEvent(new view.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
    if (canvasElement.ownerDocument.activeElement !== directControl) {
      throw new Error('The outer toolbar must exclude a nested toolbar item from its Arrow sequence.');
    }
    if ([directControl, presentationControl, noneControl].filter((item) => item.tabIndex === 0).length !== 1 || nestedControl.tabIndex !== 0) {
      throw new Error('Outer and nested toolbars must each preserve their own single Tab stop.');
    }
    canvasElement.querySelector('[data-testid="unmount-toolbar-ownership-probe"]')?.click();
    await waitForRender();
  },
};

export const ViewerToolbarCard = { ...ViewerToolbarCardStory, name: 'ViewerToolbar card parity', tags: ['!dev', 'visual-parity'] };
