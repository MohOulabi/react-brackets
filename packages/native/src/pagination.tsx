import type { Round } from '@react-brackets/core';
import {
  type Context,
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { type LayoutRectangle, Text, View, type ViewProps, type ViewStyle } from 'react-native';
import { Pressable, ScrollView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { resolveStyle, type StyleOf, useBracket, usePagination, useRoot } from './context';
import { valueAt } from './geometry';

interface Tabs {
  /** Where each round's button sits, by round. */
  layouts: LayoutRectangle[];
  place: (index: number, layout: LayoutRectangle) => void;
}

const TabsContext: Context<Tabs | null> = createContext<Tabs | null>(null);

/** What `Bracket.Pagination` and `Bracket.PageIndicator` pass to a `style` function. */
export interface PaginationPartState {
  /** The round in focus, counting from 0. */
  page: number;
}

export interface PaginationProps extends Omit<ViewProps, 'style'> {
  /** A style, or a function of the page. */
  style?: StyleOf<PaginationPartState, ViewStyle>;
  /**
   * Your own row: `Bracket.PageButton`, `Bracket.PreviousPage`, `Bracket.NextPage`,
   * `Bracket.PageIndicator`, or anything built on `usePagination`.
   * @defaultValue a tab for every round, with a marker that follows the swipe
   */
  children?: ReactNode;
}

/**
 * The rounds as tabs, under the paged view; nothing while the whole tree shows.
 * The marker under them follows a swipe as it happens, not after it lands.
 */
export function Pagination({ style: styleOf, children, ...props }: PaginationProps): ReactNode {
  const { paged, dir, group, page } = useRoot('Pagination');
  const { labels } = useBracket();
  const [layouts, setLayouts] = useState<LayoutRectangle[]>([]);
  const place = useCallback((index: number, layout: LayoutRectangle) => {
    setLayouts((current) => {
      const next = [...current];
      next[index] = layout;
      return next;
    });
  }, []);
  const tabs = useMemo(() => ({ layouts, place }), [layouts, place]);
  if (!paged) return null;
  const style = resolveStyle(styleOf, { page });

  if (children !== undefined) {
    return (
      <TabsContext.Provider value={tabs}>
        <View
          accessibilityRole="tablist"
          accessibilityLabel={labels.rounds}
          {...props}
          style={[{ flexDirection: 'row', alignItems: 'center', paddingTop: 12 }, style]}
        >
          {children}
        </View>
      </TabsContext.Provider>
    );
  }
  const rtl = dir === 'rtl';
  return (
    <TabsContext.Provider value={tabs}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        // The gap sits on the row itself, so a `style` can move it when the tabs go above the bracket.
        style={[{ direction: 'ltr', paddingTop: 12 }, style]}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: rtl ? 'flex-end' : 'flex-start',
        }}
        accessibilityRole="tablist"
        accessibilityLabel={labels.rounds}
        {...props}
      >
        <View style={{ flexDirection: rtl ? 'row-reverse' : 'row' }}>
          <PageIndicator />
          {group.rounds.map((round, index) => (
            <PageButton key={round.id} index={index} />
          ))}
        </View>
      </ScrollView>
    </TabsContext.Provider>
  );
}

export interface PageButtonState {
  round: Round;
  index: number;
  /** `true` for the round in focus. */
  active: boolean;
}

export interface PageButtonProps {
  /** The round it shows, counting from 0. */
  index: number;
  /** A style, or a function of the button's state. */
  style?: StyleOf<PageButtonState, ViewStyle>;
  /** Replaces the round's name, or renders from the button's state. */
  children?: ReactNode | ((state: PageButtonState) => ReactNode);
}

/** A round's tab: its name by default. `Bracket.PageIndicator` slides to the one in focus. */
export function PageButton({ index, style, children }: PageButtonProps): ReactNode {
  const { rounds, page, setPage } = usePagination();
  const { theme } = useBracket();
  const tabs = useContext(TabsContext);
  const round = rounds[index];
  if (!round) return null;
  const state: PageButtonState = { round, index, active: index === page };
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: state.active }}
      onPress={() => setPage(index)}
      onLayout={({ nativeEvent }) => tabs?.place(index, nativeEvent.layout)}
      style={[{ paddingHorizontal: 14, paddingVertical: 7 }, resolveStyle(style, state)]}
    >
      {typeof children === 'function'
        ? children(state)
        : (children ?? (
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
          ))}
    </Pressable>
  );
}

export interface PageIndicatorProps {
  /** A style, or a function of the page. */
  style?: StyleOf<PaginationPartState, ViewStyle>;
}

/**
 * The pill behind the tab in focus. It follows the finger during a swipe, on the UI
 * thread, sliding and resizing between the tabs it passes.
 */
export function PageIndicator({ style }: PageIndicatorProps): ReactNode {
  const { rounds, page, position } = usePagination();
  const { theme } = useBracket();
  const layouts = useContext(TabsContext)?.layouts ?? [];
  const measured = layouts.filter(Boolean).length === rounds.length;
  const xs = layouts.map((tab) => tab?.x ?? 0);
  const widths = layouts.map((tab) => tab?.width ?? 0);
  const marker = useAnimatedStyle(() => ({
    opacity: measured ? 1 : 0,
    width: valueAt(widths, position.value),
    transform: [{ translateX: valueAt(xs, position.value) }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          borderRadius: 999,
          backgroundColor: theme.colors.accentSoft,
        },
        resolveStyle(style, { page }),
        marker,
      ]}
    />
  );
}

export interface StepButtonState {
  /** `true` on the first round for previous, and the last for next. */
  disabled: boolean;
}

export interface StepButtonProps {
  /** A style, or a function of the button's state. */
  style?: StyleOf<StepButtonState, ViewStyle>;
  /** Replaces the arrow, or renders from the button's state. */
  children?: ReactNode | ((state: StepButtonState) => ReactNode);
}

/** Pages to the round before. */
export function PreviousPage(props: StepButtonProps): ReactNode {
  const { previous, canPrevious } = usePagination();
  const { labels } = useBracket();
  const { dir } = useRoot('PreviousPage');
  return (
    <StepButton
      {...props}
      icon={dir === 'rtl' ? '›' : '‹'}
      label={labels.previous}
      disabled={!canPrevious}
      onPress={previous}
    />
  );
}

/** Pages to the round after. */
export function NextPage(props: StepButtonProps): ReactNode {
  const { next, canNext } = usePagination();
  const { labels } = useBracket();
  const { dir } = useRoot('NextPage');
  return (
    <StepButton
      {...props}
      icon={dir === 'rtl' ? '‹' : '›'}
      label={labels.next}
      disabled={!canNext}
      onPress={next}
    />
  );
}

function StepButton({
  icon,
  label,
  disabled,
  onPress,
  style,
  children,
}: StepButtonProps & {
  icon: string;
  label: string;
  disabled: boolean;
  onPress: () => void;
}): ReactNode {
  const { theme } = useBracket();
  const state = { disabled };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={[{ paddingHorizontal: 10, paddingVertical: 4 }, resolveStyle(style, state)]}
    >
      {typeof children === 'function'
        ? children(state)
        : (children ?? (
            <Text
              style={{
                color: disabled ? theme.colors.textMuted : theme.colors.text,
                fontSize: 22,
              }}
            >
              {icon}
            </Text>
          ))}
    </Pressable>
  );
}
