import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { walletManager } from "@/lib/wallet";

// GET /api/wallet - Get user's wallet balance
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const balance = await walletManager.getBalance(user.id);

    return NextResponse.json({
      userId: user.id,
      balance,
    });
  } catch (error) {
    console.error("Failed to get wallet:", error);
    return NextResponse.json(
      { error: "Failed to get wallet" },
      { status: 500 }
    );
  }
}

// POST /api/wallet/purchase - Add credits (placeholder for Stripe integration)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const amount = body?.amount;

    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    // TODO: Integrate with Stripe for actual payments
    // For now, just add credits directly (for testing)
    const newBalance = await walletManager.addCredits(user.id, amount);

    return NextResponse.json({
      userId: user.id,
      balance: newBalance,
      creditsAdded: amount,
    });
  } catch (error) {
    console.error("Failed to purchase credits:", error);
    return NextResponse.json(
      { error: "Failed to purchase credits" },
      { status: 500 }
    );
  }
}
