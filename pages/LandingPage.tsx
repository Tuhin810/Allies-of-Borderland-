import React from 'react';
import LandingView from '../components/LandingView';

interface LandingPageProps {
  onConnectWallet: () => void;
  onGuestEnter: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onConnectWallet, onGuestEnter }) => {
  return <LandingView onConnectWallet={onConnectWallet} onGuestEnter={onGuestEnter} />;
};

export default LandingPage;
