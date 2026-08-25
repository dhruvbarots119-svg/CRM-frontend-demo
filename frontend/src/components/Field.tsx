// Text input field with label — used across forms.
import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { colors, fontSize, radius, spacing } from '@/src/theme';

export const Field: React.FC<
  {
    label: string;
    hint?: string;
    style?: ViewStyle;
  } & TextInputProps
> = ({ label, hint, style, ...rest }) => (
  <View style={[styles.wrap, style]}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      {...rest}
      placeholderTextColor={colors.textSubtle}
      style={[styles.input, rest.multiline && { minHeight: 96, paddingTop: 12, textAlignVertical: 'top' }]}
    />
    {hint ? <Text style={styles.hint}>{hint}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '700', letterSpacing: 0.4, marginBottom: 6 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.base,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  hint: { fontSize: fontSize.xs, color: colors.textSubtle, marginTop: 4 },
});
