import React from 'react';
import { Icon } from '@lk-robotics/lds-core/components/icon/Icon';

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

export function DirectionalPad({ onStep, rate = 8, size = 48, disabled = false, center, onCenter, label = '방향 패드', directionLabels, centerLabel = '가운데', style, ...rest }) {
  const timer = React.useRef(null);
  const activeRef = React.useRef(null);
  const [activeDirection, setActiveDirection] = React.useState(null);
  const [hoveredControl, setHoveredControl] = React.useState(null);
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
    onStep(dir);
    timer.current = setInterval(() => onStep(dir), repeatDelay);
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

  const getButtonStyle = (key, isActive, isDisabled, round = false) => {
    const isHovered = hoveredControl === key && !isDisabled;
    return {
      boxSizing: 'border-box',
      gridArea: DIRS[key]?.gridArea || '2 / 2',
      width: controlSize,
      height: controlSize,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
      border: `1px solid ${isActive ? 'var(--color-semantic-primary-normal)' : isHovered ? 'var(--color-semantic-line-solid-normal)' : 'var(--color-semantic-line-normal-normal)'}`,
      borderRadius: round ? 'var(--radius-pill)' : 'var(--radius-md)',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      background: isDisabled
        ? 'var(--color-semantic-fill-normal)'
        : isActive
          ? 'var(--color-semantic-primary-surface-strong)'
          : isHovered
            ? 'var(--color-semantic-fill-normal)'
            : 'var(--color-semantic-background-elevated-normal)',
      color: isDisabled
        ? 'var(--color-semantic-label-disable)'
        : isActive
          ? 'var(--color-semantic-primary-normal)'
          : 'var(--color-semantic-label-neutral)',
      touchAction: 'none',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--caption1-size)',
      fontWeight: 'var(--fw-bold)',
      lineHeight: 1,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      WebkitTapHighlightColor: 'transparent',
      transition: 'background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out)',
    };
  };

  const btn = (dir) => (
    <button type="button" aria-label={labels[dir] || dir} disabled={!canStep}
      data-direction={dir}
      onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture?.(e.pointerId); start(dir); }}
      onPointerUp={handlePointerUp} onPointerLeave={stop} onPointerCancel={stop}
      onMouseEnter={() => setHoveredControl(dir)} onMouseLeave={() => setHoveredControl(null)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); start(dir); } }}
      onKeyUp={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); stop(); } }}
      onBlur={stop}
      style={getButtonStyle(dir, activeDirection === dir, !canStep)}>
      <Icon name={DIRS[dir].icon} size={iconSize} aria-hidden="true" />
    </button>
  );

  return (
    <div role="group" aria-label={label}
      data-active-direction={activeDirection || undefined}
      onKeyDown={handleDirectionalKeyDown}
      onKeyUp={handleDirectionalKeyUp}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) stop(); }}
      style={{ display: 'grid', gridTemplateColumns: `repeat(3, ${controlSize}px)`, gridTemplateRows: `repeat(3, ${controlSize}px)`, gap: 6, width: 'fit-content', ...style }} {...rest}>
      {btn('up')}
      {btn('left')}
      {showCenter ? (
        <button type="button" aria-label={centerLabel} disabled={!canCenter}
          onClick={() => onCenter && onCenter()}
          onPointerDown={() => { if (canCenter) setCenterActive(true); }}
          onPointerUp={() => setCenterActive(false)}
          onPointerLeave={() => setCenterActive(false)}
          onPointerCancel={() => setCenterActive(false)}
          onMouseEnter={() => setHoveredControl('center')}
          onMouseLeave={() => setHoveredControl(null)}
          onKeyDown={(e) => { if (canCenter && (e.key === 'Enter' || e.key === ' ')) setCenterActive(true); }}
          onKeyUp={(e) => { if (e.key === 'Enter' || e.key === ' ') setCenterActive(false); }}
          onBlur={() => setCenterActive(false)}
          style={getButtonStyle('center', centerActive, !canCenter, true)}>
          {center ?? <Icon name="home" size={iconSize} aria-hidden="true" />}
        </button>
      ) : (
        <span aria-hidden="true" style={{ gridArea: '2 / 2', width: controlSize, height: controlSize }} />
      )}
      {btn('right')}
      {btn('down')}
    </div>
  );
}
