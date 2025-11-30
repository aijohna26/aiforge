Integrate Bolt.diy WebContainer Technology
Goal
Replace AppForge AI's current Expo server approach with Bolt.diy's WebContainer technology while preserving the existing mobile-focused UI.

Background
Current Issues
Unreliable connection between device and local server
Complex server management (expo-server-manager.ts)
Hot reload inconsistencies
Network/firewall issues
Bolt.diy's Hybrid Approach (The Solution!)
Key Discovery: Bolt.diy uses both React Native Web AND Expo Go simultaneously:

React Native Web in WebContainer (Browser Preview)

Runs React Native code directly in browser using react-native-web
WebContainer provides Node.js runtime for Metro bundler
Instant preview without local server setup
Hot reload works reliably in browser
Expo Go (Real Device Testing)

Generates QR code for Expo Go app
Uses WebContainer's dev server URL
Real device testing when needed
Same codebase, two preview modes
This is perfect for AppForge AI because:

✅ Keep your beautiful mobile-focused UI
✅ Reliable browser preview (React Native Web)
✅ Real device testing when needed (Expo Go)
✅ No local server management headaches
✅ Proven, battle-tested architecture
Official Confirmation from Bolt.diy Docs
From Bolt.diy documentation:

Mobile & Cross-Platform

Expo App - React Native with Expo
React Native - Cross-platform mobile development
This confirms:

✅ Bolt.diy officially supports Expo in WebContainer
✅ React Native apps run successfully in their system
✅ The hybrid approach (Web preview + Expo Go) is proven
✅ No custom hacks needed - it's a supported use case!
Proposed Changes
Phase 1: Install Core Dependencies
Add WebContainer and Related Packages
pnpm add @webcontainer/api nanostores @nanostores/react
Key dependencies from Bolt.diy:

@webcontainer/api - In-browser Node.js runtime
nanostores - Lightweight state management for WebContainer state
@nanostores/react - React bindings for nanostores
Add React Native Web Support
pnpm add react-native-web react-native-reanimated react-native-gesture-handler
For React Native Web preview:

react-native-web - Renders React Native components in browser
react-native-reanimated - Animations support
react-native-gesture-handler - Touch gestures in browser
Phase 2: Create WebContainer Integration Layer
[NEW] 
lib/webcontainer/index.ts
Create WebContainer initialization and management:

Initialize WebContainer instance
Mount file system from project files
Handle terminal output streaming
Manage preview URL generation
[NEW] 
lib/webcontainer/stores.ts
State management for WebContainer:

WebContainer instance state
Preview URL state
Terminal output state
File system sync state
Phase 3: Update Preview Component
[MODIFY] 
components/Preview/MobilePreview.tsx
Implement Hybrid Preview System:

Browser Preview (React Native Web)

Initialize WebContainer on component mount
Mount project files to WebContainer filesystem
Configure Metro bundler to use react-native-web
Display preview in iframe using WebContainer URL
Hot reload works automatically via Metro
Device Preview (Expo Go)

Generate QR code using WebContainer's dev server URL
User scans QR code with Expo Go app
App connects to WebContainer's Metro bundler
Real device testing when needed
Key changes:

// Initialize WebContainer
const initWebContainer = async () => {
  const container = await WebContainer.boot();
  
  // Mount project files
  await container.mount({
    'package.json': {
      file: {
        contents: JSON.stringify({
          dependencies: {
            'expo': '^49.0.0',
            'react-native': '0.72.6',
            'react-native-web': '^0.19.0',
            // ... other deps
          }
        })
      }
    },
    // ... other files
  });
  
  // Install dependencies
  await container.spawn('npm', ['install']);
  
  // Start Metro bundler with web support
  const process = await container.spawn('npx', ['expo', 'start', '--web']);
  
  // Get preview URL
  const url = await container.getPreviewUrl(19006); // Expo web port
  setPreviewUrl(url);
  
  // Generate QR code for Expo Go
  const expUrl = `exp://${url.replace('http://', '')}`;
  setQrCodeUrl(generateQRCode(expUrl));
};
Three Preview Modes:

Web - React Native Web in browser (default)
Emulator - Full Expo Snack embed (existing)
Device - QR code for Expo Go (enhanced with WebContainer URL)
Phase 4: Add Terminal Component
[NEW] 
components/Terminal/Terminal.tsx
Integrated terminal for WebContainer output:

Display real-time command output
Support for npm install, build commands
Error highlighting
Auto-scroll to latest output
Phase 5: Implement File Locking
[NEW] 
lib/file-lock.ts
Prevent conflicts during AI generation:

Lock files when AI is modifying them
Visual indicators in file tree
Queue file modifications
Release locks after AI completes
Phase 6: Add Diff Viewer (Already Exists!)
[MODIFY] 
components/DiffViewer/DiffViewer.tsx
Enhance existing diff viewer:

Integrate with WebContainer file system
Show before/after for AI changes
Add accept/reject functionality
Phase 7: Update AI Generation Flow
[MODIFY] 
app/api/generate/route.ts
Stream file changes to WebContainer:

Generate files as before
Stream file modifications to client
Client syncs to WebContainer filesystem
WebContainer auto-rebuilds
[MODIFY] 
app/api/projects/[projectId]/ai-command/route.ts
Update AI command to work with WebContainer:

Lock files before modification
Stream changes to client
Sync to WebContainer
Unlock files after completion
Phase 8: Cleanup
[DELETE] Files to remove:
lib/expo-server-manager.ts
lib/expo-server-manager-v2.ts
app/api/expo-server/route.ts
[MODIFY] 
package.json
Remove unused dependencies:

localtunnel
qrcode (keep if still using for Expo Go)
Verification Plan
Automated Tests
Currently, the project has no test suite. We will verify through manual testing.

Manual Verification Steps
Test 1: WebContainer Initialization
Start dev server: npm run dev
Navigate to editor page
Generate a new React Native project
Expected: WebContainer boots successfully, files mount, preview appears
Check: Browser console shows no WebContainer errors
Check: Preview iframe displays app
Test 2: File Sync and Hot Reload
With project loaded, edit a file (e.g., App.tsx)
Make a simple change (add a text component)
Expected: WebContainer detects change and rebuilds
Expected: Preview updates within 2-3 seconds
Check: Terminal shows rebuild output
Check: Preview reflects changes
Test 3: AI Code Generation
Ask AI to "add a button that shows an alert"
Expected: Files are locked during generation
Expected: Changes stream to WebContainer
Expected: Preview updates automatically
Check: File tree shows locked indicator during generation
Check: Diff viewer shows changes made
Test 4: Terminal Output
Generate project with dependencies
Expected: Terminal shows npm install output
Expected: Terminal shows build/start commands
Check: Terminal is scrollable
Check: Errors are highlighted in red
Test 5: Expo Go Integration (Mobile Preview)
Generate React Native project
Click "Device" tab in preview
Expected: QR code appears for Expo Go
Scan QR code with phone
Expected: App loads on device
Check: Changes sync to device when editing
Test 6: Multiple Projects
Create project A
Create project B
Switch between projects
Expected: WebContainer state switches correctly
Expected: Each project has isolated filesystem
Check: No file conflicts between projects
User Review Required
IMPORTANT

Breaking Changes

Removes local Expo server approach entirely
Requires WebContainer API (browser-based, no local server)
May affect users on older browsers (WebContainer requires modern browsers)
WARNING

Dependencies

WebContainer requires SharedArrayBuffer support
Some corporate networks may block WebContainer
Fallback strategy needed for unsupported browsers
Questions for User
Browser Support: Are you okay with requiring modern browsers? WebContainer needs SharedArrayBuffer.
Expo Go: Should we keep Expo Go integration for mobile testing, or rely solely on WebContainer preview?
Migration: Should we keep old Expo server code as fallback, or remove completely?
Testing: Would you like me to set up automated tests (Vitest) as part of this work?
