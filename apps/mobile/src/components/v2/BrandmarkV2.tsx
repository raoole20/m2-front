import { LinearGradient } from 'expo-linear-gradient';
import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colorsV2, fontFamily, shadowsV2 } from '@/theme';

export type BrandmarkV2Props = {
  size?: number;
};

const GRADIENT_COLORS = [
  colorsV2.accent[100],
  colorsV2.accent[200],
  colorsV2.accent[400],
] as const;

export function BrandmarkV2({ size = 64 }: BrandmarkV2Props): ReactElement {
  const radius = size * 0.28;
  const glyphSize = size * 0.5;

  return (
    <View
      style={[
        styles.outerShadow,
        { width: size, height: size, borderRadius: radius },
        shadowsV2.glow.accent,
      ]}
    >
      <LinearGradient
        colors={[...GRADIENT_COLORS]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { borderRadius: radius }]}
      >
        <View
          pointerEvents="none"
          style={[styles.innerHighlight, { borderRadius: radius }]}
        />
        <Text
          allowFontScaling={false}
          style={[
            styles.glyph,
            {
              fontSize: glyphSize,
              lineHeight: glyphSize * 1.05,
            },
          ]}
        >
          M
        </Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outerShadow: {
    overflow: 'visible',
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    opacity: 0.6,
  },
  glyph: {
    fontFamily: fontFamily.inter.semibold,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    includeFontPadding: false,
  },
});
