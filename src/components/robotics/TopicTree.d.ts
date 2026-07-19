import * as React from 'react';

export interface TopicNode {
  name: React.ReactNode;
  /** ROS 메시지 타입(예: "sensor_msgs/LaserScan"). */
  type?: string;
  /** 퍼블리시 주기(Hz). */
  hz?: number;
  /** 구독 토글 노출 여부. */
  subscribable?: boolean;
  /** 구독 상태. */
  subscribed?: boolean;
  children?: TopicNode[];
}

export interface TopicTreeProps extends React.HTMLAttributes<HTMLDivElement> {
  nodes: TopicNode[];
  /** 구독 토글 클릭 시 해당 노드와 함께 호출. */
  onToggleSubscribe?: (node: TopicNode) => void;
}

/** ROS 토픽 / TF 계층 트리 — 타입 · Hz 메타 + 구독 토글. */
export function TopicTree(props: TopicTreeProps): React.JSX.Element;
