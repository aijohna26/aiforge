import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use service role for server-side wallet operations
const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

// In-memory fallback for development without Supabase
const memoryBalances = new Map<string, { balance: number; reserved: number }>();

const DEFAULT_BALANCE = 100;

class WalletManager {
  async getBalance(userId: string): Promise<number> {
    if (supabase) {
      const { data } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", userId)
        .single();

      if (!data) {
        // Create wallet with default balance
        await this.ensureWallet(userId);
        return DEFAULT_BALANCE;
      }
      return data.balance;
    }

    // In-memory fallback
    return this.ensureMemory(userId).balance;
  }

  async reserve(userId: string, amount: number): Promise<boolean> {
    if (supabase) {
      await this.ensureWallet(userId);

      const { data } = await supabase
        .from("wallets")
        .select("balance, reserved")
        .eq("user_id", userId)
        .single();

      if (!data || data.balance - data.reserved < amount) {
        return false;
      }

      await supabase
        .from("wallets")
        .update({ reserved: data.reserved + amount })
        .eq("user_id", userId);

      return true;
    }

    // In-memory fallback
    const entry = this.ensureMemory(userId);
    if (entry.balance - entry.reserved < amount) {
      return false;
    }
    entry.reserved += amount;
    return true;
  }

  async settle(
    userId: string,
    reservedAmount: number,
    actualCost: number
  ): Promise<void> {
    if (supabase) {
      const { data } = await supabase
        .from("wallets")
        .select("balance, reserved")
        .eq("user_id", userId)
        .single();

      if (data) {
        await supabase
          .from("wallets")
          .update({
            reserved: Math.max(data.reserved - reservedAmount, 0),
            balance: Math.max(data.balance - actualCost, 0),
          })
          .eq("user_id", userId);
      }
      return;
    }

    // In-memory fallback
    const entry = this.ensureMemory(userId);
    entry.reserved = Math.max(entry.reserved - reservedAmount, 0);
    entry.balance = Math.max(entry.balance - actualCost, 0);
  }

  async refund(userId: string, amount: number): Promise<void> {
    if (supabase) {
      const { data } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", userId)
        .single();

      if (data) {
        await supabase
          .from("wallets")
          .update({ balance: data.balance + amount })
          .eq("user_id", userId);
      }
      return;
    }

    // In-memory fallback
    const entry = this.ensureMemory(userId);
    entry.balance += amount;
  }

  async addCredits(userId: string, amount: number): Promise<number> {
    if (supabase) {
      await this.ensureWallet(userId);

      const { data } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", userId)
        .single();

      const newBalance = (data?.balance ?? 0) + amount;

      await supabase
        .from("wallets")
        .update({ balance: newBalance })
        .eq("user_id", userId);

      return newBalance;
    }

    // In-memory fallback
    const entry = this.ensureMemory(userId);
    entry.balance += amount;
    return entry.balance;
  }

  async resetReserved(userId: string): Promise<void> {
    if (supabase) {
      await supabase
        .from("wallets")
        .update({ reserved: 0 })
        .eq("user_id", userId);
      return;
    }

    const entry = this.ensureMemory(userId);
    entry.reserved = 0;
  }

  private async ensureWallet(userId: string): Promise<void> {
    if (!supabase) return;

    const { data } = await supabase
      .from("wallets")
      .select("user_id")
      .eq("user_id", userId)
      .single();

    if (!data) {
      await supabase.from("wallets").insert({
        user_id: userId,
        balance: DEFAULT_BALANCE,
        reserved: 0,
      });
    }
  }

  private ensureMemory(userId: string) {
    let entry = memoryBalances.get(userId);
    if (!entry) {
      entry = { balance: DEFAULT_BALANCE, reserved: 0 };
      memoryBalances.set(userId, entry);
    }
    return entry;
  }
}

export const walletManager = new WalletManager();

// SQL to create the wallets table in Supabase:
/*
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 100,
  reserved INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Users can read their own wallet
CREATE POLICY "Users can read own wallet" ON wallets
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role can modify wallets
CREATE POLICY "Service role can manage wallets" ON wallets
  FOR ALL USING (auth.role() = 'service_role');

-- Create index
CREATE INDEX idx_wallets_user_id ON wallets(user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wallets_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
*/
