// Web-preview fallback — react-native-maps has no web target and breaks the
// Metro web bundle if imported directly. This stands in only for `expo start --web`;
// real builds (iOS/Android via EAS) use Map.tsx and render an actual Google Map.
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, typography } from '../theme';

interface Props {
  style?: ViewStyle;
  children?: React.ReactNode;
  [key: string]: unknown;
}

export default function MapView({ style }: Props) {
  return (
    <View style={[styles.placeholder, style]}>
      <Text style={styles.label}>🗺️ Map preview unavailable on web</Text>
      <Text style={styles.hint}>Run via Expo Go on a device to see the live Google Map</Text>
    </View>
  );
}

// No-op on web — markers are only meaningful inside the native MapView.
export function Marker(_props: { coordinate: { latitude: number; longitude: number }; title?: string; pinColor?: string }) {
  return null;
}

export const PROVIDER_GOOGLE = 'google';

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: { color: colors.textOnDark, fontSize: typography.sizes.subtitle },
  hint: { color: colors.textMuted, fontSize: typography.sizes.caption },
});
