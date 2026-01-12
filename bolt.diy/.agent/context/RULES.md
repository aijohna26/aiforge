# CRITICAL AGENT RULES

These rules are ABSOLUTE and MUST be followed by the LLM Agent at all times in this environment.

## 1. NO LINTING
- **NEVER** run `npm run lint`.
- **NEVER** run `npx expo lint`.
- **NEVER** run `eslint`.
- The lint command has been intentionally removed from `package.json` to prevent environment crashes.
- If you feel the need to check code quality, do it manually or assume the code is correct. DO NOT RUN LINT COMMANDS.

## 2. NO INITIAL INSTALL
- The environment uses a "Golden Template" with pre-installed `node_modules`.
- **NEVER** run `npm install` or `pnpm install` at the start of a task.
- Assume dependencies are already present.

## 3. METADATA CLEANUP
- The system automatically cleans `._*` files. You do not need to run `find . -delete` manually anymore, but knowing they cause issues is good context.

## 4. METRO CONFIG
- Do not modify `metro.config.js` to import `exclusionList` from `metro-config/src/...`. It is not exported. Use the direct Regex assignment if needed: `config.resolver.blacklistRE = /\/\._.*/`.
