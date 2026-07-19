const ATTACHED_UNIT = /^(?:%|‰|°)$/u;

/** Normalize scalar display text so caller-supplied padding cannot change the lockup. */
export function normalizeValueText(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return String(value);
  return '';
}

/** Units are string contracts; surrounding whitespace never participates in layout. */
export function normalizeUnit(unit) {
  return typeof unit === 'string' ? unit.trim() : '';
}

/** Symbols that read as part of the numeric value in LDS product UI. */
export function isAttachedUnit(unit) {
  const normalizedUnit = normalizeUnit(unit);
  return normalizedUnit !== '' && ATTACHED_UNIT.test(normalizedUnit);
}

/** Literal text separator shared by visible DOM text and accessible value text. */
export function getUnitSeparator(unit) {
  const normalizedUnit = normalizeUnit(unit);
  return normalizedUnit === '' || isAttachedUnit(normalizedUnit) ? '' : ' ';
}

/** Join an accessible numeric value and its unit using the LDS display rule. */
export function formatValueWithUnit(value, unit) {
  const renderedValue = normalizeValueText(value);
  const renderedUnit = normalizeUnit(unit);
  return `${renderedValue}${getUnitSeparator(renderedUnit)}${renderedUnit}`;
}
