/**
 * LK ROBOTICS — viewer-overlay treatment shared by manual controls that float
 * on a viewer surface (video, dark map): DirectionalPad and Joystick.
 *
 * The scrim is translucent (72%) plus backdrop blur rather than near-opaque:
 * an over-video control should keep the footage readable through itself, and
 * the blur — not the opacity — is what carries ink legibility over busy frames.
 * The fallback tone is static-black, not a themed surface: an overlay sits on
 * footage, so it must stay a dark scrim with light ink even on a light page.
 * ViewerToolbar (pinned lds-product) uses the same family at 94%; if these two
 * ever share one frame and the difference reads as a mistake, unify there.
 */
export const VIEWER_OVERLAY = {
  surface: 'color-mix(in srgb, var(--viewer-surface-elevated, var(--color-semantic-static-black)) 72%, transparent)',
  border: '1px solid color-mix(in srgb, var(--color-semantic-static-white) 20%, transparent)',
  shadow: '0 2px 8px color-mix(in srgb, var(--color-semantic-static-black) 24%, transparent)',
  blur: 'blur(8px)',
  ink: 'var(--color-semantic-static-white)',
  inkMuted: 'color-mix(in srgb, var(--color-semantic-static-white) 76%, transparent)',
  hairline: 'color-mix(in srgb, var(--color-semantic-static-white) 28%, transparent)',
  /** Text outside a scrim sits on raw footage; the shadow is its legibility floor. */
  textShadow: '0 1px 2px color-mix(in srgb, var(--color-semantic-static-black) 60%, transparent)',
};
