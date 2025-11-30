import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Icons } from '../components/Icons';
import { useAuth } from '../contexts/AuthContext';
import { ProfileFormInput } from '../types/profile';

const generateSeed = () => `citizen-${Math.floor(Math.random() * 999999)}`;

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile, saveProfile, needsProfileSetup, solanaProfile, loginType, firebaseUser } = useAuth();
  const [formState, setFormState] = useState<ProfileFormInput>({
    username: profile?.username || firebaseUser?.displayName || 'Borderland Citizen',
    avatarSeed: profile?.avatarSeed || solanaProfile?.address || firebaseUser?.uid || generateSeed(),
    invitationCode: profile?.invitationCode || `JACK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    accountStatus: profile?.accountStatus || 'active',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  useEffect(() => {
    setFormState({
      username: profile?.username || firebaseUser?.displayName || 'Borderland Citizen',
      avatarSeed: profile?.avatarSeed || solanaProfile?.address || firebaseUser?.uid || generateSeed(),
      invitationCode: profile?.invitationCode || `JACK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      accountStatus: profile?.accountStatus || 'active',
    });
  }, [profile, firebaseUser, solanaProfile]);

  const invitationLink = useMemo(() => {
    const code = formState.invitationCode.trim();
    if (!code) return '';
    if (typeof window === 'undefined') return `/invite/${code}`;
    return `${window.location.origin}/invite/${code}`;
  }, [formState.invitationCode]);

  const walletDisplay = useMemo(() => {
    const value = solanaProfile?.balance ?? profile?.walletBalance ?? 0;
    return value.toFixed(2);
  }, [profile?.walletBalance, solanaProfile?.balance]);

  const accountAddress = profile?.accountAddress || solanaProfile?.address || firebaseUser?.email || 'Pending';

  const handleChange = (field: keyof ProfileFormInput) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleRandomizeAvatar = () => {
    setFormState((prev) => ({ ...prev, avatarSeed: generateSeed() }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setStatusMessage('');
    try {
      await saveProfile(formState);
      setStatusMessage('Profile saved successfully.');
      if (needsProfileSetup || searchParams.get('setup')) {
        navigate('/arena', { replace: true });
      }
    } catch (err: any) {
      console.error('Failed to save profile', err);
      setStatusMessage(err?.message || 'Something went wrong.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 pb-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center text-2xl font-black">
            <Icons.UserPlus />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-[#14F195] font-mono">Identity Protocol</p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">Borderland Profile</h1>
          </div>
        </div>

        {needsProfileSetup && (
          <div className="mb-8 p-4 border border-[#14F195]/40 rounded-2xl bg-[#14F195]/10 text-sm text-[#14F195] font-mono">
            Welcome agent. Complete your dossier to enter the arena.
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          <form onSubmit={handleSubmit} className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl space-y-6">
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-gray-400 font-mono">Username</label>
              <input
                value={formState.username}
                onChange={handleChange('username')}
                className="mt-2 w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-[#14F195]"
                placeholder="Choose your alias"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs uppercase tracking-[0.3em] text-gray-400 font-mono">Avatar Seed</label>
                <button type="button" onClick={handleRandomizeAvatar} className="text-xs text-[#14F195] uppercase tracking-[0.2em]">Randomize</button>
              </div>
              <input
                value={formState.avatarSeed}
                onChange={handleChange('avatarSeed')}
                className="mt-2 w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-[#14F195]"
                placeholder="pixel-agent-404"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-gray-400 font-mono">Invitation Code</label>
              <input
                value={formState.invitationCode}
                onChange={handleChange('invitationCode')}
                className="mt-2 w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-[#9945FF]"
                placeholder="JACK-XXXXXX"
                required
              />
              {invitationLink && (
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                  <span>{invitationLink}</span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(invitationLink)}
                    className="text-[#14F195] uppercase tracking-[0.2em]"
                  >
                    Copy
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-gray-400 font-mono">Account Status</label>
              <select
                value={formState.accountStatus}
                onChange={handleChange('accountStatus')}
                className="mt-2 w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-[#14F195] text-white"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-4 rounded-2xl bg-[#9945FF] text-white font-bold uppercase tracking-[0.4em] hover:bg-[#14F195] transition-all"
            >
              {isSaving ? 'Saving…' : 'Save Profile'}
            </button>
            {statusMessage && <p className="text-xs text-gray-400 font-mono">{statusMessage}</p>}
          </form>

          <div className="p-6 rounded-3xl border border-white/5 bg-black/60 backdrop-blur-xl space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#9945FF] to-[#14F195] p-[3px]">
                <img
                  src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(formState.avatarSeed)}`}
                  alt="Avatar preview"
                  className="w-full h-full rounded-3xl bg-black"
                />
              </div>
              <div>
                <p className="text-sm text-gray-400 font-mono uppercase tracking-[0.3em]">Status</p>
                <h2 className="text-3xl font-black">{formState.username}</h2>
                <p className="text-xs text-gray-500 font-mono tracking-widest">{loginType === 'google' ? 'Google Login' : 'Wallet Login'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm font-mono">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-gray-500 uppercase tracking-[0.3em]">Wallet</p>
                <p className="text-white text-xl">{walletDisplay} SOL</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-gray-500 uppercase tracking-[0.3em]">Account</p>
                <p className="text-white text-sm break-words">{accountAddress}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 col-span-2">
                <p className="text-gray-500 uppercase tracking-[0.3em]">Invitation Link</p>
                <p className="text-white text-sm break-words">{invitationLink || 'Set a code to unlock your invite link.'}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/arena')}
              className="w-full py-3 rounded-2xl border border-white/10 text-sm uppercase tracking-[0.3em] hover:bg-white/10"
            >
              Back to Arena
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
