import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { io, Socket } from 'socket.io-client';
import MapView, { PROVIDER_GOOGLE } from '../components/Map';
import { ProfileMenu } from '../components/ProfileMenu';
import { colors, radii, spacing, typography } from '../theme';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, authHeaders } from '../config/api';

const ONITSHA_REGION = { latitude: 6.1667, longitude: 6.7833, latitudeDelta: 0.05, longitudeDelta: 0.05 };

export function HomeScreen({ navigation }: any) {
  const { user, token } = useAuth();
  const [online, setOnline] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Disconnect the socket if the driver navigates away while still online —
    // toggling back on re-mount re-establishes it via toggleOnline.
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const goOnline = async () => {
    if (!user) return;
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setOnline(false);
      return;
    }
    const position = await Location.getCurrentPositionAsync({});

    await fetch(`${API_BASE_URL}/dispatch/drivers/online`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ lat: position.coords.latitude, lng: position.coords.longitude }),
    });

    const socket = io(API_BASE_URL, { transports: ['websocket'] });
    socket.on('connect', () => socket.emit('driver:online', { token }));
    socket.on('trip:offer', (offer) => {
      navigation.navigate('TripOffer', { offer });
    });
    socketRef.current = socket;
  };

  const goOffline = async () => {
    if (!user) return;
    await fetch(`${API_BASE_URL}/dispatch/drivers/offline`, {
      method: 'POST',
      headers: authHeaders(token),
    });
    socketRef.current?.disconnect();
    socketRef.current = null;
  };

  const toggleOnline = (value: boolean) => {
    setOnline(value);
    if (value) goOnline();
    else goOffline();
  };

  return (
    <View style={styles.screen}>
      <MapView provider={PROVIDER_GOOGLE} style={styles.map} initialRegion={ONITSHA_REGION} userInterfaceStyle="dark" />
      <ProfileMenu navigation={navigation} />

      <View style={styles.statusBar}>
        <View>
          <Text style={styles.statusLabel}>{online ? "You're online" : "You're offline"}</Text>
          <Text style={styles.statusSubtitle}>{online ? 'Looking for trip requests nearby' : 'Go online to start earning'}</Text>
        </View>
        <Switch
          value={online}
          onValueChange={toggleOnline}
          trackColor={{ true: colors.brandYellow, false: colors.border }}
          thumbColor={colors.textOnDark}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.black },
  map: { flex: 1 },
  statusBar: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: { color: colors.textOnDark, fontSize: typography.sizes.title, fontWeight: typography.weights.semibold },
  statusSubtitle: { color: colors.textMuted, fontSize: typography.sizes.body, marginTop: 2 },
});
