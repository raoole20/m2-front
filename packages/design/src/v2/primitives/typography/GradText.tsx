import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactElement, ReactNode } from 'react';
import { StyleSheet, Text, type StyleProp, type TextStyle, View } from 'react-native';

const ACCENT_GRADIENT: readonly [string, string, string] = [
  '#b4b5fb',
  '#8b8cf7',
  '#6366f1',
];

export type GradTextProps = {
  children: ReactNode;
  /** Defaults to the accent ramp from `colorsV2.accent`. */
  colors?: readonly [string, string, ...string[]];
  style?: StyleProp<TextStyle>;
  /** Gradient direction `start`/`end` in normalized coords. */
  start?: { x: number; y: number };
  end?: { x: number; y: number };
};

export function GradText({
  children,
  colors = ACCENT_GRADIENT,
  style,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
}: GradTextProps): ReactElement {
  return (
    <MaskedView
      maskElement={
        <View style={styles.maskContainer}>
          <Text style={[styles.maskText, style]}>{children}</Text>
        </View>
      }
    >
      <LinearGradient colors={colors} start={start} end={end}>
        <Text style={[styles.maskText, style, styles.transparent]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  maskContainer: {
    backgroundColor: 'transparent',
  },
  maskText: {
    backgroundColor: 'transparent',
  },
  transparent: {
    opacity: 0,
  },
});
