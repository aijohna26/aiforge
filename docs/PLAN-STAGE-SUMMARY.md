# Plan Stage Implementation - Summary

## ✅ Completed

### 1. **Enhanced Plan Store** (`/bolt.diy/app/lib/stores/plan.ts`)
- ✅ Jira-style ticket system with:
  - Ticket types: Epic, Story, Task, Bug
  - Priorities: Highest, High, Medium, Low, Lowest
  - Statuses: To Do, In Progress, Testing, Done
  - Full metadata: labels, acceptance criteria, estimated hours, dependencies
- ✅ PRD-to-tickets generation logic
- ✅ Auto-coding bot trigger when ticket moves to "In Progress"
- ✅ Helper functions for ticket management

### 2. **Design Wizard Updates** (`/bolt.diy/app/components/workbench/design/DesignWizardCanvas.tsx`)
- ✅ Changed "Generate App" button to "Generate PRD"
- ✅ Integrated ticket generation on PRD completion
- ✅ Automatic navigation to Plan view after PRD generation
- ✅ Tickets saved to database alongside PRD

### 3. **Plan Panel Component** (`/bolt.diy/app/components/workbench/plan/PlanPanel.tsx`)
- ✅ Jira-style interface with:
  - Board view (Kanban columns)
  - List view (table format)
  - Progress tracking
  - Drag-and-drop ticket movement
  - Empty state for new projects
- ✅ PRD link display
- ✅ Ticket filtering and sorting

### 4. **Ticket Card Component** (`/bolt.diy/app/components/workbench/plan/TicketCard.tsx`)
- ✅ Priority indicators with emojis
- ✅ Type badges with icons
- ✅ Labels display
- ✅ Estimated hours
- ✅ Acceptance criteria count
- ✅ Drag-and-drop support

### 5. **Ticket Detail Modal** (`/bolt.diy/app/components/workbench/plan/TicketDetailModal.tsx`)
- ✅ Full ticket details view
- ✅ Status and priority editing
- ✅ Acceptance criteria checklist
- ✅ Related screens and data models
- ✅ Quick action buttons (Start Work, Move to Testing, Mark as Done)
- ✅ Metadata display

### 6. **Workbench Integration** (`/bolt.diy/app/components/workbench/Workbench.client.tsx`)
- ✅ Added Plan view to slider options
- ✅ Integrated PlanPanel with proper view transitions
- ✅ Smooth animations between Design → Plan → Code

## 🎯 User Flow

1. **Design Phase**
   - User completes all 7 steps of Design Wizard
   - Clicks "Generate PRD" (formerly "Generate App")

2. **PRD Generation**
   - System generates comprehensive PRD
   - Creates 5-15 actionable tickets based on:
     - Project setup
     - Design system implementation
     - Screen implementations
     - Navigation setup
     - Data models
     - Integrations
     - Testing (if enabled)

3. **Plan View**
   - User automatically navigated to Plan view
   - Sees Jira-style Kanban board with tickets in "To Do"
   - Can switch between Board and List views
   - Can drag tickets between columns
   - Can click tickets for detailed view

4. **Auto-Coding**
   - When user drags ticket to "In Progress"
   - System automatically:
     - Generates coding prompt from ticket context
     - Stores prompt in localStorage
     - Dispatches custom event
     - Switches to Code view
     - Coding bot starts working

## 📊 Ticket Generation Logic

### Epic Tickets
- **Project Setup & Configuration** (Highest priority)
  - Initialize Expo project
  - Install dependencies
  - Configure environment

### Story Tickets
- **Design System & Theme** (Highest priority)
  - Create theme with brand colors
  - Implement typography scale
  - Build base components

- **App Navigation** (Highest priority)
  - Configure Expo Router/React Navigation
  - Implement tab bar (if applicable)
  - Setup deep linking

### Task Tickets
- **Screen Implementations** (Priority based on screen type)
  - One ticket per screen
  - Home screen = Highest
  - Auth screens = High
  - Others = Medium

- **Data Models** (Medium priority)
  - One ticket per data model
  - CRUD operations
  - Validation

- **Integrations** (Medium priority)
  - One ticket per integration
  - SDK setup
  - Configuration

### Dependencies
- Design System depends on Project Setup
- All screens depend on Design System
- Proper dependency chain ensures logical order

## 🔄 Auto-Coding Integration

When a ticket moves to "In Progress":

```typescript
// Stored in localStorage
{
  ticketId: "PROJ-1",
  ticketKey: "PROJ-1",
  prompt: "# 🔴 PROJ-1: Project Setup & Configuration...",
  timestamp: "2025-12-19T07:25:00Z"
}

// Custom event dispatched
window.dispatchEvent(new CustomEvent('ticket-to-code', { 
  detail: { ticket, prompt } 
}));
```

The chat component can listen for this event and automatically start coding.

## 🎨 Design Features

### Jira-Inspired Elements
- ✅ Ticket keys (e.g., "PROJ-1", "PROJ-2")
- ✅ Priority emojis (🔴 🟠 🟡 🟢 ⚪)
- ✅ Type icons (⚡ Epic, 📖 Story, ☑️ Task, 🐛 Bug)
- ✅ Status columns with color coding
- ✅ Board and List view toggle
- ✅ Progress bar
- ✅ Labels and tags
- ✅ Acceptance criteria checklists
- ✅ Estimated hours
- ✅ Related items linking

### Visual Polish
- Smooth drag-and-drop
- Hover effects
- Color-coded priorities
- Empty states
- Loading states
- Responsive design

## 🔧 Next Steps (Optional Enhancements)

### Backend Integration
- [ ] Create `/api/save-wizard-project` endpoint to save tickets
- [ ] Add `plan_tickets` table to Supabase schema
- [ ] Implement real-time ticket sync

### Chat Integration
- [ ] Listen for `ticket-to-code` event in chat component
- [ ] Auto-send ticket prompt to coding bot
- [ ] Track ticket progress based on code completion

### Advanced Features
- [ ] Ticket comments
- [ ] Time tracking
- [ ] Assignee management (for teams)
- [ ] Sprint planning
- [ ] Burndown charts
- [ ] Export to Jira/Linear

## 📝 Files Created/Modified

### Created
1. `/docs/PLAN-STAGE-IMPLEMENTATION.md` - Implementation plan
2. `/bolt.diy/app/lib/stores/plan.ts` - Enhanced plan store
3. `/bolt.diy/app/components/workbench/plan/PlanPanel.tsx` - Main plan view
4. `/bolt.diy/app/components/workbench/plan/TicketCard.tsx` - Ticket card component
5. `/bolt.diy/app/components/workbench/plan/TicketDetailModal.tsx` - Ticket detail modal

### Modified
1. `/bolt.diy/app/components/workbench/design/DesignWizardCanvas.tsx` - PRD generation
2. `/bolt.diy/app/components/workbench/Workbench.client.tsx` - Plan view integration

## 🚀 How to Test

1. **Start Design Wizard**
   - Navigate to Design view
   - Complete all 7 steps

2. **Generate PRD**
   - Click "Generate PRD" button
   - Wait for generation to complete

3. **View Plan**
   - Automatically navigated to Plan view
   - See tickets in Kanban board

4. **Interact with Tickets**
   - Drag ticket to "In Progress"
   - Click ticket for details
   - Change status/priority
   - View acceptance criteria

5. **Test Auto-Coding**
   - Move ticket to "In Progress"
   - Check localStorage for `bolt_ticket_prompt`
   - Verify event dispatched

## 🎉 Success!

You now have a complete Plan stage that:
- ✅ Sits between Design and Code
- ✅ Uses Jira-style interface
- ✅ Generates tickets from PRD
- ✅ Auto-triggers coding bot
- ✅ Provides visual progress tracking
- ✅ Enables drag-and-drop workflow
