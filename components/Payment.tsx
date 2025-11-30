import React, { useState } from 'react';
import { Coins, X, Check, Wallet, Sparkles, AlertCircle } from 'lucide-react';
import { useTokens } from '../contexts/TokenContext';
import { web3Service } from '../services/web3';

interface TokenPackage {
    id: number;
    tokens: number;
    price: number;
    currency: 'ETH';
    popular?: boolean;
}

// Updated for ETH/Sepolia - 0.0001 ETH per token
const TOKEN_PACKAGES: TokenPackage[] = [
    { id: 1, tokens: 10, price: 0.001, currency: 'ETH' },
    { id: 2, tokens: 50, price: 0.005, currency: 'ETH', popular: true },
    { id: 3, tokens: 100, price: 0.01, currency: 'ETH' },
    { id: 4, tokens: 500, price: 0.05, currency: 'ETH' },
];

export const Payment: React.FC = () => {
    const { tokenBalance, addTokens } = useTokens();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [purchaseSuccess, setPurchaseSuccess] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [txHash, setTxHash] = useState<string>('');

    const handlePurchase = async (pkg: TokenPackage) => {
        setSelectedPackage(pkg);
        setIsProcessing(true);
        setPurchaseSuccess(false);
        setErrorMessage('');
        setTxHash('');

        try {
            // Check if MetaMask is available
            if (!web3Service.isAvailable()) {
                throw new Error('MetaMask not found. Please install MetaMask to continue.');
            }

            // Ensure user is on Sepolia network
            console.log('Switching to Sepolia network...');
            await web3Service.switchToSepolia();

            // Purchase tokens via smart contract
            console.log(`Purchasing ${pkg.tokens} tokens...`);
            const transactionHash = await web3Service.purchaseGameTokens(pkg.tokens);

            setTxHash(transactionHash);
            console.log(`Transaction confirmed: ${transactionHash}`);

            // Add tokens to local balance
            addTokens(pkg.tokens);

            setIsProcessing(false);
            setPurchaseSuccess(true);

            // Close modal after success animation
            setTimeout(() => {
                setIsModalOpen(false);
                setPurchaseSuccess(false);
                setSelectedPackage(null);
                setTxHash('');
            }, 3000);
        } catch (error: any) {
            console.error('Purchase failed:', error);
            setIsProcessing(false);
            setErrorMessage(error.message || 'Transaction failed. Please try again.');

            // Clear error after 5 seconds
            setTimeout(() => {
                setErrorMessage('');
                setSelectedPackage(null);
            }, 5000);
        }
    };

    return (
        <>
            {/* Payment Button */}
            <button
                onClick={() => setIsModalOpen(true)}
                className="group relative px-4 py-2 bg-gradient-to-r from-[#9945FF]/20 to-[#14F195]/20 rounded-xl border border-white/10 hover:border-[#14F195] transition-all duration-300 overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-[#9945FF] to-[#14F195] opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                <div className="relative flex items-center gap-2">
                    <Coins size={16} className="text-[#14F195]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                        Payment
                        {tokenBalance > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 bg-[#14F195] text-black rounded-full text-[10px] font-black">
                                {tokenBalance}
                            </span>
                        )}
                    </span>
                </div>
            </button>

            {/* Payment Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-300">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        onClick={() => !isProcessing && setIsModalOpen(false)}
                    />

                    {/* Modal Content */}
                    <div className="relative w-full max-w-2xl my-auto bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-xl sm:rounded-2xl shadow-2xl animate-in zoom-in slide-in-from-bottom duration-300 max-h-[85vh] flex flex-col">
                        {/* Close Button - Floating on Mobile */}
                        <button
                            onClick={() => !isProcessing && setIsModalOpen(false)}
                            disabled={isProcessing}
                            className="absolute top-2 right-2 sm:hidden z-20 p-2 rounded-full bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                            aria-label="Close"
                        >
                            <X className="text-white" size={20} />
                        </button>

                        {/* Scrollable Content */}
                        <div className="overflow-y-auto flex-1">
                            {/* Header */}
                            <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-xl border-b border-white/10 p-3 sm:p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center flex-shrink-0">
                                            <Sparkles className="text-white" size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-lg sm:text-2xl font-black text-white uppercase tracking-tight">Token Shop</h2>
                                            <p className="text-[10px] sm:text-xs text-gray-400 font-mono">Ethereum Sepolia Testnet</p>
                                        </div>
                                    </div>
                                    {/* Desktop Close Button */}
                                    <button
                                        onClick={() => !isProcessing && setIsModalOpen(false)}
                                        disabled={isProcessing}
                                        className="hidden sm:block p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        aria-label="Close"
                                    >
                                        <X className="text-gray-400 hover:text-white" size={24} />
                                    </button>
                                </div>

                                {/* Current Balance */}
                                <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-white/5 rounded-lg sm:rounded-xl border border-white/10">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs sm:text-sm text-gray-400 font-mono">Current Balance</span>
                                        <div className="flex items-center gap-1 sm:gap-2">
                                            <Coins className="text-[#14F195]" size={16} />
                                            <span className="text-xl sm:text-2xl font-black text-white font-mono">{tokenBalance}</span>
                                            <span className="text-xs sm:text-sm text-gray-400">tokens</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Error Message */}
                                {errorMessage && (
                                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-2">
                                        <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
                                        <p className="text-xs text-red-300">{errorMessage}</p>
                                    </div>
                                )}

                                {/* Success Message with TX Hash */}
                                {txHash && purchaseSuccess && (
                                    <div className="mt-3 p-3 bg-green-500/10 border border-green-500/50 rounded-lg">
                                        <p className="text-xs text-green-300 text-center">
                                            ✅ Transaction confirmed!{' '}
                                            <a
                                                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="underline hover:text-green-200"
                                            >
                                                View on Etherscan
                                            </a>
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Token Packages */}
                            <div className="p-3 sm:p-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    {TOKEN_PACKAGES.map((pkg) => (
                                        <div
                                            key={pkg.id}
                                            className={`relative group p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 ${pkg.popular
                                                    ? 'border-[#14F195] bg-gradient-to-br from-[#14F195]/10 to-[#9945FF]/10'
                                                    : 'border-white/10 bg-white/5 hover:border-[#9945FF]/50'
                                                }`}
                                        >
                                            {pkg.popular && (
                                                <div className="absolute -top-2 sm:-top-3 left-1/2 -translate-x-1/2 px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-[#14F195] to-[#9945FF] rounded-full">
                                                    <span className="text-[10px] sm:text-xs font-black text-black uppercase">Most Popular</span>
                                                </div>
                                            )}

                                            <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
                                                {/* Token Amount */}
                                                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#9945FF]/20 to-[#14F195]/20 border border-white/10 flex items-center justify-center">
                                                    <Coins className="text-[#14F195]" size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl sm:text-3xl font-black text-white font-mono">{pkg.tokens}</h3>
                                                    <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider mt-1">Tokens</p>
                                                </div>

                                                {/* Price */}
                                                <div className="flex items-center gap-1.5 sm:gap-2">
                                                    <Wallet className="text-[#9945FF]" size={14} />
                                                    <span className="text-base sm:text-xl font-bold text-white font-mono">
                                                        {pkg.price} {pkg.currency}
                                                    </span>
                                                </div>

                                                {/* Purchase Button */}
                                                <button
                                                    onClick={() => handlePurchase(pkg)}
                                                    disabled={isProcessing || !!errorMessage}
                                                    className={`w-full py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold uppercase text-xs sm:text-sm tracking-wider transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${selectedPackage?.id === pkg.id && isProcessing
                                                            ? 'bg-yellow-500 text-black animate-pulse'
                                                            : selectedPackage?.id === pkg.id && purchaseSuccess
                                                                ? 'bg-green-500 text-white'
                                                                : pkg.popular
                                                                    ? 'bg-gradient-to-r from-[#14F195] to-[#9945FF] text-black hover:shadow-[0_0_30px_rgba(20,241,149,0.5)]'
                                                                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                                                        }`}
                                                >
                                                    {selectedPackage?.id === pkg.id && isProcessing ? (
                                                        'Processing...'
                                                    ) : selectedPackage?.id === pkg.id && purchaseSuccess ? (
                                                        <span className="flex items-center justify-center gap-2">
                                                            <Check size={16} />
                                                            Success!
                                                        </span>
                                                    ) : (
                                                        'Purchase Now'
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Info Footer */}
                                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg sm:rounded-xl">
                                    <p className="text-[10px] sm:text-xs text-purple-300 text-center font-mono leading-relaxed">
                                        🔗 <strong>Real Blockchain:</strong> Transactions use Ethereum Sepolia testnet. Get free testnet ETH from faucets.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
