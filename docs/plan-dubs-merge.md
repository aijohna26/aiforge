# Implementation Plan: Merging Dubs Interactivity into AppForge

 This plan outlines the restructuring of the AppForge Wizard to incorporate the "Interactive Canvas" from the Dubs project and streamline the workflow into 6 steps.

## Objectives
1.  **Reduce Friction**: Shorten the wizard to 6 high-impact steps.
2.  **Enhance Interactivity**: Replace static image generation (Step 5) with editable HTML/React mocks on a draggable canvas.
3.  **Front-Load Engineering**: Move Database Schema definition to Step 1 to ground the AI's understanding earlier.

## The New 6-Step Workflow

| Step | Old Name | New Name | Key Changes |
| :--- | :--- | :--- | :--- |
| **1** | App Information | **Concept & Blueprints** | **Add Data Models here**. AI automatically suggests a DB schema based on the app description. |
| **2** | Style Guide | **Inspiration** | No change. Mood board upload. |
| **3** | Brand Assets | **Brand Aesthetics** | No change. Logo & Color extraction. |
| **4** | Screen Flow | **Architecture** | No change. Navigation tree. |
| **5** | Screen Generation | **Interactive Prototype** | **Major Overhaul**. Generate functional HTML/React mocks instead of PNGs. Display on a draggable, interactive canvas ("Dubs" style). Enable "Chat to Edit". |
| **6** | Features | **Features & Export** | Configure integrations (Supabase, Auth) and trigger the final project build/download. |

## Detailed Implementation Tasks

### Phase 1: Step 1 Refactor (Concept & Data)
- [ ] **Modify `WizardStep1Form`**:
    -   Import the `DataSchemaFrame` logic (currently in Step 6).
    -   Add an AI handler to auto-generate an initial schema based on the `App Description` input.
    -   Allow users to manually add/edit tables and fields in Step 1.
- [ ] **Update `wizard.tsx` State**:
    -   Ensure `dataModels` state is initialized and accessible in Step 1.

### Phase 2: Step 5 Overhaul (Interactive Canvas)
- [ ] **Create `InteractiveCanvas` Component**:
    -   Implement a draggable/pannable workspace (using `react-zoom-pan-pinch` or similar, as seen in `dubs-version.md`).
    -   Implement `DraggableNode` components (using `react-rnd`) to hold the screens.
- [ ] **Switch Generation Strategy**:
    -   **Old**: `generateImage` (Prompt -> PNG).
    -   **New**: `generateCode` (Prompt -> React/HTML string).
    -   Create a new API route `/api/generate-screen-mock` that returns actionable UI code.
- [ ] **Implement "Chat to Edit"**:
    -   Add a floating command bar or chat panel in Step 5.
    -   Allow selecting a specific screen node and applying natural language edits (e.g., "Make the button rounded").

### Phase 3: Step 6 & Verification (Features & Export)
- [ ] **Consolidate Step 6**:
    -   Ensure it handles Integrations (Stripe, Supabase) and the final "Generate Project" action.
    -   Remove the separate "Step 7 Review" component/route.
- [ ] **Final Polish**:
    -   Update the wizard progress bar to reflect 6 steps.
    -   Test the full flow: Step 1 (Schema) -> Step 5 (Canvas) -> Step 6 (Export).

## Future Considerations
-   **Background Processing**: For heavy code generation, we may need to leverage background jobs (like Inngest, mentioned in `dubs-version.md`) to avoid timeouts.
-   **Theme Injection**: Ensure the styles from Step 3 (Brand) are correctly injected into the generated HTML mocks in Step 5.
