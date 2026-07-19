import * as React from 'react';

export type ConnectionState =
  | 'unknown'
  | 'connecting'
  | 'connected'
  | 'degraded'
  | 'reconnecting'
  | 'disconnected'
  | 'failed';

export type LegacyConnectionStatus =
  | 'connecting'
  | 'ready'
  | 'online'
  | 'reconnecting'
  | 'weak'
  | 'stale'
  | 'error'
  | 'offline';

export interface ConnectionBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Transport 연결 상태. freshness, health, operability, authority를 추론하지 않습니다. */
  connectionState?: ConnectionState;
  /** Legacy compatibility axis. 새 코드는 `connectionState`를 사용하세요. `stale`은 freshness가 아니라 기존 시각 호환으로만 유지됩니다. */
  status?: LegacyConnectionStatus;
  /** 라벨 재정의(기본은 상태별 한국어). */
  label?: React.ReactNode;
  /** 라벨 표시. @default true */
  showLabel?: boolean;
  /** @default "md" */
  size?: 'sm' | 'md';
}

/** MQTT / rosbridge transport truth를 신호 막대와 라벨로 표시합니다. 다른 운영 truth axis는 제품에서 별도로 조합합니다. */
export function ConnectionBadge(props: ConnectionBadgeProps): React.JSX.Element;
