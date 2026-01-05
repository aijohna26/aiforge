# Studio Session Persistence Issue

## Problem Description
The user has a "Lost" Studio Session containing 32 screens (generated frames). 
Currently, the application persistently loads a stale or incorrect session with only 6-8 screens (indices 0-7).

## Symptoms
1. **Split Brain:** The verified 32-screen data exists in the Database (under `project_id: default` or migrated `project_id`).
2. **Reversion on Reload:** Even after a "Hard Restore" (which wipes Local Storage and migrates DB data), reloading the page reverts the UI to showing 6 screens.
3. **Local Storage Conflict:** `appforge_design_wizard_state` in Local Storage seems to get overwritten by the "Step 4" state or a stale Studio state immediately upon initialization.

## Verified Facts
*   **Good Data ID:** `22ca429a-3d55-4cbc-97db-33442da85dfb` (Confirmed to have 32 frames in DB).
*   **API Migrator:** `/api/migrator` endpoint correctly fetches this ID and updates the current Project's workspace entry.
*   **Hydration Logic:** `Step5Interactive.tsx` has logic to fetch from DB and overwrite state if DB count > Local count.

## Why is it failing? (Hypothesis)
1.  **Race Condition:** `designWizardStore` might be re-saving the "empty" or "Step 4" state to Local Storage *after* the Hard Restore wipes it, but *before* the Hydration logic fetches the 32 screens from the DB.
2.  **Step 4 Overwrite:** If `studioFrames` is empty, the UI might default to showing `wizardData.step4.screens`. If `isStudioActive` is false or flaky, it re-initializes from Step 4 (which has 6 screens).
3.  **Route Project ID Mismatch:** The URL `projectId` might differ from the `projectId` stored in `wizardData`, causing the fetch to look at the wrong DB record.

## Solution Strategy (Next Steps)
1.  **Verify DB Content:** Use `api.debug_sessions` to confirm the *Target* Project ID actually holds the 32 screens after a Hard Restore.
2.  **Debug Store Subscription:** Add logging to `designWizardStore` to see WHO is writing to Local Storage and WHEN (is it overwriting the 32 screens?).
3.  **Force Read-Only:** disable auto-save to Local Storage temporarily to verify if that's the culprit.
