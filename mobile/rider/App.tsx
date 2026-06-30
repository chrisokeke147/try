import 'react-native-gesture-handler';
import React, { useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { View } from 'react-native';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { SignInScreen } from './src/screens/SignInScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { OtpVerificationScreen } from './src/screens/OtpVerificationScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { RequestTripScreen } from './src/screens/RequestTripScreen';
import { DestinationSearchScreen } from './src/screens/DestinationSearchScreen';
import { DriverMatchedScreen } from './src/screens/DriverMatchedScreen';
import { WalletScreen } from './src/screens/WalletScreen';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SocketProvider } from './src/context/SocketContext';
import { colors } from './src/theme';

SplashScreen.preventAutoHideAsync();

export type RiderStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
  OtpVerification: { phoneNumber: string; purpose: 'rider_signup' | 'rider_signin'; fullName?: string };
  Home: undefined;
  RequestTrip: { destination?: { lat: number; lng: number; label: string } } | undefined;
  DestinationSearch: undefined;
  DriverMatched: { tripId: string; driverProfile: any };
  Wallet: undefined;
};

const Stack = createNativeStackNavigator<RiderStackParamList>();

function RootNavigator() {
  const { initializing, user } = useAuth();

  // Hold the splash screen until we know whether a session is already
  // persisted on this device — avoids a flash of the Welcome screen for a
  // returning, already-signed-in user.
  if (initializing) return null;

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
        <Stack.Screen name="RequestTrip" component={RequestTripScreen} options={{ title: 'Request a ride' }} />
        <Stack.Screen name="DestinationSearch" component={DestinationSearchScreen} options={{ title: 'Where to?' }} />
        <Stack.Screen name="DriverMatched" component={DriverMatchedScreen} options={{ title: 'Your ride' }} />
        <Stack.Screen name="Wallet" component={WalletScreen} options={{ title: 'Wallet' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <SocketProvider>
        <View style={{ flex: 1, backgroundColor: colors.black }} onLayout={onLayoutRootView}>
          <RootNavigator />
        </View>
      </SocketProvider>
    </AuthProvider>
  );
}
