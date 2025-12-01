import React from 'react';
import { Coins } from 'lucide-react';
import { useTokens } from '../contexts/TokenContext';
import { ECONOMY } from '@/constants/economy';
import { useNavigate } from 'react-router-dom';

export const Payment: React.FC = () => {
    const { tokenBalance } = useTokens();
    const navigate = useNavigate();

    return (
        <button
            onClick={() => navigate('/payment')}
            className="group relative px-4 py-2 bg-gradient-to-r from-[#9945FF]/20 to-[#14F195]/20 
            rounded-full border border-white/10 hover:border-[#14F195] transition-all duration-300 overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-[#9945FF] to-[#14F195] 
            opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            <div className="relative flex items-center gap-2">
                <Coins size={16} className="text-white" />
                <span className="text-xs font-bold flex items-center gap-2 uppercase tracking-wider text-white">
                    Wallet
                    {tokenBalance > 0 && (
                        <div className="flex items-center gap-1 bg-gradient-to-r from-[#9945FF]/20 to-[#14F195]/20 px-2 py-0.5 rounded-full border border-[#9945FF]/30">
                            <Coins size={10} className="text-[#14F195]" />
                            <span className="text-[10px] text-[#14F195] font-mono font-bold">
                                {tokenBalance} {ECONOMY.TOKEN_SYMBOL}
                            </span>
                        </div>
                    )}
                </span>
            </div>
        </button>
    );
};
