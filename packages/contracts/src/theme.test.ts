import { describe, expect, it } from 'vitest';
import { contrastRatio, resolveThemeTokens } from './theme';

describe('theme registry', () => {
  it('resolves one token set for preview and generated output', () => {
    const theme = {
      preset: 'ecommerce-store', palette: 'emerald', mode: 'dark', primary: '#123456', accent: '#ABCDEF',
      radius: 'large', shadow: 'strong', density: 'compact',
    } as const;
    expect(resolveThemeTokens(theme)).toMatchObject({
      primary: '#123456', accent: '#ABCDEF', background: '#1C1917', surface: '#292524',
      text: '#FAFAF9', radius: '1rem', shadow: '0 12px 28px rgb(0 0 0 / 0.28)', densityGap: '0.75rem',
    });
  });

  it('calculates WCAG contrast deterministically for color feedback', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBe(21);
    expect(contrastRatio('#777777', '#FFFFFF')).toBe(4.48);
  });
});
