import React from 'react';
import { Icon } from '@lk-robotics/lds-core/components/icon/Icon';
import { Spinner } from '@lk-robotics/lds-core/components/status/Spinner';

export const VIEWER_STATES = Object.freeze([
  'idle',
  'no-source',
  'loading',
  'connecting',
  'ready',
  'live',
  'degraded',
  'stale',
  'frozen',
  'paused',
  'unavailable',
  'disconnected',
  'no-signal',
  'error',
]);

const STATE_PRESENTATION = {
  idle: {
    label: '소스 대기 중',
    description: '표시할 소스를 연결해 주세요.',
    icon: 'video',
    tone: 'neutral',
    blocking: true,
  },
  'no-source': {
    label: '소스 없음',
    description: '표시할 소스를 선택해 주세요.',
    icon: 'video',
    tone: 'neutral',
    blocking: true,
  },
  loading: {
    label: '불러오는 중',
    description: '콘텐츠를 준비하고 있습니다.',
    busy: true,
    tone: 'primary',
    blocking: true,
  },
  connecting: {
    label: '연결 중',
    description: '소스와 연결하고 있습니다.',
    busy: true,
    tone: 'primary',
    blocking: true,
  },
  ready: {
    label: '준비됨',
    icon: 'circle-check-fill',
    tone: 'positive',
    blocking: false,
  },
  live: {
    label: '라이브',
    icon: 'circle-fill',
    tone: 'negative',
    blocking: false,
    corner: true,
  },
  degraded: {
    label: '품질 저하',
    description: '마지막 콘텐츠를 유지하며 수신 상태를 확인합니다.',
    icon: 'triangle-exclamation-fill',
    tone: 'cautionary',
    blocking: false,
    edge: true,
  },
  stale: {
    label: '데이터 지연',
    description: '마지막으로 수신한 콘텐츠를 표시합니다.',
    icon: 'clock',
    tone: 'cautionary',
    blocking: false,
    edge: true,
  },
  frozen: {
    label: '화면 멈춤',
    description: '마지막 프레임을 표시합니다.',
    icon: 'pause',
    tone: 'cautionary',
    blocking: false,
    edge: true,
  },
  paused: {
    label: '일시정지',
    description: '마지막 프레임을 표시합니다.',
    icon: 'pause',
    tone: 'neutral',
    blocking: false,
    edge: true,
  },
  unavailable: {
    label: '사용할 수 없음',
    description: '소스 상태와 접근 권한을 확인해 주세요.',
    icon: 'circle-block',
    tone: 'neutral',
    blocking: true,
  },
  disconnected: {
    label: '연결 끊김',
    description: '소스 연결을 확인해 주세요.',
    icon: 'signal',
    tone: 'negative',
    blocking: true,
  },
  'no-signal': {
    label: '신호 없음',
    description: '소스 연결과 전송 상태를 확인해 주세요.',
    icon: 'signal',
    tone: 'negative',
    blocking: true,
  },
  error: {
    label: '표시 오류',
    description: '콘텐츠를 불러오지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요.',
    icon: 'circle-close-fill',
    tone: 'negative',
    blocking: true,
  },
};

export const VIEWER_BLOCKING_STATES = Object.freeze(
  VIEWER_STATES.filter((state) => STATE_PRESENTATION[state].blocking),
);

const ASSERTIVE_BLOCKING_STATES = new Set(['disconnected', 'no-signal', 'error']);

const TONE_COLOR = {
  primary: 'var(--color-semantic-primary-normal)',
  positive: 'var(--color-semantic-status-positive)',
  cautionary: 'var(--color-semantic-status-cautionary)',
  negative: 'var(--color-semantic-status-negative)',
  neutral: 'var(--viewer-muted)',
};

function StateMark({ presentation, icon }) {
  if (presentation.busy && icon == null) {
    return (
      <Spinner
        size={20}
        thickness={2}
        color="var(--color-semantic-primary-normal)"
        role="presentation"
        aria-hidden="true"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: '0 0 auto',
        color: TONE_COLOR[presentation.tone] ?? TONE_COLOR.neutral,
      }}
    >
      {icon ?? <Icon name={presentation.icon ?? 'circle-info'} size={16} />}
    </span>
  );
}

/**
 * LK Robotics — ViewerFrame
 * Shared viewport chrome for map, 3D, and video renderers. The frame owns the
 * named region, source/HUD/tool slots, and normalized state presentation while
 * the application continues to own rendering, transport, and recovery logic.
 */
export const ViewerFrame = React.forwardRef(function ViewerFrame({
  children,
  label,
  source,
  badges,
  hud,
  toolbar,
  overlay,
  status,
  state = 'ready',
  stateLabel,
  stateDescription,
  stateIcon,
  stateAction,
  appearance = 'dark',
  variant = 'standalone',
  toolbarPlacement = 'top-right',
  style,
  tabIndex,
  onFocusCapture,
  ...rest
}, forwardedRef) {
  const rootRef = React.useRef(null);
  const blockingLayerRef = React.useRef(null);
  const lastFocusWithinRef = React.useRef(null);
  const focusInsideBlockingLayerRef = React.useRef(false);
  const returnFocusRef = React.useRef(null);
  const wasBlockingRef = React.useRef(false);
  const resolvedState = STATE_PRESENTATION[state] ? state : 'ready';
  const presentation = STATE_PRESENTATION[resolvedState];
  const blocking = presentation.blocking;
  const busy = Boolean(presentation.busy);
  const blockingStatusRole = ASSERTIVE_BLOCKING_STATES.has(resolvedState) ? 'alert' : 'status';
  const labelContent = stateLabel ?? presentation.label;
  const descriptionContent = stateDescription === undefined
    ? presentation.description
    : stateDescription;
  const topToolbar = toolbarPlacement === 'top-right' ? toolbar : null;
  const bottomToolbar = toolbarPlacement === 'bottom-right' ? toolbar : null;

  React.useImperativeHandle(forwardedRef, () => rootRef.current, []);

  React.useLayoutEffect(() => {
    if (typeof document === 'undefined') return;
    const wasBlocking = wasBlockingRef.current;
    wasBlockingRef.current = blocking;

    if (!blocking) {
      const focusNeedsRestore = document.activeElement === document.body
        || document.activeElement === document.documentElement;
      if (wasBlocking && focusInsideBlockingLayerRef.current && focusNeedsRestore) {
        const exactTarget = returnFocusRef.current;
        const exactTargetAvailable = exactTarget instanceof HTMLElement
          && rootRef.current?.contains(exactTarget)
          && !exactTarget.matches('[disabled], [aria-disabled="true"]')
          && !exactTarget.closest('[inert]');
        const restoredTarget = exactTargetAvailable
          ? exactTarget
          : rootRef.current?.querySelector(
              '[data-viewer-toolbar] [data-lk-viewer-toolbar-item]:not([disabled]):not([aria-disabled="true"])',
            ) ?? rootRef.current;
        restoredTarget?.focus?.({ preventScroll: true });
      }
      focusInsideBlockingLayerRef.current = false;
      returnFocusRef.current = null;
      return;
    }
    const focused = document.activeElement;
    const blockedRegions = rootRef.current?.querySelectorAll('[data-viewer-blocked-region]') ?? [];
    const blockedFocusTarget = Array.from(blockedRegions).reduce((target, region) => {
      if (target) return target;
      if (focused instanceof HTMLElement && region.contains(focused)) return focused;
      if (lastFocusWithinRef.current instanceof HTMLElement && region.contains(lastFocusWithinRef.current)) {
        return lastFocusWithinRef.current;
      }
      return null;
    }, null);
    const focusWasBlocked = blockedFocusTarget != null;
    if (!focusWasBlocked) return;
    returnFocusRef.current = blockedFocusTarget;

    const focusTarget = blockingLayerRef.current?.querySelector([
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',')) ?? blockingLayerRef.current;
    focusTarget?.focus?.({ preventScroll: true });
  }, [blocking, resolvedState]);

  const stateSummary = (
    <React.Fragment>
      <StateMark presentation={presentation} icon={stateIcon} />
      <span style={{ display: 'grid', gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: 'var(--caption1-size)', lineHeight: 1.35, fontWeight: 'var(--fw-bold)', color: 'var(--viewer-foreground)' }}>
          {labelContent}
        </span>
        {descriptionContent != null && (
          <span
            data-viewer-edge-description=""
            style={{
              position: 'absolute',
              width: 1,
              height: 1,
              padding: 0,
              margin: -1,
              overflow: 'hidden',
              clip: 'rect(0, 0, 0, 0)',
              whiteSpace: 'nowrap',
              border: 0,
            }}
          >
            {descriptionContent}
          </span>
        )}
      </span>
    </React.Fragment>
  );

  return (
    <div
      {...rest}
      ref={rootRef}
      role="region"
      aria-label={label}
      aria-busy={busy || undefined}
      tabIndex={tabIndex ?? -1}
      onFocusCapture={(event) => {
        lastFocusWithinRef.current = event.target;
        focusInsideBlockingLayerRef.current = Boolean(event.target.closest?.('[data-viewer-blocking-state]'));
        onFocusCapture?.(event);
      }}
      data-lds-viewer-frame=""
      data-viewer-appearance={appearance}
      data-viewer-variant={variant}
      data-viewer-state={resolvedState}
      data-viewer-blocking={blocking ? '' : undefined}
      style={{
        '--viewer-surface': appearance === 'light'
          ? 'var(--component-viewer-light-surface)'
          : 'var(--component-viewer-surface)',
        '--viewer-surface-elevated': appearance === 'light'
          ? 'var(--component-viewer-light-surface-elevated)'
          : 'var(--component-viewer-surface-elevated)',
        '--viewer-foreground': appearance === 'light'
          ? 'var(--component-viewer-light-foreground)'
          : 'var(--component-viewer-foreground)',
        '--viewer-muted': appearance === 'light'
          ? 'var(--component-viewer-light-muted)'
          : 'var(--component-viewer-muted)',
        '--viewer-border': appearance === 'light'
          ? 'var(--component-viewer-light-border)'
          : 'var(--component-viewer-border)',
        // Appearance-aware state/accent tones for a true dark control-room HUD.
        // Light keeps the semantic tokens verbatim (no light-theme change); dark
        // lifts each tone toward white, which RAISES luminance on the dark
        // viewer surface and therefore only improves non-text contrast (never
        // drops it). Consumers reference these with a semantic fallback so any
        // surface that has not opted in is unaffected.
        '--viewer-accent': appearance === 'light'
          ? 'var(--color-semantic-primary-normal)'
          : 'color-mix(in srgb, var(--color-semantic-primary-normal), white 28%)',
        '--viewer-danger': appearance === 'light'
          ? 'var(--color-semantic-status-negative-foreground)'
          : 'color-mix(in srgb, var(--color-semantic-status-negative-foreground), white 22%)',
        '--viewer-warning': appearance === 'light'
          ? 'var(--color-semantic-status-cautionary-foreground)'
          : 'color-mix(in srgb, var(--color-semantic-status-cautionary-foreground), white 20%)',
        '--viewer-positive': appearance === 'light'
          ? 'var(--color-semantic-status-positive-foreground)'
          : 'color-mix(in srgb, var(--color-semantic-status-positive-foreground), white 22%)',
        position: 'relative',
        isolation: 'isolate',
        width: '100%',
        overflow: 'hidden',
        boxSizing: 'border-box',
        // variant="embedded" drops the frame's own perimeter so a parent
        // surface (CanvasEditorShell, Card) owns one continuous outline; every
        // viewport role — chrome, state model, HUD/toolbar, a11y region — is
        // otherwise unchanged.
        border: variant === 'embedded' ? 0 : '1px solid var(--viewer-border)',
        borderRadius: variant === 'embedded' ? 0 : 'var(--radius-lg)',
        background: 'var(--viewer-surface)',
        color: 'var(--viewer-foreground)',
        fontFamily: 'var(--font-sans)',
        containerType: 'inline-size',
        ...style,
      }}
    >
      <style>
        {`@container (max-width: 240px) {
          [data-viewer-blocking-state] {
            padding: 8px !important;
          }
          [data-viewer-blocking-body],
          [data-viewer-blocking-live] {
            gap: 4px !important;
          }
          [data-viewer-blocking-icon] {
            display: none !important;
          }
          [data-viewer-blocking-description] {
            position: absolute !important;
            width: 1px !important;
            height: 1px !important;
            padding: 0 !important;
            margin: -1px !important;
            overflow: hidden !important;
            clip: rect(0, 0, 0, 0) !important;
            white-space: nowrap !important;
            border: 0 !important;
          }
          [data-viewer-blocking-action] {
            margin-top: 0 !important;
          }
        }`}
      </style>
      <div
        data-viewer-content=""
        data-viewer-blocked-region=""
        inert={blocking ? true : undefined}
        aria-hidden={blocking || undefined}
        style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}
      >
        {children}
        {overlay != null && (
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {overlay}
          </div>
        )}
      </div>

      {(source != null || badges != null || hud != null || topToolbar != null || presentation.corner) && (
        <React.Fragment>
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              zIndex: 1,
              inset: '0 0 auto',
              height: 82,
              pointerEvents: 'none',
              background: 'linear-gradient(180deg, var(--viewer-surface) 0%, transparent 100%)',
            }}
          />
          <div
            data-viewer-topbar=""
            inert={blocking ? true : undefined}
            aria-hidden={blocking || undefined}
            style={{
              position: 'absolute',
              zIndex: 2,
              inset: '0 0 auto',
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto',
              alignItems: 'start',
              gap: 8,
              padding: 12,
              pointerEvents: 'none',
            }}
          >
            <div style={{ display: 'grid', gap: 7, minWidth: 0, justifyItems: 'start' }}>
              {(source != null || badges != null || presentation.corner) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, maxWidth: '100%' }}>
                  {source != null && (
                    <span
                      data-viewer-source=""
                      style={{
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: 'var(--viewer-foreground)',
                        fontSize: 'var(--caption1-size)',
                        lineHeight: 1.35,
                        fontWeight: 'var(--fw-bold)',
                      }}
                    >
                      {source}
                    </span>
                  )}
                  {presentation.corner && (
                    <span
                      role="status"
                      aria-live="polite"
                      aria-atomic="true"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        flex: '0 0 auto',
                        height: 22,
                        padding: '0 7px',
                        boxSizing: 'border-box',
                        border: '1px solid var(--viewer-border)',
                        borderRadius: 'var(--radius-pill)',
                        background: 'var(--viewer-surface-elevated)',
                        color: 'var(--viewer-foreground)',
                        fontSize: 'var(--caption2-size)',
                        fontWeight: 'var(--fw-semibold)',
                      }}
                    >
                      <StateMark presentation={presentation} icon={stateIcon} />
                      {labelContent}
                    </span>
                  )}
                  {badges}
                </div>
              )}
              {hud != null && (
                <div data-viewer-hud="" style={{ minWidth: 0, maxWidth: '100%', color: 'var(--viewer-foreground)' }}>
                  {hud}
                </div>
              )}
            </div>
            {topToolbar != null && (
              <div
                data-viewer-toolbar=""
                data-viewer-blocked-region=""
                inert={blocking ? true : undefined}
                aria-hidden={blocking || undefined}
                style={{ pointerEvents: blocking ? 'none' : 'auto' }}
              >
                {topToolbar}
              </div>
            )}
          </div>
        </React.Fragment>
      )}

      {bottomToolbar != null && (
        <div
          data-viewer-toolbar=""
          data-viewer-blocked-region=""
          inert={blocking ? true : undefined}
          aria-hidden={blocking || undefined}
          style={{
            position: 'absolute',
            zIndex: 3,
            right: 12,
            bottom: presentation.edge ? 56 : 12,
            pointerEvents: blocking ? 'none' : 'auto',
          }}
        >
          {bottomToolbar}
        </div>
      )}

      {!blocking && !presentation.edge && status != null && (
        <div
          data-viewer-status=""
          style={{
            position: 'absolute',
            zIndex: 2,
            left: 12,
            bottom: 12,
            display: 'inline-flex',
            alignItems: 'center',
            maxWidth: 'calc(100% - 24px)',
            minHeight: 24,
            boxSizing: 'border-box',
            padding: '4px 9px',
            border: '1px solid var(--viewer-border)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--viewer-surface-elevated)',
            color: 'var(--viewer-muted)',
            fontSize: 'var(--caption2-size)',
            lineHeight: 1.35,
            fontWeight: 'var(--fw-semibold)',
            fontVariantNumeric: 'tabular-nums',
            overflowWrap: 'anywhere',
          }}
        >
          {status}
        </div>
      )}

      {!blocking && presentation.edge && (
        <div
          data-viewer-edge-state=""
          style={{
            position: 'absolute',
            zIndex: 3,
            inset: 'auto 0 0',
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'nowrap',
            gap: '7px 10px',
            minHeight: 44,
            padding: '8px 12px',
            boxSizing: 'border-box',
            borderTop: '1px solid var(--viewer-border)',
            background: 'var(--viewer-surface-elevated)',
            overflow: 'hidden',
          }}
        >
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 auto', minWidth: 0, overflow: 'hidden' }}
          >
            {stateSummary}
          </div>
          {status != null && (
            <span
              data-viewer-edge-metadata=""
              style={{
                flex: '0 1 auto',
                minWidth: 0,
                maxWidth: '45%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: 'var(--viewer-muted)',
                fontSize: 'var(--caption2-size)',
                fontWeight: 'var(--fw-semibold)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {status}
            </span>
          )}
          {stateAction != null && <div style={{ flex: '0 0 auto' }}>{stateAction}</div>}
        </div>
      )}

      {blocking && (
        <div
          ref={blockingLayerRef}
          role="group"
          aria-label={typeof labelContent === 'string' ? labelContent : undefined}
          tabIndex={-1}
          data-viewer-blocking-state=""
          style={{
            position: 'absolute',
            zIndex: 4,
            inset: 0,
            display: 'grid',
            gridTemplateRows: source != null ? 'auto minmax(0, 1fr)' : 'minmax(0, 1fr)',
            alignItems: 'stretch',
            padding: 12,
            boxSizing: 'border-box',
            background: 'linear-gradient(180deg, var(--viewer-surface-elevated), var(--viewer-surface))',
            textAlign: 'center',
          }}
        >
          {source != null && (
            <div
              data-viewer-blocking-source=""
              style={{
                alignSelf: 'start',
                justifySelf: 'stretch',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: 'var(--viewer-foreground)',
                fontSize: 'var(--caption1-size)',
                lineHeight: 1.35,
                fontWeight: 'var(--fw-bold)',
                textAlign: 'left',
              }}
            >
              {source}
            </div>
          )}
          <div
            data-viewer-blocking-body=""
            style={{
              alignSelf: 'center',
              justifySelf: 'center',
              display: 'grid',
              justifyItems: 'center',
              gap: 10,
              width: 'min(100%, 360px)',
              minHeight: 0,
            }}
          >
            <div
              data-viewer-blocking-live=""
              role={blockingStatusRole}
              aria-live={blockingStatusRole === 'alert' ? 'assertive' : 'polite'}
              aria-atomic="true"
              style={{ display: 'grid', justifyItems: 'center', gap: 10 }}
            >
              <div data-viewer-blocking-icon="" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 24 }}>
                <StateMark presentation={presentation} icon={stateIcon} />
              </div>
              <div style={{ display: 'grid', justifyItems: 'center', gap: 4 }}>
                <strong style={{ color: 'var(--viewer-foreground)', fontSize: 'var(--label1-size)', lineHeight: 1.4 }}>
                  {labelContent}
                </strong>
                {descriptionContent != null && (
                  <span data-viewer-blocking-description="" style={{ color: 'var(--viewer-muted)', fontSize: 'var(--caption1-size)', lineHeight: 1.55, overflowWrap: 'anywhere' }}>
                    {descriptionContent}
                  </span>
                )}
              </div>
            </div>
            {stateAction != null && <div data-viewer-blocking-action="" style={{ marginTop: 4 }}>{stateAction}</div>}
          </div>
        </div>
      )}
    </div>
  );
});

ViewerFrame.displayName = 'ViewerFrame';
