import type { Round } from '@react-brackets/core';
import { type ReactNode, useState } from 'react';
import { type LayoutRectangle, Text, View } from 'react-native';
import { Pressable, ScrollView } from 'react-native-gesture-handler';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { valueAt } from './geometry';
import type { BracketTheme } from './theme';

/** The rounds as tabs. The marker under them follows a swipe as it happens, not after it lands. */
export function Pagination({
  rounds,
  page,
  position,
  theme,
  rtl,
  onSelect,
}: {
  rounds: Round[];
  page: number;
  position: SharedValue<number>;
  theme: BracketTheme;
  rtl: boolean;
  onSelect: (page: number) => void;
}): ReactNode {
  const [tabs, setTabs] = useState<LayoutRectangle[]>([]);
  const measured = tabs.filter(Boolean).length === rounds.length;
  const xs = tabs.map((tab) => tab.x);
  const widths = tabs.map((tab) => tab.width);
  const marker = useAnimatedStyle(() => ({
    opacity: measured ? 1 : 0,
    width: valueAt(widths, position.value),
    transform: [{ translateX: valueAt(xs, position.value) }],
  }));

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ direction: 'ltr' }}
      contentContainerStyle={{
        flexGrow: 1,
        paddingTop: 12,
        justifyContent: rtl ? 'flex-end' : 'flex-start',
      }}
      accessibilityRole="tablist"
    >
      <View style={{ flexDirection: rtl ? 'row-reverse' : 'row' }}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              borderRadius: 999,
              backgroundColor: theme.colors.accentSoft,
            },
            marker,
          ]}
        />
        {rounds.map((round, index) => (
          <Pressable
            key={round.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: index === page }}
            onPress={() => onSelect(index)}
            onLayout={({ nativeEvent }) =>
              setTabs((current) => {
                const next = [...current];
                next[index] = nativeEvent.layout;
                return next;
              })
            }
            style={{ paddingHorizontal: 14, paddingVertical: 7 }}
          >
            <Text
              style={{
                color: theme.colors.text,
                fontFamily: theme.fontFamily,
                fontSize: theme.titleFontSize + 1,
                fontWeight: '500',
              }}
            >
              {round.name}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
