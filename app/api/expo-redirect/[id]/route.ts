import { NextRequest } from "next/server";
import { previewStore } from "@/lib/preview-store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const entry = previewStore.get(id);

  if (!entry) {
    return new Response(
      `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Preview Expired</title>
        <style>
          body { font-family: -apple-system, system-ui, sans-serif; background: #0f172a; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
          .container { text-align: center; padding: 20px; }
          h1 { font-size: 24px; margin-bottom: 10px; }
          p { color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Preview Expired</h1>
          <p>This preview link has expired. Please generate a new one.</p>
        </div>
      </body>
      </html>`,
      { status: 404, headers: { "Content-Type": "text/html" } }
    );
  }

  // Build the Snack URL for the "Open in Expo Go" button
  const snackParams = new URLSearchParams();
  snackParams.set("name", entry.name);
  snackParams.set("platform", "mydevice");
  snackParams.set("sdkVersion", "53.0.0");
  snackParams.set("theme", "dark");
  snackParams.set("code", entry.code);
  const snackUrl = `https://snack.expo.dev/?${snackParams.toString()}`;

  // Return a mobile-friendly page with instructions
  return new Response(
    `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
      <title>${entry.name} - Open in Expo Go</title>
      <style>
        * { box-sizing: border-box; }
        body {
          font-family: -apple-system, system-ui, sans-serif;
          background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
          color: #fff;
          min-height: 100vh;
          margin: 0;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .container {
          text-align: center;
          max-width: 400px;
          width: 100%;
        }
        .logo {
          font-size: 48px;
          margin-bottom: 16px;
        }
        h1 {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }
        .subtitle {
          color: #94a3b8;
          font-size: 14px;
          margin-bottom: 32px;
        }
        .btn {
          display: block;
          width: 100%;
          padding: 16px 24px;
          font-size: 16px;
          font-weight: 600;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          text-decoration: none;
          margin-bottom: 12px;
          transition: transform 0.1s, opacity 0.1s;
        }
        .btn:active {
          transform: scale(0.98);
          opacity: 0.9;
        }
        .btn-primary {
          background: #2563eb;
          color: #fff;
        }
        .btn-secondary {
          background: #334155;
          color: #fff;
        }
        .divider {
          display: flex;
          align-items: center;
          margin: 24px 0;
          color: #64748b;
          font-size: 12px;
        }
        .divider::before, .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #334155;
        }
        .divider span {
          padding: 0 12px;
        }
        .steps {
          text-align: left;
          background: #1e293b;
          border-radius: 12px;
          padding: 16px;
          margin-top: 24px;
        }
        .steps h3 {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 12px 0;
        }
        .steps ol {
          margin: 0;
          padding-left: 20px;
          color: #94a3b8;
          font-size: 14px;
          line-height: 1.8;
        }
        .steps strong {
          color: #fff;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">📱</div>
        <h1>${entry.name}</h1>
        <p class="subtitle">Built with AppForge AI</p>

        <a href="${snackUrl}" class="btn btn-primary">
          Open in Expo Go
        </a>

        <div class="steps">
          <h3>First time?</h3>
          <ol>
            <li>Install <strong>Expo Go</strong> from App Store or Play Store</li>
            <li>Tap the button above</li>
            <li>Your app will run natively on your device</li>
          </ol>
        </div>
      </div>
    </body>
    </html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
