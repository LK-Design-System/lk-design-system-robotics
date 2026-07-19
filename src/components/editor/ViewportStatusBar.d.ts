import * as React from 'react';

export interface ViewportStatusItem {
  key?: React.Key;
  label: React.ReactNode;
  /** Passive scalar text. Surrounding whitespace is normalized. */
  value: string | number;
  /** String unit normalized through the shared LDS unit rule. */
  unit?: string;
  /** High items render first and resist shrinking; low items yield first. @default "normal" */
  priority?: 'high' | 'normal' | 'low';
  tone?: 'default' | 'signal' | 'positive' | 'cautionary' | 'negative' | 'warning' | 'danger';
  /** Visible semantic text paired with the tone. Defaults to 활성/정상/주의/위험. */
  toneLabel?: React.ReactNode;
  mono?: boolean;
  title?: string;
}

export interface ViewportStatusBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Persistent readout group accessible name. @default "뷰포트 상태" */
  label?: string;
  /** Persistent, non-live viewport readouts. */
  items?: ViewportStatusItem[];
  /** Optional transient viewport-local message, announced politely. */
  message?: React.ReactNode;
  /** Semantic tone for the transient message. @default "default" */
  messageTone?: 'default' | 'signal' | 'positive' | 'cautionary' | 'negative' | 'warning' | 'danger';
  /** Visible semantic text paired with messageTone. */
  messageToneLabel?: React.ReactNode;
  /** @deprecated Compatibility slot for passive trailing status only. Prefer items/message. */
  children?: React.ReactNode;
}

/** 2D/3D 에디터용 우선순위 단일 행 상태 바. Persistent items are deliberately not a live region. */
export function ViewportStatusBar(props: ViewportStatusBarProps): React.JSX.Element;
