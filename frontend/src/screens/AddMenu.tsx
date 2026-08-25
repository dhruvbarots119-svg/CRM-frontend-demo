// Quick-add action menu — triggered by the + tab.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '@/src/theme';
import { BottomSheet } from '@/src/components/BottomSheet';

type Action = 'lead' | 'task' | 'property' | 'ask';

const ACTIONS: { key: Action; label: string; icon: keyof typeof Ionicons.glyphMap; sub: string }[] = [
  { key: 'lead', label: 'New lead', icon: 'person-add', sub: 'Manual entry — auto-assigned to lightest load' },
  { key: 'task', label: 'New task', icon: 'checkmark-done', sub: 'Follow-up, viewing, call, document' },
  { key: 'property', label: 'Add property', icon: 'business', sub: 'Listing with photo, pricing, amenities' },
  { key: 'ask', label: 'Ask SAI', icon: 'sparkles', sub: 'Prioritized intelligence in seconds' },
];

export const AddMenu: React.FC<{ visible: boolean; onClose: () => void; onPick: (a: Action) => void }> = ({
  visible,
  onClose,
  onPick,
}) => (
  <BottomSheet visible={visible} onClose={onClose} eyebrow="QUICK ADD" title="What next?" testID="add-menu">
    {ACTIONS.map((a) => (
      <Pressable
        key={a.key}
        testID={`quick-${a.key}`}
        onPress={() => {
          onClose();
          setTimeout(() => onPick(a.key), 220);
        }}
        style={styles.row}
      >
        <View style={styles.icon}>
          <Ionicons name={a.icon} size={22} color={colors.gold} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{a.label}</Text>
          <Text style={styles.sub}>{a.sub}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textSubtle} />
      </Pressable>
    ))}
  </BottomSheet>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { color: colors.text, fontSize: fontSize.base, fontWeight: '800' },
  sub: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 3 },
});
