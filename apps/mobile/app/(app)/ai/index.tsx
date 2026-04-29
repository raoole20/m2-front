/**
 * AI Hub screen — V2.
 *
 * Ports `AIHubScreenV2` from the design bundle to React Native:
 *   - `<Atmosphere mood="ai" intensity="rich" />` background.
 *   - Editorial header (eyebrow Sparkle4 + display "What I saw today" with
 *     gradient-masked "What I" leading word + meta line).
 *   - Hero insight card (glass with accent border + gradient sparkle tile +
 *     contact name in gradient text + summary body + 2 CTAs).
 *   - Stats row (3 GradText big numbers in glass tiles).
 *   - Insights list (3 glass cards with kicker / title / body).
 *
 * TODO: replace MOCK_* with real AI insights API when available — there is
 * no backend feed for editorial AI insights yet, so all copy is static
 * placeholder. No network calls are made from this screen.
 */

import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, type ReactElement } from 'react';
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
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import {
  Atmosphere,
  Body,
  colorsV2,
  Display,
  fontFamily,
  Glass,
  GradText,
  Micro,
  motionV2,
  SerifItalic,
  Sparkle4,
} from '@/theme';
import { StatusBarV2 } from '@/components/v2';

// ─── Mock data ────────────────────────────────────────────────────────────────
// TODO: replace MOCK_* with real AI insights API when available.

type HeroInsight = {
  kicker: string;
  timestamp: string;
  contactName: string;
  highlight: string;
  body: string;
};

type Stat = {
  value: string;
  label: string;
};

type Insight = {
  kicker: string;
  title: string;
  body: string;
};

const MOCK_HERO: HeroInsight = {
  kicker: 'Hot lead',
  timestamp: '2 minutes ago',
  contactName: 'María López',
  highlight: ' is asking about Plan Pro pricing',
  body: 'Mentioned comparing with competitor pricing this week. Wants quotation by email.',
};

const MOCK_STATS: ReadonlyArray<Stat> = [
  { value: '28', label: 'drafted' },
  { value: '3m', label: 'avg reply' },
  { value: '4.8', label: 'CSAT' },
];

const MOCK_INSIGHTS: ReadonlyArray<Insight> = [
  {
    kicker: 'PATTERN',
    title: 'Pricing objection pattern',
    body: '27% of conversations mention price within first 3 messages.',
  },
  {
    kicker: 'TIMING',
    title: 'Friday afternoon spike',
    body: 'Last 4 Fridays show 2.3x more inbound messages between 3-6 PM.',
  },
  {
    kicker: 'PERFORMANCE',
    title: 'Spanish-language drafts outperform',
    body: 'Spanish responses have 18% higher conversion than English on this account.',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function showComingSoon(message: string): void {
  if (ToastAndroid && typeof ToastAndroid.show === 'function') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  }
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AIHubScreen(): ReactElement {
  return (
    <View style={styles.root}>
      <Atmosphere mood="ai" intensity="rich" />
      <View style={styles.fill}>
        <StatusBarV2 />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Editorial header */}
          <FadeUp delay={0}>
            <View style={styles.header}>
              <View style={styles.eyebrowRow}>
                <Sparkle4 size={14} color={colorsV2.accent[100]} />
                <Micro color={colorsV2.accent[100]} style={styles.eyebrow}>
                  MOTOMOTO INTELLIGENCE
                </Micro>
              </View>
              <View style={styles.headlineRow}>
                <GradText style={styles.headlineWord}>What I</GradText>
                <Display style={styles.headlineRest}> saw today</Display>
              </View>
              <Body color={colorsV2.text.muted} style={styles.headerMeta}>
                12 conversations analyzed today · 28 responses drafted
              </Body>
            </View>
          </FadeUp>

          {/* Hero insight card */}
          <FadeUp delay={160}>
            <Glass variant="card" style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <LinearGradient
                  colors={[colorsV2.accent[100], colorsV2.accent[300]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroSparkleTile}
                >
                  <View pointerEvents="none" style={styles.heroSparkleSheen} />
                  <Sparkle4 size={16} color="#ffffff" />
                </LinearGradient>
                <View style={styles.heroTopText}>
                  <SerifItalic
                    size={11}
                    color={colorsV2.accent[100]}
                    style={styles.heroKicker}
                  >
                    {MOCK_HERO.kicker}
                  </SerifItalic>
                  <Body color={colorsV2.text.muted} style={styles.heroTimestamp}>
                    {MOCK_HERO.timestamp}
                  </Body>
                </View>
              </View>

              <View style={styles.heroHeadline}>
                <GradText style={styles.heroHeadlineText}>
                  {MOCK_HERO.contactName}
                </GradText>
                <Body color={colorsV2.text.primary} style={styles.heroHeadlineText}>
                  {MOCK_HERO.highlight}
                </Body>
              </View>

              <Body color={colorsV2.text.muted} style={styles.heroBody}>
                {MOCK_HERO.body}
              </Body>

              <View style={styles.heroCtaRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="View conversation"
                  onPress={() => showComingSoon('Próximamente: abrir conversación')}
                  style={styles.heroCtaPrimaryWrap}
                >
                  <LinearGradient
                    colors={[colorsV2.accent[100], colorsV2.accent[300]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroCtaPrimary}
                  >
                    <Body color="#ffffff" style={styles.heroCtaPrimaryLabel}>
                      View conversation
                    </Body>
                  </LinearGradient>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Mark resolved"
                  onPress={() => showComingSoon('Próximamente: marcar resuelta')}
                  style={styles.heroCtaSecondary}
                >
                  <Body color={colorsV2.text.primary} style={styles.heroCtaSecondaryLabel}>
                    Mark resolved
                  </Body>
                </Pressable>
              </View>
            </Glass>
          </FadeUp>

          {/* Stats row */}
          <FadeUp delay={80}>
            <View style={styles.statsRow}>
              {MOCK_STATS.map((stat, index) => (
                <Glass key={stat.label} variant="card" style={styles.statCard}>
                  <GradText
                    style={[
                      styles.statValue,
                      index === MOCK_STATS.length - 1 ? null : null,
                    ]}
                  >
                    {stat.value}
                  </GradText>
                  <Micro color={colorsV2.text.muted} style={styles.statLabel}>
                    {stat.label}
                  </Micro>
                </Glass>
              ))}
            </View>
          </FadeUp>

          {/* INSIGHTS section */}
          <View style={styles.insightsHeader}>
            <View style={styles.insightsDot} />
            <Micro color={colorsV2.accent[100]}>INSIGHTS</Micro>
          </View>

          {MOCK_INSIGHTS.map((insight, index) => (
            <FadeUp key={insight.title} delay={240 + index * 80}>
              <Glass variant="card" style={styles.insightCard}>
                <Micro color={colorsV2.accent[100]} style={styles.insightKicker}>
                  {insight.kicker}
                </Micro>
                <Body color={colorsV2.text.primary} style={styles.insightTitle}>
                  {insight.title}
                </Body>
                <Body color={colorsV2.text.muted} size="small" style={styles.insightBody}>
                  {insight.body}
                </Body>
              </Glass>
            </FadeUp>
          ))}
        </ScrollView>
      </View>
    </View>
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
  /* Header */
  header: {
    paddingTop: 8,
    paddingBottom: 14,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  eyebrow: {
    letterSpacing: 1,
  },
  headlineRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  headlineWord: {
    fontFamily: fontFamily.inter.semibold,
    fontSize: 38,
    fontWeight: '600',
    letterSpacing: -1.4,
    lineHeight: 42,
  },
  headlineRest: {
    fontSize: 38,
    lineHeight: 42,
  },
  headerMeta: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
  },
  /* Hero card */
  heroCard: {
    padding: 20,
    borderRadius: 22,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(139,140,247,0.30)',
    overflow: 'hidden',
    shadowColor: colorsV2.accent[200],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  heroSparkleTile: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: colorsV2.accent[200],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 6,
  },
  heroSparkleSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  heroTopText: {
    flex: 1,
    minWidth: 0,
  },
  heroKicker: {
    lineHeight: 14,
  },
  heroTimestamp: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  heroHeadline: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  heroHeadlineText: {
    fontFamily: fontFamily.inter.semibold,
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.16,
  },
  heroBody: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  heroCtaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  heroCtaPrimaryWrap: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: colorsV2.accent[200],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 6,
  },
  heroCtaPrimary: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  heroCtaPrimaryLabel: {
    fontFamily: fontFamily.inter.semibold,
    fontWeight: '600',
    fontSize: 13,
  },
  heroCtaSecondary: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  heroCtaSecondaryLabel: {
    fontFamily: fontFamily.inter.medium,
    fontWeight: '500',
    fontSize: 13,
  },
  /* Stats */
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontFamily: fontFamily.inter.semibold,
    fontWeight: '600',
    fontSize: 26,
    lineHeight: 28,
    letterSpacing: -0.78,
  },
  statLabel: {
    marginTop: 4,
    fontSize: 11,
  },
  /* Insights */
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 24,
    marginBottom: 12,
  },
  insightsDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: colorsV2.accent[200],
  },
  insightCard: {
    padding: 16,
    borderRadius: 18,
    marginBottom: 10,
  },
  insightKicker: {
    marginBottom: 6,
    letterSpacing: 1.2,
  },
  insightTitle: {
    fontFamily: fontFamily.inter.semibold,
    fontWeight: '600',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.15,
    marginBottom: 6,
  },
  insightBody: {
    fontSize: 13,
    lineHeight: 18,
  },
});
