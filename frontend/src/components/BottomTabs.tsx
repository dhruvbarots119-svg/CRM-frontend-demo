// Bottom tabs — flat row with a small navy circular + button between Leads and Inbox.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/src/theme';

export type TabKey = 'home' | 'leads' | 'inbox' | 'more';

const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'home', label: 'Home', icon: 'grid-outline' },
  { key: 'leads', label: 'Leads', icon: 'people-outline' },
  { key: 'inbox', label: 'Inbox', icon: 'chatbubble-outline' },
  { key: 'more', label: 'More', icon: 'apps-outline' },
];

export const BottomTabs: React.FC<{
  active: TabKey;
  onNavigate: (key: TabKey) => void;
  onAdd: () => void;
}> = ({ active, onNavigate, onAdd }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 4) }]} testID="bottom-tabs">
      <View style={styles.row}>
        {TABS.slice(0, 2).map((t) => (
          <TabItem key={t.key} tab={t} active={active === t.key} onPress={() => onNavigate(t.key)} />
        ))}
        <Pressable testID="tab-add" onPress={onAdd} style={styles.addBtn} hitSlop={4}>
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
        {TABS.slice(2).map((t) => (
          <TabItem key={t.key} tab={t} active={active === t.key} onPress={() => onNavigate(t.key)} />
        ))}
      </View>
    </View>
  );
};

const TabItem: React.FC<{
  tab: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap };
  active: boolean;
  onPress: () => void;
}> = ({ tab, active, onPress }) => (
  <Pressable
    testID={`tab-${tab.key}`}
    onPress={onPress}
    style={styles.tab}
    hitSlop={6}
  >
    <Ionicons name={tab.icon} size={21} color={active ? colors.navy : colors.textMuted} />
    <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingTop: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    gap: 4,
  },
  label: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  labelActive: { color: colors.navy, fontWeight: '800' },
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    marginTop: -18,
    borderWidth: 4,
    borderColor: colors.bg,
  },
});
