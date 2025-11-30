import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, firebaseEnabled } from './firebase';
import { BorderlandProfile } from '../types/profile';

const COLLECTION = 'users';

const userDoc = (id: string) => (db ? doc(db, COLLECTION, id) : null);

export const fetchUserProfile = async (profileId: string): Promise<BorderlandProfile | null> => {
  if (!firebaseEnabled) return null;
  const ref = userDoc(profileId);
  if (!ref) return null;
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as BorderlandProfile;
};

export const saveUserProfile = async (profile: BorderlandProfile) => {
  if (!firebaseEnabled) return;
  const ref = userDoc(profile.id);
  if (!ref) return;
  await setDoc(ref, profile, { merge: true });
};
