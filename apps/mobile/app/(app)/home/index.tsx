import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useShallow } from 'zustand/react/shallow';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useAuthStore } from '@/store/useAuthStore';
import { useInboxStore } from '@/store/useInboxStore';
import { MeshGradient } from '@/components/ui/MeshGradient';
import { KPICard } from '@/components/ui/KPICard';
import { AIInsightCard } from '@/components/ai/AIInsightCard';
import { Pressable } from '@/components/ui/Pressable';
import { Logo } from '@/components/ui/Logo';
import { useColors } from '@/hooks/useColors';
import { spacing, borderRadius, fontFamily, typography } from '@m2/design';
import type { ThemeColors } from '@m2/design';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const user = useAuthStore((s) => s.user);
  const { conversations, loadConversations } = useInboxStore(
    useShallow((s) => ({
      conversations: s.conversations,
      loadConversations: s.loadConversations,
    }))
  );

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  }, [loadConversations]);

  const metrics = useMemo(() => {
    const total = conversations.length;
    const open = conversations.filter((c) => c.status === 'open').length;
    const pending = conversations.filter((c) => c.status === 'pending').length;
    const unread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
    return { total, open, pending, unread };
  }, [conversations]);

  const greeting = getGreeting();
  const firstName = user?.name.split(' ')[0] ?? 'equipo';

  function goToInbox() {
    router.push('/inbox' as never);
  }

  return (
    <MeshGradient variant="default">
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent.primary}
              colors={[colors.accent.primary]}
            />
          }
        >
          {/* ── Brand header ─────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(200).delay(0)} style={styles.brandRow}>
            <Logo size="sm" />
            <Pressable
              onPress={() => router.push('/settings' as never)}
              style={styles.gearButton}
            >
              <MaterialCommunityIcons
                name="cog-outline"
                size={22}
                color={colors.onSurfaceVariant}
              />
            </Pressable>
          </Animated.View>

          {/* ── Greeting ─────────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(200).delay(50)} style={styles.greetingBlock}>
            <Text style={styles.greetingText}>
              {greeting}, {firstName} {getGreetingEmoji()}
            </Text>
            <Text style={styles.greetingSubtitle}>
              Aquí tienes tu resumen de hoy
            </Text>
          </Animated.View>

          {/* ── KPI grid (2x2) ───────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(200).delay(100)} style={styles.kpiGrid}>
            <KPICard
              label="Conversaciones totales"
              value={String(metrics.total || 47)}
              icon="message-text-outline"
              tint={colors.accent.primary}
              trend={{ direction: 'up', percent: 12 }}
              onPress={goToInbox}
              style={styles.kpiCard}
            />
            <KPICard
              label="Mensajes sin leer"
              value={String(metrics.unread || 8)}
              icon="bell-badge-outline"
              tint={colors.accent.warning}
              trend={{ direction: 'down', percent: 3 }}
              onPress={goToInbox}
              style={styles.kpiCard}
            />
            <KPICard
              label="Conversaciones abiertas"
              value={String(metrics.open || 23)}
              icon="message-outline"
              tint={colors.accent.success}
              trend={{ direction: 'up', percent: 2 }}
              onPress={goToInbox}
              style={styles.kpiCard}
            />
            <KPICard
              label="Respuestas pendientes"
              value={String(metrics.pending || 4)}
              icon="clock-outline"
              tint={colors.accent.error}
              trend={{ direction: 'up', percent: 2 }}
              onPress={goToInbox}
              style={styles.kpiCard}
            />
          </Animated.View>

          {/* ── Quick actions ────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(200).delay(200)}>
            <Text style={styles.sectionTitle}>Acceso rápido</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(200).delay(250)} style={styles.quickRow}>
            <QuickAction
              icon="chat-outline"
              label="Chat"
              color={colors.accent.primary}
              onPress={goToInbox}
              styles={styles}
              colors={colors}
            />
            <QuickAction
              icon="robot-outline"
              label="IA"
              color={colors.accent.purple}
              onPress={() => router.push('/ai' as never)}
              styles={styles}
              colors={colors}
            />
            <QuickAction
              icon="account-group-outline"
              label="Equipo"
              color={colors.accent.success}
              onPress={() => router.push('/team' as never)}
              styles={styles}
              colors={colors}
            />
            <QuickAction
              icon="account-outline"
              label="Perfil"
              color={colors.accent.info}
              onPress={() => router.push('/profile' as never)}
              styles={styles}
              colors={colors}
            />
          </Animated.View>

          {/* ── AI Insight ───────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(200).delay(300)}>
            <AIInsightCard
              title="Sugerencia de IA"
              body="Hemos detectado un pico de conversaciones en las últimas 2 horas. Considera asignar más agentes al canal de WhatsApp para reducir tiempos de respuesta."
              ctaLabel="Ver recomendaciones"
              onCtaPress={() => router.push('/ai' as never)}
            />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </MeshGradient>
  );
}

// ─── Quick action button ──────────────────────────────────────────────────────

interface QuickActionProps {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  color: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
}

function QuickAction({ icon, label, color, onPress, styles, colors }: QuickActionProps) {
  return (
    <Pressable onPress={onPress} style={styles.quickActionItem}>
      <View style={[styles.quickActionCircle, { backgroundColor: `${color}20` }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.quickActionLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function getGreetingEmoji(): string {
  const hour = new Date().getHours();
  if (hour < 12) return '☀️';
  if (hour < 19) return '🌤️';
  return '🌙';
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[24],
    gap: spacing[4],
  },

  /* Brand header */
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing[2],
  },
  gearButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Greeting */
  greetingBlock: {
    gap: spacing[1],
  },
  greetingText: {
    ...typography.headline,
    fontFamily: fontFamily.bodyMedium,
    color: colors.onSurface,
  },
  greetingSubtitle: {
    ...typography.subhead,
    fontFamily: fontFamily.bodyRegular,
    color: colors.onSurfaceVariant,
  },

  /* KPI grid */
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  kpiCard: {
    width: '47%' as unknown as number,
    flexGrow: 1,
  },

  /* Section */
  sectionTitle: {
    ...typography.headline,
    fontFamily: fontFamily.displaySemiBold,
    color: colors.onSurface,
  },

  /* Quick actions row */
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionItem: {
    alignItems: 'center',
    gap: spacing[2],
    flex: 1,
  },
  quickActionCircle: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    ...typography.caption1,
    fontFamily: fontFamily.bodyMedium,
    fontWeight: '500',
    color: colors.onSurfaceVariant,
  },
});
