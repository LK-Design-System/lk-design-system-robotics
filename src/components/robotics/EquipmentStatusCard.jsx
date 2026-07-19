import React from 'react';
import { StatusBadge } from '@lk-robotics/lds-core/components/content/StatusBadge';

const STATUS_TONE = {
  positive: 'positive',
  cautionary: 'cautionary',
  negative: 'negative',
  signal: 'signal',
  neutral: 'offline',
};

/**
 * LK ROBOTICS — EquipmentStatusCard
 * Product-neutral equipment summary: identity, a visible primary condition,
 * labeled supporting facts, and optional metadata/actions. Product transports,
 * direction state machines, and connection policy remain composition concerns.
 */
export function EquipmentStatusCard({
  icon,
  title,
  description,
  status,
  statusTone = 'neutral',
  details = [],
  meta,
  actions,
  headingLevel = 3,
  style,
  ...rest
}) {
  const Heading = `h${headingLevel}`;
  const hasDetails = details.length > 0;
  const hasFooter = meta != null || actions != null;

  return (
    <article
      data-equipment-status-tone={statusTone}
      style={{
        display: 'grid',
        gap: 'var(--space-4)',
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        padding: 'var(--space-5)',
        background: 'var(--color-semantic-background-elevated-normal)',
        color: 'var(--color-semantic-label-normal)',
        border: 'var(--border-thin) solid var(--color-semantic-line-normal-normal)',
        borderRadius: 'var(--component-card-radius)',
        boxShadow: 'var(--component-card-shadow-none)',
        fontFamily: 'var(--font-sans)',
        ...style,
      }}
      {...rest}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 'var(--space-3) var(--space-4)',
          flexWrap: 'wrap',
          minWidth: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', flex: '1 1 16rem', minWidth: 0 }}>
          {icon != null && (
            <span
              aria-hidden="true"
              style={{ display: 'inline-flex', flexShrink: 0, paddingBlock: 'var(--space-1)', color: 'var(--color-semantic-label-alternative)' }}
            >
              {icon}
            </span>
          )}
          <div style={{ display: 'grid', gap: 'var(--space-1)', minWidth: 0 }}>
            <Heading
              style={{
                margin: 0,
                color: 'var(--color-semantic-label-strong)',
                fontSize: 'var(--body1-size)',
                lineHeight: 'var(--body1-line)',
                fontWeight: 'var(--fw-bold)',
                overflowWrap: 'anywhere',
              }}
            >
              {title}
            </Heading>
            {description != null && (
              <div
                style={{
                  color: 'var(--color-semantic-label-neutral)',
                  fontSize: 'var(--label1-size)',
                  lineHeight: 'var(--label1-line)',
                  overflowWrap: 'anywhere',
                }}
              >
                {description}
              </div>
            )}
          </div>
        </div>

        <StatusBadge
          tone={STATUS_TONE[statusTone] || STATUS_TONE.neutral}
          style={{
            flex: '0 1 auto',
            height: 'auto',
            minHeight: 20,
            maxWidth: '100%',
            paddingBlock: 'var(--space-1)',
            whiteSpace: 'normal',
            overflowWrap: 'anywhere',
          }}
        >
          {status}
        </StatusBadge>
      </header>

      {hasDetails && (
        <dl
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(10rem, 100%), 1fr))',
            gap: 'var(--space-3) var(--space-5)',
            margin: 0,
            paddingTop: 'var(--space-4)',
            borderTop: '1px solid var(--color-semantic-line-normal-normal)',
          }}
        >
          {details.map((detail, index) => (
            <div key={index} style={{ display: 'grid', alignContent: 'start', gap: 'var(--space-1)', minWidth: 0 }}>
              <dt
                style={{
                  color: 'var(--color-semantic-label-alternative)',
                  fontSize: 'var(--caption1-size)',
                  lineHeight: 'var(--caption1-line)',
                  fontWeight: 'var(--fw-semibold)',
                }}
              >
                {detail.label}
              </dt>
              <dd
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  minWidth: 0,
                  margin: 0,
                  color: 'var(--color-semantic-label-normal)',
                  fontSize: 'var(--label1-size)',
                  lineHeight: 'var(--label1-line)',
                  fontWeight: 'var(--fw-semibold)',
                  overflowWrap: 'anywhere',
                }}
              >
                {detail.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {hasFooter && (
        <footer
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-3) var(--space-4)',
            flexWrap: 'wrap',
            minWidth: 0,
            paddingTop: 'var(--space-3)',
            borderTop: '1px solid var(--color-semantic-line-normal-normal)',
          }}
        >
          {meta != null && (
            <div
              style={{
                flex: '1 1 12rem',
                minWidth: 0,
                color: 'var(--color-semantic-label-alternative)',
                fontSize: 'var(--caption1-size)',
                lineHeight: 'var(--caption1-line)',
                overflowWrap: 'anywhere',
              }}
            >
              {meta}
            </div>
          )}
          {actions != null && <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>{actions}</div>}
        </footer>
      )}
    </article>
  );
}
