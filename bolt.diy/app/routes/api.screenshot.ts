import { json, type ActionFunctionArgs } from '@remix-run/node';
import puppeteer from 'puppeteer-core';
import chromium from 'chromium';
import { FEATURE_FLAGS } from '~/lib/feature-flags';
import { inngest } from '~/lib/inngest/client';
import { createJob } from '~/lib/inngest/db';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  const startTime = Date.now();
  console.log('[Screenshot API] Starting export...');

  try {
    const {
      html,
      clip,
      format = 'png',
      width = 8000,
      height = 8000,
      userId,
    } = (await request.json()) as {
      html: string;
      clip?: { x: number; y: number; width: number; height: number };
      format?: 'png' | 'pdf';
      width?: number;
      height?: number;
      userId?: string;
    };

    if (!html) {
      return json({ error: 'HTML content is required' }, { status: 400 });
    }

    console.log('[Screenshot API] Inngest mode:', FEATURE_FLAGS.USE_INNGEST_SCREENSHOT ? 'ENABLED' : 'DISABLED');

    // DUAL MODE: Background job (Inngest) vs Synchronous
    if (FEATURE_FLAGS.USE_INNGEST_SCREENSHOT) {
      console.log('[Screenshot API] Using Inngest background processing...');

      // Create job in database
      const jobId = await createJob({
        jobType: 'screenshot-export',
        userId,
        inputData: { html, clip, format, width, height },
      });

      // Send event to Inngest
      await inngest.send({
        name: 'studio/screenshot.export',
        data: {
          jobId,
          userId,
          html,
          clip,
          format,
          width,
          height,
        },
      });

      console.log('[Screenshot API] Job enqueued:', jobId);

      return json({
        mode: 'async',
        jobId,
        status: 'pending',
        message: 'Screenshot export started in background',
      });
    }

    // ORIGINAL SYNCHRONOUS MODE
    console.log('[Screenshot API] Using synchronous processing...');
    console.log('[Screenshot API] Starting high-fidelity export...');

    const exePath =
      process.platform === 'darwin'
        ? 'node_modules/chromium/lib/chromium/chrome-mac/Chromium.app/Contents/MacOS/Chromium'
        : chromium.path;

    const browser = await puppeteer.launch({
      executablePath: exePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--font-render-hinting=none',
        '--force-device-scale-factor=2',
      ],
      headless: true,
    });

    try {
      const page = await browser.newPage();

      // High-Fidelity Canvas Viewport
      await page.setViewport({
        width,
        height,
        deviceScaleFactor: 2,
      });

      console.log('[Screenshot API] Normalizing studio workspace transforms...');

      const baseUrl = new URL(request.url).origin;

      // Inject base Href for relative assets and base style recovery
      let enrichedHtml = html.includes('<head>')
        ? html.replace('<head>', `<head><base href="${baseUrl}/">`)
        : `<!DOCTYPE html><html><head><base href="${baseUrl}/"></head><body>${html}</body></html>`;

      /*
       * STRIP TRANSFORMS & RECOVER STYLES
       * We inject the Tailwind CDN to ensure all dynamic frames render correctly
       */
      enrichedHtml = enrichedHtml.replace(
        '</head>',
        `
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    html, body { background: transparent !important; margin: 0; padding: 0; }
                    * { transition: none !important; animation-duration: 0s !important; }
                    .react-transform-component, .react-transform-element { transform: none !important; }
                    [style*="transform"] { transform: none !important; }
                    #screenshot-area { 
                        position: absolute !important; 
                        top: 0 !important; 
                        left: 0 !important; 
                        width: 8000px !important; 
                        height: 8000px !important; 
                        background: transparent !important;
                        background-image: none !important;
                    }
                    .screenshot-exclude { display: none !important; }
                    [data-screen-frame="true"] { 
                        transform: none !important; 
                        box-shadow: 0 40px 100px rgba(0,0,0,0.5) !important;
                        border-radius: 32px !important;
                        overflow: hidden !important;
                        background: white !important; /* Ensure frames have their own background */
                    }
                </style>
            </head>`,
      );

      await page.setContent(enrichedHtml, { waitUntil: 'load', timeout: 60000 });

      // Let Tailwind process and assets load
      await new Promise((resolve) => setTimeout(resolve, 5000));

      let data;
      let contentType;

      if (format === 'pdf') {
        console.log('[Screenshot API] Exporting Vector PDF...');

        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          scale: 0.8, // Slightly scale down to fit nicely
          margin: { top: '40px', right: '40px', bottom: '40px', left: '40px' },
        });
        data = Buffer.from(pdfBuffer).toString('base64');
        contentType = 'application/pdf';
      } else {
        console.log(`[Screenshot API] Capturing Precision PNG at ${JSON.stringify(clip)}...`);

        const screenshot = await page.screenshot({
          type: 'png',
          clip,
          fullPage: false,
          omitBackground: true,
        });
        data = Buffer.from(screenshot).toString('base64');
        contentType = 'image/png';
      }

      console.log(`[Screenshot API] Export successful in ${Date.now() - startTime}ms`);

      return json({
        success: true,
        data: `data:${contentType};base64,${data}`,
        format,
      });
    } finally {
      await browser.close();
    }
  } catch (error: any) {
    console.error('[Screenshot API] Fatal Error:', error);
    return json(
      {
        error: 'Export failed',
        details: error.message,
      },
      { status: 500 },
    );
  }
}
