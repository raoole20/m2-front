/**
 * Inbox screen — V2.
 *
 * Ports `InboxScreenV2` from the design bundle to React Native:
 *   - `<Atmosphere mood="inbox" intensity="rich" />` background.
 *   - Editorial header (eyebrow + display "Your inbox" + meta line).
 *   - Glass search pill with decorative ⌘K hint.
 *   - Filter chips (All / Unread / Mine / AI handled).
 *   - List of glass `ConvoRow` items fed by TanStack Query.
 *   - Empty state ("Quietness.").
 *
 * Backend mismatch notes:
 *   - `apiClient.conversations.list()` only returns
 *     `{ id; title; status; updatedAt }` — there is no `contact`, `channel`,
 *     `intent`, `unreadCount`, or AI context. We therefore omit the channel
 *     mark, the IntentBadge, and the unread badge. The "name" line uses
 *     `title` and the timestamp formats `updatedAt`.
 *   - Filters `Mine` and `AI handled` are visual only — the backend has
 *     no way to express ownership / AI involvement yet.
 */

import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState, type ReactElement } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
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
  Search,
  SerifItalic,
} from '@/theme';
import { StatusBarV2 } from '@/components/v2';
import { apiClient } from '@/lib/api';
import type { conversations as conversationsResource } from '@m2/api-client';

type Conversation = Awaited<ReturnType<typeof conversationsResource.list>>[number];
type ConversationStatus = Conversation['status'];

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterId = 'all' | 'unread' | 'mine' | 'ai';

type Filter = {
  id: FilterId;
  label: string;
  /** Backend status, when the chip maps cleanly to `ConversationStatus`. */
  status?: ConversationStatus;
};

const FILTERS: ReadonlyArray<Filter> = [
  { id: 'all', label: 'All' },
  // The current backend lacks an `unread` flag — treat the chip as a "pending"
  // proxy so it remains useful until backend exposes unread counts.
  { id: 'unread', label: 'Unread', status: 'pending' },
  { id: 'mine', label: 'Mine' },
  { id: 'ai', label: 'AI handled' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    const hh = date.getHours().toString().padStart(2, '0');
    const mm = date.getMinutes().toString().padStart(2, '0');
    return `${hh}:${mm}`;
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const wasYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();
  if (wasYesterday) return 'Yesterday';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function InboxScreen(): ReactElement {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterId>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const activeFilter = FILTERS.find((f) => f.id === filter) ?? FILTERS[0];
  const queryStatus = activeFilter?.status;

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['conversations', queryStatus ?? 'all'] as const,
    queryFn: () =>
      apiClient.conversations.list(queryStatus ? { status: queryStatus } : undefined),
  });

  const conversations = useMemo<Conversation[]>(
    () => (Array.isArray(data) ? data : []),
    [data],
  );

  const filtered = useMemo<Conversation[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length === 0) return conversations;
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  const meta = useMemo(() => {
    const total = conversations.length;
    const pending = conversations.filter((c) => c.status === 'pending').length;
    const open = conversations.filter((c) => c.status === 'open').length;
    return { total, pending, open };
  }, [conversations]);

  const handleOpenConversation = (id: string): void => {
    router.push({ pathname: '/inbox/[id]', params: { id } } as never);
  };

  return (
    <View style={styles.root}>
      <Atmosphere mood="inbox" intensity="rich" />
      <View style={styles.fill}>
        <StatusBarV2 />

        {/* Editorial header */}
        <View style={styles.header}>
          <Micro>Motomoto · Inbox</Micro>
          <View style={styles.headlineRow}>
            <GradText style={styles.headlineWord}>Your</GradText>
            <Display style={styles.headlineRest}> inbox</Display>
          </View>
          <View style={styles.metaRow}>
            <Body color={colorsV2.text.muted} style={styles.metaText}>
              {meta.total} conversation{meta.total === 1 ? '' : 's'}
            </Body>
            <View style={styles.metaDot} />
            <Body color={colorsV2.accent[100]} style={styles.metaText}>
              {meta.pending} pending
            </Body>
            <View style={styles.metaDot} />
            <Body color={colorsV2.text.muted} style={styles.metaText}>
              {meta.open} open
            </Body>
          </View>
        </View>

        {/* Glass search pill */}
        <View style={styles.searchWrapper}>
          <Glass variant="input" style={styles.searchPill}>
            <Search size={16} color={colorsV2.text.muted} strokeWidth={1.7} />
            <TextInput
              placeholder="Search conversations, customers, intents…"
              placeholderTextColor={colorsV2.text.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
            <Micro style={styles.searchHint}>⌘K</Micro>
          </Glass>
        </View>

        {/* Filter chips */}
        <View style={styles.filtersWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersRow}
          >
            {FILTERS.map((f) => (
              <FilterChip
                key={f.id}
                label={f.label}
                active={filter === f.id}
                onPress={() => setFilter(f.id)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Error chip */}
        {isError ? (
          <ErrorChip onRetry={() => void refetch()} />
        ) : null}

        {/* List */}
        {isLoading ? (
          <View style={styles.listContent}>
            {Array.from({ length: 5 }).map((_, i) => (
              <ConvoRowSkeleton key={i} delay={i * 80} />
            ))}
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }: ListRenderItemInfo<Conversation>) => (
              <ConvoRow
                conversation={item}
                index={index}
                onPress={() => handleOpenConversation(item.id)}
              />
            )}
            ListEmptyComponent={() => (isFetching ? null : <InboxEmpty />)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
          />
        )}
      </View>
    </View>
  );
}

// ─── Filter chip ──────────────────────────────────────────────────────────────

type FilterChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

function FilterChip({ label, active, onPress }: FilterChipProps): ReactElement {
  if (active) {
    return (
      <Pressable onPress={onPress} style={styles.chipPressable}>
        <LinearGradient
          colors={['rgba(139,140,247,0.28)', 'rgba(99,102,241,0.14)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.chip, styles.chipActive]}
        >
          <Body
            color={colorsV2.text.primary}
            size="small"
            style={styles.chipLabelActive}
          >
            {label}
          </Body>
        </LinearGradient>
      </Pressable>
    );
  }
  return (
    <Pressable onPress={onPress} style={styles.chipPressable}>
      <View style={[styles.chip, styles.chipInactive]}>
        <Body color={colorsV2.text.secondary} size="small" style={styles.chipLabel}>
          {label}
        </Body>
      </View>
    </Pressable>
  );
}

// ─── Conversation row ─────────────────────────────────────────────────────────

type ConvoRowProps = {
  conversation: Conversation;
  index: number;
  onPress: () => void;
};

function ConvoRow({ conversation, index, onPress }: ConvoRowProps): ReactElement {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  useEffect(() => {
    const delay = index * 30;
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

  const timestamp = formatTimestamp(conversation.updatedAt);
  const preview = `Status: ${conversation.status}`;

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open conversation ${conversation.title}`}
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
      >
        {/*
          NOTE: the V2 design includes an avatar with channel-mark dot and
          an `IntentBadgeV2`, but `apiClient.conversations.list()` does not
          expose contact, channel, or intent. We render a serif initial blob
          as a stand-in so the row reads as editorial without inventing data.
        */}
        <View style={styles.rowAvatar}>
          <LinearGradient
            colors={[colorsV2.accent[100], colorsV2.accent[300]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarBlob}
          >
            <SerifItalic size={20} color={colorsV2.text.primary}>
              {(conversation.title[0] ?? '?').toUpperCase()}
            </SerifItalic>
          </LinearGradient>
        </View>
        <View style={styles.rowBody}>
          <View style={styles.rowTopLine}>
            <Body color={colorsV2.text.primary} style={styles.rowName} numberOfLines={1}>
              {conversation.title}
            </Body>
            <Micro style={styles.rowTimestamp}>{timestamp}</Micro>
          </View>
          <View style={styles.rowStatusLine}>
            <StatusDot status={conversation.status} />
            <Micro color={colorsV2.text.muted} style={styles.rowStatusLabel}>
              {conversation.status}
            </Micro>
          </View>
          <Body
            color={colorsV2.text.secondary}
            size="small"
            style={styles.rowPreview}
            numberOfLines={2}
          >
            {preview}
          </Body>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function StatusDot({ status }: { status: ConversationStatus }): ReactElement {
  const color =
    status === 'open'
      ? colorsV2.state.success
      : status === 'pending'
        ? colorsV2.state.warning
        : colorsV2.text.muted;
  return (
    <View
      style={[
        styles.statusDot,
        { backgroundColor: color, shadowColor: color },
      ]}
    />
  );
}

// ─── Loading skeleton (single row, animated shimmer) ──────────────────────────

function ConvoRowSkeleton({ delay }: { delay: number }): ReactElement {
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
    <Animated.View style={[styles.row, style]}>
      <View style={[styles.rowAvatar, styles.skeletonAvatar]} />
      <View style={styles.rowBody}>
        <View style={styles.skeletonLineLong} />
        <View style={styles.skeletonLineMedium} />
        <View style={styles.skeletonLineShort} />
      </View>
    </Animated.View>
  );
}

// ─── Error chip ───────────────────────────────────────────────────────────────

function ErrorChip({ onRetry }: { onRetry: () => void }): ReactElement {
  return (
    <View style={styles.errorChipWrapper}>
      <View style={styles.errorChip}>
        <Body color={colorsV2.state.danger} size="small" style={styles.errorChipText}>
          Couldn’t load conversations.
        </Body>
        <Pressable onPress={onRetry} hitSlop={8}>
          <Micro color={colorsV2.text.primary}>Retry</Micro>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function InboxEmpty(): ReactElement {
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
      <SerifItalic size={48} color={colorsV2.text.primary}>
        Quietness.
      </SerifItalic>
      <Body
        color={colorsV2.text.muted}
        size="small"
        style={styles.emptyCopy}
      >
        Conversations will appear here as they come in.
      </Body>
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
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 999,
    backgroundColor: colorsV2.text.muted,
    marginHorizontal: 8,
    opacity: 0.7,
  },
  searchWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  searchPill: {
    height: 44,
    borderRadius: 999,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: colorsV2.text.primary,
    fontFamily: fontFamily.inter.regular,
    fontSize: 14,
    padding: 0,
  },
  searchHint: {
    fontSize: 9,
    opacity: 0.7,
  },
  filtersWrapper: {
    paddingBottom: 14,
  },
  filtersRow: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  chipPressable: {
    borderRadius: 999,
  },
  chip: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  chipActive: {
    borderColor: 'rgba(139,140,247,0.50)',
    shadowColor: colorsV2.accent[200],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 6,
  },
  chipInactive: {
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  chipLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  chipLabelActive: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fontFamily.inter.medium,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 96,
  },
  row: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 2,
  },
  rowPressed: {
    backgroundColor: 'rgba(255,255,255,0.025)',
  },
  rowAvatar: {
    width: 44,
    height: 44,
    borderRadius: 999,
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatarBlob: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  rowTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  rowName: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fontFamily.inter.semibold,
    fontWeight: '600',
    letterSpacing: -0.15,
  },
  rowTimestamp: {
    flexShrink: 0,
  },
  rowStatusLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowStatusLabel: {
    textTransform: 'uppercase',
  },
  rowPreview: {
    fontSize: 13,
    lineHeight: 18,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 2,
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
    maxWidth: 240,
    lineHeight: 20,
  },
  skeletonAvatar: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  skeletonLineLong: {
    height: 14,
    width: '70%',
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginBottom: 6,
  },
  skeletonLineMedium: {
    height: 10,
    width: '40%',
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 6,
  },
  skeletonLineShort: {
    height: 10,
    width: '85%',
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
});
