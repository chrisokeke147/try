import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

interface Props {
  label: string;
  subtitle?: string;
  emoji: string;
  background?: string;
  textColor?: string;
  onPress?: () => void;
}

export function QuickActionCard({
  label,
  subtitle,
  emoji,
  background = colors.surfaceAlt,
  textColor = colors.textOnDark,
  onPress,
}: Props) {
  return (
    <Pressable style={[styles.card, { backgroundColor: background }]} onPress={onPress}>
      <Text style={styles.emoji}>{emoji}</Text>
      <View>
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: textColor }]}>{subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: radii.lg,
    padding: spacing.md,
    minHeight: 110,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emoji: { fontSize: 28, textAlign: 'center' },
  label: { fontSize: typography.sizes.subtitle, fontFamily: typography.fontFamilySemiBold, textAlign: 'center' },
  subtitle: { fontSize: typography.sizes.caption, opacity: 0.8, marginTop: 2, fontFamily: typography.fontFamily, textAlign: 'center' },
});
