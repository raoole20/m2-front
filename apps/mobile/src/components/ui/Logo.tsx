import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';

import { fontFamily } from '@m2/design';
import { useColors } from '@/hooks/useColors';

type LogoSize = 'sm' | 'md' | 'lg';

interface LogoProps {
  size?: LogoSize;
  color?: string;
  style?: StyleProp<TextStyle>;
}

const SIZE_MAP: Record<LogoSize, { fontSize: number; lineHeight: number; family: string }> = {
  sm: { fontSize: 20, lineHeight: 28, family: fontFamily.displayBold },
  md: { fontSize: 28, lineHeight: 34, family: fontFamily.displayBold },
  lg: { fontSize: 36, lineHeight: 44, family: fontFamily.displayExtraBold },
};

export function Logo({ size = 'sm', color, style }: LogoProps) {
  const colors = useColors();
  const { fontSize, lineHeight, family } = SIZE_MAP[size];

  return (
    <Text
      style={[
        styles.base,
        {
          fontSize,
          lineHeight,
          fontFamily: family,
          color: color ?? colors.primary,
          letterSpacing: -0.02 * fontSize,
        },
        style,
      ]}
    >
      motomoto
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontWeight: '700',
  },
});
