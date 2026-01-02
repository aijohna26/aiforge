# E2B Integration Feature Toggle

This document outlines the implementation of the E2B feature toggle (`E2B_ON`) allows switching the backend execution environment from WebContainers to E2B Sandboxes.

## Feature Toggle
The feature is controlled by the `E2B_ON` environment variable.
- **File**: `.env.local`
- **Variable**: `E2B_ON=true` (to enable) or `false`/unset (to disable)

## Implementation Details

### 1. `vite.config.ts`
Updated `envPrefix` to include `E2B_`, ensuring `E2B_ON` and `E2B_API_KEY` are available to the client-side code via `import.meta.env`.

### 2. `app/lib/runtime/e2b-runner.ts`
A new adapter class `E2BRunner` was created to interface with the `@e2b/code-interpreter` SDK.
- **Singleton Pattern**: Manages a single `CodeInterpreter` instance.
- **Methods**:
    - `executeShell(command, callbacks)`: Executes shell commands in the E2B sandbox.
    - `writeFile(path, content)`: Writes files to the E2B sandbox filesystem.
    - `getSandbox()`: Initializes the sandbox using `E2B_API_KEY`.

### 3. `app/lib/runtime/action-runner.ts`
The `ActionRunner` class was modified to intercept actions when `E2B_ON` is enabled.
- **Shell Actions**: Delegated to `E2BRunner.executeShell`. Output is piped to the existing terminal UI.
- **File Actions**: Delegated to `E2BRunner.writeFile`.
- **Start Actions**: Currently fallback to WebContainer logic (as E2B port tunneling for web previews requires additional configuration not yet implemented).

### 4. Dependencies
- Installed `@e2b/code-interpreter` using `pnpm`.

## Usage
To use E2B:
1.  Add `E2B_ON=true` to `.env.local`.
2.  Add `E2B_API_KEY=your_api_key` to `.env.local`.
3.  Restart the application.

## Future Improvements
- **Web Preview**: Implement port tunneling (e.g., using E2B's `sandbox.pty` or explicit port exposure) to support `npm start` actions and allow the browser to view the running app.
- **State Management**: Ensure file history and diffs are synchronized between the frontend and E2B.
