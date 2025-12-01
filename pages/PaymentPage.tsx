import React, { useState } from 'react';
import { Coins, X, Check, Wallet, Sparkles, AlertCircle } from 'lucide-react';
import { useTokens } from '../contexts/TokenContext';
import { web3Service } from '../services/web3';
import { ECONOMY } from '../constants/economy';
import { useNavigate } from 'react-router-dom';

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

const PaymentPage: React.FC = () => {
    const { tokenBalance, addTokens } = useTokens();
    const navigate = useNavigate();
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

            // Reset state after success animation
            setTimeout(() => {
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
        <div className="min-h-screen bg-black pt-24 pb-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-4xl mx-auto">
                <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-black/95 backdrop-blur-xl border-b border-white/10 p-6 sm:p-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center flex-shrink-0">
                                    <Sparkles className="text-white" size={24} />
                                </div>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">Token Shop</h1>
                                    <p className="text-sm text-gray-400 font-mono">Ethereum Sepolia Testnet</p>
                                </div>
                            </div>
                            {/* <button
                                onClick={() => navigate(-1)}
                                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                aria-label="Close"
                            >
                                <X className="text-gray-400 hover:text-white" size={24} />
                            </button> */}
                        </div>

                        {/* Current Balance */}
                        <div className="mt-6 p-4 sm:p-6 bg-white/5 rounded-xl border border-white/10">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-400 font-mono">Current Balance</span>
                                <div className="flex items-center gap-2">
                                    <Coins className="text-[#14F195]" size={20} />
                                    <span className="text-2xl sm:text-3xl font-black text-white font-mono">{tokenBalance}</span>
                                    <span className="text-sm text-gray-400">tokens</span>
                                </div>
                            </div>
                        </div>

                        {/* Error Message */}
                        {errorMessage && (
                            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
                                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                                <p className="text-sm text-red-300">{errorMessage}</p>
                            </div>
                        )}

                        {/* Success Message with TX Hash */}
                        {txHash && purchaseSuccess && (
                            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
                                <p className="text-sm text-green-300 text-center">
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
                    <div className="p-6 sm:p-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            {TOKEN_PACKAGES.map((pkg) => (
                                <div
                                    key={pkg.id}
                                    className={`relative group p-6 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 ${pkg.popular
                                        ? 'border-[#14F195] bg-gradient-to-br from-[#14F195]/10 to-[#9945FF]/10'
                                        : 'border-white/10 bg-white/5 hover:border-[#9945FF]/50'
                                        }`}
                                >
                                    {pkg.popular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-[#14F195] to-[#9945FF] rounded-full">
                                            <span className="text-xs font-black text-black uppercase">Most Popular</span>
                                        </div>
                                    )}

                                    <div className="flex flex-col items-center text-center space-y-4">
                                        {/* Token Amount */}
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#9945FF]/20 to-[#14F195]/20 border border-white/10 flex items-center justify-center">
                                            <Coins className="text-[#14F195]" size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black text-white font-mono">{pkg.tokens}</h3>
                                            <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">Tokens</p>
                                        </div>

                                        {/* Price */}
                                        <div className="flex items-center gap-2">
                                            <Wallet className="text-[#9945FF]" size={16} />
                                            <span className="text-xl font-bold text-white font-mono">
                                                {pkg.price} {pkg.currency}
                                            </span>
                                        </div>

                                        {/* Purchase Button */}
                                        <button
                                            onClick={() => handlePurchase(pkg)}
                                            disabled={isProcessing || !!errorMessage}
                                            className={`w-full py-3 rounded-xl font-bold uppercase text-sm tracking-wider transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${selectedPackage?.id === pkg.id && isProcessing
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
                                                    <Check size={18} />
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
                        <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                            <p className="text-xs text-purple-300 text-center font-mono leading-relaxed">
                                🔗 <strong>Real Blockchain:</strong> Transactions use Ethereum Sepolia testnet. Get free testnet ETH from faucets.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;
