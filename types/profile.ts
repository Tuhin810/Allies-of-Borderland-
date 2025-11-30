export type LoginType = 'wallet' | 'google';

export interface BorderlandProfile {
  id: string;
  username: string;
  avatarSeed: string;
  invitationCode: string;
  invitationLink: string;
  walletAddress?: string;
  walletBalance?: number;
  walletMoney?: number;
  accountStatus: 'active' | 'suspended';
  accountAddress?: string;
  loginType: LoginType;
  loginTag: LoginType;
  createdAt: number;
  updatedAt: number;
}

export interface ProfileFormInput {
  username: string;
  avatarSeed: string;
  invitationCode: string;
  accountStatus: 'active' | 'suspended';
}
