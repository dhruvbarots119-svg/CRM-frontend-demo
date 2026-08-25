// Editorial sticky header — eyebrow + title on the left, action row on the right.
// Role switcher sits in a compact secondary row so the title never gets crowded.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '@/src/theme';
import { useApp } from '@/src/store/AppContext';

export const Header: React.FC<{
  title: string;
  eyebrow?: string;
  onSearch: () => void;
  onNotifications: () => void;
  onAskSai: () => void;
}> = ({ title, eyebrow, onSearch, onNotifications, onAskSai }) => {
  const { state, setRole } = useApp();
  const unread = state.notifications.filter((n) => !n.read).length;
  const currentAgent = state.agents.find((a) => a.id === state.currentAgentId);
  const initials = currentAgent?.initials || 'SA';
  const isAdmin = state.role === 'admin';

  return (
    <View style={styles.wrap} testID="app-header">
      <View style={styles.topRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow} numberOfLines={1}>
            {eyebrow || 'SAI / OPERATING SYSTEM'}
          </Text>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <View style={styles.actions}>
          <Pressable testID="header-search" onPress={onSearch} style={styles.iconBtn} hitSlop={8}>
            <Ionicons name="search" size={16} color={colors.navy} />
          </Pressable>
          <Pressable
            testID="header-notifications"
            onPress={onNotifications}
            style={styles.iconBtn}
            hitSlop={8}
          >
            <Ionicons name="notifications-outline" size={16} color={colors.navy} />
            {unread > 0 ? (
              <View style={styles.dot} testID="notif-badge">
                <Text style={styles.dotText}>{unread > 9 ? '9+' : unread}</Text>
              </View>
            ) : null}
          </Pressable>
          <Pressable testID="header-ask-sai" onPress={onAskSai} style={styles.askBtn} hitSlop={6}>
            <Ionicons name="sparkles" size={13} color={colors.navy} />
            <Text style={styles.askText}>Ask SAI</Text>
          </Pressable>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.roleWrap} testID="role-switcher">
          <Pressable
            testID="role-agent"
            onPress={() => setRole('agent')}
            style={[styles.roleSeg, !isAdmin && styles.roleSegActive]}
          >
            <Text style={[styles.roleLabel, !isAdmin && styles.roleLabelActive]}>Agent</Text>
          </Pressable>
          <Pressable
            testID="role-admin"
            onPress={() => setRole('admin')}
            style={[styles.roleSeg, isAdmin && styles.roleSegActive]}
          >
            <Text style={[styles.roleLabel, isAdmin && styles.roleLabelActive]}>Admin</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  titleBlock: { flex: 1, minWidth: 0 },
  eyebrow: {
    color: colors.gold,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceElev,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: colors.error,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  askBtn: {
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#D6C3A8',
    backgroundColor: colors.goldSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  askText: { color: colors.navy, fontSize: 11, fontWeight: '800' },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  roleWrap: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElev,
    borderRadius: radius.pill,
    padding: 2,
    gap: 2,
  },
  roleSeg: {
    paddingHorizontal: 10,
    height: 22,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleSegActive: { backgroundColor: colors.navy },
  roleLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '700' },
  roleLabelActive: { color: '#fff' },
});
