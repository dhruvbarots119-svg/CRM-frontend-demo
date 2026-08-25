// Admin / Team dashboard — agent performance, response tracking, revenue reports, CSV export.
import React, { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '@/src/theme';
import { useApp } from '@/src/store/AppContext';
import { Card, Chip, fmtAED, GhostButton, KpiCard, PrimaryButton, Row, Section } from '@/src/components/ui';
import { useToast } from '@/src/components/Toast';
import { BottomSheet } from '@/src/components/BottomSheet';
import { Field } from '@/src/components/Field';

export const AdminScreen: React.FC = () => {
  const { state } = useApp();
  const toast = useToast();
  const [tool, setTool] = useState<null | 'commission' | 'caprate'>(null);

  const perAgent = useMemo(() => {
    return state.agents
      .filter((a) => a.role === 'agent')
      .map((a) => {
        const leads = state.leads.filter((l) => l.assignedAgentId === a.id);
        const activeLeads = leads.filter((l) => l.stage !== 'ClosedWon' && l.stage !== 'ClosedLost');
        const closedWon = leads.filter((l) => l.stage === 'ClosedWon');
        const revenue = closedWon.reduce((sum, l) => sum + l.dealValue * 0.02, 0);
        const tasks = state.tasks.filter((t) => t.assignedAgentId === a.id);
        const completed = tasks.filter((t) => t.status === 'Completed').length;
        const overdue = tasks.filter(
          (t) => t.status === 'Pending' && new Date(t.dueAt) < new Date(),
        ).length;
        const contactRate = leads.length
          ? Math.round(((leads.length - leads.filter((l) => l.stage === 'New').length) / leads.length) * 100)
          : 0;
        const conversion = leads.length ? Math.round((closedWon.length / leads.length) * 100) : 0;
        return {
          agent: a,
          totalLeads: leads.length,
          activeLeads: activeLeads.length,
          won: closedWon.length,
          revenue,
          totalTasks: tasks.length,
          completed,
          overdue,
          contactRate,
          conversion,
        };
      });
  }, [state]);

  const topPerformer = useMemo(
    () => [...perAgent].sort((a, b) => b.revenue - a.revenue)[0],
    [perAgent],
  );

  const totalRevenue = perAgent.reduce((s, x) => s + x.revenue, 0);
  const totalWon = perAgent.reduce((s, x) => s + x.won, 0);
  const openPipeline = state.leads
    .filter((l) => l.stage !== 'ClosedWon' && l.stage !== 'ClosedLost')
    .reduce((s, l) => s + l.dealValue, 0);
  const teamPending = state.tasks.filter((t) => t.status === 'Pending').length;
  const teamOverdue = state.tasks.filter(
    (t) => t.status === 'Pending' && new Date(t.dueAt) < new Date(),
  ).length;

  const csvLeads = () => {
    const header = 'Name,Stage,Source,Budget,Area,Agent,Deal Value,Last Contact';
    const rows = state.leads.map((l) => {
      const agent = state.agents.find((a) => a.id === l.assignedAgentId)?.name || '';
      return [l.name, l.stage, l.source, l.budget, l.area, agent, l.dealValue, l.lastContactAt]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',');
    });
    const csv = [header, ...rows].join('\n');
    exportCsv('sai-leads.csv', csv, toast);
  };

  const csvRevenue = () => {
    const header = 'Agent,Total Leads,Won,Revenue AED,Conversion %';
    const rows = perAgent.map((p) => [p.agent.name, p.totalLeads, p.won, Math.round(p.revenue), p.conversion].join(','));
    exportCsv('sai-revenue.csv', [header, ...rows].join('\n'), toast);
  };

  const csvCalls = () => {
    const header = 'Lead,Agent,Outcome,At,Notes';
    const rows: string[] = [];
    state.leads.forEach((l) => {
      l.callLogs.forEach((c) => {
        const agent = state.agents.find((a) => a.id === c.agentId)?.name || '';
        rows.push([l.name, agent, c.outcome, c.at, c.notes].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
      });
    });
    exportCsv('sai-calls.csv', [header, ...rows].join('\n'), toast);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {state.role !== 'admin' ? (
        <View style={styles.warn}>
          <Ionicons name="lock-closed" size={16} color={colors.warning} />
          <Text style={styles.warnText}>
            Viewing as Agent — some KPIs reflect your book only. Switch to Admin from the header for team view.
          </Text>
        </View>
      ) : null}

      <View style={styles.kpiGrid}>
        <KpiCard label="Team revenue" value={fmtAED(totalRevenue)} tone="gold" icon="cash" delta={`${totalWon} deals`} />
        <KpiCard label="Open pipeline" value={fmtAED(openPipeline)} tone="info" icon="briefcase" delta="Active deals" />
        <KpiCard label="Team tasks" value={String(teamPending)} tone="warning" icon="checkmark-done" delta={`${teamOverdue} overdue`} />
        <KpiCard label="Response avg" value={`${Math.round(
          state.agents.reduce((s, a) => s + (a.role === 'agent' ? a.responseAvgMinutes : 0), 0) /
            Math.max(1, state.agents.filter((a) => a.role === 'agent').length),
        )}m`} tone="success" icon="flash" delta="Team wide" />
      </View>

      <Section title="Revenue by agent">
        <Card>
          {perAgent.map((p) => {
            const max = Math.max(1, ...perAgent.map((x) => x.revenue));
            const w = Math.round((p.revenue / max) * 100);
            return (
              <View key={p.agent.id} style={styles.barRow}>
                <View style={styles.barHead}>
                  <Text style={styles.barName}>{p.agent.name}</Text>
                  <Text style={styles.barValue}>{fmtAED(p.revenue)}</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${w}%`, backgroundColor: p === topPerformer ? colors.gold : colors.info }]} />
                </View>
              </View>
            );
          })}
        </Card>
      </Section>

      <Section title="Agent performance" action="Export CSV" onAction={csvRevenue}>
        <View style={{ gap: spacing.sm }}>
          {perAgent.map((p) => (
            <View key={p.agent.id} style={styles.agentCard} testID={`agent-card-${p.agent.id}`}>
              <View style={styles.agentHead}>
                <View style={[styles.agentDot, { backgroundColor: p.agent.avatarTone }]}>
                  <Text style={styles.agentInitials}>{p.agent.initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.agentTop}>
                    <Text style={styles.agentName}>{p.agent.name}</Text>
                    {p === topPerformer && p.revenue > 0 ? (
                      <View style={styles.topBadge}>
                        <Ionicons name="star" size={10} color={colors.onGold} />
                        <Text style={styles.topText}>TOP</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.agentSub}>Avg response {p.agent.responseAvgMinutes}m</Text>
                </View>
              </View>
              <View style={styles.agentGrid}>
                <View style={styles.agentMetric}>
                  <Text style={styles.agentMetricValue}>{p.totalLeads}</Text>
                  <Text style={styles.agentMetricLabel}>Leads</Text>
                </View>
                <View style={styles.agentMetric}>
                  <Text style={styles.agentMetricValue}>{p.won}</Text>
                  <Text style={styles.agentMetricLabel}>Won</Text>
                </View>
                <View style={styles.agentMetric}>
                  <Text style={styles.agentMetricValue}>{p.conversion}%</Text>
                  <Text style={styles.agentMetricLabel}>Conv.</Text>
                </View>
                <View style={styles.agentMetric}>
                  <Text style={[styles.agentMetricValue, p.overdue > 0 && { color: colors.error }]}>
                    {p.completed}/{p.totalTasks}
                  </Text>
                  <Text style={styles.agentMetricLabel}>Tasks</Text>
                </View>
              </View>
              <View style={styles.agentBar}>
                <Text style={styles.agentBarLabel}>Contact rate</Text>
                <View style={styles.agentBarTrack}>
                  <View style={[styles.agentBarFill, { width: `${p.contactRate}%` }]} />
                </View>
                <Text style={styles.agentBarPct}>{p.contactRate}%</Text>
              </View>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Tools & exports">
        <View style={styles.toolGrid}>
          <ToolCard icon="calculator" label="Commission split" onPress={() => setTool('commission')} testID="tool-commission" />
          <ToolCard icon="stats-chart" label="Cap rate" onPress={() => setTool('caprate')} testID="tool-caprate" />
          <ToolCard icon="document-text" label="Export leads" onPress={csvLeads} testID="tool-csv-leads" />
          <ToolCard icon="cash" label="Export revenue" onPress={csvRevenue} testID="tool-csv-revenue" />
          <ToolCard icon="call" label="Export calls" onPress={csvCalls} testID="tool-csv-calls" />
        </View>
      </Section>

      <CommissionSheet visible={tool === 'commission'} onClose={() => setTool(null)} />
      <CapRateSheet visible={tool === 'caprate'} onClose={() => setTool(null)} />
    </ScrollView>
  );
};

const ToolCard: React.FC<{ icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; testID?: string }> = ({
  icon,
  label,
  onPress,
  testID,
}) => (
  <Pressable testID={testID} onPress={onPress} style={styles.toolCard}>
    <View style={styles.toolIcon}>
      <Ionicons name={icon} size={22} color={colors.gold} />
    </View>
    <Text style={styles.toolLabel}>{label}</Text>
  </Pressable>
);

const exportCsv = async (name: string, csv: string, toast: ReturnType<typeof useToast>) => {
  try {
    if (Platform.OS === 'web' && typeof (globalThis as any).navigator !== 'undefined') {
      // web fallback
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = (globalThis as any).document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
      toast.show(`Downloaded ${name}`, 'success');
      return;
    }
    await Share.share({ message: csv, title: name });
    toast.show('CSV ready to share.', 'success');
  } catch (e) {
    toast.show('Export failed.', 'error');
  }
};

const CommissionSheet: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  const [price, setPrice] = useState('2320000');
  const [rate, setRate] = useState('2');
  const [split, setSplit] = useState('60');
  const total = (Number(price) || 0) * ((Number(rate) || 0) / 100);
  const agentShare = total * ((Number(split) || 0) / 100);
  const brokerShare = total - agentShare;

  return (
    <BottomSheet visible={visible} onClose={onClose} eyebrow="TOOL" title="Commission split" testID="commission-sheet">
      <Field label="Sale price (AED)" value={price} onChangeText={setPrice} keyboardType="numeric" />
      <Field label="Commission %" value={rate} onChangeText={setRate} keyboardType="numeric" />
      <Field label="Agent split %" value={split} onChangeText={setSplit} keyboardType="numeric" />
      <View style={styles.resultCard}>
        <ResultRow label="Total commission" value={fmtAED(total)} />
        <ResultRow label="Agent share" value={fmtAED(agentShare)} tone="gold" />
        <ResultRow label="Brokerage share" value={fmtAED(brokerShare)} />
      </View>
    </BottomSheet>
  );
};

const CapRateSheet: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  const [rent, setRent] = useState('125000');
  const [expenses, setExpenses] = useState('18000');
  const [price, setPrice] = useState('2320000');
  const noi = Number(rent) - Number(expenses);
  const cap = Number(price) > 0 ? (noi / Number(price)) * 100 : 0;
  const monthly = noi / 12;

  return (
    <BottomSheet visible={visible} onClose={onClose} eyebrow="TOOL" title="Cap rate & cash flow" testID="caprate-sheet">
      <Field label="Annual rent (AED)" value={rent} onChangeText={setRent} keyboardType="numeric" />
      <Field label="Annual expenses (AED)" value={expenses} onChangeText={setExpenses} keyboardType="numeric" />
      <Field label="Property value (AED)" value={price} onChangeText={setPrice} keyboardType="numeric" />
      <View style={styles.resultCard}>
        <ResultRow label="Net operating income" value={fmtAED(noi)} />
        <ResultRow label="Monthly cash flow" value={fmtAED(monthly)} tone="gold" />
        <ResultRow label="Cap rate" value={`${cap.toFixed(2)}%`} tone="gold" />
      </View>
    </BottomSheet>
  );
};

const ResultRow: React.FC<{ label: string; value: string; tone?: 'gold' }> = ({ label, value, tone }) => (
  <View style={styles.resultRow}>
    <Text style={styles.resultLabel}>{label}</Text>
    <Text style={[styles.resultValue, tone === 'gold' && { color: colors.goldDark }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 120 },
  warn: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  warnText: { color: colors.warning, fontSize: fontSize.xs, fontWeight: '600', flex: 1 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  barRow: { marginBottom: spacing.sm },
  barHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  barName: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  barValue: { color: colors.goldDark, fontSize: fontSize.sm, fontWeight: '800' },
  barTrack: { height: 8, backgroundColor: colors.surfaceElev, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  agentCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  agentHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  agentDot: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  agentInitials: { color: '#fff', fontSize: fontSize.xs, fontWeight: '800' },
  agentTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  agentName: { color: colors.text, fontSize: fontSize.base, fontWeight: '800' },
  agentSub: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.gold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  topText: { color: colors.onGold, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  agentGrid: { flexDirection: 'row', marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: spacing.sm },
  agentMetric: { flex: 1, alignItems: 'center' },
  agentMetricValue: { color: colors.text, fontSize: fontSize.base, fontWeight: '800' },
  agentMetricLabel: { color: colors.textSubtle, fontSize: 10, marginTop: 2 },
  agentBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  agentBarLabel: { color: colors.textMuted, fontSize: fontSize.xs, width: 90 },
  agentBarTrack: { flex: 1, height: 5, backgroundColor: colors.surfaceElev, borderRadius: 3 },
  agentBarFill: { height: '100%', backgroundColor: colors.gold, borderRadius: 3 },
  agentBarPct: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700', width: 34, textAlign: 'right' },
  toolGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  toolCard: {
    width: '31%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: 6,
    minHeight: 92,
    justifyContent: 'center',
  },
  toolIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.goldSoft, alignItems: 'center', justifyContent: 'center' },
  toolLabel: { color: colors.text, fontSize: fontSize.xs, fontWeight: '700', textAlign: 'center' },
  resultCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.goldSoft,
    borderRadius: radius.md,
    gap: 8,
  },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultLabel: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600' },
  resultValue: { color: colors.text, fontSize: fontSize.base, fontWeight: '800' },
});
