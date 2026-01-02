# E2B Expo Template (V2)

This directory contains the configuration for a custom E2B template designed for Expo projects, using the **E2B SDK v2**.

## Contents
- `Dockerfile`: Defines the system environment.
- `template.ts`: E2B Template definition.
- `build.ts`: Script to build and deploy the template to E2B.

## How to Build

1. **Install Dependencies**:
   ```bash
   cd e2b-templates/expo
   npm install
   ```

2. **Configure Environment**:
   Ensure you have your `E2B_API_KEY` exported in your terminal or in a `.env` file in this directory.
   ```bash
   export E2B_API_KEY=e2b_...
   ```

3. **Build the Template**:
   Run the build script using `tsx` (installed locally):
   ```bash
   npx tsx build.ts
   ```

4. **Use the Template**:
   The build script will output a **Template ID** (e.g., `expo-template` or a UUID). Use this ID in your application:
   ```typescript
   // app/routes/api.e2b.execute.ts
   const sandbox = await CodeInterpreter.create({ 
     apiKey, 
     template: 'expo-template' // or your specific ID
   });
   ```

## Resources
- [E2B Documentation](https://e2b.dev/docs)
- [V2 Migration Guide](https://e2b.dev/docs/template/migration-v2)
