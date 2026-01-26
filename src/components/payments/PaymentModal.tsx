import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CreditCard, Coins, Bitcoin, ArrowRightLeft } from 'lucide-react';
import { usePayments, PaymentType, Currency } from '@/hooks/usePayments';
import { useWallet } from '@/contexts/WalletContext';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentType?: PaymentType;
  suggestedAmount?: number;
  onPaymentComplete?: () => void;
}

export function PaymentModal({
  open,
  onOpenChange,
  paymentType = 'token_purchase',
  suggestedAmount,
  onPaymentComplete,
}: PaymentModalProps) {
  const { walletProfile } = useWallet();
  const {
    isProcessing,
    exchangeRates,
    fetchExchangeRates,
    convertCurrency,
    initializePaystackPayment,
    redeemTokens,
  } = usePayments();

  const [activeTab, setActiveTab] = useState<'buy' | 'redeem'>('buy');
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState(suggestedAmount?.toString() || '');
  const [targetCurrency, setTargetCurrency] = useState<'SAT' | 'BSV'>('SAT');
  const [walletAddress, setWalletAddress] = useState(walletProfile?.handle || '');

  useEffect(() => {
    if (open) {
      fetchExchangeRates();
      if (walletProfile?.handle) {
        setWalletAddress(walletProfile.handle);
      }
    }
  }, [open, fetchExchangeRates, walletProfile]);

  const handleBuyTokens = async () => {
    if (!email || !amount || !walletProfile?.handle) return;

    await initializePaystackPayment(
      email,
      parseFloat(amount),
      walletProfile.handle,
      paymentType
    );

    onPaymentComplete?.();
  };

  const handleRedeemTokens = async () => {
    if (!amount || !walletProfile?.handle || !walletAddress) return;

    await redeemTokens(
      walletProfile.handle,
      parseFloat(amount),
      targetCurrency,
      walletAddress
    );

    onPaymentComplete?.();
    onOpenChange(false);
  };

  const getConversionPreview = () => {
    if (!amount || !exchangeRates) return null;
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return null;

    if (activeTab === 'buy') {
      const t2pAmount = convertCurrency(numAmount, 'NGN', 'T2P');
      return t2pAmount ? `≈ ${t2pAmount.toLocaleString()} T2P` : null;
    } else {
      const convertedAmount = convertCurrency(numAmount, 'T2P', targetCurrency);
      return convertedAmount ? `≈ ${convertedAmount.toLocaleString()} ${targetCurrency}` : null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            T2P Token Exchange
          </DialogTitle>
          <DialogDescription>
            Buy T2P tokens with Naira or redeem them for crypto
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'buy' | 'redeem')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buy" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Buy T2P
            </TabsTrigger>
            <TabsTrigger value="redeem" className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              Redeem
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buy" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span className="text-green-600">₦</span> Pay with Naira
                </CardTitle>
                <CardDescription>
                  Powered by Paystack • Secure payment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (NGN)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="1000"
                    min="100"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  {getConversionPreview() && (
                    <p className="text-sm text-muted-foreground">
                      {getConversionPreview()}
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleBuyTokens}
                  disabled={isProcessing || !email || !amount}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pay ₦{amount || '0'}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="redeem" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bitcoin className="h-4 w-4 text-orange-500" />
                  Redeem for Crypto
                </CardTitle>
                <CardDescription>
                  Convert your T2P tokens to Satoshis or BSV
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="t2p-amount">T2P Amount</Label>
                  <Input
                    id="t2p-amount"
                    type="number"
                    placeholder="100"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target-currency">Convert To</Label>
                  <Select
                    value={targetCurrency}
                    onValueChange={(v) => setTargetCurrency(v as 'SAT' | 'BSV')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SAT">Satoshis (SAT)</SelectItem>
                      <SelectItem value="BSV">Bitcoin SV (BSV)</SelectItem>
                    </SelectContent>
                  </Select>
                  {getConversionPreview() && (
                    <p className="text-sm text-muted-foreground">
                      {getConversionPreview()}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wallet-address">Destination Wallet</Label>
                  <Input
                    id="wallet-address"
                    placeholder="Your BSV wallet address or $handle"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleRedeemTokens}
                  disabled={isProcessing || !amount || !walletAddress}
                  className="w-full"
                  variant="secondary"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="mr-2 h-4 w-4" />
                      Redeem {amount || '0'} T2P
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {exchangeRates && (
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Current rates: 1 NGN = {exchangeRates.NGN?.T2P || 0.1} T2P • 
            1 T2P = {exchangeRates.T2P?.SAT || 0.01} SAT
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
