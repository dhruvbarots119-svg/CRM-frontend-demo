// Bottom tab navigation with a center Add action.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSize, radius, spacing } from '@/src/theme';

export type TabKey = 'home' | 'leads' | 'inbox' | 'more';

const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'home', label: 'Home', icon: 'grid' },
  { key: 'leads', label: 'Leads', icon: 'people' },
  { key: 'inbox', label: 'Inbox', icon: 'chatbubbles' },
  { key: 'more', label: 'More', icon: 'apps' },
];

export const BottomTabs: React.FC<{
  active: TabKey;
  onNavigate: (key: TabKey) => void;
  onAdd: () => void;
}> = ({ active, onNavigate, onAdd }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]} testID="bottom-tabs">
      <View style={styles.row}>
        {TABS.slice(0, 2).map((t) => (
          <TabItem key={t.key} tab={t} active={active === t.key} onPress={() => onNavigate(t.key)} />
        ))}
        <Pressable testID="tab-add" onPress={onAdd} style={styles.addBtn}>
          <Ionicons name="add" size={26} color={colors.onGold} />
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
    <Ionicons name={tab.icon} size={20} color={active ? colors.text : colors.textSubtle} />
    <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingHorizontal: spacing.sm,
    paddingTop: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    gap: 3,
  },
  label: { fontSize: 10, color: colors.textSubtle, fontWeight: '600' },
  labelActive: { color: colors.text, fontWeight: '800' },
  addBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.sm,
    marginTop: -12,
    shadowColor: colors.gold,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
