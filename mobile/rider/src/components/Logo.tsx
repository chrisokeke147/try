import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

interface Props {
  width?: number;
  light?: boolean; // true = white wordmark for dark backgrounds, false = black for light
  showTagline?: boolean;
}

// Source: Novapath's official TRY logo artwork (TR + stylized yellow Y swoosh/dot).
// Rendered as an image rather than text — the diagonal Y swoosh can't be
// reproduced with text/view primitives.
const MARK_ASPECT_RATIO = 1207 / 481;

export function Logo({ width = 160, light = true, showTagline = false }: Props) {
  const source = light
    ? require('../../assets/logo-mark-white.png')
    : require('../../assets/logo-mark-black.png');

  return (
    <View style={styles.column}>
      <Image source={source} style={{ width, height: width / MARK_ASPECT_RATIO }} resizeMode="contain" />
      {showTagline ? (
        <Text style={[styles.tagline, { color: light ? colors.textMuted : colors.black }]}>
          MOVE SMARTER, EVERY DAY.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  column: { alignItems: 'center' },
  tagline: { fontFamily: 'Poppins_500Medium', fontSize: 12, letterSpacing: 0.5, marginTop: 8, textAlign: 'center' },
});
