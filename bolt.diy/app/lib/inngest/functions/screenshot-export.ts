/**
 * Screenshot Export Inngest Function
 *
 * Background worker that handles Puppeteer-based screenshot/PDF generation with:
 * - Real-time progress updates
 * - Memory management for browser instances
 * - Automatic retry on failure (3 attempts)
 * - 5-minute timeout for long-running exports
 */

import { inngest } from '../client';
import { updateJobStatus, updateJobProgress, incrementJobAttempts } from '../db';
import puppeteer from 'puppeteer-core';
import chromium from 'chromium';

interface ScreenshotExportInput {
  jobId: string;
  userId?: string;
  html: string;
  clip?: { x: number; y: number; width: number; height: number };
  format?: 'png' | 'pdf';
  width?: number;
  height?: number;
}

export const screenshotExport = inngest.createFunction(
  {
    id: 'screenshot-export',
    name: 'Export Screenshot/PDF',
    retries: 3,
    concurrency: {
      limit: 3, // Limit browser instances
    },
  },
  { event: 'studio/screenshot.export' },
  async ({ event, step, channel }) => {
    const {
      jobId,
      userId,
      html,
      clip,
      format = 'png',
      width = 8000,
      height = 8000,
    } = event.data as ScreenshotExportInput;

    console.log('[Inngest] Starting screenshot export:', {
      jobId,
      format,
      hasClip: !!clip,
    });

    // Step 1: Mark job as processing
    await step.run('initialize-export', async () => {
      await updateJobStatus({
        jobId,
        status: 'processing',
        progress: 10,
      });

      if (userId) {
        await channel.publish(`user:${userId}`, {
          type: 'export.start',
          jobId,
          format,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Step 2: Launch browser
    const browser = await step.run('launch-browser', async () => {
      console.log('[Inngest] Launching browser...');

      const exePath =
        process.platform === 'darwin'
          ? 'node_modules/chromium/lib/chromium/chrome-mac/Chromium.app/Contents/MacOS/Chromium'
          : chromium.path;

      const browserInstance = await puppeteer.launch({
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

      await updateJobProgress({ jobId, progress: 30 });

      if (userId) {
        await channel.publish(`user:${userId}`, {
          type: 'export.browser_launched',
          jobId,
          timestamp: new Date().toISOString(),
        });
      }

      return browserInstance;
    });

    try {
      // Step 3: Render HTML
      const exportData = await step.run('render-and-export', async () => {
        console.log('[Inngest] Rendering HTML...');

        const page = await browser.newPage();

        // Set viewport
        await page.setViewport({
          width,
          height,
          deviceScaleFactor: 2,
        });

        await updateJobProgress({ jobId, progress: 50 });

        // Enrich HTML with base styles and Tailwind
        const baseUrl = process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : 'http://localhost:5173';

        let enrichedHtml = html.includes('<head>')
          ? html.replace('<head>', `<head><base href="${baseUrl}/">`)
          : `<!DOCTYPE html><html><head><base href="${baseUrl}/"></head><body>${html}</body></html>`;

        // Inject Tailwind and cleanup styles
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
                width: ${width}px !important;
                height: ${height}px !important;
                background: transparent !important;
                background-image: none !important;
              }
              .screenshot-exclude { display: none !important; }
              [data-screen-frame="true"] {
                transform: none !important;
                box-shadow: 0 40px 100px rgba(0,0,0,0.5) !important;
                border-radius: 32px !important;
                overflow: hidden !important;
                background: white !important;
              }
            </style>
          </head>`
        );

        await page.setContent(enrichedHtml, { waitUntil: 'load', timeout: 60000 });

        // Wait for Tailwind to process
        await new Promise((resolve) => setTimeout(resolve, 5000));

        await updateJobProgress({ jobId, progress: 70 });

        if (userId) {
          await channel.publish(`user:${userId}`, {
            type: 'export.rendering',
            jobId,
            progress: 70,
            timestamp: new Date().toISOString(),
          });
        }

        // Generate export
        let data: string;
        let contentType: string;

        if (format === 'pdf') {
          console.log('[Inngest] Exporting as PDF...');
          const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            scale: 0.8,
            margin: { top: '40px', right: '40px', bottom: '40px', left: '40px' },
          });
          data = Buffer.from(pdfBuffer).toString('base64');
          contentType = 'application/pdf';
        } else {
          console.log('[Inngest] Capturing PNG...');
          const screenshot = await page.screenshot({
            type: 'png',
            clip: clip,
            fullPage: !clip,
            omitBackground: true,
          });
          data = Buffer.from(screenshot).toString('base64');
          contentType = 'image/png';
        }

        await page.close();

        return {
          data: `data:${contentType};base64,${data}`,
          format,
        };
      });

      // Step 4: Mark as completed
      await step.run('complete-export', async () => {
        await updateJobStatus({
          jobId,
          status: 'completed',
          progress: 100,
          outputData: exportData,
        });

        if (userId) {
          await channel.publish(`user:${userId}`, {
            type: 'export.complete',
            jobId,
            format,
            timestamp: new Date().toISOString(),
          });
        }

        console.log('[Inngest] Screenshot export completed:', jobId);
      });

      return {
        success: true,
        jobId,
        format,
      };
    } finally {
      // Always close browser
      await browser.close();
      console.log('[Inngest] Browser closed');
    }
  }
);
