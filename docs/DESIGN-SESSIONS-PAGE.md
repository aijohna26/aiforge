# Design Sessions Page

## Overview

A dedicated page to view, manage, and resume all design wizard sessions. This page provides a comprehensive dashboard for users to track their app design projects from start to finish.

## Location

**Route**: `/design-sessions`
**File**: [app/design-sessions/page.tsx](../app/design-sessions/page.tsx)

## Features

### Session List View
- **Responsive Grid Layout**: 1-3 columns based on screen size
- **Real-time Status**: Draft, Generating, or Completed
- **Progress Tracking**: Visual progress bar showing completion (0-100%)
- **Session Details**: App name, description, category, and package info

### Visual Indicators
- **Progress Bar**: Shows wizard completion percentage at the top of each card
- **Status Badges**: Color-coded badges with icons
  - Draft (gray with circle icon)
  - Generating (blue with spinning loader)
  - Completed (green with checkmark)
- **Stage Labels**: Displays current step (1-6) with descriptive names:
  1. App Info & Branding
  2. Style & References
  3. Logo Generation
  4. Key Screens
  5. Additional Screens
  6. Review & Generate

### Asset Tracking
- **Logo Indicator**: Shows checkmark when logo is generated
- **Screen Count**: Displays number of generated screens
- **AI Badge**: Indicates if AI intelligence is enabled with provider info

### Actions
- **New Session**: Create a new design session via "New Design Session" button
- **Resume/View**: Continue incomplete sessions or view completed ones
- **Delete**: Remove unwanted sessions with confirmation dialog
- **Relative Timestamps**: Shows when each session was last updated (e.g., "2h ago", "3d ago")

## User Flow

### Accessing the Page
1. Navigate to `/design-sessions` in your browser
2. Must be authenticated (redirects to home if not logged in)

### Creating a New Session
1. Click "New Design Session" button in header
2. Redirects to `/wizard` to start the 6-step wizard

### Resuming a Session
1. Click "Resume" button on any draft or in-progress session
2. Redirects to `/wizard?sessionId={id}`
3. Wizard loads session data and continues from last stage

### Viewing Completed Sessions
1. Click "View" button on completed sessions
2. Opens wizard in review mode showing all generated assets

### Deleting a Session
1. Hover over a session card to reveal delete button
2. Click delete (×) button
3. Confirm deletion in dialog
4. Session is permanently removed from database

## States

### Loading State
- Displays centered spinner while fetching sessions
- Shown when page first loads or after refresh

### Empty State
- Shows when user has no design sessions
- Displays Sparkles icon with encouragement message
- Prominent "Start Your First Design Session" CTA button

### Error State
- Shows error message in red alert box
- Provides "Try Again" button to retry fetch
- Handles authentication errors (401) by redirecting to home

### Session Grid
- Shows all sessions in responsive grid
- Sorted by most recently updated
- Each card is interactive and hoverable

## Technical Details

### Data Structure
```typescript
interface DesignSession {
  id: string;
  session_name: string;
  status: 'draft' | 'completed' | 'generating';
  current_stage: number;
  app_name: string;
  app_description: string | null;
  app_category: string | null;
  selected_package: string | null;
  package_cost: number | null;
  ai_config: {
    enabled: boolean;
    provider: string;
    model: string;
  } | null;
  logo_url: string | null;
  total_screens_generated: number;
  credits_used: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}
```

### API Integration
- **GET /api/design-sessions**: Fetches all sessions for authenticated user
- **DELETE /api/design-sessions/[id]**: Deletes a specific session
- Handles 401 authentication errors gracefully
- Shows user-friendly error messages

### Database Tables
- **design_sessions**: Main table storing session metadata
- **design_session_screens**: Individual generated screens
- **design_session_history**: Audit log of session actions

See [MIGRATION_INSTRUCTIONS.md](../MIGRATION_INSTRUCTIONS.md) for database setup.

## Component Hierarchy

```
DesignSessionsPage
├── Header
│   ├── AppForge AI branding
│   ├── WalletBalance component
│   └── New Design Session button
└── Main Content
    ├── Loading State (Loader2 spinner)
    ├── Error State (error message + retry button)
    ├── Empty State (empty message + CTA)
    └── Session Grid
        └── Session Cards (multiple)
            ├── Progress Bar
            ├── Status Badge
            ├── App Details
            ├── Package Info
            ├── Asset Indicators
            ├── Timestamp
            ├── Resume/View Button
            └── Delete Button (on hover)
```

## Styling

### Design System
- **Color Scheme**: Slate with blue accents
- **Dark Mode**: Full support with dark variant classes
- **Spacing**: Consistent 6-unit spacing system
- **Typography**: Hierarchical text sizing with proper contrast

### Responsive Breakpoints
- **Mobile (default)**: Single column
- **sm (640px+)**: 2 columns
- **lg (1024px+)**: 3 columns

### Interactive States
- **Hover**: Border color change, shadow elevation
- **Focus**: Keyboard navigation support
- **Active**: Visual feedback on button clicks

## Accessibility

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Color Contrast**: WCAG AA compliant
- **Focus Indicators**: Visible focus states for all interactive elements

## Integration with Wizard

### Session Creation
The wizard ([app/wizard/page.tsx](../app/wizard/page.tsx)) creates sessions via `/api/design-sessions` POST endpoint.

### Session Updates
As users progress through the wizard, the session is updated with:
- Current stage number
- App information
- Style preferences
- Selected package
- Generated assets (logo, screens)
- AI configuration

### Session Completion
When users complete Step 6 (Review & Generate), the status changes to 'completed' and `completed_at` timestamp is set.

## Next Steps

### Potential Enhancements
1. **Filters**: Add filtering by status, category, or package
2. **Search**: Add search by app name or description
3. **Sorting**: Allow sorting by date, name, or progress
4. **Export**: Export session data or generated assets
5. **Sharing**: Share design sessions with team members
6. **Duplicating**: Clone existing sessions as templates

### Required Backend Work
To fully utilize the design sessions page, ensure:
1. Database migration is run (see [MIGRATION_INSTRUCTIONS.md](../MIGRATION_INSTRUCTIONS.md))
2. Wizard saves session data to database (currently uses localStorage)
3. Session resume functionality loads data from `sessionId` parameter
4. Storage bucket `design-assets` is created for asset uploads

## Testing Checklist

- [ ] Page loads without errors
- [ ] Authentication check redirects to home when not logged in
- [ ] Sessions list displays correctly
- [ ] Progress bars show accurate percentages
- [ ] Status badges display correct state
- [ ] New Session button navigates to wizard
- [ ] Resume button navigates to wizard with sessionId
- [ ] Delete button shows confirmation and removes session
- [ ] Empty state displays when no sessions exist
- [ ] Error state displays when API fails
- [ ] Loading state shows during fetch
- [ ] Responsive layout works on all screen sizes
- [ ] Dark mode styling is correct
- [ ] Timestamps format correctly
- [ ] Asset indicators show when assets exist

## Related Files

- [app/design-sessions/page.tsx](../app/design-sessions/page.tsx) - Main page component
- [app/wizard/page.tsx](../app/wizard/page.tsx) - Design wizard
- [app/api/design-sessions/route.ts](../app/api/design-sessions/route.ts) - Sessions API
- [app/api/design-sessions/[id]/route.ts](../app/api/design-sessions/[id]/route.ts) - Single session API
- [supabase/migrations/20241207_design_sessions.sql](../supabase/migrations/20241207_design_sessions.sql) - Database schema
- [MIGRATION_INSTRUCTIONS.md](../MIGRATION_INSTRUCTIONS.md) - Setup guide
