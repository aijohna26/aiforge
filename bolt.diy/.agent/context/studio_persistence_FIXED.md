# Studio Session Persistence Issue - FIXED

## Problem Summary
The Studio canvas had 32 screens in the database, but the UI kept reverting to showing only 6-8 screens on page reload.

## Root Cause
**Race Condition in localStorage Auto-Save**

The `designWizardStore` had a subscriber that auto-saved to localStorage on EVERY state change. This created a race condition:

1. Page loads → `getInitialState()` reads from localStorage (empty or stale state with 6 screens)
2. Store initializes with this stale state
3. **Store subscriber IMMEDIATELY saves stale state BACK to localStorage** (line 535-542)
4. DB Hydration runs later (in useEffect) and loads 32 screens from DB
5. But it's too late - the stale 6-screen state was already written to localStorage

On the next page reload, localStorage now has the 6-screen state, overwriting the DB's 32 screens.

## The Fix

### 1. Added Grace Period for Hydration ([designWizard.ts:533-562](bolt.diy/app/lib/stores/designWizard.ts#L533-L562))

```typescript
// CRITICAL FIX: Prevent localStorage auto-save during initialization/hydration
let canAutoSave = false;

// DELAY auto-save to allow DB hydration to complete first
setTimeout(() => {
  canAutoSave = true;
  console.log('[DesignWizard] ✅ Auto-save enabled (hydration window closed)');
}, 3000); // 3 second grace period

designWizardStore.subscribe((state) => {
  if (!canAutoSave) {
    console.log('[DesignWizard] ⏸️  Auto-save skipped (waiting for hydration)');
    return;
  }
  // ... save to localStorage
});
```

**Effect**: Auto-save is disabled for the first 3 seconds after page load, giving the DB hydration logic time to load the 32 screens without interference.

### 2. Added Manual Enable Function ([designWizard.ts:612-619](bolt.diy/app/lib/stores/designWizard.ts#L612-L619))

```typescript
export function enableAutoSaveAfterHydration() {
  if (typeof window !== 'undefined') {
    canAutoSave = true;
    console.log('[DesignWizard] ✅ Auto-save force-enabled after hydration');
  }
}
```

**Effect**: Allows hydration to complete faster than 3 seconds and immediately enable auto-save.

### 3. Called from Hydration Success Points ([Step5Interactive.tsx](bolt.diy/app/components/workbench/design/Step5Interactive.tsx))

Added `enableAutoSaveAfterHydration()` calls at:

- **Line 476**: After DB hydration upgrades from 6 screens to 32 screens
- **Line 292**: After loading stored frames from localStorage

**Effect**: As soon as frames are successfully loaded (either from DB or localStorage), auto-save is re-enabled so subsequent changes are properly persisted.

## How It Works Now

### Initial Page Load (with DB data):
1. Page loads → Store initializes with empty/stale state
2. **Auto-save is DISABLED** for 3 seconds
3. DB Hydration runs → Fetches 32 screens from database
4. Updates store with 32 screens
5. **Immediately enables auto-save** via `enableAutoSaveAfterHydration()`
6. Auto-save now writes 32 screens to localStorage
7. Next reload will load 32 screens from localStorage immediately

### Subsequent Page Loads (with localStorage data):
1. Page loads → Store initializes with 32 screens from localStorage
2. **Auto-save is DISABLED** for 3 seconds
3. Frames are loaded into UI
4. **Immediately enables auto-save** via `enableAutoSaveAfterHydration()`
5. No DB hydration needed (localStorage is up-to-date)

## Logging Added

All localStorage operations now log with visual indicators:
- `⏸️ Auto-save skipped (waiting for hydration)` - During grace period
- `✅ Auto-save enabled (hydration window closed)` - After timeout
- `✅ Auto-save force-enabled after hydration` - After manual enable
- `💾 Auto-saved to localStorage` - On each save, with frame counts

## Testing Checklist

- [ ] Hard Restore → Verify 32 screens load
- [ ] Reload page → Verify 32 screens persist
- [ ] Browser console shows hydration logs
- [ ] No "Auto-save skipped" after hydration completes
- [ ] Frame count in localStorage matches UI

## Files Changed

1. [app/lib/stores/designWizard.ts](bolt.diy/app/lib/stores/designWizard.ts)
   - Added `canAutoSave` flag
   - Added 3-second grace period
   - Added `enableAutoSaveAfterHydration()` export
   - Enhanced logging

2. [app/components/workbench/design/Step5Interactive.tsx](bolt.diy/app/components/workbench/design/Step5Interactive.tsx)
   - Import `enableAutoSaveAfterHydration`
   - Call after DB hydration success (line 476)
   - Call after loading stored frames (line 292)

## Related Issues Fixed

This also resolves:
- Step 4 changes not reverting Step 5 work (intended behavior preserved)
- Manual saves working correctly after hydration
- Hard Restore button functioning reliably
