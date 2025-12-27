import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type WalletType = 'handcash' | 'electrumsv';
export type UserRole = 'user' | 'collector' | null;

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
  connectHandCash: () => Promise<void>;
  connectElectrumSV: (address: string) => Promise<void>;
  disconnect: () => void;
  setUserRole: (role: UserRole) => void;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletProfile, setWalletProfile] = useState<WalletProfile | null>(null);
  const [userRole, setUserRoleState] = useState<UserRole>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for stored wallet and role on mount
  useEffect(() => {
    const storedWallet = localStorage.getItem('bsv_wallet');
    const storedRole = localStorage.getItem('user_role') as UserRole;
    
    if (storedWallet) {
      try {
        const profile = JSON.parse(storedWallet);
        setWalletProfile(profile);
        setIsConnected(true);
        if (storedRole) {
          setUserRoleState(storedRole);
        }
      } catch (e) {
        localStorage.removeItem('bsv_wallet');
      }
    }
  }, []);

  // Listen for HandCash OAuth callback
  useEffect(() => {
    const handleAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const authToken = urlParams.get('authToken');
      
      if (authToken) {
        setIsConnecting(true);
        setError(null);
        
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

          setWalletProfile(profile);
          setIsConnected(true);
          setIsNewUser(true); // Mark as new user to trigger role selection
          localStorage.setItem('bsv_wallet', JSON.stringify(profile));
          localStorage.setItem('handcash_auth_token', authToken);
          
          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (err: any) {
          console.error('Wallet connection error:', err);
          setError(err.message || 'Failed to connect wallet');
        } finally {
          setIsConnecting(false);
        }
      }
    };

    handleAuthCallback();
  }, []);

  const connectHandCash = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('handcash-auth', {
        body: { action: 'get-redirect-url' },
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      // Redirect to HandCash authorization
      window.location.href = data.redirectUrl;
    } catch (err: any) {
      console.error('Connect wallet error:', err);
      setError(err.message || 'Failed to initiate wallet connection');
      setIsConnecting(false);
    }
  };

  const connectElectrumSV = async (address: string) => {
    setIsConnecting(true);
    setError(null);

    try {
      // Validate BSV address format (basic validation)
      if (!address || address.length < 26 || address.length > 35) {
        throw new Error('Invalid BSV address format');
      }

      const profile: WalletProfile = {
        handle: address,
        displayName: `ElectrumSV (${address.slice(0, 8)}...)`,
        walletType: 'electrumsv',
      };

      setWalletProfile(profile);
      setIsConnected(true);
      setIsNewUser(true); // Mark as new user to trigger role selection
      localStorage.setItem('bsv_wallet', JSON.stringify(profile));
    } catch (err: any) {
      console.error('Connect ElectrumSV error:', err);
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
    if (role) {
      localStorage.setItem('user_role', role);
    } else {
      localStorage.removeItem('user_role');
    }
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        isConnecting,
        walletProfile,
        userRole,
        isNewUser,
        connectHandCash,
        connectElectrumSV,
        disconnect,
        setUserRole,
        error,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
