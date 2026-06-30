import React, { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, authHeaders } from '../config/api';

interface Props {
  navigation: any;
}

// Positioned with `right` + `width` only (no `left`) — combining left/right/width
// together produces conflicting layout constraints that render differently on
// Android than iOS/web, pushing the menu off-screen. See rider app's same fix.
export function ProfileMenu({ navigation }: Props) {
  const { user, token, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const firstName = user?.fullName?.split(' ')[0] ?? 'Driver';
  const initial = firstName.charAt(0).toUpperCase();

  const handleSignOut = () => {
    setOpen(false);
    signOut();
    navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
  };

  const handleDeleteAccount = () => {
    setOpen(false);
    Alert.alert(
      'Delete account',
      'This permanently deletes your TRY driver account. This cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            try {
              await fetch(`${API_BASE_URL}/users/me`, { method: 'DELETE', headers: authHeaders(token) });
            } finally {
              signOut();
              navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
            }
          },
        },
      ],
    );
  };

  return (
    <>
      <Pressable style={styles.avatar} onPress={() => setOpen(true)}>
        <Text style={styles.avatarInitial}>{initial}</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.menu}>
            <View style={styles.menuHeader}>
              <View style={styles.menuAvatar}>
                <Text style={styles.menuAvatarInitial}>{initial}</Text>
              </View>
              <View style={styles.menuHeaderText}>
                <Text style={styles.menuName}>{user?.fullName ?? 'Guest'}</Text>
                <Text style={styles.menuPhone}>{user?.phoneNumber ?? ''}</Text>
              </View>
            </View>

            <Pressable style={styles.menuItem} onPress={handleSignOut}>
              <Text style={styles.menuItemLabel}>Sign Out</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={handleDeleteAccount}>
              <Text style={styles.menuItemLabel}>Delete Account</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  avatar: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.brandYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: colors.textPrimary, fontSize: typography.sizes.subtitle, fontWeight: typography.weights.bold },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  menu: {
    position: 'absolute',
    top: 100,
    right: 16,
    width: 220,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuHeaderText: { flex: 1 },
  menuAvatar: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.brandYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuAvatarInitial: { color: colors.textPrimary, fontSize: typography.sizes.body, fontWeight: typography.weights.bold },
  menuName: { color: colors.textOnDark, fontSize: typography.sizes.body, fontWeight: typography.weights.semibold },
  menuPhone: { color: colors.textMuted, fontSize: typography.sizes.caption },
  menuItem: { padding: spacing.md },
  menuItemLabel: { color: colors.danger, fontSize: typography.sizes.body, fontWeight: typography.weights.medium },
});
