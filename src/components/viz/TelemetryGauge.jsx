import React from 'react';
import { StatusBadge } from '@lk-robotics/lds-core/components/content/StatusBadge';
import {
  formatValueWithUnit,
  getUnitSeparator,
  isAttachedUnit,
  normalizeUnit,
  normalizeValueText,
} from '../internal/unit-format.js';
import { TELEMETRY_STATUS_LABEL as STATUS_LABEL } from '../internal/telemetryStatusLabel.js';

const TONE = {
  signal: 'var(--color-semantic-status-info-text)',
  positive: 'var(--color-semantic-status-positive-text)',
  cautionary: 'var(--color-semantic-status-cautionary-text)',
  negative: 'var(--color-semantic-status-negative-text)',
};

function thresholdTone(percent, thresholds) {
  if (!thresholds) return undefined;

  const low = Math.min(thresholds.low, thresholds.high);
  const high = Math.max(thresholds.low, thresholds.high);
  // Missing `direction` is the deprecated pre-redesign contract. Preserve its
  // higher-is-better result at runtime, while the public type requires callers
  // to state the direction explicitly.
  const direction = thresholds.direction ?? 'higher-is-better';

  if (direction === 'lower-is-better') {
    if (percent >= high) return 'negative';
    if (percent >= low) return 'cautionary';
    return 'positive';
  }

  if (percent <= low) return 'negative';
  if (percent <= high) return 'cautionary';
  return 'positive';
}

function formatValue(value, precision) {
  if (precision == null) return String(value);
  const safePrecision = Math.max(0, Math.min(20, Math.trunc(precision)));
  return value.toFixed(safePrecision);
}

/**
 * LK ROBOTICS — TelemetryGauge
 * A labelled 270° meter for a scalar value with a meaningful min/max. The
 * product owns severity through `tone`; legacy threshold inference requires an
 * explicit direction. Loading/progress belongs to ProgressBar, not this meter.
 */
export function TelemetryGauge({
  value = 0,
  min = 0,
  max = 100,
  unit = '',
  label,
  size = 120,
  thickness = 10,
  thresholds,
  tone,
  statusLabel,
  precision,
  formatter,
  valueText,
  style,
  ...rest
}) {
  const generatedId = React.useId();
  const labelId = `telemetry-gauge-${generatedId.replace(/:/g, '')}`;
  const {
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    ...rootProps
  } = rest;

  const resolvedMin = Number.isFinite(min) ? min : 0;
  const resolvedMax = Number.isFinite(max) && max > resolvedMin ? max : resolvedMin + 1;
  const numericValue = Number.isFinite(value) ? value : resolvedMin;
  const resolvedValue = Math.max(resolvedMin, Math.min(resolvedMax, numericValue));
  const pct = (resolvedValue - resolvedMin) / (resolvedMax - resolvedMin);
  const inferredTone = thresholdTone(pct * 100, thresholds);
  const resolvedTone = tone || inferredTone || 'signal';
  const hasCustomStatusLabel = statusLabel != null && statusLabel !== false && statusLabel !== '';
  const resolvedStatusLabel = hasCustomStatusLabel
    ? statusLabel
    : (tone != null || inferredTone != null ? STATUS_LABEL[resolvedTone] : null);

  const normalizedUnit = normalizeUnit(unit);
  const unitSeparator = getUnitSeparator(normalizedUnit);
  const attachedUnit = isAttachedUnit(normalizedUnit);
  const formattedNumber = formatValue(resolvedValue, precision);
  const formatterResult = typeof formatter === 'function'
    ? formatter(resolvedValue, { min: resolvedMin, max: resolvedMax, unit: normalizedUnit })
    : formattedNumber;
  const renderedValue = typeof formatterResult === 'string' || typeof formatterResult === 'number'
    ? normalizeValueText(formatterResult)
    : formattedNumber;
  const baseValueText = formatValueWithUnit(renderedValue, normalizedUnit);
  const resolvedValueText = valueText != null ? normalizeValueText(valueText) : (
    typeof resolvedStatusLabel === 'string'
      ? `${baseValueText}, ${resolvedStatusLabel}`
      : baseValueText
  );

  const accessibleLabelledBy = ariaLabelledBy ?? (ariaLabel == null && label != null ? labelId : undefined);
  const accessibleLabel = accessibleLabelledBy
    ? undefined
    : (ariaLabel ?? (typeof label === 'string' ? label : '텔레메트리 값'));

  const radius = (size - thickness) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75;

  return (
    <div
      style={{
        display: 'inline-grid',
        justifyItems: 'center',
        gap: 'var(--space-2)',
        maxWidth: '100%',
        minWidth: 0,
        fontFamily: 'var(--font-sans)',
        ...style,
      }}
      {...rootProps}
    >
      <div
        role="meter"
        aria-label={accessibleLabel}
        aria-labelledby={accessibleLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-valuemin={resolvedMin}
        aria-valuemax={resolvedMax}
        aria-valuenow={resolvedValue}
        aria-valuetext={resolvedValueText}
        style={{ position: 'relative', width: size, height: size, maxWidth: '100%' }}
      >
        <svg
          aria-hidden="true"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ display: 'block', transform: 'rotate(135deg)' }}
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--color-semantic-fill-strong)"
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
          />
          {/* Round caps read as a filled bulb at a zero-length dash, so an empty
              gauge (pct=0) would paint a false dot; guard so the value arc only
              renders once there is a value. A near-empty value keeps the cap. */}
          {pct > 0 && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={TONE[resolvedTone] || TONE.signal}
              strokeWidth={thickness}
              strokeLinecap="round"
              strokeDasharray={`${arcLength * pct} ${circumference}`}
              style={{ transition: 'stroke-dasharray var(--dur-slow) var(--ease-out), stroke var(--dur-base) var(--ease-out)' }}
            />
          )}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', minWidth: 0 }}>
          <strong
            data-telemetry-gauge-lockup=""
            data-unit-attachment={normalizedUnit === '' ? 'none' : attachedUnit ? 'attached' : 'spaced'}
            style={{ display: 'inline-block', maxWidth: '82%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-semantic-label-strong)', fontSize: size * 0.24, lineHeight: 1, fontWeight: 'var(--fw-extra)', fontVariantNumeric: 'tabular-nums', textAlign: 'center' }}
          >
            <span>{renderedValue}</span>
            {normalizedUnit !== '' && (
              <span style={{ color: 'var(--color-semantic-label-neutral)', fontSize: Math.max(12, size * 0.11), lineHeight: 1.2, fontWeight: 'var(--fw-semibold)' }}>
                {unitSeparator}{normalizedUnit}
              </span>
            )}
          </strong>
        </div>
      </div>

      {(label != null || resolvedStatusLabel != null) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', maxWidth: '100%', minWidth: 0, flexWrap: 'wrap' }}>
          {label != null && (
            <span id={labelId} style={{ color: 'var(--color-semantic-label-neutral)', fontSize: 'var(--caption1-size)', lineHeight: 1.35, fontWeight: 'var(--fw-bold)', overflowWrap: 'anywhere', textAlign: 'center' }}>
              {label}
            </span>
          )}
          {resolvedStatusLabel != null && <StatusBadge tone={resolvedTone}>{resolvedStatusLabel}</StatusBadge>}
        </div>
      )}
    </div>
  );
}
