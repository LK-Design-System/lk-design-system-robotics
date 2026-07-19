import React from 'react';
import { ToggleIcon } from '@lk-robotics/lds-core/components/buttons/ToggleIcon';
import { Tooltip } from '@lk-robotics/lds-core/components/content/Tooltip';
import { useRovingToolbar } from '../internal/useRovingToolbar.js';

/**
 * LK ROBOTICS — EditorToolbar
 * A single-select tool group for canvas editors (select / draw / erase /
 * polygon / pan). `items` are `{ value, icon, label }`; controlled via `value`
 * or uncontrolled via `defaultValue`. The active tool uses the shared selected tint.
 */
export function EditorToolbar({
  items = [],
  value,
  defaultValue,
  onChange,
  orientation = 'vertical',
  label = '편집 도구',
  disabled = false,
  disabledReason,
  tooltipPosition,
  style,
  className,
  onKeyDown,
  onFocusCapture,
  ...rest
}) {
  const controlled = value !== undefined;
  const first = items[0] && (items[0].value != null ? items[0].value : items[0]);
  const [internal, setInternal] = React.useState(defaultValue != null ? defaultValue : first);
  const cur = controlled ? value : internal;
  const activeEnabledItem = items.find((item) => {
    const itemValue = item.value != null ? item.value : item;
    return itemValue === cur && !disabled && !item.disabled;
  });
  const firstEnabledItem = items.find((item) => !disabled && !item.disabled);
  const preferredFocusItem = activeEnabledItem ?? firstEnabledItem ?? (!disabled ? items[0] : undefined);
  const preferredFocusValue = preferredFocusItem != null
    ? (preferredFocusItem.value != null ? preferredFocusItem.value : preferredFocusItem)
    : undefined;
  const { toolbarRef, handleFocusCapture, handleKeyDown } = useRovingToolbar({
    itemSelector: '[data-lk-editor-toolbar-item]',
    orientation,
    preferredKey: preferredFocusValue,
    includeAriaDisabled: true,
    onKeyDown,
    onFocusCapture,
  });

  const pick = (v, itemDisabled) => {
    if (disabled || itemDisabled) return;
    if (!controlled) setInternal(v);
    onChange && onChange(v);
  };
  const resolvedTooltipPosition = tooltipPosition ?? (orientation === 'vertical' ? 'right' : 'bottom');
  return (
    <div
      {...rest}
      ref={toolbarRef}
      className={['lk-editor-toolbar', className].filter(Boolean).join(' ')}
      role="toolbar"
      aria-label={label}
      aria-orientation={orientation}
      aria-disabled={disabled || undefined}
      aria-description={disabled && typeof disabledReason === 'string' ? disabledReason : undefined}
      data-orientation={orientation}
      onKeyDown={handleKeyDown}
      onFocusCapture={handleFocusCapture}
      style={{ display: 'inline-flex', width: 'fit-content', maxWidth: '100%', boxSizing: 'border-box', flexDirection: orientation === 'vertical' ? 'column' : 'row', gap: 'var(--space-1)', ...style }}
    >
      <style>{`
        .lk-editor-toolbar__button {
          position: relative;
          z-index: 1;
        }
        /* ToggleIcon paints its own inline colours, so the pressed override
           needs !important; the surface and outline carry selection while the
           foreground stays readable in both theme scopes. */
        .lk-editor-toolbar__button[aria-pressed="true"]:not([aria-disabled="true"]) {
          background: var(--color-semantic-primary-surface-normal) !important;
          color: var(--color-semantic-label-normal) !important;
        }
      `}</style>
      {items.map((it) => {
        const v = it.value != null ? it.value : it;
        const on = v === cur;
        const itemDisabled = disabled || !!it.disabled;
        const itemLabel = it.label || String(v);
        const itemDisabledReason = it.disabledReason ?? disabledReason;
        return (
          <Tooltip
            key={v}
            content={itemDisabled && itemDisabledReason != null ? <span style={{ display: 'grid', gap: 2 }}><span>{itemLabel}</span><span style={{ color: 'var(--color-semantic-inverse-label-alternative-soft)', fontWeight: 'var(--fw-medium)' }}>{itemDisabledReason}</span></span> : itemLabel}
            shortcut={it.shortcut}
            position={resolvedTooltipPosition}
            size="sm"
          >
            <ToggleIcon
              className="lk-editor-toolbar__button"
              label={itemLabel}
              size="sm"
              variant="plain"
              pressed={on}
              aria-disabled={itemDisabled || undefined}
              aria-keyshortcuts={it.ariaKeyShortcuts ?? (typeof it.shortcut === 'string' ? it.shortcut : undefined)}
              aria-description={itemDisabled && typeof itemDisabledReason === 'string' ? itemDisabledReason : undefined}
              data-lk-editor-toolbar-item=""
              data-lk-toolbar-key={String(v)}
              tabIndex={!disabled && v === preferredFocusValue ? 0 : -1}
              disabled={disabled}
              onChange={() => pick(v, itemDisabled)}
              style={{
                flex: '0 0 auto',
                padding: 0,
                lineHeight: 0,
              }}
            >
              <span aria-hidden="true" style={{ width: 16, height: 16, display: 'inline-grid', placeItems: 'center', flex: '0 0 auto' }}>
                {it.icon || v}
              </span>
            </ToggleIcon>
          </Tooltip>
        );
      })}
    </div>
  );
}
