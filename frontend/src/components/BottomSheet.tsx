// A generic BottomSheet modal used for detail views, forms, and confirmations.
import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '@/src/theme';

export const BottomSheet: React.FC<{
  visible: boolean;
  title?: string;
  eyebrow?: string;
  onClose: () => void;
  children: React.ReactNode;
  testID?: string;
  fullHeight?: boolean;
}> = ({ visible, title, eyebrow, onClose, children, testID, fullHeight }) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop} testID={testID}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.wrap, fullHeight && { maxHeight: '95%' }]}
        >
          <View style={styles.card}>
            <View style={styles.handleWrap}>
              <View style={styles.handle} />
            </View>
            <View style={styles.head}>
              <View style={{ flex: 1 }}>
                {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
                {title ? <Text style={styles.title}>{title}</Text> : null}
              </View>
              <Pressable testID="sheet-close" onPress={onClose} style={styles.close} hitSlop={8}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </Pressable>
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'flex-end' },
  wrap: { maxHeight: '88%' },
  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  handleWrap: { alignItems: 'center', paddingVertical: spacing.sm },
  handle: { width: 42, height: 4, borderRadius: 4, backgroundColor: colors.border },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.md },
  eyebrow: { color: colors.gold, fontSize: fontSize.xs, fontWeight: '800', letterSpacing: 1.4 },
  title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text, marginTop: 4, letterSpacing: -0.5 },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceElev, alignItems: 'center', justifyContent: 'center' },
});
