import { describe, it, expect } from 'vitest';
import css from '../src/styles.css?raw';

describe('styles.css has no hex colour literals', () => {
  it('contains no #rrggbb / #rgb hex colour tokens', () => {
    // Strip CSS comments first.
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const matches = stripped.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(matches, `found hex literals: ${matches.join(', ')}`).toEqual([]);
  });
});