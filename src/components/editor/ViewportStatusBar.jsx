import React from 'react';
import { StatusBadge } from '@lk-robotics/lds-core/components/content/StatusBadge';
import {
  getUnitSeparator,
  isAttachedUnit,
  normalizeUnit,
  normalizeValueText,
} from '../internal/unit-format.js';

const STATUS_TONE = {
  negative: { badge: 'negative', label: '위험' },
  cautionary: { badge: 'cautionary', label: '주의' },
  danger: { badge: 'negative', label: '위험' },
  warning: { badge: 'cautionary', label: '주의' },
  positive: { badge: 'positive', label: '정상' },
  signal: { badge: 'signal', label: '활성' },
};

const PRIORITY_ORDER = { high: 0, normal: 1, low: 2 };

function numericStyle(mono) {
  return {
    fontVariantNumeric: 'tabular-nums',
    fontFamily: mono ? 'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace)' : 'inherit',
  };
}

function StatusValue({ item }) {
  const renderedValue = normalizeValueText(item.value);
  const normalizedUnit = normalizeUnit(item.unit);
  const unitSeparator = getUnitSeparator(normalizedUnit);
  const attachedUnit = isAttachedUnit(normalizedUnit);
  const lockup = (
    <span
      data-viewport-status-value=""
      data-unit-attachment={normalizedUnit === '' ? 'none' : attachedUnit ? 'attached' : 'spaced'}
      style={{ display: 'inline-block', minWidth: 0, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...numericStyle(item.mono) }}
    >
      <span>{renderedValue}</span>
      {normalizedUnit !== '' && <span>{unitSeparator}{normalizedUnit}</span>}
    </span>
  );

  if (item.tone != null && item.tone !== 'default') {
    const tone = STATUS_TONE[item.tone] ?? { badge: 'offline', label: '상태' };
    return (
      <StatusBadge tone={tone.badge} style={{ minWidth: 0, maxWidth: '100%', overflow: 'hidden', flexShrink: 1 }}>
        {lockup}
        <span style={{ whiteSpace: 'nowrap' }}>· {item.toneLabel ?? tone.label}</span>
      </StatusBadge>
    );
  }

  return (
    <strong
      style={{
        display: 'inline-block',
        minWidth: 0,
        maxWidth: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        color: 'var(--color-semantic-label-strong)',
        fontWeight: 'var(--fw-bold)',
      }}
    >
      {lockup}
    </strong>
  );
}

function PersistentItem({ item }) {
  const priority = item.priority ?? 'normal';
  const shrink = priority === 'high' ? 0 : priority === 'low' ? 2 : 1;

  return (
    <span
      title={item.title}
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 'var(--space-1)',
        flex: `0 ${shrink} auto`,
        minWidth: priority === 'high' ? 'max-content' : 0,
        maxWidth: '100%',
        overflow: 'hidden',
        color: 'var(--color-semantic-label-neutral)',
        fontSize: 'var(--caption1-size)',
        lineHeight: 'var(--caption1-line)',
        fontWeight: 'var(--fw-medium)',
        letterSpacing: 0,
      }}
    >
      <span style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>{item.label}</span>
      <StatusValue item={item} />
    </span>
  );
}

/**
 * LK ROBOTICS — ViewportStatusBar
 * One-line passive readouts for a specific 2D/3D viewport. Persistent values
 * are not a live region; an optional transient message receives polite status
 * semantics so high-frequency cursor/camera updates are not announced.
 */
export function ViewportStatusBar({
  label = '뷰포트 상태',
  items = [],
  message,
  messageTone = 'default',
  messageToneLabel,
  children,
  style,
  'aria-label': ariaLabel,
  ...rest
}) {
  const orderedItems = items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const priorityDifference = (PRIORITY_ORDER[a.item.priority ?? 'normal'] ?? 1)
        - (PRIORITY_ORDER[b.item.priority ?? 'normal'] ?? 1);
      return priorityDifference || a.index - b.index;
    });
  const messageToneConfig = STATUS_TONE[messageTone];

  return (
    <div
      {...rest}
      role="group"
      aria-label={ariaLabel ?? label}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-4)',
        minWidth: 0,
        width: '100%',
        overflow: 'hidden',
        flexWrap: 'nowrap',
        whiteSpace: 'nowrap',
        fontFamily: 'var(--font-sans)',
        ...style,
      }}
    >
      {message != null && (
        <span
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{ display: 'inline-flex', alignItems: 'center', minWidth: 0, maxWidth: 'min(46%, 420px)', overflow: 'hidden', flex: '0 1 auto' }}
        >
          {messageToneConfig ? (
            <StatusBadge tone={messageToneConfig.badge} style={{ minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}>
              <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{message}</span>
              <span style={{ whiteSpace: 'nowrap' }}>· {messageToneLabel ?? messageToneConfig.label}</span>
            </StatusBadge>
          ) : (
            <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--color-semantic-label-strong)', fontSize: 'var(--caption1-size)', lineHeight: 'var(--caption1-line)', fontWeight: 'var(--fw-semibold)' }}>
              {message}
            </span>
          )}
        </span>
      )}

      {orderedItems.map(({ item, index }) => (
        <PersistentItem key={item.key ?? `${String(item.label)}-${index}`} item={item} />
      ))}

      {children != null && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0, overflow: 'hidden', marginLeft: 'auto', flex: '0 1 auto' }}>
          {children}
        </span>
      )}
    </div>
  );
}
