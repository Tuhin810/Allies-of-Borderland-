import { FirebaseApp, FirebaseError, initializeApp, getApps } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged as firebaseOnAuthStateChanged, User, Auth } from 'firebase/auth';


const HARD_CODED_CONFIG = {
  apiKey: 'AIzaSyBblnw7n6iGLBEq88A41bmj6hj2bRVA9Xk',
  authDomain: 'raze-e0182.firebaseapp.com',
  projectId: 'raze-e0182',
  storageBucket: 'raze-e0182.firebasestorage.app',
  messagingSenderId: '28918634771',
  appId: '1:28918634771:web:0d3a16afabfe81e89122e6',
  measurementId: 'G-CWEKBBJ3LW'
};

let app: FirebaseApp | null = null;
let firestore: Firestore | null = null;
let analytics: Analytics | null = null;
let auth: Auth | null = null;

const resolvedConfig =  HARD_CODED_CONFIG;

const existingApp = getApps()[0];
app = existingApp ?? initializeApp(resolvedConfig);
firestore = getFirestore(app);
auth = getAuth(app);


if (typeof window !== 'undefined' && app) {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app!);
      }
    })
    .catch(() => {});
}

export const firebaseApp = app;
export const db = firestore;
export const firebaseEnabled = Boolean(app && firestore);
export const firebaseAnalytics = analytics;
export const firebaseAuth = auth;

export const signInWithGoogle = async () => {
  if (!auth) throw new Error('Firebase not initialized');
  const provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  try {
    return await signInWithPopup(auth, provider);
  } catch (error) {
    const firebaseError = error as FirebaseError;
    if (firebaseError.code === 'auth/configuration-not-found') {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'unknown origin';
      console.warn(
        `Firebase auth origin not allowed: ${origin}. Add it under Authentication > Settings > Authorized domains in the Firebase console and ensure Google provider is enabled.`,
      );
    }
    throw error;
  }
};

export const signOut = async () => {
  if (!auth) return;
  return await firebaseSignOut(auth);
};

export const subscribeToAuthState = (cb: (user: User | null) => void) => {
  if (!auth) return () => {};
  return firebaseOnAuthStateChanged(auth, cb);
};


