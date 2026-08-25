// Global sticky header with brand, role switcher pill, search & notifications.
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
  right?: React.ReactNode;
}> = ({ title, eyebrow, onSearch, onNotifications, onAskSai }) => {
  const { state, setRole } = useApp();
  const unread = state.notifications.filter((n) => !n.read).length;

  const isAdmin = state.role === 'admin';
  return (
    <View style={styles.wrap} testID="app-header">
      <View style={styles.topRow}>
        <View style={styles.brand}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>S</Text>
          </View>
          <View>
            <Text style={styles.brandName}>SAI</Text>
            <Text style={styles.brandTag}>SMART AGENT INTELLIGENCE</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <Pressable
            testID="header-search"
            onPress={onSearch}
            style={styles.iconBtn}
            hitSlop={8}
          >
            <Ionicons name="search" size={18} color={colors.text} />
          </Pressable>
          <Pressable
            testID="header-notifications"
            onPress={onNotifications}
            style={styles.iconBtn}
            hitSlop={8}
          >
            <Ionicons name="notifications-outline" size={18} color={colors.text} />
            {unread > 0 ? (
              <View style={styles.dot} testID="notif-badge">
                <Text style={styles.dotText}>{unread > 9 ? '9+' : unread}</Text>
              </View>
            ) : null}
          </Pressable>
          <Pressable
            testID="header-ask-sai"
            onPress={onAskSai}
            style={styles.askBtn}
            hitSlop={8}
          >
            <Ionicons name="sparkles" size={14} color={colors.onGold} />
            <Text style={styles.askText}>Ask SAI</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.roleWrap} testID="role-switcher">
          <Pressable
            testID="role-agent"
            onPress={() => setRole('agent')}
            style={[styles.roleSeg, !isAdmin && styles.roleSegActive]}
          >
            <Ionicons name="person" size={12} color={!isAdmin ? colors.surface : colors.textMuted} />
            <Text style={[styles.roleLabel, !isAdmin && styles.roleLabelActive]}>Agent</Text>
          </Pressable>
          <Pressable
            testID="role-admin"
            onPress={() => setRole('admin')}
            style={[styles.roleSeg, isAdmin && styles.roleSegActive]}
          >
            <Ionicons name="shield-checkmark" size={12} color={isAdmin ? colors.surface : colors.textMuted} />
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.surfaceInverse,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: { color: colors.gold, fontSize: 20, fontWeight: '900' },
  brandName: { color: colors.text, fontSize: fontSize.lg, fontWeight: '900', letterSpacing: 2 },
  brandTag: { color: colors.textSubtle, fontSize: 7, letterSpacing: 1.4 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceElev,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: colors.error,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  askBtn: {
    height: 38,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  askText: { color: colors.onGold, fontSize: fontSize.xs, fontWeight: '800' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.md, gap: spacing.md },
  eyebrow: { color: colors.gold, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '800', letterSpacing: -0.6, marginTop: 2 },
  roleWrap: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElev,
    borderRadius: radius.pill,
    padding: 3,
    gap: 2,
  },
  roleSeg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: radius.pill,
  },
  roleSegActive: { backgroundColor: colors.surfaceInverse },
  roleLabel: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '700' },
  roleLabelActive: { color: colors.onSurfaceInverse },
});
