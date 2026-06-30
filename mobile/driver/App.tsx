import 'react-native-gesture-handler';
import React from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { SignInScreen } from './src/screens/SignInScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { OtpVerificationScreen } from './src/screens/OtpVerificationScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { TripOfferScreen } from './src/screens/TripOfferScreen';
import { ActiveTripScreen } from './src/screens/ActiveTripScreen';
import { WalletScreen } from './src/screens/WalletScreen';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { colors } from './src/theme';

export type DriverStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
  OtpVerification: {
    phoneNumber: string;
    purpose: 'driver_signup' | 'driver_signin';
    signUpInput?: import('./src/context/AuthContext').DriverSignUpInput;
  };
  Home: undefined;
  TripOffer: { offer: TripOfferPayload };
  ActiveTrip: { offer: TripOfferPayload };
  Wallet: undefined;
};

export interface TripOfferPayload {
  tripId: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  estimatedFare: number;
  paymentMethod: 'cash' | 'wallet';
}

const Stack = createNativeStackNavigator<DriverStackParamList>();

function RootNavigator() {
  const { initializing, user } = useAuth();

  // Avoids a flash of the Welcome screen for a returning, already-signed-in
  // driver while the persisted session is read from disk.
  if (initializing) return <View style={{ flex: 1, backgroundColor: colors.black }} />;

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName={user ? 'Home' : 'Welcome'}
        screenOptions={{
          headerStyle: { backgroundColor: colors.black },
          headerTintColor: colors.textOnDark,
          contentStyle: { backgroundColor: colors.black },
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SignIn" component={SignInScreen} options={{ title: '' }} />
        <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: '' }} />
        <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} options={{ title: '' }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="TripOffer" component={TripOfferScreen} options={{ title: 'Trip offer' }} />
        <Stack.Screen name="ActiveTrip" component={ActiveTripScreen} options={{ title: 'Active trip', headerLeft: () => null }} />
        <Stack.Screen name="Wallet" component={WalletScreen} options={{ title: 'Wallet' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
