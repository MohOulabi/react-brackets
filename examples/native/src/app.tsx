import { StatusBar } from 'expo-status-bar';
import { type ReactNode, useEffect, useState } from 'react';
import { Linking, Pressable, Text, useColorScheme, View } from 'react-native';
import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { type Example, examples } from './catalog';

export function App(): ReactNode {
  const dark = useColorScheme() === 'dark';
  const [open, setOpen] = useState<Example | null>(null);

  // A link like dev.oulabi.reactbrackets://example/live-scores opens that example.
  useEffect(() => {
    const show = (url?: string | null) => {
      const slug = url?.match(/example\/([\w-]+)/)?.[1];
      const example = examples.find((item) => item.slug === slug);
      if (example) setOpen(example);
    };
    Linking.getInitialURL().then(show);
    const subscription = Linking.addEventListener('url', ({ url }) => show(url));
    return () => subscription.remove();
  }, []);
  const colors = {
    page: dark ? '#09090b' : '#f8fafc',
    ink: dark ? '#fafafa' : '#18181b',
    muted: dark ? '#a1a1aa' : '#71717a',
    card: dark ? '#18181b' : '#ffffff',
    line: dark ? '#27272a' : '#e4e4e7',
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.page }}>
          {open ? (
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Pressable onPress={() => setOpen(null)} hitSlop={12} accessibilityRole="button">
                  <Text style={{ fontSize: 17, color: '#2563eb' }}>‹ Examples</Text>
                </Pressable>
              </View>
              <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 4, gap: 20 }}>
                <Text style={{ fontSize: 30, fontWeight: '800', color: colors.ink }}>
                  {open.title}
                </Text>
                <open.Screen />
              </ScrollView>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 20, gap: 24 }}>
              <View style={{ gap: 6, paddingTop: 12 }}>
                <Text style={{ fontSize: 34, fontWeight: '800', color: colors.ink }}>
                  react-brackets
                </Text>
                <Text style={{ fontSize: 16, color: colors.muted }}>
                  Tournament brackets for React Native.
                </Text>
              </View>
              <View
                style={{
                  overflow: 'hidden',
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.line,
                  backgroundColor: colors.card,
                }}
              >
                {examples.map((example, index) => (
                  <Pressable
                    key={example.slug}
                    accessibilityRole="button"
                    onPress={() => setOpen(example)}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      borderTopWidth: index === 0 ? 0 : 1,
                      borderTopColor: colors.line,
                      backgroundColor: pressed ? colors.line : 'transparent',
                    })}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ fontSize: 17, fontWeight: '600', color: colors.ink }}>
                        {example.title}
                      </Text>
                      <Text style={{ fontSize: 14, color: colors.muted }}>{example.summary}</Text>
                    </View>
                    <Text style={{ fontSize: 20, color: colors.muted }}>›</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
