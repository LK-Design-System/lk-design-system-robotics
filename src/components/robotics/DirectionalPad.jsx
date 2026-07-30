import React from 'react';
import { Icon } from '@lk-robotics/lds-core/components/icon/Icon';
import { IconButton } from '@lk-robotics/lds-core/components/buttons/IconButton';
import { VIEWER_OVERLAY } from './_viewerOverlay.js';

/**
 * LK ROBOTICS — DirectionalPad
 * A D-pad for PTZ / gimbal / jog control. Press-and-hold repeats `onStep(dir)`
 * at `rate` Hz until release; a tap fires once. Directions are up/down/left/
 * right plus an optional centre (home) button. Arrow keys drive it while
 * focused. For discrete stepped motion — pair with Joystick for analog.
 */
const DIRS = {
  up: { icon: 'arrow-up-thick', gridArea: '1 / 2' },
  left: { icon: 'arrow-left-thick', gridArea: '2 / 1' },
  right: { icon: 'arrow-right-thick', gridArea: '2 / 3' },
  down: { icon: 'arrow-down-thick', gridArea: '3 / 2' },
};

const KEY_TO_DIR = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

const DEFAULT_LABELS = {
  up: '위로 이동',
  down: '아래로 이동',
  left: '왼쪽으로 이동',
  right: '오른쪽으로 이동',
};

const normalizeNumber = (value, fallback) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

// Overlay treatment for a pad floating on a viewer surface (video, dark map).
// The ghost buttons are page-ink on transparent, which disappears over footage -
// and PTZ/gimbal, this pad's own headline use case, IS an over-video control.
// Per-button scrims rather than one shared plate so the cluster occludes as
// little of the frame as possible; see _viewerOverlay for the recipe rationale.
const ON_DARK_BUTTON = {
  background: VIEWER_OVERLAY.surface,
  border: VIEWER_OVERLAY.border,
  boxShadow: VIEWER_OVERLAY.shadow,
  backdropFilter: VIEWER_OVERLAY.blur,
  color: VIEWER_OVERLAY.ink,
};

export function DirectionalPad({ onStep, rate = 8, size = 48, disabled = false, center, onCenter, label = '방향 패드', directionLabels, centerLabel = '가운데', appearance = 'light', style, ...rest }) {
  const timer = React.useRef(null);
  const activeRef = React.useRef(null);
  // The repeat interval is a long-lived closure; capture onStep by ref so a
  // parent re-render that swaps the handler (rate multiplier, transmit gate)
  // does not leave the running hold calling a stale one.
  const onStepRef = React.useRef(onStep);
  onStepRef.current = onStep;
  const [activeDirection, setActiveDirection] = React.useState(null);
  const [centerActive, setCenterActive] = React.useState(false);

  const controlSize = Math.max(36, normalizeNumber(size, 48));
  const repeatRate = Math.max(1, normalizeNumber(rate, 8));
  const repeatDelay = Math.max(40, 1000 / repeatRate);
  const iconSize = Math.max(16, Math.round(controlSize * 0.42));
  const labels = { ...DEFAULT_LABELS, ...directionLabels };
  const canStep = !disabled && typeof onStep === 'function';
  const canCenter = !disabled && typeof onCenter === 'function';
  const showCenter = center != null || typeof onCenter === 'function';

  const clearTimer = React.useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  const stop = React.useCallback(() => {
    clearTimer();
    activeRef.current = null;
    setActiveDirection(null);
  }, [clearTimer]);

  React.useEffect(() => clearTimer, [clearTimer]);
  React.useEffect(() => {
    if (disabled) {
      stop();
      setCenterActive(false);
    }
  }, [disabled, stop]);

  const start = (dir) => {
    if (!canStep) return;
    if (activeRef.current === dir) return;
    stop();
    activeRef.current = dir;
    setActiveDirection(dir);
    onStepRef.current(dir);
    timer.current = setInterval(() => onStepRef.current(dir), repeatDelay);
  };
  const handlePointerUp = (event) => {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    stop();
  };
  const handleDirectionalKeyDown = (event) => {
    const dir = KEY_TO_DIR[event.key];
    if (!dir) return;
    event.preventDefault();
    start(dir);
  };
  const handleDirectionalKeyUp = (event) => {
    if (!KEY_TO_DIR[event.key]) return;
    event.preventDefault();
    stop();
  };

  const getButtonStyle = (key, isActive) => {
    return {
      boxSizing: 'border-box',
      gridArea: DIRS[key]?.gridArea || '2 / 2',
      touchAction: 'none',
      ...(appearance === 'on-dark' ? ON_DARK_BUTTON : {}),
      // The active highlight is an opaque tinted surface, so it carries its own
      // contrast on either appearance and stays the same in both.
      ...(isActive ? {
        background: 'var(--color-semantic-primary-surface-strong)',
        border: 'var(--border-thin) solid var(--color-semantic-primary-normal)',
        color: 'var(--color-semantic-primary-normal)',
      } : {}),
    };
  };

  const btn = (dir) => (
    <IconButton
      label={labels[dir] || dir}
      variant="ghost"
      size={controlSize}
      round={false}
      disabled={!canStep}
      data-direction={dir}
      onPointerDown={(e) => { e.preventDefault(); try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch { /* synthetic pointers expose no capturable pointer */ } start(dir); }}
      onPointerUp={handlePointerUp} onPointerLeave={stop} onPointerCancel={stop}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); start(dir); } }}
      onKeyUp={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); stop(); } }}
      onBlur={stop}
      style={getButtonStyle(dir, activeDirection === dir)}
    >
      <Icon name={DIRS[dir].icon} size={iconSize} aria-hidden="true" />
    </IconButton>
  );

  return (
    <div role="group" aria-label={label}
      aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"
      data-appearance={appearance}
      data-active-direction={activeDirection || undefined}
      onKeyDown={handleDirectionalKeyDown}
      onKeyUp={handleDirectionalKeyUp}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) stop(); }}
      style={{ display: 'grid', gridTemplateColumns: `repeat(3, ${controlSize}px)`, gridTemplateRows: `repeat(3, ${controlSize}px)`, gap: 'var(--space-1-5)', width: 'fit-content', ...style }} {...rest}>
      {btn('up')}
      {btn('left')}
      {showCenter ? (
        <IconButton
          label={centerLabel}
          variant="ghost"
          size={controlSize}
          disabled={!canCenter}
          onClick={() => onCenter && onCenter()}
          onPointerDown={() => { if (canCenter) setCenterActive(true); }}
          onPointerUp={() => setCenterActive(false)}
          onPointerLeave={() => setCenterActive(false)}
          onPointerCancel={() => setCenterActive(false)}
          onKeyDown={(e) => { if (canCenter && (e.key === 'Enter' || e.key === ' ')) setCenterActive(true); }}
          onKeyUp={(e) => { if (e.key === 'Enter' || e.key === ' ') setCenterActive(false); }}
          onBlur={() => setCenterActive(false)}
          style={getButtonStyle('center', centerActive)}
        >
          {center ?? <Icon name="home" size={iconSize} aria-hidden="true" />}
        </IconButton>
      ) : (
        <span aria-hidden="true" style={{ gridArea: '2 / 2', width: controlSize, height: controlSize }} />
      )}
      {btn('right')}
      {btn('down')}
    </div>
  );
}
