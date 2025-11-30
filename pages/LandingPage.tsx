import React from 'react';
import LandingView from '../components/LandingView';

interface LandingPageProps {
  onConnectWallet: () => void;
  onGuestEnter: () => void;
  onGoogleLogin?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onConnectWallet, onGuestEnter, onGoogleLogin }) => {
  return <LandingView onConnectWallet={onConnectWallet} onGuestEnter={onGuestEnter} onGoogleLogin={onGoogleLogin} />;
};

export default LandingPage;
