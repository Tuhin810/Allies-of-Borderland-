import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { SolanaProfile, solanaService } from '../services/solana';
import { signInWithGoogle, signOut, subscribeToAuthState } from '../services/firebase';
import { loginOrRegisterUser, fetchUser, updateUser } from '../services/userRegistry';
import { BorderlandProfile, LoginType, ProfileFormInput } from '../types/profile';

interface AuthContextValue {
  firebaseUser: User | null;
  solanaProfile: SolanaProfile | null;
  profile: BorderlandProfile | null;
  loginType: LoginType | null;
  loading: boolean;
  needsProfileSetup: boolean;
  pendingProfileId: string | null;
  loginWithGoogle: () => Promise<{ needsProfile: boolean }>;
  loginWithWallet: () => Promise<{ needsProfile: boolean }>;
  saveProfile: (input: ProfileFormInput) => Promise<void>;
  logout: () => Promise<void>;
}

interface SessionCookiePayload {
  profileId: string;
  loginType: LoginType | null;
  username?: string;
  avatarSeed?: string;
}

const SESSION_COOKIE = 'borderland_auth_session';
const COOKIE_TTL_SECONDS = 60 * 60 * 24 * 7;

const makeCookieName = (id: string) => `${SESSION_COOKIE}_${id}`;

const readSessionCookie = (): SessionCookiePayload | null => {
  if (typeof document === 'undefined') return null;
  const cookiePrefix = `${SESSION_COOKIE}_`;
  const all = document.cookie.split('; ').filter((row) => row.startsWith(cookiePrefix));
  if (all.length === 0) return null;
  const value = all[0].split('=')[1];
  try {
    return JSON.parse(decodeURIComponent(value));
  } catch (err) {
    console.warn('Failed to parse auth session cookie', err);
    return null;
  }
};

const writeSessionCookie = (payload: SessionCookiePayload | null) => {
  if (typeof document === 'undefined') return;
  if (!payload) {
    document.cookie = `${SESSION_COOKIE}=; Max-Age=0; path=/; SameSite=Lax`;
    return;
  }
  const encoded = encodeURIComponent(JSON.stringify(payload));
  const cookieName = makeCookieName(payload.profileId);
  document.cookie = `${cookieName}=${encoded}; Max-Age=${COOKIE_TTL_SECONDS}; path=/; SameSite=Lax`;
};

const buildInvitationLink = (code: string) => {
  if (!code) return '';
  if (typeof window === 'undefined') return `/invite/${code}`;
  return `${window.location.origin}/invite/${code}`;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [solanaProfile, setSolanaProfile] = useState<SolanaProfile | null>(null);
  const [profile, setProfile] = useState<BorderlandProfile | null>(null);
  const [loginType, setLoginType] = useState<LoginType | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [pendingProfileId, setPendingProfileId] = useState<string | null>(null);

  const resetSession = useCallback(() => {
    setProfile(null);
    setNeedsProfileSetup(false);
    setPendingProfileId(null);
    setLoginType(null);
    setSolanaProfile(null);
    //   clearAllSessionCookies();
    writeSessionCookie(null);
  }, []);

  const fetchProfileDocument = useCallback(async (id: string, type: LoginType, username?: string, walletAddress?: string) => {
    // Try to fetch existing user first
    let data = await fetchUser(id);

    // If user doesn't exist, create a new account automatically
    if (!data) {
      const defaultUsername = username || `Citizen_${id.slice(0, 6)}`;
      data = await loginOrRegisterUser(id, defaultUsername, type, walletAddress);
    }

    if (data) {
      setProfile(data);
      setNeedsProfileSetup(false);
      writeSessionCookie({
        profileId: id,
        loginType: type,
        username: data.username,
        avatarSeed: data.avatarSeed,
      });
      return true;
    }

    // Fallback: if auto-registration failed, mark as needing profile setup
    setProfile(null);
    setNeedsProfileSetup(true);
    writeSessionCookie({ profileId: id, loginType: type });
    return false;
  }, []);

  useEffect(() => {
    const cached = readSessionCookie();
    if (cached?.profileId && cached.loginType) {
      setPendingProfileId(cached.profileId);
      setLoginType(cached.loginType);
      setLoading(true);
      fetchProfileDocument(cached.profileId, cached.loginType)
        .catch((err) => console.warn('Failed to hydrate profile from cookie', err))
        .finally(() => setLoading(false));
    }
  }, [fetchProfileDocument]);

  useEffect(() => {
    const unsub = subscribeToAuthState((user) => {
      setFirebaseUser(user);
      if (!user) {
        if (loginType === 'google') {
          resetSession();
        }
        return;
      }
      setLoginType('google');
      setPendingProfileId(user.uid);
      setLoading(true);
      fetchProfileDocument(user.uid, 'google')
        .catch((err) => console.warn('Failed to fetch Google profile', err))
        .finally(() => setLoading(false));
    });
    return () => {
      if (typeof unsub === 'function') {
        unsub();
      }
    };
  }, [fetchProfileDocument, loginType, resetSession]);

  const loginWithGoogle = useCallback(async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      const user = result.user;
      setFirebaseUser(user);
      setLoginType('google');
      setPendingProfileId(user.uid);
      const username = user.displayName || user.email?.split('@')[0] || `User_${user.uid.slice(0, 6)}`;
      const exists = await fetchProfileDocument(user.uid, 'google', username);
      return { needsProfile: !exists };
    } finally {
      setLoading(false);
    }
  }, [fetchProfileDocument]);

  const loginWithWallet = useCallback(async () => {
    setLoading(true);
    try {
      const wallet = await solanaService.connect();
      setSolanaProfile(wallet);
      setLoginType('wallet');
      setPendingProfileId(wallet.address);
      const username = `Cit. ${wallet.shortAddress}`;
      const exists = await fetchProfileDocument(wallet.address, 'wallet', username, wallet.address);
      return { needsProfile: !exists };
    } finally {
      setLoading(false);
    }
  }, [fetchProfileDocument]);

  const saveProfile = useCallback(async (input: ProfileFormInput) => {
    if (!pendingProfileId || !loginType) throw new Error('Missing profile owner');

    const username = input.username.trim();
    const avatarSeed = input.avatarSeed.trim() || pendingProfileId;
    const invitationCode = input.invitationCode.trim() || pendingProfileId.slice(0, 6);
    const invitationLink = buildInvitationLink(invitationCode);

    const updatePayload: Partial<BorderlandProfile> = {
      username,
      avatarSeed,
      invitationCode,
      invitationLink,
      accountStatus: input.accountStatus,
      walletBalance: loginType === 'wallet' ? solanaProfile?.balance ?? 0 : undefined,
      walletMoney: loginType === 'wallet' ? solanaProfile?.balance ?? 0 : undefined,
    };

    await updateUser(pendingProfileId, updatePayload);

    // Fetch the updated profile
    const updatedProfile = await fetchUser(pendingProfileId);
    if (updatedProfile) {
      setProfile(updatedProfile);
      setNeedsProfileSetup(false);
      writeSessionCookie({
        profileId: pendingProfileId,
        loginType,
        username: updatedProfile.username,
        avatarSeed: updatedProfile.avatarSeed,
      });
    }
  }, [firebaseUser?.email, loginType, pendingProfileId, profile?.createdAt, solanaProfile]);

  const logout = useCallback(async () => {
    try {
      if (loginType === 'google') {
        await signOut();
      }
    } finally {
      resetSession();
      setFirebaseUser(null);
    }
  }, [loginType, resetSession]);

  const value = useMemo<AuthContextValue>(() => ({
    firebaseUser,
    solanaProfile,
    profile,
    loginType,
    loading,
    needsProfileSetup,
    pendingProfileId,
    loginWithGoogle,
    loginWithWallet,
    saveProfile,
    logout,
  }), [firebaseUser, solanaProfile, profile, loginType, loading, needsProfileSetup, pendingProfileId, loginWithGoogle, loginWithWallet, saveProfile, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
};
