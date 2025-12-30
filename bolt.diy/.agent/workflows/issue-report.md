# Issue Report: Raw Code and Artifact Leaks in Chat

## Overview
There is a persistent issue where raw code blocks (specifically `package.json`, but also CSS/TypeScript) allow their raw text content to "leak" into the chat interface instead of being correctly processed and hidden by the artifact system.

Despite implementing an `EnhancedStreamingMessageParser` to detect and retrospectively wrap these blocks, users are still reporting that raw text appears in the chat.

## Current Architecture

### 1. `EnhancedStreamingMessageParser` (`app/lib/runtime/enhanced-message-parser.ts`)
This class extends the base parser. Its job is to:
*   Intercept the raw LLM stream `input`.
*   Scan for raw code patterns (like `package.json` objects or `This is a file:\n ````...` blocks) that are *not* already wrapped in `<boltArtifact>` tags.
*   If found, it modifies the input string to wrap these blocks in valid `<boltArtifact><boltAction...>` tags.
*   **Crucial Mechanism:** If it modifies the input, it calls `this.reset()` to clear the base parser's state, theoretically forcing it to re-parse the entire string from the beginning with the new tags, thereby "rewriting history" and hiding the previously leaked text.

### 2. `StreamingMessageParser` (`app/lib/runtime/message-parser.ts`)
The base parser that implements a state machine:
*   Scans for `<boltArtifact>` and `<boltAction>` tags.
*   Maintains state: `insideArtifact`, `insideAction`, `accumulatedContent`.
*   **Behavior:** When `insideArtifact` is true, it *suppresses* content from the returned `accumulatedContent` string (which goes to the Chat UI) and instead emits events (`onActionOpen`, `onActionStream`) to the `workbenchStore`.

### 3. `useMessageParser` (`app/lib/hooks/useMessageParser.ts`)
The React hook that bridges the parser and the UI:
*   Feeds the full cumulative message content from the AI SDK to the parser.
*   Updates the `parsedMessages` state with the parser's output.
*   **Fix Implemented:** It uses direct replacement (`[index]: newParsedContent`) rather than appending, to support the "history rewriting" capability of the Enhanced Parser.

## Symptoms
*   **Package.json Leak:** Users see the raw JSON string of `package.json` in the chat bubble.
*   **Mixed Content Leak:** If the LLM outputs a standard artifact *plus* a raw code block, the raw block might leak.
*   **Console Observations:** Debug logs often show that the parser *claims* to have detected and wrapped the content, yet it remains visible in the UI.

## Attempted Fixes (What has been pushed)
1.  **Robust JSON Detection:** Replaced regex-based `package.json` detection with a **brace-counting state machine** that is string-aware (ignores braces inside strings) and handles nested objects.
2.  **Retrospective Parsing:** Implemented `accumulatedContent` in `StreamingMessageParser` and state resetting in `EnhancedStreamingMessageParser` to handle cases where the parser needs to "go back" and wrap content that was already streamed as text.
3.  **Mixed Content Handling:** Removed a "fail-fast" guard that prevented the Enhanced Parser from running if *any* artifact was detected. It now always scans for raw blocks.
4.  **Double-Wrapping Prevention:** Added strict checks (`_isInsideArtifact`, `_isInsideAction`) using exact range calculations to ensure we don't try to wrap JSON that is already inside a valid tag (which would corrupt the stream).

## Potential Root Causes to Investigate

### 1. React State Race Conditions
It is possible that even though the parser returns the "cleaned" string (with JSON hidden), the React state update in `useMessageParser` is not effectively re-rendering the chat component to remove the old text, or the `ai` SDK's stream is conflicting with our local parsed state.

### 2. Parser State Reset Failure
Verify if `this.reset()` in `EnhancedStreamingMessageParser` (which calls `this.#messages.clear()`) truly resets all necessary internal pointers (like `position`) for the *current* message ID being re-parsed. If the position isn't reset to 0, it might skip the newly added artifact tags at the beginning of the string.

### 3. "Ghost" Artifacts
If the LLM outputs `<boltAction ... contentType="application/json">`, check if the extra attributes or specific formatting are causing the `StreamingMessageParser` regex to fail to identify the start of the action, causing it to fall back to treating the content as plain text.

### 4. Buffer / Chunk Boundaries
The detection logic relies on seeing enough of the string to identify a pattern (e.g. waiting for the closing brace of `package.json`). If the stream hangs or splits exactly in a way that the regex/logic doesn't match for a long time, the raw text leaks until the block completes. The "Rewriting" logic *should* fix this eventually, but the transient leak might remain if the rewrite fails.

## Files to Review
*   `app/lib/runtime/enhanced-message-parser.ts` (Detection logic)
*   `app/lib/runtime/message-parser.ts` (State machine)
*   `app/lib/hooks/useMessageParser.ts` (Integration)
