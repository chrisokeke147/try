import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

export function WalletScreen() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch(`${API_BASE_URL}/wallet/${user.id}/balance`)
      .then((res) => res.json())
      .then((data) => setBalance(data.balance))
      .catch(() => setBalance(0));
  }, [user]);

  return (
    <View style={styles.screen}>
      <View style={styles.balanceBlock}>
        <Text style={styles.label}>Wallet balance</Text>
        {balance === null ? (
          <ActivityIndicator color={colors.brandYellow} />
        ) : (
          <Text style={styles.balance}>₦{balance.toLocaleString()}</Text>
        )}
      </View>

      <View style={styles.actions}>
        {/* Top-ups need Monnify Collections keys, which aren't configured yet. */}
        <Button label="Top up wallet" onPress={() => {}} style={styles.disabled} />
        <Text style={styles.hint}>Top-ups open up once card/bank payments are connected.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.black, padding: spacing.lg, justifyContent: 'space-between' },
  balanceBlock: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  label: { color: colors.textMuted, fontSize: typography.sizes.subtitle, fontFamily: typography.fontFamily, textAlign: 'center' },
  balance: { color: colors.brandYellow, fontSize: typography.sizes.h1, fontFamily: typography.fontFamilyMedium, textAlign: 'center' },
  actions: { gap: spacing.md, paddingBottom: spacing.lg },
  disabled: { opacity: 0.4 },
  hint: { color: colors.textMuted, fontSize: typography.sizes.caption, textAlign: 'center', fontFamily: typography.fontFamily },
});
