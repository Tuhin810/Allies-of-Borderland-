import React, { useState } from 'react';
import { Icons } from './Icons';
import { ECONOMY } from '../constants/economy';

export interface RoomConfig {
    stakeAmount: number;
    discussionTime: number;
    maxPlayers: number;
}

interface CreateRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (config: RoomConfig) => void;
    balance: number;
}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    balance
}) => {
    const [stakeAmount, setStakeAmount] = useState(ECONOMY.ROOM_CREATION_COST);
    const [discussionTime, setDiscussionTime] = useState(120); // Default 2 minutes
    const [maxPlayers, setMaxPlayers] = useState(10); // Default 10

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (stakeAmount > balance) return;
        onConfirm({
            stakeAmount,
            discussionTime,
            maxPlayers
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-md mx-4 bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(153,69,255,0.2)] overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-2">
                        <Icons.Settings size={20} className="text-[#9945FF]" />
                        Room Configuration
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <Icons.X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">

                    {/* Stake Amount */}
                    <div className="space-y-2">
                        <label className="text-xs text-gray-400 uppercase tracking-widest font-bold flex justify-between">
                            <span>Entry Fee (Stake)</span>
                            <span className="text-[#14F195]">{stakeAmount} RC</span>
                        </label>
                        <div className="relative">
                            <input
                                type="range"
                                min={ECONOMY.MIN_STAKE}
                                max={Math.min(balance, 1000)}
                                value={stakeAmount}
                                onChange={(e) => setStakeAmount(Number(e.target.value))}
                                className="w-full accent-[#9945FF] h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-600 font-mono">
                            <span>{ECONOMY.MIN_STAKE} RC</span>
                            <span>{Math.min(balance, 1000)} RC</span>
                        </div>
                    </div>

                    {/* Discussion Time */}
                    <div className="space-y-2">
                        <label className="text-xs text-gray-400 uppercase tracking-widest font-bold flex justify-between">
                            <span>Discussion Time</span>
                            <span className="text-blue-400">{discussionTime}s</span>
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {[30, 60, 120, 180].map(time => (
                                <button
                                    key={time}
                                    onClick={() => setDiscussionTime(time)}
                                    className={`py-2 rounded-lg text-xs font-bold border transition-all ${discussionTime === time
                                            ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                                            : 'bg-[#111] border-white/10 text-gray-500 hover:border-white/30'
                                        }`}
                                >
                                    {time}s
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Max Players */}
                    <div className="space-y-2">
                        <label className="text-xs text-gray-400 uppercase tracking-widest font-bold flex justify-between">
                            <span>Max Players</span>
                            <span className="text-purple-400">{maxPlayers}</span>
                        </label>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setMaxPlayers(Math.max(4, maxPlayers - 1))}
                                className="w-10 h-10 rounded-lg bg-[#111] border border-white/10 flex items-center justify-center hover:bg-white/5"
                            >
                                -
                            </button>
                            <div className="flex-1 text-center font-mono text-xl font-bold bg-[#111] py-2 rounded-lg border border-white/5">
                                {maxPlayers}
                            </div>
                            <button
                                onClick={() => setMaxPlayers(Math.min(10, maxPlayers + 1))}
                                className="w-10 h-10 rounded-lg bg-[#111] border border-white/10 flex items-center justify-center hover:bg-white/5"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Summary & Action */}
                    <div className="pt-4 border-t border-white/10 space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Creation Cost</span>
                            <span className="text-red-400">-{ECONOMY.ROOM_CREATION_COST} RC</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Your Balance</span>
                            <span className={`font-mono font-bold ${balance < stakeAmount + ECONOMY.ROOM_CREATION_COST ? 'text-red-500' : 'text-[#14F195]'}`}>
                                {balance} RC
                            </span>
                        </div>

                        <button
                            onClick={handleConfirm}
                            disabled={balance < stakeAmount + ECONOMY.ROOM_CREATION_COST}
                            className="w-full py-4 bg-[#9945FF] text-white font-bold uppercase tracking-widest rounded-xl hover:bg-[#863ee3] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-[#9945FF]/25"
                        >
                            Create Room
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CreateRoomModal;
