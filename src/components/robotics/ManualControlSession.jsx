import React from 'react';
import { Button } from '@lk-robotics/lds-core/components/buttons/Button';
import { StatusBadge } from '@lk-robotics/lds-core/components/content/StatusBadge';
import { Icon } from '@lk-robotics/lds-core/components/icon/Icon';
import { Banner } from '@lk-robotics/lds-core/components/status/Banner';
import { ConnectionBadge } from './ConnectionBadge.jsx';

const LINK_LABELS = {
  ready: '연결 준비됨',
  stale: '연결 정보 오래됨',
  lost: '연결 끊김',
};

const AUTHORITY_LABELS = {
  checking: '권한 확인 중',
  granted: '권한 부여됨',
  denied: '권한 거부됨',
  revoked: '권한 회수됨',
};

const LINK_CONNECTION_STATUS = {
  ready: 'ready',
  stale: 'stale',
  lost: 'offline',
};

const CONTROL_MODE_LABELS = {
  pointer: '포인터',
  keyboard: '키보드',
  hybrid: '포인터 + 키보드',
};

const GUARD_STATUS = {
  'link-unavailable': {
    tone: 'negative',
    title: '제어 연결 없음',
    message: '연결이 복구되면 수동 제어를 다시 준비하세요.',
  },
  'authority-unavailable': {
    tone: 'negative',
    title: '제어 권한 없음',
    message: '서버에서 이 세션에 제어 권한을 부여하지 않았습니다.',
  },
  disarmed: {
    tone: 'signal',
    title: '수동 제어 잠김 — 아래에서 수동 제어를 준비하세요',
    message: null,
  },
  'deadman-released': {
    tone: 'cautionary',
    title: '외부 활성화 입력 대기',
    message: '연결된 활성화 장치를 계속 유지하는 동안만 제어 명령을 보낼 수 있습니다.',
  },
  'focus-lost': {
    tone: 'cautionary',
    title: '제어 포커스 해제',
    message: '제어 영역을 다시 선택해 포커스를 복구하세요.',
  },
};

const STALE_LINK_STATUS = {
  tone: 'cautionary',
  title: '연결 상태 점검 필요',
  message: '최신 연결 상태가 확인될 때까지 제어 명령을 보내지 않습니다.',
};

const CHECKING_AUTHORITY_STATUS = {
  tone: 'cautionary',
  title: '제어 권한 확인 중',
  message: '권한 확인이 끝날 때까지 수동 제어를 준비할 수 없습니다.',
};

const READY_STATUS = {
  tone: 'positive',
  title: '수동 제어 가능',
  message: null,
};

const REARM_STATUS = {
  tone: 'cautionary',
  title: '수동 제어 재활성화 필요',
  message: '정지 요청 이후에는 수동 제어를 해제한 뒤 다시 준비하세요.',
};

const STOP_REQUEST_STATUS = {
  requesting: {
    tone: 'signal',
    title: '운행 정지 요청 전송 중',
    message: '로봇이 요청을 수신했는지 확인하고 있습니다.',
  },
  acknowledged: {
    tone: 'cautionary',
    title: '운행 정지 요청 수신됨',
    message: '요청은 수신됐지만 실제 정지는 아직 확인되지 않았습니다.',
  },
  stopped: {
    tone: 'positive',
    title: '운행 정지 확인됨',
    message: null,
  },
  failed: {
    tone: 'negative',
    title: '운행 정지 요청 실패',
    message: '로봇의 실제 상태를 확인한 뒤 다시 요청하세요.',
  },
};

const STOP_BUTTON_LABELS = {
  requesting: '정지 요청 전송 중',
  acknowledged: '정지 요청 수신됨',
  stopped: '운행 정지 확인됨',
  failed: '운행 정지 다시 요청',
};

function releaseReason({ linkReady, authorityGranted, armed, deadmanRequired, deadmanActive, focusSatisfied, windowActive }) {
  if (!linkReady) return 'link-unavailable';
  if (!authorityGranted) return 'authority-unavailable';
  if (!armed) return 'disarmed';
  if (deadmanRequired && !deadmanActive) return 'deadman-released';
  if (!windowActive || !focusSatisfied) return 'focus-lost';
  return null;
}

function guardStatus(reason, { linkState, authority }) {
  if (reason === 'link-unavailable' && linkState === 'stale') return STALE_LINK_STATUS;
  if (reason === 'authority-unavailable' && authority === 'checking') return CHECKING_AUTHORITY_STATUS;
  return reason == null ? READY_STATUS : GUARD_STATUS[reason] || GUARD_STATUS.disarmed;
}

function statusTone(value, positiveValue) {
  if (value === positiveValue) return 'signal';
  if (value === 'checking' || value === 'stale') return 'cautionary';
  return 'negative';
}

function normalizeStopRequestState(value) {
  return value === 'requesting' || value === 'acknowledged' || value === 'stopped' || value === 'failed'
    ? value
    : 'idle';
}

/** UI boundary for a manual-control session. Transport STOP and watchdog guarantees remain application responsibilities. */
export function ManualControlSession({
  title = '수동 제어 세션',
  headingLevel = 2,
  linkState = 'lost',
  authority = 'checking',
  armed = false,
  deadmanRequired = true,
  deadmanActive = false,
  controlMode = 'pointer',
  focusRequired = false,
  sessionMeta,
  deadmanControl,
  stopRequestState,
  stopRequestMessage,
  stopRequestLabel = '운행 정지 요청',
  onArmedChange,
  onSafetyReleaseRequest,
  onStopRequest,
  onEmergencyStopRequest,
  onFocusChange,
  children,
  onFocus,
  onBlur,
  style,
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  const [windowActive, setWindowActive] = React.useState(true);
  const [stopRequestedLocally, setStopRequestedLocally] = React.useState(false);
  const [stopRearmRequired, setStopRearmRequired] = React.useState(false);
  const controlsRef = React.useRef(null);
  const generatedId = React.useId().replace(/:/g, '');
  const titleId = `manual-control-title-${generatedId}`;
  const statusId = `manual-control-status-${generatedId}`;
  const normalizedHeadingLevel = Math.min(6, Math.max(2, Number(headingLevel) || 2));
  const Heading = `h${normalizedHeadingLevel}`;
  const stopStateControlled = stopRequestState !== undefined;
  const normalizedStopState = normalizeStopRequestState(stopRequestState);
  const displayStopState = stopRequestedLocally && (normalizedStopState === 'idle' || normalizedStopState === 'failed')
    ? 'requesting'
    : normalizedStopState;
  const stopCycleActive = displayStopState !== 'idle';
  const stopBlockActive = stopCycleActive || stopRearmRequired;
  const stopCallback = onStopRequest || onEmergencyStopRequest;
  const linkReady = linkState === 'ready';
  const authorityGranted = authority === 'granted';
  const focusSatisfied = !focusRequired || controlMode === 'pointer' || focused;
  const baseReason = releaseReason({ linkReady, authorityGranted, armed, deadmanRequired, deadmanActive, focusSatisfied, windowActive });
  const reason = stopBlockActive ? 'stop-requested' : baseReason;
  const interactionEnabled = reason == null;
  const baseGuard = guardStatus(baseReason, { linkState, authority });
  const stopGuard = STOP_REQUEST_STATUS[displayStopState];
  const guard = stopGuard
    ? { ...stopGuard, message: stopRequestMessage ?? stopGuard.message }
    : stopRearmRequired
      ? REARM_STATUS
      : baseGuard;

  const latestEnabled = React.useRef(interactionEnabled);
  const previousEnabled = React.useRef(interactionEnabled);
  const previousStopState = React.useRef(normalizedStopState);
  const releaseRequest = React.useRef(onSafetyReleaseRequest);
  const armedChange = React.useRef(onArmedChange);

  React.useEffect(() => {
    latestEnabled.current = interactionEnabled;
    releaseRequest.current = onSafetyReleaseRequest;
    armedChange.current = onArmedChange;
  });

  React.useEffect(() => {
    if (previousEnabled.current && !interactionEnabled && reason != null) {
      releaseRequest.current?.(reason);
      if (reason === 'link-unavailable' || reason === 'authority-unavailable' || reason === 'focus-lost' || reason === 'stop-requested') {
        armedChange.current?.(false);
      }
    }
    previousEnabled.current = interactionEnabled;
  }, [interactionEnabled, reason]);

  React.useEffect(() => {
    if ((previousStopState.current !== 'idle' || (!stopStateControlled && !armed)) && normalizedStopState === 'idle' && stopRequestedLocally) {
      setStopRequestedLocally(false);
    } else if (normalizedStopState !== 'idle' && stopRequestedLocally) {
      setStopRequestedLocally(false);
    }
    previousStopState.current = normalizedStopState;
  }, [armed, normalizedStopState, stopRequestedLocally, stopStateControlled]);

  React.useEffect(() => {
    if (normalizedStopState !== 'idle') {
      setStopRearmRequired(true);
    } else if (stopRearmRequired && !armed) {
      setStopRearmRequired(false);
    }
  }, [armed, normalizedStopState, stopRearmRequired]);

  React.useEffect(() => {
    const handleWindowBlur = () => setWindowActive(false);
    const handleWindowFocus = () => setWindowActive(true);
    const handleVisibility = () => setWindowActive(document.visibilityState === 'visible');
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  React.useEffect(() => () => {
    if (latestEnabled.current) releaseRequest.current?.('unmount');
  }, []);

  React.useEffect(() => {
    if (!interactionEnabled && controlsRef.current?.contains(document.activeElement)) {
      document.activeElement?.blur();
    }
  }, [interactionEnabled]);

  const setFocusState = (next) => {
    setFocused(next);
    onFocusChange?.(next);
  };

  const blockReason = interactionEnabled ? null : (guard.message || guard.title);
  const renderedControls = typeof children === 'function'
    ? children({ interactionEnabled, blockReason, focused, controlMode, stopRequestState: displayStopState })
    : children;

  const canRequestArm = linkReady && authorityGranted && !stopBlockActive;
  const stopRequestDisabled = typeof stopCallback !== 'function'
    || displayStopState === 'requesting'
    || displayStopState === 'acknowledged'
    || displayStopState === 'stopped';

  const requestStop = () => {
    if (stopRequestDisabled) return;
    setStopRequestedLocally(true);
    setStopRearmRequired(true);
    if (interactionEnabled) {
      previousEnabled.current = false;
      latestEnabled.current = false;
      releaseRequest.current?.('stop-requested');
    }
    armedChange.current?.(false);
    stopCallback?.();
  };

  return (
    <section
      aria-labelledby={titleId}
      tabIndex={focusRequired && controlMode !== 'pointer' ? 0 : undefined}
      onFocus={(event) => {
        setFocusState(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocusState(false);
        onBlur?.(event);
      }}
      style={{
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        overflow: 'hidden',
        border: 'var(--component-card-border)',
        borderRadius: 'var(--component-card-radius)',
        background: 'var(--color-semantic-background-elevated-normal)',
        boxShadow: focused && controlMode !== 'pointer'
          ? '0 0 0 4px var(--color-semantic-focus-ring)'
          : 'var(--component-card-shadow-sm)',
        fontFamily: 'var(--font-sans)',
        outline: 'none',
        ...style,
      }}
      {...rest}
    >
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)', flexWrap: 'wrap', padding: 'var(--space-4) var(--space-5)' }}>
        <div style={{ display: 'grid', gap: 'var(--space-1)', minWidth: 0, flex: '1 1 180px' }}>
          <Heading id={titleId} style={{ margin: 0, color: 'var(--color-semantic-label-strong)', fontSize: 'var(--body1-size)', lineHeight: 'var(--body1-line)', fontWeight: 'var(--fw-bold)', overflowWrap: 'anywhere' }}>{title}</Heading>
          {sessionMeta != null && (
            <span style={{ color: 'var(--color-semantic-label-neutral)', fontSize: 'var(--label1-size)', lineHeight: 'var(--label1-line)', fontWeight: 'var(--fw-semibold)', overflowWrap: 'anywhere' }}>{sessionMeta}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-3)', flex: '10 1 350px', minWidth: 0, flexWrap: 'wrap' }}>
          <div aria-label="제어 전제조건" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-2)', minWidth: 0, flexWrap: 'wrap' }}>
            <ConnectionBadge status={LINK_CONNECTION_STATUS[linkState] || 'offline'} label={LINK_LABELS[linkState]} size="sm" />
            <StatusBadge tone={statusTone(authority, 'granted')}>{AUTHORITY_LABELS[authority]}</StatusBadge>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 'var(--space-3)', borderLeft: '1px solid var(--color-semantic-line-normal-normal)' }}>
            <Button
              variant="danger"
              size="md"
              disabled={stopRequestDisabled}
              aria-label={STOP_BUTTON_LABELS[displayStopState] || stopRequestLabel}
              aria-busy={displayStopState === 'requesting' || undefined}
              aria-controls={statusId}
              onClick={requestStop}
            >
              <Icon name="circle-block" size={18} aria-hidden="true" />
              {STOP_BUTTON_LABELS[displayStopState] || stopRequestLabel}
            </Button>
          </div>
        </div>
      </header>

      <Banner
        id={statusId}
        variant="embedded"
        tone={guard.tone}
        title={guard.title}
      >
        {guard.message}
      </Banner>

      {renderedControls != null && (
        <div
          ref={controlsRef}
          aria-label="제어 입력"
          aria-disabled={!interactionEnabled}
          inert={!interactionEnabled ? true : undefined}
          data-interaction-enabled={interactionEnabled ? 'true' : 'false'}
          onClickCapture={(event) => {
            if (!interactionEnabled) {
              event.preventDefault();
              event.stopPropagation();
            }
          }}
          onKeyDownCapture={(event) => {
            if (!interactionEnabled) {
              event.preventDefault();
              event.stopPropagation();
            }
          }}
          style={{ display: 'flex', minHeight: 240, alignItems: 'center', justifyContent: 'center', padding: 'var(--space-5)', pointerEvents: interactionEnabled ? 'auto' : 'none' }}
        >
          {renderedControls}
        </div>
      )}

      <footer style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap', padding: 'var(--space-3) var(--space-5)', borderTop: '1px solid var(--color-semantic-line-normal-alternative)', background: 'var(--color-semantic-fill-normal)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-semantic-label-neutral)', fontSize: 'var(--label1-size)', lineHeight: 'var(--label1-line)', fontWeight: 'var(--fw-semibold)' }}>
          <Icon name="joystick" size={16} aria-hidden="true" />
          입력 방식 · {CONTROL_MODE_LABELS[controlMode] || controlMode}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Button
            variant={armed ? 'outlined' : 'primary'}
            color={armed ? 'assistive' : 'primary'}
            aria-pressed={armed}
            disabled={typeof onArmedChange !== 'function' || (!armed && !canRequestArm)}
            onClick={() => onArmedChange?.(!armed)}
          >
            {armed ? '수동 제어 해제' : '수동 제어 준비'}
          </Button>
          {armed && deadmanRequired && !stopBlockActive && deadmanControl != null && deadmanControl}
        </div>
      </footer>
    </section>
  );
}
