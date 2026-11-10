import { Bracket, type TreeMode } from '@react-brackets/native';
import { StatusBar } from 'expo-status-bar';
import { type ReactNode, useState } from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';
import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { CustomDemo } from './custom';
import { cup } from './data';
import { TailwindDemo } from './tailwind';
import { UnistylesDemo } from './unistyles/demo';

const demos = ['Bracket', 'Tree', 'Custom', 'Themes'] as const;
type Demo = (typeof demos)[number];

export function App(): ReactNode {
  const dark = useColorScheme() === 'dark';
  const [demo, setDemo] = useState<Demo>('Bracket');
  const ink = dark ? '#fafafa' : '#18181b';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <SafeAreaView style={{ flex: 1, backgroundColor: dark ? '#09090b' : '#f8fafc' }}>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
            <View style={{ gap: 4 }}>
              <Text style={{ color: ink, fontSize: 28, fontWeight: '800' }}>react-brackets</Text>
              <Text style={{ color: dark ? '#a1a1aa' : '#52525b', fontSize: 15 }}>
                Native gestures, every frame on the UI thread.
              </Text>
            </View>
            <Segmented options={demos} value={demo} onChange={setDemo} dark={dark} />
            {demo === 'Bracket' && <PagedDemo />}
            {demo === 'Tree' && <TreeDemo dark={dark} />}
            {demo === 'Custom' && <CustomDemo dark={dark} />}
            {demo === 'Themes' && <ThemesDemo />}
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function PagedDemo(): ReactNode {
  return <Bracket stage={cup} />;
}

const modes: TreeMode[] = ['scroll', 'fit', 'pan-zoom'];

function TreeDemo({ dark }: { dark: boolean }): ReactNode {
  const [mode, setMode] = useState<TreeMode>('pan-zoom');
  return (
    <View style={{ gap: 16 }}>
      <Segmented options={modes} value={mode} onChange={setMode} dark={dark} />
      <Bracket stage={cup} compactBelow={0} mode={mode} />
    </View>
  );
}

function ThemesDemo(): ReactNode {
  return (
    <View style={{ gap: 24 }}>
      <TailwindDemo />
      <UnistylesDemo />
    </View>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
  dark,
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  dark: boolean;
}): ReactNode {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignSelf: 'flex-start',
        padding: 3,
        borderRadius: 999,
        backgroundColor: dark ? '#27272a' : '#e4e4e7',
      }}
    >
      {options.map((option) => (
        <Pressable
          key={option}
          accessibilityRole="button"
          accessibilityState={{ selected: option === value }}
          onPress={() => onChange(option)}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 7,
            borderRadius: 999,
            backgroundColor: option === value ? (dark ? '#3f3f46' : '#ffffff') : 'transparent',
          }}
        >
          <Text style={{ color: dark ? '#fafafa' : '#18181b', fontWeight: '600' }}>{option}</Text>
        </Pressable>
      ))}
    </View>
  );
}
