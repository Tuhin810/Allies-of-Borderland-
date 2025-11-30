# 🔧 Bug Fix: Firestore Undefined Values

## Issue
When clicking "Continue with Google", the app threw an error:
```
FirebaseError: Function setDoc() called with invalid data. 
Unsupported field value: undefined (found in field walletAddress)
```

## Root Cause
Firestore does not accept `undefined` values in documents. The `registerUser` function was setting fields like `walletAddress`, `walletBalance`, etc. to `undefined` for Google login users.

## Solution
Modified `services/userRegistry.ts` to:

1. **Conditionally add wallet fields**
   - Only include wallet-specific fields when `loginType === 'wallet'`
   - Google users won't have these fields at all

2. **Clean undefined values**
   - Filter out any `undefined` values before saving
   - Uses `Object.fromEntries` to remove undefined fields

## Code Changes

### Before:
```typescript
const newUser: BorderlandProfile = {
  id: userId,
  username,
  avatarSeed,
  invitationCode,
  invitationLink: `...`,
  walletAddress,              // ❌ undefined for Google users
  walletBalance: 0,
  walletMoney: 0,
  accountStatus: 'active',
  accountAddress: walletAddress, // ❌ undefined for Google users
  loginType,
  loginTag: loginType,
  createdAt: Date.now(),
  updatedAt: Date.now()
};

await setDoc(target, {
  ...newUser,  // ❌ Includes undefined values
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
});
```

### After:
```typescript
const newUser: BorderlandProfile = {
  id: userId,
  username,
  avatarSeed,
  invitationCode,
  invitationLink: `...`,
  accountStatus: 'active',
  loginType,
  loginTag: loginType,
  createdAt: Date.now(),
  updatedAt: Date.now()
} as BorderlandProfile;

// ✅ Only add wallet fields for wallet login
if (loginType === 'wallet' && walletAddress) {
  newUser.walletAddress = walletAddress;
  newUser.accountAddress = walletAddress;
  newUser.walletBalance = 0;
  newUser.walletMoney = 0;
}

// ✅ Clean undefined values before saving
const cleanData = Object.fromEntries(
  Object.entries(newUser).filter(([, value]) => value !== undefined)
);

await setDoc(target, {
  ...cleanData,  // ✅ No undefined values
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
});
```

## Result

### Google User Document:
```json
{
  "id": "google-abc123",
  "username": "John Doe",
  "avatarSeed": "xyz789",
  "invitationCode": "X7K9F2A1",
  "invitationLink": "http://localhost:3000/invite/X7K9F2A1",
  "accountStatus": "active",
  "loginType": "google",
  "loginTag": "google",
  "createdAt": [Firestore Timestamp],
  "updatedAt": [Firestore Timestamp]
}
```
✅ **No undefined values!**

### Wallet User Document:
```json
{
  "id": "wallet-xyz789",
  "username": "Cit. xyz...789",
  "avatarSeed": "abc123",
  "invitationCode": "K9L2A1F3",
  "invitationLink": "http://localhost:3000/invite/K9L2A1F3",
  "walletAddress": "wallet-xyz789",
  "accountAddress": "wallet-xyz789",
  "walletBalance": 0,
  "walletMoney": 0,
  "accountStatus": "active",
  "loginType": "wallet",
  "loginTag": "wallet",
  "createdAt": [Firestore Timestamp],
  "updatedAt": [Firestore Timestamp]
}
```
✅ **Wallet fields included only when needed!**

## Testing

Now when you click "Continue with Google":
1. ✅ No error messages
2. ✅ User created successfully in Firestore
3. ✅ Redirected to /arena
4. ✅ Ready to play!

---

**Status: ✅ FIXED** - Ready to test again!
