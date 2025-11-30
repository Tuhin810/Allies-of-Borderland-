# User Registry - Auto Login/Registration

## Overview

The `userRegistry.ts` service has been created to automatically handle user authentication and registration. When a user attempts to login at the landing page:

- **If the user exists** → They will be logged in automatically
- **If the user doesn't exist** → A new account will be created automatically in the `users` collection in Firestore

## Architecture

### Files Modified/Created

1. **`services/userRegistry.ts`** (NEW) - Main user authentication/registration service
2. **`contexts/AuthContext.tsx`** (MODIFIED) - Updated to use the new userRegistry service

### Key Functions in `userRegistry.ts`

#### 1. `loginOrRegisterUser(userId, username, loginType, walletAddress?)`
**Main entry point** - Automatically handles both login and registration:
- Checks if user exists in database
- If exists: Returns user profile (login)
- If doesn't exist: Creates new account and returns profile (register)

```typescript
const user = await loginOrRegisterUser(
  'user-id-123',
  'John Doe',
  'wallet', // or 'google'
  'wallet-address-optional'
);
```

#### 2. `registerUser(userId, username, loginType, walletAddress?)`
Internal function that creates a new user account automatically with:
- Random avatar seed
- Random invitation code
- Default wallet balance of 0
- Active account status

#### 3. `fetchUser(userId)`
Fetches an existing user profile by ID

#### 4. `fetchUserByWallet(walletAddress)`
Fetches a user by their wallet address (useful for wallet-based authentication)

#### 5. `updateUser(userId, data)`
Updates a user's profile information

#### 6. Helper Functions
- `updateUserBalance(userId, walletBalance, walletMoney?)` - Update wallet balance
- `updateUserStatus(userId, status)` - Update account status (active/suspended)

## How It Works

### Landing Page Flow

1. **User clicks "Connect Wallet" or "Sign in with Google"**
   ```typescript
   // In LandingPage component
   <button onClick={onConnectWallet}>Connect Wallet</button>
   <button onClick={onGoogleLogin}>Sign in with Google</button>
   ```

2. **AuthContext handles the authentication**
   ```typescript
   // For wallet login
   const loginWithWallet = async () => {
     const wallet = await solanaService.connect();
     const username = `Cit. ${wallet.shortAddress}`;
     
     // This will auto-login OR auto-register
     const exists = await fetchProfileDocument(
       wallet.address, 
       'wallet', 
       username, 
       wallet.address
     );
   };

   // For Google login
   const loginWithGoogle = async () => {
     const result = await signInWithGoogle();
     const user = result.user;
     const username = user.displayName || user.email?.split('@')[0];
     
     // This will auto-login OR auto-register
     const exists = await fetchProfileDocument(
       user.uid, 
       'google', 
       username
     );
   };
   ```

3. **fetchProfileDocument in AuthContext**
   ```typescript
   const fetchProfileDocument = async (id, type, username?, walletAddress?) => {
     // Try to fetch existing user
     let data = await fetchUser(id);
     
     // If user doesn't exist, create account automatically
     if (!data) {
       const defaultUsername = username || `Citizen_${id.slice(0, 6)}`;
       data = await loginOrRegisterUser(id, defaultUsername, type, walletAddress);
     }
     
     // Save to session and update state
     if (data) {
       setProfile(data);
       writeSessionCookie(...);
       return true;
     }
     return false;
   };
   ```

### Database Structure

User documents are stored in the `users` collection in Firestore:

```typescript
{
  id: string;                    // User ID (wallet address or Google UID)
  username: string;              // Display name
  avatarSeed: string;           // Random seed for avatar generation
  invitationCode: string;       // Random 8-character code
  invitationLink: string;       // Full invitation URL
  walletAddress?: string;       // Solana wallet address (if wallet login)
  walletBalance?: number;       // Current wallet balance
  walletMoney?: number;         // Wallet money
  accountStatus: 'active' | 'suspended';
  accountAddress?: string;      // Wallet or email
  loginType: 'wallet' | 'google';
  loginTag: 'wallet' | 'google';
  createdAt: number;            // Timestamp
  updatedAt: number;            // Timestamp
}
```

## Benefits

1. **Seamless Onboarding** - Users don't need to manually create an account
2. **Single Source of Truth** - `loginOrRegisterUser` handles both scenarios
3. **Consistent with arenaRegistry** - Similar pattern to arena management
4. **Automatic Defaults** - New users get sensible defaults (avatar, invitation code, etc.)
5. **Session Management** - Automatic cookie-based session persistence

## Example Usage

### Direct Usage (if needed)
```typescript
import { loginOrRegisterUser } from './services/userRegistry';

// This will login if user exists, or create account if they don't
const userProfile = await loginOrRegisterUser(
  'wallet-address-123',
  'Player One',
  'wallet',
  'wallet-address-123'
);

if (userProfile) {
  console.log('Logged in as:', userProfile.username);
  console.log('Balance:', userProfile.walletBalance);
}
```

### Through AuthContext (recommended)
```typescript
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { loginWithWallet, loginWithGoogle, profile } = useAuth();

  const handleWalletLogin = async () => {
    const { needsProfile } = await loginWithWallet();
    // needsProfile will be false if auto-registration succeeded
  };

  return (
    <div>
      {profile ? (
        <p>Welcome, {profile.username}!</p>
      ) : (
        <button onClick={handleWalletLogin}>Connect Wallet</button>
      )}
    </div>
  );
}
```

## Migration from Old System

The old system used separate `fetchUserProfile` and `saveUserProfile` functions. The new system:

- **Old**: Check if user exists → If not, redirect to profile setup page → User manually creates profile
- **New**: Check if user exists → If not, automatically create account with defaults → User logged in immediately

Users can still customize their profile later through the profile page, but they can start playing immediately.

## Testing

To test the auto-registration flow:

1. Clear your browser cookies
2. Open the app and navigate to the landing page
3. Click "Connect Wallet" or "Sign in with Google"
4. **First time**: A new account will be created automatically
5. **Second time**: You'll be logged in with your existing account
6. Check Firestore to see the user document was created

## Future Enhancements

Possible improvements:
- Email verification for Google login
- Profile completion prompts (optional)
- Social features (friend invitations using invitation codes)
- Reputation system integration
- Achievement tracking
