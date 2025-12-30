import { atom } from 'nanostores';
import type { DesignWizardData } from './designWizard';
import { createClient } from '../supabase/browser';

// Jira-style ticket types
export type TicketPriority = 'highest' | 'high' | 'medium' | 'low' | 'lowest';
export type TicketStatus = 'todo' | 'in-progress' | 'testing' | 'done';
export type TicketType = 'story' | 'task' | 'bug' | 'epic';

export interface PlanTicket {
  id: string;
  key: string; // e.g., "PROJ-1", "PROJ-2"
  title: string;
  description: string;
  type: TicketType;
  acceptanceCriteria: string[];
  priority: TicketPriority;
  status: TicketStatus;
  estimatedHours?: number;
  assignedTo?: string;
  relatedScreens: string[];
  relatedDataModels: string[];
  dependencies: string[];
  labels: string[];
  parallel?: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlanState {
  projectId: string | null;
  projectKey: string; // e.g., "PROJ"
  prdUrl: string | null;
  tickets: PlanTicket[];
  currentTicket: string | null;
  viewMode: 'board' | 'list'; // Jira has both views
  filterBy: {
    status?: TicketStatus[];
    priority?: TicketPriority[];
    type?: TicketType[];
    assignedTo?: string[];
  };
  loading?: boolean;
}

const initialPlanState: PlanState = {
  projectId: null,
  projectKey: 'PROJ',
  prdUrl: null,
  tickets: [],
  currentTicket: null,
  viewMode: 'board',
  filterBy: {},
  loading: false,
};

const PLAN_STORAGE_KEY = 'appforge_plan_state';

function getInitialPlanState(): PlanState {
  if (typeof window === 'undefined') {
    return initialPlanState;
  }

  try {
    const saved = localStorage.getItem(PLAN_STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);

      /*
       * We restore EVERYTHING from localStorage as a fast cache
       * Including tickets, so the user sees them immediately while we sync
       */
      return {
        ...initialPlanState,
        ...parsed,
        loading: !!parsed.projectId,
      };
    }
  } catch (e) {
    console.error('[PlanStore] Failed to load from localStorage', e);
  }

  return initialPlanState;
}

export const planStore = atom<PlanState>(getInitialPlanState());

// Subscribe to store changes and save to localStorage
if (typeof window !== 'undefined') {
  planStore.subscribe((state) => {
    try {
      // Now saving EVERYTHING including tickets as a local cache
      const { loading, ...toSave } = state;
      localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(toSave));
    } catch (error) {
      console.error('[PlanStore] Failed to save to localStorage:', error);
    }
  });

  // Handle initial sync if projectId exists
  const initialState = planStore.get();

  if (initialState.projectId) {
    setTimeout(() => {
      fetchTicketsFromDb(initialState.projectId!);
    }, 0);
  }
}

// Initialize Supabase Client
const supabase = typeof window !== 'undefined' ? createClient() : null;

/*
 * ============================================
 * DB SYNC FUNCTIONS
 * ============================================
 */

export async function fetchTicketsFromDb(projectId: string) {
  if (!supabase) {
    return;
  }

  planStore.set({ ...planStore.get(), loading: true });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    const { data, error } = await supabase
      .from('plan_tickets')
      .select('*')
      .eq('user_id', user.id)
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      const mappedTickets: PlanTicket[] = data.map((dbItem) => ({
        id: dbItem.id,
        key: dbItem.key,
        title: dbItem.title,
        description: dbItem.description,
        type: dbItem.type as TicketType,
        status: dbItem.status as TicketStatus,
        priority: dbItem.priority as TicketPriority,
        acceptanceCriteria: dbItem.acceptance_criteria || [],
        estimatedHours: dbItem.estimated_hours,
        assignedTo: dbItem.assigned_to,
        relatedScreens: dbItem.related_screens || [],
        relatedDataModels: dbItem.related_data_models || [],
        dependencies: dbItem.dependencies || [],
        labels: dbItem.labels || [],
        parallel: dbItem.parallel,
        orderIndex: dbItem.order_index,
        createdAt: dbItem.created_at,
        updatedAt: dbItem.updated_at,
      }));

      planStore.set({
        ...planStore.get(),
        tickets: mappedTickets,
        projectId,
        loading: false,
      });
    } else {
      planStore.set({ ...planStore.get(), loading: false });
    }
  } catch (error) {
    console.error('[PlanStore] Failed to fetch tickets:', error);
    planStore.set({ ...planStore.get(), loading: false });
  }
}

async function upsertTicketToDb(ticket: PlanTicket) {
  if (!supabase) {
    return;
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    const current = planStore.get();

    if (!current.projectId) {
      return;
    }

    const dbItem = {
      id: ticket.id.includes('-') && ticket.id.split('-').length === 2 ? undefined : ticket.id, // If it's a temp ID like PROJ-1, let DB generate UUID
      user_id: user.id,
      project_id: current.projectId,
      key: ticket.key,
      title: ticket.title,
      description: ticket.description,
      type: ticket.type,
      status: ticket.status,
      priority: ticket.priority,
      acceptance_criteria: ticket.acceptanceCriteria,
      estimated_hours: ticket.estimatedHours,
      assigned_to: ticket.assignedTo,
      related_screens: ticket.relatedScreens,
      related_data_models: ticket.relatedDataModels,
      dependencies: ticket.dependencies,
      labels: ticket.labels,
      parallel: ticket.parallel,
      order_index: ticket.orderIndex,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('plan_tickets').upsert(dbItem).select().single();

    if (error) {
      throw error;
    }

    // If it was a new ticket, we might need to update the local ID from temp to real UUID
    if (data && data.id !== ticket.id) {
      updateLocalTicketId(ticket.id, data.id);
    }
  } catch (error) {
    console.error('[PlanStore] Failed to upsert ticket:', error);
  }
}

function updateLocalTicketId(oldId: string, newId: string) {
  const current = planStore.get();
  planStore.set({
    ...current,
    tickets: current.tickets.map((t) => (t.id === oldId ? { ...t, id: newId } : t)),
  });
}

/*
 * ============================================
 * Helper functions
 * ============================================
 */

export function setPlanProject(projectId: string, projectKey: string, prdUrl?: string) {
  const current = planStore.get();
  planStore.set({
    ...current,
    projectId,
    projectKey,
    prdUrl: prdUrl || null,
  });

  // Auto-fetch if project changed
  if (projectId) {
    fetchTicketsFromDb(projectId);
  }
}

export function setTickets(tickets: PlanTicket[]) {
  const current = planStore.get();
  planStore.set({
    ...current,
    tickets,
  });

  // Sync all tickets to DB (for initial generation)
  tickets.forEach((t) => upsertTicketToDb(t));
}

export function addTicket(ticket: PlanTicket) {
  const current = planStore.get();
  planStore.set({
    ...current,
    tickets: [...current.tickets, ticket],
  });

  upsertTicketToDb(ticket);
}

export function updateTicket(ticketId: string, updates: Partial<PlanTicket>) {
  const current = planStore.get();
  const updatedTickets = current.tickets.map((t) =>
    t.id === ticketId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t,
  );

  planStore.set({
    ...current,
    tickets: updatedTickets,
  });

  const updatedTicket = updatedTickets.find((t) => t.id === ticketId);

  if (updatedTicket) {
    upsertTicketToDb(updatedTicket);
  }
}

export function updateTicketStatus(ticketId: string, newStatus: TicketStatus) {
  const current = planStore.get();

  // Constraint: Only one ticket in-progress at a time
  if (newStatus === 'in-progress') {
    current.tickets.forEach((t) => {
      if (t.status === 'in-progress' && t.id !== ticketId) {
        updateTicket(t.id, { status: 'todo' });
      }
    });
  }

  updateTicket(ticketId, { status: newStatus });

  // Triggers
  const ticket = planStore.get().tickets.find((t) => t.id === ticketId);

  if (!ticket) {
    return;
  }

  if (newStatus === 'in-progress') {
    triggerCodingBot(ticket);
  } else if (newStatus === 'testing') {
    triggerQABot(ticket);
  }
}

export function setCurrentTicket(ticketId: string | null) {
  const current = planStore.get();
  planStore.set({
    ...current,
    currentTicket: ticketId,
  });
}

export function setViewMode(mode: 'board' | 'list') {
  const current = planStore.get();
  planStore.set({
    ...current,
    viewMode: mode,
  });
}

export function setFilter(filterBy: PlanState['filterBy']) {
  const current = planStore.get();
  planStore.set({
    ...current,
    filterBy,
  });
}

export function resetPlan() {
  planStore.set(initialPlanState);
}

// Generate tickets from PRD
export function generateTicketsFromPRD(wizardData: DesignWizardData): PlanTicket[] {
  const tickets: PlanTicket[] = [];
  const projectKey =
    (wizardData.step7?.projectName || wizardData.step1?.appName || 'Project')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 4) || 'PROJ';

  let ticketNumber = 1;
  let orderIndex = 0;

  const createTicket = (
    title: string,
    description: string,
    type: TicketType,
    priority: TicketPriority,
    acceptanceCriteria: string[],
    relatedScreens: string[] = [],
    relatedDataModels: string[] = [],
    dependencies: string[] = [],
    labels: string[] = [],
    estimatedHours?: number,
    parallel: boolean = false,
  ): PlanTicket => ({
    id: `${projectKey}-${ticketNumber}`,
    key: `${projectKey}-${ticketNumber++}`,
    title,
    description,
    type,
    acceptanceCriteria,
    priority,
    status: 'todo',
    estimatedHours,
    relatedScreens,
    relatedDataModels,
    dependencies,
    labels,
    parallel,
    orderIndex: orderIndex++,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Epic: Project Setup
  const setupTicket = createTicket(
    'Project Setup & Configuration',
    `Initialize ${wizardData.step1.appName} Expo project with all dependencies and configuration files.`,
    'epic',
    'highest',
    [
      'Expo project initialized with SDK version specified',
      'All required dependencies installed',
      'Project runs successfully on both iOS and Android',
      'Git repository initialized with .gitignore',
      'Assets folder created at `assets/images/`',
      `Download logo from ${wizardData.step3.logo?.url || 'N/A'} and save to \`assets/images/logo.png\``,
      `Download splash screen from ${wizardData.step3.logo?.url || 'N/A'} and save to \`assets/images/splash.png\``,
      `Reuse logo for \`icon.png\`, \`favicon.png\`, and \`adaptive-icon.png\` in \`assets/images/\``,
    ],
    [],
    [],
    [],
    ['setup', 'infrastructure'],
    2,
  );
  tickets.push(setupTicket);

  // Story: Design System
  const designSystemTicket = createTicket(
    'Implement Design System & Theme',
    'Create a comprehensive design system with brand colors, typography, spacing, and reusable component styles.',
    'story',
    'highest',
    [
      'Theme file created with all brand colors from design',
      'Typography scale implemented (h1, h2, h3, body, caption)',
      'Spacing constants defined',
      'Border radius constants defined',
      'Base component styles created (Button, Input, Card)',
    ],
    [],
    [],
    [setupTicket.id],
    ['design-system', 'ui'],
    4,
  );
  tickets.push(designSystemTicket);

  // Tasks: Screen Implementation
  if (wizardData.step5?.generatedScreens) {
    wizardData.step5.generatedScreens
      .filter((s) => s.selected)
      .forEach((screen) => {
        const screenData = wizardData.step4?.screens?.find((s) => s.id === screen.screenId);
        const isAuthScreen = ['signin', 'signup'].includes(screenData?.type || '');
        const isMainScreen = screenData?.type === 'home';

        tickets.push(
          createTicket(
            `Build ${screen.name} Screen`,
            `Implement the ${screen.name} screen matching the design mockup. ${screenData?.purpose || ''}`,
            'task',
            isMainScreen ? 'highest' : isAuthScreen ? 'high' : 'medium',
            [
              'Screen layout matches design mockup exactly',
              'All UI components implemented and styled',
              'Navigation integrated correctly',
              'Responsive design verified on multiple screen sizes',
              'Loading and error states handled',
            ],
            [screen.screenId],
            [],
            [designSystemTicket.id],
            ['screen', screenData?.type || 'custom'],
            6,
            true, // Screens can often be built in parallel
          ),
        );
      });
  }

  // Story: Navigation Setup
  if (wizardData.step4 && wizardData.step5 && wizardData.step7) {
    const navTicket = createTicket(
      'Setup App Navigation',
      `Configure ${wizardData.step7.codeGenerationSettings?.expoRouter ? 'Expo Router' : 'React Navigation'} with all screens and navigation flows.`,
      'story',
      'highest',
      [
        'Navigation structure implemented',
        'All screens accessible via navigation',
        wizardData.step4.navigation?.type === 'bottom' ? 'Bottom tab bar implemented' : 'Navigation type configured',
        'Deep linking configured',
        'Navigation transitions smooth',
      ],
      wizardData.step5.generatedScreens?.map((s) => s.screenId) || [],
      [],
      [],
      ['navigation', 'routing'],
      3,
    );
    tickets.push(navTicket);
  }

  // Tasks: Data Models
  if (wizardData.step6?.dataModels) {
    wizardData.step6.dataModels.forEach((model) => {
      tickets.push(
        createTicket(
          `Implement ${model.name} Data Model`,
          model.description,
        'task',
        'medium',
        [
          'Data model schema defined with all fields',
          'CRUD operations implemented',
          'Field validation added',
          'Integration with backend tested',
          'Error handling implemented',
        ],
        [],
        [model.id],
        [],
        ['backend', 'data-model'],
        4,
        true, // Data models can be built in parallel
      ),
    );
    });
  }

  // Tasks: Integrations
  if (wizardData.step6?.integrations) {
    wizardData.step6.integrations
      .filter((i) => i.enabled)
      .forEach((integration) => {
      tickets.push(
        createTicket(
          `Setup ${integration.id} Integration`,
          `Configure and integrate ${integration.id} into the application.`,
          'task',
          'medium',
          [
            'Integration SDK/library installed',
            'API keys and configuration set up',
            'Core functionality implemented',
            'Error handling added',
            'Integration tested end-to-end',
          ],
          [],
          [],
          [],
          ['integration', integration.id],
          3,
          wizardData.step1.parallelReady === true,
        ),
      );
    });
  }

  // Story: Testing (if enabled)
  if (wizardData.step7?.codeGenerationSettings?.includeTests) {
    tickets.push(
      createTicket(
        'Write Unit & Integration Tests',
        'Create comprehensive test suite for components and features.',
        'story',
        'low',
        [
          'Component tests written for all major components',
          'Integration tests written for critical flows',
          'All tests passing',
          'Code coverage > 70%',
          'Test documentation added',
        ],
        [],
        [],
        [],
        ['testing', 'quality'],
        8,
      ),
    );
  }

  return tickets;
}

// Trigger coding bot when ticket moves to in-progress
export function triggerCodingBot(ticket: PlanTicket) {
  const prompt = generateCodingPrompt(ticket);

  // Store the prompt to be picked up by the chat
  if (typeof window !== 'undefined') {
    localStorage.setItem(
      'bolt_ticket_prompt',
      JSON.stringify({
        ticketId: ticket.id,
        ticketKey: ticket.key,
        prompt,
        timestamp: new Date().toISOString(),
      }),
    );

    // Dispatch custom event to notify chat
    window.dispatchEvent(
      new CustomEvent('ticket-to-code', {
        detail: { ticket, prompt },
      }),
    );
  }
}

// Trigger QA bot when ticket moves to testing
function triggerQABot(ticket: PlanTicket) {
  const prompt = generateQAPrompt(ticket);

  if (typeof window !== 'undefined') {
    // Dispatch custom event to notify chat
    window.dispatchEvent(
      new CustomEvent('ticket-to-qa', {
        detail: { ticket, prompt },
      }),
    );
  }
}

function generateQAPrompt(ticket: PlanTicket): string {
  return `
# 🔍 QA Request: ${ticket.key} - ${ticket.title}

Please QA the changes for this ticket against the following acceptance criteria:

## Acceptance Criteria
${ticket.acceptanceCriteria.map((c, i) => `${i + 1}. 📄 ${c}`).join('\n')}

**Instructions**:
1. Review the code changes made in the previous turns.
2. Verify that each acceptance criterion is met.
3. If everything is correct, clearly state "QA Pass" and output the following action:
   <boltAction type="qa-pass" ticketId="${ticket.id}" />
4. If there are issues, list them and do not output the action.
`.trim();
}

function generateCodingPrompt(ticket: PlanTicket): string {
  const priorityEmoji = {
    highest: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢',
    lowest: '⚪',
  };

  return `
# ${priorityEmoji[ticket.priority]} ${ticket.key}: ${ticket.title}

**Type**: ${ticket.type.toUpperCase()}
**Priority**: ${ticket.priority}

## Description
${ticket.description}

## Acceptance Criteria
${ticket.acceptanceCriteria.map((c, i) => `${i + 1}. ✅ ${c}`).join('\n')}

${
  ticket.relatedScreens.length > 0
    ? `
## Related Screens
${ticket.relatedScreens.join(', ')}
> Please reference the design mockups for these screens in the PRD.
`
    : ''
}

${
  ticket.relatedDataModels.length > 0
    ? `
## Related Data Models
${ticket.relatedDataModels.join(', ')}
> Ensure data models are implemented according to the schema defined in the PRD.
`
    : ''
}

${
  ticket.labels.length > 0
    ? `
## Labels
${ticket.labels.map((l) => `\`${l}\``).join(', ')}
`
    : ''
}

---

Please implement this ${ticket.type} following best practices, ensuring all acceptance criteria are met. Write clean, maintainable code with proper error handling and TypeScript types.
  `.trim();
}

export function getTicketsByStatus(status: TicketStatus): PlanTicket[] {
  const { tickets, filterBy } = planStore.get();
  let filtered = tickets.filter((t) => t.status === status);

  // Apply filters
  if (filterBy.priority?.length) {
    filtered = filtered.filter((t) => filterBy.priority!.includes(t.priority));
  }

  if (filterBy.type?.length) {
    filtered = filtered.filter((t) => filterBy.type!.includes(t.type));
  }

  return filtered.sort((a, b) => a.orderIndex - b.orderIndex);
}

export function getTicketById(ticketId: string): PlanTicket | undefined {
  return planStore.get().tickets.find((t) => t.id === ticketId);
}
