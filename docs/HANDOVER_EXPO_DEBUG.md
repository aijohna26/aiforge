# Handover: Expo Preview & QR Code Debugging in Daytona

## Context
We are running an Expo project within a Daytona sandbox environemnt. The editor app (Bolt/AppForge) communicates with the sandbox via an API (`api.daytona.execute.ts`). The goal is to display a live preview of the web version in an iframe and provide a QR code for physical device testing.

## Current Critical Issues

### 1. Preview URL Failure (Iframe)
**Symptoms:**
- The iframe shows "Refused to connect" or a generic 400/500 error.
- Previously showed a Daytona "Preview URL Warning" interstitial page.
- Network tab shows the proxy request returning 200 OK (with the fix), but the content might not be rendering correctly or subsequent asset requests fail.

**Root Causes:**
- **Daytona Warning Page:** Daytona intercepts the first request with a warning HTML page, which breaks the app preview.
- **Auth/Redirects:** The Daytona interaction might be triggering an auth flow that cannot happen inside a sandboxed iframe.
- **Asset Loading:** Even if we bypass the HTML warning, relative paths for JS/CSS bundles might break if they don't route through the authenticated proxy.

**Implemented Fixes (Status: Untested/Failing):**
- **Header Injection:** Added `X-Daytona-Skip-Preview-Warning: true` in `app/routes/api.proxy.ts` to bypass the interstitial.
- **Proxy Fetch:** Updated `Preview.tsx` to fetch the initial HTML via the internal proxy (to add the header) and inject a `<base>` tag for asset resolution.
- **Port 8082 Binding:** Ensured `package.json` binds to `0.0.0.0` to be accessible externally.

### 2. QR Code Failure
**Symptoms:**
- QR Code not appearing in logs (or logs truncated).
- Scanned QR code fails to load on phone (Connection Refused or Auth Wall).

**Root Causes:**
- **Private Network:** The Daytona URL is behind a proxy authentication wall. A physical phone cannot access `https://domain.daytona.work` without the token/cookie.
- **Log Truncation:** The server logs were cutting off the QR code ASCII art.

**Implemented Fixes (Status: Untested/Failing):**
- **Tunneling:** Added `@expo/ngrok` to `package.json` devDependencies and added `--tunnel` flag to `npm start`. This *should* create a public `ngrok.io` URL that bypasses Daytona auth entirely for the phone.
- **Log Parsing:** Enhanced `ActionRunner.ts` to regex-match `exp://` links from the stdout stream.
- **Fallback URL:** Added logic to derive `exp://` from the HTTP preview URL if the log scrape fails.
- **Command Interception:** Hard-coded `ActionRunner.ts` to swap `npm run start:web` (hallucination) with `npm start` (valid command).

## Files Modified
- `app/routes/api.daytona.execute.ts`: Increased log tail size, added curl diagnostic.
- `app/lib/runtime/action-runner.ts`: Added QR code regex, logic to set `expoUrlAtom`, command interception.
- `app/components/workbench/Preview.tsx`: Added proxy fetch logic for Daytona URLs.
- `app/routes/api.proxy.ts`: Added `X-Daytona-Skip-Preview-Warning` header.
- `templates/af-expo-template-v4/package.json`: Added `@expo/ngrok` and `--tunnel` flag.

## Recommended Next Steps for Senior Engineer
1.  **Verify Tunneling:** Confirm if `@expo/ngrok` actually installed and if `npm start` is successfully opening a tunnel. If the logs don't show an `ngrok.io` or `exp.direct` URL, the tunnel isn't working, and the phone will never connect.
2.  **Direct Proxy Check:** Manually curl the Daytona preview URL with the `X-Daytona-Skip-Preview-Warning: true` header to verify it actually returns the app HTML and not a redirect/warning.
3.  **Iframe Isolation:** The `srcDoc` approach in `Preview.tsx` might be flaky with complex Expo chunks. Consider using the proxy strictly as a pipe (streaming) rather than fetching text and replacing.
4.  **Auth Token:** Ensure the Daytona session token is properly being passed or used if the tunnel fails. The "Refused to connect" often implies a 401/403 or a CORS block on the redirect.
