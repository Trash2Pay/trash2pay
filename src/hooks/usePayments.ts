import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type PaymentType =
  | 'waste_disposal'
  | 'waste_processing'
  | 'waste_recycling'
  | 'token_purchase'
  | 'token_redemption'
  | 'service_fee';

export type Currency = 'NGN' | 'T2P' | 'SAT' | 'BSV';

interface ExchangeRates {
  [from: string]: {
    [to: string]: number;
  };
}

export function usePayments() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [exchangeRates, setExchangeRates] =
    useState<ExchangeRates | null>(null);

  const { toast } = useToast();

  // =========================
  // EXCHANGE RATES
  // =========================
  const fetchExchangeRates = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        'get-exchange-rates'
      );

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setExchangeRates(data.rates);
      return data.rates;
    } catch (err) {
      console.error('Failed to fetch exchange rates:', err);
      return null;
    }
  }, []);

  const convertCurrency = useCallback(
    (amount: number, from: Currency, to: Currency): number | null => {
      if (from === to) return amount;
      if (!exchangeRates) return null;

      const rate = exchangeRates[from]?.[to];
      if (!rate) return null;

      return amount * rate;
    },
    [exchangeRates]
  );

  // =========================
  // PAYSTACK INIT (REDIRECT)
  // =========================
  const initializePaystackPayment = useCallback(
    async (
      email: string,
      amountNGN: number,
      walletHandle: string,
      paymentType: PaymentType,
      metadata?: Record<string, unknown>
    ) => {
      setIsProcessing(true);

      try {
        const { data, error } = await supabase.functions.invoke(
          'paystack-initialize',
          {
            body: {
              email,
              amount: amountNGN,
              walletHandle,
              paymentType,
              metadata,
            },
          }
        );

        if (error) throw error;
        if (data.error) throw new Error(data.error);

        if (!data?.authorization_url) {
          throw new Error('No authorization URL returned from Paystack');
        }

        // ✅ Redirect to Paystack
        window.location.href = data.authorization_url;
        return;
      } catch (err) {
        console.error('Paystack payment error:', err);

        setIsProcessing(false);

        toast({
          title: 'Payment Failed',
          description:
            err instanceof Error
              ? err.message
              : 'Failed to initialize payment',
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  // =========================
  // VERIFY PAYMENT
  // =========================
  const verifyPaystackPayment = useCallback(
    async (reference: string) => {
      try {
        const { data, error } = await supabase.functions.invoke(
          'paystack-verify',
          {
            body: { reference },
          }
        );

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
          description:
            err instanceof Error
              ? err.message
              : 'Failed to verify payment',
          variant: 'destructive',
        });

        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [toast]
  );

  // =========================
  // TOKEN REDEMPTION
  // =========================
  const redeemTokens = useCallback(
    async (
      walletHandle: string,
      t2pAmount: number,
      targetCurrency: 'SAT' | 'BSV',
      walletAddress: string
    ) => {
      setIsProcessing(true);

      try {
        const { data, error } = await supabase.functions.invoke(
          'redeem-tokens',
          {
            body: {
              walletHandle,
              t2pAmount,
              targetCurrency,
              walletAddress,
            },
          }
        );

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
          description:
            err instanceof Error
              ? err.message
              : 'Failed to redeem tokens',
          variant: 'destructive',
        });

        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [toast]
  );

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