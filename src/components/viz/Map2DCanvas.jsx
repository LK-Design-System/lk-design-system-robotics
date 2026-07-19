import React from 'react';
import { Icon } from '@lk-robotics/lds-core/components/icon/Icon';
import { ViewerFrame, VIEWER_BLOCKING_STATES } from './ViewerFrame.jsx';
import { ViewerToolbar, ViewerToolbarButton } from './ViewerToolbar.jsx';

const DEFAULT_VIEWPORT = { x: 0, y: 0, z: 1 };

function finiteOr(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function isInteractiveDescendant(target) {
  return target instanceof Element && Boolean(target.closest([
    '[data-lk-viewport-control]',
    'button',
    'a[href]',
    'input',
    'select',
    'textarea',
    '[contenteditable="true"]',
    '[role="button"]',
    '[role="slider"]',
  ].join(',')));
}

/**
 * LK ROBOTICS — Map2DCanvas
 *
 * Renderer-independent pan / zoom shell for 2D maps. Ordinary image, SVG, and
 * canvas content starts at the viewport's top-left by default. Renderers that
 * use a world-space origin may opt into `contentOrigin="center"` explicitly.
 */
export function Map2DCanvas({
  children,
  minZoom = 0.25,
  maxZoom = 8,
  grid = true,
  controls = true,
  panEnabled = true,
  wheelZoom = true,
  keyboard = true,
  contentOrigin = 'top-left',
  viewport,
  defaultViewport = DEFAULT_VIEWPORT,
  onViewportChange,
  onFit,
  toolbar,
  overlay,
  status,
  source,
  badges,
  hud,
  state = 'ready',
  stateLabel,
  stateDescription,
  stateIcon,
  stateAction,
  appearance = 'light',
  variant = 'standalone',
  label = '2D 맵 캔버스',
  style,
  tabIndex,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onWheel,
  onKeyDown,
  ...rootProps
}) {
  const controlled = viewport !== undefined;
  const [internalViewport, setInternalViewport] = React.useState(defaultViewport);
  const renderedViewport = {
    ...DEFAULT_VIEWPORT,
    ...(controlled ? viewport : internalViewport),
  };
  const viewportRef = React.useRef(renderedViewport);
  const rootRef = React.useRef(null);
  const dragRef = React.useRef(null);
  const wheelHandlerRef = React.useRef(null);
  const interactionBlocked = VIEWER_BLOCKING_STATES.includes(state);

  viewportRef.current = renderedViewport;

  const clampZoom = (zoom) => Math.max(minZoom, Math.min(maxZoom, zoom));
  const normalizeViewport = (next) => ({
    x: finiteOr(next?.x, 0),
    y: finiteOr(next?.y, 0),
    z: clampZoom(finiteOr(next?.z, 1)),
  });

  const commitViewport = (nextOrUpdater) => {
    const current = viewportRef.current;
    const next = typeof nextOrUpdater === 'function'
      ? nextOrUpdater(current)
      : nextOrUpdater;
    const normalized = normalizeViewport(next);

    // Keep rapid wheel / pointer events cumulative even before React renders.
    viewportRef.current = normalized;
    if (!controlled) setInternalViewport(normalized);
    onViewportChange?.(normalized);
  };

  const getOriginOffset = () => {
    const root = rootRef.current;
    if (contentOrigin !== 'center' || !root) return { x: 0, y: 0 };
    return { x: root.clientWidth / 2, y: root.clientHeight / 2 };
  };

  const zoomAt = (factor, focalPoint) => {
    const current = viewportRef.current;
    const nextZoom = clampZoom(current.z * factor);
    if (nextZoom === current.z) return;

    const origin = getOriginOffset();
    const root = rootRef.current;
    const focal = focalPoint ?? {
      x: (root?.clientWidth ?? 0) / 2 - origin.x,
      y: (root?.clientHeight ?? 0) / 2 - origin.y,
    };
    const ratio = nextZoom / current.z;

    commitViewport({
      x: focal.x - (focal.x - current.x) * ratio,
      y: focal.y - (focal.y - current.y) * ratio,
      z: nextZoom,
    });
  };

  const resetViewport = () => commitViewport(defaultViewport);

  const handlePointerDown = (event) => {
    if (interactionBlocked) return;
    onPointerDown?.(event);
    if (event.defaultPrevented) return;

    if (!panEnabled || event.button !== 0 || isInteractiveDescendant(event.target)) return;

    const current = viewportRef.current;
    dragRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      viewportX: current.x,
      viewportY: current.y,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (interactionBlocked) return;
    onPointerMove?.(event);
    if (event.defaultPrevented) return;

    const drag = dragRef.current;
    if (!drag) return;
    commitViewport((current) => ({
      ...current,
      x: drag.viewportX + (event.clientX - drag.pointerX),
      y: drag.viewportY + (event.clientY - drag.pointerY),
    }));
  };

  const endPointerInteraction = (event, consumerHandler) => {
    dragRef.current = null;
    if (interactionBlocked) return;
    consumerHandler?.(event);
  };

  const handleWheel = (event) => {
    if (interactionBlocked) return;
    onWheel?.(event);
    if (event.defaultPrevented || !wheelZoom || event.deltaY === 0 || isInteractiveDescendant(event.target)) return;

    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const origin = contentOrigin === 'center'
      ? { x: rect.width / 2, y: rect.height / 2 }
      : { x: 0, y: 0 };
    const focalPoint = {
      x: event.clientX - rect.left - origin.x,
      y: event.clientY - rect.top - origin.y,
    };
    const boundedDelta = Math.max(-0.22, Math.min(0.22, -event.deltaY * 0.0015));
    zoomAt(Math.exp(boundedDelta), focalPoint);
  };

  wheelHandlerRef.current = handleWheel;
  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const listener = (event) => wheelHandlerRef.current?.(event);
    root.addEventListener('wheel', listener, { passive: false });
    return () => root.removeEventListener('wheel', listener);
  }, []);

  const handleKeyDown = (event) => {
    if (interactionBlocked) return;
    onKeyDown?.(event);
    if (event.defaultPrevented || !keyboard) return;

    // Keyboard shortcuts belong to the focusable viewport itself. Descendant
    // toolbar buttons, fields, sliders, and renderer controls keep their keys.
    if (event.target !== event.currentTarget) return;

    const step = event.shiftKey ? 48 : 18;
    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      zoomAt(1.12);
    } else if (event.key === '-' || event.key === '_') {
      event.preventDefault();
      zoomAt(0.88);
    } else if (event.key === '0') {
      event.preventDefault();
      resetViewport();
    } else if (panEnabled && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      commitViewport((current) => ({
        ...current,
        x: current.x + (event.key === 'ArrowLeft' ? step : event.key === 'ArrowRight' ? -step : 0),
        y: current.y + (event.key === 'ArrowUp' ? step : event.key === 'ArrowDown' ? -step : 0),
      }));
    }
  };

  const t = renderedViewport;
  const renderedChildren = typeof children === 'function'
    ? children({ viewport: t, setViewport: commitViewport })
    : children;
  const centeredContent = contentOrigin === 'center';
  const gridPosition = centeredContent
    ? `calc(50% + ${t.x}px) calc(50% + ${t.y}px)`
    : `${t.x}px ${t.y}px`;
  const viewerToolbar = controls ? (
    <ViewerToolbar
      orientation="vertical"
      appearance={appearance === 'dark' ? 'on-dark' : 'surface'}
      label="지도 보기"
      data-lk-viewport-control=""
    >
      <ViewerToolbarButton label="확대" onClick={() => zoomAt(1.2)}>
        <Icon name="plus" size={16} aria-hidden="true" />
      </ViewerToolbarButton>
      <ViewerToolbarButton label="축소" onClick={() => zoomAt(0.8)}>
        <Icon name="minus" size={16} aria-hidden="true" />
      </ViewerToolbarButton>
      {onFit != null && (
        <ViewerToolbarButton label="전체 보기" onClick={onFit}>
          <Icon name="full" size={16} aria-hidden="true" />
        </ViewerToolbarButton>
      )}
      <ViewerToolbarButton label="보기 초기화" onClick={resetViewport}>
        <Icon name="reset" size={16} aria-hidden="true" />
      </ViewerToolbarButton>
    </ViewerToolbar>
  ) : undefined;

  return (
    <ViewerFrame
      {...rootProps}
      ref={rootRef}
      label={label}
      appearance={appearance}
      variant={variant}
      source={source}
      badges={badges}
      hud={hud}
      toolbar={toolbar !== undefined ? toolbar : viewerToolbar}
      toolbarPlacement="bottom-right"
      overlay={overlay}
      status={status ?? (controls ? `${Math.round(t.z * 100)}%` : undefined)}
      state={state}
      stateLabel={stateLabel}
      stateDescription={stateDescription}
      stateIcon={stateIcon}
      stateAction={stateAction}
      data-lk-map-canvas=""
      tabIndex={interactionBlocked ? undefined : keyboard ? 0 : tabIndex}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(event) => endPointerInteraction(event, onPointerUp)}
      onPointerCancel={(event) => endPointerInteraction(event, onPointerCancel)}
      onKeyDown={handleKeyDown}
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        height: '100%',
        minHeight: 200,
        '--map-grid-line': 'var(--viewer-border)',
        backgroundColor: appearance === 'dark' ? 'var(--viewer-surface)' : 'var(--viewer-surface-elevated)',
        cursor: interactionBlocked ? 'default' : panEnabled ? 'grab' : 'default',
        touchAction: !interactionBlocked && panEnabled ? 'none' : 'auto',
        backgroundImage: grid
          ? 'linear-gradient(var(--map-grid-line) 1px,transparent 1px),linear-gradient(90deg,var(--map-grid-line) 1px,transparent 1px)'
          : 'none',
        backgroundSize: grid ? `${24 * t.z}px ${24 * t.z}px` : undefined,
        backgroundPosition: grid ? gridPosition : undefined,
        ...style,
      }}
    >
      <div
        data-lk-map-content=""
        style={{
          position: 'absolute',
          left: centeredContent ? '50%' : 0,
          top: centeredContent ? '50%' : 0,
          transform: `translate(${t.x}px, ${t.y}px) scale(${t.z})`,
          transformOrigin: '0 0',
        }}
      >
        {renderedChildren}
      </div>
    </ViewerFrame>
  );
}
