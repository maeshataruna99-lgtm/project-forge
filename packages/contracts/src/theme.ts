export const themePresets = {
  'modern-saas': { label: 'Modern SaaS', light: { background: '#F8FAFC', surface: '#FFFFFF', text: '#172033', primary: '#2563EB', accent: '#F59E0B' }, dark: { background: '#111827', surface: '#1F2937', text: '#F9FAFB', primary: '#60A5FA', accent: '#FBBF24' } },
  'ecommerce-store': { label: 'E-commerce Store', light: { background: '#FFF9F5', surface: '#FFFFFF', text: '#2B211D', primary: '#C2410C', accent: '#047857' }, dark: { background: '#1C1917', surface: '#292524', text: '#FAFAF9', primary: '#FB923C', accent: '#34D399' } },
  'admin-dashboard': { label: 'Admin Dashboard', light: { background: '#F1F5F9', surface: '#FFFFFF', text: '#0F172A', primary: '#4F46E5', accent: '#0891B2' }, dark: { background: '#0F172A', surface: '#1E293B', text: '#F8FAFC', primary: '#818CF8', accent: '#22D3EE' } },
  pos: { label: 'POS', light: { background: '#F8FAF5', surface: '#FFFFFF', text: '#1F2933', primary: '#15803D', accent: '#B45309' }, dark: { background: '#111C18', surface: '#1C2B24', text: '#F0FDF4', primary: '#4ADE80', accent: '#FBBF24' } },
  'warehouse-industrial': { label: 'Warehouse Industrial', light: { background: '#F4F5F7', surface: '#FFFFFF', text: '#202936', primary: '#334155', accent: '#D97706' }, dark: { background: '#171C23', surface: '#242B35', text: '#F1F5F9', primary: '#94A3B8', accent: '#FBBF24' } },
  'soft-pastel': { label: 'Soft Pastel', light: { background: '#FFF7FB', surface: '#FFFFFF', text: '#35283C', primary: '#9D4EDD', accent: '#DB2777' }, dark: { background: '#211827', surface: '#302337', text: '#FFF7FC', primary: '#D8A4F5', accent: '#F9A8D4' } },
  'dark-developer': { label: 'Dark Developer', light: { background: '#F4F4F5', surface: '#FFFFFF', text: '#18181B', primary: '#52525B', accent: '#0284C7' }, dark: { background: '#09090B', surface: '#18181B', text: '#FAFAFA', primary: '#A1A1AA', accent: '#38BDF8' } },
  corporate: { label: 'Corporate', light: { background: '#F3F6FA', surface: '#FFFFFF', text: '#182638', primary: '#1D4ED8', accent: '#0F766E' }, dark: { background: '#111B2B', surface: '#1C2B40', text: '#F1F5F9', primary: '#93C5FD', accent: '#5EEAD4' } },
} as const;

export type ThemePreset = keyof typeof themePresets;
export type ThemeMode = 'light' | 'dark';
export type ThemePalette = 'blue' | 'emerald' | 'purple' | 'amber' | 'rose' | 'custom';
export type ThemeRadius = 'none' | 'small' | 'medium' | 'large';
export type ThemeShadow = 'none' | 'subtle' | 'medium' | 'strong';
export type ThemeDensity = 'compact' | 'comfortable';

const palettes: Record<Exclude<ThemePalette, 'custom'>, { primary: string; accent: string }> = {
  blue: { primary: '#2563EB', accent: '#F59E0B' },
  emerald: { primary: '#047857', accent: '#D97706' },
  purple: { primary: '#7E22CE', accent: '#DB2777' },
  amber: { primary: '#B45309', accent: '#0369A1' },
  rose: { primary: '#BE123C', accent: '#0F766E' },
};

export function getPaletteColors(palette: ThemePalette): { primary: string; accent: string } | undefined {
  return palette === 'custom' ? undefined : palettes[palette];
}

export function getPresetColors(preset: ThemePreset, mode: ThemeMode): { primary: string; accent: string } {
  return themePresets[preset][mode];
}

export type ThemeInput = {
  preset: ThemePreset;
  palette: ThemePalette;
  mode: ThemeMode;
  primary: string;
  accent: string;
  radius: ThemeRadius;
  shadow: ThemeShadow;
  density: ThemeDensity;
};

export function resolveThemeTokens(theme: ThemeInput) {
  const modeTokens = themePresets[theme.preset][theme.mode];
  return {
    ...modeTokens,
    primary: theme.primary,
    accent: theme.accent,
    radius: ({ none: '0', small: '0.25rem', medium: '0.5rem', large: '1rem' } as const)[theme.radius],
    shadow: ({ none: 'none', subtle: '0 1px 3px rgb(15 23 42 / 0.1)', medium: '0 4px 12px rgb(15 23 42 / 0.14)', strong: '0 12px 28px rgb(0 0 0 / 0.28)' } as const)[theme.shadow],
    densityGap: ({ compact: '0.75rem', comfortable: '1.5rem' } as const)[theme.density],
  };
}

function linearChannel(hex: string, offset: number): number {
  const channel = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  return 0.2126 * linearChannel(hex, 1) + 0.7152 * linearChannel(hex, 3) + 0.0722 * linearChannel(hex, 5);
}

export function contrastRatio(first: string, second: string): number {
  const high = Math.max(luminance(first), luminance(second));
  const low = Math.min(luminance(first), luminance(second));
  return Math.round(((high + 0.05) / (low + 0.05)) * 100) / 100;
}

export function describeContrast(ratio: number): string {
  return ratio >= 4.5 ? `Contrast ${ratio.toFixed(2)}:1 meets AA for normal text.` : `Contrast ${ratio.toFixed(2)}:1 is below AA for normal text; choose a darker or lighter color.`;
}
