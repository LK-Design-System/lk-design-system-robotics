import React from 'react';

const CONNECTION_CFG = {
  unknown: { c: 'var(--color-semantic-label-disable)', bars: 0, label: '연결 상태 알 수 없음' },
  connecting: { c: 'var(--color-semantic-primary-normal)', bars: 1, label: '연결 중' },
  connected: { c: 'var(--color-semantic-status-positive)', bars: 3, label: '연결됨' },
  degraded: { c: 'var(--color-semantic-status-cautionary)', bars: 1, label: '연결 품질 저하' },
  reconnecting: { c: 'var(--color-semantic-status-cautionary)', bars: 2, label: '재연결 중' },
  disconnected: { c: 'var(--color-semantic-label-disable)', bars: 0, label: '연결 끊김' },
  failed: { c: 'var(--color-semantic-status-negative)', bars: 0, label: '연결 실패' },
};

const LEGACY_CFG = {
  connecting: { c: 'var(--color-semantic-primary-normal)', bars: 1, label: '연결 중' },
  ready: { c: 'var(--color-semantic-primary-normal)', bars: 3, label: '연결 준비됨' },
  online: { c: 'var(--color-semantic-status-positive)', bars: 3, label: '온라인' },
  reconnecting: { c: 'var(--color-semantic-status-cautionary)', bars: 2, label: '재연결 중' },
  weak: { c: 'var(--color-semantic-status-cautionary)', bars: 1, label: '신호 약함' },
  stale: { c: 'var(--color-semantic-status-cautionary)', bars: 1, label: '데이터 지연' },
  error: { c: 'var(--color-semantic-status-negative)', bars: 0, label: '연결 오류' },
  offline: { c: 'var(--color-semantic-label-disable)', bars: 0, label: '오프라인' },
};

const LEGACY_STATE_MAP = {
  connecting: 'connecting',
  ready: 'connected',
  online: 'connected',
  reconnecting: 'reconnecting',
  weak: 'degraded',
  stale: 'degraded',
  error: 'failed',
  offline: 'disconnected',
};

/**
 * LK ROBOTICS — ConnectionBadge
 * Connection-state indicator (signal bars + label) for MQTT / rosbridge links.
 * The canonical `connectionState` axis only reports transport truth. It does
 * not infer data freshness, equipment health, command eligibility, or control
 * authority. The legacy `status` axis remains as a compatibility surface.
 * Recovery actions and orthogonal truth belong in product composition.
 */
export function ConnectionBadge({
  connectionState,
  status,
  label,
  showLabel = true,
  size = 'md',
  style,
  role,
  'aria-label': ariaLabel,
  ...rest
}) {
  React.useEffect(() => {
    if (typeof document === 'undefined' || document.getElementById('lk-conn-kf')) return;
    const el = document.createElement('style');
    el.id = 'lk-conn-kf';
    el.textContent = '@keyframes lk-conn-blink{0%,100%{opacity:1}50%{opacity:.35}}@media (prefers-reduced-motion: reduce){[data-lds-connection-motion]{animation:none!important}}';
    document.head.appendChild(el);
  }, []);
  const usesCanonicalState = connectionState != null;
  const legacyStatus = status || 'online';
  const resolvedState = usesCanonicalState
    ? (CONNECTION_CFG[connectionState] ? connectionState : 'unknown')
    : (LEGACY_STATE_MAP[legacyStatus] || 'unknown');
  const cfg = usesCanonicalState
    ? CONNECTION_CFG[resolvedState]
    : (LEGACY_CFG[legacyStatus] || CONNECTION_CFG.unknown);
  const displayLabel = label ?? cfg.label;
  const stringLabel = typeof displayLabel === 'string' ? displayLabel : undefined;
  const animated = usesCanonicalState
    ? resolvedState === 'connecting' || resolvedState === 'reconnecting'
    : legacyStatus === 'connecting' || legacyStatus === 'reconnecting' || legacyStatus === 'stale';
  const h = size === 'sm' ? 11 : 14;
  const bw = size === 'sm' ? 3 : 4;
  // failed/error and disconnected/offline both show 0 bars and differ only by
  // colour — indistinguishable in icon-only mode or under CVD. A slash over the
  // bars gives the error states a second, shape-based channel.
  const isError = usesCanonicalState ? resolvedState === 'failed' : legacyStatus === 'error';
  return (
    <span
      data-connection-state={resolvedState}
      data-status={usesCanonicalState ? resolvedState : legacyStatus}
      role={role ?? (!showLabel && (ariaLabel || stringLabel) ? 'img' : undefined)}
      aria-label={ariaLabel ?? (!showLabel ? stringLabel : undefined)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-sans)',
      fontSize: size === 'sm' ? 12 : 13, fontWeight: 'var(--fw-semibold)', color: 'var(--color-semantic-label-neutral)', ...style }} {...rest}>
      <span data-lds-connection-motion="" style={{ position: 'relative', display: 'inline-flex', alignItems: 'flex-end', gap: 2, height: h,
        animation: animated ? 'lk-conn-blink 1s var(--ease-in-out) infinite' : 'none' }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{ width: bw, height: Math.round(h * ((i + 1) / 3)), borderRadius: 1,
            background: i < cfg.bars ? cfg.c : 'var(--color-semantic-fill-strong)' }} />
        ))}
        {isError && (
          <span data-lds-connection-error-slash="" aria-hidden="true" style={{ position: 'absolute', left: -1, right: -1, top: '50%',
            height: 2, borderRadius: 1, background: cfg.c, transform: 'rotate(-45deg)', transformOrigin: 'center' }} />
        )}
      </span>
      {showLabel && <span>{displayLabel}</span>}
    </span>
  );
}
