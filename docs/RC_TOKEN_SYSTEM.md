# 🪙 RC Token System - Implementation Guide

## Overview

The **RC Token System** has been integrated into the game economy. Users receive RC tokens when they create an account and use them to create rooms and stake in games.

---

## 📊 Token Economics

### Token Name: **RC**
- Symbol: `RC`
- Decimals: 0 (whole numbers only)

### Token Allocation:
| Action | Amount |
|--------|--------|
| New User Bonus | **200 RC** |
| Room Creation Cost | **-10 RC** |
| Minimum Stake | **1 RC** |
| Maximum Stake | Up to **100%** of balance |

---

##  Files Created/Modified

### 1. ✅ Created: `constants/economy.ts`
Defines all economy constants:
```typescript
export const ECONOMY = {
  TOKEN_NAME: 'RC',
  TOKEN_SYMBOL: 'RC',
  NEW_USER_BONUS: 200,
  ROOM_CREATION_COST: 10,
  MIN_STAKE: 1,
  MAX_STAKE_PERCENTAGE: 100,
  TOKEN_DECIMALS: 0,
};
```

### 2. ✅ Enhanced: `contexts/TokenContext.tsx`
- Integrated with Firestore
- Syncs with user profile
- Persists token changes to database
- Methods:
  - `addTokens(amount)` - Add tokens (async)
  - `spendTokens(amount)` - Spend tokens (async)
  - `tokenBalance` - Current balance
  - `loading` - Loading state

### 3. ✅ Updated: `types/profile.ts`
Added `rcTokens` field to BorderlandProfile:
```typescript
export interface BorderlandProfile {
  // ... other fields
  rcTokens?: number; // Game tokens (RC)
}
```

### 4. ✅ Updated: `services/userRegistry.ts`
New users automatically receive 200 RC tokens:
```typescript
const newUser: BorderlandProfile = {
  // ... other fields
  rcTokens: ECONOMY.NEW_USER_BONUS, // 200 RC
};
```

### 5. ✅ Updated: `components/Navbar.tsx`
Displays RC token balance with a coin icon:
- Shows in user profile section
- Gradient badge design
- Real-time balance updates

---

## 🎮 User Flow

### 1. **New User Registration**
```
User creates account
  ↓
Auto-assigned: 200 RC tokens
  ↓
Stored in Firestore: users/{userId}/rcTokens = 200
  ↓
Displayed in Navbar: "200 RC"
```

### 2. **Creating a Room** (To be implemented)
```
User clicks "Create Room"
  ↓
Check: tokenBalance >= 10?
  ├─ YES → Deduct 10 RC
  │   └─ spendTokens(10)
  │   └─ Create room
  └─ NO → Show error: "Insufficient RC tokens"
```

### 3. **Staking in Game** (To be implemented)
```
User sets stake amount
  ↓
Validate:
  - stake >= 1 RC (MIN_STAKE)
  - stake <= tokenBalance
  ↓
If valid → Lock tokens for game
If invalid → Show error message
```

---

## 🔧 How It Works

### TokenContext & Firestore Sync

```typescript
// Load balance from profile
useEffect(() => {
  if (profile?.rcTokens !== undefined) {
    setTokenBalance(profile.rcTokens);
  }
}, [profile]);

// Spend tokens (persistent)
const spendTokens = async (amount: number) => {
  if (tokenBalance < amount) return false;
  
  const newBalance = tokenBalance - amount;
  setTokenBalance(newBalance);
  
  await updateUser(profile.id, { rcTokens: newBalance });
  return true;
};
```

### Display in UI

**Navbar:**
```tsx
<div className="flex items-center gap-1">
  <Coins size={10} className="text-[#14F195]" />
  <span>{tokenBalance} RC</span>
</div>
```

---

## 📝 Next Steps to Complete Integration

### 1. **Room Creation Integration**
Update `ArenaPage` or room creation logic:

```typescript
import { useTokens } from '../contexts/TokenContext';
import { ECONOMY } from '../constants/economy';

const ArenaPage = () => {
  const { tokenBalance, spendTokens } = useTokens();

  const handleCreateRoom = async () => {
    // Check if user has enough tokens
    if (tokenBalance < ECONOMY.ROOM_CREATION_COST) {
      alert(`Insufficient RC tokens! You need ${ECONOMY.ROOM_CREATION_COST} RC to create a room.`);
      return;
    }

    // Deduct tokens
    const success = await spendTokens(ECONOMY.ROOM_CREATION_COST);
    if (!success) {
      alert('Failed to deduct tokens. Please try again.');
      return;
    }

    // Proceed with room creation
    // ... existing room creation logic
  };
};
```

### 2. **Staking Validation**
Add stake amount validation:

```typescript
const validateStake = (stakeAmount: number) => {
  if (stakeAmount < ECONOMY.MIN_STAKE) {
    return { valid: false, error: `Minimum stake is ${ECONOMY.MIN_STAKE} RC` };
  }

  if (stakeAmount > tokenBalance) {
    return { valid: false, error: `Insufficient balance. You have ${tokenBalance} RC` };
  }

  return { valid: true };
};
```

### 3. **UI Updates Needed**
- Add RC token display in room creation modal
- Show available balance when setting stake
- Add validation messages
- Disable create button if insufficient tokens

---

## 🎨 UI Examples

### Room Creation Modal (Example):
```
┌─────────────────────────────────────┐
│  Create New Room                    │
├─────────────────────────────────────┤
│  Available Balance: 190 RC          │
│                                     │
│  Room Creation Cost: 10 RC          │
│                                     │
│  Stake Amount:                       │
│  [100]  RC (1-190 range)            │
│                                     │
│  After creation: 80 RC remaining    │
│                                     │
│  [Cancel]  [Create Room - 10 RC]   │
└─────────────────────────────────────┘
```

### Insufficient Tokens Error:
```
┌─────────────────────────────────────┐
│  ⚠️ Insufficient RC Tokens          │
├─────────────────────────────────────┤
│  You need 10 RC to create a room    │
│  Current balance: 5 RC              │
│                                     │
│  [Buy Tokens]  [OK]                 │
└─────────────────────────────────────┘
```

---

## 📊 Database Structure

### Firestore Document:
```javascript
// Collection: users
// Document: {userId}
{
  id: "user-123",
  username: "Player1",
  rcTokens: 200,  // ← RC Token balance
  walletBalance: 1.5,
  accountStatus: "active",
  createdAt: [timestamp],
  updatedAt: [timestamp]
}
```

---

## ✅ Currently Working

1. ✅ New users get 200 RC tokens
2. ✅ Token balance synced with Firestore
3. ✅ Token balance displayed in Navbar
4. ✅ TokenContext provides methods to add/spend tokens
5. ✅ Real-time balance updates
6. ✅ Persistent across sessions

---

## 🚀 Testing

### Test New User Gets Tokens:
1. Clear cookies/logout
2. Create new account (Google or Wallet)
3. Check Navbar → Should show "200 RC"
4. Check Firestore → `users/{userId}/rcTokens` should be 200

### Test Token Spending (Manual):
```typescript
// In browser console or component:
const { spendTokens, tokenBalance } = useTokens();

console.log('Before:', tokenBalance); // 200
await spendTokens(10);
console.log('After:', tokenBalance);  // 190
```

### Test Firestore Persistence:
1. Spend tokens
2. Refresh page
3. Balance should persist

---

## 🎯 Summary

**Status: ✅ Core System Implemented**

- ✅ Token system created
- ✅ New users get 200 RC
- ✅ Firestore integration complete
- ✅ UI displays token balance
- ⏳ Room creation cost (needs integration)
- ⏳ Staking validation (needs integration)

**Next Task:** Integrate token spending into room creation and gameplay flows.
