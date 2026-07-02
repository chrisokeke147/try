import React, { useEffect, useState } from 'react';
import { Alert, Image, Linking, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from '../components/Map';
import { colors, radii, spacing, typography } from '../theme';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { API_BASE_URL, authHeaders } from '../config/api';

// Shape returned by POST /trips/:id/accept — driverProfile is the trimmed public
// profile the backend exposes the instant a driver accepts (see backend
// UsersService.toPublicDriverProfile).
interface DriverProfile {
  fullName: string;
  phoneNumber: string;
  profilePhotoUrl: string | null;
  tricyclePlateNumber: string | null;
}

const ONITSHA_REGION = { latitude: 6.1667, longitude: 6.7833, latitudeDelta: 0.05, longitudeDelta: 0.05 };

type TripStatus = 'matched' | 'in_progress' | 'completed' | 'cancelled';

export function DriverMatchedScreen({ navigation, route }: any) {
  const { tripId, driverProfile } = route.params as { tripId: string; driverProfile: DriverProfile | null };
  const { token } = useAuth();
  const socket = useSocket();
  const [status, setStatus] = useState<TripStatus>('matched');
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const onStarted = (payload: { tripId: string }) => {
      if (payload.tripId === tripId) setStatus('in_progress');
    };
    const onCompleted = (payload: { tripId: string }) => {
      if (payload.tripId === tripId) {
        setStatus('completed');
        setShowRating(true);
      }
    };
    const onCancelled = (payload: { tripId: string }) => {
      if (payload.tripId === tripId) {
        setStatus('cancelled');
        Alert.alert('Trip cancelled', undefined, [
          { text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Home' }] }) },
        ]);
      }
    };

    socket.on('trip:started', onStarted);
    socket.on('trip:completed', onCompleted);
    socket.on('trip:cancelled', onCancelled);
    return () => {
      socket.off('trip:started', onStarted);
      socket.off('trip:completed', onCompleted);
      socket.off('trip:cancelled', onCancelled);
    };
  }, [socket, tripId]);

  const cancelTrip = async () => {
    try {
      await fetch(`${API_BASE_URL}/trips/${tripId}/cancel`, { method: 'POST', headers: authHeaders(token) });
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch {
      Alert.alert('Could not cancel trip', 'Please check your connection and try again.');
    }
  };

  const goHome = () => navigation.reset({ index: 0, routes: [{ name: 'Home' }] });

  const skipRating = () => {
    setShowRating(false);
    goHome();
  };

  const submitRating = async () => {
    if (rating === 0) return;
    setSubmittingRating(true);
    try {
      await fetch(`${API_BASE_URL}/trips/${tripId}/rate`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      });
    } catch {
      // A failed rating post shouldn't strand the rider on this screen —
      // they already got their ride, the rating is a nice-to-have.
    } finally {
      setSubmittingRating(false);
      setShowRating(false);
      goHome();
    }
  };

  const statusText =
    status === 'in_progress' ? 'Trip in progress' : status === 'completed' ? 'Trip completed' : 'Your Keke is on the way';

  return (
    <View style={styles.screen}>
      <MapView provider={PROVIDER_GOOGLE} style={styles.map} initialRegion={ONITSHA_REGION} userInterfaceStyle="dark" />

      <View style={styles.card}>
        <Text style={styles.eta}>{statusText}</Text>

        {driverProfile ? (
          <View style={styles.driverRow}>
            {driverProfile.profilePhotoUrl ? (
              <Image source={{ uri: driverProfile.profilePhotoUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar} />
            )}
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{driverProfile.fullName}</Text>
              {driverProfile.tricyclePlateNumber ? (
                <View style={styles.plateBadge}>
                  <Text style={styles.plateText}>{driverProfile.tricyclePlateNumber}</Text>
                </View>
              ) : null}
            </View>
            <Button label="Call" onPress={() => Linking.openURL(`tel:${driverProfile.phoneNumber}`)} style={styles.callButton} />
          </View>
        ) : null}

        {status === 'matched' || status === 'in_progress' ? (
          <Button label="Cancel trip" variant="secondary" onPress={cancelTrip} />
        ) : null}
      </View>

      <Modal visible={showRating} transparent animationType="fade" onRequestClose={skipRating}>
        <View style={styles.ratingOverlay}>
          <View style={styles.ratingCard}>
            <Text style={styles.ratingTitle}>How was your ride?</Text>
            {driverProfile ? <Text style={styles.ratingSubtitle}>Rate {driverProfile.fullName}</Text> : null}

            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable key={n} onPress={() => setRating(n)} hitSlop={8}>
                  <Text style={[styles.star, n <= rating && styles.starFilled]}>★</Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              style={styles.commentInput}
              placeholder="Leave a comment (optional)"
              placeholderTextColor={colors.textMuted}
              value={comment}
              onChangeText={setComment}
              multiline
            />

            <Button
              label={submittingRating ? 'Submitting…' : 'Submit rating'}
              onPress={submitRating}
              style={rating === 0 ? styles.disabledButton : undefined}
            />
            <Button label="Skip" variant="secondary" onPress={skipRating} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.black },
  map: { flex: 1 },
  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  eta: { color: colors.brandYellow, fontSize: typography.sizes.title, fontFamily: typography.fontFamilySemiBold, textAlign: 'center' },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 56, height: 56, borderRadius: radii.pill, backgroundColor: colors.surfaceAlt },
  driverInfo: { flex: 1, gap: spacing.xs },
  driverName: { color: colors.textOnDark, fontSize: typography.sizes.title, fontFamily: typography.fontFamilySemiBold },
  plateBadge: {
    backgroundColor: colors.brandYellow,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  plateText: { color: colors.textPrimary, fontFamily: typography.fontFamilyBold, fontSize: typography.sizes.caption },
  callButton: { paddingHorizontal: spacing.lg },
  ratingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  ratingCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  ratingTitle: {
    color: colors.textOnDark,
    fontSize: typography.sizes.title,
    fontFamily: typography.fontFamilySemiBold,
    textAlign: 'center',
  },
  ratingSubtitle: { color: colors.textMuted, textAlign: 'center' },
  starRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  star: { fontSize: 36, color: colors.border },
  starFilled: { color: colors.brandYellow },
  commentInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textOnDark,
    padding: spacing.md,
    minHeight: 64,
    textAlignVertical: 'top',
  },
  disabledButton: { opacity: 0.5 },
});
