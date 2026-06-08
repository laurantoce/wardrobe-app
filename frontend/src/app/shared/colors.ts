/** Curated fashion color palette. Storing a name (not just hex) makes color
 *  analytics meaningful — near-identical hexes group under one name. */
export interface PaletteColor {
  name: string;
  hex: string;
}

export const COLOR_PALETTE: PaletteColor[] = [
  { name: 'Black', hex: '#1c1917' },
  { name: 'Charcoal', hex: '#3f3f46' },
  { name: 'Grey', hex: '#9ca3af' },
  { name: 'White', hex: '#fafaf9' },
  { name: 'Cream', hex: '#efe8d8' },
  { name: 'Beige', hex: '#d8c4a5' },
  { name: 'Camel', hex: '#b08d57' },
  { name: 'Brown', hex: '#6b4f3a' },
  { name: 'Navy', hex: '#1f2a44' },
  { name: 'Blue', hex: '#3b6fb5' },
  { name: 'Light Blue', hex: '#93c5fd' },
  { name: 'Teal', hex: '#0f7d7d' },
  { name: 'Green', hex: '#4d7c4d' },
  { name: 'Olive', hex: '#6b7f3a' },
  { name: 'Burgundy', hex: '#7b2d3a' },
  { name: 'Red', hex: '#b91c1c' },
  { name: 'Pink', hex: '#e59ab0' },
  { name: 'Orange', hex: '#d97a3b' },
  { name: 'Yellow', hex: '#e3b341' },
  { name: 'Purple', hex: '#7c5cbf' },
];
