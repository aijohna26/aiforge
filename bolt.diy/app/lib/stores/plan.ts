import { atom } from 'nanostores';
import type { DesignWizardData } from './designWizard';

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
}

const initialPlanState: PlanState = {
    projectId: null,
    projectKey: 'PROJ',
    prdUrl: null,
    tickets: [],
    currentTicket: null,
    viewMode: 'board',
    filterBy: {},
};

export const planStore = atom<PlanState>(initialPlanState);

// Helper functions
export function setPlanProject(projectId: string, projectKey: string, prdUrl?: string) {
    const current = planStore.get();
    planStore.set({
        ...current,
        projectId,
        projectKey,
        prdUrl: prdUrl || null,
    });
}

export function setTickets(tickets: PlanTicket[]) {
    const current = planStore.get();
    planStore.set({
        ...current,
        tickets,
    });
}

export function addTicket(ticket: PlanTicket) {
    const current = planStore.get();
    planStore.set({
        ...current,
        tickets: [...current.tickets, ticket],
    });
}

export function updateTicket(ticketId: string, updates: Partial<PlanTicket>) {
    const current = planStore.get();
    planStore.set({
        ...current,
        tickets: current.tickets.map((t) =>
            t.id === ticketId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
        ),
    });
}

export function updateTicketStatus(ticketId: string, newStatus: TicketStatus) {
    updateTicket(ticketId, { status: newStatus });

    // If moving to in-progress, trigger coding bot
    if (newStatus === 'in-progress') {
        const ticket = planStore.get().tickets.find(t => t.id === ticketId);
        if (ticket) {
            triggerCodingBot(ticket);
        }
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
    const projectKey = wizardData.step7.projectName
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
        estimatedHours?: number
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
            'Environment variables template created',
            'Project runs successfully on both iOS and Android',
            'Git repository initialized with .gitignore',
        ],
        [],
        [],
        [],
        ['setup', 'infrastructure'],
        2
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
        4
    );
    tickets.push(designSystemTicket);

    // Tasks: Screen Implementation
    wizardData.step5.generatedScreens
        .filter((s) => s.selected)
        .forEach((screen) => {
            const screenData = wizardData.step4.screens.find((s) => s.id === screen.screenId);
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
                    6
                )
            );
        });

    // Story: Navigation Setup
    const navTicket = createTicket(
        'Setup App Navigation',
        `Configure ${wizardData.step7.codeGenerationSettings.expoRouter ? 'Expo Router' : 'React Navigation'} with all screens and navigation flows.`,
        'story',
        'highest',
        [
            'Navigation structure implemented',
            'All screens accessible via navigation',
            wizardData.step4.navigation.type === 'bottom' ? 'Bottom tab bar implemented' : 'Navigation type configured',
            'Deep linking configured',
            'Navigation transitions smooth',
        ],
        wizardData.step5.generatedScreens.map((s) => s.screenId),
        [],
        [],
        ['navigation', 'routing'],
        3
    );
    tickets.push(navTicket);

    // Tasks: Data Models
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
                4
            )
        );
    });

    // Tasks: Integrations
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
                    3
                )
            );
        });

    // Story: Testing (if enabled)
    if (wizardData.step7.codeGenerationSettings.includeTests) {
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
                8
            )
        );
    }

    return tickets;
}

// Trigger coding bot when ticket moves to in-progress
function triggerCodingBot(ticket: PlanTicket) {
    const prompt = generateCodingPrompt(ticket);

    // Store the prompt to be picked up by the chat
    if (typeof window !== 'undefined') {
        localStorage.setItem('bolt_ticket_prompt', JSON.stringify({
            ticketId: ticket.id,
            ticketKey: ticket.key,
            prompt,
            timestamp: new Date().toISOString(),
        }));

        // Dispatch custom event to notify chat
        window.dispatchEvent(new CustomEvent('ticket-to-code', {
            detail: { ticket, prompt }
        }));
    }
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

${ticket.relatedScreens.length > 0 ? `
## Related Screens
${ticket.relatedScreens.join(', ')}
> Please reference the design mockups for these screens in the PRD.
` : ''}

${ticket.relatedDataModels.length > 0 ? `
## Related Data Models
${ticket.relatedDataModels.join(', ')}
> Ensure data models are implemented according to the schema defined in the PRD.
` : ''}

${ticket.labels.length > 0 ? `
## Labels
${ticket.labels.map(l => `\`${l}\``).join(', ')}
` : ''}

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
