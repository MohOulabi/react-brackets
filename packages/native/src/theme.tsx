import { createContext, type ReactNode, useContext } from 'react';
import { useColorScheme } from 'react-native';

export interface BracketColors {
  text: string;
  textMuted: string;
  /** Match cards. */
  surface: string;
  /** A match card while it is pressed. */
  surfacePressed: string;
  border: string;
  /** Connector lines. */
  line: string;
  /** Winner scores, the highlighted path, the current page. */
  accent: string;
  /** The background of highlighted rows. */
  accentSoft: string;
  /** The border of a live match. */
  live: string;
}

/** Everything the default look is drawn from. Sizes are in points. */
export interface BracketTheme {
  colors: BracketColors;
  radius: number;
  lineWidth: number;
  /** Rounds the corners of connector lines. */
  connectorRadius: number;
  /** Card width in the full tree. In the paged view, cards take the width of the round in focus. */
  matchWidth: number;
  /** Space between matches in a round. */
  matchGap: number;
  /** Space between rounds in the full tree. */
  columnGap: number;
  /** Space between rounds in the paged view. */
  pagedColumnGap: number;
  /** Height of the row of round titles. */
  titleHeight: number;
  fontFamily?: string;
  fontSize: number;
  titleFontSize: number;
}

const sizes = {
  radius: 10,
  lineWidth: 1.5,
  connectorRadius: 8,
  matchWidth: 200,
  matchGap: 12,
  columnGap: 40,
  pagedColumnGap: 20,
  titleHeight: 32,
  fontSize: 15,
  titleFontSize: 12,
};

export const lightTheme: BracketTheme = {
  ...sizes,
  colors: {
    text: '#18181b',
    textMuted: '#71717a',
    surface: '#ffffff',
    surfacePressed: '#f4f4f5',
    border: '#e4e4e7',
    line: '#d4d4d8',
    accent: '#2563eb',
    accentSoft: 'rgba(37, 99, 235, 0.12)',
    live: '#ef4444',
  },
};

export const darkTheme: BracketTheme = {
  ...sizes,
  colors: {
    text: '#fafafa',
    textMuted: '#a1a1aa',
    surface: '#18181b',
    surfacePressed: '#27272a',
    border: '#3f3f46',
    line: '#52525b',
    accent: '#60a5fa',
    accentSoft: 'rgba(96, 165, 250, 0.16)',
    live: '#f87171',
  },
};

/** A partial theme, merged over a full one. Colours merge one by one. */
export type ThemeOverrides = Partial<Omit<BracketTheme, 'colors'>> & {
  colors?: Partial<BracketColors>;
};

/** A theme built from `base` with some values replaced. */
export function createTheme(
  overrides: ThemeOverrides,
  base: BracketTheme = lightTheme,
): BracketTheme {
  return { ...base, ...overrides, colors: { ...base.colors, ...overrides.colors } };
}

const ThemeContext = createContext<BracketTheme | null>(null);

/** Sets the theme for every bracket inside it. */
export function BracketThemeProvider({
  theme,
  children,
}: {
  theme: BracketTheme;
  children: ReactNode;
}): ReactNode {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

/**
 * The theme a bracket draws with: its own `theme` prop, else the nearest
 * provider, else the light or dark theme to match the device.
 */
export function useBracketTheme(override?: ThemeOverrides): BracketTheme {
  const provided = useContext(ThemeContext);
  const scheme = useColorScheme();
  const base = provided ?? (scheme === 'dark' ? darkTheme : lightTheme);
  return override ? createTheme(override, base) : base;
}
