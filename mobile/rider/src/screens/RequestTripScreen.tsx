import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE } from '../components/Map';
import { colors, radii, spacing, typography } from '../theme';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { API_BASE_URL, authHeaders } from '../config/api';

// Default map region centered on Onitsha for the pilot — used until the
// device's real GPS location resolves.
const ONITSHA_REGION = { latitude: 6.1667, longitude: 6.7833, latitudeDelta: 0.05, longitudeDelta: 0.05 };

interface Destination {
  lat: number;
  lng: number;
  label: string;
}

interface FareEstimate {
  distanceKm: number;
  durationMin: number;
  fare: number;
}

export function RequestTripScreen({ navigation, route }: any) {
  const { user, token } = useAuth();
  const socket = useSocket();
  const destination: Destination | undefined = route.params?.destination;

  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'cash'>('wallet');
  const [pickup, setPickup] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [fareEstimate, setFareEstimate] = useState<FareEstimate | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searching, setSearching] = useState(false);

  // Resolve current location once, to use as the pickup point.
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied — using Onitsha city center as pickup.');
        setPickup({ lat: ONITSHA_REGION.latitude, lng: ONITSHA_REGION.longitude });
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      setPickup({ lat: position.coords.latitude, lng: position.coords.longitude });
    })();
  }, []);

  // Once both pickup and destination are known, ask the backend for a real fare.
  useEffect(() => {
    if (!pickup || !destination) return;
    setEstimating(true);
    fetch(`${API_BASE_URL}/trips/fare-estimate`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        dropoffLat: destination.lat,
        dropoffLng: destination.lng,
      }),
    })
      .then((res) => res.json())
      .then(setFareEstimate)
      .catch(() => setFareEstimate(null))
      .finally(() => setEstimating(false));
  }, [pickup, destination]);

  const confirmTrip = async () => {
    if (!pickup || !destination || !fareEstimate || !user) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/trips`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({
          paymentMethod,
          pickupLat: pickup.lat,
          pickupLng: pickup.lng,
          dropoffLat: destination.lat,
          dropoffLng: destination.lng,
          estimatedFare: fareEstimate.fare,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Could not request a trip');

      // Wait for the driver who accepts to push a `trip:matched` event over the
      // socket — see SocketContext (registered once on sign-in) and the backend's
      // DispatchGateway, which TripsService.acceptTrip() calls.
      const tripId = data.trip.id;
      setSearching(true);

      const onMatched = (payload: { tripId: string; driverProfile: unknown }) => {
        if (payload.tripId !== tripId) return;
        socket?.off('trip:matched', onMatched);
        navigation.navigate('DriverMatched', { tripId, driverProfile: payload.driverProfile });
      };
      socket?.on('trip:matched', onMatched);
    } catch {
      setSearching(false);
    } finally {
      setSubmitting(false);
    }
  };

  const mapRegion = pickup
    ? { latitude: pickup.lat, longitude: pickup.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 }
    : ONITSHA_REGION;

  return (
    <View style={styles.screen}>
      <MapView provider={PROVIDER_GOOGLE} style={styles.map} region={mapRegion} userInterfaceStyle="dark">
        {pickup ? <Marker coordinate={{ latitude: pickup.lat, longitude: pickup.lng }} title="Pickup" pinColor={colors.brandYellow} /> : null}
        {destination ? (
          <Marker coordinate={{ latitude: destination.lat, longitude: destination.lng }} title={destination.label} />
        ) : null}
      </MapView>

      <View style={styles.sheet}>
        {searching ? (
          <>
            <ActivityIndicator color={colors.brandYellow} size="large" />
            <Text style={styles.sheetTitle}>Finding you a Keke…</Text>
            <Text style={styles.fareHint}>Hang tight, this won't take long.</Text>
          </>
        ) : !destination ? (
          <Button label="Where to?" onPress={() => navigation.navigate('DestinationSearch')} />
        ) : (
          <>
            <Text style={styles.sheetTitle}>Available rides</Text>
            <Text style={styles.destinationLabel}>📍 {destination.label}</Text>

            {estimating ? (
              <ActivityIndicator color={colors.brandYellow} />
            ) : fareEstimate ? (
              <View style={styles.fareCard}>
                <Text style={styles.fareLabel}>🛺 Standard Keke · {fareEstimate.distanceKm.toFixed(1)}km</Text>
                <Text style={styles.farePrice}>₦{fareEstimate.fare}</Text>
              </View>
            ) : (
              <Text style={styles.fareHint}>Couldn't estimate fare. Check your connection.</Text>
            )}
            {locationError ? <Text style={styles.fareHint}>{locationError}</Text> : null}

            <View style={styles.paymentRow}>
              {(['wallet', 'cash'] as const).map((method) => (
                <Button
                  key={method}
                  label={method === 'wallet' ? 'Wallet' : 'Cash'}
                  variant={paymentMethod === method ? 'primary' : 'secondary'}
                  onPress={() => setPaymentMethod(method)}
                  style={{ flex: 1 }}
                />
              ))}
            </View>

            <Button
              label={submitting ? 'Confirming…' : 'Confirm Keke'}
              onPress={confirmTrip}
              style={!fareEstimate ? styles.disabled : undefined}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.black },
  map: { flex: 1 },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sheetTitle: { color: colors.textOnDark, fontSize: typography.sizes.title, fontFamily: typography.fontFamilySemiBold, textAlign: 'center' },
  destinationLabel: { color: colors.textOnDark, fontSize: typography.sizes.body, fontFamily: typography.fontFamily, textAlign: 'center' },
  fareCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  fareLabel: { color: colors.textOnDark, fontSize: typography.sizes.subtitle, fontFamily: typography.fontFamily, textAlign: 'center' },
  farePrice: { color: colors.brandYellow, fontSize: typography.sizes.h1, fontFamily: typography.fontFamilyMedium, textAlign: 'center' },
  fareHint: { color: colors.textMuted, fontSize: typography.sizes.caption, textAlign: 'center', fontFamily: typography.fontFamily },
  paymentRow: { flexDirection: 'row', gap: spacing.sm },
  disabled: { opacity: 0.4 },
});
