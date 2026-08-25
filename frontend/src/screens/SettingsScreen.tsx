// Settings — role switcher, active agent picker, demo reset.
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '@/src/theme';
import { useApp } from '@/src/store/AppContext';
import { GhostButton, Section } from '@/src/components/ui';
import { useToast } from '@/src/components/Toast';

export const SettingsScreen: React.FC = () => {
  const { state, setRole, setCurrentAgent, reseed } = useApp();
  const toast = useToast();
  const agents = state.agents.filter((a) => a.role === 'agent');
  const admins = state.agents.filter((a) => a.role === 'admin');
  const activeList = state.role === 'admin' ? admins : agents;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Section title="Role">
        <View style={styles.roleGrid}>
          <Pressable
            testID="settings-role-agent"
            style={[styles.roleCard, state.role === 'agent' && styles.roleCardActive]}
            onPress={() => setRole('agent')}
          >
            <Ionicons name="person" size={22} color={state.role === 'agent' ? colors.onGold : colors.gold} />
            <Text style={[styles.roleTitle, state.role === 'agent' && { color: colors.onGold }]}>Agent</Text>
            <Text style={[styles.roleSub, state.role === 'agent' && { color: colors.onGold, opacity: 0.85 }]}>
              See only your assigned leads and tasks
            </Text>
          </Pressable>
          <Pressable
            testID="settings-role-admin"
            style={[styles.roleCard, state.role === 'admin' && styles.roleCardActive]}
            onPress={() => setRole('admin')}
          >
            <Ionicons name="shield-checkmark" size={22} color={state.role === 'admin' ? colors.onGold : colors.gold} />
            <Text style={[styles.roleTitle, state.role === 'admin' && { color: colors.onGold }]}>Admin</Text>
            <Text style={[styles.roleSub, state.role === 'admin' && { color: colors.onGold, opacity: 0.85 }]}>
              Team-wide visibility, exports & assignment
            </Text>
          </Pressable>
        </View>
      </Section>

      <Section title={state.role === 'admin' ? 'Sign in as admin' : 'Sign in as agent'}>
        {activeList.map((a) => {
          const active = state.currentAgentId === a.id;
          return (
            <Pressable
              key={a.id}
              testID={`agent-pick-${a.id}`}
              onPress={() => setCurrentAgent(a.id)}
              style={[styles.agentRow, active && { borderColor: colors.gold, backgroundColor: colors.goldSoft }]}
            >
              <View style={[styles.agentAv, { backgroundColor: a.avatarTone }]}>
                <Text style={styles.agentAvText}>{a.initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.agentName}>{a.name}</Text>
                <Text style={styles.agentSub}>{a.role === 'admin' ? 'Brokerage admin' : `Avg response ${a.responseAvgMinutes}m`}</Text>
              </View>
              {active ? <Ionicons name="checkmark-circle" size={18} color={colors.gold} /> : null}
            </Pressable>
          );
        })}
      </Section>

      <Section title="Demo data">
        <GhostButton
          label="Reset seeded workflows"
          icon="refresh-circle"
          testID="settings-reseed"
          onPress={async () => {
            await reseed();
            toast.show('Demo data reset.', 'success');
          }}
        />
      </Section>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 120 },
  roleGrid: { flexDirection: 'row', gap: spacing.sm },
  roleCard: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
    alignItems: 'flex-start',
    minHeight: 110,
  },
  roleCardActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  roleTitle: { color: colors.text, fontSize: fontSize.base, fontWeight: '800', marginTop: 4 },
  roleSub: { color: colors.textMuted, fontSize: fontSize.xs, lineHeight: 16 },
  agentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  agentAv: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  agentAvText: { color: '#fff', fontSize: fontSize.xs, fontWeight: '800' },
  agentName: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  agentSub: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
});
