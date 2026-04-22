import React, { useMemo } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { fontFamily, typography } from '@m2/design';
import { spacing, borderRadius } from '@m2/design';
import type { ThemeColors } from '@m2/design';
import { Pressable } from '@/components/ui/Pressable';
import { GlassCard } from '@/components/ui/GlassCard';

// ─── Types ───────────────────────────────────────────────────────────────────

interface KPITrend {
  direction: 'up' | 'down';
  percent: number;
}

interface KPICardProps {
  /** Short metric label (e.g. "Ventas hoy") */
  label: string;
  /** Display value (e.g. "$12,500" or "84") */
  value: string;
  /** Trend arrow + percentage badge */
  trend?: KPITrend;
  /** MaterialCommunityIcons name */
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  /** Accent color for the icon circle and value text */
  tint: string;
  /** Optional press handler — wraps the card in Pressable */
  onPress?: () => void;
  /** Additional styles applied to the outer container */
  style?: StyleProp<ViewStyle>;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function KPICard({
  label,
  value,
  trend,
  icon,
  tint,
  onPress,
  style,
}: KPICardProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors, tint), [colors, tint]);

  const content = (
    <GlassCard style={[styles.card, style]}>
      {/* Icon circle */}
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name={icon} size={20} color={tint} />
      </View>

      {/* Value */}
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>

      {/* Label + trend row */}
      <View style={styles.labelRow}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        {trend != null && <TrendPill trend={trend} colors={colors} />}
      </View>
    </GlassCard>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button">
        {content}
      </Pressable>
    );
  }

  return content;
}

// ─── Trend pill sub-component ────────────────────────────────────────────────

function TrendPill({ trend, colors }: { trend: KPITrend; colors: ThemeColors }) {
  const isUp = trend.direction === 'up';
  const pillColor = isUp ? colors.accent.success : colors.accent.error;
  const pillBg = isUp ? colors.accent.successMuted : colors.accent.errorMuted;
  const arrowIcon = isUp ? 'arrow-up' as const : 'arrow-down' as const;

  return (
    <View style={[trendStyles.pill, { backgroundColor: pillBg }]}>
      <MaterialCommunityIcons name={arrowIcon} size={10} color={pillColor} />
      <Text style={[trendStyles.text, { color: pillColor }]}>
        {trend.percent}%
      </Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const ICON_CIRCLE_SIZE = 36;

const createStyles = (colors: ThemeColors, tint: string) =>
  StyleSheet.create({
    card: {
      minHeight: 120,
      padding: spacing[4], // 16
    },
    iconCircle: {
      width: ICON_CIRCLE_SIZE,
      height: ICON_CIRCLE_SIZE,
      borderRadius: ICON_CIRCLE_SIZE / 2,
      backgroundColor: `${tint}26`, // 15% opacity (hex 26 ≈ 15%)
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing[3], // 12
    },
    value: {
      fontSize: 32,
      lineHeight: 38,
      fontWeight: '600',
      fontFamily: fontFamily.displaySemiBold,
      letterSpacing: -0.028 * 32,
      color: tint,
      marginBottom: spacing[1], // 4
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2], // 8
    },
    label: {
      ...typography.caption1,
      fontFamily: fontFamily.bodyRegular,
      color: colors.onSurfaceVariant,
      flexShrink: 1,
    },
  });

const trendStyles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing[2], // 8
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  text: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    fontFamily: fontFamily.bodySemiBold,
  },
});
