import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: NextRequest) {
    try {
        const { userId, amount } = await req.json();

        if (!userId || !amount) {
            return NextResponse.json({ success: false, error: 'Missing userId or amount' }, { status: 400 });
        }

        if (supabaseUrl && supabaseServiceKey) {
            const supabase = createClient(supabaseUrl, supabaseServiceKey);

            const { data: wallet } = await supabase
                .from('wallets')
                .select('balance')
                .eq('user_id', userId)
                .single();

            if (wallet) {
                await supabase
                    .from('wallets')
                    .update({ balance: wallet.balance + amount })
                    .eq('user_id', userId);
            } else {
                await supabase
                    .from('wallets')
                    .insert({ user_id: userId, balance: amount, reserved: 0 });
            }
        }

        return NextResponse.json({ success: true, message: `Added ${amount} credits` });
    } catch (error) {
        console.error('Top up error:', error);
        return NextResponse.json({ success: false, error: 'Failed to top up' }, { status: 500 });
    }
}
