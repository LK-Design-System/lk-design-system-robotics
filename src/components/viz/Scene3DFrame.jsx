import React from 'react';
import { ViewerFrame } from './ViewerFrame.jsx';

/**
 * LK Robotics — Scene3DFrame
 * Renderer-independent 3D viewport preset built on ViewerFrame. Applications
 * provide Three.js, R3F, point-cloud, or digital-twin content as children.
 */
export function Scene3DFrame({
  children,
  title,
  badges,
  hud,
  toolbar,
  overlay,
  status,
  state,
  stateLabel,
  stateDescription,
  stateIcon,
  stateAction,
  loading = false,
  empty,
  label,
  appearance = 'dark',
  variant = 'standalone',
  style,
  ...rest
}) {
  const usesLegacyEmpty = state == null && !loading && empty != null;
  const resolvedState = state ?? (loading ? 'loading' : usesLegacyEmpty ? 'no-source' : 'ready');
  const resolvedStateLabel = stateLabel ?? (usesLegacyEmpty ? empty : undefined);
  const resolvedLabel = label
    ?? (typeof title === 'string' && title.trim() ? `${title} 3D 뷰포트` : '3D 뷰포트');

  return (
    <ViewerFrame
      {...rest}
      label={resolvedLabel}
      appearance={appearance}
      variant={variant}
      source={title}
      badges={badges}
      hud={hud}
      toolbar={toolbar}
      overlay={overlay}
      status={status}
      state={resolvedState}
      stateLabel={resolvedStateLabel}
      stateDescription={stateDescription}
      stateIcon={stateIcon}
      stateAction={stateAction}
      style={{ height: '100%', minHeight: 220, ...style }}
    >
      {children}
    </ViewerFrame>
  );
}
