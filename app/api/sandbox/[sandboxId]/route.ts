import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { daytonaManager } from "@/lib/daytona-manager";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ sandboxId: string }> }
) {
    try {
        const { sandboxId } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get sandbox by looking up in usage tracking
        const { data: usage } = await supabase
            .from('usage_tracking')
            .select('*')
            .eq('sandbox_id', sandboxId)
            .eq('user_id', user.id)
            .single();

        if (!usage) {
            return NextResponse.json({ error: "Sandbox not found" }, { status: 404 });
        }

        const sandbox = await daytonaManager.getSandbox(usage.project_id);

        if (!sandbox) {
            return NextResponse.json({ error: "Sandbox not found" }, { status: 404 });
        }

        return NextResponse.json({ sandbox });

    } catch (error) {
        console.error('[Sandbox API] Failed to get sandbox:', error);
        return NextResponse.json(
            { error: "Failed to get sandbox" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ sandboxId: string }> }
) {
    try {
        const { sandboxId } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get sandbox
        const { data: usage } = await supabase
            .from('usage_tracking')
            .select('*')
            .eq('sandbox_id', sandboxId)
            .eq('user_id', user.id)
            .single();

        if (!usage) {
            return NextResponse.json({ error: "Sandbox not found" }, { status: 404 });
        }

        // Destroy sandbox
        await daytonaManager.destroySandbox(usage.project_id);

        // Update usage tracking
        const sessionEnd = new Date();
        const durationSeconds = Math.floor((sessionEnd.getTime() - new Date(usage.session_start).getTime()) / 1000);

        // Estimate cost (rough calculation based on Daytona pricing)
        const costUsd = (durationSeconds / 3600) * 0.1656; // $0.1656/hour

        await supabase
            .from('usage_tracking')
            .update({
                session_end: sessionEnd.toISOString(),
                duration_seconds: durationSeconds,
                cost_usd: costUsd,
            })
            .eq('id', usage.id);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[Sandbox API] Failed to delete sandbox:', error);
        return NextResponse.json(
            { error: "Failed to delete sandbox" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ sandboxId: string }> }
) {
    try {
        const { sandboxId } = await params;
        const { extendMinutes } = await req.json();

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get sandbox
        const { data: usage } = await supabase
            .from('usage_tracking')
            .select('*')
            .eq('sandbox_id', sandboxId)
            .eq('user_id', user.id)
            .single();

        if (!usage) {
            return NextResponse.json({ error: "Sandbox not found" }, { status: 404 });
        }

        // Extend timeout
        await daytonaManager.extendTimeout(usage.project_id, extendMinutes);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[Sandbox API] Failed to extend sandbox:', error);
        return NextResponse.json(
            { error: "Failed to extend sandbox" },
            { status: 500 }
        );
    }
}
