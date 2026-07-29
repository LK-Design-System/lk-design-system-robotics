import React from 'react';
import { FilterChip } from '@lk-robotics/lds-core/components/selection/FilterChip';
import { StatList } from '@lk-robotics/lds-product/components/content/StatList';

// Total and connected describe a healthy scope and stay achromatic; only the
// scopes that need an operator's attention carry a severity dot. Core's
// FilterChip has no tone prop, so the dot rides in `children` rather than
// forcing an upstream API change.
const SUMMARY_ITEMS = [
  { key: 'total', label: '전체' },
  { key: 'connected', label: '연결됨' },
  { key: 'attention', label: '주의 필요', tone: 'cautionary' },
  { key: 'unavailable', label: '운영 불가', tone: 'negative' },
  { key: 'stale', label: '데이터 지연', tone: 'cautionary' },
  { key: 'critical', label: '긴급', tone: 'negative' },
];

const TONE_DOT = {
  cautionary: 'var(--color-semantic-status-cautionary-foreground)',
  negative: 'var(--color-semantic-status-negative-foreground)',
};

function countValue(value) {
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

function accessibleLabel(label, fallback) {
  return typeof label === 'string' || typeof label === 'number'
    ? String(label)
    : fallback;
}

/**
 * Fleet-level count summary and optional controlled filter surface.
 *
 * Counts are supplied by the application and may overlap: for example a
 * critical robot can also be stale and unavailable. This component never
 * derives or normalizes fleet health from robot telemetry.
 *
 * Presentation is delegated to LDS primitives: static summaries use
 * Product StatList and controlled filters use Core FilterChip.
 */
export function FleetHealthSummary({
  counts = {},
  labels = {},
  activeFilters = [],
  onFiltersChange,
  showZero = true,
  label = 'Fleet 상태 요약',
  style,
  ...rest
}) {
  const interactive = typeof onFiltersChange === 'function';
  const selectedFilters = Array.isArray(activeFilters)
    ? activeFilters.filter((filter) => filter !== 'total')
    : [];
  const items = SUMMARY_ITEMS
    .filter(({ key }) => key === 'total' || showZero || countValue(counts[key]) > 0)
    .map(({ key, label: defaultLabel, tone }) => ({
      key,
      tone,
      label: labels[key] ?? defaultLabel,
      defaultLabel,
      count: countValue(counts[key]),
    }));

  return (
    <section
      aria-label={label}
      data-fleet-health-summary=""
      data-active-filters={selectedFilters.length > 0 ? selectedFilters.join(' ') : undefined}
      style={{
        minWidth: 0,
        fontFamily: 'var(--font-sans)',
        ...style,
      }}
      {...rest}
    >
      {interactive ? (
        <div
          role="group"
          aria-label={`${label} 필터`}
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-2)',
            minWidth: 0,
          }}
        >
          {items.map((item) => {
            const selected = item.key === 'total'
              ? selectedFilters.length === 0
              : selectedFilters.includes(item.key);
            const itemLabel = accessibleLabel(item.label, item.defaultLabel);

            return (
              <FilterChip
                key={item.key}
                active={selected}
                count={item.count}
                size="sm"
                aria-label={`${itemLabel} ${item.count}대${selected ? ', 필터 적용됨' : ''}`}
                data-fleet-summary-key={item.key}
                onClick={() => {
                  if (item.key === 'total') {
                    onFiltersChange([]);
                    return;
                  }
                  onFiltersChange(
                    selected
                      ? selectedFilters.filter((filter) => filter !== item.key)
                      : [...selectedFilters, item.key],
                  );
                }}
              >
                {TONE_DOT[item.tone] == null ? item.label : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                    <span
                      aria-hidden="true"
                      style={{
                        width: 6,
                        height: 6,
                        flexShrink: 0,
                        borderRadius: 'var(--radius-full)',
                        background: TONE_DOT[item.tone],
                      }}
                    />
                    {item.label}
                  </span>
                )}
              </FilterChip>
            );
          })}
        </div>
      ) : (
        <StatList
          size="sm"
          aria-label={label}
          data-fleet-health-summary-list=""
          items={items.map((item) => ({
            label: item.label,
            value: item.count,
          }))}
        />
      )}
    </section>
  );
}
