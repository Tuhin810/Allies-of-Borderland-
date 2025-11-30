import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  serverTimestamp, 
  setDoc, 
  updateDoc, 
  where 
} from 'firebase/firestore';
import { db, firebaseEnabled } from './firebase';
import { BorderlandProfile, LoginType } from '../types/profile';

const COLLECTION = 'users';

const noop = () => {};

const userDoc = (userId: string) => (db ? doc(db, COLLECTION, userId) : null);

/**
 * Generate a random invitation code
 */
const generateInvitationCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Generate a random avatar seed
 */
const generateAvatarSeed = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

/**
 * Register a new user in the database
 */
export const registerUser = async (
  userId: string,
  username: string,
  loginType: LoginType,
  walletAddress?: string
): Promise<BorderlandProfile | null> => {
  if (!firebaseEnabled || !db) return null;
  
  const target = userDoc(userId);
  if (!target) return null;

  const invitationCode = generateInvitationCode();
  const avatarSeed = generateAvatarSeed();
  
  // Build the user object
  const newUser: BorderlandProfile = {
    id: userId,
    username,
    avatarSeed,
    invitationCode,
    invitationLink: `${window.location.origin}/invite/${invitationCode}`,
    accountStatus: 'active',
    loginType,
    loginTag: loginType,
    createdAt: Date.now(),
    updatedAt: Date.now()
  } as BorderlandProfile;

  // Only add wallet-specific fields if wallet login
  if (loginType === 'wallet' && walletAddress) {
    newUser.walletAddress = walletAddress;
    newUser.accountAddress = walletAddress;
    newUser.walletBalance = 0;
    newUser.walletMoney = 0;
  }

  try {
    // Clean undefined values before saving to Firestore
    const cleanData = Object.fromEntries(
      Object.entries(newUser).filter(([, value]) => value !== undefined)
    );

    await setDoc(target, {
      ...cleanData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return newUser;
  } catch (error) {
    console.error('Failed to register user:', error);
    return null;
  }
};

/**
 * Fetch user profile by ID
 */
export const fetchUser = async (userId: string): Promise<BorderlandProfile | null> => {
  if (!firebaseEnabled || !db) return null;
  
  const target = userDoc(userId);
  if (!target) return null;

  try {
    const snapshot = await getDoc(target);
    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();
    const normalizeTimestamp = (value: any) =>
      value && typeof value.toDate === 'function' ? value.toDate().getTime() : value;

    return {
      ...data,
      createdAt: normalizeTimestamp(data.createdAt),
      updatedAt: normalizeTimestamp(data.updatedAt)
    } as BorderlandProfile;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return null;
  }
};

/**
 * Fetch user by wallet address
 */
export const fetchUserByWallet = async (walletAddress: string): Promise<BorderlandProfile | null> => {
  if (!firebaseEnabled || !db) return null;

  try {
    const usersRef = collection(db, COLLECTION);
    const q = query(usersRef, where('walletAddress', '==', walletAddress));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    const normalizeTimestamp = (value: any) =>
      value && typeof value.toDate === 'function' ? value.toDate().getTime() : value;

    return {
      ...data,
      id: doc.id,
      createdAt: normalizeTimestamp(data.createdAt),
      updatedAt: normalizeTimestamp(data.updatedAt)
    } as BorderlandProfile;
  } catch (error) {
    console.error('Failed to fetch user by wallet:', error);
    return null;
  }
};

/**
 * Update user profile
 */
export const updateUser = async (
  userId: string, 
  data: Partial<Omit<BorderlandProfile, 'id' | 'createdAt'>>
): Promise<void> => {
  if (!firebaseEnabled || !db) return;
  
  const target = userDoc(userId);
  if (!target) return;

  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  );

  try {
    await updateDoc(target, {
      ...cleanData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Failed to update user:', error);
  }
};

/**
 * Login or register user - main entry point for authentication
 * If user exists, returns the user profile (login)
 * If user doesn't exist, creates a new account and returns the profile (register)
 */
export const loginOrRegisterUser = async (
  userId: string,
  username: string,
  loginType: LoginType,
  walletAddress?: string
): Promise<BorderlandProfile | null> => {
  if (!firebaseEnabled || !db) return null;

  // First, try to fetch the existing user
  let user = await fetchUser(userId);

  if (user) {
    // User exists - this is a login
    console.log('User found, logging in:', userId);
    
    // Update last login time
    await updateUser(userId, { updatedAt: Date.now() });
    
    return user;
  }

  // If looking up by wallet, check if wallet already exists
  if (walletAddress) {
    user = await fetchUserByWallet(walletAddress);
    if (user) {
      console.log('User found by wallet, logging in:', walletAddress);
      await updateUser(user.id, { updatedAt: Date.now() });
      return user;
    }
  }

  // User doesn't exist - create a new account
  console.log('User not found, creating new account:', userId);
  user = await registerUser(userId, username, loginType, walletAddress);

  return user;
};

/**
 * Update user's wallet balance
 */
export const updateUserBalance = async (
  userId: string,
  walletBalance: number,
  walletMoney?: number
): Promise<void> => {
  await updateUser(userId, { 
    walletBalance,
    ...(walletMoney !== undefined && { walletMoney })
  });
};

/**
 * Update user's account status
 */
export const updateUserStatus = async (
  userId: string,
  accountStatus: 'active' | 'suspended'
): Promise<void> => {
  await updateUser(userId, { accountStatus });
};
