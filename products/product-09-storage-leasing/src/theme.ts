import { createTheme, type MantineThemeOverride } from '@mantine/core';
import { palette } from './ui/tokens';

// Mantine theme derived from src/ui/tokens.ts (single source of truth).
// Colours are exposed via cssVariablesResolver so styles.css can reference
// var(--p09-*) without duplicating hex values.
export const theme: MantineThemeOverride = createTheme({
  primaryColor: 'teal',
  primaryShade: { light: 6, dark: 4 },
  colors: {
    // Mantine expects 10 shades; we anchor on our palette values.
    teal: [
      '#E6FFFA',
      '#CCFBF1',
      '#99F6E4',
      '#5EEAD4',
      '#2DD4BF',
      '#14B8A6',
      '#0D9488',
      '#0F766E',
      '#115E59',
      '#134E4A',
    ],
    brass: [
      '#FDF6E6',
      '#FAE9C5',
      '#F4D28A',
      '#E8B455',
      '#D99A2B',
      '#B8860B',
      '#92690A',
      '#705008',
      '#4E3806',
      '#2E2104',
    ],
  },
  fontFamily: "'Manrope', 'Inter', system-ui, -apple-system, sans-serif",
  fontFamilyMonospace: "'Geist Mono', 'JetBrains Mono', ui-monospace, monospace",
  headings: { fontFamily: "'Manrope', 'Inter', system-ui, sans-serif" },
  defaultRadius: 'md',
  radius: { xs: '4px', sm: '6px', md: '8px', lg: '12px', xl: '16px' },
  spacing: { xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '24px' },
  shadows: {
    xs: '0 1px 2px rgba(0,0,0,0.35)',
    sm: '0 2px 8px rgba(0,0,0,0.4)',
    md: '0 6px 20px rgba(0,0,0,0.45)',
    lg: '0 12px 40px rgba(0,0,0,0.5)',
  },
  other: {
    palette,
  },
});

// Expose raw palette tokens as --p09-* CSS variables so styles.css never
// needs a hex literal. Mantine's own vars (--mantine-*) are merged in.
export const cssVariablesResolver = () => ({
  variables: {
    '--p09-bg-0': palette.bg0,
    '--p09-bg-1': palette.bg1,
    '--p09-bg-2': palette.bg2,
    '--p09-bg-3': palette.bg3,
    '--p09-bg-4': palette.bg4,
    '--p09-border': palette.border,
    '--p09-border-strong': palette.borderStrong,
    '--p09-text-1': palette.text1,
    '--p09-text-2': palette.text2,
    '--p09-text-3': palette.text3,
    '--p09-text-4': palette.text4,
    '--p09-teal': palette.teal,
    '--p09-teal-light': palette.tealLight,
    '--p09-teal-dark': palette.tealDark,
    '--p09-teal-ink': palette.tealInk,
    '--p09-teal-muted': palette.tealMuted,
    '--p09-brass': palette.brass,
    '--p09-brass-light': palette.brassLight,
    '--p09-brass-dark': palette.brassDark,
    '--p09-brass-ink': palette.brassInk,
    '--p09-brass-muted': palette.brassMuted,
    '--p09-success': palette.success,
    '--p09-success-ink': palette.successInk,
    '--p09-warn': palette.warn,
    '--p09-warn-ink': palette.warnInk,
    '--p09-danger': palette.danger,
    '--p09-danger-ink': palette.dangerInk,
    '--p09-focus': palette.focus,
  },
  light: {},
  dark: {},
});