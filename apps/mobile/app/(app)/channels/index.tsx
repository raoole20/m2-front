/**
 * Channels screen — V2.
 *
 * Ports `ChannelsScreenV2` from the design bundle to React Native:
 *   - `<Atmosphere mood="channels" intensity="rich" />` background.
 *   - Editorial header (eyebrow with connected count + display "Every
 *     channel" + meta line).
 *   - List of `ChannelTile` glass cards (brand halo + gradient logo tile +
 *     name + LIVE/PAUSED status + dim "OPEN" big number on the right).
 *   - "Connect another channel" dashed CTA.
 *   - Loading skeleton, empty state, and error chip with retry.
 *
 * Backend mismatch notes:
 *   - `apiClient.channels.list()` returns the m2-back `Channel` shape
 *     (`{ id; type; name; isActive; createdAt; updatedAt; ... }`). Fields
 *     the V2 design relies on but the backend does NOT expose:
 *       • `accountIdentifier` / per-channel external identifier (not in
 *         `findAll`'s `select`; only available via the credentials blob in
 *         `findOne`, which we cannot expose in a list view).
 *       • `openConversations` count and per-channel reply latency — there
 *         is no aggregate route.
 *       • Editorial status (`LIVE` / `PAUSED` / `ERROR`). Today the only
 *         signal is `isActive: boolean`, so we map `true → LIVE`, `false →
 *         PAUSED`. `ChannelStatus` in `@m2/api-client` already documents
 *         this mismatch.
 *     We therefore omit account info, latency, and the open-conversations
 *     big number from the tile until the backend grows those fields.
 *
 *   - `Channel.type` from `@m2/types` is the lowercase enum
 *     (`'whatsapp' | 'instagram' | 'facebook' | 'sms' | 'email'`), but
 *     `colorsV2.channels` also keys `'messenger'` and `'telegram'`. The
 *     mobile UI uses the typed lowercase enum keys; if backend later
 *     surfaces `'messenger'` / `'telegram'` we extend `ChannelType` upstream.
 */

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, type ReactElement } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  ToastAndroid,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import {
  Atmosphere,
  Body,
  colorsV2,
  Display,
  EmailMark,
  fontFamily,
  Glass,
  GradText,
  InstagramMark,
  Micro,
  motionV2,
  Plus,
  SerifItalic,
  SMSMark,
  WhatsAppMark,
} from '@/theme';
import { StatusBarV2 } from '@/components/v2';
import { apiClient } from '@/lib/api';
import type { Channel, ChannelType } from '@m2/types';

// ─── Channel meta ─────────────────────────────────────────────────────────────

type ChannelIcon = (props: { size?: number; color?: string }) => ReactElement;

type ChannelMeta = {
  name: string;
  Icon: ChannelIcon;
  color: string;
};

/**
 * Visual metadata for each `ChannelType`. Falls back to the Email mark when
 * the channel type lacks a brand icon (e.g. `facebook`).
 */
const CHANNEL_META: Record<ChannelType, ChannelMeta> = {
  whatsapp: { name: 'WhatsApp', Icon: WhatsAppMark, color: colorsV2.channels.whatsapp },
  instagram: { name: 'Instagram', Icon: InstagramMark, color: colorsV2.channels.instagram },
  facebook: { name: 'Facebook', Icon: InstagramMark, color: colorsV2.channels.facebook },
  sms: { name: 'SMS', Icon: SMSMark, color: colorsV2.channels.sms },
  email: { name: 'Email', Icon: EmailMark, color: colorsV2.channels.email },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  if (value.length !== 6) return hex;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function showConnectComingSoon(): void {
  if (ToastAndroid && typeof ToastAndroid.show === 'function') {
    ToastAndroid.show('Conexión de canales próximamente', ToastAndroid.SHORT);
  }
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ChannelsScreen(): ReactElement {
  const router = useRouter();

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['channels'] as const,
    queryFn: () => apiClient.channels.list(),
  });

  const channels: Channel[] = Array.isArray(data) ? data : [];
  const connectedCount = channels.filter((c) => c.isActive).length;

  const handleOpenChannel = (id: string): void => {
    router.push({ pathname: '/channels/[id]', params: { id } } as never);
  };

  return (
    <View style={styles.root}>
      <Atmosphere mood="channels" intensity="rich" />
      <View style={styles.fill}>
        <StatusBarV2 />

        {/* Editorial header */}
        <View style={styles.header}>
          <Micro>
            {connectedCount > 0
              ? `${connectedCount} CONNECTED · ${channels.length} CHANNELS`
              : 'MOTOMOTO · CHANNELS'}
          </Micro>
          <View style={styles.headlineRow}>
            <GradText style={styles.headlineWord}>Every</GradText>
            <Display style={styles.headlineRest}> channel</Display>
          </View>
          <View style={styles.metaRow}>
            <Body color={colorsV2.text.muted} style={styles.metaText}>
              {channels.length === 0
                ? 'No channels yet'
                : `${channels.length} ${channels.length === 1 ? 'channel' : 'channels'} connected`}
            </Body>
          </View>
        </View>

        {/* Error chip */}
        {isError ? <ErrorChip onRetry={() => void refetch()} /> : null}

        {/* List */}
        {isLoading ? (
          <View style={styles.listContent}>
            {Array.from({ length: 3 }).map((_, i) => (
              <ChannelTileSkeleton key={i} delay={i * 80} />
            ))}
          </View>
        ) : (
          <FlatList
            data={channels}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }: ListRenderItemInfo<Channel>) => (
              <ChannelTile
                channel={item}
                index={index}
                onPress={() => handleOpenChannel(item.id)}
              />
            )}
            ListFooterComponent={() => (
              <ConnectCta onPress={showConnectComingSoon} />
            )}
            ListEmptyComponent={() =>
              isFetching ? null : <ChannelsEmpty onConnect={showConnectComingSoon} />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

// ─── Channel tile ─────────────────────────────────────────────────────────────

type ChannelTileProps = {
  channel: Channel;
  index: number;
  onPress: () => void;
};

function ChannelTile({ channel, index, onPress }: ChannelTileProps): ReactElement {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  useEffect(() => {
    const delay = index * 50;
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
  }, [index, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const meta = CHANNEL_META[channel.type];
  const paused = !channel.isActive;
  const statusLabel = paused ? '● PAUSED' : '● LIVE';
  const statusColor = paused ? colorsV2.state.warning : colorsV2.state.success;

  // External identifier is not surfaced by `channels.list` (only via
  // `findOne` which decrypts credentials), so we fall back to the channel
  // type label.
  const accountLine = meta.name;

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open channel ${channel.name}`}
        onPress={onPress}
        style={({ pressed }) => [pressed ? styles.tilePressed : null]}
      >
        <Glass variant="card" style={styles.tile}>
          {/* Brand-color halo */}
          <View
            pointerEvents="none"
            style={[
              styles.tileHalo,
              {
                backgroundColor: withAlpha(meta.color, 0.27),
              },
            ]}
          />

          {/* Logo tile */}
          <LinearGradient
            colors={[meta.color, withAlpha(meta.color, 0.8)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.tileLogo,
              {
                shadowColor: meta.color,
              },
            ]}
          >
            <View pointerEvents="none" style={styles.tileLogoSheen} />
            <meta.Icon size={26} color="#fff" />
          </LinearGradient>

          {/* Info */}
          <View style={styles.tileInfo}>
            <View style={styles.tileTopLine}>
              <Body
                color={colorsV2.text.primary}
                style={styles.tileName}
                numberOfLines={1}
              >
                {channel.name}
              </Body>
              <Micro style={[styles.tileStatus, { color: statusColor }]}>
                {statusLabel}
              </Micro>
            </View>
            <Body
              color={colorsV2.text.muted}
              size="small"
              style={styles.tileAccount}
              numberOfLines={1}
            >
              {accountLine}
            </Body>
          </View>

          {/* Right-side accent — uses channel name length as a mild visual
              anchor since open-conversation count is not yet available. */}
          <View style={styles.tileRight}>
            <Body
              style={[
                styles.tileChevronCue,
                {
                  color: meta.color,
                  textShadowColor: withAlpha(meta.color, 0.6),
                },
              ]}
            >
              ›
            </Body>
            <Micro style={styles.tileRightLabel}>OPEN</Micro>
          </View>
        </Glass>
      </Pressable>
    </Animated.View>
  );
}

// ─── Connect CTA ──────────────────────────────────────────────────────────────

function ConnectCta({ onPress }: { onPress: () => void }): ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Connect another channel"
      onPress={onPress}
      style={styles.ctaPressable}
    >
      <View style={styles.cta}>
        <Plus size={16} color={colorsV2.accent[100]} strokeWidth={2} />
        <Body color={colorsV2.accent[100]} size="small" style={styles.ctaLabel}>
          Connect another channel
        </Body>
      </View>
    </Pressable>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function ChannelTileSkeleton({ delay }: { delay: number }): ReactElement {
  const shimmer = useSharedValue(0.4);

  useEffect(() => {
    const timeout = setTimeout(() => {
      shimmer.value = withRepeat(
        withTiming(1, {
          duration: motionV2.pulse.durationMs,
          easing: Easing.bezier(...motionV2.pulse.bezier),
        }),
        -1,
        true,
      );
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay, shimmer]);

  const style = useAnimatedStyle(() => ({ opacity: shimmer.value }));

  return (
    <Animated.View style={[styles.skeletonRow, style]}>
      <View style={styles.skeletonLogo} />
      <View style={styles.skeletonBody}>
        <View style={styles.skeletonLineLong} />
        <View style={styles.skeletonLineShort} />
      </View>
      <View style={styles.skeletonNumber} />
    </Animated.View>
  );
}

// ─── Error chip ───────────────────────────────────────────────────────────────

function ErrorChip({ onRetry }: { onRetry: () => void }): ReactElement {
  return (
    <View style={styles.errorChipWrapper}>
      <View style={styles.errorChip}>
        <Body color={colorsV2.state.danger} size="small" style={styles.errorChipText}>
          Couldn’t load channels.
        </Body>
        <Pressable onPress={onRetry} hitSlop={8}>
          <Micro color={colorsV2.text.primary}>Retry</Micro>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function ChannelsEmpty({ onConnect }: { onConnect: () => void }): ReactElement {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyHalo} pointerEvents="none">
        <LinearGradient
          colors={['rgba(139,140,247,0.18)', 'rgba(139,140,247,0)']}
          start={{ x: 0.5, y: 0.4 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>
      <SerifItalic size={36} color={colorsV2.text.primary}>
        Nothing connected yet.
      </SerifItalic>
      <Body
        color={colorsV2.text.muted}
        size="small"
        style={styles.emptyCopy}
      >
        Plug in WhatsApp, Instagram, SMS, or Email to start receiving conversations.
      </Body>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Connect a channel"
        onPress={onConnect}
        style={styles.emptyCtaPressable}
      >
        <LinearGradient
          colors={[colorsV2.accent[100], colorsV2.accent[300]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.emptyCta}
        >
          <Body
            color={colorsV2.text.primary}
            size="small"
            style={styles.emptyCtaLabel}
          >
            Connect a channel
          </Body>
        </LinearGradient>
      </Pressable>
    </View>
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 14,
  },
  headlineRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  headlineWord: {
    fontFamily: fontFamily.instrumentSerif.italic,
    fontSize: 42,
    fontStyle: 'italic',
    color: colorsV2.accent[100],
    marginRight: 6,
    letterSpacing: -0.4,
    lineHeight: 44,
  },
  headlineRest: {
    fontSize: 38,
    lineHeight: 42,
  },
  metaRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
    lineHeight: 18,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 96,
  },
  tilePressed: {
    opacity: 0.85,
  },
  tile: {
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  tileHalo: {
    position: 'absolute',
    left: -20,
    top: '50%',
    width: 110,
    height: 110,
    borderRadius: 999,
    marginTop: -55,
    opacity: 0.6,
  },
  tileLogo: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
  },
  tileLogoSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.30)',
    opacity: 0.6,
  },
  tileInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  tileTopLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  tileName: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: fontFamily.inter.semibold,
    fontWeight: '600',
    letterSpacing: -0.16,
    flexShrink: 1,
  },
  tileStatus: {
    fontSize: 9,
    flexShrink: 0,
  },
  tileAccount: {
    fontSize: 13,
    lineHeight: 18,
  },
  tileRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
    gap: 4,
  },
  tileChevronCue: {
    fontSize: 26,
    fontWeight: '600',
    lineHeight: 28,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
    letterSpacing: -1,
  },
  tileRightLabel: {
    fontSize: 9,
  },
  ctaPressable: {
    borderRadius: 18,
  },
  cta: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(139,140,247,0.30)',
    backgroundColor: 'rgba(139,140,247,0.04)',
  },
  ctaLabel: {
    fontFamily: fontFamily.inter.medium,
    fontWeight: '500',
    fontSize: 13,
  },
  errorChipWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  errorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(239,68,68,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.35)',
  },
  errorChipText: {
    flex: 1,
    fontSize: 13,
  },
  empty: {
    paddingTop: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
    position: 'relative',
  },
  emptyHalo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.6,
  },
  emptyCopy: {
    marginTop: 12,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },
  emptyCtaPressable: {
    marginTop: 20,
    borderRadius: 14,
  },
  emptyCta: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyCtaLabel: {
    fontFamily: fontFamily.inter.semibold,
    fontWeight: '600',
    fontSize: 13,
  },
  /* Skeleton */
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  skeletonLogo: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  skeletonBody: {
    flex: 1,
    gap: 6,
  },
  skeletonLineLong: {
    height: 14,
    width: '60%',
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  skeletonLineShort: {
    height: 10,
    width: '40%',
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  skeletonNumber: {
    width: 36,
    height: 26,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
});
