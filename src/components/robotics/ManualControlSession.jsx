import React from 'react';
import { Button } from '@lk-robotics/lds-core/components/buttons/Button';
import { Card } from '@lk-robotics/lds-core/components/cards/Card';
import { StatusBadge } from '@lk-robotics/lds-core/components/content/StatusBadge';
import { EmptyState } from '@lk-robotics/lds-core/components/status/EmptyState';
import { Spinner } from '@lk-robotics/lds-core/components/status/Spinner';
import { Icon } from '@lk-robotics/lds-core/components/icon/Icon';
import { ConnectionBadge } from '@lk-robotics/lds-product/components/robotics/ConnectionBadge';
import { OverlayStatusChip } from './_OverlayStatusChip.jsx';

const LINK_LABELS = {
  ready: '연결 준비됨',
  stale: '연결 정보 오래됨',
  lost: '연결 끊김',
};

const AUTHORITY_LABELS = {
  checking: '권한 확인 중',
  granted: '권한 부여됨',
  denied: '권한 거부됨',
  revoked: '권한 없음',
};

const LINK_CONNECTION_STATUS = {
  ready: 'ready',
  stale: 'stale',
  lost: 'offline',
};

const CONTROL_MODE_LABELS = {
  pointer: '포인터',
  keyboard: '키보드',
  hybrid: '포인터 또는 키보드',
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
    icon: 'lock',
    title: '수동 제어 잠김',
    message: '수동 제어를 준비한 뒤 활성화 장치를 누르고 있는 동안만 이동할 수 있습니다.',
  },
  'deadman-released': {
    tone: 'cautionary',
    title: '연속 활성화 입력 대기',
    message: '연결된 활성화 장치를 누르고 있는 동안만 제어 명령을 보낼 수 있습니다.',
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
  message: '주행 정지 이후에는 수동 제어를 해제한 뒤 다시 준비하세요.',
};

const STOP_REQUEST_STATUS = {
  requesting: {
    tone: 'signal',
    icon: 'hourglass',
    title: '정지 요청 중',
    message: '로봇이 요청을 수신했는지 확인하고 있습니다.',
  },
  acknowledged: {
    tone: 'cautionary',
    icon: 'hourglass',
    title: '정지 확인 중',
    message: '요청은 수신됐지만 실제 정지는 아직 확인되지 않았습니다.',
  },
  stopped: {
    tone: 'positive',
    title: '정지됨',
    message: '로봇 정지가 확인되었습니다. 필요할 때 수동 제어를 다시 준비하세요.',
  },
  failed: {
    tone: 'negative',
    title: '정지 요청 실패',
    message: '로봇의 실제 상태를 확인한 뒤 다시 요청하세요.',
  },
};

/* The guard surface previously rendered every state — calm lock and failed
   stop alike — in the same quiet typography; tone existed only as an ARIA
   role. The preflight body now composes the core EmptyState, whose tone tile
   owns the family severity language (surface / foreground / glyph). The tile
   glyph still has to be named, and this map mirrors the core
   STATUS_TONE_STYLE glyphs so Robotics never invents a second tone-to-glyph
   mapping. */
const GUARD_TONE_ICONS = {
  negative: 'circle-close-fill',
  cautionary: 'triangle-exclamation-fill',
  positive: 'circle-check-fill',
  signal: 'circle-info-fill',
};

/* Preflight checklist rows. "정상은 무채색": a met step earns a quiet grey
   check; colour is reserved for the step that blocks arming. */
const CHECKLIST_GLYPHS = {
  met: { icon: 'check-thick', color: 'var(--color-semantic-label-alternative)' },
  pending: { icon: 'hourglass', color: 'var(--color-semantic-status-cautionary)' },
  failed: { icon: 'close-thick', color: 'var(--color-semantic-status-negative)' },
};

function checklistStepState(met, pending) {
  return met ? 'met' : pending ? 'pending' : 'failed';
}

const STOP_BUTTON_LABELS = {
  requesting: '정지 요청 중',
  acknowledged: '정지 확인 중',
  stopped: '정지됨',
  failed: '정지 다시 시도',
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
  controlToolbar,
  deadmanControl,
  stopRequestState,
  stopRequestMessage,
  stopRequestLabel = '주행 정지',
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
  const showControlSurface = armed && linkReady && authorityGranted && !stopBlockActive;
  /* Every "the control is up but inert" reason now speaks through one chip over
     the control area. It used to be split: focus-loss got an inserted notice bar
     (which pushed the control down every time focus moved) while a released
     enabling device was left to whatever the product happened to put in the
     footer — an ocean away from the dimmed control it explained. One anchor,
     one grammar, zero layout shift. */
  const showControlChip = showControlSurface && reason != null;
  /* Split "no handler wired" from "request already in flight". The former is a hard
     unavailable control (native `disabled`); the latter is a temporal block that must
     keep the button focusable so a keyboard operator who just pressed the stop does
     not drop focus to <body> — the same aria-disabled + click-guard pattern the DS
     Button uses for `loading`. */
  const stopHasCallback = typeof stopCallback === 'function';
  const stopLifecycleBlocked = displayStopState === 'requesting'
    || displayStopState === 'acknowledged'
    || displayStopState === 'stopped';
  const stopRequestDisabled = !stopHasCallback || stopLifecycleBlocked;
  /* In-flight states swap the block glyph for an hourglass and expose
     aria-busy while staying focusable. Button's `loading` treatment is not
     used here: it hides the label behind a spinner, and a stop control must
     keep saying "정지 요청 중" in words for as long as the request is open. */
  const stopBusy = displayStopState === 'requesting' || displayStopState === 'acknowledged';
  const guardIcon = guard.icon ?? GUARD_TONE_ICONS[guard.tone] ?? 'circle-info-fill';
  /* A released enabling device is the resting state of a hold-to-run control,
     so it stays achromatic; anything else that blocks an armed session (focus
     loss) escalates to its guard tone. */
  const chipTone = reason === 'deadman-released'
    ? 'neutral'
    : (guard.tone === 'negative' || guard.tone === 'cautionary' ? guard.tone : 'neutral');
  /* The two server-owned preconditions, as checklist rows under the preflight
     headline. The stop lifecycle replaces the checklist: those states have one
     subject (the stop request) and the rows would only dilute it. */
  const preflightChecklist = !stopGuard && !stopRearmRequired
    ? [
      {
        step: 'link',
        label: '로봇 연결',
        state: checklistStepState(linkReady, linkState === 'stale'),
        detail: LINK_LABELS[linkState] ?? LINK_LABELS.lost,
      },
      {
        step: 'authority',
        label: '제어 권한',
        state: checklistStepState(authorityGranted, authority === 'checking'),
        detail: AUTHORITY_LABELS[authority] ?? AUTHORITY_LABELS.revoked,
      },
    ]
    : null;
  const armControl = (
    <Button
      data-manual-control-arm=""
      variant={armed ? 'outlined' : 'primary'}
      color={armed ? 'assistive' : 'primary'}
      aria-pressed={armed}
      disabled={typeof onArmedChange !== 'function' || (!armed && !canRequestArm)}
      onClick={() => onArmedChange?.(!armed)}
    >
      {armed ? '수동 제어 해제' : '수동 제어 준비'}
    </Button>
  );

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
    <Card
      role="region"
      aria-labelledby={titleId}
      elevation="sm"
      padding={0}
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
        fontFamily: 'var(--font-sans)',
        outline: focused && controlMode !== 'pointer'
          ? '2px solid var(--color-semantic-focus-ring)'
          : 'none',
        outlineOffset: 2,
        ...style,
      }}
      {...rest}
    >
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap', padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-semantic-line-normal-alternative)' }}>
        <div style={{ minWidth: 0, flex: '1 1 180px' }}>
          <Heading id={titleId} style={{ margin: 0, color: 'var(--color-semantic-label-strong)', fontSize: 'var(--body1-size)', lineHeight: 'var(--body1-line)', fontWeight: 'var(--fw-bold)', overflowWrap: 'anywhere' }}>{title}</Heading>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-3)', flex: '0 1 auto', minWidth: 0, flexWrap: 'wrap' }}>
          <div aria-label="제어 전제조건" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-2)', minWidth: 0, flexWrap: 'wrap' }}>
            <ConnectionBadge status={LINK_CONNECTION_STATUS[linkState] || 'offline'} label={LINK_LABELS[linkState]} size="sm" />
            <StatusBadge tone={statusTone(authority, 'granted')}>{AUTHORITY_LABELS[authority]}</StatusBadge>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 'var(--space-3)', borderLeft: '1px solid var(--color-semantic-line-normal-normal)' }}>
            <Button
              variant="danger"
              size="md"
              disabled={!stopHasCallback}
              aria-disabled={stopLifecycleBlocked || undefined}
              aria-label={STOP_BUTTON_LABELS[displayStopState] || stopRequestLabel}
              aria-busy={stopBusy || undefined}
              aria-controls={statusId}
              onClick={requestStop}
            >
              <Icon name={stopBusy ? 'hourglass' : 'circle-block'} size={18} aria-hidden="true" />
              {STOP_BUTTON_LABELS[displayStopState] || stopRequestLabel}
            </Button>
          </div>
        </div>
      </header>

      {!showControlSurface && (
        <div
          id={statusId}
          data-manual-control-state="preflight"
          data-guard-tone={guard.tone}
          role={guard.tone === 'negative' ? 'alert' : 'status'}
          style={{
            minHeight: 300,
            display: 'grid',
            placeItems: 'center',
            padding: 'var(--space-8) var(--space-5)',
            boxSizing: 'border-box',
          }}
        >
          {/* The preflight body is the core EmptyState — the family pattern for
              "no content, here is why and what to do next". Its tone tile owns
              the severity colours, its title is a real heading one level below
              the card title, and the arm control rides its action slot. Only
              the precondition checklist is Robotics-specific, carried inside
              the description node. Padding is collapsed because the reserved
              300px guard area already centres and spaces the block — the
              default 48px would make the locked card taller than the armed
              one and shift the stop button on every transition. */}
          <EmptyState
            data-manual-control-preflight=""
            tone={guard.tone}
            headingLevel={Math.min(6, normalizedHeadingLevel + 1)}
            icon={displayStopState === 'requesting'
              ? <Spinner size={26} thickness={3} color="currentColor" aria-hidden="true" />
              : <Icon name={guardIcon} size={26} aria-hidden="true" data-guard-glyph="" />}
            title={guard.title}
            description={(guard.message == null && preflightChecklist == null) ? undefined : (
              <>
                {guard.message}
                {preflightChecklist != null && (
                  <span
                    data-manual-control-checklist=""
                    style={{
                      display: 'grid',
                      justifyItems: 'start',
                      gap: 'var(--space-2)',
                      textAlign: 'left',
                      minWidth: 0,
                      width: 'fit-content',
                      margin: guard.message != null ? 'var(--space-3) auto 0' : '0 auto',
                    }}
                  >
                    {preflightChecklist.map(({ step, label, state, detail }) => {
                      const glyph = CHECKLIST_GLYPHS[state];
                      return (
                        <span
                          key={step}
                          data-checklist-step={step}
                          data-checklist-state={state}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0, fontSize: 'var(--label1-size)', lineHeight: 'var(--label1-line)', color: 'var(--color-semantic-label-neutral)' }}
                        >
                          <Icon name={glyph.icon} size={14} aria-hidden="true" style={{ color: glyph.color, flex: 'none' }} />
                          <span style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--color-semantic-label-normal)' }}>{label}</span>
                          <span aria-hidden="true">·</span>
                          <span style={{ overflowWrap: 'anywhere' }}>{detail}</span>
                        </span>
                      );
                    })}
                  </span>
                )}
              </>
            )}
            action={!stopBlockActive ? armControl : undefined}
            style={{ padding: 0, maxWidth: 'min(100%, 380px)' }}
          />
        </div>
      )}

      {showControlSurface && (
        <>
          {controlToolbar != null && (
            <div
              data-manual-control-toolbar=""
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: 'var(--space-4) var(--space-5) 0',
              }}
            >
              {controlToolbar}
            </div>
          )}
          {renderedControls != null && (
            <div style={{ position: 'relative', minWidth: 0 }}>
              {/* Sits outside the inert subtree below so assistive tech keeps
                  reading it while the controls are switched off. */}
              {showControlChip && (
                <OverlayStatusChip
                  id={statusId}
                  data-manual-control-state="chip"
                  data-guard-tone={guard.tone}
                  tone={chipTone}
                >
                  {guard.title}
                </OverlayStatusChip>
              )}
              <div
              ref={controlsRef}
              id={!showControlChip ? statusId : undefined}
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
              style={{ display: 'flex', minHeight: controlToolbar != null ? 250 : 300, alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4) var(--space-5) var(--space-5)', pointerEvents: interactionEnabled ? 'auto' : 'none' }}
            >
              {renderedControls}
              </div>
            </div>
          )}
        </>
      )}

      <footer style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap', padding: 'var(--space-3) var(--space-5)', borderTop: '1px solid var(--color-semantic-line-normal-alternative)', background: 'var(--color-semantic-fill-normal)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0, flexWrap: 'wrap', color: 'var(--color-semantic-label-neutral)', fontSize: 'var(--label1-size)', lineHeight: 'var(--label1-line)', fontWeight: 'var(--fw-semibold)' }}>
          {sessionMeta != null && <span style={{ overflowWrap: 'anywhere' }}>{sessionMeta}</span>}
          {sessionMeta != null && <span aria-hidden="true">·</span>}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}>
            <Icon name="joystick" size={16} aria-hidden="true" />
            {CONTROL_MODE_LABELS[controlMode] || controlMode}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-2)', flexWrap: 'wrap', marginLeft: 'auto' }}>
          {showControlSurface && deadmanRequired && deadmanControl != null && deadmanControl}
          {showControlSurface && armControl}
        </div>
      </footer>
    </Card>
  );
}
