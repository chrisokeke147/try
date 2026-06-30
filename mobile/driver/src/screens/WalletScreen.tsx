import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

interface LedgerEntry {
  id: string;
  type: string;
  amount: number;
  createdAt: string;
}

const LABELS: Record<string, string> = {
  driver_earning_credit: 'Trip earning',
  commission_debit: 'TRY commission',
  driver_withdrawal: 'Withdrawal to bank',
  rider_topup: 'Wallet top-up',
  commission_credit_try: 'Commission',
  trip_fare_debit: 'Trip fare',
};

function formatEntryDate(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const time = date.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' });
  return isToday ? `Today, ${time}` : `${date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}, ${time}`;
}

export function WalletScreen() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE_URL}/wallet/${user.id}/balance`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/wallet/${user.id}/history`).then((r) => r.json()),
    ])
      .then(([balanceData, historyData]) => {
        setBalance(balanceData.balance);
        setEntries(Array.isArray(historyData) ? historyData : []);
      })
      .catch(() => {
        setBalance(0);
        setEntries([]);
      })
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.brandYellow} />}
    >
      <View style={styles.balanceBlock}>
        <Text style={styles.label}>Wallet balance</Text>
        <Text style={styles.balance}>{balance === null ? '—' : `₦${balance.toLocaleString()}`}</Text>
        {/* Withdrawals need Monnify Disbursement keys, which aren't configured yet. */}
        <Button label="Withdraw to bank" onPress={() => {}} style={styles.disabled} />
        <Text style={styles.hint}>Withdrawals open up once bank payouts are connected.</Text>
      </View>

      <Text style={styles.sectionTitle}>Recent activity</Text>
      {loading && entries.length === 0 ? (
        <ActivityIndicator color={colors.brandYellow} />
      ) : entries.length === 0 ? (
        <Text style={styles.hint}>No wallet activity yet.</Text>
      ) : (
        entries.map((entry) => (
          <View key={entry.id} style={styles.entryRow}>
            <View style={styles.entryDetails}>
              <Text style={styles.entryLabel}>{LABELS[entry.type] ?? entry.type}</Text>
              <Text style={styles.entryDate}>{formatEntryDate(entry.createdAt)}</Text>
            </View>
            <Text style={[styles.entryAmount, entry.amount < 0 ? styles.negative : styles.positive]}>
              {entry.amount < 0 ? '-' : '+'}₦{Math.abs(entry.amount).toLocaleString()}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.black },
  content: { flexGrow: 1, padding: spacing.lg, gap: spacing.lg },
  balanceBlock: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  label: { color: colors.textMuted, fontSize: typography.sizes.body, textAlign: 'center' },
  balance: { color: colors.brandYellow, fontSize: typography.sizes.h1 ?? 32, fontWeight: typography.weights.bold, textAlign: 'center' },
  hint: { color: colors.textMuted, fontSize: typography.sizes.caption, textAlign: 'center' },
  disabled: { opacity: 0.4 },
  sectionTitle: { color: colors.textOnDark, fontSize: typography.sizes.title, fontWeight: typography.weights.semibold },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  entryDetails: { flex: 1, gap: 2 },
  entryLabel: { color: colors.textOnDark, fontSize: typography.sizes.body },
  entryDate: { color: colors.textMuted, fontSize: typography.sizes.caption },
  entryAmount: { fontSize: typography.sizes.body, fontWeight: typography.weights.semibold },
  positive: { color: colors.success },
  negative: { color: colors.danger },
});
