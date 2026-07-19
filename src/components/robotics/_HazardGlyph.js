// Knockout hazard glyphs painted white on the severity-colored HazardMarker pin
// badge — the internal atom shared by the marker and the Foundation catalog.
// Internal `_`-prefixed module: path/geometry constants only, never exported from
// the public entry.
//
// `stairs` is Material Symbols (Google, Apache 2.0) rounded fill `stairs_2` — the
// unboxed solid staircase — embedded verbatim (native viewBox 0 -960 960 960).
// `dropoff` is LDS-authored on the same 960 grid (Material Symbols has no
// ledge/fall glyph): a one-step edge profile with a falling arrow over the lower
// level — deliberately a single step so it stays distinct from the multi-step
// stairs zigzag at badge size. `obstacle` is an LDS traffic-cone silhouette — the
// operational symbol for a physical obstruction; Material Symbols' closest fills
// (fence, dangerous) read as a mushy grid and a prohibition X at badge size.
//
// The `ramp` hazard deliberately reuses the LDS incline silhouette from
// _FacilityGlyph (so the same physical slope reads the same whether a product
// classifies it as a traversable facility or a hazard) and is therefore NOT
// duplicated here — HazardMarker composes it in from FACILITY_GLYPH_PATHS.
// See docs/references/ATTRIBUTIONS.md.
export const HAZARD_GLYPH_PATHS = {
  stairs: 'M120-200q-17 0-28.5-11.5T80-240q0-17 11.5-28.5T120-280h200v-200q0-17 11.5-28.5T360-520h200v-200q0-17 11.5-28.5T600-760h240q17 0 28.5 11.5T880-720q0 17-11.5 28.5T840-680H640v200q0 17-11.5 28.5T600-440H400v200q0 17-11.5 28.5T360-200H120Z',
  dropoff: 'M140-660H460V-320H820V-240H380V-580H140Z M620-760H700V-520H780L660-380L540-520H620Z',
  obstacle: 'M430-760H530L630-360H330Z M240-320H720V-240H240Z',
};

// Recenters the 960u artwork (center 480,-480) onto the pin-head origin and
// scales it to the ~21px badge slot.
export const HAZARD_GLYPH_FIT = 'scale(0.016) translate(-480 480)';
