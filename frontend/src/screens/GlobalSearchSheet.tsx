// Global search across leads, properties, tasks, messages.
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '@/src/theme';
import { useApp } from '@/src/store/AppContext';
import { BottomSheet } from '@/src/components/BottomSheet';
import { Field } from '@/src/components/Field';
import { Chip, fmtAED } from '@/src/components/ui';

type Nav = {
  onOpenLead: (id: string) => void;
  onOpenProperty: (id: string) => void;
  onOpenTask: (id: string) => void;
  onOpenMessage: (id: string) => void;
};

export const GlobalSearchSheet: React.FC<{ visible: boolean; onClose: () => void } & Nav> = ({
  visible,
  onClose,
  onOpenLead,
  onOpenProperty,
  onOpenTask,
  onOpenMessage,
}) => {
  const { state } = useApp();
  const [q, setQ] = useState('');

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return { leads: [], properties: [], tasks: [], messages: [] };
    return {
      leads: state.leads
        .filter(
          (l) =>
            l.name.toLowerCase().includes(query) ||
            l.area.toLowerCase().includes(query) ||
            l.phone.includes(query) ||
            l.email.toLowerCase().includes(query),
        )
        .slice(0, 6),
      properties: state.properties
        .filter((p) => p.title.toLowerCase().includes(query) || p.area.toLowerCase().includes(query))
        .slice(0, 6),
      tasks: state.tasks.filter((t) => t.title.toLowerCase().includes(query)).slice(0, 6),
      messages: state.messages.filter((m) => m.from.toLowerCase().includes(query) || m.fullText.toLowerCase().includes(query)).slice(0, 6),
    };
  }, [q, state]);

  const total = results.leads.length + results.properties.length + results.tasks.length + results.messages.length;

  const close = () => {
    setQ('');
    onClose();
  };

  const goto = (fn: () => void) => {
    close();
    setTimeout(fn, 200);
  };

  return (
    <BottomSheet visible={visible} onClose={close} eyebrow="SEARCH" title="Find anything" testID="search-sheet" fullHeight>
      <Field
        label="Search"
        value={q}
        onChangeText={setQ}
        autoFocus
        placeholder="Search leads, properties, tasks…"
        testID="search-input"
      />

      {!q.trim() ? (
        <View style={styles.hint}>
          <Ionicons name="sparkles" size={16} color={colors.gold} />
          <Text style={styles.hintText}>Search across leads, properties, tasks and inbox in one place.</Text>
        </View>
      ) : total === 0 ? (
        <Text style={styles.noResult}>No matches for &quot;{q}&quot;.</Text>
      ) : (
        <View>
          {results.leads.length > 0 ? (
            <View style={styles.group}>
              <Text style={styles.groupTitle}>Leads · {results.leads.length}</Text>
              {results.leads.map((l) => (
                <Pressable key={l.id} style={styles.row} onPress={() => goto(() => onOpenLead(l.id))} testID={`search-lead-${l.id}`}>
                  <Ionicons name="person" size={16} color={colors.gold} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{l.name}</Text>
                    <Text style={styles.rowMeta}>
                      {l.stage} · {fmtAED(l.budget)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={colors.textSubtle} />
                </Pressable>
              ))}
            </View>
          ) : null}
          {results.properties.length > 0 ? (
            <View style={styles.group}>
              <Text style={styles.groupTitle}>Properties · {results.properties.length}</Text>
              {results.properties.map((p) => (
                <Pressable key={p.id} style={styles.row} onPress={() => goto(() => onOpenProperty(p.id))}>
                  <Ionicons name="business" size={16} color={colors.info} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{p.title}</Text>
                    <Text style={styles.rowMeta}>
                      {p.area} · {fmtAED(p.price)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={colors.textSubtle} />
                </Pressable>
              ))}
            </View>
          ) : null}
          {results.tasks.length > 0 ? (
            <View style={styles.group}>
              <Text style={styles.groupTitle}>Tasks · {results.tasks.length}</Text>
              {results.tasks.map((t) => (
                <Pressable key={t.id} style={styles.row} onPress={() => goto(() => onOpenTask(t.id))}>
                  <Ionicons name="checkmark-done" size={16} color={colors.warning} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{t.title}</Text>
                    <Text style={styles.rowMeta}>
                      {t.priority} · {t.status}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={colors.textSubtle} />
                </Pressable>
              ))}
            </View>
          ) : null}
          {results.messages.length > 0 ? (
            <View style={styles.group}>
              <Text style={styles.groupTitle}>Inbox · {results.messages.length}</Text>
              {results.messages.map((m) => (
                <Pressable key={m.id} style={styles.row} onPress={() => goto(() => onOpenMessage(m.id))}>
                  <Ionicons name="chatbubbles" size={16} color={colors.success} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{m.from}</Text>
                    <Text style={styles.rowMeta} numberOfLines={1}>{m.preview}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={colors.textSubtle} />
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      )}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.goldSoft,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  hintText: { color: colors.goldDark, fontSize: fontSize.sm, fontWeight: '600', flex: 1 },
  noResult: { color: colors.textMuted, textAlign: 'center', padding: spacing.xl, fontSize: fontSize.sm },
  group: { marginTop: spacing.md },
  groupTitle: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '800', letterSpacing: 0.5, marginBottom: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rowTitle: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  rowMeta: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
});
