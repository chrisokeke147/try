import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

interface Props {
  width?: number;
  light?: boolean;
  showTagline?: boolean;
}

// Source: Novapath's official TRY logo artwork. See mobile/rider/src/components/Logo.tsx.
const MARK_ASPECT_RATIO = 1207 / 481;

export function Logo({ width = 160, light = true, showTagline = false }: Props) {
  const source = light ? require('../../assets/logo-mark-white.png') : require('../../assets/logo-mark-black.png');

  return (
    <View style={styles.column}>
      <Image source={source} style={{ width, height: width / MARK_ASPECT_RATIO }} resizeMode="contain" />
      {showTagline ? (
        <Text style={[styles.tagline, { color: light ? colors.textMuted : colors.black }]}>Built for riders. Built for drivers.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  column: { alignItems: 'center' },
  tagline: { fontSize: 12, letterSpacing: 0.5, marginTop: 8, textAlign: 'center' },
});
