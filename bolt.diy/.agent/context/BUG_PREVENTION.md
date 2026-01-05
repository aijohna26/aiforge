# Studio Persistence Bug - Prevention Guide

## Will This Bug Return?

**Answer: Unlikely, but possible if safeguards are removed**

## Current Safeguards (5 Layers)

### Layer 1: Auto-Save Gate ✅
**File**: `app/lib/stores/designWizard.ts:549-565`

Blocks saves during hydration to prevent stale data from being written.

```typescript
if (!canAutoSave) {
  if (isStep5Change) {
    return; // Block save
  }
}
```

**Risk if removed**: Medium

### Layer 2: No Duplicate Hydration ✅
**File**: `app/components/workbench/design/Step5Interactive.tsx:494-510`

Removed duplicate hydration logic from `handleInitialize()`.

**Risk if removed**: Low (would cause double-hydration but Layer 4 would still protect)

### Layer 3: Fixed useEffect Dependencies ✅
**File**: `app/components/workbench/design/Step5Interactive.tsx:370`

Changed from `frames.length` to `storedStudioFrames.length` to prevent re-trigger loops.

**Risk if removed**: Low (would cause extra renders but Layer 4 would protect)

### Layer 4: Frame Count Protection ⚠️ **CRITICAL**
**File**: `app/lib/stores/designWizard.ts:772-793`

```typescript
if (currentFrames > incomingFrames && currentFrames > 0) {
  // Preserve current Step 5 data
  designWizardStore.set({
    ...migrated,
    step5: currentState.step5, // Keep higher frame count
  });
}
```

**Risk if removed**: ❌ **HIGH** - Data loss would occur immediately

**Protected by**:
- ⚠️ Warning comment with references
- ✅ Unit tests
- ✅ Documentation

### Layer 5: Debounced Saves ✅
**File**: `app/lib/stores/designWizard.ts:546-582`

2-second debounce reduces race conditions during rapid updates.

**Risk if removed**: Low (just performance impact)

## Scenarios Where Bug Could Return

### 1. Someone Refactors `loadWizardData()` ⚠️

**How it breaks**:
```typescript
// BAD: Removes the frame count check
export function loadWizardData(data: DesignWizardData) {
  designWizardStore.set(data); // ❌ Bypasses protection
}
```

**Prevention**:
- ✅ Warning comment with "DO NOT REMOVE"
- ✅ Unit tests will fail
- ✅ Code review should catch

**Likelihood**: Low (tests would fail)

### 2. New Data Source Bypasses Checks ⚠️

**How it breaks**:
```typescript
// BAD: New cloud sync bypasses loadWizardData
cloudSync.on('data', (syncedData) => {
  designWizardStore.set(syncedData); // ❌ Bypasses Layer 4
});
```

**Prevention**:
- ⚠️ Need to document: "Always use loadWizardData() for external data"
- ⚠️ Consider making designWizardStore.set() private

**Likelihood**: Medium (someone might not know about the pattern)

### 3. Direct Store Manipulation ⚠️

**How it breaks**:
```typescript
// BAD: Direct manipulation
const state = designWizardStore.get();
designWizardStore.set({
  ...state,
  step5: staleData, // ❌ Bypasses all checks
});
```

**Prevention**:
- Add ESLint rule to warn about direct `.set()` calls
- Use `updateStep5Data()` helper instead

**Likelihood**: Low (developers unlikely to bypass the helper)

## How to Verify Fix is Still Working

### Quick Test (30 seconds)
1. Load Studio with 32 frames
2. Reload page
3. Check console for: `[loadWizardData] Preserving current Step 5 data (32 frames)`
4. Verify localStorage has 32 frames

### Run Unit Tests
```bash
npm run test -- designWizard.persistence.test.ts
```

### Check Console Logs
Look for these messages in order:
```
[DesignWizard] 🔒 Auto-save is DISABLED until hydration completes
[Hydration] 📊 DB has 32 frames, local has 6 frames
[Hydration] 🔄 Upgrading to DB version (32 screens)
[DesignWizard] 💾 Auto-saved to localStorage (32 frames)
[Chat] Hydrating design wizard state from project: ...
[loadWizardData] Preserving current Step 5 data (32 frames) over incoming data (6 frames)
```

**❌ Warning signs**:
- No "[loadWizardData] Preserving..." message
- "⚠️ 6-FRAME SAVE DETECTED" warning
- Frame count drops after Chat hydration

## Recommended Additional Safeguards

### 1. Add ESLint Rule
```json
{
  "rules": {
    "no-restricted-syntax": [
      "error",
      {
        "selector": "CallExpression[callee.object.name='designWizardStore'][callee.property.name='set']",
        "message": "Use loadWizardData() or updateStep5Data() instead of direct .set()"
      }
    ]
  }
}
```

### 2. Add TypeScript Type Guard
```typescript
// Make .set() harder to call directly
export const designWizardStore = atom<DesignWizardData>(getInitialState());

// Export only safe methods
export const safeWizardStore = {
  get: designWizardStore.get,
  subscribe: designWizardStore.subscribe,
  // No .set() exposed
};
```

### 3. Add Runtime Assertion
```typescript
export function updateStep5Data(data: Partial<Step5Data>) {
  const current = designWizardStore.get();
  const currentFrames = current.step5?.studioFrames?.length || 0;
  const newFrames = data.studioFrames?.length || currentFrames;

  // ASSERT: Never lose significant data
  if (currentFrames > 10 && newFrames < currentFrames && newFrames > 0) {
    throw new Error(
      `Data loss prevented: Attempted to reduce frames from ${currentFrames} to ${newFrames}`
    );
  }

  // ... proceed with update
}
```

## Summary

**Current Protection Level**: 🛡️ **Good**

**Critical Safeguard**: Frame count check in `loadWizardData()` (Layer 4)

**Weaknesses**:
1. Someone could bypass `loadWizardData()` by calling `.set()` directly
2. New data sources might not know to use `loadWizardData()`

**Recommended Next Steps**:
1. ✅ Unit tests (DONE)
2. ✅ Warning comments (DONE)
3. ⚠️ Add ESLint rule (TODO)
4. ⚠️ Document data source priority (TODO)
5. ⚠️ Consider making `.set()` private (TODO)

**Confidence Level**: 85% - Bug unlikely to return unless someone actively removes safeguards
