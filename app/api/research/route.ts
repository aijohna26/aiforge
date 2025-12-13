import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { researchAgent, type ResearchProgress } from "@/lib/ai/research-agent";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { appIdea } = await req.json();

        if (!appIdea || typeof appIdea !== "string") {
            return NextResponse.json(
                { error: "appIdea is required" },
                { status: 400 }
            );
        }

        // Streaming response using Server-Sent Events
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Conduct research with progress updates
                    const report = await researchAgent.conductResearch(
                        { appIdea, userId: user.id },
                        (progress: ResearchProgress) => {
                            // Send progress event
                            controller.enqueue(
                                encoder.encode(
                                    `data: ${JSON.stringify({ type: "progress", ...progress })}\n\n`
                                )
                            );
                        }
                    );

                    // Save report to database
                    const { data: savedReport, error: dbError } = await supabase
                        .from("research_reports")
                        .insert({
                            user_id: user.id,
                            app_idea: appIdea,
                            opportunity_score: report.opportunityScore,
                            report_data: report,
                            images: report.images.map(img => img.url),
                            status: "completed",
                        })
                        .select()
                        .single();

                    if (dbError) {
                        console.error("[Research API] Failed to save report:", dbError);
                    }

                    // Send complete event
                    controller.enqueue(
                        encoder.encode(
                            `data: ${JSON.stringify({
                                type: "complete",
                                report: {
                                    ...report,
                                    id: savedReport?.id || report.id,
                                },
                            })}\n\n`
                        )
                    );

                    controller.close();
                } catch (error) {
                    console.error("[Research API] Error:", error);
                    const errorMessage = error instanceof Error ? error.message : "Research failed";

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
    } catch (error) {
        console.error("[Research API] Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to start research";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
