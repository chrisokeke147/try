import React from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, radii, spacing, typography } from '../theme';

interface Props {
  label: string;
  uri: string | null;
  onChange: (dataUri: string) => void;
}

// Lets a driver either snap a photo with the camera or pick one from their
// library — used for both the profile photo and the tricycle plate photo
// during KYC registration. Encodes as a base64 data URI so it's a real,
// retrievable image the backend/admin dashboard can render immediately.
// TODO: move to real object storage (S3-compatible) once volume justifies it —
// base64-in-a-text-column is fine for pilot-scale KYC photo counts, not forever.
export function PhotoCapture({ label, uri, onChange }: Props) {
  const pickFrom = async (source: 'camera' | 'library') => {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission needed', `TRY needs ${source} access to capture this photo.`);
      return;
    }

    const options = { quality: 0.5, allowsEditing: true, base64: true } as const;
    const result =
      source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);

    const asset = !result.canceled ? result.assets[0] : null;
    if (asset?.base64) {
      const mime = asset.mimeType ?? 'image/jpeg';
      onChange(`data:${mime};base64,${asset.base64}`);
    }
  };

  const promptSource = () => {
    Alert.alert(label, 'Take a new photo or choose an existing one?', [
      { text: 'Take Photo', onPress: () => pickFrom('camera') },
      { text: 'Choose from Library', onPress: () => pickFrom('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <Pressable style={styles.container} onPress={promptSource}>
      {uri ? (
        <Image source={{ uri }} style={styles.preview} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>📷</Text>
        </View>
      )}
      <Text style={styles.label}>{uri ? `${label} ✓` : label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  preview: { width: 48, height: 48, borderRadius: radii.md },
  placeholder: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: { fontSize: 20 },
  label: { color: colors.textOnDark, fontSize: typography.sizes.body, flex: 1 },
});
