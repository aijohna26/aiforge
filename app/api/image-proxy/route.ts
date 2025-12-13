'use server';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const targetUrl = searchParams.get('url');

        if (!targetUrl) {
            return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
        }

        let remoteUrl: URL;
        try {
            remoteUrl = new URL(targetUrl);
        } catch {
            return NextResponse.json({ error: 'Invalid url parameter' }, { status: 400 });
        }

        const response = await fetch(remoteUrl.toString(), {
            cache: 'no-store',
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch image' }, { status: response.status || 500 });
        }

        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        const buffer = await response.arrayBuffer();

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'private, max-age=0, must-revalidate',
            },
        });
    } catch (error) {
        console.error('[Image Proxy] Error fetching image:', error);
        return NextResponse.json({ error: 'Unexpected error fetching image' }, { status: 500 });
    }
}
