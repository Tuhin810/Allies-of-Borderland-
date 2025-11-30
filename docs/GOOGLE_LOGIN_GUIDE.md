# 🔥 Google Login → Firestore Auto-Registration Guide

## Overview

The landing page now has a **"Continue with Google"** button that automatically creates user accounts in Firestore, just like the arena registration system.

## ✅ What's Already Implemented

### 1. **Button on Landing Page**
Located in: `components/LandingView.tsx` (line 109-121)

```tsx
<button onClick={() => onGoogleLogin?.()}>
  <svg>{/* Google icon */}</svg>
  <span>Continue with Google</span>
</button>
```

### 2. **Click Handler**
When clicked, it triggers `handleGoogleLogin()` in `App.tsx`:

```typescript
const handleGoogleLogin = async () => {
  try {
    const { needsProfile } = await loginWithGoogle();
    if (needsProfile) {
      navigate('/profile?setup=google');
    } else {
      navigate('/arena');
    }
  } catch (e: any) {
    console.error('Google login failed', e);
    alert(e?.message ?? 'Google login failed.');
  }
};
```

### 3. **Authentication Logic**
In `contexts/AuthContext.tsx`, the `loginWithGoogle()` function:

```typescript
const loginWithGoogle = async () => {
  setLoading(true);
  try {
    // Step 1: Google OAuth
    const result = await signInWithGoogle();
    const user = result.user;
    
    // Step 2: Extract user info
    setFirebaseUser(user);
    setLoginType('google');
    setPendingProfileId(user.uid);
    
    // Step 3: Create username from Google profile
    const username = user.displayName || 
                     user.email?.split('@')[0] || 
                     `User_${user.uid.slice(0, 6)}`;
    
    // Step 4: Auto-login or auto-register
    const exists = await fetchProfileDocument(
      user.uid,      // User ID from Google
      'google',      // Login type
      username       // Display name
    );
    
    return { needsProfile: !exists };
  } finally {
    setLoading(false);
  }
};
```

### 4. **Auto-Registration in Firestore**
In `contexts/AuthContext.tsx`, `fetchProfileDocument()` calls `userRegistry.ts`:

```typescript
const fetchProfileDocument = async (id, type, username?, walletAddress?) => {
  // Try to fetch existing user
  let data = await fetchUser(id);
  
  // If user doesn't exist, CREATE ACCOUNT AUTOMATICALLY
  if (!data) {
    const defaultUsername = username || `Citizen_${id.slice(0, 6)}`;
    data = await loginOrRegisterUser(id, defaultUsername, type, walletAddress);
  }
  
  if (data) {
    setProfile(data);
    writeSessionCookie({...});
    return true;
  }
  return false;
};
```

### 5. **Database Storage**
In `services/userRegistry.ts`, the `loginOrRegisterUser()` function:

```typescript
export const loginOrRegisterUser = async (
  userId: string,
  username: string,
  loginType: LoginType,
  walletAddress?: string
): Promise<BorderlandProfile | null> => {
  // Check if user exists
  let user = await fetchUser(userId);

  if (user) {
    // USER EXISTS - Login
    console.log('User found, logging in:', userId);
    await updateUser(userId, { updatedAt: Date.now() });
    return user;
  }

  // USER DOESN'T EXIST - Register
  console.log('User not found, creating new account:', userId);
  user = await registerUser(userId, username, loginType, walletAddress);
  return user;
};
```

## 📊 What Gets Stored in Firestore

When a user clicks "Continue with Google", this is stored in the `users` collection:

```javascript
// Collection: users
// Document ID: {Google UID}
{
  id: "google-uid-abc123",
  username: "John Doe",                    // From Google profile
  avatarSeed: "random-seed-xyz789",       // Auto-generated
  invitationCode: "A8F3K9L2",             // Auto-generated 8-char code
  invitationLink: "http://localhost:3000/invite/A8F3K9L2",
  walletAddress: undefined,                // Not used for Google login
  walletBalance: undefined,
  walletMoney: undefined,
  accountStatus: "active",
  accountAddress: "john.doe@gmail.com",   // Google email
  loginType: "google",
  loginTag: "google",
  createdAt: 1733012345678,               // Firestore serverTimestamp
  updatedAt: 1733012345678                // Firestore serverTimestamp
}
```

## 🎯 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│  LANDING PAGE                                           │
│  ┌────────────────────────────────┐                     │
│  │  [Continue with Google] Button  │ ← User clicks      │
│  └────────────────────────────────┘                     │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  GOOGLE OAUTH                                           │
│  • User selects Google account                          │
│  • Google authenticates user                            │
│  • Returns: user.uid, user.displayName, user.email      │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  AUTH CONTEXT                                           │
│  • Extract username from Google profile                 │
│  • Call: loginOrRegisterUser(uid, username, 'google')   │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  USER REGISTRY SERVICE                                  │
│  • Check Firestore: Does user exist?                    │
│    ┌──────────────┬──────────────┐                      │
│    │  YES         │     NO       │                      │
│    ↓              ↓              │                      │
│  LOGIN        REGISTER           │                      │
│  • Get profile   • Create doc    │                      │
│  • Update time   • Set defaults  │                      │
│                  • Save to DB    │                      │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  FIRESTORE DATABASE                                     │
│  📁 Collection: users                                   │
│     📄 Document: google-uid-abc123                      │
│        • username: "John Doe"                           │
│        • email: "john@gmail.com"                        │
│        • invitationCode: "A8F3K9L2"                     │
│        • accountStatus: "active"                        │
│        • createdAt: [timestamp]                         │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  REDIRECT TO ARENA                                      │
│  • User is logged in                                    │
│  • Session saved in cookie                              │
│  • Profile available in state                           │
│  • Ready to create/join games                           │
└─────────────────────────────────────────────────────────┘
```

## 🧪 How to Test

### Step 1: Open the App
```bash
# App should already be running at:
http://localhost:3000
```

### Step 2: Click "Continue with Google"
- You'll see a Google OAuth popup
- Select your Google account
- Authorize the app

### Step 3: Check Console Logs
You should see:
```
User not found, creating new account: google-uid-abc123
```
OR (if you've logged in before):
```
User found, logging in: google-uid-abc123
```

### Step 4: Verify Firestore
1. Open Firebase Console: https://console.firebase.google.com
2. Navigate to your project
3. Go to **Firestore Database**
4. Click on the **`users`** collection
5. You should see a new document with:
   - Document ID: Your Google UID
   - Fields: username, email, invitationCode, etc.

### Step 5: Test Return User
1. Log out (if needed)
2. Click "Continue with Google" again
3. **Same Google account** → Should log in instantly (no new document created)
4. **Different Google account** → Should create new document

## 📸 Expected Firestore Structure

```
📦 Firestore Database
 ┣ 📁 arenas (existing)
 ┃ ┗ 📄 room-abc123
 ┃   ┣ roomId: "room-abc123"
 ┃   ┣ hostName: "Player 1"
 ┃   ┗ status: "waiting"
 ┗ 📁 users (NEW!)
   ┣ 📄 google-uid-1a2b3c
   ┃ ┣ id: "google-uid-1a2b3c"
   ┃ ┣ username: "John Doe"
   ┃ ┣ loginType: "google"
   ┃ ┣ accountAddress: "john@gmail.com"
   ┃ ┣ invitationCode: "X7K9F2A1"
   ┃ ┣ createdAt: [timestamp]
   ┃ ┗ accountStatus: "active"
   ┗ 📄 wallet-address-xyz
     ┣ id: "wallet-address-xyz"
     ┣ username: "Cit. xyz...789"
     ┣ loginType: "wallet"
     ┣ walletAddress: "wallet-address-xyz"
     ┗ accountStatus: "active"
```

## ⚙️ Configuration

### Firebase Setup
Make sure your `services/firebase.ts` has Google Auth enabled:

```typescript
// This should already be configured
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  return await signInWithPopup(auth, provider);
};
```

### Firestore Rules
Ensure your Firestore security rules allow authenticated users to read/write their own data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /arenas/{arenaId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 🎮 Usage After Login

Once logged in with Google, the user can:

1. ✅ **Create Arena** - Host a game room
2. ✅ **Join Arena** - Join existing games
3. ✅ **View Profile** - See their profile at `/profile`
4. ✅ **Play Games** - Start playing immediately
5. ✅ **Access Features** - All features available

## 🔍 Debugging

### If button doesn't work:
1. Check browser console for errors
2. Verify Firebase config in `.env` or `firebase.ts`
3. Ensure Google Auth is enabled in Firebase Console
4. Check if popup blockers are disabled

### If user not created in Firestore:
1. Check console logs for error messages
2. Verify Firestore rules allow writes
3. Check `firebaseEnabled` in `firebase.ts` is `true`
4. Verify internet connection

### Common Errors:
```javascript
// Error: "Google login failed"
// → Check Firebase config and Google Auth setup

// Error: "Failed to register user"
// → Check Firestore rules and permissions

// Error: "Missing profile owner"
// → User state not set correctly, try logging in again
```

## 🆚 Comparison: Google Login vs Wallet Login

| Feature | Google Login | Wallet Login |
|---------|-------------|--------------|
| Button | ✅ "Continue with Google" | ✅ "Connect Wallet" |
| Auth Provider | Google OAuth | Solana wallet |
| User ID | Google UID | Wallet address |
| Username | From Google profile | `Cit. abc...xyz` |
| Email | Google email | Not applicable |
| Wallet Address | Not set | Set to wallet |
| Storage Location | `users` collection | `users` collection |
| Auto-register | ✅ Yes | ✅ Yes |

## 📝 Summary

**Everything is ready!** The "Continue with Google" button on the landing page will:

1. ✅ Open Google OAuth popup
2. ✅ Get user's Google profile
3. ✅ Check if user exists in Firestore
4. ✅ **IF NEW:** Create account automatically in `users` collection
5. ✅ **IF EXISTING:** Log in with existing account
6. ✅ Store all details in Firestore (just like arena)
7. ✅ Redirect to `/arena` page
8. ✅ User can start playing immediately

**No manual account creation needed!** 🎉
