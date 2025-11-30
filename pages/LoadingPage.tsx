import React from 'react';
import { Icons } from '../components/Icons';

const LoadingPage: React.FC = () => (
  <div className="h-screen bg-black flex items-center justify-center">
    <div className="flex flex-col items-center">
      <Icons.Activity className="w-12 h-12 text-[#9945FF] animate-spin mb-4" />
      <p className="text-gray-400 font-mono animate-pulse">Establishing Secure Channel...</p>
    </div>
  </div>
);

export default LoadingPage;
