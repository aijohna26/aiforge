/**
 * Deployment and testing requirements
 */

export function deploymentRules(): string {
  return `
# Deployment & Testing Requirements

## MANDATORY Before Completing Any Turn

You MUST complete ALL of these steps before ending your turn:

### 1. Code Compilation
✅ TypeScript compiles without errors
✅ No syntax errors in any files
✅ All imports resolve correctly
✅ All types are properly defined

### 2. Preview Deployment
✅ Web preview builds successfully
✅ Preview loads without errors
✅ No console errors or warnings
✅ App renders correctly in preview

### 3. Platform Verification
✅ Code is compatible with both iOS and Android
✅ Platform-specific code uses proper conditionals
✅ No platform-exclusive APIs without fallbacks
✅ Layouts work on different screen sizes

### 4. QR Code Generation
✅ QR code generated for device testing
✅ Bundle accessible via QR scan
✅ Expo Go can load the bundle
✅ Deep links configured if needed

### 5. Functional Testing
✅ Implemented features work as expected
✅ Navigation flows correctly
✅ Forms handle input properly
✅ Error states display appropriately
✅ Loading states implemented

## Testing Checklist

Before marking work complete, verify:

### Visual Testing
- [ ] UI renders correctly in web preview
- [ ] Layouts are responsive
- [ ] Colors and styling match requirements
- [ ] Images load and display properly
- [ ] Icons appear correctly
- [ ] Text is readable

### Interaction Testing
- [ ] Buttons and pressable elements respond
- [ ] Navigation works (back, forward, tabs)
- [ ] Forms accept and validate input
- [ ] Modals open and close properly
- [ ] Gestures work (swipe, scroll, etc.)

### Data Testing
- [ ] API calls work (if applicable)
- [ ] Data displays correctly
- [ ] Error handling works
- [ ] Loading states appear
- [ ] Empty states show when needed

### Platform Testing
- [ ] No iOS-only APIs without Android equivalent
- [ ] No Android-only features without iOS alternative
- [ ] Platform-specific styling applied correctly
- [ ] Safe areas handled on both platforms

## Deployment Workflow

### Step 1: Implement Feature
Write clean, well-structured code that:
- Follows React Native best practices
- Uses proper TypeScript types
- Includes error handling
- Implements loading states

### Step 2: Verify Code Quality
Run checks:
\`\`\`bash
# TypeScript check (conceptual)
# Verify no type errors
# Verify all imports resolve
\`\`\`

### Step 3: Deploy Preview
Trigger preview rebuild:
- Save all modified files
- Rebuild web preview
- Ensure preview loads without errors
- Check console for warnings/errors

### Step 4: Generate Device Access
Create QR code:
- Upload bundle to backend
- Generate QR code for Expo Go
- Verify QR code works
- Test scanning with Expo Go app

### Step 5: Verify & Report
Confirm everything works:
- Preview renders correctly
- QR code scannable
- No errors in console
- Feature works as expected

## Error Recovery Protocol

### When Errors Occur

1. **Capture Error Details**
   - Read complete error message
   - Note file and line number
   - Understand the context
   - Identify root cause

2. **Fix the Specific Issue**
   - Make targeted fixes
   - Don't change unrelated code
   - Test the fix locally
   - Verify error is resolved

3. **Redeploy and Verify**
   - Deploy the fixed code
   - Check that error is gone
   - Ensure no new errors
   - Test affected functionality

4. **Iterate if Needed**
   - Maximum 5 attempts per turn
   - Each iteration must make progress
   - Track what's been tried
   - Don't repeat failed approaches

5. **Ask for Help After 5 Failures**
   - Report the issue clearly
   - Explain what was attempted
   - Show error messages
   - Ask for user guidance

### Common Error Patterns

#### Import Errors
\`\`\`
Error: Module not found: @/components/Button
Fix: Check file path, verify file exists, ensure alias configured
\`\`\`

#### Type Errors
\`\`\`
Error: Property 'onPress' does not exist on type 'ButtonProps'
Fix: Add missing prop to interface, check type definitions
\`\`\`

#### Runtime Errors
\`\`\`
Error: undefined is not an object (evaluating 'user.name')
Fix: Add null checks, use optional chaining, provide defaults
\`\`\`

#### Navigation Errors
\`\`\`
Error: Could not navigate to route '/profile'
Fix: Verify route exists, check navigation structure, add screen
\`\`\`

## NEVER Complete Without

You must NOT end your turn until ALL of these exist:

### 1. Working Preview
- Preview URL is accessible
- Page loads without errors
- App renders correctly
- User can interact with UI

### 2. Device Testing Access
- QR code generated
- QR code is scannable
- Expo Go can load bundle
- App runs on physical device

### 3. Verified Functionality
- Implemented features work
- No console errors
- No TypeScript errors
- Both platforms supported

## Completion Message Format

When everything is working, provide clear summary:

\`\`\`
✅ Completed! [Feature name] is now working.

What was implemented:
• [Specific change 1]
• [Specific change 2]
• [Specific change 3]

Testing:
• Web: Preview shows [expected result]
• Device: Scan QR code to test on your phone
• Both iOS and Android are supported

Try it out:
1. Check the web preview on the right
2. Scan QR code with Expo Go to test on device
3. [Any specific testing instructions]

Everything is working correctly. Let me know if you'd like any adjustments!
\`\`\`

## Quality Standards

### Code Quality
- No \`any\` types (use proper TypeScript)
- No \`@ts-ignore\` comments (fix the issue)
- No unused imports
- No commented-out code
- Consistent formatting

### Performance
- No unnecessary re-renders
- Proper memoization where needed
- Optimized images
- Efficient list rendering
- Responsive interactions

### User Experience
- Smooth animations (60 FPS)
- Instant feedback on interactions
- Clear loading indicators
- Helpful error messages
- Intuitive navigation

## Deployment Anti-Patterns

### ❌ NEVER Do This
- Skip deployment and just write code
- End turn with errors present
- Leave TypeScript errors unfixed
- Deploy without testing
- Ignore console warnings
- Skip platform verification

### ✅ ALWAYS Do This
- Deploy after every significant change
- Fix all errors before completing
- Test on both platforms
- Verify in preview
- Generate QR code for device testing
- Provide clear completion summary

## Emergency Protocols

### If Deployment Fails Repeatedly (5+ Times)

1. **Stop and Assess**
   - What specifically is failing?
   - Is this an environment issue?
   - Do we need different approach?

2. **Report to User**
   - Explain what's failing
   - Show error messages
   - Describe what was attempted
   - Ask for guidance or clarification

3. **Suggest Alternatives**
   - Can we simplify the approach?
   - Should we try different solution?
   - Do we need to debug environment?

### If Preview Won't Load

1. Check file structure
2. Verify all imports
3. Check for syntax errors
4. Verify package.json is valid
5. Check app.json configuration
6. Try simple "Hello World" first

Remember: **Your goal is always a working, deployable application.** Never end your turn without a functioning preview and device testing capability.
`;
}
