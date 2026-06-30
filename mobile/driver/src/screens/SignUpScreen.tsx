import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Location from 'expo-location';
import { colors, radii, spacing, typography } from '../theme';
import { Button } from '../components/Button';
import { PhotoCapture } from '../components/PhotoCapture';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, API_HEADERS } from '../config/api';

type LocationStatus = 'detecting' | 'resolved' | 'denied' | 'error';

export function SignUpScreen({ navigation }: any) {
  const { requestOtp, loading, error } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [tricyclePlateNumber, setTricyclePlateNumber] = useState('');
  const [driverLicenseNumber, setDriverLicenseNumber] = useState('');
  const [nin, setNin] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [platePhoto, setPlatePhoto] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // City is detected from the phone's actual GPS location, not self-reported —
  // a driver can't claim to operate in a city they aren't physically in.
  const [city, setCity] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('detecting');

  const detectCity = async () => {
    setLocationStatus('detecting');
    setCity(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus('denied');
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      const res = await fetch(
        `${API_BASE_URL}/places/reverse-geocode?lat=${position.coords.latitude}&lng=${position.coords.longitude}`,
        { headers: API_HEADERS },
      );
      if (!res.ok) throw new Error('Reverse geocode failed');
      const data = await res.json();
      setCity(data.city);
      setLocationStatus('resolved');
    } catch {
      setLocationStatus('error');
    }
  };

  useEffect(() => {
    detectCity();
  }, []);

  const submit = async () => {
    if (!fullName.trim() || !phoneNumber.trim() || !tricyclePlateNumber.trim() || !driverLicenseNumber.trim() || !nin.trim()) {
      setFormError('Please fill in every field.');
      return;
    }
    if (nin.trim().length !== 11) {
      setFormError('NIN must be 11 digits.');
      return;
    }
    if (!city) {
      setFormError('Your location must be verified before registering — check location permission and try again.');
      return;
    }
    if (!profilePhoto || !platePhoto) {
      setFormError('Please capture both your profile photo and your tricycle plate photo.');
      return;
    }
    setFormError(null);
    const signUpInput = {
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      tricyclePlateNumber: tricyclePlateNumber.trim(),
      driverLicenseNumber: driverLicenseNumber.trim(),
      nin: nin.trim(),
      city,
      profilePhotoUrl: profilePhoto,
      tricyclePlatePhotoUrl: platePhoto,
    };
    try {
      await requestOtp(signUpInput.phoneNumber, 'driver_signup');
      navigation.navigate('OtpVerification', { phoneNumber: signUpInput.phoneNumber, purpose: 'driver_signup', signUpInput });
    } catch {
      // error surfaced via auth context state below
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Register as a driver</Text>
          <Text style={styles.subtitle}>Your account will be reviewed before you can go online.</Text>
        </View>

        <View style={styles.form}>
          <TextInput placeholder="Full name" placeholderTextColor={colors.textMuted} style={styles.input} value={fullName} onChangeText={setFullName} />
          <TextInput
            placeholder="Phone number"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
          <TextInput
            placeholder="National Identification Number (NIN)"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={nin}
            onChangeText={setNin}
            keyboardType="number-pad"
            maxLength={11}
          />

          <View style={styles.locationCard}>
            {locationStatus === 'detecting' ? (
              <>
                <ActivityIndicator color={colors.brandYellow} />
                <Text style={styles.locationLabel}>Detecting your location…</Text>
              </>
            ) : locationStatus === 'resolved' ? (
              <Text style={styles.locationLabel}>📍 Operating city: {city}</Text>
            ) : locationStatus === 'denied' ? (
              <>
                <Text style={styles.locationLabel}>Location permission denied. We need this to verify your operating city.</Text>
                <Button label="Grant location access" variant="secondary" onPress={detectCity} />
              </>
            ) : (
              <>
                <Text style={styles.locationLabel}>Couldn't detect your location.</Text>
                <Button label="Retry" variant="secondary" onPress={detectCity} />
              </>
            )}
          </View>

          <TextInput
            placeholder="Tricycle plate number"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={tricyclePlateNumber}
            onChangeText={setTricyclePlateNumber}
            autoCapitalize="characters"
          />
          <TextInput
            placeholder="Driver's license number"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={driverLicenseNumber}
            onChangeText={setDriverLicenseNumber}
            autoCapitalize="characters"
          />

          <PhotoCapture label="Profile photo" uri={profilePhoto} onChange={setProfilePhoto} />
          <PhotoCapture label="Tricycle plate photo" uri={platePhoto} onChange={setPlatePhoto} />

          {(formError || error) ? <Text style={styles.errorText}>{formError ?? error}</Text> : null}
        </View>

        <View style={styles.actions}>
          <Button label={loading ? 'Sending code…' : 'Submit for review'} onPress={submit} />
          <Button label="Already registered? Sign In" variant="secondary" onPress={() => navigation.navigate('SignIn')} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.black },
  content: { flexGrow: 1, padding: spacing.lg, justifyContent: 'space-between', gap: spacing.lg },
  header: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
  title: { color: colors.textOnDark, fontSize: typography.sizes.heading, fontWeight: typography.weights.bold, textAlign: 'center' },
  subtitle: { color: colors.textMuted, fontSize: typography.sizes.body, textAlign: 'center' },
  form: { gap: spacing.md },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.textOnDark,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorText: { color: colors.danger, fontSize: typography.sizes.caption, textAlign: 'center' },
  actions: { gap: spacing.md },
  locationCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
  },
  locationLabel: { color: colors.textOnDark, fontSize: typography.sizes.body, textAlign: 'center' },
});
