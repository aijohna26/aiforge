import { json, type ActionFunctionArgs } from '@remix-run/node';
import puppeteer from 'puppeteer-core';
import chromium from 'chromium';

export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== 'POST') {
        return json({ error: 'Method not allowed' }, { status: 405 });
    }

    const startTime = Date.now();
    console.log('[Screenshot API] Starting capture request...');

    try {
        const { html, selector = '#screenshot-area', width = 1200, height = 800 } = await request.json() as {
            html: string;
            selector?: string;
            width?: number;
            height?: number
        };

        if (!html) {
            return json({ error: 'HTML content is required' }, { status: 400 });
        }

        const exePath = process.platform === 'darwin'
            ? 'node_modules/chromium/lib/chromium/chrome-mac/Chromium.app/Contents/MacOS/Chromium'
            : chromium.path;

        console.log('[Screenshot API] Launching browser...');
        const browser = await puppeteer.launch({
            executablePath: exePath,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
            headless: true,
        });

        try {
            const page = await browser.newPage();
            await page.setViewport({ width, height, deviceScaleFactor: 2 });

            console.log('[Screenshot API] Setting page content...');
            // We use 'domcontentloaded' to be faster, combined with a manual timeout
            await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30000 });

            console.log('[Screenshot API] Waiting for stabilization...');
            // Shortened wait since we are sending full rendered HTML
            await new Promise(resolve => setTimeout(resolve, 500));

            console.log(`[Screenshot API] Searching for selector: ${selector} `);
            const element = await page.$(selector);

            let screenshot;
            if (element) {
                console.log('[Screenshot API] Capturing element screenshot...');
                screenshot = await element.screenshot({ type: 'png' });
            } else {
                console.warn(`[Screenshot API] Selector ${selector} not found, falling back to full page capture`);
                screenshot = await page.screenshot({ type: 'png', fullPage: false });
            }

            const base64 = Buffer.from(screenshot as Uint8Array).toString('base64');
            console.log(`[Screenshot API] Capture complete in ${Date.now() - startTime} ms`);

            return json({
                success: true,
                image: `data: image / png; base64, ${base64} `
            });

        } finally {
            await browser.close();
            console.log('[Screenshot API] Browser closed');
        }

    } catch (error: any) {
        console.error('[Screenshot API] Fatal Error:', error);
        return json({
            error: 'Failed to capture screenshot',
            details: error.message
        }, { status: 500 });
    }
}
