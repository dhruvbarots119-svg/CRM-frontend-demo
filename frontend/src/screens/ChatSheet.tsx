// Chat thread sheet — full-screen WhatsApp-style chat with reply capability.
import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '@/src/theme';
import { useApp } from '@/src/store/AppContext';
import { Avatar } from '@/src/components/ui';
import { CHANNEL_META } from './InboxScreen';
import { useToast } from '@/src/components/Toast';

const QUICK_REPLIES = [
  'Namaste 🙏',
  'Sending options now',
  'When can you visit?',
  'Sharing brochure shortly',
];

export const ChatSheet: React.FC<{
  messageId: string | null;
  onClose: () => void;
  onLeadCreated: (leadId: string) => void;
}> = ({ messageId, onClose, onLeadCreated }) => {
  const { state, markMessageRead, sendMessage, convertMessageToLead } = useApp();
  const toast = useToast();
  const msg = state.messages.find((m) => m.id === messageId);
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const wasThreadLength = useRef<number>(0);

  useEffect(() => {
    if (msg && !msg.isRead) markMessageRead(msg.id);
  }, [msg?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll on new message
  useEffect(() => {
    if (!msg) return;
    const len = msg.thread.length;
    if (len !== wasThreadLength.current) {
      wasThreadLength.current = len;
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
      // Show "typing…" indicator after outgoing message (auto-reply arriving in ~1.4s)
      const last = msg.thread[len - 1];
      if (last?.direction === 'out') {
        setTyping(true);
        setTimeout(() => setTyping(false), 1500);
      }
    }
  }, [msg?.thread.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!msg) return null;

  const meta = CHANNEL_META[msg.channel];
  const initials = msg.from.split(' ').map((x) => x[0]).join('').slice(0, 2);
  const linkedLead = state.leads.find((l) => l.id === msg.convertedToLeadId);

  const send = () => {
    if (!draft.trim()) return;
    sendMessage(msg.id, draft);
    setDraft('');
  };

  const convert = () => {
    const lead = convertMessageToLead(msg.id);
    if (lead) {
      const agent = state.agents.find((a) => a.id === lead.assignedAgentId);
      toast.show(`Lead auto-assigned to ${agent?.name.split(' ')[0]}`, 'success');
      onClose();
      setTimeout(() => onLeadCreated(lead.id), 220);
    }
  };

  const smartInsight = (() => {
    const t = msg.fullText.toLowerCase();
    if (t.includes('maintenance') || t.includes('service charge'))
      return 'Concern: maintenance charges — send annual breakdown.';
    if (t.includes('site visit') || t.includes('visit')) return 'Intent: wants a site visit — suggest 2 slots.';
    if (t.includes('loan') || t.includes('emi')) return 'Interest: home loan — share HDFC pre-approval flow.';
    if (t.includes('rera')) return 'Compliance: asked about RERA — share registration copy.';
    if (t.includes('brochure') || t.includes('deck')) return 'Ask: brochure — attach latest deck.';
    return 'General enquiry — respond within 5 min to preserve SLA.';
  })();

  return (
    <Modal visible={!!messageId} animationType="slide" onRequestClose={onClose}>
      <View style={styles.wrap} testID="chat-sheet">
        <View style={styles.header}>
          <Pressable testID="chat-close" onPress={onClose} style={styles.closeBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <View style={styles.avatarWrap}>
              <Avatar label={initials} tone={meta.color} size={38} />
              <View style={[styles.chDot, { backgroundColor: meta.color }]}>
                <Ionicons name={meta.icon} size={8} color="#fff" />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerName} numberOfLines={1}>{msg.from}</Text>
              <Text style={styles.headerSub} numberOfLines={1}>
                {typing ? 'typing…' : msg.fromContact}
              </Text>
            </View>
          </View>
          <Pressable style={styles.callBtn} hitSlop={8} onPress={() => toast.show('Call started (demo).', 'info')}>
            <Ionicons name="call-outline" size={18} color={colors.text} />
          </Pressable>
        </View>

        {!linkedLead ? (
          <Pressable onPress={convert} testID="chat-convert" style={styles.convertBar}>
            <Ionicons name="person-add" size={16} color={colors.gold} />
            <Text style={styles.convertText}>Convert this chat into a lead — auto-assign to lightest-load agent</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.gold} />
          </Pressable>
        ) : (
          <View style={styles.linkedBar}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text style={styles.linkedText}>Linked to lead: {linkedLead.name}</Text>
          </View>
        )}

        <View style={styles.insightRow}>
          <Ionicons name="sparkles" size={12} color={colors.gold} />
          <Text style={styles.insightText}>{smartInsight}</Text>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.thread}
          contentContainerStyle={styles.threadContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {msg.thread.map((m, i) => {
            const isOut = m.direction === 'out';
            const prev = i > 0 ? msg.thread[i - 1] : null;
            const showTime = !prev || new Date(m.at).getTime() - new Date(prev.at).getTime() > 10 * 60 * 1000;
            return (
              <React.Fragment key={m.id}>
                {showTime ? (
                  <Text style={styles.timeSep}>
                    {new Date(m.at).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                ) : null}
                <View
                  testID={`bubble-${m.id}`}
                  style={[styles.bubbleWrap, isOut ? styles.bubbleWrapOut : styles.bubbleWrapIn]}
                >
                  <View
                    style={[
                      styles.bubble,
                      isOut ? { backgroundColor: meta.color } : { backgroundColor: colors.surface },
                    ]}
                  >
                    <Text style={[styles.bubbleText, isOut && { color: '#fff' }]}>{m.text}</Text>
                    <Text style={[styles.bubbleTime, isOut && { color: 'rgba(255,255,255,0.7)' }]}>
                      {new Date(m.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      {isOut ? '  ✓✓' : ''}
                    </Text>
                  </View>
                </View>
              </React.Fragment>
            );
          })}
          {typing ? (
            <View style={[styles.bubbleWrap, styles.bubbleWrapIn]}>
              <View style={[styles.bubble, { backgroundColor: colors.surface, flexDirection: 'row', gap: 4 }]}>
                <View style={styles.typingDot} />
                <View style={[styles.typingDot, { opacity: 0.6 }]} />
                <View style={[styles.typingDot, { opacity: 0.35 }]} />
              </View>
            </View>
          ) : null}
        </ScrollView>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickBar}
            contentContainerStyle={styles.quickBarContent}
          >
            {QUICK_REPLIES.map((q) => (
              <Pressable
                key={q}
                testID={`quick-reply-${q.slice(0, 6)}`}
                onPress={() => setDraft((d) => (d ? `${d} ${q}` : q))}
                style={styles.quickChip}
              >
                <Text style={styles.quickChipText}>{q}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.inputRow}>
            <TextInput
              testID="chat-input"
              value={draft}
              onChangeText={setDraft}
              placeholder={`Message ${msg.from.split(' ')[0]} on ${msg.channel}`}
              placeholderTextColor={colors.textSubtle}
              style={styles.input}
              multiline
              onSubmitEditing={send}
            />
            <Pressable
              testID="chat-send"
              onPress={send}
              style={[styles.sendBtn, { backgroundColor: draft.trim() ? meta.color : colors.surfaceElev }]}
              hitSlop={6}
            >
              <Ionicons name="send" size={18} color={draft.trim() ? '#fff' : colors.textSubtle} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingTop: 48,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarWrap: { position: 'relative' },
  chDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  headerName: { color: colors.text, fontSize: fontSize.base, fontWeight: '800' },
  headerSub: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 1 },
  callBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceElev, alignItems: 'center', justifyContent: 'center' },
  convertBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.goldSoft,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  convertText: { color: colors.goldDark, fontSize: fontSize.xs, fontWeight: '700', flex: 1 },
  linkedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.successSoft,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
  },
  linkedText: { color: colors.success, fontSize: fontSize.xs, fontWeight: '700' },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    backgroundColor: colors.surface,
  },
  insightText: { color: colors.goldDark, fontSize: 10, fontWeight: '600', flex: 1 },
  thread: { flex: 1 },
  threadContent: { padding: spacing.md, paddingBottom: spacing.lg },
  timeSep: { color: colors.textSubtle, fontSize: 10, textAlign: 'center', marginVertical: spacing.sm },
  bubbleWrap: { marginVertical: 2, maxWidth: '100%' },
  bubbleWrapIn: { alignItems: 'flex-start' },
  bubbleWrapOut: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '82%',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleText: { color: colors.text, fontSize: fontSize.sm, lineHeight: 19 },
  bubbleTime: { color: colors.textSubtle, fontSize: 9, marginTop: 3, textAlign: 'right' },
  typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textMuted },
  quickBar: { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  quickBarContent: { padding: 8, gap: 6 },
  quickChip: {
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickChipText: { color: colors.text, fontSize: fontSize.xs, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.sm,
    gap: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: 20,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: fontSize.sm,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
