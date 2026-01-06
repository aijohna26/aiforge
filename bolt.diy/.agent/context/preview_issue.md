# Issue: Preview Pane Broken (Sad Face / Broken Image)

## Cause
The Development Server (`npm run dev` / `npx expo start`) is **NOT RUNNING** in the AppForge Terminal.
Your screenshot shows the terminal is idle (`~/user >` prompt is visible and waiting for input).

## Solution
1. Click inside the **AppForge Terminal** area (bottom center).
2. Type `npm run dev` and press **Enter**.
3. Wait for the text "Starting Metro Bundler..." or similar.
4. The Preview pane on the right will automatically refresh and show your App.

## Why did this happen?
The automated "Start Application" step might have completed, but the process exited or was stopped. The Preview pane requires an active server to render the app.
