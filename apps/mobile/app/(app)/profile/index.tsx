/**
 * Profile screen — V2.
 *
 * Ports `ProfileScreenV2` from the design bundle to React Native:
 *   - `<Atmosphere mood="profile" intensity="rich" />` background.
 *   - Centered identity header (BrandmarkV2 with glow + role eyebrow +
 *     Display name + serif italic "at Motomoto").
 *   - Glass stats card (3 stats: replies / avg time / SLA — placeholder copy).
 *   - 3 setting sections (Account / Workspace / Support) with rows that
 *     surface an icon tile, label, optional meta + ChevronRight.
 *   - Sign out row triggers `useAuthStore.signOut()` then redirects to
 *     `/(auth)/login`.
 *
 * Backend mismatch notes:
 *   - `apiClient.auth.me()` returns `{ id; email; name?; firstName?; role }`
 *     — there is no team / per-user analytics endpoint, so the stats card
 *     uses placeholder copy. Marked TODO inline.
 *   - "Theme" / "Language" / "Notifications" rows are visual only; they
 *     show static meta until those features land.
 */

import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, type ComponentType, type ReactElement } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  ToastAndroid,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import {
  Atmosphere,
  Bell,
  Body,
  ChevronRight,
  colorsV2,
  Display,
  fontFamily,
  Glass,
  GradText,
  type IconProps,
  LogOut,
  Micro,
  motionV2,
  SerifItalic,
  Settings,
  Sparkle4,
  User,
} from '@/theme';
import { BrandmarkV2, StatusBarV2 } from '@/components/v2';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

// ─── Types ────────────────────────────────────────────────────────────────────

type IconComponent = ComponentType<IconProps>;

type SettingRow = {
  key: string;
  Icon: IconComponent;
  label: string;
  meta?: string;
  accent?: boolean;
  danger?: boolean;
  onPress?: () => void;
};

type SettingSection = {
  title: string;
  rows: SettingRow[];
};

// ─── Stats placeholder ────────────────────────────────────────────────────────
// TODO: replace with real stats API when available.

const MOCK_STATS: ReadonlyArray<{ value: string; label: string }> = [
  { value: '142', label: 'replies' },
  { value: '2.4m', label: 'avg time' },
  { value: '98%', label: 'SLA' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function showToast(message: string): void {
  if (ToastAndroid && typeof ToastAndroid.show === 'function') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  }
}

function getDisplayName(user: {
  firstName?: string;
  name?: string;
  email: string;
} | null | undefined): string {
  if (!user) return 'Team member';
  if (user.firstName && user.firstName.length > 0) {
    return user.firstName;
  }
  if (user.name && user.name.length > 0) {
    return user.name;
  }
  return user.email.split('@')[0] ?? user.email;
}

function getRoleLabel(role: string | undefined): string {
  if (!role || role.length === 0) return 'TEAM MEMBER';
  return role.toUpperCase();
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen(): ReactElement {
  const router = useRouter();
  const storeUser = useAuthStore((state) => state.user);

  const { data: meData, isLoading: isMeLoading } = useQuery({
    queryKey: ['me'] as const,
    queryFn: () => apiClient.auth.me(),
    retry: 0,
  });

  const user = meData ?? storeUser ?? null;
  const isLoading = isMeLoading && !user;
  const displayName = getDisplayName(user);
  const roleLabel = getRoleLabel(user?.role);

  const handleSignOut = async (): Promise<void> => {
    try {
      await useAuthStore.getState().signOut();
      router.replace('/(auth)/login');
    } catch {
      showToast('Error cerrando sesión');
    }
  };

  const sections: SettingSection[] = [
    {
      title: 'ACCOUNT',
      rows: [
        {
          key: 'personal-info',
          Icon: User,
          label: 'Personal info',
          meta: 'Edit',
          onPress: () => showToast('Próximamente'),
        },
        {
          key: 'notifications',
          Icon: Bell,
          label: 'Notifications',
          meta: 'On',
          onPress: () => showToast('Próximamente'),
        },
        {
          key: 'language',
          Icon: Sparkle4,
          label: 'Language',
          meta: 'Español',
          onPress: () => showToast('Próximamente'),
        },
        {
          key: 'theme',
          Icon: Sparkle4,
          label: 'Theme',
          meta: 'System',
          onPress: () => showToast('Próximamente'),
        },
      ],
    },
    {
      title: 'WORKSPACE',
      rows: [
        {
          key: 'ai-prefs',
          Icon: Sparkle4,
          label: 'AI preferences',
          meta: '3 active',
          accent: true,
          onPress: () => showToast('Próximamente'),
        },
        {
          key: 'channels',
          Icon: Settings,
          label: 'Channels',
          meta: '—',
          onPress: () => showToast('Próximamente'),
        },
        {
          key: 'team',
          Icon: User,
          label: 'Team members',
          meta: '—',
          onPress: () => showToast('Próximamente'),
        },
      ],
    },
    {
      title: 'SUPPORT',
      rows: [
        {
          key: 'help-center',
          Icon: Settings,
          label: 'Help center',
          onPress: () => showToast('Próximamente'),
        },
        {
          key: 'feedback',
          Icon: Bell,
          label: 'Send feedback',
          onPress: () => showToast('Próximamente'),
        },
        {
          key: 'about',
          Icon: Settings,
          label: 'About',
          meta: 'v2.0.0',
          onPress: () => showToast('Próximamente'),
        },
        {
          key: 'sign-out',
          Icon: LogOut,
          label: 'Sign out',
          danger: true,
          onPress: () => {
            void handleSignOut();
          },
        },
      ],
    },
  ];

  return (
    <View style={styles.root}>
      <Atmosphere mood="profile" intensity="rich" />
      <View style={styles.fill}>
        <StatusBarV2 />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <ProfileSkeleton />
          ) : (
            <>
              {/* Identity */}
              <FadeUp delay={0}>
                <View style={styles.identity}>
                  <View style={styles.brandmarkWrap}>
                    <BrandmarkV2 size={88} />
                  </View>
                  <Micro color={colorsV2.text.muted} style={styles.identityEyebrow}>
                    {`${roleLabel} · MOTOMOTO`}
                  </Micro>
                  <Display style={styles.identityName} numberOfLines={1}>
                    {displayName}
                  </Display>
                  <SerifItalic
                    size={16}
                    color={colorsV2.text.muted}
                    style={styles.identitySerif}
                  >
                    at Motomoto
                  </SerifItalic>
                </View>
              </FadeUp>

              {/* Stats */}
              <FadeUp delay={80}>
                <Glass variant="card" style={styles.statsCard}>
                  {MOCK_STATS.map((stat, index) => (
                    <View key={stat.label} style={styles.statColumnRow}>
                      <View style={styles.statColumn}>
                        <GradText style={styles.statValue}>{stat.value}</GradText>
                        <Micro color={colorsV2.text.muted} style={styles.statLabel}>
                          {stat.label}
                        </Micro>
                      </View>
                      {index < MOCK_STATS.length - 1 ? (
                        <View style={styles.statDivider} />
                      ) : null}
                    </View>
                  ))}
                </Glass>
              </FadeUp>

              {/* Setting sections */}
              {sections.map((section, sectionIndex) => (
                <FadeUp
                  key={section.title}
                  delay={160 + sectionIndex * 80}
                >
                  <View style={styles.sectionWrap}>
                    <Micro
                      color={colorsV2.text.muted}
                      style={styles.sectionTitle}
                    >
                      {section.title}
                    </Micro>
                    <Glass variant="card" style={styles.sectionCard}>
                      {section.rows.map((row, rowIndex) => (
                        <SettingRowView
                          key={row.key}
                          row={row}
                          isLast={rowIndex === section.rows.length - 1}
                        />
                      ))}
                    </Glass>
                  </View>
                </FadeUp>
              ))}

              <Body color={colorsV2.text.muted} style={styles.footer}>
                Motomoto · v2.0.0 · build 4521
              </Body>
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

// ─── Setting row ──────────────────────────────────────────────────────────────

type SettingRowViewProps = {
  row: SettingRow;
  isLast: boolean;
};

function SettingRowView({ row, isLast }: SettingRowViewProps): ReactElement {
  const { Icon, label, meta, accent, danger, onPress } = row;

  const labelColor = danger ? colorsV2.state.danger : colorsV2.text.primary;
  const iconColor = danger ? colorsV2.state.danger : '#ffffff';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !isLast ? styles.rowDivider : null,
        pressed ? styles.rowPressed : null,
      ]}
    >
      {accent ? (
        <LinearGradient
          colors={[colorsV2.accent[100], colorsV2.accent[300]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.rowIconTile, styles.rowIconTileAccent]}
        >
          <Icon size={16} color="#ffffff" />
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.rowIconTile,
            danger ? styles.rowIconTileDanger : styles.rowIconTileGlass,
          ]}
        >
          <Icon size={16} color={iconColor} />
        </View>
      )}

      <Body color={labelColor} style={styles.rowLabel} numberOfLines={1}>
        {label}
      </Body>

      {meta !== undefined && meta.length > 0 ? (
        <Body
          color={colorsV2.text.muted}
          size="small"
          style={styles.rowMeta}
          numberOfLines={1}
        >
          {meta}
        </Body>
      ) : null}

      {danger ? null : (
        <ChevronRight size={14} color="rgba(255,255,255,0.30)" strokeWidth={1.7} />
      )}
    </Pressable>
  );
}

// ─── Animated wrapper ─────────────────────────────────────────────────────────

function FadeUp({
  delay,
  children,
}: {
  delay: number;
  children: ReactElement;
}): ReactElement {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  useEffect(() => {
    const config = {
      duration: motionV2.fadeUp.durationMs,
      easing: Easing.bezier(...motionV2.fadeUp.bezier),
    };
    opacity.value = withSequence(
      withTiming(0, { duration: delay }),
      withTiming(1, config),
    );
    translateY.value = withSequence(
      withTiming(8, { duration: delay }),
      withTiming(0, config),
    );
  }, [delay, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ProfileSkeleton(): ReactElement {
  const shimmer = useSharedValue(0.4);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, {
        duration: motionV2.pulse.durationMs,
        easing: Easing.bezier(...motionV2.pulse.bezier),
      }),
      -1,
      true,
    );
  }, [shimmer]);

  const style = useAnimatedStyle(() => ({ opacity: shimmer.value }));

  return (
    <Animated.View style={style}>
      <View style={styles.skelIdentity}>
        <View style={styles.skelBrandmark} />
        <View style={styles.skelLineMicro} />
        <View style={styles.skelLineName} />
        <View style={styles.skelLineSerif} />
      </View>
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.skelSection}>
          <View style={styles.skelSectionTitle} />
          <View style={styles.skelSectionCard} />
        </View>
      ))}
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colorsV2.bg.base,
  },
  fill: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 96,
  },

  /* Identity */
  identity: {
    paddingTop: 32,
    alignItems: 'center',
  },
  brandmarkWrap: {
    shadowColor: colorsV2.accent[200],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 28,
    elevation: 18,
  },
  identityEyebrow: {
    marginTop: 16,
    letterSpacing: 1.4,
  },
  identityName: {
    marginTop: 4,
    fontSize: 28,
    lineHeight: 32,
    fontFamily: fontFamily.inter.semibold,
    fontWeight: '600',
    letterSpacing: -0.84,
    textAlign: 'center',
  },
  identitySerif: {
    marginTop: 2,
  },

  /* Stats */
  statsCard: {
    marginTop: 28,
    padding: 16,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statColumnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontFamily: fontFamily.inter.semibold,
    fontWeight: '600',
    fontSize: 24,
    lineHeight: 26,
    letterSpacing: -0.72,
  },
  statLabel: {
    marginTop: 4,
    fontSize: 11,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },

  /* Sections */
  sectionWrap: {
    marginTop: 16,
  },
  sectionTitle: {
    marginLeft: 16,
    marginBottom: 8,
    letterSpacing: 1.4,
  },
  sectionCard: {
    borderRadius: 18,
    paddingVertical: 0,
    overflow: 'hidden',
  },

  /* Row */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowPressed: {
    opacity: 0.85,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  rowIconTile: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowIconTileGlass: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  rowIconTileAccent: {
    shadowColor: colorsV2.accent[200],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 6,
  },
  rowIconTileDanger: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
  },
  rowLabel: {
    flex: 1,
    fontFamily: fontFamily.inter.medium,
    fontWeight: '500',
    fontSize: 14,
  },
  rowMeta: {
    fontSize: 12,
  },

  /* Footer */
  footer: {
    marginTop: 24,
    marginBottom: 32,
    fontSize: 11,
    textAlign: 'center',
  },

  /* Skeleton */
  skelIdentity: {
    paddingTop: 32,
    alignItems: 'center',
    gap: 8,
  },
  skelBrandmark: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginBottom: 16,
  },
  skelLineMicro: {
    width: 140,
    height: 10,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  skelLineName: {
    marginTop: 4,
    width: 180,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  skelLineSerif: {
    marginTop: 4,
    width: 100,
    height: 14,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  skelSection: {
    marginTop: 24,
  },
  skelSectionTitle: {
    width: 80,
    height: 10,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginLeft: 16,
    marginBottom: 8,
  },
  skelSectionCard: {
    height: 180,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
});
