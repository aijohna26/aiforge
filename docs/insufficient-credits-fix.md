# Insufficient Credits UX Improvement

## Problem
Users were running out of credits but weren't being informed about it. The API was correctly checking credits and returning a 402 status code with an error message, but the frontend wasn't detecting this specific error case and showing a clear message to users.

## Solution
Updated the error handling in `Step5Frame.tsx` to specifically detect and handle insufficient credits errors:

### Changes Made

1. **Updated `handleGenerateScreen` function** (lines 425-540):
   - Modified error creation to preserve the HTTP status code from the API response
   - Added specific detection for 402 status code or "insufficient credits" in error message
   - Display clear, actionable error message: "Insufficient credits to generate this screen"
   - Show helpful description: "Please add more credits or choose a cheaper model"

2. **Updated `handleEditScreen` function** (lines 655-755):
   - Applied the same error handling pattern for consistency
   - Users now get informed when editing screens fails due to insufficient credits

### Error Detection Logic
```typescript
const isCreditError = (error as any)?.status === 402 || 
                     error.message.toLowerCase().includes('insufficient credits');

if (isCreditError) {
    message = 'Insufficient credits to generate this screen';
    description = error.message || 'Please add more credits or choose a cheaper model';
}
```

### User Experience
**Before**: Silent failure or generic error message  
**After**: **Prominent** toast notification with:
- **Title**: "💳 Insufficient Credits"
- **Description**: Shows the specific error from API (e.g., "Insufficient credits. Required: 6, Available: 5")
- **Duration**: 10 seconds (extended for visibility)
- **Styling**: Red background with white text and red border for high visibility
- **Actionable guidance**: "You need more credits to generate this screen. Please add credits or choose a cheaper model."
- **Explicit dismissal**: Loading toast is dismissed before showing error to prevent conflicts

## Consistency
This implementation matches the error handling pattern already used in:
- `CustomScreenGenerator.tsx` (lines 316-319, 392-402)
- `screen-generator.tsx` (lines 332-336, 440-443)
- `logo-generator.tsx` (lines 133, 184, 450)

## Testing
To verify the fix works:
1. Ensure user has insufficient credits (balance < cost)
2. Try to generate a screen in Step 5
3. Should see clear error toast: "Insufficient credits to generate this screen"
4. Description should show: "Insufficient credits. Required: X, Available: Y"
