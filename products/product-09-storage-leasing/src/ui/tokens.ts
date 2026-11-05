// Single source of truth for the P09 palette.
//
// Raw colour values live ONLY here. They are consumed in two places:
//   1. src/theme.ts  -> createTheme + cssVariablesResolver -> Mantine CSS vars
//   2. src/ui/color.ts -> contrast() invariant used by tests
// src/styles.css MUST NOT contain hex values; it references var(--p09-*) /
// var(--mantine-*) / structural vars only. This avoids the TS/CSS duplication
// and FOUC/override issues that the old hand-maintained :root block had.
//
// Palette rationale (see audit):
//   - Teal primary: the only accent that passes AA on the dark surfaces and
//     is distinct from the amber warning colour.
//   - Brass reserved for MONEY figures (rent, charges) only.
//   - Status = green/amber/red, distinct from both teal and brass.
//   - Warm-neutral dark surfaces (no slate/navy drift between dock and body).

export const palette = {
  // Ink (text on primary)
  tealInk: '#01211D',
  brassInk: '#1A1206',
  // Primary (teal)
  teal: '#14B8A6',
  tealLight: '#2DD4BF',
  tealDark: '#0D9488',
  tealMuted: 'rgba(20, 184, 166, 0.16)',
  // Money (brass)
  brass: '#D99A2B',
  brassLight: '#E8B455',
  brassDark: '#B8860B',
  brassMuted: 'rgba(217, 154, 43, 0.16)',
  // Status
  success: '#22C55E',
  successInk: '#052E16',
  warn: '#F59E0B',
  warnInk: '#1C1300',
  danger: '#EF4444',
  dangerInk: '#1F0A0A',
  // Surfaces (warm neutral dark)
  bg0: '#0B0D0C',
  bg1: '#121413',
  bg2: '#1A1D1B',
  bg3: '#232724',
  bg4: '#2E332F',
  // Borders
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.14)',
  // Text
  text1: '#F4F4F2',
  text2: '#B6B8B3',
  text3: '#8A8D87',
  text4: '#62655F',
  // Focus ring (distinct from accent fill)
  focus: '#5EEAD4',
} as const;

export type Palette = typeof palette;
export type PaletteKey = keyof Palette;

// Contrast-critical pairs that MUST pass WCAG 2.1 AA (>= 4.5:1) for normal text.
// Encoded here so the regression test in tests/contrast.test.ts can assert them.
export const contrastPairs: ReadonlyArray<{ fg: string; bg: string; min: number }> = [
  { fg: palette.text1, bg: palette.bg1, min: 4.5 },
  { fg: palette.text2, bg: palette.bg1, min: 4.5 },
  { fg: palette.text3, bg: palette.bg1, min: 4.5 },
  { fg: palette.tealInk, bg: palette.teal, min: 4.5 },
  { fg: palette.tealInk, bg: palette.tealLight, min: 4.5 },
  { fg: palette.brassInk, bg: palette.brass, min: 4.5 },
  { fg: palette.brassInk, bg: palette.brassLight, min: 4.5 },
  { fg: palette.successInk, bg: palette.success, min: 4.5 },
  { fg: palette.warnInk, bg: palette.warn, min: 4.5 },
  { fg: palette.dangerInk, bg: palette.danger, min: 4.5 },
  { fg: palette.teal, bg: palette.bg1, min: 4.5 },
  { fg: palette.brass, bg: palette.bg1, min: 4.5 },
  { fg: palette.focus, bg: palette.bg1, min: 4.5 },
];