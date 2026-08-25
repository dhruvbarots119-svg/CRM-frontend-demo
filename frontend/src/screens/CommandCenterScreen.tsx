// Command Center — home dashboard with SAI priorities, KPIs, pipeline, market snapshot.
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing, stageMeta } from '@/src/theme';
import { useApp, visibleLeads, visibleTasks } from '@/src/store/AppContext';
import { Avatar, Card, Chip, fmtAED, KpiCard, Section, timeAgo } from '@/src/components/ui';
import { Lead } from '@/src/store/types';

const STAGES: Lead['stage'][] = ['New', 'Contacted', 'SiteVisit', 'Negotiation', 'ClosedWon'];

export const CommandCenterScreen: React.FC<{
  onOpenLead: (id: string) => void;
  onOpenTask: (id: string) => void;
  goLeads: () => void;
  goInbox: () => void;
}> = ({ onOpenLead, onOpenTask, goLeads, goInbox }) => {
  const { state } = useApp();
  const leads = visibleLeads(state);
  const tasks = visibleTasks(state);
  const currentAgent = state.agents.find((a) => a.id === state.currentAgentId);

  const kpis = useMemo(() => {
    const wonThisMonth = leads.filter((l) => {
      if (l.stage !== 'ClosedWon' || !l.closedAt) return false;
      const d = new Date(l.closedAt);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const revenue = wonThisMonth.reduce((sum, l) => sum + l.dealValue * 0.02, 0);
    const active = leads.filter((l) => l.stage !== 'ClosedWon' && l.stage !== 'ClosedLost').length;
    const dueToday = tasks.filter((t) => {
      if (t.status !== 'Pending') return false;
      const due = new Date(t.dueAt);
      const today = new Date();
      return due.toDateString() === today.toDateString() || due < today;
    });
    const avg =
      leads.length > 0
        ? Math.round(
            leads.reduce((sum, l) => {
              const diff = new Date(l.lastContactAt).getTime() - new Date(l.createdAt).getTime();
              return sum + Math.max(0, diff / 60000);
            }, 0) / leads.length,
          )
        : 0;
    return { revenue, active, newLeads: leads.filter((l) => l.stage === 'New').length, dueToday: dueToday.length, avg };
  }, [leads, tasks]);

  const priorities = useMemo(() => {
    return [...leads]
      .filter((l) => l.stage !== 'ClosedWon' && l.stage !== 'ClosedLost')
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((l) => ({
        lead: l,
        reason:
          l.stage === 'Negotiation' && l.checklist['Collect mortgage docs'] === false
            ? 'Deal risk: mortgage doc missing'
            : l.score >= 80
              ? 'High intent — follow up today'
              : l.score >= 65
                ? 'Warm — send comparable options'
                : 'Cold — re-engage with fresh angle',
      }));
  }, [leads]);

  const pipelineCounts = useMemo(() => {
    return STAGES.map((s) => ({
      stage: s,
      count: leads.filter((l) => l.stage === s).length,
      value: leads.filter((l) => l.stage === s).reduce((sum, l) => sum + l.dealValue, 0),
    }));
  }, [leads]);

  const activePipelineValue = leads
    .filter((l) => l.stage !== 'ClosedWon' && l.stage !== 'ClosedLost')
    .reduce((sum, l) => sum + l.dealValue, 0);

  const recentMessages = state.messages.slice(0, 4);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.greetRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
            {currentAgent?.name.split(' ')[0] ?? 'there'}.
          </Text>
          <Text style={styles.subGreeting}>
            {state.role === 'admin'
              ? 'Team-wide view. All leads and tasks visible.'
              : "Here's what needs your attention today."}
          </Text>
        </View>
      </View>

      <View style={styles.dateRow}>
        <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
        <View style={styles.demoDot} />
        <Text style={styles.demoLabel}>SEEDED DEMO</Text>
      </View>

      <View style={styles.kpiGrid}>
        <KpiCard label="Revenue this month" value={fmtAED(kpis.revenue)} delta="+12.4% vs last" tone="gold" icon="cash" />
        <KpiCard label="Active deals" value={String(kpis.active)} delta={`${kpis.newLeads} new leads`} tone="info" icon="briefcase" />
        <KpiCard label="Tasks due today" value={String(kpis.dueToday)} delta="Auto-checked every 5m" tone="warning" icon="checkmark-done" />
        <KpiCard label="Avg response" value={`${currentAgent?.responseAvgMinutes || 18}m`} delta="Improving" tone="success" icon="flash" />
      </View>

      <Section title="Your priority today" action="See all" onAction={goLeads}>
        {priorities.length === 0 ? (
          <Card>
            <Text style={styles.emptyRow}>No active leads. Add one from the + tab.</Text>
          </Card>
        ) : (
          <View style={{ gap: spacing.md }}>
            {priorities.map(({ lead, reason }) => (
              <Pressable
                key={lead.id}
                testID={`priority-${lead.id}`}
                onPress={() => onOpenLead(lead.id)}
                style={styles.priorityCard}
              >
                <View style={styles.priorityHead}>
                  <Avatar label={lead.name.split(' ').map((x) => x[0]).join('').slice(0, 2)} tone={stageMeta[lead.stage].color} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.priorityName}>{lead.name}</Text>
                    <Text style={styles.prioritySub}>
                      {stageMeta[lead.stage].label} · Score {lead.score}
                    </Text>
                  </View>
                  <View style={[styles.scorePill, { backgroundColor: colors.goldSoft }]}>
                    <Text style={styles.scoreText}>{lead.score}</Text>
                  </View>
                </View>
                <Text style={styles.priorityDetail}>
                  {lead.bedrooms || 'N/A'} · {lead.area || 'Unspecified'} · Budget {fmtAED(lead.budget)}
                </Text>
                <View style={styles.reco}>
                  <Ionicons name="sparkles" size={14} color={colors.gold} />
                  <Text style={styles.recoText}>{reason}</Text>
                </View>
                <View style={styles.priorityFoot}>
                  <Text style={styles.priorityWhy}>
                    Last contact {timeAgo(lead.lastContactAt)}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textSubtle} />
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </Section>

      <Section title="Pipeline overview" action="Open" onAction={goLeads}>
        <Card>
          <View style={styles.pipelineHead}>
            <View>
              <Text style={styles.pipelineValue}>{fmtAED(activePipelineValue)}</Text>
              <Text style={styles.pipelineCaption}>Active pipeline · {kpis.active} deals</Text>
            </View>
            <View style={styles.pipelineBadge}>
              <Ionicons name="trending-up" size={14} color={colors.success} />
              <Text style={styles.pipelineBadgeText}>+9.2%</Text>
            </View>
          </View>
          <View style={styles.pipelineBars}>
            {pipelineCounts.map((p, i) => (
              <View key={p.stage} style={styles.pipelineCol}>
                <View
                  style={[
                    styles.pipelineBar,
                    { height: 22 + p.count * 8, backgroundColor: i >= 3 ? colors.gold : colors.border },
                  ]}
                />
                <Text style={styles.pipelineNum}>{p.count}</Text>
                <Text style={styles.pipelineLabel} numberOfLines={1}>
                  {stageMeta[p.stage].label}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      </Section>

      <Section title="Recent conversations" action="Open inbox" onAction={goInbox}>
        <Card>
          {recentMessages.map((m, i) => (
            <View key={m.id} style={[styles.msgRow, i < recentMessages.length - 1 && styles.msgBorder]}>
              <Avatar label={m.from.split(' ').map((x) => x[0]).join('').slice(0, 2)} tone={colors.info} size={36} />
              <View style={{ flex: 1 }}>
                <View style={styles.msgTop}>
                  <Text style={styles.msgName}>{m.from}</Text>
                  <Text style={styles.msgTime}>{timeAgo(m.receivedAt)}</Text>
                </View>
                <Text style={styles.msgPreview} numberOfLines={1}>
                  {m.preview}
                </Text>
              </View>
              <Chip label={m.channel} small soft={colors.surfaceElev} color={colors.textMuted} />
            </View>
          ))}
        </Card>
      </Section>

      <Section title="Dubai market snapshot">
        <View style={styles.market}>
          <View style={{ flex: 1 }}>
            <Text style={styles.marketEyebrow}>DUBAI MARINA</Text>
            <Text style={styles.marketTitle}>Where attention is moving</Text>
            <Text style={styles.marketBody}>
              Marina transaction volume is up 8.6% MoM. Off-plan supply in Sobha Hartland tightened this week.
            </Text>
          </View>
          <View style={styles.marketStats}>
            <Text style={styles.marketNum}>AED 1,485</Text>
            <Text style={styles.marketLbl}>avg / sq ft</Text>
            <Text style={styles.marketNum}>+8.6%</Text>
            <Text style={styles.marketLbl}>price movement</Text>
          </View>
        </View>
      </Section>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 120 },
  greetRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  greeting: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  subGreeting: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 4 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm, marginBottom: spacing.lg },
  dateText: { color: colors.textMuted, fontSize: fontSize.xs },
  demoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success, marginLeft: 4 },
  demoLabel: { color: colors.success, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  emptyRow: { color: colors.textMuted, fontSize: fontSize.sm, padding: spacing.md, textAlign: 'center' },
  priorityCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  priorityHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  priorityName: { fontSize: fontSize.base, fontWeight: '800', color: colors.text },
  prioritySub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  scorePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  scoreText: { fontSize: fontSize.base, fontWeight: '800', color: colors.goldDark },
  priorityDetail: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.sm },
  reco: {
    marginTop: spacing.sm,
    backgroundColor: colors.goldSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 8,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  recoText: { color: colors.goldDark, fontSize: fontSize.sm, fontWeight: '600', flex: 1 },
  priorityFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  priorityWhy: { color: colors.textSubtle, fontSize: fontSize.xs },
  pipelineHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  pipelineValue: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  pipelineCaption: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  pipelineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  pipelineBadgeText: { fontSize: fontSize.xs, color: colors.success, fontWeight: '800' },
  pipelineBars: { flexDirection: 'row', gap: 6, alignItems: 'flex-end', justifyContent: 'space-between' },
  pipelineCol: { alignItems: 'center', flex: 1 },
  pipelineBar: { width: 20, borderRadius: 4 },
  pipelineNum: { color: colors.text, fontSize: fontSize.sm, fontWeight: '800', marginTop: 6 },
  pipelineLabel: { color: colors.textSubtle, fontSize: 9, marginTop: 2 },
  msgRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  msgBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  msgTop: { flexDirection: 'row', justifyContent: 'space-between' },
  msgName: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  msgTime: { color: colors.textSubtle, fontSize: fontSize.xs },
  msgPreview: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  market: {
    backgroundColor: colors.surfaceInverse,
    borderRadius: radius.md,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
  },
  marketEyebrow: { color: colors.gold, fontSize: 10, letterSpacing: 1.4, fontWeight: '800' },
  marketTitle: { color: colors.onSurfaceInverse, fontSize: fontSize.lg, fontWeight: '800', marginTop: 4 },
  marketBody: { color: '#CBD5E1', fontSize: fontSize.xs, marginTop: 6 },
  marketStats: { alignItems: 'flex-end', gap: 2, minWidth: 90 },
  marketNum: { color: colors.gold, fontSize: fontSize.lg, fontWeight: '800' },
  marketLbl: { color: '#CBD5E1', fontSize: 9, marginBottom: 6 },
});
