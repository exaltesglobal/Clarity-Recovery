import { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';

export interface Theme {
  dark: boolean;
  bg: string;
  card: string;
  cardAlt: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
  onPrimary: string;
  accent: string;
  danger: string;
  onDanger: string;
  dangerSoft: string;
  gold: string;
  goldSoft: string;
  gradient: [string, string];
  fonts: Fonts;
}

export interface Fonts {
  regular?: string;
  semibold?: string;
  bold?: string;
  heavy?: string;
}

export type ThemeId = 'serene' | 'dawn' | 'ocean' | 'forest' | 'sand';
export type ColorMode = 'system' | 'light' | 'dark';

export interface Appearance {
  themeId: ThemeId;
  /** Optional custom accent replacing the theme's primary colour */
  accent: string | null;
  mode: ColorMode;
}

export const DEFAULT_APPEARANCE: Appearance = { themeId: 'serene', accent: null, mode: 'system' };

type Base = Omit<Theme, 'dark' | 'onPrimary' | 'accent' | 'onDanger' | 'fonts' | 'gradient'> & {
  gradient?: [string, string];
};

const PRESETS: Record<ThemeId, { light: Base; dark: Base }> = {
  serene: {
    light: {
      bg: '#F5F3EE', card: '#FFFFFF', cardAlt: '#EEF4F2', text: '#1B2B2A', muted: '#5D6D6A',
      border: '#E3DED5', primary: '#2E6E6A', danger: '#C0564B', dangerSoft: '#F8E7E4',
      gold: '#B97A2F', goldSoft: '#F7EBDA', gradient: ['#2E6E6A', '#5E9C8F'],
    },
    dark: {
      bg: '#0F1716', card: '#172221', cardAlt: '#1C2B29', text: '#E7EFEC', muted: '#9AACA7',
      border: '#26332F', primary: '#74BDB1', danger: '#E07B70', dangerSoft: '#3A211E',
      gold: '#E2AE63', goldSoft: '#33281A', gradient: ['#1F4D4A', '#2E6E6A'],
    },
  },
  dawn: {
    light: {
      bg: '#F6F4FA', card: '#FFFFFF', cardAlt: '#EFECF8', text: '#221F33', muted: '#655F7A',
      border: '#E3DFEE', primary: '#6A5FA6', danger: '#C0564B', dangerSoft: '#F8E7E4',
      gold: '#B97A2F', goldSoft: '#F7EBDA', gradient: ['#6A5FA6', '#B78FC4'],
    },
    dark: {
      bg: '#13111C', card: '#1C1A28', cardAlt: '#242135', text: '#ECE9F6', muted: '#A8A2BE',
      border: '#2D2A3E', primary: '#A99BE6', danger: '#E07B70', dangerSoft: '#3A211E',
      gold: '#E2AE63', goldSoft: '#33281A', gradient: ['#3E3670', '#6A5FA6'],
    },
  },
  ocean: {
    light: {
      bg: '#F2F6F9', card: '#FFFFFF', cardAlt: '#E8F0F6', text: '#17263A', muted: '#586A7E',
      border: '#DCE5EE', primary: '#2D6A99', danger: '#C0564B', dangerSoft: '#F8E7E4',
      gold: '#B97A2F', goldSoft: '#F7EBDA', gradient: ['#2D6A99', '#4FA3B8'],
    },
    dark: {
      bg: '#0D141C', card: '#152030', cardAlt: '#1B2A3C', text: '#E6EEF6', muted: '#97A9BC',
      border: '#243447', primary: '#6FB0E0', danger: '#E07B70', dangerSoft: '#3A211E',
      gold: '#E2AE63', goldSoft: '#33281A', gradient: ['#1C4466', '#2D6A99'],
    },
  },
  forest: {
    light: {
      bg: '#F3F5EF', card: '#FFFFFF', cardAlt: '#EAF0E4', text: '#1E2A1C', muted: '#5F6B5B',
      border: '#DFE5D7', primary: '#456E3D', danger: '#C0564B', dangerSoft: '#F8E7E4',
      gold: '#B97A2F', goldSoft: '#F7EBDA', gradient: ['#456E3D', '#83A16B'],
    },
    dark: {
      bg: '#10150E', card: '#182016', cardAlt: '#1F2A1C', text: '#E8EFE5', muted: '#A0AE9B',
      border: '#28331F', primary: '#93C487', danger: '#E07B70', dangerSoft: '#3A211E',
      gold: '#E2AE63', goldSoft: '#33281A', gradient: ['#2D4A28', '#456E3D'],
    },
  },
  sand: {
    light: {
      bg: '#F8F4EC', card: '#FFFFFF', cardAlt: '#F3EBDD', text: '#2D2418', muted: '#6E6252',
      border: '#E8DFCF', primary: '#94683D', danger: '#C0564B', dangerSoft: '#F8E7E4',
      gold: '#B97A2F', goldSoft: '#F7EBDA', gradient: ['#94683D', '#C99A64'],
    },
    dark: {
      bg: '#17130E', card: '#211B14', cardAlt: '#2A2219', text: '#F2EADF', muted: '#B3A795',
      border: '#352B20', primary: '#DDA972', danger: '#E07B70', dangerSoft: '#3A211E',
      gold: '#E2AE63', goldSoft: '#33281A', gradient: ['#5E4126', '#94683D'],
    },
  },
};

export const THEME_IDS = Object.keys(PRESETS) as ThemeId[];

export const ACCENT_SWATCHES = [
  '#2E6E6A', '#2D6A99', '#6A5FA6', '#456E3D', '#94683D', '#B5536C', '#3E7CB1', '#7A5C99',
];

export function previewColor(id: ThemeId, dark = false) {
  return PRESETS[id][dark ? 'dark' : 'light'].primary;
}

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex([r, g, b]: number[]) {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}

export function mix(a: string, b: string, t: number) {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  return rgbToHex(x.map((v, i) => v + (y[i] - v) * t));
}

function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function readableOn(bg: string) {
  return luminance(bg) > 0.4 ? '#0B1A18' : '#FFFFFF';
}

export function buildTheme(appearance: Appearance, systemDark: boolean, fonts: Fonts): Theme {
  const dark = appearance.mode === 'dark' || (appearance.mode === 'system' && systemDark);
  const base = PRESETS[appearance.themeId] ?? PRESETS.serene;
  const p = dark ? base.dark : base.light;
  const primary = appearance.accent
    ? dark
      ? mix(appearance.accent, '#FFFFFF', 0.35)
      : appearance.accent
    : p.primary;
  const gradient: [string, string] = appearance.accent
    ? [mix(appearance.accent, '#000000', dark ? 0.35 : 0), mix(appearance.accent, '#FFFFFF', dark ? 0.1 : 0.3)]
    : (p.gradient ?? [primary, primary]);
  return {
    ...p,
    dark,
    primary,
    onPrimary: readableOn(primary),
    accent: mix(p.card, primary, dark ? 0.18 : 0.12),
    onDanger: readableOn(p.danger),
    gradient,
    fonts,
  };
}

export const ThemeContext = createContext<Theme | null>(null);

/** Fallback used before the store has loaded (e.g. the splash/loading view). */
export function useFallbackTheme(): Theme {
  const dark = useColorScheme() === 'dark';
  return buildTheme(DEFAULT_APPEARANCE, dark, {});
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  const fallback = useFallbackTheme();
  return ctx ?? fallback;
}
