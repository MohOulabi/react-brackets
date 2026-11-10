import { Bracket } from '@react-brackets/native';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { StyleSheet, UnistylesRuntime, withUnistyles } from 'react-native-unistyles';
import { cup } from '../data';

// The bracket takes its theme from Unistyles, and follows it when the theme changes.
const ThemedBracket = withUnistyles(Bracket, (theme) => ({
  theme: { colors: theme.bracket, radius: 14 },
}));

export function UnistylesDemo(): ReactNode {
  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <Text style={styles.title}>Unistyles</Text>
        <View style={styles.switch}>
          {(['light', 'dark'] as const).map((name) => (
            <Pressable
              key={name}
              accessibilityRole="button"
              onPress={() => {
                UnistylesRuntime.setAdaptiveThemes(false);
                UnistylesRuntime.setTheme(name);
              }}
              style={styles.option}
            >
              <Text style={styles.label}>{name === 'light' ? 'Light' : 'Dark'}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <ThemedBracket stage={cup} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  panel: { gap: 16, padding: 16, borderRadius: 20, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  switch: { flexDirection: 'row', gap: 6 },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: theme.colors.card,
  },
  label: { fontWeight: '600', color: theme.colors.text },
}));
