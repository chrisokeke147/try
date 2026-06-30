import React, { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

interface Props {
  navigation: any;
}

// Tapping the avatar circle opens a small dropdown anchored under it, with the
// signed-in rider's details and a Sign Out action. Positioned with `right` +
// `width` only (no `left`) — combining left/right/width together produced
// conflicting layout constraints that Android resolved differently than web,
// pushing the menu half off-screen.
export function ProfileMenu({ navigation }: Props) {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const firstName = user?.fullName?.split(' ')[0] ?? 'there';
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
      'This permanently deletes your TRY account. This cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            try {
              await fetch(`${API_BASE_URL}/users/${user.id}`, { method: 'DELETE' });
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
    width: 44,
    height: 44,
    flexShrink: 0,
    borderRadius: radii.pill,
    backgroundColor: colors.brandYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: colors.textPrimary, fontSize: typography.sizes.subtitle, fontFamily: typography.fontFamilyBold },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  menu: {
    position: 'absolute',
    top: 60,
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
  menuAvatarInitial: { color: colors.textPrimary, fontSize: typography.sizes.body, fontFamily: typography.fontFamilyBold },
  menuName: { color: colors.textOnDark, fontSize: typography.sizes.body, fontFamily: typography.fontFamilySemiBold },
  menuPhone: { color: colors.textMuted, fontSize: typography.sizes.caption, fontFamily: typography.fontFamily },
  menuItem: { padding: spacing.md },
  menuItemLabel: { color: colors.danger, fontSize: typography.sizes.body, fontFamily: typography.fontFamilyMedium },
});
