import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'primary', style }: Props) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      style={[styles.base, isPrimary ? styles.primary : styles.secondary, style]}
      onPress={onPress}
    >
      <Text style={isPrimary ? styles.primaryLabel : styles.secondaryLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.brandYellow },
  secondary: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  primaryLabel: { color: colors.textPrimary, fontSize: typography.sizes.subtitle, fontWeight: typography.weights.bold },
  secondaryLabel: { color: colors.textOnDark, fontSize: typography.sizes.subtitle, fontWeight: typography.weights.semibold },
});
