import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { designAgent, type DesignProgress, type DesignMode } from "@/lib/ai/design-agent";

export const runtime = "nodejs";

// POST /api/design - Start design generation (Express or Wizard mode)
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { appIdea, mode, preferences } = await req.json();

        if (!appIdea || typeof appIdea !== "string") {
            return NextResponse.json(
                { error: "appIdea is required" },
                { status: 400 }
            );
        }

        if (!mode || !['wizard', 'express'].includes(mode)) {
            return NextResponse.json(
                { error: "mode must be 'wizard' or 'express'" },
                { status: 400 }
            );
        }

        // Express Mode - Generate everything
        if (mode === 'express') {
            return handleExpressMode(user.id, appIdea, preferences, supabase);
        }

        // Wizard Mode - Start step 1 (logo generation)
        if (mode === 'wizard') {
            return handleWizardStart(user.id, appIdea, preferences, supabase);
        }

    } catch (error) {
        console.error("[Design API] Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to start design";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

async function handleExpressMode(
    userId: string,
    appIdea: string,
    preferences: any,
    supabase: any
) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            try {
                // Generate complete design package
                const designPackage = await designAgent.generateExpressDesign(
                    { appIdea, userId, mode: 'express', preferences },
                    (progress: DesignProgress) => {
                        // Send progress event
                        controller.enqueue(
                            encoder.encode(
                                `data: ${JSON.stringify({ type: "progress", ...progress })}\n\n`
                            )
                        );
                    }
                );

                // Save to database
                const { data: savedDesign, error: dbError } = await supabase
                    .from("design_packages")
                    .insert({
                        user_id: userId,
                        app_idea: appIdea,
                        mode: 'express',
                        feature_spec: designPackage.featureSpec,
                        branding: designPackage.branding,
                        screens: designPackage.screens,
                        status: 'draft',
                    })
                    .select()
                    .single();

                if (dbError) {
                    console.error("[Design API] Failed to save design:", dbError);
                }

                // Send complete event
                controller.enqueue(
                    encoder.encode(
                        `data: ${JSON.stringify({
                            type: "complete",
                            design: {
                                ...designPackage,
                                id: savedDesign?.id || designPackage.id,
                            },
                        })}\n\n`
                    )
                );

                controller.close();
            } catch (error) {
                console.error("[Design API] Error:", error);
                const errorMessage = error instanceof Error ? error.message : "Design generation failed";

                controller.enqueue(
                    encoder.encode(
                        `data: ${JSON.stringify({
                            type: "error",
                            error: errorMessage,
                        })}\n\n`
                    )
                );

                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}

async function handleWizardStart(
    userId: string,
    appIdea: string,
    preferences: any,
    supabase: any
) {
    // Generate logo options for step 1
    const style = preferences?.style || 'modern';
    const logos = await designAgent.generateLogoOptions(appIdea, style);

    // Create draft design package
    const { data: designPackage, error } = await supabase
        .from("design_packages")
        .insert({
            user_id: userId,
            app_idea: appIdea,
            mode: 'wizard',
            wizard_state: {
                currentStep: 1,
                logoOptions: logos,
            },
            status: 'draft',
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to create design package: ${error.message}`);
    }

    return NextResponse.json({
        designId: designPackage.id,
        step: 1,
        logos,
    });
}
