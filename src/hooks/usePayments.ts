import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PaystackConfig {
  key: string;
  email: string;
  amount: number;
  ref: string;
  onSuccess: (response: { reference: string }) => void;
  onClose: () => void;
}

declare global {
  interface Window {
    PaystackPop: {
      setup: (config: PaystackConfig) => { openIframe: () => void };
    };
  }
}

export type PaymentType = 'waste_disposal' | 'waste_processing' | 'waste_recycling' | 'token_purchase' | 'token_redemption' | 'service_fee';
export type Currency = 'NGN' | 'T2P' | 'SAT' | 'BSV';

interface ExchangeRates {
  [from: string]: {
    [to: string]: number;
  };
}

export function usePayments() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);
  const { toast } = useToast();

  const loadPaystackScript = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (window.PaystackPop) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Paystack'));
      document.body.appendChild(script);
    });
  }, []);

  const fetchExchangeRates = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-exchange-rates');
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      setExchangeRates(data.rates);
      return data.rates;
    } catch (err) {
      console.error('Failed to fetch exchange rates:', err);
      return null;
    }
  }, []);

  const convertCurrency = useCallback((amount: number, from: Currency, to: Currency): number | null => {
    if (from === to) return amount;
    if (!exchangeRates) return null;
    
    const rate = exchangeRates[from]?.[to];
    if (!rate) return null;
    
    return amount * rate;
  }, [exchangeRates]);

  const initializePaystackPayment = useCallback(async (
    email: string,
    amountNGN: number,
    walletHandle: string,
    paymentType: PaymentType,
    metadata?: Record<string, unknown>
  ) => {
    setIsProcessing(true);

    try {
      await loadPaystackScript();

      const { data, error } = await supabase.functions.invoke('paystack-initialize', {
        body: {
          email,
          amount: amountNGN,
          walletHandle,
          paymentType,
          metadata,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Use Paystack popup
      const handler = window.PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_xxxxx', // Will be set via env
        email,
        amount: amountNGN * 100, // Kobo
        ref: data.reference,
        onSuccess: (response: { reference: string }) => {
          verifyPaystackPayment(response.reference);
        },
        onClose: () => {
          setIsProcessing(false);
          toast({
            title: 'Payment Cancelled',
            description: 'You closed the payment window.',
            variant: 'destructive',
          });
        },
      });

      handler.openIframe();
    } catch (err) {
      console.error('Paystack payment error:', err);
      setIsProcessing(false);
      toast({
        title: 'Payment Failed',
        description: err instanceof Error ? err.message : 'Failed to initialize payment',
        variant: 'destructive',
      });
    }
  }, [loadPaystackScript, toast]);

  const verifyPaystackPayment = useCallback(async (reference: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('paystack-verify', {
        body: { reference },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: 'Payment Successful!',
        description: data.message,
      });

      return data;
    } catch (err) {
      console.error('Payment verification error:', err);
      toast({
        title: 'Verification Failed',
        description: err instanceof Error ? err.message : 'Failed to verify payment',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const redeemTokens = useCallback(async (
    walletHandle: string,
    t2pAmount: number,
    targetCurrency: 'SAT' | 'BSV',
    walletAddress: string
  ) => {
    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('redeem-tokens', {
        body: {
          walletHandle,
          t2pAmount,
          targetCurrency,
          walletAddress,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: 'Redemption Submitted!',
        description: data.message,
      });

      return data;
    } catch (err) {
      console.error('Token redemption error:', err);
      toast({
        title: 'Redemption Failed',
        description: err instanceof Error ? err.message : 'Failed to redeem tokens',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  return {
    isProcessing,
    exchangeRates,
    fetchExchangeRates,
    convertCurrency,
    initializePaystackPayment,
    verifyPaystackPayment,
    redeemTokens,
  };
}
