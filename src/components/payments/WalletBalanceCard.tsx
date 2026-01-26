import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, Plus, ArrowRightLeft, TrendingUp, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@/contexts/WalletContext';
import { PaymentModal } from './PaymentModal';

interface WalletBalanceCardProps {
  className?: string;
}

export function WalletBalanceCard({ className }: WalletBalanceCardProps) {
  const { walletProfile, isConnected } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [totalEarned, setTotalEarned] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const fetchBalance = async () => {
    if (!walletProfile?.handle) return;

    setIsLoading(true);
    try {
      // First get the profile ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('wallet_handle', walletProfile.handle)
        .maybeSingle();

      if (!profile) return;

      // Then get the balance
      const { data: balanceData } = await supabase
        .from('token_balances')
        .select('balance, total_earned')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (balanceData) {
        setBalance(balanceData.balance || 0);
        setTotalEarned(balanceData.total_earned || 0);
      } else {
        setBalance(0);
        setTotalEarned(0);
      }
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && walletProfile?.handle) {
      fetchBalance();
    }
  }, [isConnected, walletProfile?.handle]);

  if (!isConnected) return null;

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              T2P Balance
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={fetchBalance}
              disabled={isLoading}
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="text-2xl font-bold">
                {balance !== null ? balance.toLocaleString() : '—'} T2P
              </div>
              {totalEarned !== null && totalEarned > 0 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  Total earned: {totalEarned.toLocaleString()} T2P
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => setIsPaymentModalOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Buy
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => setIsPaymentModalOpen(true)}
              >
                <ArrowRightLeft className="h-3 w-3 mr-1" />
                Redeem
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <PaymentModal
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        onPaymentComplete={fetchBalance}
      />
    </>
  );
}
