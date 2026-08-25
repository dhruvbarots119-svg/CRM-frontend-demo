// Inbox — chat threads with reply capability, channel filter, convert-to-lead.
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '@/src/theme';
import { useApp } from '@/src/store/AppContext';
import { MessageChannel } from '@/src/store/types';
import { Avatar, Chip, timeAgo } from '@/src/components/ui';

const CHANNELS: ('All' | MessageChannel)[] = ['All', 'WhatsApp', 'Facebook', 'Instagram', 'Email'];

export const CHANNEL_META: Record<MessageChannel, { color: string; soft: string; icon: keyof typeof Ionicons.glyphMap }> = {
  WhatsApp: { color: '#25D366', soft: '#E7FBEF', icon: 'logo-whatsapp' },
  Facebook: { color: '#1877F2', soft: '#E4EEFA', icon: 'logo-facebook' },
  Instagram: { color: '#E1306C', soft: '#FCE4EC', icon: 'logo-instagram' },
  Email: { color: '#0288D1', soft: colors.infoSoft, icon: 'mail' },
};

export const InboxScreen: React.FC<{ onOpenMessage: (id: string) => void }> = ({ onOpenMessage }) => {
  const { state } = useApp();
  const [filter, setFilter] = useState<'All' | MessageChannel>('All');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    let list = state.messages;
    if (filter !== 'All') list = list.filter((m) => m.channel === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((m) => m.from.toLowerCase().includes(q) || m.preview.toLowerCase().includes(q));
    }
    return list.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
  }, [state.messages, filter, query]);

  const totalUnread = state.messages.filter((m) => !m.isRead).length;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>Unified Chat</Text>
          <Text style={styles.heroSub}>
            {totalUnread > 0 ? `${totalUnread} unread across all channels` : 'All caught up across all channels'}
          </Text>
        </View>
        <View style={styles.channelIcons}>
          <View style={[styles.chIcon, { backgroundColor: CHANNEL_META.WhatsApp.soft }]}>
            <Ionicons name="logo-whatsapp" size={12} color={CHANNEL_META.WhatsApp.color} />
          </View>
          <View style={[styles.chIcon, { backgroundColor: CHANNEL_META.Instagram.soft, marginLeft: -6 }]}>
            <Ionicons name="logo-instagram" size={12} color={CHANNEL_META.Instagram.color} />
          </View>
          <View style={[styles.chIcon, { backgroundColor: CHANNEL_META.Facebook.soft, marginLeft: -6 }]}>
            <Ionicons name="logo-facebook" size={12} color={CHANNEL_META.Facebook.color} />
          </View>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        contentContainerStyle={styles.chipRowContent}
      >
        {CHANNELS.map((c) => {
          const count = c === 'All' ? state.messages.length : state.messages.filter((m) => m.channel === c).length;
          const unread =
            c === 'All'
              ? totalUnread
              : state.messages.filter((m) => m.channel === c && !m.isRead).length;
          return (
            <Chip
              key={c}
              label={`${c} ${count}${unread > 0 ? ' •' : ''}`}
              active={filter === c}
              onPress={() => setFilter(c)}
              testID={`inbox-filter-${c}`}
            />
          );
        })}
      </ScrollView>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="mail-open-outline" size={40} color={colors.gold} />
          <Text style={styles.emptyTitle}>No conversations here</Text>
          <Text style={styles.emptyBody}>Switch channel or wait for new messages.</Text>
        </View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {filtered.map((m) => {
            const meta = CHANNEL_META[m.channel];
            const initials = m.from.split(' ').map((x) => x[0]).join('').slice(0, 2);
            const lastMsg = m.thread[m.thread.length - 1];
            return (
              <Pressable
                key={m.id}
                testID={`msg-${m.id}`}
                onPress={() => onOpenMessage(m.id)}
                style={[styles.row, !m.isRead && styles.rowUnread]}
              >
                <View style={styles.avatarWrap}>
                  <Avatar label={initials} tone={meta.color} size={44} />
                  <View style={[styles.chDot, { backgroundColor: meta.color }]}>
                    <Ionicons name={meta.icon} size={8} color="#fff" />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.rowTop}>
                    <Text style={[styles.rowName, !m.isRead && { fontWeight: '800' }]}>{m.from}</Text>
                    <Text style={styles.rowTime}>{timeAgo(m.receivedAt)}</Text>
                  </View>
                  <Text
                    style={[styles.rowPreview, !m.isRead && { color: colors.text, fontWeight: '600' }]}
                    numberOfLines={1}
                  >
                    {lastMsg?.direction === 'out' ? 'You: ' : ''}
                    {m.preview}
                  </Text>
                  <View style={styles.rowMeta}>
                    {m.convertedToLeadId ? (
                      <View style={styles.convertedTag}>
                        <Ionicons name="checkmark-circle" size={10} color={colors.success} />
                        <Text style={styles.convertedText}>Lead created</Text>
                      </View>
                    ) : (
                      <View style={styles.newTag}>
                        <Ionicons name="sparkles" size={10} color={colors.gold} />
                        <Text style={styles.newText}>Tap to convert</Text>
                      </View>
                    )}
                    <Text style={styles.rowThreadCount}>{m.thread.length} msgs</Text>
                  </View>
                </View>
                {!m.isRead ? <View style={styles.unreadDot} /> : null}
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 120 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceInverse,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  heroTitle: { color: '#fff', fontSize: fontSize.lg, fontWeight: '800' },
  heroSub: { color: '#CBD5E1', fontSize: fontSize.xs, marginTop: 3 },
  channelIcons: { flexDirection: 'row', alignItems: 'center' },
  chIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surfaceInverse,
  },
  chipRow: { marginBottom: spacing.md, marginHorizontal: -spacing.lg },
  chipRowContent: { paddingHorizontal: spacing.lg, gap: 8 },
  empty: { padding: spacing.xxl, alignItems: 'center' },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text, marginTop: 12 },
  emptyBody: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 4 },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  rowUnread: { backgroundColor: colors.goldSoft, borderColor: colors.gold },
  avatarWrap: { position: 'relative' },
  chDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowName: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  rowTime: { color: colors.textSubtle, fontSize: fontSize.xs },
  rowPreview: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 3 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  convertedTag: { flexDirection: 'row', gap: 3, alignItems: 'center' },
  convertedText: { color: colors.success, fontSize: 10, fontWeight: '700' },
  newTag: { flexDirection: 'row', gap: 3, alignItems: 'center' },
  newText: { color: colors.goldDark, fontSize: 10, fontWeight: '700' },
  rowThreadCount: { color: colors.textSubtle, fontSize: 10, marginLeft: 'auto' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold, alignSelf: 'flex-start', marginTop: 6 },
});
