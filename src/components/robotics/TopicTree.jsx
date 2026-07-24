import React from 'react';
import { Icon } from '@lk-robotics/lds-core/components/icon/Icon';
import { Switch } from '@lk-robotics/lds-core/components/selection/Switch';

/* Stable identity for a node from its index chain. The `nodes` prop is
   structurally stable across renders, so the path survives re-renders and can
   drive the roving tab stop and the expansion set without a consumer-supplied id. */
function nodePath(parentPath, index) {
  return parentPath === '' ? String(index) : `${parentPath}.${index}`;
}

/* Groups open by default at depth 0 (matching the previous `depth < 1` default),
   deeper groups start collapsed. */
function collectDefaultExpandedPaths(nodes, parentPath = '', depth = 0, acc = []) {
  nodes.forEach((node, index) => {
    const children = node.children || [];
    if (children.length > 0) {
      const path = nodePath(parentPath, index);
      if (depth < 1) acc.push(path);
      collectDefaultExpandedPaths(children, path, depth + 1, acc);
    }
  });
  return acc;
}

/* Paths of every treeitem currently rendered (root plus the descendants of
   expanded groups) — the roving tab stop must always land on one of these. */
function collectVisiblePaths(nodes, expandedSet, parentPath = '', acc = []) {
  nodes.forEach((node, index) => {
    const path = nodePath(parentPath, index);
    acc.push(path);
    const children = node.children || [];
    if (children.length > 0 && expandedSet.has(path)) {
      collectVisiblePaths(children, expandedSet, path, acc);
    }
  });
  return acc;
}

function nodeLabelText(node) {
  return typeof node.name === 'string' || typeof node.name === 'number' ? String(node.name) : undefined;
}

/* DOM-driven roving navigation, mirroring the LayerPanel tree engine: walk the
   rendered `[role="treeitem"]` rows and move by document order or aria-level. Only
   expanded rows are in the DOM, so `next`/`previous` naturally skip collapsed
   subtrees. */
function focusTreeRow(current, direction, onFocusPath) {
  const tree = current.closest('[role="tree"]');
  if (!tree) return;
  const rows = Array.from(tree.querySelectorAll('[role="treeitem"]'));
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
    onFocusPath(target.getAttribute('data-topic-path'));
    target.focus();
  }
}

function TopicNode({ node, depth, path, expandedSet, focusPath, onFocusPath, onToggleExpanded, onToggleSubscribe }) {
  const kids = node.children || [];
  const has = kids.length > 0;
  const expanded = has && expandedSet.has(path);
  const hasHz = typeof node.hz === 'number';
  const [hover, setHover] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const switchWrapRef = React.useRef(null);
  const labelText = nodeLabelText(node);

  /* The DS Switch hard-codes its own `tabIndex` (0 when enabled), so it cannot be
     removed from the tab sequence through props. Keep the tree a single roving tab
     stop — as the LayerPanel engine does with its `tabIndex={-1}` row actions — by
     pulling the switch's native control out of Tab imperatively. It stays operable
     by pointer and by the row's Enter/Space. React never re-asserts the value
     because the Switch's tabIndex prop does not change between renders. */
  React.useLayoutEffect(() => {
    const control = switchWrapRef.current?.querySelector('[role="switch"]');
    if (control && control.tabIndex !== -1) control.tabIndex = -1;
  });

  const toggleExpand = () => {
    if (has) onToggleExpanded(path, !expanded);
  };
  const toggleSubscribe = () => {
    if (node.subscribable) onToggleSubscribe?.(node);
  };

  /* Compose the row's accessible name so the roving treeitem announces its
     metadata and subscription state in one utterance. Only build it from a
     string/number name — a custom-node name is left to the rendered content. */
  const ariaLabel = labelText != null
    ? [
        labelText,
        node.type,
        hasHz ? `${node.hz} Hz` : undefined,
        node.subscribable ? (node.subscribed ? '구독 켜짐' : '구독 꺼짐') : undefined,
      ].filter((part) => part != null && part !== '').join(', ')
    : undefined;

  return (
    <div role="none">
      <div
        role="treeitem"
        aria-level={depth + 1}
        aria-expanded={has ? expanded : undefined}
        aria-label={ariaLabel}
        tabIndex={focusPath === path ? 0 : -1}
        data-topic-path={path}
        onClick={(event) => {
          if (!event.target.closest('[role="switch"], label')) toggleExpand();
        }}
        onFocus={(event) => {
          if (event.target !== event.currentTarget) return;
          setFocused(true);
          onFocusPath(path);
        }}
        onBlur={(event) => {
          if (event.target === event.currentTarget) setFocused(false);
        }}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === 'ArrowDown') { event.preventDefault(); focusTreeRow(event.currentTarget, 'next', onFocusPath); }
          else if (event.key === 'ArrowUp') { event.preventDefault(); focusTreeRow(event.currentTarget, 'previous', onFocusPath); }
          else if (event.key === 'Home') { event.preventDefault(); focusTreeRow(event.currentTarget, 'first', onFocusPath); }
          else if (event.key === 'End') { event.preventDefault(); focusTreeRow(event.currentTarget, 'last', onFocusPath); }
          else if (event.key === 'ArrowRight' && has) {
            event.preventDefault();
            if (!expanded) onToggleExpanded(path, true);
            else focusTreeRow(event.currentTarget, 'child', onFocusPath);
          }
          else if (event.key === 'ArrowLeft') {
            if (has && expanded) { event.preventDefault(); onToggleExpanded(path, false); }
            else if (depth > 0) { event.preventDefault(); focusTreeRow(event.currentTarget, 'parent', onFocusPath); }
          }
          else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (has) toggleExpand();
            else toggleSubscribe();
          }
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          minHeight: 36,
          padding: '8px 10px',
          paddingLeft: 10 + depth * 20,
          border: '1px solid transparent',
          borderRadius: 'var(--radius-md)',
          boxSizing: 'border-box',
          cursor: has ? 'pointer' : 'default',
          background: hover ? 'var(--color-semantic-background-normal-alternative)' : 'transparent',
          /* Rows live in a scroll container, so an outer glow would clip at the edge;
             use the inset focus indicator that LayerPanel uses for the same reason. */
          boxShadow: focused ? 'inset 0 0 0 2px var(--color-semantic-focus-indicator)' : 'none',
          outline: 'none',
          textAlign: 'left',
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--label1-size)',
          fontWeight: depth === 0 ? 'var(--fw-semibold)' : 'var(--fw-medium)',
          lineHeight: '18px',
          color: depth === 0 ? 'var(--color-semantic-label-strong)' : 'var(--color-semantic-label-normal)',
          transition: 'background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 14,
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-semantic-label-alternative)',
            transform: has && expanded ? 'rotate(90deg)' : 'none',
            transition: 'transform var(--dur-fast) var(--ease-out)',
          }}
        >
          {has && <Icon name="chevron-right" size={14} />}
        </span>
        <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {node.name}
        </span>
        {node.type && (
          <code
            style={{
              maxWidth: '42%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: 'var(--caption1-size)',
              lineHeight: '18px',
              color: 'var(--color-semantic-label-alternative)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {node.type}
          </code>
        )}
        {(hasHz || node.subscribable) && (
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {hasHz && <span style={{ fontSize: 'var(--caption1-size)', lineHeight: '18px', color: 'var(--color-semantic-label-alternative)', fontVariantNumeric: 'tabular-nums' }}>{node.hz} Hz</span>}
            {node.subscribable && (
              <span ref={switchWrapRef} onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex' }}>
                <Switch size="sm" checked={!!node.subscribed} aria-label={labelText != null ? `${labelText} 구독` : '구독'} onChange={() => onToggleSubscribe && onToggleSubscribe(node)} />
              </span>
            )}
          </span>
        )}
      </div>
      {expanded && (
        <div role="group">
          {kids.map((child, index) => (
            <TopicNode
              key={index}
              node={child}
              depth={depth + 1}
              path={nodePath(path, index)}
              expandedSet={expandedSet}
              focusPath={focusPath}
              onFocusPath={onFocusPath}
              onToggleExpanded={onToggleExpanded}
              onToggleSubscribe={onToggleSubscribe}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * LK ROBOTICS — TopicTree
 * ROS topic / TF hierarchy — expandable rows (chevron via the DS `Icon`, hover
 * highlight) with type + Hz metadata and an optional per-topic subscribe toggle
 * (DS `Switch`). Domain-specialized data tree that follows the APG tree pattern:
 * roving tab stop, ArrowUp/Down/Left/Right and Home/End navigation, aria-level and
 * grouped children. The subscribe toggle is kept out of the tab sequence and is
 * driven from its row (Enter/Space) or by pointer, per the APG tree convention for
 * in-row controls.
 */
export function TopicTree({ nodes = [], onToggleSubscribe, style, ...rest }) {
  const [expandedSet, setExpandedSet] = React.useState(() => new Set(collectDefaultExpandedPaths(nodes)));
  const [focusPath, setFocusPath] = React.useState(() => (nodes.length > 0 ? '0' : undefined));

  const visiblePaths = collectVisiblePaths(nodes, expandedSet);
  const visibleKey = visiblePaths.join('|');

  /* Keep the roving tab stop on a rendered row. Collapsing already parks focus on
     the collapsing parent; this covers structural changes to `nodes` that would
     otherwise strand the tab stop on a row that no longer exists. */
  React.useEffect(() => {
    if (!visiblePaths.includes(focusPath)) setFocusPath(visiblePaths[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleKey]);

  const toggleExpanded = (path, next) => {
    setExpandedSet((previous) => {
      const updated = new Set(previous);
      if (next) updated.add(path);
      else updated.delete(path);
      return updated;
    });
    /* Collapsing can remove the currently focused descendant; park the tab stop on
       the parent that stays visible. */
    if (!next) setFocusPath(path);
  };

  return (
    <div
      {...rest}
      role="tree"
      aria-label={rest['aria-label'] ?? (rest['aria-labelledby'] != null ? undefined : '토픽 트리')}
      style={{ display: 'grid', gap: 2, fontFamily: 'var(--font-sans)', ...style }}
    >
      {nodes.map((node, index) => (
        <TopicNode
          key={index}
          node={node}
          depth={0}
          path={String(index)}
          expandedSet={expandedSet}
          focusPath={focusPath}
          onFocusPath={setFocusPath}
          onToggleExpanded={toggleExpanded}
          onToggleSubscribe={onToggleSubscribe}
        />
      ))}
    </div>
  );
}
