import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { QuickActionCard } from '../components/QuickActionCard';
import { ProfileMenu } from '../components/ProfileMenu';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

interface TripHistoryItem {
  id: string;
  status: string;
  finalFare?: number;
  estimatedFare?: number;
  createdAt: string;
  driverPlateNumber: string | null;
}

function formatTripDate(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' });
  if (isToday) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;
  return `${date.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' })}, ${time}`;
}

export function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const firstName = user?.fullName?.split(' ')[0] ?? 'there';
  const [trips, setTrips] = useState<TripHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch(`${API_BASE_URL}/trips?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => setTrips(Array.isArray(data) ? data.filter((t) => t.status === 'completed') : []))
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.greetingBlock}>
          <Text style={styles.greetingMuted}>Hello, {firstName}</Text>
          <Text style={styles.greeting}>Where are you headed?</Text>
        </View>
        <ProfileMenu navigation={navigation} />
      </View>

      <Pressable onPress={() => navigation.navigate('RequestTrip')}>
        <TextInput
          placeholder="Search destination"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          editable={false}
          pointerEvents="none"
        />
      </Pressable>

      <View style={styles.cardStack}>
        <QuickActionCard
          label="New Trip"
          subtitle="Book a Keke"
          emoji="🛺"
          background={colors.brandYellow}
          textColor={colors.textPrimary}
          onPress={() => navigation.navigate('RequestTrip')}
        />
        <QuickActionCard label="Saved Places" subtitle="Home, Office" emoji="📍" onPress={() => {}} />
        <QuickActionCard label="Wallet" subtitle="Top up balance" emoji="💳" onPress={() => navigation.navigate('Wallet')} />
      </View>

      <Text style={styles.sectionTitle}>Recent rides</Text>
      {loading ? (
        <ActivityIndicator color={colors.brandYellow} />
      ) : trips.length === 0 ? (
        <Text style={styles.emptyText}>No rides yet — your trip history will show up here.</Text>
      ) : (
        trips.map((trip) => (
          <View key={trip.id} style={styles.tripRow}>
            <View style={styles.plateBadge}>
              <Text style={styles.plateText}>{trip.driverPlateNumber ?? '—'}</Text>
            </View>
            <View style={styles.tripDetails}>
              <Text style={styles.tripDate}>{formatTripDate(trip.createdAt)}</Text>
            </View>
            <Text style={styles.tripFare}>₦{trip.finalFare ?? trip.estimatedFare ?? 0}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.black },
  content: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.xl, gap: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  greetingBlock: { flex: 1 },
  greetingMuted: { color: colors.textMuted, fontSize: typography.sizes.body, fontFamily: typography.fontFamily },
  greeting: { color: colors.textOnDark, fontSize: typography.sizes.heading, fontFamily: typography.fontFamilyBold },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.textOnDark,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: typography.fontFamily,
  },
  cardStack: { gap: spacing.md },
  sectionTitle: { color: colors.textOnDark, fontSize: typography.sizes.title, fontFamily: typography.fontFamilySemiBold },
  emptyText: { color: colors.textMuted, fontSize: typography.sizes.body, fontFamily: typography.fontFamily },
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  plateBadge: {
    backgroundColor: colors.brandYellow,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  plateText: { color: colors.textPrimary, fontFamily: typography.fontFamilyBold, fontSize: typography.sizes.caption },
  tripDetails: { flex: 1, gap: 2 },
  tripArea: { color: colors.textOnDark, fontSize: typography.sizes.body, fontFamily: typography.fontFamily },
  tripDate: { color: colors.textMuted, fontSize: typography.sizes.caption, fontFamily: typography.fontFamily },
  tripFare: { color: colors.brandYellow, fontSize: typography.sizes.body, fontFamily: typography.fontFamilyMedium },
});
