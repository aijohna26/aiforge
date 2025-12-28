import { json, type ActionFunctionArgs } from '@remix-run/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { userId, amount } = await request.json();

    if (!userId || !amount) {
      return json({ success: false, error: 'Missing userId or amount' }, { status: 400 });
    }

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', userId).single();

      if (wallet) {
        await supabase
          .from('wallets')
          .update({ balance: wallet.balance + amount })
          .eq('user_id', userId);
      } else {
        await supabase.from('wallets').insert({ user_id: userId, balance: amount, reserved: 0 });
      }
    }

    return json({ success: true, message: `Added ${amount} credits` });
  } catch (error) {
    console.error('Top up error:', error);
    return json({ success: false, error: 'Failed to top up' }, { status: 500 });
  }
}
