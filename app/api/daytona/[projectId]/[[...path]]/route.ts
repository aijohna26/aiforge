import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { daytonaManager } from "@/lib/daytona-manager";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = {
    params: Promise<{
        projectId: string;
        path?: string[];
    }>;
};

async function ensurePreviewInfo(projectId: string) {
    const sandbox = await daytonaManager.getSandbox(projectId);
    if (!sandbox) {
        return null;
    }

    if (sandbox.tunnelUrl && sandbox.tunnelUrl !== "initializing" && sandbox.previewToken) {
        return sandbox;
    }

    const activeSandbox = daytonaManager.getActiveSandbox(projectId);
    if (!activeSandbox) {
        return sandbox;
    }

    try {
        const previewInfo = await activeSandbox.getPreviewLink(8081);
        const tunnelUrl = previewInfo.url;
        const previewToken = previewInfo.token || null;
        daytonaManager.updateSandbox(projectId, { tunnelUrl, previewToken });
        return {
            ...sandbox,
            tunnelUrl,
            previewToken,
        };
    } catch (error) {
        console.error("[Daytona Proxy] Failed to refresh preview link:", error);
        return sandbox;
    }
}

async function proxyRequest(request: NextRequest, { params }: RouteParams) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const projectId = resolvedParams.projectId;
    if (!projectId) {
        return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    const sandbox = await ensurePreviewInfo(projectId);
    if (!sandbox || !sandbox.tunnelUrl || sandbox.tunnelUrl === "initializing") {
        return NextResponse.json({ error: "Sandbox not ready" }, { status: 503 });
    }

    const baseUrl = sandbox.tunnelUrl.replace(/\/$/, "");
    const pathSegments = resolvedParams.path ?? [];
    const path = pathSegments.length ? `/${pathSegments.join("/")}` : "/";
    const targetUrl = new URL(path + request.nextUrl.search, baseUrl);

    const forwardHeaders = new Headers();
    const passthroughHeaders = [
        "accept",
        "accept-language",
        "accept-encoding",
        "content-type",
        "user-agent",
        "range",
        "sec-fetch-mode",
        "sec-fetch-site",
        "sec-fetch-dest",
        "referer",
    ];

    for (const header of passthroughHeaders) {
        const value = request.headers.get(header);
        if (value) {
            forwardHeaders.set(header, value);
        }
    }

    if (sandbox.previewToken) {
        forwardHeaders.set("X-Daytona-Preview-Token", sandbox.previewToken);
    }
    forwardHeaders.set("X-Daytona-Skip-Preview-Warning", "true");
    forwardHeaders.set("X-Daytona-Disable-CORS", "true");
    forwardHeaders.set("X-Daytona-Skip-Last-Activity-Update", "true");

    const method = request.method.toUpperCase();
    const hasBody = !["GET", "HEAD"].includes(method);

    let targetResponse;
    try {
        targetResponse = await fetch(targetUrl.toString(), {
            method,
            headers: forwardHeaders,
            body: hasBody ? request.body : undefined,
            redirect: "manual",
            signal: AbortSignal.timeout(30000), // 30 second timeout
        });
    } catch (fetchError) {
        // Server not responding - likely still starting up
        console.error("[Daytona Proxy] Fetch failed:", fetchError);
        return new NextResponse(
            `<!DOCTYPE html><html><body style="margin:0;padding:20px;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f9fafb"><div style="text-align:center;max-width:500px"><div style="font-size:48px;margin-bottom:20px">⏳</div><h2 style="color:#111;margin:0 0 10px">Server Starting...</h2><p style="color:#666;margin:0">Expo dev server is starting up. This usually takes 30-60 seconds.<br><br>The page will auto-refresh when ready.</p></div><script>setTimeout(() => location.reload(), 3000)</script></body></html>`,
            {
                status: 503,
                headers: {
                    "Content-Type": "text/html; charset=utf-8",
                    "Cache-Control": "no-store",
                    "Refresh": "3",
                },
            }
        );
    }

    // If we got a 502/503/504 from the tunnel (Daytona gateway saying server not ready)
    if (targetResponse.status === 502 || targetResponse.status === 503 || targetResponse.status === 504) {
        return new NextResponse(
            `<!DOCTYPE html><html><body style="margin:0;padding:20px;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f9fafb"><div style="text-align:center;max-width:500px"><div style="font-size:48px;margin-bottom:20px">⏳</div><h2 style="color:#111;margin:0 0 10px">Server Starting...</h2><p style="color:#666;margin:0">Expo dev server is starting up. This usually takes 30-60 seconds.<br><br>The page will auto-refresh when ready.</p></div><script>setTimeout(() => location.reload(), 3000)</script></body></html>`,
            {
                status: 503,
                headers: {
                    "Content-Type": "text/html; charset=utf-8",
                    "Cache-Control": "no-store",
                    "Refresh": "3",
                },
            }
        );
    }

    const responseHeaders = new Headers(targetResponse.headers);
    responseHeaders.set("Cache-Control", "no-store");
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.delete("content-security-policy");

    const location = responseHeaders.get("location");
    if (location && location.startsWith(baseUrl)) {
        const relative = location.slice(baseUrl.length);
        const proxiedLocation = `${request.nextUrl.origin}/api/daytona/${projectId}${relative.startsWith("/") ? relative : `/${relative}`}`;
        responseHeaders.set("location", proxiedLocation);
    }

    return new NextResponse(method === "HEAD" ? null : targetResponse.body, {
        status: targetResponse.status,
        headers: responseHeaders,
    });
}

export async function GET(request: NextRequest, context: RouteParams) {
    try {
        return await proxyRequest(request, context);
    } catch (error) {
        console.error("[Daytona Proxy] GET failed:", error);
        return NextResponse.json({ error: "Failed to proxy request" }, { status: 500 });
    }
}

export async function HEAD(request: NextRequest, context: RouteParams) {
    try {
        return await proxyRequest(request, context);
    } catch (error) {
        console.error("[Daytona Proxy] HEAD failed:", error);
        return NextResponse.json({ error: "Failed to proxy request" }, { status: 500 });
    }
}

export async function POST(request: NextRequest, context: RouteParams) {
    try {
        return await proxyRequest(request, context);
    } catch (error) {
        console.error("[Daytona Proxy] POST failed:", error);
        return NextResponse.json({ error: "Failed to proxy request" }, { status: 500 });
    }
}
