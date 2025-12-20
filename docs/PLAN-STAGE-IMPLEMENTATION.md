# Plan Stage Implementation

## Overview
The Plan stage sits between Design and Code, providing a Kanban-style project management interface where PRD stories are broken down into actionable tickets.

## User Flow

1. **Design Wizard Completion**
   - User completes all 7 steps of the Design Wizard
   - Final button changes from "Generate App" to "Generate PRD"
   - Clicking "Generate PRD" creates:
     - A complete PRD document
     - Breakdown of stories into tickets
     - Tickets automatically populate in the Plan view's "To Do" column

2. **Plan View (Kanban Board)**
   - **Columns**: To Do → In Progress → Testing → Done
   - **Tickets**: Each ticket represents a user story or feature from the PRD
   - **Drag & Drop**: Users can drag tickets between columns
   - **Auto-Coding**: When a ticket moves to "In Progress", the coding bot automatically starts working on it

3. **Coding Bot Integration**
   - Ticket context is transferred to the chat panel
   - Bot receives:
     - Ticket description
     - Acceptance criteria
     - Related design assets
     - PRD context
   - Bot starts coding automatically

## Data Structure

### Ticket Schema
```typescript
interface PlanTicket {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in-progress' | 'testing' | 'done';
  estimatedHours?: number;
  assignedTo?: string; // Future: team collaboration
  relatedScreens: string[]; // Screen IDs from Step 5
  relatedDataModels: string[]; // Data model IDs from Step 6
  dependencies: string[]; // Other ticket IDs this depends on
  createdAt: string;
  updatedAt: string;
}

interface PlanState {
  projectId: string;
  prdUrl: string; // Link to generated PRD
  tickets: PlanTicket[];
  currentTicket?: string; // Ticket currently being worked on
}
```

### PRD to Tickets Conversion
The PRD generator will create tickets based on:
- **Screens**: One ticket per screen implementation
- **Features**: One ticket per integration/feature
- **Data Models**: One ticket for backend setup
- **Navigation**: One ticket for navigation setup
- **Testing**: One ticket for testing setup (if enabled)

## Components to Create

1. **PlanPanel.tsx** - Main Kanban board view
2. **KanbanColumn.tsx** - Individual column component
3. **TicketCard.tsx** - Draggable ticket card
4. **TicketDetailModal.tsx** - Detailed view of a ticket
5. **planStore.ts** - Nanostores state management

## Implementation Steps

### Phase 1: Update Design Wizard
- [ ] Change "Generate App" button text to "Generate PRD"
- [ ] Modify `handleFinish` to generate tickets
- [ ] Save tickets to database with PRD

### Phase 2: Create Plan View
- [ ] Create PlanPanel component with Kanban layout
- [ ] Implement drag-and-drop functionality
- [ ] Create ticket cards with color coding
- [ ] Add ticket detail modal

### Phase 3: Coding Bot Integration
- [ ] Detect when ticket moves to "In Progress"
- [ ] Generate prompt from ticket context
- [ ] Auto-send to chat/coding bot
- [ ] Update ticket status based on completion

### Phase 4: Persistence
- [ ] Save ticket state to Supabase
- [ ] Load tickets when Plan view opens
- [ ] Sync ticket updates in real-time

## Database Schema

```sql
-- Add to existing design_sessions table
ALTER TABLE design_sessions ADD COLUMN prd_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE design_sessions ADD COLUMN prd_url TEXT;

-- New table for tickets
CREATE TABLE plan_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES design_sessions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  acceptance_criteria JSONB DEFAULT '[]',
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('todo', 'in-progress', 'testing', 'done')) DEFAULT 'todo',
  estimated_hours INTEGER,
  related_screens JSONB DEFAULT '[]',
  related_data_models JSONB DEFAULT '[]',
  dependencies JSONB DEFAULT '[]',
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_plan_tickets_session ON plan_tickets(session_id);
CREATE INDEX idx_plan_tickets_status ON plan_tickets(status);
```

## Ticket Generation Logic

```typescript
function generateTicketsFromPRD(wizardData: DesignWizardData): PlanTicket[] {
  const tickets: PlanTicket[] = [];
  let orderIndex = 0;

  // 1. Project Setup Ticket
  tickets.push({
    id: generateId(),
    title: "Project Setup & Configuration",
    description: "Initialize Expo project with dependencies and configuration",
    acceptanceCriteria: [
      "Expo project initialized",
      "All dependencies installed",
      "Environment variables configured",
      "Project runs without errors"
    ],
    priority: 'high',
    status: 'todo',
    estimatedHours: 2,
    relatedScreens: [],
    relatedDataModels: [],
    dependencies: [],
    orderIndex: orderIndex++,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // 2. Design System Ticket
  tickets.push({
    id: generateId(),
    title: "Implement Design System",
    description: "Create theme, colors, typography, and reusable components",
    acceptanceCriteria: [
      "Theme file created with brand colors",
      "Typography scale implemented",
      "Button components created",
      "Input components created"
    ],
    priority: 'high',
    status: 'todo',
    estimatedHours: 4,
    relatedScreens: [],
    relatedDataModels: [],
    dependencies: [tickets[0].id],
    orderIndex: orderIndex++,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // 3. Screen Implementation Tickets
  wizardData.step5.generatedScreens
    .filter(s => s.selected)
    .forEach(screen => {
      const screenData = wizardData.step4.screens.find(s => s.id === screen.screenId);
      tickets.push({
        id: generateId(),
        title: `Implement ${screen.name} Screen`,
        description: `Build the ${screen.name} screen matching the design mockup`,
        acceptanceCriteria: [
          "Screen layout matches mockup",
          "All UI components implemented",
          "Navigation integrated",
          "Responsive design verified"
        ],
        priority: screenData?.type === 'home' ? 'high' : 'medium',
        status: 'todo',
        estimatedHours: 6,
        relatedScreens: [screen.screenId],
        relatedDataModels: [],
        dependencies: [tickets[1].id],
        orderIndex: orderIndex++,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });

  // 4. Navigation Ticket
  tickets.push({
    id: generateId(),
    title: "Setup Navigation",
    description: "Configure Expo Router/React Navigation with all screens",
    acceptanceCriteria: [
      "Navigation structure implemented",
      "All screens accessible",
      "Bottom tab bar (if applicable)",
      "Deep linking configured"
    ],
    priority: 'high',
    status: 'todo',
    estimatedHours: 3,
    relatedScreens: wizardData.step5.generatedScreens.map(s => s.screenId),
    relatedDataModels: [],
    dependencies: [],
    orderIndex: orderIndex++,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // 5. Data Model Tickets
  wizardData.step6.dataModels.forEach(model => {
    tickets.push({
      id: generateId(),
      title: `Implement ${model.name} Data Model`,
      description: model.description,
      acceptanceCriteria: [
        "Data model schema defined",
        "CRUD operations implemented",
        "Validation added",
        "Integration tested"
      ],
      priority: 'medium',
      status: 'todo',
      estimatedHours: 4,
      relatedScreens: [],
      relatedDataModels: [model.id],
      dependencies: [],
      orderIndex: orderIndex++,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  });

  // 6. Integration Tickets
  wizardData.step6.integrations
    .filter(i => i.enabled)
    .forEach(integration => {
      tickets.push({
        id: generateId(),
        title: `Setup ${integration.id} Integration`,
        description: `Configure and integrate ${integration.id}`,
        acceptanceCriteria: [
          "Integration configured",
          "API keys set up",
          "Functionality tested",
          "Error handling implemented"
        ],
        priority: 'medium',
        status: 'todo',
        estimatedHours: 3,
        relatedScreens: [],
        relatedDataModels: [],
        dependencies: [],
        orderIndex: orderIndex++,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });

  // 7. Testing Ticket (if enabled)
  if (wizardData.step7.codeGenerationSettings.includeTests) {
    tickets.push({
      id: generateId(),
      title: "Write Tests",
      description: "Create unit and integration tests",
      acceptanceCriteria: [
        "Component tests written",
        "Integration tests written",
        "All tests passing",
        "Coverage > 70%"
      ],
      priority: 'low',
      status: 'todo',
      estimatedHours: 8,
      relatedScreens: [],
      relatedDataModels: [],
      dependencies: [],
      orderIndex: orderIndex++,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  return tickets;
}
```

## Auto-Coding Trigger

When a ticket moves to "In Progress":

```typescript
async function handleTicketStatusChange(ticket: PlanTicket, newStatus: string) {
  if (newStatus === 'in-progress') {
    // Generate coding prompt from ticket
    const prompt = generateCodingPrompt(ticket);
    
    // Send to chat/coding bot
    await sendToCodingBot(prompt);
    
    // Switch to Code view
    workbenchStore.currentView.set('code');
  }
}

function generateCodingPrompt(ticket: PlanTicket): string {
  return `
I need you to implement the following task:

**Task**: ${ticket.title}

**Description**: ${ticket.description}

**Acceptance Criteria**:
${ticket.acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

**Priority**: ${ticket.priority}

${ticket.relatedScreens.length > 0 ? `
**Related Screens**: ${ticket.relatedScreens.join(', ')}
Please reference the design mockups for these screens.
` : ''}

${ticket.relatedDataModels.length > 0 ? `
**Related Data Models**: ${ticket.relatedDataModels.join(', ')}
` : ''}

Please implement this task following best practices and ensuring all acceptance criteria are met.
  `.trim();
}
```

## Success Metrics

- [ ] PRD generates 5-15 actionable tickets
- [ ] Tickets are properly ordered by dependencies
- [ ] Drag-and-drop works smoothly
- [ ] Auto-coding triggers correctly
- [ ] Ticket state persists across sessions
- [ ] User can track progress visually
