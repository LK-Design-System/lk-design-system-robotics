import React from 'react';
import { ActionArea } from '@lk-robotics/lds-core/components/buttons/ActionArea';
import { IconButton } from '@lk-robotics/lds-core/components/buttons/IconButton';
import { StatusBadge } from '@lk-robotics/lds-core/components/content/StatusBadge';
import { Tag } from '@lk-robotics/lds-core/components/feedback/Tag';
import { Icon } from '@lk-robotics/lds-core/components/icon/Icon';
import {
  getUnitSeparator,
  isAttachedUnit,
  normalizeUnit,
  normalizeValueText,
} from '../internal/unit-format.js';

function displayScalarValue(value, mixed) {
  if (mixed || value == null) return '—';
  const normalizedValue = normalizeValueText(value);
  return normalizedValue === '' ? '—' : normalizedValue;
}

function displayValueNode(value, mixed) {
  if (mixed || value == null || value === '') return '—';
  if (typeof value === 'boolean') return String(value);
  return value;
}

function FieldValue({ field }) {
  const toneColor = {
    cautionary: 'var(--color-semantic-status-cautionary-text)',
    negative: 'var(--color-semantic-status-negative-text)',
    warning: 'var(--color-semantic-status-cautionary-text)',
    danger: 'var(--color-semantic-status-negative-text)',
  }[field.tone] || (field.mixed ? 'var(--color-semantic-label-neutral)' : 'var(--color-semantic-label-strong)');
  const align = field.align ?? (typeof field.value === 'number' ? 'right' : 'left');
  const renderedValue = displayScalarValue(field.value, field.mixed);
  const normalizedUnit = field.mixed ? '' : normalizeUnit(field.unit);
  const unitSeparator = getUnitSeparator(normalizedUnit);
  const attachedUnit = isAttachedUnit(normalizedUnit);

  return (
    <span
      data-selection-inspector-value=""
      data-unit-attachment={normalizedUnit === '' ? 'none' : attachedUnit ? 'attached' : 'spaced'}
      style={{
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        color: toneColor,
        fontSize: 'var(--label2-size)',
        lineHeight: 'var(--label2-line)',
        fontWeight: field.mixed ? 'var(--fw-medium)' : 'var(--fw-semibold)',
        letterSpacing: 0,
        textAlign: align,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <span>{renderedValue}</span>
      {normalizedUnit !== '' && (
        <span style={{ color: 'var(--color-semantic-label-neutral)', fontWeight: 'var(--fw-medium)' }}>
          {unitSeparator}{normalizedUnit}
        </span>
      )}
    </span>
  );
}

function InspectorFields({ fields = [] }) {
  return (
    <div>
      {fields.map((field, index) => (
        <div
          key={`${field.label}-${index}`}
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(88px, 0.8fr) minmax(0, 1.2fr)',
            alignItems: 'center',
            gap: 'var(--space-3)',
            minHeight: 'var(--control-h-md)',
            padding: 'var(--space-2) 0',
            borderBottom: '1px solid var(--color-semantic-line-normal-alternative)',
            boxSizing: 'border-box',
          }}
        >
          <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-semantic-label-neutral)', fontSize: 'var(--label2-size)', lineHeight: 'var(--label2-line)', fontWeight: 'var(--fw-medium)', letterSpacing: 0 }}>
            {field.label}
          </span>
          {field.valueNode != null
            ? displayValueNode(field.valueNode, field.mixed)
            : <FieldValue field={field} />}
        </div>
      ))}
    </div>
  );
}

function InspectorSection({ section }) {
  const collapsible = section.collapsible !== false && section.title != null;
  const [expanded, setExpanded] = React.useState(section.defaultExpanded !== false);
  const contentId = React.useId();
  const content = (
    <div id={contentId} hidden={collapsible && !expanded}>
      <InspectorFields fields={section.fields} />
      {section.children}
    </div>
  );

  return (
    <section style={{ minWidth: 0, borderTop: '1px solid var(--color-semantic-line-normal-alternative)' }}>
      {section.title != null && (
        collapsible ? (
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={contentId}
            onClick={() => setExpanded((value) => !value)}
            style={{ width: '100%', minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)', padding: 0, border: 0, background: 'transparent', color: 'var(--color-semantic-label-strong)', fontFamily: 'var(--font-sans)', cursor: 'pointer', textAlign: 'left' }}
          >
            <span style={{ fontSize: 'var(--label2-size)', lineHeight: 'var(--label2-line)', fontWeight: 'var(--fw-bold)' }}>{section.title}</span>
            <Icon name={expanded ? 'chevron-up-small' : 'chevron-down-small'} size={16} aria-hidden="true" />
          </button>
        ) : (
          <h4 style={{ minHeight: 40, display: 'flex', alignItems: 'center', margin: 0, fontSize: 'var(--label2-size)', lineHeight: 'var(--label2-line)', fontWeight: 'var(--fw-bold)', color: 'var(--color-semantic-label-strong)' }}>
            {section.title}
          </h4>
        )
      )}
      {content}
    </section>
  );
}

/**
 * LK ROBOTICS - SelectionInspector
 * Selection-bound properties region for map, scene, annotation, and robotics
 * editor objects. The fixed identity header stays visible while sections scroll.
 */
export function SelectionInspector({
  item,
  selectionCount,
  title = '선택 객체',
  emptyLabel = '선택한 객체가 없습니다.',
  sections = [],
  actions,
  onClearSelection,
  clearSelectionLabel = '선택 해제',
  clearSelectionAriaLabel = '모든 선택 해제',
  children,
  style,
  ...rest
}) {
  const hasItem = item != null;
  const count = selectionCount ?? (hasItem ? 1 : 0);
  const canClearSelection = hasItem && typeof onClearSelection === 'function';
  const selectionName = count > 1 ? `${count}개 객체 선택` : item?.label;

  return (
    <section
      aria-label={typeof title === 'string' ? title : '선택 객체 속성'}
      style={{
        display: 'grid',
        gridTemplateRows: hasItem && actions != null ? 'auto minmax(0, 1fr) auto' : 'auto minmax(0, 1fr)',
        width: '100%',
        minWidth: 0,
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        boxSizing: 'border-box',
        background: 'var(--color-semantic-background-elevated-normal)',
        fontFamily: 'var(--font-sans)',
        ...style,
      }}
      {...rest}
    >
      <header style={{ display: 'grid', gap: 'var(--space-2)', minWidth: 0, padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-semantic-line-normal-normal)', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)', minWidth: 0 }}>
          <strong style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 'var(--label2-size)', lineHeight: 'var(--label2-line)', fontWeight: 'var(--fw-bold)', color: 'var(--color-semantic-label-neutral)' }}>
            {title}
          </strong>
          {canClearSelection && (
            <IconButton
              type="button"
              size="sm"
              variant="ghost"
              round={false}
              label={clearSelectionAriaLabel}
              title={typeof clearSelectionLabel === 'string' ? clearSelectionLabel : clearSelectionAriaLabel}
              onClick={onClearSelection}
            >
              <Icon name="close" size={16} aria-hidden="true" />
            </IconButton>
          )}
        </div>
        {hasItem && (
          <div style={{ display: 'grid', gap: 'var(--space-2)', minWidth: 0 }}>
            <h3 style={{ minWidth: 0, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 'var(--headline2-size)', lineHeight: 'var(--headline2-line)', fontWeight: 'var(--fw-bold)', color: 'var(--color-semantic-label-strong)', letterSpacing: 0 }}>
              {selectionName}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0, flexWrap: 'wrap' }}>
              {item.kind != null && <Tag tone="neutral">{item.kind}</Tag>}
              {item.status != null && <StatusBadge tone={item.statusTone || 'signal'}>{item.status}</StatusBadge>}
            </div>
          </div>
        )}
      </header>

      <div style={{ minHeight: 0, overflow: 'auto', padding: hasItem ? '0 var(--space-4) var(--space-4)' : 'var(--space-4)', boxSizing: 'border-box' }}>
        {hasItem ? (
          <>
            {sections.map((section, index) => <InspectorSection key={`${section.title || 'section'}-${index}`} section={section} />)}
            {children}
          </>
        ) : (
          <div role="status" style={{ minHeight: 180, display: 'grid', placeItems: 'center', alignContent: 'center', gap: 'var(--space-3)', color: 'var(--color-semantic-label-neutral)', textAlign: 'center' }}>
            <Icon name="crosshair" size={24} aria-hidden="true" />
            <span style={{ maxWidth: 220, fontSize: 'var(--label2-size)', lineHeight: 'var(--label2-line)', fontWeight: 'var(--fw-medium)' }}>{emptyLabel}</span>
          </div>
        )}
      </div>

      {hasItem && actions != null && (
        <ActionArea compact align="end">
          {actions}
        </ActionArea>
      )}
    </section>
  );
}
