// Leads Screen — full pipeline (Kanban vertical) + filters + auto-assignment + detail sheet.
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing, stageMeta } from '@/src/theme';
import { useApp, visibleLeads } from '@/src/store/AppContext';
import { Lead, LeadStage } from '@/src/store/types';
import { Avatar, Chip, fmtAED, fmtDuration, PrimaryButton, timeAgo } from '@/src/components/ui';
import { useToast } from '@/src/components/Toast';

const STAGES: { key: LeadStage; label: string }[] = [
  { key: 'New', label: 'New' },
  { key: 'Contacted', label: 'Contacted' },
  { key: 'SiteVisit', label: 'Site Visit' },
  { key: 'Negotiation', label: 'Negotiation' },
  { key: 'ClosedWon', label: 'Closed Won' },
  { key: 'ClosedLost', label: 'Closed Lost' },
];

export const LeadsScreen: React.FC<{
  onOpenLead: (id: string) => void;
  onAddLead: () => void;
  onWhatsApp: (leadId: string) => void;
}> = ({ onOpenLead, onAddLead, onWhatsApp }) => {
  const { state } = useApp();
  const leads = visibleLeads(state);
  const toast = useToast();
  const [filter, setFilter] = useState<'All' | LeadStage>('All');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    New: true,
    Contacted: true,
    SiteVisit: true,
    Negotiation: true,
    ClosedWon: false,
    ClosedLost: false,
  });

  const filtered = useMemo(() => {
    let list = leads;
    if (filter !== 'All') list = list.filter((l) => l.stage === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.area.toLowerCase().includes(q) ||
          l.phone.includes(q),
      );
    }
    return list;
  }, [leads, filter, search]);

  const grouped = useMemo(() => {
    const map = new Map<LeadStage, Lead[]>();
    STAGES.forEach((s) => map.set(s.key, []));
    filtered.forEach((l) => map.get(l.stage)?.push(l));
    return map;
  }, [filtered]);

  const activePipelineValue = leads
    .filter((l) => l.stage !== 'ClosedWon' && l.stage !== 'ClosedLost')
    .reduce((sum, l) => sum + l.dealValue, 0);

  const totalTalkTime = leads.reduce((sum, l) => sum + (l.talkTimeMinutes || 0), 0);
  const isAdmin = state.role === 'admin';

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{leads.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{fmtAED(activePipelineValue)}</Text>
            <Text style={styles.statLabel}>Pipeline</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {leads.filter((l) => l.stage === 'ClosedWon').length}
            </Text>
            <Text style={styles.statLabel}>Won</Text>
          </View>
          {isAdmin ? (
            <>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.gold }]}>{fmtDuration(totalTalkTime)}</Text>
                <Text style={styles.statLabel}>Talk time</Text>
              </View>
            </>
          ) : null}
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            testID="lead-search"
            value={search}
            onChangeText={setSearch}
            placeholder="Search name, area or phone"
            placeholderTextColor={colors.textSubtle}
            style={styles.searchInput}
          />
          {search ? (
            <Pressable onPress={() => setSearch('')} hitSlop={6}>
              <Ionicons name="close-circle" size={16} color={colors.textSubtle} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRowContent}
          style={styles.chipRow}
        >
          <Chip label={`All ${leads.length}`} active={filter === 'All'} onPress={() => setFilter('All')} testID="filter-all" />
          {STAGES.map((s) => {
            const count = leads.filter((l) => l.stage === s.key).length;
            return (
              <Chip
                key={s.key}
                testID={`filter-${s.key}`}
                label={`${s.label} ${count}`}
                active={filter === s.key}
                color={stageMeta[s.key].color}
                soft={stageMeta[s.key].soft}
                onPress={() => setFilter(s.key)}
              />
            );
          })}
        </ScrollView>

        {STAGES.map((s) => {
          const items = grouped.get(s.key) || [];
          if (items.length === 0 && filter !== 'All' && filter !== s.key) return null;
          return (
            <View key={s.key} style={styles.stageBlock}>
              <Pressable
                testID={`stage-header-${s.key}`}
                onPress={() => setExpanded((e) => ({ ...e, [s.key]: !e[s.key] }))}
                style={styles.stageHead}
              >
                <View style={[styles.stagePip, { backgroundColor: stageMeta[s.key].color }]} />
                <Text style={styles.stageTitle}>{s.label}</Text>
                <View style={[styles.stageCount, { backgroundColor: stageMeta[s.key].soft }]}>
                  <Text style={[styles.stageCountText, { color: stageMeta[s.key].color }]}>{items.length}</Text>
                </View>
                <View style={{ flex: 1 }} />
                <Ionicons
                  name={expanded[s.key] ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textSubtle}
                />
              </Pressable>
              {expanded[s.key] && (
                <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
                  {items.length === 0 ? (
                    <View style={styles.stageEmptyCard}>
                      <Text style={styles.stageEmpty}>No leads in this stage.</Text>
                    </View>
                  ) : (
                    items.map((l) => (
                      <LeadRow
                        key={l.id}
                        lead={l}
                        onPress={() => onOpenLead(l.id)}
                        onCall={() => toast.show(`Dialling ${l.name}…`, 'info')}
                        onWhatsApp={() => onWhatsApp(l.id)}
                        isAdmin={isAdmin}
                        agents={state.agents}
                      />
                    ))
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.fabWrap} pointerEvents="box-none">
        <PrimaryButton
          label="Add lead"
          icon="add-circle"
          onPress={onAddLead}
          testID="add-lead-fab"
          style={styles.fab}
        />
      </View>
    </View>
  );
};

const LeadRow: React.FC<{
  lead: Lead;
  onPress: () => void;
  onCall: () => void;
  onWhatsApp: () => void;
  isAdmin: boolean;
  agents: any[];
}> = ({ lead, onPress, onCall, onWhatsApp, isAdmin, agents }) => {
  const agent = agents.find((a) => a.id === lead.assignedAgentId);
  const initials = lead.name.split(' ').map((x) => x[0]).join('').slice(0, 2);
  const talk = lead.talkTimeMinutes || 0;
  return (
    <Pressable testID={`lead-row-${lead.id}`} onPress={onPress} style={styles.leadRow}>
      <Avatar label={initials} tone={stageMeta[lead.stage].color} size={44} />
      <View style={{ flex: 1 }}>
        <View style={styles.leadTop}>
          <Text style={styles.leadName} numberOfLines={1}>{lead.name}</Text>
          <Text style={styles.leadTime}>{timeAgo(lead.lastContactAt)}</Text>
        </View>
        <Text style={styles.leadMeta} numberOfLines={1}>
          {lead.bedrooms || '—'} · {lead.area || '—'} · {fmtAED(lead.budget)}
        </Text>
        <View style={styles.leadFoot}>
          <View style={[styles.scorePill, lead.score >= 80 && { backgroundColor: colors.successSoft }]}>
            <Ionicons
              name="pulse"
              size={11}
              color={lead.score >= 80 ? colors.success : lead.score >= 60 ? colors.gold : colors.textMuted}
            />
            <Text style={styles.scoreText}>{lead.score}</Text>
          </View>
          {agent ? (
            <View style={styles.agentPill}>
              <View style={[styles.dot, { backgroundColor: agent.avatarTone }]} />
              <Text style={styles.agentText}>{agent.name.split(' ')[0]}</Text>
            </View>
          ) : null}
          {isAdmin ? (
            <View style={styles.talkPill}>
              <Ionicons name="time-outline" size={11} color={colors.gold} />
              <Text style={styles.talkText}>{fmtDuration(talk)}</Text>
            </View>
          ) : null}
          <View style={{ flex: 1 }} />
          <Pressable
            testID={`lead-call-${lead.id}`}
            onPress={onCall}
            hitSlop={6}
            style={styles.quickBtn}
          >
            <Ionicons name="call" size={14} color={colors.success} />
          </Pressable>
          <Pressable
            testID={`lead-wa-${lead.id}`}
            onPress={onWhatsApp}
            hitSlop={6}
            style={[styles.quickBtn, { backgroundColor: '#E7FBEF' }]}
          >
            <Ionicons name="logo-whatsapp" size={14} color="#25D366" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 140 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text, letterSpacing: -0.4 },
  statLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: colors.divider, marginHorizontal: 6 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 42,
    marginBottom: spacing.md,
  },
  searchInput: { flex: 1, fontSize: fontSize.sm, color: colors.text, padding: 0 },
  chipRow: { marginBottom: spacing.md, marginHorizontal: -spacing.lg },
  chipRowContent: { paddingHorizontal: spacing.lg, gap: 8 },
  stageBlock: { marginBottom: spacing.md },
  stageHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  stagePip: { width: 8, height: 8, borderRadius: 4 },
  stageTitle: { color: colors.text, fontSize: fontSize.base, fontWeight: '800' },
  stageCount: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill },
  stageCountText: { fontSize: fontSize.xs, fontWeight: '800' },
  stageEmpty: { color: colors.textSubtle, fontSize: fontSize.xs, textAlign: 'center' },
  stageEmptyCard: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  leadRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  leadTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leadName: { color: colors.text, fontSize: fontSize.base, fontWeight: '800', flex: 1, marginRight: 6 },
  leadTime: { color: colors.textSubtle, fontSize: fontSize.xs },
  leadMeta: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 3 },
  leadFoot: { flexDirection: 'row', gap: 6, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.goldSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  scoreText: { fontSize: fontSize.xs, color: colors.text, fontWeight: '800' },
  agentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  agentText: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '700' },
  talkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.navy,
    borderRadius: radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  talkText: { fontSize: fontSize.xs, color: colors.gold, fontWeight: '800' },
  quickBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabWrap: { position: 'absolute', left: 0, right: 0, bottom: 20, alignItems: 'center' },
  fab: { paddingHorizontal: spacing.xl, minWidth: 180 },
});
