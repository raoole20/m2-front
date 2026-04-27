import { LinearGradient } from 'expo-linear-gradient';
import type { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { colorsV2, SerifItalic } from '@/theme';

export type TodayDividerProps = {
  label?: string;
};

const GRADIENT_COLORS = [
  'rgba(255, 255, 255, 0)',
  'rgba(255, 255, 255, 0.10)',
  'rgba(255, 255, 255, 0)',
] as const;

export function TodayDivider({ label = 'Today' }: TodayDividerProps): ReactElement {
  return (
    <View style={styles.row}>
      <LinearGradient
        colors={[...GRADIENT_COLORS]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.line}
      />
      <SerifItalic size={11} color={colorsV2.text.muted} style={styles.label}>
        {label}
      </SerifItalic>
      <LinearGradient
        colors={[...GRADIENT_COLORS]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.line}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  line: {
    flex: 1,
    height: 1,
  },
  label: {
    paddingHorizontal: 12,
  },
});
