import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TokenContextType {
    tokenBalance: number;
    addTokens: (amount: number) => void;
    spendTokens: (amount: number) => boolean;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

export const TokenProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [tokenBalance, setTokenBalance] = useState(0);

    const addTokens = (amount: number) => {
        setTokenBalance(prev => prev + amount);
    };

    const spendTokens = (amount: number): boolean => {
        if (tokenBalance >= amount) {
            setTokenBalance(prev => prev - amount);
            return true;
        }
        return false;
    };

    return (
        <TokenContext.Provider value={{ tokenBalance, addTokens, spendTokens }}>
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
