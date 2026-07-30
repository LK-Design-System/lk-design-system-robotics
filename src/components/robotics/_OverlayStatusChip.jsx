import React from 'react';
import { Icon } from '@lk-robotics/lds-core/components/icon/Icon';

/**
 * LK ROBOTICS — surface-anchored, non-blocking status chip.
 *
 * The problem it solves is layout invariance, not decoration. A control surface
 * sometimes has to say why it is inert ("enabling device released", "control
 * focus lost") while the operator is mid-interaction. The house block notices
 * (Banner / Callout) sit in flow, so inserting one pushes the control down —
 * unacceptable when the state toggles several times a second with every press
 * and release of an enabling device, and unacceptable over a viewer frame whose
 * geometry is the content. So this chip is absolutely positioned by its caller,
 * takes no pointer events, and never participates in layout.
 *
 * It is deliberately quiet. A released enabling device is the resting state of
 * a hold-to-run control, not a fault, so `neutral` carries no status colour;
 * cautionary/negative exist for the cases that genuinely escalate, and they
 * borrow the house glyph vocabulary rather than inventing a second one.
 *
 * INTERNAL. Not exported from src/index.js: the pattern is proposed upstream
 * (docs/OVERLAY_STATUS_CHIP.md → main LDS Core/Status) and this module is the
 * evidence, not the public API. When core ships it, delete this file and swap
 * the import — no consumer breakage, which is the whole reason it starts here.
 *
 * Deliberately light-surface only. The obvious sibling — a VIEWER_OVERLAY
 * scrim variant for chips over dark footage, matching DirectionalPad and
 * Joystick's `appearance="on-dark"` — has no consumer yet, and shipping an
 * unexercised branch is how speculative API rots. It is recorded as the
 * extension point in the proposal instead.
 */

/* Mirrors the house STATUS_TONE_STYLE glyphs so the chip never becomes a second
   tone-to-glyph mapping. Neutral uses the outline info glyph (the house's own
   `offline` tone glyph) and inherits label colour — no status paint at rest. */
const CHIP_TONES = {
  neutral: { icon: 'circle-info', color: null },
  cautionary: { icon: 'triangle-exclamation-fill', color: 'var(--color-semantic-status-cautionary)' },
  negative: { icon: 'circle-close-fill', color: 'var(--color-semantic-status-negative)' },
};

export function OverlayStatusChip({
  tone = 'neutral',
  icon,
  children,
  style,
  ...rest
}) {
  const toneVisual = CHIP_TONES[tone] ?? CHIP_TONES.neutral;
  const glyph = icon ?? toneVisual.icon;

  return (
    <span
      data-overlay-status-chip=""
      data-tone={tone}
      role="status"
      style={{
        position: 'absolute',
        top: 'var(--space-4)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        maxWidth: 'calc(100% - var(--space-6))',
        padding: 'var(--space-1) var(--space-3)',
        borderRadius: 999,
        boxSizing: 'border-box',
        background: 'var(--color-semantic-background-elevated-normal)',
        border: '1px solid var(--color-semantic-line-normal-alternative)',
        boxShadow: 'var(--shadow-sm)',
        color: 'var(--color-semantic-label-neutral)',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--label1-size)',
        lineHeight: 'var(--label1-line)',
        /* Never a pointer target: the chip explains a control, it is not one,
           and it must not steal the press that re-enables that control. */
        pointerEvents: 'none',
        ...style,
      }}
      {...rest}
    >
      {glyph != null && (
        <Icon
          name={glyph}
          size={14}
          aria-hidden="true"
          style={{ color: toneVisual.color ?? undefined, flex: 'none' }}
        />
      )}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
        {children}
      </span>
    </span>
  );
}
