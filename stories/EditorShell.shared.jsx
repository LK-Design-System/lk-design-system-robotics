import React from 'react';
import {
  Button,
  CanvasEditorCommandBar,
  CanvasEditorShell,
  EditorToolbar,
  Icon,
  LayerPanel,
  SelectionInspector,
  Tabs,
  ViewerToolbar,
  ViewerToolbarButton,
  ViewportStatusBar,
} from './lds.js';

export const editorTools = [
  { value: 'select', label: '선택', shortcut: 'V', ariaKeyShortcuts: 'V', icon: <Icon name="crosshair" size={16} aria-hidden="true" /> },
  { value: 'route', label: '경로', shortcut: 'P', ariaKeyShortcuts: 'P', icon: <Icon name="route" size={16} aria-hidden="true" /> },
  { value: 'region', label: '영역', shortcut: 'R', ariaKeyShortcuts: 'R', icon: <Icon name="zone" size={16} aria-hidden="true" /> },
  { value: 'marker', label: '마커', shortcut: 'M', ariaKeyShortcuts: 'M', icon: <Icon name="location" size={16} aria-hidden="true" /> },
];

export const editorLayers = [
  {
    id: 'reference',
    label: '기준 지도',
    description: '읽기 전용',
    locked: true,
    tone: 'neutral',
    toneLabel: '참조',
  },
  {
    id: 'geometry',
    label: '편집 객체',
    description: '경로와 영역',
    tone: 'signal',
    toneLabel: '편집 가능',
    children: [
      { id: 'routes', label: '경로', count: 4, tone: 'signal' },
      { id: 'regions', label: '영역', count: 3, tone: 'positive' },
    ],
  },
  {
    id: 'guides',
    label: '가이드',
    count: 2,
    tone: 'cautionary',
  },
];

const OBJECTS = {
  zone: {
    label: '영역 A-03',
    kind: '다각형',
    status: '초안',
    statusTone: 'signal',
    sections: [
      {
        title: '기하 정보',
        fields: [
          { label: '레이어', value: '영역' },
          { label: '꼭짓점', value: 6 },
          { label: '면적', value: 24.8, unit: 'm²' },
        ],
      },
      {
        title: '동작',
        fields: [
          { label: '유형', value: '속도 제한' },
          { label: '최대 속도', value: 0.4, unit: 'm/s', tone: 'cautionary' },
        ],
      },
    ],
  },
  waypoint: {
    label: '웨이포인트 W-12',
    kind: '포인트',
    status: '검증됨',
    statusTone: 'positive',
    sections: [
      {
        title: '위치',
        fields: [
          { label: '레이어', value: '경로' },
          { label: 'X', value: 12.4, unit: 'm' },
          { label: 'Y', value: 8.1, unit: 'm' },
        ],
      },
      {
        title: '방향',
        fields: [{ label: '회전', value: 90, unit: '°' }],
      },
    ],
  },
};

export const inspectorItem = {
  label: OBJECTS.zone.label,
  kind: OBJECTS.zone.kind,
  status: OBJECTS.zone.status,
  statusTone: OBJECTS.zone.statusTone,
};

export const inspectorSections = OBJECTS.zone.sections;

export function EditorStoryFrame({ children, maxWidth = 1120, height = 620 }) {
  return (
    <main
      style={{
        width: 'calc(100% - 48px)',
        maxWidth,
        height,
        minWidth: 0,
        margin: '24px auto',
      }}
    >
      {children}
    </main>
  );
}

function CanvasSurface({ activeTool = 'select', selectedObject, onSelectObject, zoom, onZoomChange, showZoomPill = true }) {
  const selectObject = (value) => {
    if (activeTool === 'select') onSelectObject(value);
  };

  return (
    <div
      aria-label="2D 편집 뷰포트"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background:
          'linear-gradient(90deg, var(--color-semantic-line-normal-alternative) 1px, transparent 1px), linear-gradient(0deg, var(--color-semantic-line-normal-alternative) 1px, transparent 1px), var(--color-semantic-background-normal-alternative)',
        backgroundSize: '28px 28px',
      }}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 640 420"
        preserveAspectRatio="xMidYMid meet"
        style={{ position: 'absolute', inset: '7% 5% 10%', width: '90%', height: '83%', transform: `scale(${zoom / 100})`, transformOrigin: 'center', transition: 'transform var(--dur-fast) var(--ease-out)' }}
      >
        <path d="M70 330 L70 92 L240 92 L240 168 L376 168 L376 76 L565 76 L565 330 Z" fill="var(--color-semantic-background-elevated-normal)" stroke="var(--color-semantic-line-solid-normal)" strokeWidth="3" />
        <path d="M70 236 H202 V330 M240 92 V330 M376 168 V330 M468 76 V238 H565" fill="none" stroke="var(--color-semantic-line-normal-normal)" strokeWidth="2" />
        <polyline points="112,284 180,252 286,274 348,214 430,218 516,122" fill="none" stroke="var(--color-semantic-primary-normal)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <polygon points="286,196 352,184 386,240 342,286 278,256" fill="var(--color-semantic-status-cautionary-surface, var(--color-semantic-primary-surface-normal))" stroke="var(--color-semantic-status-cautionary)" strokeWidth="3" strokeDasharray="7 5" />
        {[['112','284'], ['180','252'], ['286','274'], ['348','214'], ['430','218'], ['516','122']].map(([cx, cy], index) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={index === 3 ? 8 : 5} fill={index === 3 ? 'var(--color-semantic-primary-normal)' : 'var(--color-semantic-background-elevated-normal)'} stroke="var(--color-semantic-primary-normal)" strokeWidth="3" />
        ))}
      </svg>

      <button
        type="button"
        aria-pressed={selectedObject === 'zone'}
        aria-label="영역 A-03 선택"
        onClick={() => selectObject('zone')}
        style={{ position: 'absolute', left: '48%', top: '52%', minWidth: 28, height: 28, padding: '0 var(--space-2)', border: selectedObject === 'zone' ? '2px solid var(--color-semantic-primary-normal)' : '1px solid var(--color-semantic-line-normal-normal)', borderRadius: 'var(--radius-sm)', background: 'var(--color-semantic-background-elevated-normal)', color: 'var(--color-semantic-label-strong)', boxShadow: selectedObject === 'zone' ? '0 0 0 3px var(--color-semantic-focus-ring)' : 'var(--shadow-sm)', fontFamily: 'var(--font-sans)', fontSize: 'var(--caption1-size)', fontWeight: 'var(--fw-bold)', cursor: activeTool === 'select' ? 'pointer' : 'default' }}
      >
        A-03
      </button>

      <button
        type="button"
        aria-pressed={selectedObject === 'waypoint'}
        aria-label="웨이포인트 W-12 선택"
        onClick={() => selectObject('waypoint')}
        style={{ position: 'absolute', right: '20%', top: '28%', width: 28, height: 28, padding: 0, border: selectedObject === 'waypoint' ? '2px solid var(--color-semantic-primary-normal)' : '1px solid var(--color-semantic-line-normal-normal)', borderRadius: '50%', background: 'var(--color-semantic-background-elevated-normal)', color: 'var(--color-semantic-primary-normal)', boxShadow: selectedObject === 'waypoint' ? '0 0 0 3px var(--color-semantic-focus-ring)' : 'var(--shadow-sm)', fontFamily: 'var(--font-sans)', fontSize: 'var(--caption1-size)', fontWeight: 'var(--fw-bold)', cursor: activeTool === 'select' ? 'pointer' : 'default' }}
      >
        12
      </button>

      <ViewerToolbar orientation="horizontal" label="뷰포트 보기" style={{ position: 'absolute', top: 'var(--space-3)', right: 'var(--space-3)' }}>
        <ViewerToolbarButton label="축소" onClick={() => onZoomChange(Math.max(50, zoom - 10))}>
          <Icon name="minus" size={16} aria-hidden="true" />
        </ViewerToolbarButton>
        <ViewerToolbarButton label="확대" onClick={() => onZoomChange(Math.min(200, zoom + 10))}>
          <Icon name="plus" size={16} aria-hidden="true" />
        </ViewerToolbarButton>
        <ViewerToolbarButton label="화면에 맞추기" onClick={() => onZoomChange(100)}>
          <Icon name="full" size={16} aria-hidden="true" />
        </ViewerToolbarButton>
      </ViewerToolbar>

      {/* Status 영역이 배율 표시를 소유하면(showZoomPill=false) pill은 도구 모드만 남긴다. */}
      <div style={{ position: 'absolute', left: 'var(--space-3)', bottom: 'var(--space-3)', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', minHeight: 28, padding: '0 var(--space-2)', border: '1px solid var(--color-semantic-line-normal-normal)', borderRadius: 'var(--radius-sm)', background: 'var(--color-semantic-background-elevated-normal)', color: 'var(--color-semantic-label-neutral)', boxShadow: 'var(--shadow-sm)', fontSize: 'var(--caption1-size)', fontWeight: 'var(--fw-semibold)' }}>
        <Icon name="crosshair" size={14} aria-hidden="true" />
        <span>{editorTools.find((item) => item.value === activeTool)?.label}</span>
        {showZoomPill && (
          <>
            <span aria-hidden="true">·</span>
            <span>{zoom}%</span>
          </>
        )}
      </div>
    </div>
  );
}

function RegionNavigation({ region, onRegionChange }) {
  return (
    <Tabs
      aria-label="편집 영역"
      items={[
        { value: 'canvas', label: '캔버스' },
        { value: 'layers', label: '레이어' },
        { value: 'panel', label: '속성' },
      ]}
      value={region}
      onChange={onRegionChange}
      size="small"
      resize="fill"
      padding
    />
  );
}

function InspectorForSelection({ selectedObject, onClearSelection, onDirty }) {
  const selected = selectedObject ? OBJECTS[selectedObject] : undefined;

  return (
    <SelectionInspector
      item={selected}
      sections={selected?.sections ?? []}
      onClearSelection={selected ? onClearSelection : undefined}
      actions={selected ? (
        <>
          <Button size="sm" variant="ghost" onClick={onClearSelection}>취소</Button>
          <Button size="sm" onClick={onDirty}>변경 적용</Button>
        </>
      ) : undefined}
    />
  );
}

export function BasicShellExample() {
  return (
    <EditorStoryFrame maxWidth={840} height={440}>
      <CanvasEditorShell title="새 편집 문서" description="저장되지 않음">
        <CanvasSurface activeTool="select" selectedObject={null} onSelectObject={() => {}} zoom={100} onZoomChange={() => {}} />
      </CanvasEditorShell>
    </EditorStoryFrame>
  );
}

export function WorkspaceRegionsExample() {
  const [tool, setTool] = React.useState('select');
  const [layer, setLayer] = React.useState('regions');
  const [selectedObject, setSelectedObject] = React.useState('zone');
  const [zoom, setZoom] = React.useState(100);
  const [dirty, setDirty] = React.useState(false);

  return (
    <EditorStoryFrame>
      <CanvasEditorShell
        title="floor_1.map"
        description={dirty ? '변경사항 있음 · 로컬 초안' : '저장됨 · 2D 지도'}
        toolbar={(
          <CanvasEditorCommandBar canUndo={dirty} canRedo={false} onUndo={() => setDirty(false)}>
            <Button size="sm" disabled={!dirty} onClick={() => setDirty(false)}>저장</Button>
          </CanvasEditorCommandBar>
        )}
        tools={<EditorToolbar items={editorTools} value={tool} onChange={setTool} />}
        layers={(
          <LayerPanel
            title="장면"
            layers={editorLayers}
            activeLayerId={layer}
            onActiveLayerChange={setLayer}
          />
        )}
        panel={(
          <InspectorForSelection
            selectedObject={selectedObject}
            onClearSelection={() => setSelectedObject(null)}
            onDirty={() => setDirty(true)}
          />
        )}
        panelWidth={272}
        layerPanelWidth={252}
        status={(
          <ViewportStatusBar
            items={[
              { label: '확대', value: zoom, unit: '%', priority: 'high' },
              { label: '스냅', value: '켜짐', tone: 'positive', toneLabel: '활성' },
              { label: '활성 레이어', value: editorLayers.flatMap((item) => [item, ...(item.children ?? [])]).find((item) => item.id === layer)?.label ?? layer, priority: 'low' },
            ]}
            message={selectedObject ? `${OBJECTS[selectedObject].label} 선택됨` : '캔버스에서 객체를 선택하세요'}
          />
        )}
      >
        <CanvasSurface activeTool={tool} selectedObject={selectedObject} onSelectObject={setSelectedObject} zoom={zoom} onZoomChange={setZoom} showZoomPill={false} />
      </CanvasEditorShell>
    </EditorStoryFrame>
  );
}

export function ContextDrawerExample() {
  const [open, setOpen] = React.useState(true);
  const [zoom, setZoom] = React.useState(100);

  return (
    <EditorStoryFrame maxWidth={880} height={480}>
      <CanvasEditorShell
        title="검토 전용 뷰"
        description="가벼운 컨텍스트 패널"
        panel={<InspectorForSelection selectedObject="waypoint" onClearSelection={() => setOpen(false)} onDirty={() => {}} />}
        panelMode="drawer"
        panelOpen={open}
        onPanelOpenChange={setOpen}
        panelWidth={280}
      >
        <CanvasSurface activeTool="select" selectedObject="waypoint" onSelectObject={() => setOpen(true)} zoom={zoom} onZoomChange={setZoom} />
      </CanvasEditorShell>
    </EditorStoryFrame>
  );
}

export function CanvasEditorShellMobileExample({ region, onRegionChange }) {
  const [tool, setTool] = React.useState('select');
  const [layer, setLayer] = React.useState('routes');
  const [selectedObject, setSelectedObject] = React.useState('waypoint');
  const [zoom, setZoom] = React.useState(100);

  return (
    <CanvasEditorShell
      title="mobile-map"
      description="좁은 화면 편집 영역"
      mobileActiveRegion={region}
      responsiveNavigation={<RegionNavigation region={region} onRegionChange={onRegionChange} />}
      tools={<EditorToolbar items={editorTools} value={tool} onChange={setTool} />}
      layers={<LayerPanel title="장면" layers={editorLayers} activeLayerId={layer} onActiveLayerChange={setLayer} />}
      panel={<InspectorForSelection selectedObject={selectedObject} onClearSelection={() => setSelectedObject(null)} onDirty={() => {}} />}
      panelWidth={280}
      layerPanelWidth={240}
    >
      <CanvasSurface activeTool={tool} selectedObject={selectedObject} onSelectObject={setSelectedObject} zoom={zoom} onZoomChange={setZoom} />
    </CanvasEditorShell>
  );
}
