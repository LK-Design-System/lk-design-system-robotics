import React from 'react';
import { Icon } from '@lk-robotics/lds-core/components/icon/Icon';
import { Switch } from '@lk-robotics/lds-core/components/selection/Switch';

function TopicNode({ node, depth, onToggle }) {
  const kids = node.children || [];
  const has = kids.length > 0;
  const [open, setOpen] = React.useState(depth < 1);
  const [hover, setHover] = React.useState(false);
  const hasHz = typeof node.hz === 'number';
  const toggleOpen = () => {
    if (has) setOpen((value) => !value);
  };
  const handleKeyDown = (event) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleOpen();
    }
  };

  return (
    <div>
      <div
        role="treeitem"
        tabIndex={has ? 0 : undefined}
        aria-expanded={has ? open : undefined}
        onClick={toggleOpen}
        onKeyDown={handleKeyDown}
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
            transform: has && open ? 'rotate(90deg)' : 'none',
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
              <span onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex' }}>
                <Switch size="sm" checked={!!node.subscribed} onChange={() => onToggle && onToggle(node)} />
              </span>
            )}
          </span>
        )}
      </div>
      {open && has && (
        <div>
          {kids.map((k, i) => <TopicNode key={i} node={k} depth={depth + 1} onToggle={onToggle} />)}
        </div>
      )}
    </div>
  );
}

/**
 * LK ROBOTICS — TopicTree
 * ROS topic / TF hierarchy — expandable rows (chevron via the DS `Icon`, hover
 * highlight) with type + Hz metadata and an optional
 * per-topic subscribe toggle (DS `Switch`). Domain-specialized data tree.
 */
export function TopicTree({ nodes = [], onToggleSubscribe, style, ...rest }) {
  return (
    <div role="tree" style={{ display: 'grid', gap: 2, fontFamily: 'var(--font-sans)', ...style }} {...rest}>
      {nodes.map((n, i) => <TopicNode key={i} node={n} depth={0} onToggle={onToggleSubscribe} />)}
    </div>
  );
}
