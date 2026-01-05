# Studio Persistence Issue - FINAL FIX

## Problem
32 screens exist in the database, but the UI keeps reverting to 6-8 screens after page reload.

## Root Cause (Two Issues Found)

### Issue #1: Synchronous Subscriber Race Condition
When `updateStep5Data()` was called, it triggered the store subscriber **synchronously**. But `enableAutoSaveAfterHydration()` was called **after** `updateStep5Data()`, so the subscriber ran with `canAutoSave = false` and didn't save the 32 screens.

### Issue #2: 3-Second Timeout Race Condition
The original fix used a 3-second timeout to delay auto-save:

```typescript
setTimeout(() => {
  canAutoSave = true; // Enable after 3 seconds
}, 3000);
```

**Problem Timeline**:
- 0ms: Page loads, store initializes with 6 stale frames from localStorage
- 100ms: Component mounts, hydration fetch starts
- **3000ms: Timeout expires, auto-save enabled**
- 3000ms: **Subscriber fires IMMEDIATELY, saves 6 stale frames to localStorage** ❌
- 3500ms: Hydration completes, calls `enableAutoSaveAfterHydration()`
- 3500ms: Calls `updateStep5Data()` with 32 frames
- 3500ms: Subscriber saves 32 frames to localStorage ✅

**The Problem**: If hydration takes longer than 3 seconds (slow network), or if the user reloads the page between 3s and 3.5s, localStorage has 6 stale frames!

## The Solution

### Fix #1: Reorder enableAutoSaveAfterHydration() Call
Call `enableAutoSaveAfterHydration()` **BEFORE** `updateStep5Data()`:

```typescript
// BEFORE (BROKEN):
updateStep5Data({ studioFrames: dbVisual }); // Subscriber runs with canAutoSave=false
enableAutoSaveAfterHydration(); // Too late!

// AFTER (FIXED):
enableAutoSaveAfterHydration(); // Set canAutoSave=true FIRST
updateStep5Data({ studioFrames: dbVisual }); // Subscriber runs with canAutoSave=true ✅
```

### Fix #2: Remove 3-Second Timeout Entirely
**CRITICAL**: Auto-save is now **ONLY** enabled via explicit `enableAutoSaveAfterHydration()` calls. There is NO timeout-based auto-enable.

```typescript
// OLD (BROKEN):
setTimeout(() => {
  canAutoSave = true; // BAD: Can save stale data
}, 3000);

// NEW (FIXED):
// NO timeout! Auto-save ONLY enabled explicitly
console.log('[DesignWizard] 🔒 Auto-save is DISABLED until hydration completes');
```

### Fix #3: Allow Non-Studio Changes to Save
To prevent breaking the wizard steps 1-4, we allow those changes to save even when `canAutoSave = false`:

```typescript
if (!canAutoSave) {
  // EXCEPTION: Allow saving non-Studio state changes (steps 1-4)
  const isStep5Change = state.step5 && (
    state.step5.studioFrames?.length > 0 ||
    state.step5.customTheme ||
    state.step5.generatedScreens?.length > 0
  );

  if (isStep5Change) {
    console.log('⏸️  Auto-save skipped for Step 5 (waiting for hydration)');
    return; // Block Studio saves
  }

  // Allow saving steps 1-4 changes
  console.log('💾 Auto-saving non-Studio changes (Steps 1-4)');
}
```

## Changes Made

### File: [bolt.diy/app/lib/stores/designWizard.ts](../../../bolt.diy/app/lib/stores/designWizard.ts)

**Lines 539-579**: Removed 3-second timeout, added Step 5 change detection

```typescript
// Subscribe to store changes and save to localStorage
if (typeof window !== 'undefined') {
  // CRITICAL CHANGE: NEVER auto-enable via timeout
  // Auto-save is ONLY enabled via explicit enableAutoSaveAfterHydration() call
  console.log('[DesignWizard] 🔒 Auto-save is DISABLED until hydration completes');

  designWizardStore.subscribe((state) => {
    const frameCount = state.step5?.studioFrames?.length || 0;

    if (!canAutoSave) {
      // EXCEPTION: Allow saving non-Studio state changes (steps 1-4)
      const isStep5Change = state.step5 && (
        state.step5.studioFrames?.length > 0 ||
        state.step5.customTheme ||
        state.step5.generatedScreens?.length > 0
      );

      if (isStep5Change) {
        console.log(`[DesignWizard] ⏸️  Auto-save skipped for Step 5 (waiting for hydration, would save ${frameCount} frames)`);
        return;
      }

      console.log('[DesignWizard] 💾 Auto-saving non-Studio changes (Steps 1-4)');
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (canAutoSave) {
        console.log(`[DesignWizard] 💾 Auto-saved to localStorage (${frameCount} frames)`);
      }
    } catch (error) {
      console.error('[DesignWizard] Failed to save to localStorage:', error);
    }
  });
}
```

### File: [bolt.diy/app/components/workbench/design/Step5Interactive.tsx](../../../bolt.diy/app/components/workbench/design/Step5Interactive.tsx)

**Lines 473-487**: Reordered enableAutoSaveAfterHydration() to run BEFORE updateStep5Data()

```typescript
console.log(`[Hydration] 📝 Preparing to update store with ${dbVisual.length} hydrated frames`);

// CRITICAL ORDER: Enable auto-save BEFORE updating store
console.log('[Hydration] 🔓 Enabling auto-save before store update');
enableAutoSaveAfterHydration(); // ← MUST BE FIRST

// This will trigger subscriber, which can now save because canAutoSave=true
updateStep5Data({
  studioFrames: dbVisual,
  studioSnapshot: wizardSnapshot
}); // ← MUST BE SECOND

console.log('[Hydration] ✅ Store updated with hydrated frames');
```

## Expected Console Output

When the fix works correctly, you should see this sequence:

```
[DesignWizard] 🔒 Auto-save is DISABLED until hydration completes
[DesignWizard] 📂 Restored state from localStorage (6 frames)
[DesignWizard] ⏸️  Auto-save skipped for Step 5 (waiting for hydration, would save 6 frames)
[Hydration] 🔍 Checking project: <project-id> (local has 6 frames)
[Hydration] 📊 DB has 32 frames, local has 6 frames
[Hydration] 🔄 Upgrading to DB version (32 screens)
[Hydration] 📝 Preparing to update store with 32 hydrated frames
[Hydration] 🔓 Enabling auto-save before store update
[DesignWizard] ✅ Auto-save force-enabled after hydration (current frames: 32)
[DesignWizard] 💾 Auto-saved to localStorage (32 frames)
[Hydration] ✅ Store updated with hydrated frames
```

**Key Indicators of Success**:
1. ⏸️  Auto-save skipped messages (confirming stale data is NOT saved)
2. 🔓 Enabling auto-save BEFORE store update
3. 💾 Auto-saved to localStorage (32 frames) - confirming 32 screens are saved
4. On reload: "📂 Restored state from localStorage (32 frames)"

## Why This Fix Works

1. **No Timeout**: Auto-save is never enabled by a timer, eliminating the race condition where stale data gets saved before hydration completes
2. **Explicit Control**: Auto-save is ONLY enabled when hydration explicitly completes via `enableAutoSaveAfterHydration()`
3. **Correct Order**: `enableAutoSaveAfterHydration()` runs BEFORE `updateStep5Data()`, ensuring the subscriber can save when it fires
4. **Non-Blocking**: Steps 1-4 can still save normally, only Step 5 (Studio) saves are blocked until hydration

## Testing Checklist

1. ✅ Open DevTools Console
2. ✅ Load the Studio page with the project that has 32 screens
3. ✅ Verify console shows "🔒 Auto-save is DISABLED until hydration completes"
4. ✅ Verify console shows "⏸️  Auto-save skipped for Step 5" (with frame count)
5. ✅ Verify console shows "🔓 Enabling auto-save before store update"
6. ✅ Verify console shows "💾 Auto-saved to localStorage (32 frames)"
7. ✅ Verify UI shows all 32 screens
8. ✅ **Reload the page** (critical test!)
9. ✅ Verify console shows "📂 Restored state from localStorage (32 frames)"
10. ✅ Verify UI still shows all 32 screens

## Edge Cases Handled

1. **Very Slow Network**: Even if hydration takes 10+ seconds, auto-save won't be enabled until it completes
2. **User Reloads During Hydration**: No problem - hydration will run again and save the correct data
3. **Wizard Steps 1-4**: These can still save normally, won't be blocked by the Studio hydration lock
4. **No DB Data**: If DB has no data, auto-save is still enabled via the normal restore path (line 292)
