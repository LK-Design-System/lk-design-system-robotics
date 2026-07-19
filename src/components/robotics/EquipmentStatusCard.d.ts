import * as React from 'react';

export interface EquipmentStatusCardDetail {
  /** Supporting fact label. */
  label: React.ReactNode;
  /** Supporting fact value; may compose another LDS primitive such as ConnectionBadge. */
  value: React.ReactNode;
}

export interface EquipmentStatusCardProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  /** Optional decorative equipment icon. The visible title carries identity. */
  icon?: React.ReactNode;
  /** Equipment identity. */
  title: React.ReactNode;
  /** Optional supporting description of the equipment or its location. */
  description?: React.ReactNode;
  /** Visible primary condition label; color is supplementary only. */
  status: React.ReactNode;
  /** Semantic tone for the primary condition indicator. @default "neutral" */
  statusTone?: 'positive' | 'cautionary' | 'negative' | 'signal' | 'neutral';
  /** Labeled supporting facts presented as a semantic description list. */
  details?: readonly EquipmentStatusCardDetail[];
  /** Optional freshness, ownership, or other low-emphasis metadata. */
  meta?: React.ReactNode;
  /** Optional equipment-level actions; supply LDS action primitives. */
  actions?: React.ReactNode;
  /** Heading level used for the equipment identity. @default 3 */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
}

/** Product-neutral equipment identity, primary condition, supporting facts, metadata, and actions. */
export function EquipmentStatusCard(props: EquipmentStatusCardProps): React.JSX.Element;
