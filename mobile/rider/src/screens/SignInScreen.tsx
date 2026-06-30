import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';

export function SignInScreen({ navigation }: any) {
  const { requestOtp, loading, error } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');

  const submit = async () => {
    if (!phoneNumber.trim()) return;
    try {
      await requestOtp(phoneNumber.trim(), 'rider_signin');
      navigation.navigate('OtpVerification', { phoneNumber: phoneNumber.trim(), purpose: 'rider_signin' });
    } catch {
      // error is surfaced via auth context state below
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in with the phone number on your account.</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          placeholder="Phone number"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          returnKeyType="done"
          onSubmitEditing={submit}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <View style={styles.actions}>
        <Button label={loading ? 'Sending code…' : 'Sign In'} onPress={submit} />
        <Button label="New to TRY? Sign Up" variant="secondary" onPress={() => navigation.navigate('SignUp')} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.black, padding: spacing.lg, justifyContent: 'space-between' },
  header: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl },
  title: { color: colors.textOnDark, fontSize: typography.sizes.heading, fontFamily: typography.fontFamilyBold, textAlign: 'center' },
  subtitle: { color: colors.textMuted, fontSize: typography.sizes.body, textAlign: 'center', fontFamily: typography.fontFamily },
  form: { gap: spacing.md },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.textOnDark,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.body,
    textAlign: 'center',
  },
  errorText: { color: colors.danger, fontSize: typography.sizes.caption, textAlign: 'center' },
  actions: { gap: spacing.md, paddingBottom: spacing.lg },
});
