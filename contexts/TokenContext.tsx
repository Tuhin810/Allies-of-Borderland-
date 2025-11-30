import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { updateUser } from '../services/userRegistry';
import { ECONOMY } from '../constants/economy';

interface TokenContextType {
    tokenBalance: number;
    addTokens: (amount: number) => Promise<void>;
    spendTokens: (amount: number) => Promise<boolean>;
    loading: boolean;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

export const TokenProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { profile } = useAuth();
    const [tokenBalance, setTokenBalance] = useState(0);
    const [loading, setLoading] = useState(true);

    // Load token balance from user profile
    useEffect(() => {
        if (profile?.rcTokens !== undefined) {
            setTokenBalance(profile.rcTokens);
            setLoading(false);
        } else if (profile) {
            // If profile exists but no tokens field, initialize with 0
            setTokenBalance(0);
            setLoading(false);
        } else {
            setLoading(false);
        }
    }, [profile]);

    const addTokens = async (amount: number) => {
        if (!profile) {
            console.warn('Cannot add tokens: No user profile');
            return;
        }

        const newBalance = tokenBalance + amount;
        setTokenBalance(newBalance);

        try {
            await updateUser(profile.id, { rcTokens: newBalance });
        } catch (error) {
            console.error('Failed to update token balance:', error);
            // Revert on error
            setTokenBalance(tokenBalance);
        }
    };

    const spendTokens = async (amount: number): Promise<boolean> => {
        if (!profile) {
            console.warn('Cannot spend tokens: No user profile');
            return false;
        }

        if (tokenBalance < amount) {
            return false;
        }

        const newBalance = tokenBalance - amount;
        setTokenBalance(newBalance);

        try {
            await updateUser(profile.id, { rcTokens: newBalance });
            return true;
        } catch (error) {
            console.error('Failed to update token balance:', error);
            // Revert on error
            setTokenBalance(tokenBalance);
            return false;
        }
    };

    return (
        <TokenContext.Provider value={{ tokenBalance, addTokens, spendTokens, loading }}>
            {children}
        </TokenContext.Provider>
    );
};

export const useTokens = () => {
    const context = useContext(TokenContext);
    if (context === undefined) {
        throw new Error('useTokens must be used within a TokenProvider');
    }
    return context;
};
