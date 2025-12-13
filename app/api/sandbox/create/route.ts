import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { daytonaManager } from "@/lib/daytona-manager";
import { e2bManager } from "@/lib/e2b-manager";
import { PRICING_PLANS } from "@/lib/pricing";

// Choose sandbox provider: 'e2b' or 'daytona'
const SANDBOX_PROVIDER = process.env.SANDBOX_PROVIDER || 'e2b';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const bodyText = await req.text();
        console.log(`[Sandbox API] Raw request body length: ${bodyText.length}`);
        if (bodyText.length < 100) console.log(`[Sandbox API] Body preview: ${bodyText}`);

        if (!bodyText) {
            return NextResponse.json({ error: "Empty request body" }, { status: 400 });
        }

        const { projectId, files } = JSON.parse(bodyText);

        if (!projectId || !files) {
            return NextResponse.json(
                { error: "projectId and files are required" },
                { status: 400 }
            );
        }

        // Get user's subscription
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (!subscription) {
            return NextResponse.json(
                { error: "No subscription found" },
                { status: 403 }
            );
        }

        const plan = subscription.plan_tier as 'free' | 'pro' | 'business';
        const planLimits = PRICING_PLANS[plan].limits;

        // Check usage limits (for free tier)
        if (plan === 'free') {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const { count } = await supabase
                .from('usage_tracking')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .gte('session_start', startOfMonth.toISOString());

            if (count !== null && count >= planLimits.sessionsPerMonth) {
                return NextResponse.json(
                    {
                        error: "Session limit reached",
                        message: `You've reached your limit of ${planLimits.sessionsPerMonth} sessions per month. Upgrade to Pro for unlimited sessions.`,
                        upgradeRequired: true
                    },
                    { status: 429 }
                );
            }
        }

        // Create sandbox using configured provider
        // The manager handles destroying existing sandboxes and prevents race conditions
        // [FORCE REBUILD]
        console.log(`[Sandbox API] Creating ${SANDBOX_PROVIDER} sandbox for projectId: ${projectId}`);
        console.log(`[Sandbox API] Files received:`, files ? files.length : 'undefined', 'files');
        if (files && files.length > 0) {
            console.log(`[Sandbox API] First file:`, files[0].path);
        }
        const manager = SANDBOX_PROVIDER === 'e2b' ? e2bManager : daytonaManager;

        const sandbox = await manager.createSandbox(
            { projectId, userId: user.id, files },
            planLimits.timeoutMinutes
        );
        console.log(`[Sandbox API] Sandbox created successfully: ${sandbox.id}, url: ${sandbox.url || (sandbox as any).tunnelUrl}`);

        // Verify it was stored
        const storedSandbox = await manager.getSandbox(projectId);
        console.log(`[Sandbox API] Verification - sandbox stored and retrievable:`, storedSandbox ? 'YES' : 'NO');
        if (!storedSandbox) {
            console.error(`[Sandbox API] CRITICAL: Sandbox was NOT stored in manager map!`);
        }

        // Track usage start
        const { error: trackingError } = await supabase
            .from('usage_tracking')
            .insert({
                user_id: user.id,
                project_id: projectId,
                sandbox_id: sandbox.id,
                session_start: new Date().toISOString(),
            });

        if (trackingError) {
            // Silently fail if RLS policy blocks insert - doesn't affect sandbox functionality
            // Only log if it's NOT an RLS policy error
            if (!trackingError.code || trackingError.code !== '42501') {
                console.error('[Sandbox API] Failed to track usage:', trackingError);
            }
        }

        return NextResponse.json({
            sandbox: {
                id: sandbox.id,
                url: sandbox.url || (sandbox as any).tunnelUrl,
                status: sandbox.status,
                expiresAt: sandbox.expiresAt,
            },
            provider: SANDBOX_PROVIDER,
        });

    } catch (error) {
        console.error('[Sandbox API] Failed to create sandbox:', error);
        console.error('[Sandbox API] Error details:', error instanceof Error ? error.stack : error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to create sandbox",
                details: error instanceof Error ? error.stack : String(error)
            },
            { status: 500 }
        );
    }
}
