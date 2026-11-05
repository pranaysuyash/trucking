import { describe, it, expect } from 'vitest';
import { contrast, relativeLuminance } from '../src/ui/color';
import { contrastPairs } from '../src/ui/tokens';

describe('color contrast', () => {
  it('relativeLuminance is in [0,1]', () => {
    expect(relativeLuminance('#000000')).toBe(0);
    expect(relativeLuminance('#ffffff')).toBe(1);
  });
  it('contrast is symmetric', () => {
    expect(contrast('#14B8A6', '#121413')).toBeCloseTo(contrast('#121413', '#14B8A6'), 6);
  });
  it('every palette contrast pair passes its minimum', () => {
    for (const p of contrastPairs) {
      const c = contrast(p.fg, p.bg);
      expect(c, `${p.fg} on ${p.bg}: ${c.toFixed(2)} < ${p.min}`).toBeGreaterThanOrEqual(p.min);
    }
  });
  it('regression: old accent #1e40af on #181818 fails AA (documents the bug)', () => {
    expect(contrast('#1e40af', '#181818')).toBeLessThan(4.5);
  });
  it('new teal primary passes AA on bg-1', () => {
    expect(contrast('#14B8A6', '#121413')).toBeGreaterThanOrEqual(4.5);
  });
});