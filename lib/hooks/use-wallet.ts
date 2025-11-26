"use client";

import { useState, useCallback, useEffect } from "react";

interface UseWalletReturn {
  balance: number | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addCredits: (amount: number) => Promise<boolean>;
}

export function useWallet(): UseWalletReturn {
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/wallet");
      if (!res.ok) {
        if (res.status === 401) {
          // Not logged in, use default
          setBalance(100);
          return;
        }
        throw new Error("Failed to fetch wallet");
      }

      const data = await res.json();
      setBalance(data.balance);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      // Fallback to demo balance
      setBalance(100);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addCredits = useCallback(async (amount: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      if (!res.ok) {
        throw new Error("Failed to add credits");
      }

      const data = await res.json();
      setBalance(data.balance);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch balance on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    balance,
    isLoading,
    error,
    refresh,
    addCredits,
  };
}
