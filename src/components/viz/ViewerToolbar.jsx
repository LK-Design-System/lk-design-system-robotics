import React from 'react';
import { IconButton } from '@lk-robotics/lds-core/components/buttons/IconButton';
import { ToggleIcon } from '@lk-robotics/lds-core/components/buttons/ToggleIcon';
import { useRovingToolbar } from '../internal/useRovingToolbar.js';

const ViewerToolbarAppearanceContext = React.createContext('minimal');

const TOOLBAR_APPEARANCES = {
  surface: {
    gap: 2,
    padding: 4,
    background: 'var(--viewer-surface-elevated, var(--color-semantic-background-elevated-normal))',
    border: '1px solid var(--viewer-border, var(--color-semantic-line-normal-normal))',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-sm)',
  },
  minimal: {
    gap: 'var(--space-1)',
    padding: 0,
    background: 'transparent',
    border: 'none',
    borderRadius: 0,
    boxShadow: 'none',
  },
  'on-dark': {
    gap: 'var(--space-1)',
    padding: 0,
    background: 'transparent',
    border: 'none',
    borderRadius: 0,
    boxShadow: 'none',
  },
};

/**
 * LK ROBOTICS — ViewerToolbar
 * Viewport-local command/toggle group with one roving Tab stop.
 */
export function ViewerToolbar({
  children,
  orientation = 'vertical',
  appearance = 'minimal',
  label = '뷰어 컨트롤',
  style,
  onKeyDown,
  onFocusCapture,
  ...rootProps
}) {
  const resolvedAppearance = TOOLBAR_APPEARANCES[appearance] ? appearance : 'minimal';
  const { toolbarRef, handleFocusCapture, handleKeyDown } = useRovingToolbar({
    itemSelector: '[data-lk-viewer-toolbar-item]',
    orientation,
    stopPropagation: true,
    onKeyDown,
    onFocusCapture,
  });

  return (
    <ViewerToolbarAppearanceContext.Provider value={resolvedAppearance}>
      <div
        {...rootProps}
        ref={toolbarRef}
        role="toolbar"
        aria-label={label}
        aria-orientation={orientation}
        onKeyDown={handleKeyDown}
        onFocusCapture={handleFocusCapture}
        style={{
          display: 'inline-flex',
          width: 'fit-content',
          maxWidth: '100%',
          boxSizing: 'border-box',
          flexDirection: orientation === 'vertical' ? 'column' : 'row',
          alignItems: 'center',
          ...TOOLBAR_APPEARANCES[resolvedAppearance],
          ...style,
        }}
      >
        {children}
      </div>
    </ViewerToolbarAppearanceContext.Provider>
  );
}

/** A command or persistent toggle inside ViewerToolbar. */
export function ViewerToolbarButton({
  children,
  kind,
  pressed,
  defaultPressed = false,
  onPressedChange,
  active,
  label,
  style,
  disabled = false,
  type = 'button',
  tabIndex,
  className,
  onClick,
  onMouseEnter,
  onMouseLeave,
  ...buttonProps
}) {
  const appearance = React.useContext(ViewerToolbarAppearanceContext);
  const inferredToggle = pressed !== undefined || active !== undefined;
  const resolvedKind = kind ?? (inferredToggle ? 'toggle' : 'command');
  const commonProps = {
    ...buttonProps,
    type,
    disabled,
    label,
    title: label,
    size: 'sm',
    tabIndex: tabIndex ?? 0,
    'data-lk-viewer-toolbar-item': '',
    'data-lk-toolbar-key': buttonProps['data-lk-toolbar-key'] ?? label,
    className: ['lk-viewer-toolbar__button', className].filter(Boolean).join(' '),
    onClick,
    onMouseEnter,
    onMouseLeave,
    style: { flex: '0 0 auto', padding: 0, ...style },
  };
  const icon = (
    <span aria-hidden="true" style={{ width: 16, height: 16, display: 'inline-grid', placeItems: 'center', flex: '0 0 auto' }}>
      {children}
    </span>
  );

  if (resolvedKind === 'toggle') {
    const controlledPressed = pressed ?? active;
    return (
      <ToggleIcon
        {...commonProps}
        variant={appearance === 'surface' ? 'plain' : appearance === 'on-dark' ? 'on-dark' : 'default'}
        pressed={controlledPressed}
        defaultPressed={defaultPressed}
        onChange={onPressedChange}
      >
        {icon}
      </ToggleIcon>
    );
  }

  return (
    <IconButton
      {...commonProps}
      round={false}
      variant={appearance === 'surface' ? 'plain' : appearance === 'on-dark' ? 'on-dark' : 'ghost'}
    >
      {icon}
    </IconButton>
  );
}
