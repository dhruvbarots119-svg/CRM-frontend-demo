// More screen — hub for Properties, Tasks, Admin, Ask SAI, Settings, and reseed.
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '@/src/theme';
import { useApp } from '@/src/store/AppContext';
import { fmtAED, GhostButton } from '@/src/components/ui';
import { useToast } from '@/src/components/Toast';

export type MoreDest = 'properties' | 'tasks' | 'admin' | 'ask' | 'settings';

const MODULES: {
  key: MoreDest;
  label: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
  adminOnly?: boolean;
}[] = [
  { key: 'properties', label: 'Properties', sub: 'CRUD, status & lead matching', icon: 'business' },
  { key: 'tasks', label: 'Tasks & reminders', sub: 'Priorities, overdue, reminders', icon: 'checkmark-done' },
  { key: 'admin', label: 'Team & analytics', sub: 'Performance, revenue, exports', icon: 'analytics' },
  { key: 'ask', label: 'Ask SAI', sub: 'Intelligence across your book', icon: 'sparkles' },
  { key: 'settings', label: 'Settings', sub: 'Role, agent, demo data', icon: 'settings' },
];

export const MoreScreen: React.FC<{ onNavigate: (d: MoreDest) => void }> = ({ onNavigate }) => {
  const { state, reseed } = useApp();
  const toast = useToast();
  const currentAgent = state.agents.find((a) => a.id === state.currentAgentId);
  const revenue = state.leads
    .filter((l) => l.stage === 'ClosedWon')
    .reduce((s, l) => s + l.dealValue * 0.02, 0);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroAvatar}>
            <Text style={styles.heroInitials}>{currentAgent?.initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroRole}>{state.role === 'admin' ? 'ADMIN VIEW' : 'AGENT VIEW'}</Text>
            <Text style={styles.heroName}>{currentAgent?.name}</Text>
            <Text style={styles.heroSub}>Reputation passport · Dubai PropTech</Text>
          </View>
        </View>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>
              {state.leads.filter((l) => l.assignedAgentId === state.currentAgentId || state.role === 'admin').length}
            </Text>
            <Text style={styles.heroStatLabel}>Leads</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>
              {state.leads.filter((l) => l.stage === 'ClosedWon' && (state.role === 'admin' || l.assignedAgentId === state.currentAgentId)).length}
            </Text>
            <Text style={styles.heroStatLabel}>Deals won</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{fmtAED(revenue)}</Text>
            <Text style={styles.heroStatLabel}>Revenue</Text>
          </View>
        </View>
      </View>

      <View style={styles.grid}>
        {MODULES.map((m) => (
          <Pressable
            key={m.key}
            testID={`more-${m.key}`}
            onPress={() => onNavigate(m.key)}
            style={styles.card}
          >
            <View style={styles.icon}>
              <Ionicons name={m.icon} size={22} color={colors.gold} />
            </View>
            <Text style={styles.cardLabel}>{m.label}</Text>
            <Text style={styles.cardSub}>{m.sub}</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.textSubtle} style={styles.chev} />
          </Pressable>
        ))}
      </View>

      <View style={styles.demoBox}>
        <View style={styles.demoRow}>
          <Ionicons name="server" size={16} color={colors.info} />
          <Text style={styles.demoTitle}>Local device demo</Text>
        </View>
        <Text style={styles.demoBody}>
          All data is persisted on this device. Reset to reload the seeded Sarah & Ahmed workflows.
        </Text>
        <GhostButton
          label="Reset demo data"
          icon="refresh"
          testID="reset-demo"
          onPress={async () => {
            await reseed();
            toast.show('Demo data reset.', 'success');
          }}
          style={{ marginTop: spacing.sm }}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 120 },
  hero: {
    backgroundColor: colors.surfaceInverse,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInitials: { color: colors.onGold, fontSize: fontSize.lg, fontWeight: '900' },
  heroRole: { color: colors.gold, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  heroName: { color: colors.onSurfaceInverse, fontSize: fontSize.xl, fontWeight: '800', marginTop: 2 },
  heroSub: { color: '#CBD5E1', fontSize: fontSize.xs, marginTop: 3 },
  heroStats: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatValue: { color: colors.gold, fontSize: fontSize.base, fontWeight: '800' },
  heroStatLabel: { color: '#CBD5E1', fontSize: 10, marginTop: 3 },
  grid: { gap: spacing.sm, marginBottom: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    position: 'relative',
  },
  icon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.goldSoft, alignItems: 'center', justifyContent: 'center' },
  cardLabel: { color: colors.text, fontSize: fontSize.base, fontWeight: '800' },
  cardSub: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2, flex: 1 },
  chev: { position: 'absolute', right: spacing.md },
  demoBox: {
    backgroundColor: colors.infoSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  demoRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  demoTitle: { color: colors.info, fontSize: fontSize.sm, fontWeight: '800' },
  demoBody: { color: colors.info, fontSize: fontSize.xs, marginTop: 6, lineHeight: 18 },
});
