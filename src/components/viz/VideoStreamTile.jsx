import React from 'react';
import { ViewerFrame } from './ViewerFrame.jsx';

/**
 * LK Robotics — VideoStreamTile
 * Video-source preset built on ViewerFrame. Applications provide <video>,
 * WebRTC, iframe, or image output and own playback/transport behavior.
 */
export function VideoStreamTile({
  children,
  label,
  ariaLabel,
  status,
  state,
  aspectRatio = '16 / 9',
  badges,
  hud,
  toolbar,
  overlay,
  metadata,
  stateLabel,
  stateDescription,
  stateIcon,
  stateAction,
  variant = 'standalone',
  style,
  ...rest
}) {
  const resolvedState = state ?? status ?? 'idle';
  const resolvedAriaLabel = ariaLabel
    ?? (typeof label === 'string' && label.trim() ? `${label} 영상 스트림` : '영상 스트림');

  return (
    <ViewerFrame
      {...rest}
      label={resolvedAriaLabel}
      source={label}
      variant={variant}
      badges={badges}
      hud={hud}
      toolbar={toolbar}
      overlay={overlay}
      status={metadata}
      state={resolvedState}
      stateLabel={stateLabel}
      stateDescription={stateDescription}
      stateIcon={stateIcon}
      stateAction={stateAction}
      style={{ aspectRatio, ...style }}
    >
      {children}
    </ViewerFrame>
  );
}
