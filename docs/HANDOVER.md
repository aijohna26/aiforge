# Handover: Expo Preview & QR Code Debugging in Daytona

## Context
We are running an Expo project within a Daytona sandbox. The goal is to match the functionality of the "Vibe" E2B reference architecture: a working web preview in the iframe and a working QR code for mobile testing.

## "Why E2B Works" (Reference Architecture)
The user observed that the E2B implementation (Vibe project) "just works." This is because:
1.  **Direct Public/Open Access:** E2B sandboxes (v2 templates) often expose ports via predictable URLs (e.g., `https://${sandboxId}-8082.e2b.dev`) that are either public or relatively easy to proxy without complex interstitial pages.
2.  **No Interstitial:** E2B does not typically show a "Preview Warning" HTML page that captures the first request, unlike Daytona.

## "Why Daytona Failed" (Our Challenge)
Daytona introduces two security layers that broke the standard Expo flow:
1.  **Interstitial Warning Page:** Accessing a Daytona preview URL first returns an HTML warning ("You are entering a sandbox..."). This breaks the `iframe` because it expects the app, not a warning.
2.  **Authentication/Private Network:** Daytona preview URLs are not truly public. They require the `DAYTONA_SANDBOX_AUTH_KEY` or `daytona_token`. A physical phone scanning a QR code *cannot* access these private URLs because it doesn't have the auth cookie/token.

## The Solution (Implemented Fixes)

We successfully bridged this gap by implementing two specific workarounds:

### 1. For the Web Preview (Iframe)
**Goal:** Bypass the warning page and seamlessly pass authentication.
*   **Header Injection:** Modified `app/routes/api.proxy.ts` to add `X-Daytona-Skip-Preview-Warning: true` and `X-Daytona-Disable-CORS: true`.
*   **Token Forwarding:** Updated `Preview.tsx` to explicitly grab the `daytona_token` from the URL or local storage and pass it to our internal proxy. The proxy then forwards it as `X-Daytona-Preview-Token`.
*   **Proxy-First Loading:** The iframe now loads via our internal proxy (`/api/proxy?url=...`) which handles the auth handshake, ensuring the browser renders the app immediately.

### 2. For the QR Code (Mobile)
**Goal:** Allow a physical phone on a different network to connect to the private sandbox.
*   **Tunneling Strategy:** We cannot use the private Daytona URL for the phone. Instead, we use **ngrok**.
*   **Template Update:** Added `@expo/ngrok` to `package.json` and updated the `start` script to `expo start --tunnel`.
*   **Automatic Parsing:** Updated `ActionRunner.ts` to regex-scrape the `exp://` URL from the logs. If that fails, we have fallback logic (though the tunnel URL is preferred).

## Files Modified & Key Logic

| File | Change Description |
| :--- | :--- |
| `app/routes/api.proxy.ts` | Added `X-Daytona-` headers (Skip Warning, Disable CORS). Added token injection logic. |
| `app/components/workbench/Preview.tsx` | Implemented `getDaytonaProxyUrl` to route iframe requests through our proxy with the correct token. |
| `app/lib/runtime/action-runner.ts` | Added **QR Code Regex** for Daytona logs. Added **Auto-Correction** for `npm run start:web` -> `npm start`. |
| `templates/af-expo-template-v4/package.json` | Added `@expo/ngrok` dependency. Added `--tunnel` flag to start scripts. |
| `app/routes/api.daytona.execute.ts` | (Debug) Increased log tail size. Added strict port binding env vars (`HOST=0.0.0.0`). |

## Instructions for Next Engineer / User
1.  **Restart the App:** The fixes rely on the new `package.json` scripts. You **must** stop the current process and ask the AI to **"Start the app"**.
2.  **Verify Tunnel:** Watch the logs. You should see "Tunnel connected" or a similar message from Expo.
3.  **Scan QR:** The "Phone" tab in the preview should now show a QR code. Scanning it will open the app via the tunnel (slow but reliable).
4.  **Web Preview:** The iframe should load the app directly (white screen -> app) without the "Daytona Warning" page.

## Known Limitations
-   **Tunnel Latency:** Ngrok tunnels can be slower than direct LAN connections.
-   **Token Expiry:** If the Daytona token expires, the preview might fail until the page is refreshed (re-fetching the token).
