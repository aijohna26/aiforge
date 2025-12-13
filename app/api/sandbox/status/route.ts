import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { daytonaManager } from '@/lib/daytona-manager';
import { e2bManager } from '@/lib/e2b-manager';

const SANDBOX_PROVIDER = process.env.SANDBOX_PROVIDER || 'e2b';

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

        // Get sandbox instance from the configured provider
        const manager = SANDBOX_PROVIDER === 'e2b' ? e2bManager : daytonaManager;
        const sandbox = await manager.getSandbox(projectId);
        console.log(`[Sandbox Status] Looking up ${SANDBOX_PROVIDER} sandbox for projectId: ${projectId}, found:`, sandbox ? 'YES' : 'NO');

        if (!sandbox) {
            return NextResponse.json({
                error: 'Sandbox not found',
                message: 'No sandbox exists for this project. Please create one first.',
                projectId
            }, { status: 404 });
        }

        // For E2B, URL is always available immediately
        // The Expo server takes time to start, but the URL is valid
        if (SANDBOX_PROVIDER === 'e2b') {
            return NextResponse.json({
                ready: true, // URL is ready, even if Expo is still starting
                url: sandbox.url,
                status: sandbox.status,
                provider: 'e2b'
            });
        }

        // For Daytona, check if tunnel URL is ready
        const tunnelUrl = (sandbox as any).tunnelUrl;

        // Valid URL means it's ready
        if (tunnelUrl &&
            tunnelUrl.startsWith('http') &&
            !tunnelUrl.includes('localhost') &&
            tunnelUrl !== 'initializing' &&
            tunnelUrl !== 'pending') {

            return NextResponse.json({
                ready: true,
                url: tunnelUrl,
                status: sandbox.status,
                provider: 'daytona'
            });
        }

        // Still initializing
        return NextResponse.json({
            ready: false,
            message: 'Tunnel URL is being provisioned...',
            status: sandbox.status,
            provider: 'daytona'
        });

    } catch (error) {
        console.error('[Sandbox Status] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
