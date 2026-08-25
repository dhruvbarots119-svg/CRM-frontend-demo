// Ask SAI — deterministic AI-styled Q&A with prompt suggestions.
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '@/src/theme';
import { useApp } from '@/src/store/AppContext';
import { Field } from '@/src/components/Field';
import { Chip, fmtAED, PrimaryButton } from '@/src/components/ui';
import { BottomSheet } from '@/src/components/BottomSheet';

const SUGGESTIONS = [
  'Which clients should I follow up with today?',
  'Which deals are at risk?',
  "Why is Sarah's lead score 87?",
  'Find properties under AED 2.5M for Sarah',
  'Compare Ahmed off-plan projects',
  'What did I miss today?',
];

export const AskSaiSheet: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  const { state } = useApp();
  const [q, setQ] = useState('');
  const [answer, setAnswer] = useState<{ title: string; body: string; actions?: string[] } | null>(null);

  const answerFor = useMemo(
    () => (query: string) => {
      const t = query.toLowerCase();
      const sarah = state.leads.find((l) => l.name.toLowerCase().includes('sarah'));
      const ahmed = state.leads.find((l) => l.name.toLowerCase().includes('ahmed'));
      const james = state.leads.find((l) => l.name.toLowerCase().includes('james'));

      if (t.includes('follow up') || t.includes('today') || t.includes('priority')) {
        const top = [...state.leads]
          .filter((l) => l.stage !== 'ClosedWon' && l.stage !== 'ClosedLost')
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);
        return {
          title: 'Priorities for today',
          body: top
            .map(
              (l, i) =>
                `${i + 1}. ${l.name} (score ${l.score}) — ${
                  l.stage === 'Negotiation' ? 'chase mortgage docs' : l.score >= 80 ? 'send updated matches' : 'confirm requirements'
                }.`,
            )
            .join('\n'),
          actions: top.map((l) => l.name),
        };
      }
      if (t.includes('risk') || t.includes('at risk') || t.includes('deal')) {
        const risky = state.leads.filter(
          (l) => l.stage === 'Negotiation' && Object.values(l.checklist).some((v) => !v),
        );
        return {
          title: 'Deals needing attention',
          body:
            risky.length === 0
              ? 'No risky deals right now. Focus on progressing Negotiation-stage leads.'
              : risky
                  .map((l) => {
                    const missing = Object.entries(l.checklist).filter(([, v]) => !v).map(([k]) => k);
                    return `• ${l.name}: missing ${missing.slice(0, 2).join(', ')}.`;
                  })
                  .join('\n'),
        };
      }
      if (t.includes('why') && sarah) {
        return {
          title: `Why Sarah's score is ${sarah.score}`,
          body: sarah.scoreReasons.map((r) => `• ${r}`).join('\n'),
        };
      }
      if (t.includes('sarah') && sarah) {
        return {
          title: `Recommended action for ${sarah.name}`,
          body: `Score ${sarah.score}/100. She viewed Marina Vista twice and asked about mortgage. Send Marina Vista + LIV Marina side-by-side (both within ${fmtAED(sarah.budget)}) and offer 2 viewing slots this week. Deal risk: mortgage doc still pending.`,
        };
      }
      if (t.includes('ahmed') || t.includes('off-plan') || t.includes('off plan')) {
        return {
          title: `Ahmed — off-plan match`,
          body:
            'Sobha Hartland II is the strongest match at 92%. On his AED 1.8M budget, the 20/40/40 plan splits to AED 336K booking, AED 672K construction, AED 672K completion — comfortable for a 5-year hold. Compare vs The Valley Phase 2 (10/50/40 — heavier during construction).',
        };
      }
      if (t.includes('miss') || t.includes('summary')) {
        return {
          title: "Today's summary",
          body: `${state.leads.filter((l) => l.stage === 'New').length} new leads, ${state.leads.filter((l) => l.stage === 'Negotiation').length} in negotiation, ${state.tasks.filter((tt) => tt.status === 'Pending' && new Date(tt.dueAt) < new Date()).length} overdue tasks. Highest priority: ${sarah?.name || 'top lead'} (score ${sarah?.score || '—'}).`,
        };
      }
      if (t.includes('property') || t.includes('under') || t.includes('match')) {
        return {
          title: 'Property recommendations',
          body: `Best available under AED 2.5M in Marina: Marina Vista 2503 (94% match, ${fmtAED(2320000)}), LIV Marina 1802 (91%, ${fmtAED(2390000)}). Both have balconies, both fit Sarah's brief.`,
        };
      }
      if (t.includes('compare')) {
        return {
          title: 'Off-plan comparison',
          body:
            'Sobha Hartland II — 20/40/40, Q4 2026, AED 1.68M, 92% match.\nThe Valley Phase 2 — 10/50/40, Q2 2027, AED 1.75M, 87% match.\nAddress Residences — 20/30/50, Q1 2027, AED 1.92M, 78% match.\nLower initial commitment favours Sobha; larger completion payment on Address stretches the hold horizon.',
        };
      }
      return {
        title: 'Recommended next actions',
        body: `• Follow up with ${sarah?.name || 'top lead'} (${sarah?.score || 87}/100)\n• Send ${ahmed?.name || 'investor'} the off-plan comparison\n• Chase seller for ${james?.name || 'active offer'} before EOD`,
      };
    },
    [state],
  );

  const submit = (text?: string) => {
    const query = (text ?? q).trim();
    if (!query) return;
    setQ(query);
    setAnswer(answerFor(query));
  };

  const close = () => {
    setQ('');
    setAnswer(null);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={close} eyebrow="INTELLIGENCE LAYER" title="Ask SAI" testID="ask-sai-sheet" fullHeight>
      <Field
        label="Your question"
        value={q}
        onChangeText={setQ}
        placeholder="Which clients should I follow up today?"
        autoFocus
        testID="ask-input"
        onSubmitEditing={() => submit()}
        returnKeyType="send"
      />
      <PrimaryButton label="Ask SAI" icon="sparkles" onPress={() => submit()} testID="ask-submit" />

      {!answer ? (
        <View style={styles.suggestWrap}>
          <Text style={styles.suggestLabel}>Try one of these</Text>
          <View style={styles.suggestChips}>
            {SUGGESTIONS.map((s) => (
              <Chip key={s} label={s} small onPress={() => submit(s)} testID={`sugg-${s.slice(0, 8)}`} />
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.answerCard} testID="ask-answer">
          <View style={styles.answerHead}>
            <Ionicons name="sparkles" size={16} color={colors.gold} />
            <Text style={styles.answerTitle}>{answer.title}</Text>
          </View>
          <Text style={styles.answerBody}>{answer.body}</Text>
          <Text style={styles.answerFooter}>Deterministic demo — reasoning generated from your live seed data.</Text>
        </View>
      )}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  suggestWrap: { marginTop: spacing.lg },
  suggestLabel: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '800', letterSpacing: 0.4, marginBottom: 8 },
  suggestChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  answerCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.goldSoft,
    borderRadius: radius.md,
  },
  answerHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  answerTitle: { color: colors.goldDark, fontSize: fontSize.base, fontWeight: '800' },
  answerBody: { color: colors.text, fontSize: fontSize.sm, lineHeight: 22, marginTop: spacing.sm },
  answerFooter: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.sm, fontStyle: 'italic' },
});
