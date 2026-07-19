import * as React from 'react';

export interface BatteryGaugeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** 배터리 잔량(0–100). @default 0 */
  value?: number;
  /** % 라벨 표시. @default true */
  showLabel?: boolean;
  /** @default "md" */
  size?: 'sm' | 'md';
}

/** 배터리 잔량 인디케이터(셸 + 레벨색 fill + % 표기). ≤20% red · ≤50% amber · else green. */
export function BatteryGauge(props: BatteryGaugeProps): React.JSX.Element;
