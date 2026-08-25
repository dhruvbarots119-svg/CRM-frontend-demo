// Inbox — mocked WhatsApp/FB/Insta with convert-to-lead action.
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '@/src/theme';
import { useApp } from '@/src/store/AppContext';
import { Message, MessageChannel } from '@/src/store/types';
import { BottomSheet } from '@/src/components/BottomSheet';
import { Avatar, Chip, fmtDateTime, GhostButton, PrimaryButton, timeAgo } from '@/src/components/ui';
import { useToast } from '@/src/components/Toast';

const CHANNELS: ('All' | MessageChannel)[] = ['All', 'WhatsApp', 'Facebook', 'Instagram', 'Email'];

const CHANNEL_META: Record<MessageChannel, { color: string; soft: string; icon: keyof typeof Ionicons.glyphMap }> = {
  WhatsApp: { color: '#25D366', soft: '#E7FBEF', icon: 'logo-whatsapp' },
  Facebook: { color: '#1877F2', soft: '#E4EEFA', icon: 'logo-facebook' },
  Instagram: { color: '#E1306C', soft: '#FCE4EC', icon: 'logo-instagram' },
  Email: { color: '#0288D1', soft: colors.infoSoft, icon: 'mail' },
};

export const InboxScreen: React.FC<{ onOpenMessage: (id: string) => void }> = ({ onOpenMessage }) => {
  const { state } = useApp();
  const [filter, setFilter] = useState<'All' | MessageChannel>('All');

  const filtered = useMemo(() => {
    if (filter === 'All') return state.messages;
    return state.messages.filter((m) => m.channel === filter);
  }, [state.messages, filter]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.demoBanner}>
        <Ionicons name="information-circle" size={16} color={colors.info} />
        <Text style={styles.demoText}>
          DEMO INBOX — messages are simulated. Tap any message to convert to a lead.
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        contentContainerStyle={styles.chipRowContent}
      >
        {CHANNELS.map((c) => {
          const count =
            c === 'All' ? state.messages.length : state.messages.filter((m) => m.channel === c).length;
          const unread =
            c === 'All'
              ? state.messages.filter((m) => !m.isRead).length
              : state.messages.filter((m) => m.channel === c && !m.isRead).length;
          return (
            <Chip
              key={c}
              label={`${c} ${count}${unread > 0 ? ` · ${unread}•` : ''}`}
              active={filter === c}
              onPress={() => setFilter(c)}
              testID={`inbox-filter-${c}`}
            />
          );
        })}
      </ScrollView>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="mail-open" size={40} color={colors.gold} />
          <Text style={styles.emptyTitle}>All caught up</Text>
          <Text style={styles.emptyBody}>No messages in this channel.</Text>
        </View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {filtered.map((m) => {
            const meta = CHANNEL_META[m.channel];
            const initials = m.from.split(' ').map((x) => x[0]).join('').slice(0, 2);
            return (
              <Pressable
                key={m.id}
                testID={`msg-${m.id}`}
                onPress={() => onOpenMessage(m.id)}
                style={[styles.row, !m.isRead && styles.rowUnread]}
              >
                <Avatar label={initials} tone={meta.color} size={44} />
                <View style={{ flex: 1 }}>
                  <View style={styles.rowTop}>
                    <Text style={[styles.rowName, !m.isRead && { fontWeight: '800' }]}>{m.from}</Text>
                    <Text style={styles.rowTime}>{timeAgo(m.receivedAt)}</Text>
                  </View>
                  <View style={styles.rowMeta}>
                    <Ionicons name={meta.icon} size={11} color={meta.color} />
                    <Text style={[styles.rowChannel, { color: meta.color }]}>{m.channel}</Text>
                    {m.convertedToLeadId ? (
                      <View style={styles.convertedTag}>
                        <Ionicons name="checkmark-circle" size={11} color={colors.success} />
                        <Text style={styles.convertedText}>Converted</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.rowPreview} numberOfLines={2}>
                    {m.preview}
                  </Text>
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

export const MessageDetailSheet: React.FC<{
  messageId: string | null;
  onClose: () => void;
  onLeadCreated: (leadId: string) => void;
}> = ({ messageId, onClose, onLeadCreated }) => {
  const { state, markMessageRead, convertMessageToLead } = useApp();
  const toast = useToast();
  const msg = state.messages.find((m) => m.id === messageId);
  const [reply, setReply] = useState('');

  React.useEffect(() => {
    if (msg && !msg.isRead) markMessageRead(msg.id);
  }, [msg?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!msg) return null;
  const meta = CHANNEL_META[msg.channel];
  const linkedLead = state.leads.find((l) => l.id === msg.convertedToLeadId);

  const convert = () => {
    const lead = convertMessageToLead(msg.id);
    if (lead) {
      const agent = state.agents.find((a) => a.id === lead.assignedAgentId);
      toast.show(`Lead created and routed to ${agent?.name.split(' ')[0]}.`, 'success');
      onClose();
      setTimeout(() => onLeadCreated(lead.id), 220);
    }
  };

  return (
    <BottomSheet visible={!!messageId} onClose={onClose} eyebrow={msg.channel.toUpperCase()} title={msg.from} testID="message-detail" fullHeight>
      <View style={styles.detailMeta}>
        <View style={[styles.channelBadge, { backgroundColor: meta.soft }]}>
          <Ionicons name={meta.icon} size={14} color={meta.color} />
          <Text style={[styles.channelBadgeText, { color: meta.color }]}>{msg.channel}</Text>
        </View>
        <Text style={styles.detailTime}>{fmtDateTime(msg.receivedAt)}</Text>
      </View>
      <Text style={styles.contact}>{msg.fromContact}</Text>
      <View style={styles.bubble}>
        <Text style={styles.bubbleText}>{msg.fullText}</Text>
      </View>

      <View style={styles.insight}>
        <Ionicons name="sparkles" size={16} color={colors.gold} />
        <Text style={styles.insightText}>
          {msg.fullText.toLowerCase().includes('service charge')
            ? 'Concern detected: service charges. Suggest sending annual cost breakdown.'
            : msg.fullText.toLowerCase().includes('viewing') || msg.fullText.toLowerCase().includes('see')
              ? 'Intent detected: wants to schedule a viewing. Suggest 2 slots.'
              : msg.fullText.toLowerCase().includes('off-plan') || msg.fullText.toLowerCase().includes('payment plan')
                ? 'Interest detected: off-plan. Attach 20/40/40 project deck.'
                : 'General enquiry. Reply promptly to preserve response-time SLA.'}
        </Text>
      </View>

      {linkedLead ? (
        <View style={styles.linkedRow}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={styles.linkedText}>Already linked to lead: {linkedLead.name}</Text>
        </View>
      ) : (
        <PrimaryButton
          label="Convert to lead"
          icon="person-add"
          testID="convert-to-lead"
          onPress={convert}
          style={{ marginBottom: spacing.md }}
        />
      )}

      <GhostButton
        label="Reply (demo)"
        icon="send"
        onPress={() => toast.show('Message queued (demo).', 'info')}
      />
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 120 },
  demoBanner: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: colors.infoSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  demoText: { color: colors.info, fontSize: fontSize.xs, fontWeight: '600', flex: 1 },
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
  rowUnread: { backgroundColor: '#FFFEF9', borderColor: colors.gold },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowName: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  rowTime: { color: colors.textSubtle, fontSize: fontSize.xs },
  rowMeta: { flexDirection: 'row', gap: 4, alignItems: 'center', marginTop: 3 },
  rowChannel: { fontSize: 10, fontWeight: '800' },
  convertedTag: { flexDirection: 'row', gap: 3, alignItems: 'center', marginLeft: 6 },
  convertedText: { color: colors.success, fontSize: 10, fontWeight: '700' },
  rowPreview: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold, alignSelf: 'flex-start', marginTop: 6 },
  detailMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  channelBadge: { flexDirection: 'row', gap: 5, alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  channelBadgeText: { fontSize: fontSize.xs, fontWeight: '800' },
  detailTime: { color: colors.textMuted, fontSize: fontSize.xs },
  contact: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 8 },
  bubble: { backgroundColor: colors.surfaceElev, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md },
  bubbleText: { color: colors.text, fontSize: fontSize.sm, lineHeight: 20 },
  insight: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    backgroundColor: colors.goldSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  insightText: { color: colors.goldDark, fontSize: fontSize.sm, fontWeight: '600', flex: 1 },
  linkedRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  linkedText: { color: colors.success, fontSize: fontSize.sm, fontWeight: '700' },
});
