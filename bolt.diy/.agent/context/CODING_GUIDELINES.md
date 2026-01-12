# Coding Guidelines (Adapted from Vibe Assets)

These guidelines are established to ensure high-quality, production-ready code generation, inspired by the "Better Prompt" best practices.

## 1. Quality & Completeness
- **No Placeholders**: Never leave code as "TODO", "Implement later", or use simpler placeholders. Always aim for a ship-ready feature.
- **Full Layouts**: Unless strictly asked for a snippet, generate complete screens with proper structure (SafeArea, Headers, Content, Navigation).
- **Realistic Data**: Use realistic temporary data structures instead of empty arrays or single-item mocks.
- **Interactivity**: Components should handle user interaction (press states, navigation, unmounting) gracefully.

## 2. Environment & Tooling
- **Explicit Installation**: Do not assume non-standard libraries are installed. Always verify `package.json`.
- **No Initial Install**: The environment is pre-loaded with `node_modules` from the template. Do NOT run `npm install` or `pnpm install` initially. Assume dependencies are ready.
- **No New Packages**: Do not add new libraries (e.g., `npm install xyz`) unless the user specifically asks for a feature that requires them. Stick to the provided `package.json`.
- **No Dev Server Restarts**: The development server (Expo / Metro) is likely running. Do not attempt to run `npm start` unless specifically debugging a crash or requested.
- **File System Precision**: 
  - Use absolute paths for file ops (`/home/user/...` or `/Users/...`).
  - Do not use `@` aliases in file system operations (only in code imports).
- **No Linting**: Do not run `npm run lint` or `npx expo lint`. These commands are disabled in this environment.

## 3. Styling (Expo/React Native)
- **Tailwind / NativeWind**: Prefer using Tailwind classes (via NativeWind) over `StyleSheet.create` where possible for consistency.
- **No CSS Files**: Do not create `.css` or `.scss` files for React Native projects.
- **Responsive**: Use Flexbox and percentage/dimension helpers to ensure layouts work on different device sizes.

## 4. Component Architecture
- **Inspection First**: When using existing UI components, verify their props by reading the file first if unsure. Do not guess API surfaces.
- **Modularization**: Break down complex screens into smaller, reusable components in `components/` or valid subfolders.
- **Clean Imports**: Use standard imports. Avoid circular dependencies.

## 5. Workflow
- **Task Summary**: At the end of a significant task, provide a clear summary of what was achieved.
