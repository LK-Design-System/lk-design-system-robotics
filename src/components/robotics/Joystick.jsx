import React from 'react';

const ZERO_VECTOR = { x: 0, y: 0 };
const ARROW_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

const isStopped = (value) => value.x === 0 && value.y === 0;

const describeCommand = ({ x, y }) => {
  const parts = [];
  if (Math.abs(y) >= 0.01) parts.push(`${y > 0 ? '전진' : '후진'} ${Math.round(Math.abs(y) * 100)}%`);
  if (Math.abs(x) >= 0.01) parts.push(`${x > 0 ? '오른쪽' : '왼쪽'} ${Math.round(Math.abs(x) * 100)}%`);
  return `현재 명령: ${parts.length ? parts.join(' · ') : '정지'}`;
};

/**
 * LK ROBOTICS — Joystick
 * Hold-to-run virtual teleoperation control. A pointer press immediately emits
 * a vector (dragging is optional), while arrow keys emit until keyup. Every
 * release path emits {x: 0, y: 0} before `onEnd`.
 */
export function Joystick({
  size = 160,
  onChange,
  onEnd,
  sticky = false,
  disabled = false,
  label = '조이스틱',
  instructions = '누르고 있는 동안 이동 · 화살표 키를 놓으면 정지',
  showValue = true,
  style,
  ...rest
}) {
  const ref = React.useRef(null);
  const positionRef = React.useRef(ZERO_VECTOR);
  const commandRef = React.useRef(ZERO_VECTOR);
  const engagedRef = React.useRef(false);
  const pointerIdRef = React.useRef(null);
  const activeKeysRef = React.useRef(new Set());
  const onChangeRef = React.useRef(onChange);
  const onEndRef = React.useRef(onEnd);
  const [position, setPosition] = React.useState(ZERO_VECTOR);
  const [command, setCommand] = React.useState(ZERO_VECTOR);
  const [active, setActive] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  const labelId = React.useId();
  const instructionsId = React.useId();
  const valueId = React.useId();

  onChangeRef.current = onChange;
  onEndRef.current = onEnd;

  const radius = size / 2;
  const knob = Math.round(size * 0.32);
  const max = Math.max(1, radius - knob / 2 - 4);

  const emitCommand = React.useCallback((next) => {
    commandRef.current = next;
    setCommand(next);
    onChangeRef.current?.({ ...next });
  }, []);

  const emitPosition = React.useCallback((x, y) => {
    const nextPosition = { x, y };
    const nextCommand = {
      x: +(x / max).toFixed(3),
      y: +(-y / max).toFixed(3),
    };
    positionRef.current = nextPosition;
    setPosition(nextPosition);
    emitCommand(nextCommand);
  }, [emitCommand, max]);

  const endInteraction = React.useCallback((reason) => {
    const hadActiveCommand = engagedRef.current || !isStopped(commandRef.current);
    const preserveVisualPosition = sticky && (reason === 'pointer-release' || reason === 'keyboard-release');

    // Sticky is visual only. Every next command starts from a zero origin.
    positionRef.current = ZERO_VECTOR;
    if (!preserveVisualPosition) setPosition(ZERO_VECTOR);
    if (!hadActiveCommand) return;

    engagedRef.current = false;
    pointerIdRef.current = null;
    activeKeysRef.current.clear();
    setActive(false);

    emitCommand(ZERO_VECTOR);
    onEndRef.current?.(reason);
  }, [emitCommand, sticky]);

  const beginInteraction = () => {
    if (!engagedRef.current) {
      engagedRef.current = true;
      setActive(true);
    }
  };

  const setFromClientPoint = (clientX, clientY) => {
    const element = ref.current;
    if (!element) return;
    const bounds = element.getBoundingClientRect();
    let x = clientX - (bounds.left + radius);
    let y = clientY - (bounds.top + radius);
    const distance = Math.hypot(x, y);
    if (distance > max) {
      x = (x / distance) * max;
      y = (y / distance) * max;
    }
    emitPosition(x, y);
  };

  const handlePointerDown = (event) => {
    if (disabled || engagedRef.current || event.isPrimary === false || (event.pointerType === 'mouse' && event.button !== 0)) return;
    pointerIdRef.current = event.pointerId;
    beginInteraction();
    event.currentTarget.focus({ preventScroll: true });
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // Some synthetic pointer sources do not expose a capturable active pointer.
    }
    setFromClientPoint(event.clientX, event.clientY);
  };

  const handlePointerMove = (event) => {
    if (!engagedRef.current || pointerIdRef.current !== event.pointerId) return;
    setFromClientPoint(event.clientX, event.clientY);
  };

  const handlePointerEnd = (reason) => (event) => {
    if (pointerIdRef.current != null && pointerIdRef.current !== event.pointerId) return;
    endInteraction(reason);
  };

  const emitKeyboardVector = () => {
    const keys = activeKeysRef.current;
    const step = max * 0.68;
    let x = ((keys.has('ArrowRight') ? 1 : 0) - (keys.has('ArrowLeft') ? 1 : 0)) * step;
    let y = ((keys.has('ArrowDown') ? 1 : 0) - (keys.has('ArrowUp') ? 1 : 0)) * step;
    const distance = Math.hypot(x, y);
    if (distance > max) {
      x = (x / distance) * max;
      y = (y / distance) * max;
    }
    emitPosition(x, y);
  };

  const handleKeyDown = (event) => {
    if (disabled) return;
    if (event.key === ' ' || event.key === 'Escape') {
      event.preventDefault();
      endInteraction('keyboard-cancel');
      return;
    }
    if (!ARROW_KEYS.has(event.key) || pointerIdRef.current != null) return;

    event.preventDefault();
    beginInteraction();
    activeKeysRef.current.add(event.key);
    emitKeyboardVector();
  };

  const handleKeyUp = (event) => {
    if (!ARROW_KEYS.has(event.key)) return;
    if (pointerIdRef.current != null) return;
    event.preventDefault();
    activeKeysRef.current.delete(event.key);
    if (activeKeysRef.current.size === 0) {
      endInteraction('keyboard-release');
      return;
    }
    emitKeyboardVector();
  };

  React.useEffect(() => {
    if (disabled) endInteraction('disabled');
  }, [disabled, endInteraction]);

  React.useEffect(() => () => {
    if (!engagedRef.current && isStopped(commandRef.current)) return;
    engagedRef.current = false;
    pointerIdRef.current = null;
    activeKeysRef.current.clear();
    commandRef.current = ZERO_VECTOR;
    onChangeRef.current?.({ ...ZERO_VECTOR });
    onEndRef.current?.('unmount');
  }, []);

  const visibleLabel = label ?? '조이스틱';
  const describedBy = [instructions != null ? instructionsId : null, showValue ? valueId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-2)',
        width: `min(100%, ${Math.max(size, 220)}px)`,
        ...style,
      }}
      {...rest}
    >
      <div
        ref={ref}
        role="application"
        aria-labelledby={labelId}
        aria-describedby={describedBy}
        aria-disabled={disabled || undefined}
        aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Space Escape"
        tabIndex={disabled ? -1 : 0}
        data-active={active ? 'true' : 'false'}
        data-command-x={command.x}
        data-command-y={command.y}
        data-position-x={position.x}
        data-position-y={position.y}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd('pointer-release')}
        onPointerCancel={handlePointerEnd('pointer-cancel')}
        onLostPointerCapture={handlePointerEnd('pointer-capture-lost')}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onFocus={() => setFocus(true)}
        onBlur={() => {
          setFocus(false);
          endInteraction('blur');
        }}
        style={{
          position: 'relative',
          flex: '0 0 auto',
          width: size,
          height: size,
          borderRadius: '50%',
          outline: 'none',
          background: 'var(--color-semantic-fill-normal)',
          border: '1px solid var(--color-semantic-line-normal-normal)',
          boxShadow: focus ? '0 0 0 4px var(--color-semantic-focus-ring)' : 'inset var(--shadow-sm)',
          touchAction: 'none',
          cursor: disabled ? 'not-allowed' : (active ? 'grabbing' : 'grab'),
          opacity: disabled ? 0.45 : 1,
        }}
      >
        <span aria-hidden="true" style={{ position: 'absolute', left: '50%', top: 10, bottom: 10, width: 1, background: 'var(--color-semantic-line-normal-neutral)', transform: 'translateX(-0.5px)' }} />
        <span aria-hidden="true" style={{ position: 'absolute', top: '50%', left: 10, right: 10, height: 1, background: 'var(--color-semantic-line-normal-neutral)', transform: 'translateY(-0.5px)' }} />
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: knob,
            height: knob,
            marginLeft: -knob / 2,
            marginTop: -knob / 2,
            borderRadius: '50%',
            background: 'var(--color-semantic-primary-normal)',
            boxShadow: 'var(--shadow-control)',
            transform: `translate(${position.x}px, ${position.y}px)`,
            transition: active ? 'none' : 'transform var(--dur-base) var(--ease-out)',
          }}
        />
      </div>
      <span
        id={labelId}
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--label2-size)',
          lineHeight: 'var(--label2-line)',
          fontWeight: 'var(--fw-semibold)',
          color: 'var(--color-semantic-label-strong)',
          textAlign: 'center',
        }}
      >
        {visibleLabel}
      </span>
      {showValue && (
        <span
          id={valueId}
          data-testid="joystick-command"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--caption1-size)',
            lineHeight: 'var(--caption1-line)',
            fontWeight: 'var(--fw-semibold)',
            color: 'var(--color-semantic-label-neutral)',
            textAlign: 'center',
          }}
        >
          {describeCommand(command)}
        </span>
      )}
      {instructions != null && (
        <span
          id={instructionsId}
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--caption1-size)',
            lineHeight: 'var(--caption1-line)',
            color: 'var(--color-semantic-label-alternative)',
            textAlign: 'center',
          }}
        >
          {instructions}
        </span>
      )}
    </div>
  );
}
