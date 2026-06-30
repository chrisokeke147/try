import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { Button } from '../components/Button';
import { useAuth, DriverSignUpInput } from '../context/AuthContext';

const RESEND_COOLDOWN_SECONDS = 60;

interface Params {
  phoneNumber: string;
  purpose: 'driver_signup' | 'driver_signin';
  signUpInput?: DriverSignUpInput; // only present for signup
}

export function OtpVerificationScreen({ navigation, route }: any) {
  const { phoneNumber, purpose, signUpInput } = route.params as Params;
  const { requestOtp, verifyAndSignUp, verifyAndSignIn, loading, error } = useAuth();
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const resend = async () => {
    if (cooldown > 0) return;
    try {
      await requestOtp(phoneNumber, purpose);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {
      // error surfaced via auth context state below
    }
  };

  const verify = async () => {
    if (code.trim().length !== 6) return;
    try {
      if (purpose === 'driver_signup' && signUpInput) {
        await verifyAndSignUp(signUpInput, code.trim());
      } else {
        await verifyAndSignIn(phoneNumber, code.trim());
      }
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch {
      // error surfaced via auth context state below
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Enter the code</Text>
        <Text style={styles.subtitle}>We sent a 6-digit code to {phoneNumber}</Text>
      </View>

      <TextInput
        placeholder="000000"
        placeholderTextColor={colors.textMuted}
        style={styles.codeInput}
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Button label={loading ? 'Verifying…' : 'Verify'} onPress={verify} />
      <Button
        label={cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
        variant="secondary"
        onPress={resend}
        style={cooldown > 0 ? styles.disabled : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.black, padding: spacing.lg, justifyContent: 'center', gap: spacing.lg },
  header: { alignItems: 'center', gap: spacing.sm },
  title: { color: colors.textOnDark, fontSize: typography.sizes.heading, fontWeight: typography.weights.bold, textAlign: 'center' },
  subtitle: { color: colors.textMuted, fontSize: typography.sizes.body, textAlign: 'center' },
  codeInput: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    color: colors.textOnDark,
    borderWidth: 1,
    borderColor: colors.border,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.h1,
    textAlign: 'center',
    letterSpacing: 8,
  },
  errorText: { color: colors.danger, fontSize: typography.sizes.caption, textAlign: 'center' },
  disabled: { opacity: 0.5 },
});
