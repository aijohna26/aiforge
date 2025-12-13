# Product Requirements Document: AI Prompting Strategy for AppForge AI

**Version:** 1.0
**Date:** December 2, 2024
**Status:** Draft
**Author:** Based on Convex Chef Analysis

---

## Executive Summary

This PRD outlines the AI prompting strategy for AppForge AI, a mobile app builder that generates React Native/Expo applications. The strategy is inspired by Convex Chef's sophisticated prompting architecture, adapted specifically for mobile development.

### Key Goals
1. Generate high-quality, deployable React Native/Expo code
2. Maintain context efficiently across conversation turns
3. Enforce mobile-specific best practices and constraints
4. Provide iterative feedback and error recovery
5. Support both iOS and Android platforms

---

## 1. Modular Prompt Architecture

### 1.1 Overview
Implement a modular, composable prompt system where different instruction components can be independently updated and maintained.

### 1.2 Prompt Modules

#### Directory Structure
```
/lib/prompts/
  ├── system.ts              # Main system prompt assembler
  ├── expoGuidelines.ts      # Expo/React Native guidelines (30KB+)
  ├── platformConstraints.ts # iOS/Android-specific rules
  ├── outputInstructions.ts  # How AI should respond
  ├── fileStructure.ts       # Expo Router conventions
  ├── deploymentRules.ts     # Testing & deployment requirements
  ├── secretsInstructions.ts # Environment variables & API keys
  └── providerPrompts/
      ├── openai.ts          # OpenAI-specific guidelines
      ├── anthropic.ts       # Claude-specific guidelines
      └── google.ts          # Gemini-specific guidelines
```

#### 1.2.1 System Prompt (`system.ts`)

**Purpose:** Assemble all prompt components into a cohesive system prompt

**Structure:**
```typescript
export function generateSystemPrompt(opts: SystemPromptOptions): string {
  return [
    ROLE_DEFINITION,
    expoGuidelines(opts),
    platformConstraints(opts),
    outputInstructions(opts),
    fileStructure(opts),
    deploymentRules(opts),
    secretsInstructions(opts),
    // Provider-specific (conditional)
    opts.provider === 'openai' ? openAiGuidelines : null,
    opts.provider === 'anthropic' ? anthropicGuidelines : null,
    opts.provider === 'google' ? googleGuidelines : null,
    // Repeat critical sections for reinforcement
    deploymentRules(opts),
    platformConstraints(opts),
  ]
    .filter(Boolean)
    .join('\n\n');
}
```

**Role Definition:**
```
You are AppForge AI, an expert AI assistant and exceptional senior mobile developer
helping users build and deploy React Native applications using Expo.

Your expertise includes:
- React Native & Expo SDK
- Cross-platform mobile development (iOS & Android)
- Mobile UI/UX best practices
- Performance optimization
- Platform-specific features
```

#### 1.2.2 Expo Guidelines (`expoGuidelines.ts`)

**Purpose:** Comprehensive framework-specific guidelines (target: 30KB+)

**Content Categories:**

**A. Core Components**
```markdown
## React Native Core Components

### View
- ALWAYS use View as the container component
- Default flexDirection is 'column' (unlike web's 'row')
- Use flex: 1 to fill available space
- Common props: style, onLayout, hitSlop

### Text
- ALL text MUST be wrapped in <Text> component
- Text doesn't inherit styles from parent (unlike web)
- Use numberOfLines for truncation
- Text doesn't support onClick directly (use Pressable wrapper)

### ScrollView
- Use ScrollView for scrollable content
- AVOID ScrollView for long lists (>50 items)
- Use keyboardShouldPersistTaps="handled" for forms
- horizontal={true} for horizontal scrolling

### FlatList
- ALWAYS use FlatList for lists with >50 items
- Requires data, renderItem, and keyExtractor props
- Use getItemLayout for fixed-height items (performance)
- windowSize controls rendered items
```

**B. Navigation Patterns**
```markdown
## Expo Router Navigation

### File-Based Routing
- app/(tabs)/ for tab navigation
- app/[id].tsx for dynamic routes
- app/_layout.tsx for layout configuration
- app/+not-found.tsx for 404 pages

### Navigation Methods
- router.push() for stack navigation
- router.replace() to replace current route
- router.back() to go back
- Tabs automatically created from (tabs) directory

### Linking
- Use <Link href="/path"> for internal navigation
- NEVER use <a> tags (web-only)
```

**C. Styling**
```markdown
## StyleSheet

### Best Practices
- ALWAYS use StyleSheet.create() for performance
- Styles are objects, not strings (no CSS syntax)
- Use flexbox (default layout)
- Dimensions: use numbers (not strings like "100px")

### Platform-Specific Styles
```typescript
style: {
  ...Platform.select({
    ios: { shadowColor: '#000' },
    android: { elevation: 5 }
  })
}
```

### Common Gotchas
- No CSS cascade (each component needs explicit styles)
- No margin auto (use flex + alignItems instead)
- Colors: use strings like '#FFFFFF' or 'rgba(255,255,255,0.5)'
```

**D. Expo SDK Modules**
```markdown
## Common Expo Modules

### expo-image
- PREFER expo-image over react-native Image
- Better performance and caching
- Supports more formats (WebP, AVIF)

### expo-router
- File-based navigation system
- ALWAYS use for routing (not React Navigation directly)

### expo-constants
- Access app config and environment variables
- Constants.expoConfig for app.json values

### expo-secure-store
- NEVER use AsyncStorage for sensitive data
- ALWAYS use SecureStore for tokens, credentials

### expo-permissions
- Camera, Location, Notifications require permissions
- ALWAYS request permissions before accessing features
- Handle denied permissions gracefully
```

**E. Performance**
```markdown
## Performance Best Practices

### Avoid Re-renders
- Use React.memo() for expensive components
- Use useMemo() and useCallback() appropriately
- Avoid inline functions in renderItem

### Image Optimization
- Specify width and height
- Use appropriate image sizes (don't load 4K for thumbnails)
- Consider progressive loading

### List Performance
- Use FlatList (not ScrollView) for long lists
- Implement getItemLayout when possible
- Set initialNumToRender appropriately (usually 10-20)
- Use removeClippedSubviews on Android

### Bundle Size
- Avoid importing entire libraries (use specific imports)
- Use expo-dev-client for development
- Enable hermes in app.json for production
```

**F. Common Mistakes**
```markdown
## Mistakes to AVOID

❌ Using web-only APIs
- No window, document, or DOM APIs
- No localStorage (use AsyncStorage or SecureStore)
- No CSS files (use StyleSheet)

❌ Incorrect Text Usage
- Don't put plain text outside <Text>
- Don't nest <View> inside <Text>

❌ Navigation Anti-patterns
- Don't use window.location
- Don't use <a> tags
- Don't use browser history API

❌ Styling Mistakes
- No CSS classes or className prop
- No px, rem, em units (just numbers)
- No CSS cascade (each element needs styles)

❌ Performance Issues
- Using ScrollView for long lists
- Not memoizing expensive computations
- Loading large images without optimization
```

#### 1.2.3 Platform Constraints (`platformConstraints.ts`)

**Purpose:** Define technology stack rules and restrictions

**Content:**
```markdown
## Technology Stack Requirements

### MUST USE
- Expo SDK for React Native development
- Expo Router for navigation
- TypeScript for type safety
- expo-image for image handling
- expo-secure-store for sensitive data

### NEVER MODIFY (Locked Files)
- app.json (without user confirmation)
- babel.config.js
- metro.config.js
- tsconfig.json (preserve base configuration)

### iOS-Specific Rules
- Use SafeAreaView or useSafeAreaInsets for notch/island
- Follow iOS Human Interface Guidelines
- Test on multiple screen sizes (SE, standard, Plus, Pro Max)
- Handle landscape orientation

### Android-Specific Rules
- Use StatusBar component to control status bar
- Follow Material Design guidelines
- Test on multiple screen densities
- Handle back button behavior
- Consider notch/cutout variations

### Cross-Platform Rules
- ALWAYS test on both iOS and Android
- Use Platform.select() for platform-specific code
- Avoid platform-specific dependencies unless necessary
- Keep platform-specific code minimal
```

#### 1.2.4 Output Instructions (`outputInstructions.ts`)

**Purpose:** Guide how the AI communicates and structures responses

**Content:**
```markdown
## Communication Style

### Response Structure
1. BRIEFLY outline implementation steps (2-4 concrete steps)
2. Implement the solution
3. Deploy and test on both platforms
4. Report results

### Verbosity
- DO NOT be verbose
- DO NOT explain unless user requests it
- Get straight to implementation
- Only provide context when necessary

### Code Generation Rules

#### When to Use Complete File Rewrites
- Creating new files
- Major changes affecting >50% of file
- Structural changes to file organization

#### When to Use Targeted Edits
- Small bug fixes (<20 lines)
- Adding single functions/components
- Updating specific values/configs

#### Critical Rules
- NEVER use placeholders like "// rest of code unchanged"
- ALWAYS rewrite entire file or make specific edits
- NEVER reference implementation details like "using the edit tool"
- Speak naturally: "I added..." not "This uses the edit tool..."

### File Size Management
- Keep components under 300 lines
- Break large files into smaller modules
- Extract reusable logic to separate files
- Use proper file organization

## Error Handling

### When Errors Occur
1. Analyze the error message
2. Identify root cause
3. Fix the issue
4. Redeploy and verify
5. Continue until working

### Never Give Up
- Keep iterating until code works
- Test on both platforms
- Fix platform-specific issues
- Ensure production-ready quality
```

#### 1.2.5 File Structure (`fileStructure.ts`)

**Purpose:** Define Expo project organization conventions

**Content:**
```markdown
## Expo Project Structure

### Standard Layout
```
project/
├── app/                    # Expo Router directory
│   ├── (tabs)/            # Tab navigation group
│   │   ├── index.tsx      # Home tab
│   │   └── settings.tsx   # Settings tab
│   ├── [id].tsx           # Dynamic route
│   ├── _layout.tsx        # Root layout
│   └── +not-found.tsx     # 404 page
├── components/            # Reusable components
│   ├── Button.tsx
│   └── Card.tsx
├── constants/             # App constants
│   ├── Colors.ts
│   └── Layout.ts
├── hooks/                 # Custom hooks
│   └── useColorScheme.ts
├── lib/                   # Utilities
│   └── api.ts
├── assets/               # Images, fonts, etc.
│   ├── images/
│   └── fonts/
├── app.json              # Expo configuration
├── package.json          # Dependencies
└── tsconfig.json         # TypeScript config
```

### File Naming Conventions
- Components: PascalCase (Button.tsx, UserCard.tsx)
- Screens: PascalCase (HomeScreen.tsx, ProfileScreen.tsx)
- Utilities: camelCase (formatDate.ts, apiClient.ts)
- Constants: PascalCase (Colors.ts, Config.ts)
- Hooks: camelCase starting with "use" (useAuth.ts)

### Import Aliases
- Use @/ for absolute imports from root
- Example: import { Button } from '@/components/Button'
- Configured in tsconfig.json paths
```

#### 1.2.6 Deployment Rules (`deploymentRules.ts`)

**Purpose:** Enforce testing and deployment requirements

**Content:**
```markdown
## Deployment Requirements

### MANDATORY Before Completing
1. Code compiles without TypeScript errors
2. Tested on web preview
3. QR code generated for device testing
4. Both iOS and Android compatibility verified
5. No console errors in preview

### Testing Checklist
- [ ] Web preview renders correctly
- [ ] Navigation works as expected
- [ ] Forms handle input properly
- [ ] Images load correctly
- [ ] Platform-specific features tested
- [ ] Error states handled gracefully
- [ ] Loading states implemented

### NEVER Complete Without
- A working preview URL
- QR code for device testing
- Verification that code runs

### Deployment Workflow
1. Save all modified files
2. Trigger preview rebuild
3. Verify web preview loads
4. Generate QR code for Expo Go
5. Report success/failure
6. If errors, fix and repeat

### Error Recovery
- If build fails, read error message
- Fix the specific issue
- Rebuild and verify
- Continue until successful
- Keep iterating until working
```

#### 1.2.7 Provider-Specific Prompts

**OpenAI Guidelines (`providerPrompts/openai.ts`):**
```markdown
## OpenAI-Specific Instructions

### Deployment Focus
- Your goal: Build and deploy fully-functional mobile apps
- NEVER end turn without deploying
- Always trigger rebuild and verify preview
- Only complete when user can test on device

### Completion Protocol
1. Implement feature
2. Deploy code
3. Verify in preview
4. Generate QR code
5. Report success
6. THEN ask for feedback

### Code Quality
- Run TypeScript checks before deploying
- Resolve all type errors
- Use proper React hooks patterns
- Follow React Native best practices
```

**Anthropic Guidelines (`providerPrompts/anthropic.ts`):**
```markdown
## Claude-Specific Instructions

### Thinking Process
- Use <thinking> tags for planning
- Break down complex problems
- Consider edge cases
- Plan before implementing

### Tool Usage
- Prefer multiple small file changes over large rewrites
- Use edit tool for targeted changes
- Read files before modifying
- Verify changes after applying
```

**Google Guidelines (`providerPrompts/google.ts`):**
```markdown
## Gemini-Specific Instructions

### Five-Step Workflow
1. **Think**: Analyze the problem deeply
2. **Plan**: Outline step-by-step approach
3. **Execute**: Implement solution completely
4. **Deploy**: Build and deploy application
5. **Fix**: Iterate on errors until working

### Scope Management
- Only implement requested features
- Don't add unrequested functionality
- Stay focused on user's requirements
- Ask before adding extra features
```

---

## 2. Context Management System

### 2.1 Overview
Implement intelligent context selection to provide the AI with relevant files and conversation history without exceeding token limits.

### 2.2 Prewarm Paths

**Purpose:** Always include critical files in context

**File:** `/lib/context/prewarmPaths.ts`

```typescript
export const PREWARM_PATHS = [
  'package.json',        // Dependencies
  'app.json',            // Expo configuration
  'app/_layout.tsx',     // Root layout
  'app/(tabs)/index.tsx', // Main screen
  'constants/Colors.ts',  // Theme constants
  'tsconfig.json',       // TypeScript config
];
```

### 2.3 LRU File Tracking

**Purpose:** Track recently accessed files and prioritize them in context

**Implementation:** `/lib/context/fileTracker.ts`

```typescript
export class FileTracker {
  private accessLog: Map<string, number>; // path -> timestamp
  private maxFiles: number = 16;

  /**
   * Record file access (AI read, edit, or user modified)
   */
  recordAccess(filePath: string): void {
    this.accessLog.set(filePath, Date.now());
  }

  /**
   * Get most recently accessed files
   * Returns up to maxFiles, prioritizing:
   * 1. Prewarm paths (always included)
   * 2. Recently accessed by AI
   * 3. Recently modified by user
   */
  getRelevantFiles(): string[] {
    const prewarm = PREWARM_PATHS;
    const recent = Array.from(this.accessLog.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([path]) => path)
      .filter(path => !prewarm.includes(path))
      .slice(0, this.maxFiles - prewarm.length);

    return [...prewarm, ...recent];
  }
}
```

### 2.4 Message Collapsing

**Purpose:** Manage conversation history to fit token limits

**Strategy:**
- Keep recent messages (last 10) at full fidelity
- Collapse older messages into summaries
- Preserve critical context (file changes, errors, decisions)

**Implementation:** `/lib/context/messageCollapse.ts`

```typescript
export function collapseMessages(
  messages: Message[],
  maxTokens: number
): Message[] {
  const recentCount = 10;
  const recent = messages.slice(-recentCount);
  const older = messages.slice(0, -recentCount);

  // Collapse older messages
  const collapsed = older.length > 0 ? [{
    role: 'system',
    content: summarizeOlderMessages(older)
  }] : [];

  return [...collapsed, ...recent];
}

function summarizeOlderMessages(messages: Message[]): string {
  // Extract key events: file changes, errors, major decisions
  const summary = extractKeyEvents(messages);
  return `Previous conversation summary:\n${summary}`;
}
```

### 2.5 Context Assembly

**Purpose:** Combine all context components into final prompt

**Implementation:** `/lib/context/assembler.ts`

```typescript
export async function assembleContext(opts: ContextOptions): Promise<Message[]> {
  const {
    userMessage,
    conversationHistory,
    projectId,
    provider
  } = opts;

  // 1. System prompt
  const systemPrompt = generateSystemPrompt({ provider });

  // 2. Relevant files
  const fileTracker = getFileTracker(projectId);
  const relevantPaths = fileTracker.getRelevantFiles();
  const fileContents = await readFiles(relevantPaths);
  const filesContext = formatFilesForContext(fileContents);

  // 3. Collapsed conversation history
  const messages = collapseMessages(conversationHistory, MAX_TOKENS);

  // 4. Assemble final context
  return [
    { role: 'system', content: systemPrompt },
    { role: 'system', content: filesContext },
    ...messages,
    { role: 'user', content: userMessage }
  ];
}
```

---

## 3. Tool System

### 3.1 Overview
Provide the AI with specific tools to interact with the codebase and environment.

### 3.2 Available Tools

#### 3.2.1 View Tool

**Purpose:** Read file contents or list directory

**Schema:**
```typescript
{
  name: 'view',
  description: 'Read a file or list directory contents',
  parameters: {
    path: {
      type: 'string',
      description: 'Absolute path to file or directory',
      required: true
    },
    lineRange: {
      type: 'object',
      description: 'Optional line range to view (1-indexed)',
      properties: {
        start: { type: 'number' },
        end: { type: 'number' }
      }
    }
  }
}
```

**Implementation:**
- Read file with line numbers
- Support line range for large files
- List directory contents with file types
- Record access in FileTracker

#### 3.2.2 Edit Tool

**Purpose:** Make targeted edits to existing files

**Schema:**
```typescript
{
  name: 'edit',
  description: 'Replace exact text in a file (max 1024 chars)',
  parameters: {
    path: {
      type: 'string',
      description: 'Absolute path to file',
      required: true
    },
    oldText: {
      type: 'string',
      description: 'Exact text to replace (must appear exactly once)',
      required: true,
      maxLength: 1024
    },
    newText: {
      type: 'string',
      description: 'Replacement text',
      required: true,
      maxLength: 1024
    }
  }
}
```

**Constraints:**
- Text must match exactly
- Must appear exactly once in file
- Maximum 1024 characters
- AI must view file first

#### 3.2.3 Write Tool

**Purpose:** Create new files or completely rewrite existing files

**Schema:**
```typescript
{
  name: 'write',
  description: 'Create new file or completely rewrite existing file',
  parameters: {
    path: {
      type: 'string',
      description: 'Absolute path to file',
      required: true
    },
    content: {
      type: 'string',
      description: 'Complete file contents',
      required: true
    }
  }
}
```

#### 3.2.4 Deploy Tool

**Purpose:** Trigger preview rebuild and deployment

**Schema:**
```typescript
{
  name: 'deploy',
  description: 'Deploy changes and rebuild preview',
  parameters: {
    message: {
      type: 'string',
      description: 'Deployment message',
      required: false
    }
  }
}
```

**Behavior:**
1. Rebuild web preview
2. Restart Expo server
3. Generate new QR code
4. Return deployment status

#### 3.2.5 Test Tool

**Purpose:** Run tests or verify code quality

**Schema:**
```typescript
{
  name: 'test',
  description: 'Run TypeScript checks and validation',
  parameters: {
    type: {
      type: 'string',
      enum: ['typecheck', 'lint', 'build'],
      description: 'Type of test to run'
    }
  }
}
```

---

## 4. Iterative Feedback Loop

### 4.1 Overview
Enable the AI to iterate on code until it works correctly.

### 4.2 Feedback Mechanisms

#### 4.2.1 Build Errors
- Capture TypeScript compilation errors
- Format errors with file path and line number
- Return to AI for fixing
- Track failed builds (disable tools after N failures)

#### 4.2.2 Preview Errors
- Capture runtime errors from preview iframe
- Include error stack traces
- Report to AI in next turn
- Track error patterns

#### 4.2.3 User Feedback
- Allow users to report issues
- Provide screenshots (AI can view images)
- Include device/platform information
- Structured feedback format

### 4.3 Error Recovery Strategy

**Workflow:**
1. AI makes changes
2. Deploy tool triggers rebuild
3. If errors occur:
   - Capture error details
   - Return to AI with context
   - AI analyzes and fixes
   - Redeploy
4. Repeat until successful
5. Limit to 5 iterations per turn
6. After 5 failures, disable tools and ask user

---

## 5. Deployment Enforcement

### 5.1 Mandatory Deployment

**Rule:** AI must deploy before ending turn

**Implementation:**
- Track if deploy tool was called
- If not called, automatically trigger deployment
- Verify preview is working
- Generate QR code
- Only then allow turn to complete

### 5.2 Platform Verification

**Requirements:**
- Web preview must render without errors
- QR code successfully generated
- No TypeScript errors
- No runtime errors in console

### 5.3 Completion Protocol

**Steps:**
1. AI completes implementation
2. Calls deploy tool
3. System verifies deployment
4. Returns status to AI
5. AI reports results to user
6. AI can now end turn

---

## 6. Progressive Disclosure

### 6.1 External API Pattern

**Workflow for APIs requiring keys:**

**Step 1: Example Data**
```
"I'll implement the weather feature with example data first.
The UI will show placeholder weather information."
```

**Step 2: Guide Setup**
```
"To use real weather data:
1. Sign up at openweathermap.org (free tier available)
2. Get your API key
3. Add to your .env file as WEATHER_API_KEY=your_key
4. Let me know when you're ready"
```

**Step 3: After Confirmation**
```
"Great! I'll now integrate the OpenWeather API.
[Implements actual API calls and data persistence]"
```

### 6.2 Expo API Pattern

**Workflow for device features (camera, location, etc.):**

**Step 1: UI First**
```
"I'll create the camera interface first.
It will have a placeholder until we test on device."
```

**Step 2: Permissions**
```
"To test the camera:
1. Install Expo Go on your device
2. Scan the QR code
3. Grant camera permission when prompted
4. The camera will then work"
```

**Step 3: Testing**
```
"Test the camera and let me know if it works.
I can adjust sensitivity, resolution, or add filters."
```

---

## 7. Implementation Priorities

### Phase 1: Foundation (Week 1-2)
- [ ] Create modular prompt system
- [ ] Implement basic Expo guidelines (10KB)
- [ ] Set up prewarm paths
- [ ] Basic context assembly

### Phase 2: Core Features (Week 3-4)
- [ ] Complete Expo guidelines (30KB)
- [ ] Implement LRU file tracking
- [ ] Add message collapsing
- [ ] Tool system (view, edit, write, deploy)

### Phase 3: Advanced Features (Week 5-6)
- [ ] Provider-specific prompts
- [ ] Error recovery system
- [ ] Deployment enforcement
- [ ] Progressive disclosure patterns

### Phase 4: Optimization (Week 7-8)
- [ ] Prompt caching
- [ ] Context optimization
- [ ] Performance monitoring
- [ ] User feedback integration

---

## 8. Success Metrics

### Code Quality
- TypeScript error rate: <5%
- Runtime error rate: <2%
- Successful first-build rate: >80%

### User Experience
- Average time to working preview: <2 minutes
- User satisfaction: >4.5/5
- Feature completion rate: >90%

### AI Performance
- Context token usage: <100K per turn
- Average iterations to success: <3
- Tool usage accuracy: >95%

---

## 9. Technical Considerations

### 9.1 Token Management
- System prompt: ~20K tokens
- File context: ~30K tokens (16 files × 2K avg)
- Conversation: ~40K tokens (collapsed)
- Response budget: ~10K tokens
- Total: ~100K tokens per turn

### 9.2 Performance
- Context assembly: <500ms
- File reading: <200ms per file
- Preview rebuild: <10 seconds
- Total turn time: <30 seconds

### 9.3 Storage
- Conversation history: Database
- File contents: In-memory cache
- Preview HTML: In-memory cache
- Project files: File system

---

## 10. Future Enhancements

### 10.1 Advanced Context
- Vector embeddings for semantic file search
- Automatic dependency graph analysis
- Smart file grouping by feature

### 10.2 Testing
- Automated testing tool
- Screenshot comparison
- Performance profiling
- Accessibility checks

### 10.3 Collaboration
- Multi-user context
- Change tracking
- Code review suggestions
- Team coding patterns

### 10.4 Learning
- Project-specific patterns
- User preferences
- Common fixes
- Success patterns

---

## Appendix A: Prompt Template Examples

### Complete System Prompt Example

```markdown
You are AppForge AI, an expert AI assistant and exceptional senior mobile developer helping users build and deploy React Native applications using Expo.

## Core Responsibilities
1. Generate high-quality React Native/Expo code
2. Follow mobile best practices
3. Test on both iOS and Android
4. Deploy working previews
5. Iterate until code works

## Technology Stack

### MUST USE
- Expo SDK for React Native
- Expo Router for navigation
- TypeScript for type safety
- expo-image for images
- expo-secure-store for sensitive data

### NEVER MODIFY
- app.json (without confirmation)
- babel.config.js
- metro.config.js

## Code Generation Rules

### Component Patterns
```typescript
// GOOD: Default export with TypeScript
export default function HomeScreen() {
  return <View><Text>Home</Text></View>;
}

// BAD: No default export
export function HomeScreen() { ... }
```

### Navigation
```typescript
// GOOD: Expo Router navigation
import { router } from 'expo-router';
router.push('/details');

// BAD: React Navigation direct
navigation.navigate('Details');
```

### Styling
```typescript
// GOOD: StyleSheet
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 }
});

// BAD: Inline objects (poor performance)
<View style={{ flex: 1, padding: 20 }} />
```

## Platform-Specific Code
```typescript
// Use Platform.select for platform differences
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
});
```

## Deployment Requirements

### MANDATORY Before Completing
1. ✅ Code compiles without errors
2. ✅ Web preview renders correctly
3. ✅ QR code generated
4. ✅ Both platforms tested
5. ✅ No console errors

### Never Complete Without
- Working preview URL
- Device testing QR code
- Verified functionality

## Communication Style

### DO
- Briefly outline steps (2-4 bullet points)
- Implement immediately
- Deploy and verify
- Report results clearly

### DON'T
- Be verbose or explain excessively
- Use placeholders in code
- Skip deployment
- Leave errors unfixed

## Iteration Protocol

If errors occur:
1. Read error message carefully
2. Identify root cause
3. Fix the specific issue
4. Redeploy and verify
5. Repeat until working
6. Maximum 5 iterations

After 5 failures:
- Report issue to user
- Ask for clarification
- Request different approach

---

Remember: Your goal is to deliver a working, deployable mobile app that runs on both iOS and Android. Always test, verify, and iterate until successful.
```

---

## Appendix B: File Tracker Example

```typescript
// /lib/context/fileTracker.ts

export interface FileAccess {
  path: string;
  timestamp: number;
  type: 'read' | 'write' | 'edit';
  source: 'ai' | 'user';
}

export class FileTracker {
  private accessLog: Map<string, FileAccess> = new Map();
  private maxFiles: number = 16;
  private prewarmPaths: string[] = PREWARM_PATHS;

  /**
   * Record file access
   */
  recordAccess(access: Omit<FileAccess, 'timestamp'>): void {
    this.accessLog.set(access.path, {
      ...access,
      timestamp: Date.now()
    });
  }

  /**
   * Get most relevant files for context
   * Priority:
   * 1. Prewarm paths (always included)
   * 2. Recently written by AI
   * 3. Recently edited by user
   * 4. Recently read by AI
   */
  getRelevantFiles(): string[] {
    // Always include prewarm
    const result = [...this.prewarmPaths];

    // Get all other accesses
    const accesses = Array.from(this.accessLog.entries())
      .filter(([path]) => !this.prewarmPaths.includes(path))
      .map(([path, access]) => ({ path, ...access }));

    // Sort by priority
    accesses.sort((a, b) => {
      // Priority 1: Recently written by AI
      if (a.type === 'write' && a.source === 'ai') return -1;
      if (b.type === 'write' && b.source === 'ai') return 1;

      // Priority 2: Recently edited by user
      if (a.source === 'user' && a.type === 'edit') return -1;
      if (b.source === 'user' && b.type === 'edit') return 1;

      // Priority 3: Most recent timestamp
      return b.timestamp - a.timestamp;
    });

    // Take top files up to max
    const remaining = this.maxFiles - result.length;
    const topFiles = accesses.slice(0, remaining).map(a => a.path);

    return [...result, ...topFiles];
  }

  /**
   * Clear old accesses (older than 1 hour)
   */
  cleanup(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    for (const [path, access] of this.accessLog.entries()) {
      if (access.timestamp < oneHourAgo) {
        this.accessLog.delete(path);
      }
    }
  }
}
```

---

## Appendix C: References

### Convex Chef Analysis
- **Repository:** https://github.com/get-convex/chef
- **Documentation:** https://docs.convex.dev/chef
- **Key Files Analyzed:**
  - `/chef-agent/prompts/system.ts`
  - `/chef-agent/prompts/convexGuidelines.ts`
  - `/chef-agent/ChatContextManager.ts`
  - `/app/lib/.server/llm/convex-agent.ts`

### React Native/Expo Resources
- **Expo Documentation:** https://docs.expo.dev
- **React Native Documentation:** https://reactnative.dev
- **Expo Router Documentation:** https://expo.github.io/router
- **Convex React Native Quickstart:** https://docs.convex.dev/quickstart/react-native

### Prompt Engineering
- **Anthropic Prompt Engineering Guide:** https://docs.anthropic.com/claude/docs/prompt-engineering
- **OpenAI Best Practices:** https://platform.openai.com/docs/guides/prompt-engineering

---

## Document History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2024-12-02 | Initial draft based on Chef analysis | AI Analysis |

---

## Approval & Sign-off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Technical Lead | | | |
| Engineering | | | |

