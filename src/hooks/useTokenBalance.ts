import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@/contexts/WalletContext";

export function useTokenBalance() {
  const { walletProfile, isConnected } = useWallet();
  const [balance, setBalance] = useState<number>(0);
  const [totalEarned, setTotalEarned] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!walletProfile?.handle) return;
    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("wallet_handle", walletProfile.handle)
        .maybeSingle();
      if (!profile) {
        setBalance(0);
        setTotalEarned(0);
        return;
      }
      const { data } = await supabase
        .from("token_balances")
        .select("balance, total_earned")
        .eq("user_id", profile.id)
        .maybeSingle();
      setBalance(Number(data?.balance ?? 0));
      setTotalEarned(Number(data?.total_earned ?? 0));
    } catch (err) {
      console.error("Failed to fetch token balance:", err);
    } finally {
      setLoading(false);
    }
  }, [walletProfile?.handle]);

  useEffect(() => {
    if (isConnected && walletProfile?.handle) fetch();
  }, [isConnected, walletProfile?.handle, fetch]);

  return { balance, totalEarned, loading, refresh: fetch };
}
