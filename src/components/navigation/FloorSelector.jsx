import React from 'react';

/**
 * LK ROBOTICS — FloorSelector
 * A compact floor / level picker (building navigation). Single-select list of
 * floors; the active floor fills with the signal ink. Keyboard + ARIA listbox.
 */
export function FloorSelector({ floors = [], value, defaultValue, onChange, style, ...rest }) {
  const controlled = value !== undefined;
  const norm = floors.map((f) => (typeof f === 'string' ? { value: f, label: f } : f));
  const [internal, setInternal] = React.useState(defaultValue != null ? defaultValue : (norm[0] && norm[0].value));
  const cur = controlled ? value : internal;
  const pick = (v) => { if (!controlled) setInternal(v); onChange && onChange(v); };
  return (
    <div role="listbox" aria-label="층 선택" style={{ display: 'inline-flex', flexDirection: 'column', gap: 3, padding: 4,
      background: 'var(--color-semantic-background-elevated-normal)', border: '1px solid var(--color-semantic-line-normal-normal)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-1)', fontFamily: 'var(--font-sans)', ...style }} {...rest}>
      {norm.map((f) => {
        const on = f.value === cur;
        return (
          <button key={f.value} type="button" role="option" aria-selected={on} onClick={() => pick(f.value)}
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
