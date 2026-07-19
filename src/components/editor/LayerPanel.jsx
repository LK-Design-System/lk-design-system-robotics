import React from 'react';
import { IconButton } from '@lk-robotics/lds-core/components/buttons/IconButton';
import { Icon } from '@lk-robotics/lds-core/components/icon/Icon';

const LAYER_TONE = {
  neutral: 'var(--color-semantic-label-neutral)',
  signal: 'var(--color-semantic-primary-normal)',
  positive: 'var(--color-semantic-status-positive)',
  cautionary: 'var(--color-semantic-status-cautionary)',
  negative: 'var(--color-semantic-status-negative)',
  warning: 'var(--color-semantic-status-cautionary)',
  danger: 'var(--color-semantic-status-negative)',
};

function collectLayerIds(layers, predicate, ids = []) {
  for (const layer of layers) {
    if (predicate(layer)) ids.push(layer.id);
    if (layer.children) collectLayerIds(layer.children, predicate, ids);
  }
  return ids;
}

function collectFocusableLayerIds(layers, inheritedDisabled = false, ids = []) {
  for (const layer of layers) {
    const disabled = inheritedDisabled || Boolean(layer.disabled);
    if (!disabled) ids.push(layer.id);
    if (layer.children) collectFocusableLayerIds(layer.children, disabled, ids);
  }
  return ids;
}

function collectVisibleFocusableLayerIds(layers, expandedSet, inheritedDisabled = false, ids = []) {
  for (const layer of layers) {
    const disabled = inheritedDisabled || Boolean(layer.disabled);
    if (!disabled) ids.push(layer.id);
    if (layer.children && expandedSet.has(layer.id)) {
      collectVisibleFocusableLayerIds(layer.children, expandedSet, disabled, ids);
    }
  }
  return ids;
}

function collectExpandedLayerIds(layers, ids = []) {
  for (const layer of layers) {
    if ((layer.children?.length ?? 0) > 0 && layer.expanded !== false) ids.push(layer.id);
    if (layer.children) collectExpandedLayerIds(layer.children, ids);
  }
  return ids;
}

function getLayerText(layer) {
  if (typeof layer.label === 'string' || typeof layer.label === 'number') return String(layer.label);
  if (typeof layer.description === 'string') return layer.description;
  return layer.id;
}

function focusTreeRow(current, direction, onFocusLayer) {
  const tree = current.closest('[role="tree"]');
  if (!tree) return;
  const rows = Array.from(tree.querySelectorAll('[role="treeitem"]')).filter((row) => row.getAttribute('aria-disabled') !== 'true');
  const index = rows.indexOf(current);
  if (index < 0) return;

  let target;
  if (direction === 'first') target = rows[0];
  if (direction === 'last') target = rows[rows.length - 1];
  if (direction === 'next') target = rows[Math.min(index + 1, rows.length - 1)];
  if (direction === 'previous') target = rows[Math.max(index - 1, 0)];
  if (direction === 'child') {
    const level = Number(current.getAttribute('aria-level'));
    target = rows.slice(index + 1).find((row) => Number(row.getAttribute('aria-level')) === level + 1);
  }
  if (direction === 'parent') {
    const level = Number(current.getAttribute('aria-level'));
    target = rows.slice(0, index).reverse().find((row) => Number(row.getAttribute('aria-level')) === level - 1);
  }
  if (target) {
    onFocusLayer(target.getAttribute('data-layer-id'));
    target.focus();
  }
}

function focusTreeRowByText(current, query, onFocusLayer) {
  const tree = current.closest('[role="tree"]');
  if (!tree) return;
  const rows = Array.from(tree.querySelectorAll('[role="treeitem"]')).filter((row) => row.getAttribute('aria-disabled') !== 'true');
  const start = rows.indexOf(current);
  const ordered = [...rows.slice(start + 1), ...rows.slice(0, start + 1)];
  const normalized = query.toLocaleLowerCase();
  const target = ordered.find((row) => (row.getAttribute('data-layer-text') || '').toLocaleLowerCase().startsWith(normalized));
  if (target) {
    onFocusLayer(target.getAttribute('data-layer-id'));
    target.focus();
  }
}

function focusLayerAction(current, action = 'visibility') {
  current.querySelector(`[data-layer-action="${action}"]`)?.focus();
}

function handleLayerActionKeyDown(event, nextAction) {
  const row = event.currentTarget.closest('[role="treeitem"]');
  if (!row) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    row.focus();
  }
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    focusLayerAction(row, nextAction);
  }
}

function LayerRow({
  layer,
  depth,
  visibleSet,
  lockedSet,
  expandedSet,
  activeId,
  focusId,
  disabled,
  onFocusLayer,
  onSelect,
  onToggleVisible,
  onToggleLocked,
  onToggleExpanded,
  onTypeahead,
}) {
  const [focused, setFocused] = React.useState(false);
  const layerDisabled = disabled || Boolean(layer.disabled);
  const visible = visibleSet.has(layer.id);
  const locked = lockedSet.has(layer.id);
  const active = activeId === layer.id;
  const labelText = getLayerText(layer);
  const color = LAYER_TONE[layer.tone] || LAYER_TONE.signal;
  const hasChildren = (layer.children?.length ?? 0) > 0;
  const expanded = hasChildren && expandedSet.has(layer.id);
  const semanticStatus = layer.toneLabel ?? layer.status;
  const rowMeta = semanticStatus ?? layer.meta ?? layer.count;
  const accessibleMeta = typeof rowMeta === 'string' || typeof rowMeta === 'number'
    ? `, ${rowMeta}`
    : '';

  const select = () => {
    if (layerDisabled) return;
    onFocusLayer(layer.id);
    onSelect(layer.id);
  };

  return (
    <li role="none" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      <div
        role="treeitem"
        aria-level={depth + 1}
        aria-selected={active}
        aria-expanded={hasChildren ? expanded : undefined}
        aria-disabled={layerDisabled || undefined}
        aria-label={`${labelText}${accessibleMeta}, ${visible ? '표시됨' : '숨김'}, ${locked ? '잠김' : '잠금 해제'}`}
        aria-keyshortcuts={layerDisabled ? undefined : 'F2'}
        aria-description={layerDisabled ? undefined : 'F2 키로 표시 및 잠금 작업으로 이동'}
        tabIndex={layerDisabled ? -1 : focusId === layer.id ? 0 : -1}
        data-layer-id={layer.id}
        data-layer-text={labelText}
        onFocus={(event) => {
          if (event.target !== event.currentTarget) return;
          setFocused(true);
          onFocusLayer(layer.id);
        }}
        onBlur={(event) => {
          if (event.target === event.currentTarget) setFocused(false);
        }}
        onClick={(event) => {
          if (!event.target.closest('button')) select();
        }}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === 'ArrowDown') { event.preventDefault(); focusTreeRow(event.currentTarget, 'next', onFocusLayer); }
          if (event.key === 'ArrowUp') { event.preventDefault(); focusTreeRow(event.currentTarget, 'previous', onFocusLayer); }
          if (event.key === 'Home') { event.preventDefault(); focusTreeRow(event.currentTarget, 'first', onFocusLayer); }
          if (event.key === 'End') { event.preventDefault(); focusTreeRow(event.currentTarget, 'last', onFocusLayer); }
          if (event.key === 'ArrowRight' && hasChildren) {
            event.preventDefault();
            if (!expanded) onToggleExpanded(layer.id, true);
            else focusTreeRow(event.currentTarget, 'child', onFocusLayer);
          }
          if (event.key === 'ArrowLeft') {
            if (hasChildren && expanded) {
              event.preventDefault();
              onToggleExpanded(layer.id, false);
            } else if (depth > 0) {
              event.preventDefault();
              focusTreeRow(event.currentTarget, 'parent', onFocusLayer);
            }
          }
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(); }
          if (event.key === 'F2') {
            event.preventDefault();
            focusLayerAction(event.currentTarget);
          }
          if (!event.altKey && !event.ctrlKey && !event.metaKey && event.key.length === 1 && event.key.trim() !== '') {
            event.preventDefault();
            onTypeahead(event.currentTarget, event.key);
          }
        }}
        style={{
          padding: 'var(--space-1) var(--space-2)',
          paddingLeft: `calc(var(--space-2) + ${depth} * var(--space-4))`,
          display: 'grid',
          gridTemplateColumns: '20px minmax(0, 1fr) auto var(--component-toggle-icon-size-sm) var(--component-toggle-icon-size-sm)',
          alignItems: 'center',
          gap: 'var(--space-1)',
          minHeight: 'var(--control-h-md)',
          borderRadius: 'var(--radius-sm)',
          background: active ? 'var(--color-semantic-fill-normal)' : 'transparent',
          /* 스크롤 컨테이너 안의 행이라 외부 글로우는 가장자리에서 잘린다 —
             클리핑되는 행·셀의 표준인 inset focus-indicator를 쓴다. */
          boxShadow: focused ? 'inset 0 0 0 2px var(--color-semantic-focus-indicator)' : 'none',
          outline: 'none',
          boxSizing: 'border-box',
          cursor: layerDisabled ? 'not-allowed' : 'pointer',
        }}
      >
      {hasChildren ? (
        <button
          type="button"
          tabIndex={-1}
          disabled={layerDisabled}
          aria-label={`${labelText} ${expanded ? '접기' : '펼치기'}`}
          onClick={(event) => {
            event.stopPropagation();
            onToggleExpanded(layer.id, !expanded);
          }}
          style={{ width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0, border: 0, borderRadius: 'var(--radius-sm)', background: 'transparent', color: layerDisabled ? 'var(--color-semantic-label-disable)' : 'var(--color-semantic-label-neutral)', cursor: layerDisabled ? 'not-allowed' : 'pointer' }}
        >
          <Icon name={expanded ? 'chevron-down-small' : 'chevron-right-small'} size={14} aria-hidden="true" />
        </button>
      ) : <span aria-hidden="true" style={{ width: 20, height: 20 }} />}

      <span style={{ minWidth: 0, display: 'grid', gridTemplateColumns: 'var(--space-2) minmax(0, 1fr)', alignItems: 'center', gap: 'var(--space-2)' }}>
        <span aria-hidden="true" style={{ width: 'var(--space-2)', height: 'var(--space-2)', borderRadius: '50%', background: color, opacity: visible ? 1 : 0.35 }} />
        <span style={{ display: 'grid', gap: 'var(--space-0)', minWidth: 0, opacity: visible ? 1 : 0.55 }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 'var(--label2-size)', lineHeight: 'var(--label2-line)', fontWeight: active ? 'var(--fw-bold)' : 'var(--fw-semibold)', letterSpacing: 0 }}>
            {layer.label}
          </span>
          {layer.description != null && (
            <span className="lk-layer-panel__row-description" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: layerDisabled ? 'var(--color-semantic-label-disable)' : 'var(--color-semantic-label-neutral)', fontSize: 'var(--caption1-size)', lineHeight: 'var(--caption1-line)', fontWeight: 'var(--fw-medium)', letterSpacing: 0 }}>
              {layer.description}
            </span>
          )}
        </span>
      </span>

      {rowMeta != null && (
        <span className="lk-layer-panel__row-meta" style={{ maxWidth: 76, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 'var(--caption1-size)', lineHeight: 'var(--caption1-line)', fontWeight: 'var(--fw-bold)', color: layerDisabled ? 'var(--color-semantic-label-disable)' : 'var(--color-semantic-label-neutral)', fontVariantNumeric: 'tabular-nums' }}>
          {rowMeta}
        </span>
      )}

      <IconButton
        variant="ghost"
        round={false}
        size="sm"
        label={`${labelText} ${visible ? '숨기기' : '보이기'}`}
        aria-pressed={visible}
        disabled={layerDisabled}
        data-layer-action="visibility"
        tabIndex={-1}
        style={{ gridColumn: 4 }}
        onClick={(event) => {
          event.stopPropagation();
          onToggleVisible(layer.id, !visible);
        }}
        onKeyDown={(event) => handleLayerActionKeyDown(event, 'lock')}
      >
        <Icon name={visible ? 'eye' : 'eye-slash'} size={16} aria-hidden="true" />
      </IconButton>

      <IconButton
        variant={locked ? 'soft' : 'ghost'}
        round={false}
        size="sm"
        label={`${labelText} ${locked ? '잠금 해제' : '잠금'}`}
        aria-pressed={locked}
        disabled={layerDisabled}
        data-layer-action="lock"
        tabIndex={-1}
        style={{ gridColumn: 5 }}
        onClick={(event) => {
          event.stopPropagation();
          onToggleLocked(layer.id, !locked);
        }}
        onKeyDown={(event) => handleLayerActionKeyDown(event, 'visibility')}
      >
        <Icon name={locked ? 'lock' : 'lock-open'} size={16} aria-hidden="true" />
      </IconButton>
      </div>

      {hasChildren && expanded && (
        <ul role="group" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {layer.children.map((child) => (
            <LayerRow
              key={child.id}
              layer={child}
              depth={depth + 1}
              visibleSet={visibleSet}
              lockedSet={lockedSet}
              expandedSet={expandedSet}
              activeId={activeId}
              focusId={focusId}
              disabled={layerDisabled}
              onFocusLayer={onFocusLayer}
              onSelect={onSelect}
              onToggleVisible={onToggleVisible}
              onToggleLocked={onToggleLocked}
              onToggleExpanded={onToggleExpanded}
              onTypeahead={onTypeahead}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * LK ROBOTICS — LayerPanel
 * Shared layer list for map and point-cloud editors: visibility, lock, active
 * layer, nested groups, counts, and per-layer metadata.
 */
export function LayerPanel({
  layers = [],
  activeLayerId,
  defaultActiveLayerId,
  onActiveLayerChange,
  visibleLayerIds,
  defaultVisibleLayerIds,
  onVisibleLayerIdsChange,
  lockedLayerIds,
  defaultLockedLayerIds,
  onLockedLayerIdsChange,
  expandedLayerIds,
  defaultExpandedLayerIds,
  onExpandedLayerIdsChange,
  title = '레이어',
  label = '레이어 목록',
  emptyLabel = '레이어가 없습니다.',
  disabled = false,
  style,
  ...rest
}) {
  const initialVisible = React.useMemo(
    () => defaultVisibleLayerIds || collectLayerIds(layers, (layer) => layer.visible !== false),
    [defaultVisibleLayerIds, layers]
  );
  const initialLocked = React.useMemo(
    () => defaultLockedLayerIds || collectLayerIds(layers, (layer) => Boolean(layer.locked)),
    [defaultLockedLayerIds, layers]
  );
  const initialExpanded = React.useMemo(
    () => defaultExpandedLayerIds ?? collectExpandedLayerIds(layers),
    [defaultExpandedLayerIds, layers]
  );
  const initialFocusableIds = collectFocusableLayerIds(layers);
  const initialActive = defaultActiveLayerId ?? initialFocusableIds[0] ?? layers[0]?.id;
  const [internalActive, setInternalActive] = React.useState(initialActive);
  const [focusId, setFocusId] = React.useState(initialFocusableIds.includes(initialActive) ? initialActive : initialFocusableIds[0]);
  const [internalVisible, setInternalVisible] = React.useState(() => new Set(initialVisible));
  const [internalLocked, setInternalLocked] = React.useState(() => new Set(initialLocked));
  const [internalExpanded, setInternalExpanded] = React.useState(() => new Set(initialExpanded));
  const typeaheadRef = React.useRef({ query: '', time: 0 });
  const previousActiveRef = React.useRef(initialActive);

  const currentActive = activeLayerId !== undefined ? activeLayerId : internalActive;
  const visibleSet = React.useMemo(
    () => visibleLayerIds !== undefined ? new Set(visibleLayerIds) : internalVisible,
    [internalVisible, visibleLayerIds]
  );
  const lockedSet = React.useMemo(
    () => lockedLayerIds !== undefined ? new Set(lockedLayerIds) : internalLocked,
    [internalLocked, lockedLayerIds]
  );
  const expandedSet = React.useMemo(
    () => expandedLayerIds !== undefined ? new Set(expandedLayerIds) : internalExpanded,
    [expandedLayerIds, internalExpanded]
  );
  const layerIds = collectLayerIds(layers, () => true);
  const focusableLayerIds = collectVisibleFocusableLayerIds(layers, expandedSet, disabled);
  const focusableLayerKey = focusableLayerIds.join('|');

  React.useEffect(() => {
    const activeChanged = previousActiveRef.current !== currentActive;
    if (activeChanged && currentActive != null && focusableLayerIds.includes(currentActive)) {
      setFocusId(currentActive);
    } else if (!focusableLayerIds.includes(focusId)) {
      setFocusId(
        currentActive != null && focusableLayerIds.includes(currentActive)
          ? currentActive
          : focusableLayerIds[0]
      );
    }
    previousActiveRef.current = currentActive;
  }, [currentActive, focusId, focusableLayerKey]);

  const selectLayer = (id) => {
    if (disabled) return;
    if (activeLayerId === undefined) setInternalActive(id);
    onActiveLayerChange?.(id);
  };

  const setVisible = (id, visible) => {
    if (disabled) return;
    const next = new Set(visibleSet);
    if (visible) next.add(id);
    else next.delete(id);
    if (visibleLayerIds === undefined) setInternalVisible(next);
    onVisibleLayerIdsChange?.([...next], id, visible);
  };

  const setLocked = (id, locked) => {
    if (disabled) return;
    const next = new Set(lockedSet);
    if (locked) next.add(id);
    else next.delete(id);
    if (lockedLayerIds === undefined) setInternalLocked(next);
    onLockedLayerIdsChange?.([...next], id, locked);
  };

  const setExpanded = (id, expanded) => {
    if (disabled) return;
    const next = new Set(expandedSet);
    if (expanded) next.add(id);
    else next.delete(id);
    if (expandedLayerIds === undefined) setInternalExpanded(next);
    if (!expanded) setFocusId(id);
    onExpandedLayerIdsChange?.(layerIds.filter((layerId) => next.has(layerId)), id, expanded);
  };

  const typeahead = (current, key) => {
    const now = Date.now();
    const previous = typeaheadRef.current;
    const normalizedKey = key.toLocaleLowerCase();
    const withinWindow = now - previous.time < 500;
    const repeatedCharacter = withinWindow
      && previous.query.length > 0
      && [...previous.query].every((character) => character === normalizedKey);
    const query = withinWindow && !repeatedCharacter
      ? `${previous.query}${normalizedKey}`
      : normalizedKey;
    typeaheadRef.current = { query, time: now };
    focusTreeRowByText(current, query, setFocusId);
  };

  return (
    <section
      className="lk-layer-panel"
      style={{
        display: 'grid',
        gridTemplateRows: 'auto minmax(0, 1fr)',
        gap: 'var(--space-2)',
        width: '100%',
        minWidth: 0,
        height: '100%',
        padding: 'var(--space-3)',
        boxSizing: 'border-box',
        containerType: 'inline-size',
        fontFamily: 'var(--font-sans)',
        ...style,
      }}
      {...rest}
    >
      <style>{`
        /* 좁은 도킹 폭에서는 행의 보조 캡션과 meta를 숨겨 label + visibility/lock
           마이크로 컨트롤만 남긴다 (Figma layers의 축약 행과 같은 우선순위). */
        @container (max-width: 260px) {
          .lk-layer-panel__row-description,
          .lk-layer-panel__row-meta {
            display: none !important;
          }
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0 }}>
        <Icon name="layers" size={16} aria-hidden="true" />
        <strong style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 'var(--label1-size)', lineHeight: 'var(--label1-line)', fontWeight: 'var(--fw-bold)', color: 'var(--color-semantic-label-strong)', letterSpacing: 0 }}>
          {title}
        </strong>
        <span style={{ marginLeft: 'auto', fontSize: 'var(--caption1-size)', lineHeight: 'var(--caption1-line)', fontWeight: 'var(--fw-bold)', color: 'var(--color-semantic-label-neutral)', fontVariantNumeric: 'tabular-nums' }}>
          {layerIds.length}
        </span>
      </div>

      {layers.length === 0 ? (
        <div role="status" style={{ display: 'grid', placeItems: 'center', minHeight: 120, color: 'var(--color-semantic-label-neutral)', fontSize: 'var(--label2-size)', lineHeight: 'var(--label2-line)', fontWeight: 'var(--fw-medium)', textAlign: 'center' }}>
          {emptyLabel}
        </div>
      ) : (
        <ul
          role="tree"
          aria-label={label}
          aria-multiselectable="false"
          aria-disabled={disabled || undefined}
          style={{ minHeight: 0, overflow: 'auto', margin: 0, padding: 0, listStyle: 'none' }}
        >
          {layers.map((layer) => (
            <LayerRow
              key={layer.id}
              layer={layer}
              depth={0}
              visibleSet={visibleSet}
              lockedSet={lockedSet}
              expandedSet={expandedSet}
              activeId={currentActive}
              focusId={focusId}
              disabled={disabled}
              onFocusLayer={setFocusId}
              onSelect={selectLayer}
              onToggleVisible={setVisible}
              onToggleLocked={setLocked}
              onToggleExpanded={setExpanded}
              onTypeahead={typeahead}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
