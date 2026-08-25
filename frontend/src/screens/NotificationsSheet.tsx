// In-app notifications sheet.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '@/src/theme';
import { useApp } from '@/src/store/AppContext';
import { BottomSheet } from '@/src/components/BottomSheet';
import { GhostButton, timeAgo } from '@/src/components/ui';

const KIND_META: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; soft: string }> = {
  reminder: { icon: 'alarm', color: colors.warning, soft: colors.warningSoft },
  risk: { icon: 'warning', color: colors.error, soft: colors.errorSoft },
  match: { icon: 'sparkles', color: colors.gold, soft: colors.goldSoft },
  lead: { icon: 'person-add', color: colors.info, soft: colors.infoSoft },
  system: { icon: 'information-circle', color: colors.textMuted, soft: colors.surfaceElev },
};

export const NotificationsSheet: React.FC<{
  visible: boolean;
  onClose: () => void;
  onOpenLead: (id: string) => void;
  onOpenTask: (id: string) => void;
}> = ({ visible, onClose, onOpenLead, onOpenTask }) => {
  const { state, markNotificationRead, markAllNotificationsRead } = useApp();
  const unread = state.notifications.filter((n) => !n.read).length;

  const openItem = (n: (typeof state.notifications)[number]) => {
    markNotificationRead(n.id);
    if (n.leadId) {
      onClose();
      setTimeout(() => onOpenLead(n.leadId!), 220);
      return;
    }
    if (n.taskId) {
      onClose();
      setTimeout(() => onOpenTask(n.taskId!), 220);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      eyebrow="ALERTS"
      title={unread > 0 ? `${unread} new notifications` : 'All caught up'}
      testID="notifications-sheet"
      fullHeight
    >
      {unread > 0 ? (
        <GhostButton
          label="Mark all read"
          icon="checkmark-done"
          onPress={markAllNotificationsRead}
          testID="mark-all-read"
          style={{ marginBottom: spacing.md }}
        />
      ) : null}
      {state.notifications.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-off" size={40} color={colors.textSubtle} />
          <Text style={styles.emptyTitle}>Nothing new</Text>
        </View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {state.notifications.map((n) => {
            const m = KIND_META[n.kind] || KIND_META.system;
            return (
              <Pressable
                key={n.id}
                testID={`notif-${n.id}`}
                onPress={() => openItem(n)}
                style={[styles.row, !n.read && styles.rowUnread]}
              >
                <View style={[styles.icon, { backgroundColor: m.soft }]}>
                  <Ionicons name={m.icon} size={16} color={m.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, !n.read && { fontWeight: '800' }]}>{n.title}</Text>
                  <Text style={styles.body}>{n.body}</Text>
                  <Text style={styles.time}>{timeAgo(n.createdAt)}</Text>
                </View>
                {!n.read ? <View style={styles.dot} /> : null}
              </Pressable>
            );
          })}
        </View>
      )}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  empty: { padding: spacing.xxl, alignItems: 'center' },
  emptyTitle: { color: colors.textMuted, fontSize: fontSize.base, fontWeight: '700', marginTop: spacing.md },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  rowUnread: { backgroundColor: '#FFFEF9', borderColor: colors.gold },
  icon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  body: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 3 },
  time: { color: colors.textSubtle, fontSize: fontSize.xs, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold, alignSelf: 'flex-start', marginTop: 6 },
});
