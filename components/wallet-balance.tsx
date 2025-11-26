'use client';

import { useEffect } from 'react';
import { Coins, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/lib/hooks/use-wallet';

interface WalletBalanceProps {
  className?: string;
  showAddCredits?: boolean;
}

export function WalletBalance({ className = '', showAddCredits = true }: WalletBalanceProps) {
  const { balance, isLoading, error, refresh } = useWallet();

  // Poll for balance updates every 5 seconds to catch changes from generation
  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, 5000);

    return () => clearInterval(interval);
  }, [refresh]);

  const handleAddCredits = () => {
    // TODO: Implement Stripe payment flow
    alert('Credit purchase coming soon!');
  };

  if (error) {
    return (
      <div className={`flex items-center gap-2 rounded-lg border border-red-900/50 bg-red-950/20 px-3 py-2 ${className}`}>
        <AlertCircle className="h-4 w-4 text-red-400" />
        <span className="text-sm text-red-400">{error}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2">
        <Coins className="h-5 w-5 text-yellow-500" />
        <div className="flex flex-col">
          <span className="text-xs text-slate-400">Credits</span>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
          ) : (
            <span className="text-lg font-bold text-white">{balance ?? 0}</span>
          )}
        </div>
      </div>

      {showAddCredits && !isLoading && (
        <Button
          onClick={handleAddCredits}
          variant="outline"
          size="sm"
          className="border-blue-700 text-blue-400 hover:bg-blue-950/50"
        >
          Add Credits
        </Button>
      )}
    </div>
  );
}
