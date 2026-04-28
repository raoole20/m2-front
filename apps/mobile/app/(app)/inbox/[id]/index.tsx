/**
 * Conversation detail screen — V2.
 *
 * Ports `ConversationScreenV2` from the design bundle to React Native.
 *
 * Backend mismatch notes:
 *   - `apiClient.conversations.get(id)` returns
 *     `{ id; title; status; updatedAt }` only — no `contact`, `online`,
 *     `channel`, `aiContext`, or `suggestedReply`.
 *   - `apiClient.conversations.messages(id)` returns
 *     `{ id; direction; body; createdAt }[]` — no per-message `status`
 *     (sent/read) or sender metadata.
 *   - Therefore: AI summary card and floating AI suggestion chip render
 *     ONLY when their respective fields exist on the metadata object —
 *     today they will never render but are kept ready for backend. Read
 *     receipts and typing indicator are omitted.
 *
 * Composer: rendered visually but DISABLED. Tapping send shows a transient
 * "Coming soon" badge — no API call.
 */

import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import {
  Atmosphere,
  Body,
  Check,
  CheckDouble,
  ChevronLeft,
  colorsV2,
  fontFamily,
  Glass,
  Micro,
  MoreHorizontal,
  motionV2,
  Paperclip,
  Send,
  SerifItalic,
  Sparkle4,
} from '@/theme';
import { AvatarV2, StatusBarV2, TodayDivider } from '@/components/v2';
import { apiClient } from '@/lib/api';
import type { conversations as conversationsResource } from '@m2/api-client';

// ─── Types ────────────────────────────────────────────────────────────────────

type ConversationMeta = Awaited<
  ReturnType<typeof conversationsResource.get>
>;
type ConversationMessage = Awaited<
  ReturnType<typeof conversationsResource.messages>
>[number];

/**
 * Forward-compatible shape: when the backend grows AI fields, augment
 * this type-guard. Today these are always undefined.
 */
type ExtendedMeta = ConversationMeta & {
  online?: boolean;
  aiContext?: { summary?: string; tags?: ReadonlyArray<string> };
  suggestedReply?: string;
};

// Time window (ms) to cluster consecutive same-sender messages.
const CLUSTER_WINDOW_MS = 2 * 60 * 1000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatHourMinute(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const hh = date.getHours().toString().padStart(2, '0');
  const mm = date.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

type Cluster = {
  outbound: boolean;
  messages: ConversationMessage[];
};

function clusterMessages(messages: ReadonlyArray<ConversationMessage>): Cluster[] {
  const clusters: Cluster[] = [];
  for (const msg of messages) {
    const last = clusters[clusters.length - 1];
    const sameDirection = last && last.outbound === (msg.direction === 'outbound');
    let withinWindow = false;
    if (last && sameDirection) {
      const lastMsg = last.messages[last.messages.length - 1];
      if (lastMsg) {
        const lastTime = new Date(lastMsg.createdAt).getTime();
        const currTime = new Date(msg.createdAt).getTime();
        withinWindow =
          Number.isFinite(lastTime) &&
          Number.isFinite(currTime) &&
          currTime - lastTime <= CLUSTER_WINDOW_MS;
      }
    }
    if (last && sameDirection && withinWindow) {
      last.messages.push(msg);
    } else {
      clusters.push({
        outbound: msg.direction === 'outbound',
        messages: [msg],
      });
    }
  }
  return clusters;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ConversationScreen(): ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : '';

  const insets = useSafeAreaInsets();

  const [draft, setDraft] = useState('');
  const [showSummary, setShowSummary] = useState(true);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const comingSoonTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (comingSoonTimeout.current !== null) {
        clearTimeout(comingSoonTimeout.current);
      }
    },
    [],
  );

  const conversationQuery = useQuery({
    queryKey: ['conversation', id] as const,
    queryFn: () => apiClient.conversations.get(id),
    enabled: id.length > 0,
  });

  const messagesQuery = useQuery({
    queryKey: ['messages', id] as const,
    queryFn: () => apiClient.conversations.messages(id),
    enabled: id.length > 0,
  });

  const meta = conversationQuery.data as ExtendedMeta | undefined;
  const messages = messagesQuery.data ?? [];
  const clusters = useMemo(() => clusterMessages(messages), [messages]);

  const aiSummary = meta?.aiContext?.summary;
  const aiTags = meta?.aiContext?.tags ?? [];
  const suggestedReply = meta?.suggestedReply;
  const isOnline = meta?.online ?? false;

  const handleBack = (): void => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/inbox' as never);
    }
  };

  const handleSendComingSoon = (): void => {
    setShowComingSoon(true);
    if (comingSoonTimeout.current !== null) {
      clearTimeout(comingSoonTimeout.current);
    }
    comingSoonTimeout.current = setTimeout(() => setShowComingSoon(false), 2000);
  };

  const useSuggestion = (): void => {
    if (suggestedReply !== undefined) setDraft(suggestedReply);
  };

  const isLoading = conversationQuery.isLoading || messagesQuery.isLoading;
  const isError = conversationQuery.isError || messagesQuery.isError;
  const handleRetry = (): void => {
    void conversationQuery.refetch();
    void messagesQuery.refetch();
  };

  const headerName = meta?.title ?? '';

  return (
    <View style={styles.root}>
      <Atmosphere mood="conversation" intensity="subtle" />
      <View style={styles.fill}>
        <StatusBarV2 />

        {/* Header card */}
        <View style={styles.headerWrapper}>
          <Glass variant="card" style={styles.headerCard}>
            <Pressable
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel="Back to inbox"
              style={styles.iconButton}
              hitSlop={6}
            >
              <ChevronLeft size={16} color={colorsV2.text.primary} strokeWidth={1.8} />
            </Pressable>
            <AvatarV2 name={headerName || '?'} size={32} online={isOnline} />
            <View style={styles.headerCenter}>
              <SerifItalic
                size={11}
                color={colorsV2.text.muted}
                style={styles.headerEyebrow}
              >
                talking with
              </SerifItalic>
              <Body
                color={colorsV2.text.primary}
                style={styles.headerName}
                numberOfLines={1}
              >
                {headerName || '…'}
              </Body>
              {isOnline ? (
                <Micro color={colorsV2.state.success} style={styles.headerActive}>
                  ● Active now
                </Micro>
              ) : meta ? (
                <Micro color={colorsV2.text.muted} style={styles.headerActive}>
                  {meta.status}
                </Micro>
              ) : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="More options"
              style={styles.iconButton}
              hitSlop={6}
              onPress={() => undefined}
            >
              <MoreHorizontal size={16} color={colorsV2.text.primary} />
            </Pressable>
          </Glass>
        </View>

        {/* Error chip */}
        {isError ? (
          <View style={styles.errorChipWrapper}>
            <View style={styles.errorChip}>
              <Body
                color={colorsV2.state.danger}
                size="small"
                style={styles.errorChipText}
              >
                Couldn’t load this conversation.
              </Body>
              <Pressable onPress={handleRetry} hitSlop={8}>
                <Micro color={colorsV2.text.primary}>Retry</Micro>
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* AI summary card — only renders when backend exposes summary */}
        {showSummary && aiSummary !== undefined ? (
          <AISummaryCard
            summary={aiSummary}
            tags={aiTags}
            onDismiss={() => setShowSummary(false)}
          />
        ) : null}

        {/* Body */}
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[
              styles.messagesContent,
              { paddingBottom: 16 + (suggestedReply !== undefined ? 64 : 0) },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.todayWrapper}>
              <TodayDivider label="Today" />
            </View>

            {isLoading ? (
              <MessagesSkeleton />
            ) : (
              clusters.map((cluster, idx) => (
                <MessageCluster
                  key={`${cluster.outbound ? 'o' : 'i'}-${idx}-${cluster.messages[0]?.id ?? idx}`}
                  cluster={cluster}
                  contactName={headerName}
                />
              ))
            )}
          </ScrollView>

          {/* Floating AI suggestion */}
          {suggestedReply !== undefined ? (
            <View style={styles.suggestionWrapper}>
              <Pressable onPress={useSuggestion} accessibilityRole="button">
                <Glass variant="chip" style={styles.suggestionGlass}>
                  <View style={styles.suggestionSparkle}>
                    <Sparkle4 size={11} color={colorsV2.text.primary} />
                  </View>
                  <View style={styles.suggestionBody}>
                    <View style={styles.suggestionHeaderRow}>
                      <SerifItalic size={13} color={colorsV2.accent[100]}>
                        IA suggests
                      </SerifItalic>
                      <View style={styles.flex} />
                      <Micro color={colorsV2.accent[100]} style={styles.suggestionAffordance}>
                        TAP TO USE
                      </Micro>
                    </View>
                    <Body
                      color={colorsV2.text.secondary}
                      size="small"
                      style={styles.suggestionText}
                      numberOfLines={2}
                    >
                      “{suggestedReply}”
                    </Body>
                  </View>
                </Glass>
              </Pressable>
            </View>
          ) : null}

          {/* Composer */}
          <View
            style={[
              styles.inputWrapper,
              { paddingBottom: 16 + (insets.bottom > 0 ? insets.bottom - 4 : 0) },
            ]}
          >
            <Glass variant="input" style={styles.inputBar}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Attach"
                style={styles.attachButton}
                hitSlop={6}
                onPress={() => undefined}
              >
                <Paperclip
                  size={20}
                  color={colorsV2.text.muted}
                  strokeWidth={1.7}
                />
              </Pressable>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Mensaje…"
                placeholderTextColor={colorsV2.text.muted}
                multiline
                style={styles.input}
                maxLength={1000}
              />
              <SendButton
                hasDraft={draft.trim().length > 0}
                onPress={handleSendComingSoon}
              />
            </Glass>
            <View style={styles.comingSoonRow}>
              <Micro color={colorsV2.text.muted}>Sending coming soon</Micro>
              {showComingSoon ? (
                <ComingSoonToast />
              ) : null}
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

// ─── Send button ──────────────────────────────────────────────────────────────

type SendButtonProps = {
  hasDraft: boolean;
  onPress: () => void;
};

function SendButton({ hasDraft, onPress }: SendButtonProps): ReactElement {
  if (hasDraft) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Send message (coming soon)"
        accessibilityHint="Sending is not yet available"
      >
        <LinearGradient
          colors={[colorsV2.accent[100], colorsV2.accent[300]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.sendButton, styles.sendButtonActive]}
        >
          <Send size={16} color={colorsV2.text.primary} strokeWidth={1.8} />
        </LinearGradient>
      </Pressable>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Send (disabled)"
      accessibilityState={{ disabled: true }}
    >
      <View style={[styles.sendButton, styles.sendButtonInactive]}>
        <Send size={16} color={colorsV2.text.muted} strokeWidth={1.8} />
      </View>
    </Pressable>
  );
}

function ComingSoonToast(): ReactElement {
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 220,
      easing: Easing.bezier(...motionV2.fadeUp.bezier),
    });
  }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={[styles.toast, style]}>
      <Micro color={colorsV2.accent[100]}>Envío de mensajes próximamente</Micro>
    </Animated.View>
  );
}

// ─── Message cluster ──────────────────────────────────────────────────────────

type MessageClusterProps = {
  cluster: Cluster;
  contactName: string;
};

function MessageCluster({ cluster, contactName }: MessageClusterProps): ReactElement {
  const { outbound, messages } = cluster;
  return (
    <View
      style={[
        styles.clusterRow,
        outbound ? styles.clusterRowOutbound : styles.clusterRowInbound,
      ]}
    >
      {!outbound ? (
        <View style={styles.clusterAvatar}>
          <AvatarV2 name={contactName || '?'} size={26} />
        </View>
      ) : (
        <View style={styles.clusterAvatarSpacer} />
      )}
      <View style={styles.bubbleStack}>
        {messages.map((msg, idx) => {
          const isLast = idx === messages.length - 1;
          return (
            <Bubble
              key={msg.id}
              outbound={outbound}
              text={msg.body}
              timestamp={isLast ? formatHourMinute(msg.createdAt) : undefined}
              isLast={isLast}
            />
          );
        })}
      </View>
    </View>
  );
}

type BubbleProps = {
  outbound: boolean;
  text: string;
  timestamp: string | undefined;
  isLast: boolean;
};

function Bubble({ outbound, text, timestamp, isLast }: BubbleProps): ReactElement {
  const radius = 16;
  const tailRadius = 4;
  const radii = outbound
    ? {
        borderTopLeftRadius: radius,
        borderTopRightRadius: radius,
        borderBottomLeftRadius: radius,
        borderBottomRightRadius: isLast ? tailRadius : radius,
      }
    : {
        borderTopLeftRadius: radius,
        borderTopRightRadius: radius,
        borderBottomLeftRadius: isLast ? tailRadius : radius,
        borderBottomRightRadius: radius,
      };

  const containerStyle = [
    styles.bubble,
    outbound ? styles.bubbleOutbound : styles.bubbleInbound,
    radii,
  ];

  const inner: ReactNode = (
    <>
      <Body color={colorsV2.text.primary} size="small" style={styles.bubbleText}>
        {text}
      </Body>
      {isLast && timestamp !== undefined ? (
        <View
          style={[
            styles.statusRow,
            outbound ? styles.statusRowEnd : styles.statusRowStart,
          ]}
        >
          <Micro color={colorsV2.text.muted} style={styles.statusTime}>
            {timestamp}
          </Micro>
          {outbound ? (
            <CheckIndicator read={false} />
          ) : null}
        </View>
      ) : null}
    </>
  );

  if (outbound) {
    return (
      <LinearGradient
        colors={['rgba(139,140,247,0.32)', 'rgba(99,102,241,0.18)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={containerStyle}
      >
        {inner}
      </LinearGradient>
    );
  }

  return <View style={containerStyle}>{inner}</View>;
}

function CheckIndicator({ read }: { read: boolean }): ReactElement {
  if (read) {
    return (
      <CheckDouble
        size={11}
        color={colorsV2.accent[100]}
        strokeWidth={2}
      />
    );
  }
  // NOTE: backend does not expose per-message read receipts — we always show
  // the single check until the message DTO grows a `status` field.
  return (
    <Check size={11} color={colorsV2.text.muted} strokeWidth={2} />
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function MessagesSkeleton(): ReactElement {
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

  const widths = ['68%', '54%', '78%', '46%'] as const;
  return (
    <Animated.View style={[styles.flex, style]}>
      {widths.map((w, i) => {
        const outbound = i % 2 === 1;
        return (
          <View
            key={i}
            style={[
              styles.clusterRow,
              outbound ? styles.clusterRowOutbound : styles.clusterRowInbound,
            ]}
          >
            <View style={styles.clusterAvatarSpacer} />
            <View
              style={[
                styles.bubble,
                styles.bubbleSkeleton,
                outbound ? styles.bubbleOutboundSkeleton : null,
                {
                  width: w as `${number}%`,
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                  borderBottomLeftRadius: outbound ? 16 : 4,
                  borderBottomRightRadius: outbound ? 4 : 16,
                },
              ]}
            />
          </View>
        );
      })}
    </Animated.View>
  );
}

// ─── AI summary card ──────────────────────────────────────────────────────────

type AISummaryCardProps = {
  summary: string;
  tags: ReadonlyArray<string>;
  onDismiss: () => void;
};

function AISummaryCard({
  summary,
  tags,
  onDismiss,
}: AISummaryCardProps): ReactElement {
  // TODO: replace this LinearGradient border with a Skia conic gradient
  // for a true iridescent edge once the mobile app ships its first
  // visual QA pass — keeping the simpler fallback here per Lote B spec.
  return (
    <View style={styles.summaryWrapper}>
      <LinearGradient
        colors={[
          'rgba(139,140,247,0.55)',
          'rgba(95,168,255,0.40)',
          'rgba(139,140,247,0.55)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.summaryBorder}
      >
        <Glass variant="card" style={styles.summaryGlass}>
          <View style={styles.summaryHeader}>
            <Sparkle4 size={12} color={colorsV2.accent[100]} />
            <SerifItalic
              size={14}
              color={colorsV2.accent[100]}
              style={styles.summaryEyebrow}
            >
              What I noticed
            </SerifItalic>
            <View style={styles.flex} />
            <Pressable onPress={onDismiss} hitSlop={8} accessibilityRole="button">
              <Micro color={colorsV2.text.muted}>Hide</Micro>
            </Pressable>
          </View>
          <Body
            color={colorsV2.text.secondary}
            size="small"
            style={styles.summaryBody}
          >
            {summary}
          </Body>
          {tags.length > 0 ? (
            <View style={styles.summaryTags}>
              {tags.map((tag) => (
                <View key={tag} style={styles.summaryTag}>
                  <Body
                    color={colorsV2.text.secondary}
                    size="small"
                    style={styles.summaryTagText}
                  >
                    {tag}
                  </Body>
                </View>
              ))}
            </View>
          ) : null}
        </Glass>
      </LinearGradient>
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
  flex: { flex: 1 },
  headerWrapper: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  headerCard: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    minWidth: 0,
  },
  headerEyebrow: {
    lineHeight: 12,
  },
  headerName: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: fontFamily.inter.semibold,
    fontWeight: '600',
    letterSpacing: -0.16,
    marginTop: -1,
  },
  headerActive: {
    marginTop: 2,
    fontSize: 9,
  },
  errorChipWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
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
  // Summary card
  summaryWrapper: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  summaryBorder: {
    borderRadius: 18,
    padding: 1,
  },
  summaryGlass: {
    borderRadius: 17,
    padding: 14,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  summaryEyebrow: {
    lineHeight: 16,
  },
  summaryBody: {
    fontSize: 13,
    lineHeight: 20,
  },
  summaryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  summaryTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(139,140,247,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(139,140,247,0.25)',
  },
  summaryTagText: {
    fontSize: 10,
    lineHeight: 14,
    fontFamily: fontFamily.inter.medium,
    fontWeight: '500',
  },
  // Messages
  messagesContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  todayWrapper: {
    paddingHorizontal: 0,
    marginBottom: 14,
  },
  clusterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    alignItems: 'flex-end',
  },
  clusterRowOutbound: {
    flexDirection: 'row-reverse',
  },
  clusterRowInbound: {
    flexDirection: 'row',
  },
  clusterAvatar: {
    width: 26,
    height: 26,
    flexShrink: 0,
  },
  clusterAvatarSpacer: {
    width: 26,
    flexShrink: 0,
  },
  bubbleStack: {
    flexDirection: 'column',
    gap: 3,
    maxWidth: '78%',
  },
  bubble: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderWidth: 1,
  },
  bubbleOutbound: {
    alignSelf: 'flex-end',
    borderColor: 'rgba(139,140,247,0.40)',
    shadowColor: colorsV2.accent[200],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 4,
  },
  bubbleInbound: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  bubbleSkeleton: {
    height: 38,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  bubbleOutboundSkeleton: {
    backgroundColor: 'rgba(139,140,247,0.10)',
    borderColor: 'rgba(139,140,247,0.20)',
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    opacity: 0.55,
  },
  statusRowStart: {
    justifyContent: 'flex-start',
  },
  statusRowEnd: {
    justifyContent: 'flex-end',
  },
  statusTime: {
    fontSize: 10,
  },
  // Suggestion
  suggestionWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 80,
  },
  suggestionGlass: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderColor: 'rgba(139,140,247,0.40)',
  },
  suggestionSparkle: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: colorsV2.accent[200],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    shadowColor: colorsV2.accent[200],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 4,
  },
  suggestionBody: {
    flex: 1,
  },
  suggestionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  suggestionAffordance: {
    fontSize: 9,
  },
  suggestionText: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  // Composer
  inputWrapper: {
    paddingHorizontal: 18,
    paddingTop: 4,
  },
  inputBar: {
    borderRadius: 24,
    padding: 6,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    color: colorsV2.text.primary,
    fontFamily: fontFamily.inter.regular,
    fontSize: 14,
    paddingHorizontal: 4,
    paddingVertical: 10,
    maxHeight: 80,
    minHeight: 36,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    shadowColor: colorsV2.accent[200],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 6,
  },
  sendButtonInactive: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  comingSoonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  toast: {
    backgroundColor: 'rgba(139,140,247,0.10)',
    borderColor: 'rgba(139,140,247,0.30)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
});
