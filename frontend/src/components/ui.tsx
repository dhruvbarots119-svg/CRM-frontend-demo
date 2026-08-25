// Shared UI primitives — buttons, chips, cards, badges, empty/skeleton states.
import React from 'react';
import { Pressable, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '@/src/theme';

export const Card: React.FC<{ children: React.ReactNode; style?: ViewStyle; testID?: string; onPress?: () => void }> = ({
  children,
  style,
  testID,
  onPress,
}) => {
  const inner = (
    <View testID={testID} style={[styles.card, style]}>
      {children}
    </View>
  );
  if (onPress) return <Pressable onPress={onPress}>{inner}</Pressable>;
  return inner;
};

export const Section: React.FC<{ title: string; action?: string; onAction?: () => void; children?: React.ReactNode }> = ({
  title,
  action,
  onAction,
  children,
}) => (
  <View style={{ marginBottom: spacing.lg }}>
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>
            {action} <Ionicons name="chevron-forward" size={12} color={colors.gold} />
          </Text>
        </Pressable>
      ) : null}
    </View>
    {children}
  </View>
);

export const Chip: React.FC<{
  label: string;
  active?: boolean;
  color?: string;
  soft?: string;
  onPress?: () => void;
  testID?: string;
  small?: boolean;
}> = ({ label, active, color, soft, onPress, testID, small }) => (
  <Pressable
    testID={testID}
    onPress={onPress}
    style={[
      styles.chip,
      small && styles.chipSmall,
      active && { backgroundColor: color || colors.text, borderColor: color || colors.text },
      !active && soft && { backgroundColor: soft, borderColor: soft },
    ]}
  >
    <Text
      style={[
        styles.chipLabel,
        small && { fontSize: fontSize.xs },
        active && { color: colors.surface },
        !active && color && { color },
      ]}
    >
      {label}
    </Text>
  </Pressable>
);

export const Badge: React.FC<{ label: string; color?: string; soft?: string }> = ({ label, color, soft }) => (
  <View style={[styles.badge, { backgroundColor: soft || colors.surfaceElev }]}>
    <Text style={[styles.badgeText, { color: color || colors.text }]}>{label}</Text>
  </View>
);

export const PrimaryButton: React.FC<{
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  testID?: string;
  style?: ViewStyle;
  disabled?: boolean;
}> = ({ label, onPress, icon, testID, style, disabled }) => (
  <Pressable
    testID={testID}
    onPress={disabled ? undefined : onPress}
    style={[styles.primary, disabled && { opacity: 0.5 }, style]}
  >
    {icon ? <Ionicons name={icon} size={16} color={colors.onGold} /> : null}
    <Text style={styles.primaryText}>{label}</Text>
  </Pressable>
);

export const GhostButton: React.FC<{
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  testID?: string;
  style?: ViewStyle;
  danger?: boolean;
}> = ({ label, onPress, icon, testID, style, danger }) => (
  <Pressable
    testID={testID}
    onPress={onPress}
    style={[styles.ghost, danger && { borderColor: colors.error }, style]}
  >
    {icon ? <Ionicons name={icon} size={16} color={danger ? colors.error : colors.text} /> : null}
    <Text style={[styles.ghostText, danger && { color: colors.error }]}>{label}</Text>
  </Pressable>
);

export const Avatar: React.FC<{ label: string; tone?: string; size?: number }> = ({ label, tone, size = 40 }) => (
  <View
    style={[
      styles.avatar,
      { width: size, height: size, borderRadius: size / 2, backgroundColor: tone || colors.gold },
    ]}
  >
    <Text style={[styles.avatarText, { fontSize: size * 0.36 }]}>{label}</Text>
  </View>
);

export const EmptyState: React.FC<{ icon: keyof typeof Ionicons.glyphMap; title: string; body?: string; action?: React.ReactNode }> = ({
  icon,
  title,
  body,
  action,
}) => (
  <View style={styles.empty}>
    <View style={styles.emptyIcon}>
      <Ionicons name={icon} size={32} color={colors.gold} />
    </View>
    <Text style={styles.emptyTitle}>{title}</Text>
    {body ? <Text style={styles.emptyBody}>{body}</Text> : null}
    {action ? <View style={{ marginTop: spacing.lg }}>{action}</View> : null}
  </View>
);

export const Divider: React.FC<{ style?: ViewStyle }> = ({ style }) => <View style={[styles.divider, style]} />;

export const KpiCard: React.FC<{ label: string; value: string; delta?: string; tone?: 'gold' | 'success' | 'info' | 'warning'; icon?: keyof typeof Ionicons.glyphMap }> = ({
  label,
  value,
  delta,
  tone = 'gold',
  icon,
}) => {
  const toneMap: Record<string, { color: string; soft: string }> = {
    gold: { color: colors.gold, soft: colors.goldSoft },
    success: { color: colors.success, soft: colors.successSoft },
    info: { color: colors.info, soft: colors.infoSoft },
    warning: { color: colors.warning, soft: colors.warningSoft },
  };
  const t = toneMap[tone];
  return (
    <View style={[styles.card, styles.kpi]}>
      {icon ? (
        <View style={[styles.kpiIcon, { backgroundColor: t.soft }]}>
          <Ionicons name={icon} size={18} color={t.color} />
        </View>
      ) : null}
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
      {delta ? <Text style={[styles.kpiDelta, { color: t.color }]}>{delta}</Text> : null}
    </View>
  );
};

export const Row: React.FC<{ children: React.ReactNode; style?: ViewStyle; gap?: number }> = ({ children, style, gap = spacing.sm }) => (
  <View style={[{ flexDirection: 'row', gap, alignItems: 'center' }, style]}>{children}</View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.md },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  sectionAction: { color: colors.gold, fontSize: fontSize.sm, fontWeight: '700' },
  chip: {
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  chipSmall: { height: 28, paddingHorizontal: spacing.sm },
  chipLabel: { fontSize: fontSize.sm, color: colors.text, fontWeight: '600' },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill, alignSelf: 'flex-start' },
  badgeText: { fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 0.2 },
  primary: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryText: { color: colors.onGold, fontWeight: '700', fontSize: fontSize.base },
  ghost: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  ghostText: { color: colors.text, fontWeight: '600', fontSize: fontSize.sm },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800' },
  empty: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, textAlign: 'center' },
  emptyBody: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', marginTop: 6, maxWidth: 300 },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.md },
  kpi: { flex: 1, minWidth: 150, padding: spacing.md, gap: 4 },
  kpiIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  kpiLabel: { fontSize: fontSize.xs, color: colors.textMuted, letterSpacing: 0.2 },
  kpiValue: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  kpiDelta: { fontSize: fontSize.xs, fontWeight: '700', marginTop: 2 },
});

// Utility formatters used across screens.
export const fmtAED = (n: number): string => {
  // Indian Rupees format — Ahmedabad market.
  if (!n) return '₹0';
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
};

export const fmtINR = fmtAED;

export const fmtDuration = (mins: number): string => {
  if (!mins || mins <= 0) return '0m';
  if (mins < 60) return `${Math.round(mins)}m`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

export const fmtDate = (iso: string): string => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch {
    return iso;
  }
};

export const fmtDateTime = (iso: string): string => {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
};

export const timeAgo = (iso: string): string => {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'just now';
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const d = Math.floor(hr / 24);
    return `${d}d ago`;
  } catch {
    return '';
  }
};
