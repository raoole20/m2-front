import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  Canvas,
  Circle,
  SweepGradient,
  vec,
} from '@shopify/react-native-skia';
import { memo, useEffect, type ComponentType, type ReactElement } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {
  colorsV2,
  Glass,
  Inbox,
  MessageCircle,
  shadowsV2,
  Sparkle4,
  User,
  type IconProps,
} from '@/theme';

type TabKey = 'inbox' | 'channels' | 'ai' | 'profile';

type IconComponent = ComponentType<IconProps>;

const TAB_ORDER: ReadonlyArray<TabKey> = ['inbox', 'channels', 'ai', 'profile'];

const ICON_BY_TAB: Record<TabKey, IconComponent> = {
  inbox: Inbox,
  channels: MessageCircle,
  ai: Sparkle4,
  profile: User,
};

const HIGHLIGHT_COLORS = [
  'rgba(180, 181, 251, 0.55)',
  'rgba(139, 140, 247, 0.45)',
  'rgba(99, 102, 241, 0.35)',
  'rgba(95, 168, 255, 0.45)',
  'rgba(180, 181, 251, 0.55)',
] as const;

const ICON_SIZE = 22;
const HIGHLIGHT_SIZE = 38;
const ACCENT_DOT_SIZE = 4;
const TRANSITION_DURATION = 200;

function routeToTabKey(name: string): TabKey | null {
  if (name === 'inbox' || name.startsWith('inbox/')) return 'inbox';
  if (name === 'channels' || name.startsWith('channels/')) return 'channels';
  if (name === 'ai' || name.startsWith('ai/')) return 'ai';
  if (name === 'profile' || name.startsWith('profile/')) return 'profile';
  return null;
}

type ActiveHighlightProps = {
  size: number;
};

function ActiveHighlight({ size }: ActiveHighlightProps): ReactElement {
  const r = size / 2;
  return (
    <Canvas style={{ width: size, height: size }}>
      <Circle cx={r} cy={r} r={r}>
        <SweepGradient c={vec(r, r)} colors={[...HIGHLIGHT_COLORS]} />
      </Circle>
    </Canvas>
  );
}

type TabButtonProps = {
  tabKey: TabKey;
  active: boolean;
  onPress: () => void;
  onLongPress: () => void;
  accessibilityLabel?: string;
};

function TabButton({
  tabKey,
  active,
  onPress,
  onLongPress,
  accessibilityLabel,
}: TabButtonProps): ReactElement {
  const Icon = ICON_BY_TAB[tabKey];
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, {
      duration: TRANSITION_DURATION,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
    });
  }, [active, progress]);

  const highlightStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.85 + progress.value * 0.15 }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.4 + progress.value * 0.6 }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    opacity: 0.7 + progress.value * 0.3,
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabButton}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.highlightLayer,
          { width: HIGHLIGHT_SIZE, height: HIGHLIGHT_SIZE },
          highlightStyle,
        ]}
      >
        <ActiveHighlight size={HIGHLIGHT_SIZE} />
      </Animated.View>
      <Animated.View style={iconStyle}>
        <Icon size={ICON_SIZE} color="#ffffff" />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.accentDot,
          {
            width: ACCENT_DOT_SIZE,
            height: ACCENT_DOT_SIZE,
            borderRadius: ACCENT_DOT_SIZE / 2,
            backgroundColor: colorsV2.accent[200],
            shadowColor: colorsV2.accent[200],
          },
          dotStyle,
        ]}
      />
    </Pressable>
  );
}

function FloatingTabBarV2Inner(props: BottomTabBarProps): ReactElement {
  const { state, descriptors, navigation } = props;

  const visibleRoutes = state.routes
    .map((route, index) => {
      const tabKey = routeToTabKey(route.name);
      if (tabKey === null) return null;
      return { route, index, tabKey };
    })
    .filter(
      (entry): entry is { route: typeof state.routes[number]; index: number; tabKey: TabKey } =>
        entry !== null,
    )
    .sort((a, b) => TAB_ORDER.indexOf(a.tabKey) - TAB_ORDER.indexOf(b.tabKey));

  return (
    <View style={[styles.wrapper, shadowsV2.floating]} pointerEvents="box-none">
      <Glass variant="tabbar" style={styles.glass}>
        <View style={styles.row}>
          {visibleRoutes.map(({ route, index, tabKey }) => {
            const focused = state.index === index;
            const descriptor = descriptors[route.key];
            const accessibilityLabel = descriptor?.options.tabBarAccessibilityLabel;

            const onPress = (): void => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = (): void => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <TabButton
                key={route.key}
                tabKey={tabKey}
                active={focused}
                onPress={onPress}
                onLongPress={onLongPress}
                accessibilityLabel={accessibilityLabel}
              />
            );
          })}
        </View>
      </Glass>
    </View>
  );
}

export const FloatingTabBarV2 = memo(FloatingTabBarV2Inner);

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 16,
    left: 24,
    right: 24,
    height: 56,
  },
  glass: {
    flex: 1,
    borderRadius: 999,
    overflow: 'hidden',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  highlightLayer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentDot: {
    position: 'absolute',
    bottom: 8,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 4,
  },
});
