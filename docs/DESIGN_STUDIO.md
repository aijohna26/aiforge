# Feature Specification: Immersive Design Studio (Step 5)

## Overview
The **Immersive Design Studio** is a professional-grade, infinite-canvas designers' environment integrated into Step 5 of the Design Wizard. It transitions the linear wizard flow into a high-fidelity workspace inspired by tools like Figma and Google Stitch.

## UX Workflow

### 1. Launch Phase (Idle)
*   **Aesthetic**: A compact, premium card (500px height) centered in the wizard.
*   **Visuals**: High-fidelity 3D render preview of the studio as a background to provide a premium feel.
*   **Action**: "Launch Studio" button initiates the transition.

### 2. Immersive Phase (Active)
*   **Automatic Expansion**: On initialization, the studio enters a true fullscreen mode via React Portals.
*   **Infinite Canvas**: A dark workspace (`#000`) with a minimalist grid (5% opacity white dots, 40px spacing).
*   **Interaction Model**: 
    *   **Panning/Zooming**: Powered by `react-zoom-pan-pinch`. Includes a dedicated "Hand Pan" and "Search/Zoom" tool.
    *   **Drag & Drop**: Screens can be freely rearranged using `react-rnd`.

### 3. Studio UI Components

#### **The Floating Action Bar (Stitch-Style)**
*   **Position**: Floating at the bottom center of the studio.
*   **Aesthetic**: Dark glassmorphism (`#1E1E21` with subtle border).
*   **Sections**:
    *   **Tools**: Hand tool, Search/Recenter.
    *   **Primary Categories**:
        *   **Generate**: Trigger AI generation (Sparks icon).
        *   **Edit**: Refine selected screens (Pencil icon).
        *   **Preview**: Focus on a high-fidelity preview mode (Eye icon).
    *   **More**: Contextual settings and exports.

#### **Device Frames**
*   **Minimalist Design**: Zero device chrome (no notches/bezels) to focus purely on the UI.
*   **Labels**: Floating labels above each frame (e.g., "Screen 1") that highlight in indigo when active.
*   **Selection States**: An indigo ring highlight and subtle guide borders indicate the active screen.
*   **Hover Actions**: Micro-actions (View Code, Download, Delete) appear on the frame label on hover.

#### **Global Studio Header**
*   **Status**: Indicates "Studio Mode" and "Design phase active" with an emerald pulsing indicator.
*   **Meta**: Breadcrumbs showing Project Name and Phase.
*   **Collaborators**: Avatar stack for perceived team involvement.
*   **Primary Actions**: "Share" and "Deploy Design" (exit studio to continue to Step 6).

## Technical Implementation

*   **Portals**: Ensures the studio breaks out of any parent CSS constraints for true fullscreen focus.
*   **Transitions**: Managed via `framer-motion` for smooth "Launch" and "Exit" animations.
*   **State**: Synchronized with `designWizardStore` to ensure generated mocks persist across sessions.
*   **Rendering**: Screens are rendered as raw HTML/CSS inside a `PreviewFrame` within the `DeviceFrame`.

## Visual Standards
*   **Background**: Pure Black `#000`.
*   **Brand Color**: Indigo-500/Indigo-600.
## From Mock to Component (The React Vision)

While the Design Studio provides an infinite canvas for visual iteration, its output is designed for full architectural composability in the **Coding Phase**:

1.  **Structured Definitions**: Each screen in the Studio is recorded as a structured UI definition (layout, tokens, and logic intent).
2.  **React Component Generation**: During Step 7 (Review & Build), these definitions are translated into clean, modular React components using the project's styling method (e.g., NativeWind or StyleSheet).
3.  **Storybook Integration**: All generated components are automatically registered in a local **React Storybook**. This allows developers to:
    *   Verify component states in isolation.
    *   Test theme consistency against the Brand Style Guide.
    *   Interact with the UI outside of the main app flow.
4.  **Compositional Logic**: The Studio focuses on *Visual Composition*, while the Coding Phase focuses on *Functional Composition*. The Studio provides the blueprint that ensures the final React code is pixel-perfect to the user's vision.

*Note: The "View Code" action has been removed from the visual studio phase to prevent noise; code inspection is prioritized within the Storybook/IDE environment in the subsequent phase.*
