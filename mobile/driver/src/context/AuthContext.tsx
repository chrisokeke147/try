import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_HEADERS } from '../config/api';

export interface DriverUser {
  id: string;
  fullName: string;
  phoneNumber: string;
  tricyclePlateNumber?: string;
  kycStatus?: string;
  accessToken: string;
}

type OtpPurpose = 'driver_signup' | 'driver_signin';

export interface DriverSignUpInput {
  fullName: string;
  phoneNumber: string;
  tricyclePlateNumber: string;
  tricyclePlatePhotoUrl: string;
  driverLicenseNumber: string;
  nin: string;
  city: string;
  profilePhotoUrl: string;
}

const SESSION_KEY = 'try_driver_session';

interface AuthContextValue {
  user: DriverUser | null;
  token: string | null;
  initializing: boolean;
  loading: boolean;
  error: string | null;
  requestOtp: (phoneNumber: string, purpose: OtpPurpose) => Promise<void>;
  verifyAndSignUp: (input: DriverSignUpInput, code: string) => Promise<void>;
  verifyAndSignIn: (phoneNumber: string, code: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function postJson(path: string, body: unknown) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: API_HEADERS,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Request failed');
  return data;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DriverUser | null>(null);
  // True until the persisted session has been read from disk, so the
  // navigator doesn't briefly flash the Welcome screen before redirecting
  // a returning, already-signed-in driver straight to Home.
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY)
      .then((raw) => {
        if (raw) setUser(JSON.parse(raw));
      })
      .catch(() => {})
      .finally(() => setInitializing(false));
  }, []);

  const persistUser = async (account: DriverUser) => {
    setUser(account);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(account));
  };

  const requestOtp = async (phoneNumber: string, purpose: OtpPurpose) => {
    setLoading(true);
    setError(null);
    try {
      await postJson('/auth/otp/request', { phoneNumber, purpose });
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const verifyAndSignUp = async (input: DriverSignUpInput, code: string) => {
    setLoading(true);
    setError(null);
    try {
      const { verificationToken } = await postJson('/auth/otp/verify', {
        phoneNumber: input.phoneNumber,
        code,
        purpose: 'driver_signup',
      });
      const account = await postJson('/auth/drivers/signup', { ...input, verificationToken });
      await persistUser(account);
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const verifyAndSignIn = async (phoneNumber: string, code: string) => {
    setLoading(true);
    setError(null);
    try {
      const { verificationToken } = await postJson('/auth/otp/verify', { phoneNumber, code, purpose: 'driver_signin' });
      const account = await postJson('/auth/drivers/signin', { phoneNumber, verificationToken });
      await persistUser(account);
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    setUser(null);
    AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
  };

  const value = useMemo(
    () => ({ user, token: user?.accessToken ?? null, initializing, loading, error, requestOtp, verifyAndSignUp, verifyAndSignIn, signOut }),
    [user, initializing, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
