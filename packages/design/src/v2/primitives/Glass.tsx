import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactElement, ReactNode } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';

import { glassV2, type GlassIntensity, type GlassVariant } from '../glass';

export type GlassProps = {
  variant?: GlassVariant;
  intensity?: GlassIntensity;
  style?: ViewStyle | ViewStyle[];
  children?: ReactNode;
};

export function Glass({
  variant = 'card',
  intensity = 'medium',
  style,
  children,
}: GlassProps): ReactElement {
  const variantSpec = glassV2.variants[variant];
  const intensityMult = glassV2.intensities[intensity];

  if (Platform.OS === 'ios') {
    const blurIntensity = Math.min(
      100,
      Math.round(variantSpec.blurRadius * intensityMult * 1.5),
    );
    return (
      <BlurView
        intensity={blurIntensity}
        tint="dark"
        style={[
          styles.base,
          { backgroundColor: variantSpec.tint, borderColor: glassV2.borderColor },
          style,
        ]}
      >
        {children}
      </BlurView>
    );
  }

  // Android (and any other platform without backdrop blur): dense tint +
  // top sheen + simulated inner shadow.
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: glassV2.androidFallback.backgroundColor,
          borderColor: glassV2.androidFallback.borderColor,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={glassV2.androidFallback.topSheen.colors}
        start={glassV2.androidFallback.topSheen.start}
        end={glassV2.androidFallback.topSheen.end}
        style={styles.topSheen}
        pointerEvents="none"
      />
      <View
        pointerEvents="none"
        style={[
          styles.innerShadow,
          { shadowColor: glassV2.androidFallback.innerShadowColor },
        ]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    position: 'relative',
  },
  topSheen: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: StyleSheet.hairlineWidth,
  },
  innerShadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 1,
    shadowRadius: 1,
  },
});
