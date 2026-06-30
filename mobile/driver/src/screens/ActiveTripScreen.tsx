import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { Button } from '../components/Button';
import { API_BASE_URL, API_HEADERS } from '../config/api';

interface TripOffer {
  tripId: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  estimatedFare: number;
  paymentMethod: 'cash' | 'wallet';
}

type TripPhase = 'enroute' | 'in_progress';

export function ActiveTripScreen({ navigation, route }: any) {
  const { offer } = route.params as { offer: TripOffer };
  const [phase, setPhase] = useState<TripPhase>('enroute');
  const [submitting, setSubmitting] = useState(false);

  const startTrip = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/trips/${offer.tripId}/start`, { method: 'POST', headers: API_HEADERS });
      if (!res.ok) throw new Error('Could not start trip');
      setPhase('in_progress');
    } catch {
      Alert.alert('Could not start trip', 'Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const completeTrip = async () => {
    setSubmitting(true);
    try {
      // TODO: let the driver adjust the fare for detours/waiting time instead of
      // always settling at the original estimate.
      const res = await fetch(`${API_BASE_URL}/trips/${offer.tripId}/complete`, {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify({ finalFare: offer.estimatedFare }),
      });
      if (!res.ok) throw new Error('Could not complete trip');
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch {
      Alert.alert('Could not complete trip', 'Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelTrip = async () => {
    try {
      await fetch(`${API_BASE_URL}/trips/${offer.tripId}/cancel`, { method: 'POST', headers: API_HEADERS });
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch {
      Alert.alert('Could not cancel trip', 'Please check your connection and try again.');
    }
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>{phase === 'enroute' ? 'Heading to pickup' : 'Trip in progress'}</Text>

      <View style={styles.routeCard}>
        <Text style={styles.routeText}>📍 Pickup: {offer.pickupLat.toFixed(4)}, {offer.pickupLng.toFixed(4)}</Text>
        <Text style={styles.routeArrow}>↓</Text>
        <Text style={styles.routeText}>🏁 Dropoff: {offer.dropoffLat.toFixed(4)}, {offer.dropoffLng.toFixed(4)}</Text>
      </View>

      <View style={styles.fareRow}>
        <Text style={styles.fareLabel}>{offer.paymentMethod === 'cash' ? 'Cash payment' : 'Wallet payment'}</Text>
        <Text style={styles.farePrice}>₦{offer.estimatedFare}</Text>
      </View>

      {phase === 'enroute' ? (
        <Button label={submitting ? 'Starting…' : 'Start trip'} onPress={startTrip} />
      ) : (
        <Button label={submitting ? 'Completing…' : 'Complete trip'} onPress={completeTrip} />
      )}
      <Button label="Cancel trip" variant="secondary" onPress={cancelTrip} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.black, padding: spacing.lg, gap: spacing.md, justifyContent: 'center' },
  title: { color: colors.textOnDark, fontSize: typography.sizes.heading, fontWeight: typography.weights.bold },
  routeCard: { backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.md, gap: spacing.xs },
  routeText: { color: colors.textOnDark, fontSize: typography.sizes.subtitle },
  routeArrow: { color: colors.textMuted, fontSize: typography.sizes.body },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  fareLabel: { color: colors.textMuted, fontSize: typography.sizes.body },
  farePrice: { color: colors.brandYellow, fontSize: typography.sizes.title, fontWeight: typography.weights.bold },
});
