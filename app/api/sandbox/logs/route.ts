import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { e2bManager } from '@/lib/e2b-manager';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const projectId = searchParams.get('projectId');

        if (!projectId) {
            return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
        }

        const sandbox = await e2bManager.getSandbox(projectId);

        if (!sandbox) {
            return NextResponse.json({ error: 'Sandbox not found' }, { status: 404 });
        }

        return NextResponse.json({
            logs: sandbox.logs
        });

    } catch (error) {
        console.error('[Sandbox Logs] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
