import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { daytonaManager } from '@/lib/daytona-manager';
import { e2bManager } from '@/lib/e2b-manager';

const SANDBOX_PROVIDER = process.env.SANDBOX_PROVIDER || 'e2b';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { projectId } = await request.json();

        if (!projectId) {
            return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
        }

        const manager = SANDBOX_PROVIDER === 'e2b' ? e2bManager : daytonaManager;

        console.log(`[Sandbox Destroy] Destroying sandbox for projectId: ${projectId}`);
        await manager.destroySandbox(projectId);

        return NextResponse.json({ success: true, message: 'Sandbox destroyed' });

    } catch (error) {
        console.error('[Sandbox Destroy] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
