import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { ConnectWalletModal } from './ConnectWalletModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, Leaf, Coins, Shield, Loader2 } from 'lucide-react';

interface WalletGateProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'collector' | 'processor';
}

export const WalletGate: React.FC<WalletGateProps> = ({ children, requiredRole }) => {
  const { session, loading: authLoading } = useAuth();
  const { isConnected, isConnecting, userRole, loadingProfile } = useWallet();
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  // Redirect unauthenticated users to /auth
  useEffect(() => {
    if (!authLoading && !session) navigate('/auth');
  }, [authLoading, session, navigate]);

  // Once wallet is connected, redirect to role selection if no role
  useEffect(() => {
    if (session && !loadingProfile && isConnected && !userRole) {
      navigate('/select-role');
    }
  }, [session, loadingProfile, isConnected, userRole, navigate]);

  // Enforce required role
  useEffect(() => {
    if (session && isConnected && userRole && requiredRole && userRole !== requiredRole) {
      if (userRole === 'user') navigate('/dashboard');
      else if (userRole === 'collector') navigate('/collector');
      else if (userRole === 'processor') navigate('/processor');
    }
  }, [session, isConnected, userRole, requiredRole, navigate]);

  if (authLoading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return null;

  if (isConnected && userRole) {
    if (!requiredRole || userRole === requiredRole) return <>{children}</>;
    return null;
  }

  // Authenticated but wallet not connected — show connect prompt
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-eco flex items-center justify-center">
                <Leaf className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-gradient-eco">Trash2Pay</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 rounded-2xl gradient-eco flex items-center justify-center mx-auto mb-6 animate-float">
            <Wallet className="w-10 h-10 text-primary-foreground" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Connect Your <span className="text-gradient-eco">BSV Wallet</span>
          </h1>

          <p className="text-lg text-muted-foreground mb-8">
            You're signed in! Now connect a BSV wallet to receive T2P Unit rewards.
          </p>

          <Button size="lg" onClick={() => setShowModal(true)} disabled={isConnecting}
            className="gradient-eco border-0 hover:opacity-90 text-lg px-8 py-6">
            <Wallet className="w-5 h-5 mr-2" />
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
            <Card className="gradient-card border-border/50">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Coins className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Earn Tokens</h3>
                <p className="text-sm text-muted-foreground">Receive T2P Units directly to your wallet for every pickup</p>
              </CardContent>
            </Card>
            <Card className="gradient-card border-border/50">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-eco-leaf/10 flex items-center justify-center mx-auto mb-4">
                  <Leaf className="w-6 h-6 text-eco-leaf" />
                </div>
                <h3 className="font-semibold mb-2">Track Impact</h3>
                <p className="text-sm text-muted-foreground">Monitor your environmental contribution in real-time</p>
              </CardContent>
            </Card>
            <Card className="gradient-card border-border/50">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-eco-sky/10 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-eco-sky" />
                </div>
                <h3 className="font-semibold mb-2">Secure & Private</h3>
                <p className="text-sm text-muted-foreground">Your wallet data stays secure with BSV blockchain</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <ConnectWalletModal open={showModal} onOpenChange={setShowModal} />
    </div>
  );
};
