import React from 'react';
import { Tree } from '@lk-robotics/lds-product/components/data/Tree';
import { Switch } from '@lk-robotics/lds-core/components/selection/Switch';

function nodePath(parentPath, index) {
  return parentPath === '' ? String(index) : `${parentPath}.${index}`;
}

function collectDefaultExpandedIds(nodes, parentPath = '', depth = 0, ids = []) {
  nodes.forEach((node, index) => {
    const id = nodePath(parentPath, index);
    const children = node.children ?? [];
    if (children.length > 0) {
      if (depth < 1) ids.push(id);
      collectDefaultExpandedIds(children, id, depth + 1, ids);
    }
  });
  return ids;
}

function nodeLabelText(node) {
  return typeof node.name === 'string' || typeof node.name === 'number'
    ? String(node.name)
    : undefined;
}

function TopicSubscribeControl({ node, onToggleSubscribe }) {
  const wrapperRef = React.useRef(null);
  const label = nodeLabelText(node);

  // Tree rows own the single roving Tab stop. The switch remains pointer
  // operable while Enter/Space on a leaf delegates through Tree.onSelect.
  React.useLayoutEffect(() => {
    const control = wrapperRef.current?.querySelector('[role="switch"]');
    if (control) control.tabIndex = -1;
  });

  return (
    <span
      ref={wrapperRef}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      style={{ display: 'inline-flex' }}
    >
      <Switch
        size="sm"
        checked={Boolean(node.subscribed)}
        aria-label={label != null ? `${label} 구독` : '구독'}
        onChange={() => onToggleSubscribe?.(node)}
      />
    </span>
  );
}

function topicMeta(node) {
  if (node.type == null && typeof node.hz !== 'number') return undefined;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      {node.type != null && (
        <code
          style={{
            maxWidth: 180,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: 'var(--color-semantic-label-alternative)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--caption1-size)',
          }}
        >
          {node.type}
        </code>
      )}
      {typeof node.hz === 'number' && (
        <span style={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
          {node.hz} Hz
        </span>
      )}
    </span>
  );
}

function adaptNodes(nodes, onToggleSubscribe, parentPath = '') {
  return nodes.map((node, index) => {
    const id = nodePath(parentPath, index);
    const children = node.children ?? [];
    const label = nodeLabelText(node);
    const ariaLabel = label == null
      ? undefined
      : [
          label,
          node.type,
          typeof node.hz === 'number' ? `${node.hz} Hz` : undefined,
          node.subscribable ? (node.subscribed ? '구독 켜짐' : '구독 꺼짐') : undefined,
        ].filter((part) => part != null && part !== '').join(', ');

    return {
      id,
      label: node.name,
      meta: topicMeta(node),
      end: node.subscribable
        ? <TopicSubscribeControl node={node} onToggleSubscribe={onToggleSubscribe} />
        : undefined,
      ariaLabel,
      sourceNode: node,
      children: adaptNodes(children, onToggleSubscribe, id),
    };
  });
}

/**
 * ROS topic/TF adapter over the Product Tree interaction engine. Robotics owns
 * the domain metadata and subscribe command; Product owns hierarchy semantics,
 * expansion, selection, and roving keyboard focus.
 */
export function TopicTree({
  nodes = [],
  onToggleSubscribe,
  style,
  'aria-label': ariaLabel,
  ...rest
}) {
  const treeNodes = adaptNodes(nodes, onToggleSubscribe);
  return (
    <Tree
      {...rest}
      nodes={treeNodes}
      defaultExpanded={collectDefaultExpandedIds(nodes)}
      selectedId={null}
      ariaLabel={ariaLabel ?? (rest['aria-labelledby'] == null ? '토픽 트리' : undefined)}
      onSelect={(node) => {
        if ((node.children?.length ?? 0) === 0 && node.sourceNode?.subscribable) {
          onToggleSubscribe?.(node.sourceNode);
        }
      }}
      style={{ display: 'grid', gap: 2, fontFamily: 'var(--font-sans)', ...style }}
    />
  );
}
