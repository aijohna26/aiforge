# Studio Persistence Issue - Root Cause & Solution

## Problem Summary
32 screens exist in the database, but the UI keeps reverting to showing 6-8 screens after page reload.

## Root Cause Analysis

### The Race Condition

The issue was a **synchronous subscriber race condition** combined with timing issues:

1. **Page Load Sequence (BROKEN)**:
   ```
   1. Page loads
   2. getInitialState() loads STALE 6-screen state from localStorage
   3. designWizardStore is initialized with stale state
   4. 3-second grace period starts (auto-save disabled)
   5. [Component mounts, hydration fetch starts...]
   6. ** 3 seconds elapse **
   7. Auto-save is enabled (canAutoSave = true)
   8. Subscriber IMMEDIATELY saves stale 6-screen state to localStorage
   9. [Hydration completes 500ms later]
   10. updateStep5Data() called with 32 screens
   11. Subscriber fires BUT canAutoSave is set AFTER updateStep5Data
   12. Result: 6 screens are saved, 32 screens lost
   ```

2. **Synchronous Subscriber Issue**:
   ```typescript
   // WRONG ORDER (original code)
   updateStep5Data({ studioFrames: dbVisual });
   // ↑ This synchronously triggers subscriber
   // ↓ Subscriber runs with canAutoSave=false, doesn't save
   enableAutoSaveAfterHydration();
   // ↑ Too late! Subscriber already ran
   ```

### Why It Failed

1. **Subscriber executes synchronously**: When `designWizardStore.set()` is called, all subscribers fire immediately in the same call stack
2. **Order matters**: `canAutoSave` must be `true` BEFORE `updateStep5Data()` is called
3. **3-second timeout**: If hydration takes > 3 seconds, the subscriber fires with stale data before hydration completes

## The Solution

### Fix #1: Enable Auto-Save BEFORE Updating Store
```typescript
// CORRECT ORDER (fixed code)
enableAutoSaveAfterHydration(); // Set canAutoSave = true FIRST
updateStep5Data({ studioFrames: dbVisual }); // THEN trigger subscriber
// ↑ Now subscriber runs with canAutoSave=true, saves 32 screens
```

### Fix #2: Comprehensive Logging
Added detailed console logs to trace the entire hydration flow:
- 📂 Initial state load with frame count
- 🔍 Hydration check start
- 📊 DB vs local comparison
- 🔄 Upgrade decision
- 📝 Store update preparation
- 🔓 Auto-save enablement
- ✅ Store update completion
- 💾 DB save scheduling

### Fix #3: Grace Period
Keep the 3-second grace period to prevent the subscriber from saving stale data if hydration completes quickly.

## Changes Made

### File: [bolt.diy/app/lib/stores/designWizard.ts](../../../bolt.diy/app/lib/stores/designWizard.ts)

**Lines 504-530**: Added frame count logging to `getInitialState()`
```typescript
const frameCount = parsed?.step5?.studioFrames?.length || 0;
console.log(`[DesignWizard] 📂 Restored state from localStorage (${frameCount} frames)`);
```

**Lines 543-567**: Enhanced auto-save subscriber with detailed logging
```typescript
setTimeout(() => {
  const currentState = designWizardStore.get();
  const currentFrameCount = currentState.step5?.studioFrames?.length || 0;
  canAutoSave = true;
  console.log(`[DesignWizard] ✅ Auto-save enabled (hydration window closed, current frames: ${currentFrameCount})`);
}, 3000);

designWizardStore.subscribe((state) => {
  const frameCount = state.step5?.studioFrames?.length || 0;
  if (!canAutoSave) {
    console.log(`[DesignWizard] ⏸️  Auto-save skipped (waiting for hydration, would save ${frameCount} frames)`);
    return;
  }
  // Save to localStorage...
});
```

**Lines 620-626**: Added logging to `enableAutoSaveAfterHydration()`
```typescript
export function enableAutoSaveAfterHydration() {
  const currentFrameCount = currentState.step5?.studioFrames?.length || 0;
  canAutoSave = true;
  console.log(`[DesignWizard] ✅ Auto-save force-enabled after hydration (current frames: ${currentFrameCount})`);
}
```

### File: [bolt.diy/app/components/workbench/design/Step5Interactive.tsx](../../../bolt.diy/app/components/workbench/design/Step5Interactive.tsx)

**Lines 439-502**: Enhanced hydration logic with comprehensive logging and **CRITICAL ORDER FIX**

```typescript
// HYDRATION CHECK
console.log(`[Hydration] 🔍 Checking project: ${targetProj} (local has ${storedStudioFrames.length} frames)`);

const dbRes = await fetch(`/api/studio/workspace?projectId=${targetProj}`);
const dbData = await dbRes.json();

if (dbRes.ok && dbData.workspace && Array.isArray(dbData.workspace.frames)) {
  const dbCount = dbData.workspace.frames.length;
  const localCount = storedStudioFrames.length;

  console.log(`[Hydration] 📊 DB has ${dbCount} frames, local has ${localCount} frames`);

  if (dbCount > localCount || (dbCount > 10 && localCount < 10)) {
    console.log(`[Hydration] 🔄 Upgrading to DB version (${dbCount} screens)`);

    // ... prepare dbVisual ...

    setFrames(dbVisual);
    if (dbData.workspace.theme) setCustomTheme(dbData.workspace.theme);

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

    toast.success(`Synced latest ${dbData.workspace.frames.length} screens from cloud.`);

    console.log('[Hydration] 💾 Scheduling DB save in 2 seconds');
    setTimeout(() => handleSave(), 2000);
  } else {
    console.log('[Hydration] ✅ Local version is up-to-date, no upgrade needed');
  }
} else {
  console.log('[Hydration] ⚠️  No workspace data found in DB');
}
```

## Testing Checklist

### Browser Console Verification

When the fix works correctly, you should see this sequence in the console:

```
[DesignWizard] 📂 Restored state from localStorage (6 frames)
[Hydration] 🔍 Checking project: <project-id> (local has 6 frames)
[Hydration] 📊 DB has 32 frames, local has 6 frames
[Hydration] 🔄 Upgrading to DB version (32 screens)
[Hydration] 📝 Preparing to update store with 32 hydrated frames
[Hydration] 🔓 Enabling auto-save before store update
[DesignWizard] ✅ Auto-save force-enabled after hydration (current frames: 32)
[DesignWizard] 💾 Auto-saved to localStorage (32 frames)
[Hydration] ✅ Store updated with hydrated frames
[Hydration] 💾 Scheduling DB save in 2 seconds
```

### Test Steps

1. **Open DevTools Console**
2. **Load the Studio page** with the project that has 32 screens
3. **Check Console Logs**:
   - Should see "📂 Restored state from localStorage (X frames)"
   - Should see "🔍 Checking project: ..."
   - Should see "📊 DB has 32 frames, local has X frames"
   - If X < 32, should see "🔄 Upgrading to DB version"
   - Should see "🔓 Enabling auto-save before store update"
   - Should see "💾 Auto-saved to localStorage (32 frames)"
4. **Verify UI**: Should show all 32 screens in the canvas
5. **Reload the Page**: Should still show 32 screens
6. **Check localStorage**: Should contain 32 frames in `appforge_design_wizard_state`

### Debugging Failed Hydration

If hydration fails, check for these log patterns:

**Pattern 1: No Upgrade Needed**
```
[Hydration] ✅ Local version is up-to-date, no upgrade needed
```
→ localStorage already has 32 screens, no issue

**Pattern 2: No Workspace Data**
```
[Hydration] ⚠️  No workspace data found in DB
```
→ Database doesn't have the data for this project ID
→ Check the project ID being used
→ May need to run Hard Restore again

**Pattern 3: Hydration Check Failed**
```
[Hydration] ❌ Hydration check failed: <error>
```
→ API call failed
→ Check network tab for errors

**Pattern 4: Auto-Save Skipped**
```
[DesignWizard] ⏸️  Auto-save skipped (waiting for hydration, would save X frames)
```
→ Auto-save correctly blocked during grace period
→ Should see "✅ Auto-save force-enabled" later

## Why This Fix Works

1. **Synchronous Control**: `enableAutoSaveAfterHydration()` sets `canAutoSave = true` before `updateStep5Data()` runs
2. **Immediate Save**: When `updateStep5Data()` triggers the subscriber, `canAutoSave` is already `true`, so the 32 screens are saved
3. **No Race**: The 3-second timeout can't interfere because we explicitly enable auto-save before the critical update
4. **Observable**: Comprehensive logging makes the entire flow visible in the console

## Potential Edge Cases

1. **Very Slow Network**: If the hydration fetch takes > 3 seconds, the timeout might enable auto-save and save stale data before hydration completes
   - **Mitigation**: `enableAutoSaveAfterHydration()` is called explicitly after hydration, which saves the correct data
   - **Risk**: Low, because the explicit call happens immediately after hydration

2. **Multiple Tabs**: If multiple tabs are open, they might compete to save to localStorage
   - **Mitigation**: Each tab runs hydration independently
   - **Risk**: Medium, last write wins (standard localStorage behavior)

3. **Browser Crash During Hydration**: If the browser crashes between enabling auto-save and completing hydration
   - **Mitigation**: Next load will retry hydration
   - **Risk**: Low, hydration is quick (<1 second typically)
