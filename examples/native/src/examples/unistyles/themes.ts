import { StyleSheet } from 'react-native-unistyles';

const light = {
  colors: { background: '#f4f1ea', card: '#fffdf8', text: '#2b2118', muted: '#8a7b6c' },
  bracket: {
    text: '#2b2118',
    textMuted: '#8a7b6c',
    surface: '#fffdf8',
    surfacePressed: '#f1ebe0',
    border: '#e4dccf',
    line: '#cfc3b2',
    accent: '#c2410c',
    accentSoft: 'rgba(194, 65, 12, 0.12)',
    live: '#dc2626',
  },
};

const dark: typeof light = {
  colors: { background: '#1a1512', card: '#251e19', text: '#f4ede4', muted: '#a8998a' },
  bracket: {
    text: '#f4ede4',
    textMuted: '#a8998a',
    surface: '#251e19',
    surfacePressed: '#30271f',
    border: '#3b3027',
    line: '#54463a',
    accent: '#fb923c',
    accentSoft: 'rgba(251, 146, 60, 0.16)',
    live: '#f87171',
  },
};

type Themes = { light: typeof light; dark: typeof light };

declare module 'react-native-unistyles' {
  export interface UnistylesThemes extends Themes {}
}

StyleSheet.configure({
  themes: { light, dark },
  settings: { adaptiveThemes: true },
});
