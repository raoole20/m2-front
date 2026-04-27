import {
  Canvas,
  Circle,
  Group,
  LinearGradient as SkiaLinearGradient,
  RadialGradient as SkiaRadialGradient,
  Rect,
  SweepGradient,
  vec,
} from '@shopify/react-native-skia';
import { Image } from 'expo-image';
import { memo, useEffect, useMemo, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colorsV2, motionV2, SerifItalic } from '@/theme';

export type AvatarV2Props = {
  name: string;
  size?: number;
  online?: boolean;
  imageUrl?: string;
};

const RING_COLORS = [
  colorsV2.accent[100],
  colorsV2.accent[200],
  colorsV2.accent[300],
  colorsV2.accent.deep,
  colorsV2.accent[100],
] as const;

const HUE_PAIRS: ReadonlyArray<readonly [number, number]> = [
  [262, 240],
  [205, 240],
  [168, 200],
  [328, 295],
  [25, 350],
  [285, 250],
];

const RING_THICKNESS = 1.5;
const SHEEN_HEIGHT_RATIO = 0.45;
const ONLINE_DOT_SIZE = 10;
const PULSE_RING_SIZE = ONLINE_DOT_SIZE * 1.6;

function paletteIndex(name: string): number {
  const trimmed = name.trim();
  if (trimmed.length === 0) return 0;
  const first = trimmed.charCodeAt(0);
  const second = trimmed.length > 1 ? trimmed.charCodeAt(1) : first;
  return (first + second) % HUE_PAIRS.length;
}

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) return '?';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const firstChar = parts[0]?.[0] ?? '';
  if (parts.length === 1) {
    return firstChar.toUpperCase();
  }
  const lastPart = parts[parts.length - 1] ?? '';
  const lastChar = lastPart[0] ?? '';
  return `${firstChar}${lastChar}`.toUpperCase();
}

function hslString(hue: number, saturation = 70, lightness = 60): string {
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

type PulseRingProps = {
  size: number;
  color: string;
};

function PulseRing({ size, color }: PulseRingProps): ReactElement {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, {
        duration: motionV2.pulseRing.durationMs,
        easing: Easing.bezier(...motionV2.pulseRing.bezier),
      }),
      -1,
      false,
    );
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = 1 + progress.value * 0.4;
    const opacity = 0.55 * (1 - progress.value);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.pulseRing,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

function AvatarV2Inner({
  name,
  size = 44,
  online = false,
  imageUrl,
}: AvatarV2Props): ReactElement {
  const radius = size / 2;
  const innerRadius = radius - RING_THICKNESS;
  const initials = useMemo(() => getInitials(name), [name]);
  const [hue1, hue2] = useMemo(() => HUE_PAIRS[paletteIndex(name)] ?? [262, 240], [name]);

  const blobColors = useMemo(
    () => [hslString(hue1, 78, 65), hslString(hue2, 65, 45)] as const,
    [hue1, hue2],
  );

  const sheenColors = useMemo(
    () =>
      [
        'rgba(255, 255, 255, 0.32)',
        'rgba(255, 255, 255, 0.08)',
        'rgba(255, 255, 255, 0)',
      ] as const,
    [],
  );

  const fontSize = Math.round(size * 0.42);

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Circle cx={radius} cy={radius} r={radius}>
          <SweepGradient c={vec(radius, radius)} colors={[...RING_COLORS]} />
        </Circle>
        <Circle cx={radius} cy={radius} r={innerRadius}>
          <SkiaRadialGradient
            c={vec(radius * 0.6, radius * 0.55)}
            r={innerRadius * 1.2}
            colors={[...blobColors]}
          />
        </Circle>
        <Group>
          <Rect
            x={0}
            y={0}
            width={size}
            height={size * SHEEN_HEIGHT_RATIO}
          >
            <SkiaLinearGradient
              start={vec(0, 0)}
              end={vec(0, size * SHEEN_HEIGHT_RATIO)}
              colors={[...sheenColors]}
            />
          </Rect>
        </Group>
      </Canvas>

      {imageUrl !== undefined ? (
        <View
          style={[
            styles.imageMask,
            {
              top: RING_THICKNESS,
              left: RING_THICKNESS,
              width: size - RING_THICKNESS * 2,
              height: size - RING_THICKNESS * 2,
              borderRadius: innerRadius,
            },
          ]}
        >
          <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" />
        </View>
      ) : (
        <View style={styles.initialsLayer} pointerEvents="none">
          <SerifItalic
            size={fontSize}
            color={colorsV2.text.primary}
            style={styles.initials}
          >
            {initials}
          </SerifItalic>
        </View>
      )}

      {online ? (
        <View style={styles.onlineAnchor} pointerEvents="none">
          <PulseRing size={PULSE_RING_SIZE} color={colorsV2.state.success} />
          <View
            style={[
              styles.onlineDot,
              {
                width: ONLINE_DOT_SIZE,
                height: ONLINE_DOT_SIZE,
                borderRadius: ONLINE_DOT_SIZE / 2,
                backgroundColor: colorsV2.state.success,
              },
            ]}
          />
        </View>
      ) : null}
    </View>
  );
}

export const AvatarV2 = memo(AvatarV2Inner);

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    includeFontPadding: false,
    textAlign: 'center',
  },
  imageMask: {
    position: 'absolute',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  onlineAnchor: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: ONLINE_DOT_SIZE,
    height: ONLINE_DOT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    borderWidth: 2,
    borderColor: colorsV2.bg.deep,
  },
  pulseRing: {
    position: 'absolute',
  },
});
