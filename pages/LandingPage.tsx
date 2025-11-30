import React from 'react';
import LandingView from '../components/LandingView';
import { BorderlandProfile } from '../types/profile';

interface LandingPageProps {
  onConnectWallet: () => void;
  onGuestEnter: () => void;
  onGoogleLogin?: () => void;
  userProfile?: BorderlandProfile | null;
  onGetStarted?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({
  onConnectWallet,
  onGuestEnter,
  onGoogleLogin,
  userProfile,
  onGetStarted
}) => {
  return (
    <LandingView
      onConnectWallet={onConnectWallet}
      onGuestEnter={onGuestEnter}
      onGoogleLogin={onGoogleLogin}
      userProfile={userProfile}
      onGetStarted={onGetStarted}
    />
  );
};

export default LandingPage;
