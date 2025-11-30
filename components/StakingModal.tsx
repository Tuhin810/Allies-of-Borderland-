import React, { useState } from 'react';
import { Icons } from './Icons';
import { Coins } from 'lucide-react';
import { useTokens } from '../contexts/TokenContext';
import { ECONOMY } from '../constants/economy';
import { validateStake, formatRC } from '../services/stakingService';

interface StakingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (stakeAmount: number) => Promise<void>;
    title?: string;
    description?: string;
}

const StakingModal: React.FC<StakingModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Set Your Stake',
    description = 'Choose how many RC tokens to stake in this game'
}) => {
    const { tokenBalance } = useTokens();
    const [stakeAmount, setStakeAmount] = useState(Math.min(50, tokenBalance));
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleStakeChange = (value: number) => {
        setStakeAmount(value);
        setError(null);
    };

    const handleConfirm = async () => {
        // Validate stake
        const validation = validateStake(stakeAmount, tokenBalance);
        if (!validation.valid) {
            setError(validation.error || 'Invalid stake amount');
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            await onConfirm(stakeAmount);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to stake tokens');
        } finally {
            setIsProcessing(false);
        }
    };

    const maxStake = Math.floor(tokenBalance);
    const remainingAfterStake = tokenBalance - stakeAmount;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-md mx-4 bg-gradient-to-b from-[#1a1a1a] to-black border border-white/10 rounded-3xl shadow-[0_0_100px_rgba(153,69,255,0.3)] overflow-hidden">

                {/* Decorative Background */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>

                {/* Header */}
                <div className="relative p-6 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center">
                                <Coins size={24} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tight">{title}</h2>
                                <p className="text-xs text-gray-400 font-mono">{description}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <Icons.X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="relative p-6 space-y-6">

                    {/* Balance Display */}
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-sm text-gray-400 font-mono uppercase tracking-wider">Available Balance</span>
                        <div className="flex items-center gap-2">
                            <Coins size={16} className="text-[#14F195]" />
                            <span className="text-lg font-bold text-white font-mono">{tokenBalance} {ECONOMY.TOKEN_SYMBOL}</span>
                        </div>
                    </div>

                    {/* Stake Input */}
                    <div className="space-y-3">
                        <label className="text-xs uppercase tracking-[0.3em] text-gray-400 font-mono">Stake Amount</label>

                        {/* Slider */}
                        <div className="space-y-2">
                            <input
                                type="range"
                                min={ECONOMY.MIN_STAKE}
                                max={maxStake}
                                value={stakeAmount}
                                onChange={(e) => handleStakeChange(parseInt(e.target.value))}
                                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#9945FF]"
                                style={{
                                    background: `linear-gradient(to right, #9945FF 0%, #14F195 ${(stakeAmount / maxStake) * 100}%, rgba(255,255,255,0.1) ${(stakeAmount / maxStake) * 100}%)`
                                }}
                            />

                            {/* Quick Select Buttons */}
                            <div className="flex gap-2">
                                {[25, 50, 75, 100].map((percent) => {
                                    const amount = Math.floor((maxStake * percent) / 100);
                                    return (
                                        <button
                                            key={percent}
                                            onClick={() => handleStakeChange(amount)}
                                            className="flex-1 px-3 py-1.5 text-xs font-mono bg-white/5 hover:bg-[#9945FF]/20 border border-white/10 hover:border-[#9945FF]/50 rounded-lg transition-all"
                                        >
                                            {percent}%
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Amount Display */}
                        <div className="flex items-center justify-center p-4 bg-gradient-to-r from-[#9945FF]/10 to-[#14F195]/10 rounded-xl border border-[#9945FF]/30">
                            <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#9945FF] to-[#14F195]">
                                {stakeAmount} {ECONOMY.TOKEN_SYMBOL}
                            </span>
                        </div>
                    </div>

                    {/* Info Row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Remaining</p>
                            <p className="text-sm font-bold text-white font-mono mt-1">{remainingAfterStake} RC</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Min Stake</p>
                            <p className="text-sm font-bold text-white font-mono mt-1">{ECONOMY.MIN_STAKE} RC</p>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <p className="text-sm text-red-500 font-mono">{error}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            disabled={isProcessing}
                            className="flex-1 px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white font-bold uppercase text-sm tracking-wider rounded-xl transition-all disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={isProcessing || stakeAmount < ECONOMY.MIN_STAKE || stakeAmount > tokenBalance}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white font-bold uppercase text-sm tracking-wider rounded-xl hover:shadow-[0_0_30px_rgba(153,69,255,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? 'Processing...' : `Stake ${stakeAmount} RC`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StakingModal;
