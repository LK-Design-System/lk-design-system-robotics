import * as React from 'react';
import type { ViewerState } from './ViewerFrame';

export interface VideoStreamTileProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Actual video, WebRTC, iframe, or image renderer output. */
  children?: React.ReactNode;
  /** Visible camera or media-source identity. */
  label?: React.ReactNode;
  /** Accessible region name. Derived from a string label when omitted. */
  ariaLabel?: string;
  /** Normalized stream state. Prefer `state` in new code. @default "idle" */
  status?: ViewerState;
  /** Normalized stream state. Takes precedence over the compatibility `status` prop. */
  state?: ViewerState;
  /** CSS aspect-ratio value. @default "16 / 9" */
  aspectRatio?: string;
  badges?: React.ReactNode;
  /** Compact passive diagnostics; keep the default HUD to essential values. */
  hud?: React.ReactNode;
  /** Viewport-local mute, captions, snapshot, or fullscreen controls. */
  toolbar?: React.ReactNode;
  /** Non-interactive video overlay. */
  overlay?: React.ReactNode;
  /** Passive stream metadata such as resolution, FPS, or freshness. */
  metadata?: React.ReactNode;
  stateLabel?: React.ReactNode;
  stateDescription?: React.ReactNode;
  stateIcon?: React.ReactNode;
  stateAction?: React.ReactNode;
  /** Perimeter ownership. "embedded" drops the tile's own border and radius so a parent surface owns one continuous outline. @default "standalone" */
  variant?: 'standalone' | 'embedded';
}

/** Video-source preset built on ViewerFrame. Transport and playback remain application-owned. */
export function VideoStreamTile(props: VideoStreamTileProps): React.JSX.Element;
