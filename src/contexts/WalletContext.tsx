import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export type WalletType = 'handcash' | 'electrumsv';
export type UserRole = 'user' | 'collector' | 'processor' | null;

interface WalletProfile {
  handle: string;
  displayName?: string;
  avatarUrl?: string;
  paymail?: string;
  walletType: WalletType;
}

interface WalletContextType {
  isConnected: boolean;
  isConnecting: boolean;
  walletProfile: WalletProfile | null;
  userRole: UserRole;
  isNewUser: boolean;
  loadingProfile: boolean;
  connectHandCash: () => Promise<void>;
  connectElectrumSV: (address: string) => Promise<void>;
  disconnect: () => void;
  setUserRole: (role: UserRole) => void;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within a WalletProvider');
  return ctx;
};

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, session } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletProfile, setWalletProfile] = useState<WalletProfile | null>(null);
  const [userRole, setUserRoleState] = useState<UserRole>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When auth user changes, fetch their profile + role from DB
  useEffect(() => {
    if (!user) {
      setWalletProfile(null);
      setIsConnected(false);
      setUserRoleState(null);
      return;
    }

    let cancelled = false;
    setLoadingProfile(true);

    (async () => {
      const [{ data: profile }, { data: roleRow }] = await Promise.all([
        supabase.from('profiles').select('wallet_handle, full_name, avatar_url').eq('id', user.id).maybeSingle(),
        supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle(),
      ]);

      if (cancelled) return;

      if (profile?.wallet_handle) {
        // Try to restore wallet type from localStorage
        const stored = localStorage.getItem('bsv_wallet');
        let walletType: WalletType = 'handcash';
        if (stored) {
          try { walletType = (JSON.parse(stored).walletType as WalletType) || 'handcash'; } catch {}
        }
        setWalletProfile({
          handle: profile.wallet_handle,
          displayName: profile.full_name || profile.wallet_handle,
          avatarUrl: profile.avatar_url || undefined,
          walletType,
        });
        setIsConnected(true);
      } else {
        setIsConnected(false);
        setWalletProfile(null);
      }

      if (roleRow?.role) {
        setUserRoleState(roleRow.role as UserRole);
      }
      setLoadingProfile(false);
    })();

    return () => { cancelled = true; };
  }, [user]);

  // HandCash OAuth callback handler — only works if signed in
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authToken = params.get('authToken');
    if (!authToken || !session) return;

    setIsConnecting(true);
    setError(null);

    (async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke('handcash-auth', {
          body: { action: 'verify-token', authToken },
        });
        if (fnError) throw fnError;
        if (data.error) throw new Error(data.error);

        const profile: WalletProfile = {
          handle: data.handle,
          displayName: data.displayName,
          avatarUrl: data.avatarUrl,
          paymail: data.paymail,
          walletType: 'handcash',
        };

        localStorage.setItem('bsv_wallet', JSON.stringify(profile));
        localStorage.setItem('handcash_auth_token', authToken);
        await registerWallet(profile, authToken);
        setWalletProfile(profile);
        setIsConnected(true);
        setIsNewUser(true);
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (err: any) {
        console.error('HandCash callback error:', err);
        setError(err.message || 'Failed to connect wallet');
      } finally {
        setIsConnecting(false);
      }
    })();
  }, [session]);

  const registerWallet = async (profile: WalletProfile, authToken: string | null) => {
    const { data, error: fnError } = await supabase.functions.invoke('register-user', {
      body: {
        authToken,
        walletHandle: profile.handle,
        walletType: profile.walletType,
        displayName: profile.displayName,
      },
    });
    if (fnError) throw fnError;
    if (data?.error) throw new Error(data.error);
  };

  const connectHandCash = async () => {
    if (!session) { setError('Please sign in first'); return; }
    setIsConnecting(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('handcash-auth', {
        body: { action: 'get-redirect-url' },
      });
      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);
      window.location.href = data.redirectUrl;
    } catch (err: any) {
      setError(err.message || 'Failed to start connection');
      setIsConnecting(false);
    }
  };

  const connectElectrumSV = async (address: string) => {
    if (!session) { setError('Please sign in first'); return; }
    setIsConnecting(true);
    setError(null);
    try {
      if (!address || address.length < 26 || address.length > 35) {
        throw new Error('Invalid BSV address format');
      }
      const profile: WalletProfile = {
        handle: address,
        displayName: `ElectrumSV (${address.slice(0, 8)}...)`,
        walletType: 'electrumsv',
      };
      await registerWallet(profile, null);
      localStorage.setItem('bsv_wallet', JSON.stringify(profile));
      setWalletProfile(profile);
      setIsConnected(true);
      setIsNewUser(true);
    } catch (err: any) {
      setError(err.message || 'Failed to connect ElectrumSV wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setWalletProfile(null);
    setIsConnected(false);
    setUserRoleState(null);
    setIsNewUser(false);
    localStorage.removeItem('bsv_wallet');
    localStorage.removeItem('handcash_auth_token');
    localStorage.removeItem('user_role');
  };

  const setUserRole = (role: UserRole) => {
    setUserRoleState(role);
    setIsNewUser(false);
    if (role) localStorage.setItem('user_role', role);
    else localStorage.removeItem('user_role');
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected, isConnecting, walletProfile, userRole, isNewUser, loadingProfile,
        connectHandCash, connectElectrumSV, disconnect, setUserRole, error,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
