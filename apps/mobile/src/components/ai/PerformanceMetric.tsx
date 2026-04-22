import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks/useColors';
import { GlassCard } from '@/components/ui/GlassCard';
import { fontFamily, typography } from '@m2/design';
import { borderRadius, spacing } from '@m2/design';
import type { ThemeColors } from '@m2/design';

export interface PerformanceMetricProps {
  label: string;
  value: string;
  progress?: number;
  tint?: string;
}

export function PerformanceMetric({
  label,
  value,
  progress,
  tint,
}: PerformanceMetricProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors, tint), [colors, tint]);

  const clampedProgress =
    progress !== undefined ? Math.min(1, Math.max(0, progress)) : undefined;

  return (
    <GlassCard style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {clampedProgress !== undefined ? (
        <View style={styles.progressTrack}>
          <View
            style={[styles.progressFill, { width: `${clampedProgress * 100}%` }]}
          />
        </View>
      ) : null}
    </GlassCard>
  );
}

const createStyles = (colors: ThemeColors, tint?: string) =>
  StyleSheet.create({
    card: {
      padding: spacing[4],
      borderRadius: borderRadius.sm,
    },
    value: {
      fontFamily: fontFamily.displaySemiBold,
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '600',
      letterSpacing: -0.02 * 24,
      color: tint ?? colors.onSurface,
      marginBottom: spacing[1],
    },
    label: {
      fontFamily: fontFamily.bodyRegular,
      ...typography.labelMedium,
      color: colors.onSurfaceVariant,
    },
    progressTrack: {
      height: 4,
      backgroundColor: colors.surfaceContainerHigh,
      borderRadius: borderRadius.full,
      marginTop: spacing[3],
      overflow: 'hidden',
    },
    progressFill: {
      height: 4,
      backgroundColor: tint ?? colors.primary,
      borderRadius: borderRadius.full,
    },
  });
