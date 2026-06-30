import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, authHeaders } from '../config/api';

const CASH_TRIP_MIN_WALLET_BALANCE = 1000; // Keep in sync with backend WalletService.

interface TripOffer {
  tripId: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  estimatedFare: number;
  paymentMethod: 'cash' | 'wallet';
}

export function TripOfferScreen({ navigation, route }: any) {
  const { user, token } = useAuth();
  const offer = route.params.offer as TripOffer;
  const [balance, setBalance] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch(`${API_BASE_URL}/wallet/me/balance`, { headers: authHeaders(token) })
      .then((res) => res.json())
      .then((data) => setBalance(data.balance))
      .catch(() => setBalance(0));
  }, [user]);

  const canAcceptCash = balance !== null && balance >= CASH_TRIP_MIN_WALLET_BALANCE;
  const blocked = offer.paymentMethod === 'cash' && !canAcceptCash;

  const accept = async () => {
    if (!user || blocked) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/trips/${offer.tripId}/accept`, {
        method: 'POST',
        headers: authHeaders(token),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Could not accept trip');
      navigation.replace('ActiveTrip', { offer });
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>New trip request</Text>

      <View style={styles.routeCard}>
        <Text style={styles.routeText}>📍 Pickup: {offer.pickupLat.toFixed(4)}, {offer.pickupLng.toFixed(4)}</Text>
        <Text style={styles.routeArrow}>↓</Text>
        <Text style={styles.routeText}>🏁 Dropoff: {offer.dropoffLat.toFixed(4)}, {offer.dropoffLng.toFixed(4)}</Text>
      </View>

      <View style={styles.fareRow}>
        <Text style={styles.fareLabel}>{offer.paymentMethod === 'cash' ? 'Cash payment' : 'Wallet payment'}</Text>
        <Text style={styles.farePrice}>₦{offer.estimatedFare}</Text>
      </View>

      {balance === null ? (
        <ActivityIndicator color={colors.brandYellow} />
      ) : blocked ? (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            Wallet balance below ₦{CASH_TRIP_MIN_WALLET_BALANCE}. Top up to accept cash trips.
          </Text>
        </View>
      ) : null}

      {error ? <Text style={styles.warningText}>{error}</Text> : null}

      <Button
        label={submitting ? 'Accepting…' : 'Accept'}
        onPress={accept}
        style={blocked || balance === null ? styles.disabled : undefined}
      />
      <Button label="Decline" variant="secondary" onPress={() => navigation.navigate('Home')} />
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
  warningBox: { backgroundColor: colors.danger, borderRadius: radii.md, padding: spacing.md },
  warningText: { color: colors.textOnDark, fontSize: typography.sizes.body },
  disabled: { opacity: 0.4 },
});
