# Image Generation Timeout & Error Handling Improvements

## Changes Made

### 1. Increased Timeouts

#### GPT-Image-1 (Kie 4o)
- **Before**: 5 minutes (60 attempts × 5 seconds)
- **After**: 10 minutes (120 attempts × 5 seconds)
- **Reason**: Complex requests with icons and text need more processing time

#### Gemini (Kie.ai)
- **Before**: 
  - nano-banana: 100 seconds (10 attempts × 10 seconds)
  - nano-banana-pro: 200 seconds (20 attempts × 10 seconds)
- **After**:
  - nano-banana: 200 seconds (20 attempts × 10 seconds)
  - nano-banana-pro: 300 seconds (30 attempts × 10 seconds)
- **Reason**: More time for complex UI generation with detailed elements

### 2. Improved Error Messages

#### Task Creation Failures (500 Errors)
**Before**:
```
Image generation task creation failed: Creating a build task failed
```

**After**:
```
Image generation service error (500): Creating a build task failed. 
This usually means the service is temporarily overloaded. 
Please wait a moment and try again. If the issue persists, 
try simplifying your prompt or using a different model.
```

#### Timeout Errors
**Before**:
```
Image generation timed out. Please try again.
```

**After**:
```
Image generation timed out after 600 seconds. The task may still be processing. 
Please try again in a few moments, or try a simpler prompt.
```

For Gemini models:
```
Image generation timed out after 200 seconds using model google/nano-banana. 
The task may still be processing. Please try again in a few moments, or try a 
simpler prompt. For complex requests with icons and text, consider using 
GPT-Image-1 model which handles text better.
```

#### Status-Code-Specific Messages
- **500**: Service overloaded, wait and retry
- **429**: Rate limit exceeded, wait before retrying
- **400**: Invalid request, check prompt/images
- **Other**: Generic error with status code

### 3. Better User Guidance

All error messages now include:
1. **What happened**: Clear description of the error
2. **Why it happened**: Likely cause (overload, timeout, etc.)
3. **What to do**: Actionable next steps
4. **Alternatives**: Suggestions for different models or approaches

## Testing Recommendations

1. **Test with complex prompts** (icons + text) to verify 10-minute timeout works
2. **Test error scenarios**:
   - Intentionally trigger 500 errors (overload service)
   - Test rate limiting (429 errors)
   - Test invalid prompts (400 errors)
3. **Verify error messages** are user-friendly and actionable

## Files Modified

- `/app/lib/generate-image.ts`:
  - Lines 157-158: Increased GPT-Image-1 timeout to 10 minutes
  - Lines 224: Improved timeout error message for GPT-Image-1
  - Lines 133-161: Enhanced error handling for GPT-Image-1 task creation
  - Lines 358-359: Increased Gemini timeout to 3.3-5 minutes
  - Lines 417: Improved timeout error message for Gemini
  - Lines 330-360: Enhanced error handling for Gemini task creation

## Expected Impact

- **Fewer timeout errors** for complex requests
- **Better user experience** with clear, actionable error messages
- **Reduced support burden** as users understand what went wrong and how to fix it
- **Improved success rate** for icon+text generation requests
