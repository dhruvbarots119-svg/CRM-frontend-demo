// Lead detail — score reasoning, matched properties, checklist, call logs, memory, stage progression.
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing, stageMeta } from '@/src/theme';
import { useApp } from '@/src/store/AppContext';
import { CallOutcome, Lead, LeadStage } from '@/src/store/types';
import { BottomSheet } from '@/src/components/BottomSheet';
import { Avatar, Chip, Divider, fmtAED, fmtDateTime, GhostButton, PrimaryButton, Row, Section, timeAgo } from '@/src/components/ui';
import { Field } from '@/src/components/Field';
import { useToast } from '@/src/components/Toast';

const STAGES: LeadStage[] = ['New', 'Contacted', 'SiteVisit', 'Negotiation', 'ClosedWon', 'ClosedLost'];

export const LeadDetailSheet: React.FC<{
  leadId: string | null;
  onClose: () => void;
  onOpenProperty: (id: string) => void;
}> = ({ leadId, onClose, onOpenProperty }) => {
  const { state, moveLeadStage, toggleLeadChecklist, addCallLog, updateLead, deleteLead, getMatchingProperties, pushNotification } = useApp();
  const toast = useToast();
  const lead = state.leads.find((l) => l.id === leadId);

  const [logOpen, setLogOpen] = useState(false);
  const [logOutcome, setLogOutcome] = useState<CallOutcome>('Interested');
  const [logNotes, setLogNotes] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const matches = useMemo(() => (leadId ? getMatchingProperties(leadId) : []), [leadId, getMatchingProperties]);

  React.useEffect(() => {
    if (lead && editOpen) {
      setEditName(lead.name);
      setEditPhone(lead.phone);
      setEditBudget(String(lead.budget || ''));
      setEditArea(lead.area);
      setEditNotes(lead.notes);
    }
  }, [lead, editOpen]);

  if (!lead) return null;

  const initials = lead.name.split(' ').map((x) => x[0]).join('').slice(0, 2);
  const agent = state.agents.find((a) => a.id === lead.assignedAgentId);
  const isAdmin = state.role === 'admin';
  const missing = Object.entries(lead.checklist).filter(([, v]) => !v);
  const risk =
    lead.stage === 'Negotiation' && missing.length > 0
      ? `Deal risk: ${missing.length} item${missing.length > 1 ? 's' : ''} pending (${missing[0][0]}).`
      : null;

  const doStage = (stage: LeadStage) => {
    moveLeadStage(lead.id, stage);
    toast.show(`Moved to ${stageMeta[stage].label}`, 'success');
    if (stage === 'ClosedWon') {
      pushNotification({
        title: 'Deal closed 🎉',
        body: `${lead.name} · Auto-scheduled 3-day follow-up + 1-year anniversary reminder.`,
        kind: 'system',
        leadId: lead.id,
      });
    }
  };

  const submitLog = () => {
    if (!logNotes.trim()) {
      toast.show('Add a note before saving.', 'warning');
      return;
    }
    addCallLog(lead.id, { outcome: logOutcome, notes: logNotes });
    setLogNotes('');
    setLogOpen(false);
    toast.show('Call log saved.', 'success');
  };

  const saveEdit = () => {
    updateLead(lead.id, {
      name: editName || lead.name,
      phone: editPhone,
      budget: Number(editBudget) || 0,
      area: editArea,
      notes: editNotes,
    });
    setEditOpen(false);
    toast.show('Lead updated.', 'success');
  };

  return (
    <BottomSheet visible={!!leadId} onClose={onClose} eyebrow="CLIENT 360" title={lead.name} testID="lead-detail-sheet" fullHeight>
      <View style={styles.head}>
        <Avatar label={initials} tone={stageMeta[lead.stage].color} size={54} />
        <View style={{ flex: 1 }}>
          <Text style={styles.meta}>
            {lead.bedrooms || '—'} · {lead.area || '—'} · {fmtAED(lead.budget)}
          </Text>
          <Text style={styles.metaSub}>
            {lead.source} · Assigned to {agent?.name || 'unassigned'}
          </Text>
          <View style={styles.stagePill}>
            <View style={[styles.stagePipMini, { backgroundColor: stageMeta[lead.stage].color }]} />
            <Text style={[styles.stagePillText, { color: stageMeta[lead.stage].color }]}>{stageMeta[lead.stage].label}</Text>
            <Text style={styles.scoreInline}>· Score {lead.score}</Text>
          </View>
        </View>
      </View>

      {risk ? (
        <View style={styles.risk}>
          <Ionicons name="warning" size={18} color={colors.warning} />
          <Text style={styles.riskText}>{risk}</Text>
        </View>
      ) : null}

      <View style={styles.actionRow}>
        <GhostButton icon="call" label="Log call" onPress={() => setLogOpen(true)} testID="btn-log-call" style={styles.actionBtn} />
        <GhostButton icon="chatbubble-ellipses" label="WhatsApp" onPress={() => toast.show('WhatsApp draft prepared (demo).', 'info')} style={styles.actionBtn} />
        <GhostButton icon="create" label="Edit" onPress={() => setEditOpen(true)} testID="btn-edit-lead" style={styles.actionBtn} />
      </View>

      {isAdmin ? (
        <GhostButton
          icon="trash"
          label="Delete lead"
          danger
          testID="btn-delete-lead"
          onPress={() => {
            deleteLead(lead.id);
            toast.show('Lead deleted.', 'success');
            onClose();
          }}
          style={{ marginBottom: spacing.md }}
        />
      ) : null}

      <Section title="Stage progression">
        <View style={styles.stagesGrid}>
          {STAGES.map((s) => {
            const active = lead.stage === s;
            return (
              <Pressable
                key={s}
                testID={`stage-btn-${s}`}
                onPress={() => doStage(s)}
                style={[
                  styles.stageBtn,
                  active && { backgroundColor: stageMeta[s].color, borderColor: stageMeta[s].color },
                ]}
              >
                <Text style={[styles.stageBtnText, active && { color: '#fff' }]}>{stageMeta[s].label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Section>

      <Section title="Why SAI scored this lead">
        <View style={styles.reasonWrap}>
          {lead.scoreReasons.map((r, i) => (
            <View key={i} style={styles.reasonRow}>
              <Ionicons
                name={r.toLowerCase().includes('no ') || r.toLowerCase().includes("hasn't") ? 'remove-circle' : 'checkmark-circle'}
                size={16}
                color={
                  r.toLowerCase().includes('no ') || r.toLowerCase().includes("hasn't") ? colors.warning : colors.success
                }
              />
              <Text style={styles.reasonText}>{r}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Client memory">
        <View style={styles.memoryWrap}>
          <Text style={styles.memoryLabel}>Preferences</Text>
          <View style={styles.memoryChips}>
            {lead.memory.preferences.length ? (
              lead.memory.preferences.map((p) => <Chip key={p} label={p} small soft={colors.goldSoft} color={colors.goldDark} />)
            ) : (
              <Text style={styles.memoryEmpty}>No preferences captured yet.</Text>
            )}
          </View>
          <Text style={[styles.memoryLabel, { marginTop: spacing.sm }]}>Concerns</Text>
          <View style={styles.memoryChips}>
            {lead.memory.concerns.length ? (
              lead.memory.concerns.map((c) => <Chip key={c} label={c} small soft={colors.warningSoft} color={colors.warning} />)
            ) : (
              <Text style={styles.memoryEmpty}>None flagged.</Text>
            )}
          </View>
        </View>
      </Section>

      <Section title={`Property matches (${matches.length})`}>
        {matches.length === 0 ? (
          <View style={styles.emptyBlock}>
            <Text style={styles.emptyBlockText}>Add budget and area to unlock matches.</Text>
          </View>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {matches.slice(0, 3).map((p) => (
              <Pressable
                key={p.id}
                testID={`match-${p.id}`}
                onPress={() => onOpenProperty(p.id)}
                style={styles.matchRow}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.matchTitle}>{p.title}</Text>
                  <Text style={styles.matchMeta}>
                    {p.area} · {p.bedrooms}BR · {fmtAED(p.price)}
                  </Text>
                </View>
                <View style={styles.matchScore}>
                  <Text style={styles.matchScoreText}>{Math.min(99, 65 + Math.round((lead.budget / (p.price || 1)) * 20))}%</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </Section>

      <Section title="Stage checklist">
        <View style={styles.checkWrap}>
          {Object.entries(lead.checklist).length === 0 ? (
            <Text style={styles.emptyBlockText}>No checklist yet.</Text>
          ) : (
            Object.entries(lead.checklist).map(([k, v]) => (
              <Pressable
                key={k}
                testID={`check-${k}`}
                onPress={() => toggleLeadChecklist(lead.id, k)}
                style={styles.checkRow}
              >
                <Ionicons
                  name={v ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={v ? colors.success : colors.textSubtle}
                />
                <Text style={[styles.checkText, v && { textDecorationLine: 'line-through', color: colors.textSubtle }]}>{k}</Text>
              </Pressable>
            ))
          )}
        </View>
      </Section>

      <Section title={`Call log (${lead.callLogs.length})`}>
        {lead.callLogs.length === 0 ? (
          <View style={styles.emptyBlock}>
            <Text style={styles.emptyBlockText}>No calls logged yet.</Text>
          </View>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {lead.callLogs.slice(0, 5).map((c) => (
              <View key={c.id} style={styles.logRow}>
                <View style={styles.logHead}>
                  <Chip label={c.outcome} small soft={colors.infoSoft} color={colors.info} />
                  <Text style={styles.logTime}>{fmtDateTime(c.at)}</Text>
                </View>
                <Text style={styles.logNotes}>{c.notes}</Text>
              </View>
            ))}
          </View>
        )}
      </Section>

      {logOpen ? (
        <View style={styles.logForm} testID="log-form">
          <Text style={styles.sectionMini}>New call log</Text>
          <View style={styles.outcomeRow}>
            {(['Interested', 'Not Interested', 'Callback', 'Voicemail', 'No Answer'] as CallOutcome[]).map((o) => (
              <Chip
                key={o}
                small
                label={o}
                active={logOutcome === o}
                onPress={() => setLogOutcome(o)}
                color={colors.info}
                soft={colors.infoSoft}
                testID={`outcome-${o}`}
              />
            ))}
          </View>
          <Field label="Notes" value={logNotes} onChangeText={setLogNotes} multiline placeholder="What did you discuss?" />
          <Row>
            <GhostButton label="Cancel" onPress={() => setLogOpen(false)} style={{ flex: 1 }} />
            <PrimaryButton label="Save log" onPress={submitLog} testID="save-log" style={{ flex: 1 }} />
          </Row>
        </View>
      ) : null}

      {editOpen ? (
        <View style={styles.logForm} testID="edit-form">
          <Text style={styles.sectionMini}>Edit lead</Text>
          <Field label="Name" value={editName} onChangeText={setEditName} />
          <Field label="Phone" value={editPhone} onChangeText={setEditPhone} keyboardType="phone-pad" />
          <Field label="Budget (AED)" value={editBudget} onChangeText={setEditBudget} keyboardType="numeric" />
          <Field label="Area" value={editArea} onChangeText={setEditArea} />
          <Field label="Notes" value={editNotes} onChangeText={setEditNotes} multiline />
          <Row>
            <GhostButton label="Cancel" onPress={() => setEditOpen(false)} style={{ flex: 1 }} />
            <PrimaryButton label="Save" onPress={saveEdit} testID="save-edit" style={{ flex: 1 }} />
          </Row>
        </View>
      ) : null}

      <Divider />
      <Text style={styles.timeline}>
        Created {timeAgo(lead.createdAt)} · Last contact {timeAgo(lead.lastContactAt)}
        {lead.closedAt ? ` · Closed ${timeAgo(lead.closedAt)}` : ''}
      </Text>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  head: { flexDirection: 'row', gap: spacing.md, alignItems: 'center', marginBottom: spacing.md },
  meta: { color: colors.text, fontSize: fontSize.base, fontWeight: '700' },
  metaSub: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 3 },
  stagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  stagePipMini: { width: 6, height: 6, borderRadius: 3 },
  stagePillText: { fontSize: fontSize.xs, fontWeight: '800' },
  scoreInline: { color: colors.textSubtle, fontSize: fontSize.xs, fontWeight: '700', marginLeft: 3 },
  risk: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  riskText: { color: colors.warning, fontSize: fontSize.sm, fontWeight: '700', flex: 1 },
  actionRow: { flexDirection: 'row', gap: 6, marginBottom: spacing.md },
  actionBtn: { flex: 1, paddingHorizontal: 4 },
  stagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  stageBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  stageBtnText: { color: colors.text, fontSize: fontSize.xs, fontWeight: '700' },
  reasonWrap: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: 6 },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reasonText: { color: colors.text, fontSize: fontSize.sm },
  memoryWrap: { backgroundColor: colors.surfaceElev, borderRadius: radius.md, padding: spacing.md },
  memoryLabel: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '800', letterSpacing: 0.4, marginBottom: 6 },
  memoryChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  memoryEmpty: { color: colors.textSubtle, fontSize: fontSize.xs },
  emptyBlock: { padding: spacing.md, backgroundColor: colors.surfaceElev, borderRadius: radius.md },
  emptyBlockText: { color: colors.textMuted, fontSize: fontSize.xs, textAlign: 'center' },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  matchTitle: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  matchMeta: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  matchScore: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.successSoft },
  matchScoreText: { color: colors.success, fontSize: fontSize.xs, fontWeight: '800' },
  checkWrap: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: 8 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  checkText: { color: colors.text, fontSize: fontSize.sm, flex: 1, textTransform: 'capitalize' },
  logRow: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  logHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logTime: { fontSize: fontSize.xs, color: colors.textSubtle },
  logNotes: { fontSize: fontSize.sm, color: colors.text, marginTop: 6 },
  logForm: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.goldSoft,
    borderRadius: radius.md,
  },
  sectionMini: { fontSize: fontSize.sm, fontWeight: '800', color: colors.text, marginBottom: 8 },
  outcomeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.sm },
  timeline: { color: colors.textSubtle, fontSize: fontSize.xs, textAlign: 'center', marginTop: 4 },
});
