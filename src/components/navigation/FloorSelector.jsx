import React from 'react';

/**
 * LK ROBOTICS — FloorSelector
 * A compact floor / level picker (building navigation). Single-select list of
 * floors; the active floor fills with the signal ink. Exposed as an ARIA radio
 * group — floor choice is conventionally single-select, so radio semantics
 * match the behaviour exactly: one tab stop, arrow keys rove focus + selection,
 * Home/End jump to the ends. (The previous role="listbox" declared a keyboard
 * model the component never implemented.)
 */
export function FloorSelector({ floors = [], value, defaultValue, onChange, style, ...rest }) {
  const controlled = value !== undefined;
  const norm = floors.map((f) => (typeof f === 'string' ? { value: f, label: f } : f));
  const [internal, setInternal] = React.useState(defaultValue != null ? defaultValue : (norm[0] && norm[0].value));
  const cur = controlled ? value : internal;
  const pick = (v) => { if (!controlled) setInternal(v); onChange && onChange(v); };

  // Roving tab stop: the checked floor is the group's single Tab stop; if the
  // current value is not among the floors, the first floor is focusable instead
  // (APG radio group). Every other radio is pulled out of the Tab sequence, so
  // the whole group is one stop rather than one-per-floor.
  const values = norm.map((f) => f.value);
  const selectedIndex = values.indexOf(cur);
  const tabStopIndex = selectedIndex >= 0 ? selectedIndex : 0;

  const focusRadio = (container, index) => {
    const radios = container.querySelectorAll('[role="radio"]');
    const target = radios[index];
    if (!target) return;
    pick(target.getAttribute('data-value'));
    target.focus();
  };

  const handleKeyDown = (event) => {
    const count = norm.length;
    if (count === 0) return;
    const container = event.currentTarget;
    const radios = Array.from(container.querySelectorAll('[role="radio"]'));
    const currentIndex = radios.indexOf(event.target.closest('[role="radio"]'));
    if (currentIndex < 0) return;
    let next;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (currentIndex + 1) % count;
    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (currentIndex - 1 + count) % count;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = count - 1;
    else return;
    event.preventDefault();
    focusRadio(container, next);
  };

  return (
    <div role="radiogroup" aria-label="층 선택" onKeyDown={handleKeyDown} style={{ display: 'inline-flex', flexDirection: 'column', gap: 3, padding: 4,
      background: 'var(--color-semantic-background-elevated-normal)', border: '1px solid var(--color-semantic-line-normal-normal)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', fontFamily: 'var(--font-sans)', ...style }} {...rest}>
      {norm.map((f, index) => {
        const on = f.value === cur;
        return (
          <button key={f.value} type="button" role="radio" aria-checked={on} data-value={f.value}
            tabIndex={index === tabStopIndex ? 0 : -1} onClick={() => pick(f.value)}
            style={{ minWidth: 44, height: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 0, borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 'var(--label1-size)', fontWeight: on ? 800 : 600, background: on ? 'var(--color-semantic-primary-normal)' : 'transparent', color: on ? 'var(--color-semantic-static-white)' : 'var(--color-semantic-label-neutral)',
              transition: 'background var(--dur-fast) var(--ease-out)' }}>
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
