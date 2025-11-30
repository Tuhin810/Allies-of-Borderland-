import { FirebaseApp, initializeApp, getApps } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';


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

const resolvedConfig =  HARD_CODED_CONFIG;

const existingApp = getApps()[0];
app = existingApp ?? initializeApp(resolvedConfig);
firestore = getFirestore(app);


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


