import React from 'react';
import { IconButton } from '@lk-robotics/lds-core/components/buttons/IconButton';
import { Divider } from '@lk-robotics/lds-core/components/content/Divider';
import { Icon } from '@lk-robotics/lds-core/components/icon/Icon';
import { useRovingToolbar } from '../internal/useRovingToolbar.js';

/**
 * LK ROBOTICS — HistoryToolbar
 * Undo / redo / reset controls for editors. Availability is derived from both
 * history state and a real handler so a visually enabled command is always
 * operable. Arrow keys, Home, and End move within the toolbar.
 */
export function HistoryToolbar({
  label = '편집 이력',
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onReset,
  undoKeyShortcuts,
  redoKeyShortcuts,
  size = 'sm',
  role = 'toolbar',
  tabIndex,
  onKeyDown,
  onFocusCapture,
  style,
  'aria-label': ariaLabel,
  ...rest
}) {
  const undoEnabled = canUndo && typeof onUndo === 'function';
  const redoEnabled = canRedo && typeof onRedo === 'function';
  const resetVisible = typeof onReset === 'function';
  const actions = [
    { key: 'undo', label: '실행 취소', icon: <Icon name="flip-backward" size={16} aria-hidden="true" />, enabled: undoEnabled, onClick: onUndo, shortcuts: undoKeyShortcuts },
    { key: 'redo', label: '다시 실행', icon: <span style={{ display: 'inline-flex', transform: 'scaleX(-1)' }}><Icon name="flip-backward" size={16} aria-hidden="true" /></span>, enabled: redoEnabled, onClick: onRedo, shortcuts: redoKeyShortcuts },
    ...(resetVisible ? [{ key: 'reset', label: '변경사항 초기화', icon: <Icon name="reset" size={16} aria-hidden="true" />, enabled: true, onClick: onReset }] : []),
  ];
  const enabledActions = actions.filter((action) => action.enabled);
  const preferredKey = enabledActions[0]?.key;
  const { toolbarRef, handleFocusCapture, handleKeyDown } = useRovingToolbar({
    itemSelector: '[data-lk-history-toolbar-item]',
    orientation: 'horizontal',
    preferredKey,
    onKeyDown,
    onFocusCapture,
  });

  return (
    <div
      ref={toolbarRef}
      role={role}
      aria-label={ariaLabel ?? label}
      aria-orientation={role === 'toolbar' ? 'horizontal' : undefined}
      aria-disabled={enabledActions.length === 0 || undefined}
      tabIndex={enabledActions.length === 0 ? (tabIndex ?? 0) : tabIndex}
      onKeyDown={handleKeyDown}
      onFocusCapture={handleFocusCapture}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', fontFamily: 'var(--font-sans)', ...style }}
      {...rest}
    >
      {actions.map((action, index) => (
        <React.Fragment key={action.key}>
          {action.key === 'reset' && (
            <Divider vertical style={{ minHeight: size === 'md' ? 24 : 20, marginInline: 'var(--space-1)', alignSelf: 'center' }} />
          )}
          <IconButton
            data-history-index={index}
            data-lk-history-toolbar-item=""
            data-lk-toolbar-key={action.key}
            variant="ghost"
            round={false}
            size={size}
            disabled={!action.enabled}
            onClick={action.enabled ? action.onClick : undefined}
            tabIndex={action.enabled && action.key === preferredKey ? 0 : -1}
            title={action.label}
            label={action.label}
            aria-keyshortcuts={action.shortcuts}
          >
            {action.icon}
          </IconButton>
        </React.Fragment>
      ))}
    </div>
  );
}
