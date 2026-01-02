import Anthropic from '@anthropic-ai/sdk';
import { logger } from '~/utils/logger';

// Type definitions
export interface ComponentDescription {
  name: string;
  type: string;
  description: string;
  children?: ComponentDescription[];
}

export interface ButtonDescription {
  label: string;
  action: string;
  state?: string;
}

export interface FormDescription {
  name: string;
  fields: Array<{
    name: string;
    type: string;
    validation?: string;
  }>;
}

export interface NavigationDescription {
  type: 'tab' | 'link' | 'gesture' | 'back';
  label?: string;
  destination?: string;
}

export interface DataField {
  name: string;
  type: string;
  description: string;
  source?: string;
}

export interface ResponsiveNotes {
  breakpoints: string[];
  strategy: string;
  platformSpecific: string[];
}

export interface ScreenAnalysis {
  screenId: string;
  visualLayout: {
    components: ComponentDescription[];
    spacing: string;
    typography: string[];
    colors: string[];
  };
  interactions: {
    buttons: ButtonDescription[];
    forms: FormDescription[];
    navigation: NavigationDescription[];
    animations: string[];
  };
  dataRequirements: {
    displayedData: DataField[];
    apiEndpoints: string[];
    stateManagement: string[];
    loadingStates: string[];
  };
  accessibility: {
    touchTargets: string[];
    labels: string[];
    contrast: string[];
    responsive: ResponsiveNotes;
  };
  implementationNotes: string;
}

export interface ScreenMetadata {
  screenId: string;
  type: string;
  name: string;
  appCategory?: string;
  style?: string;
}

export interface GeneratedScreen {
  screenId: string;
  type: string;
  name: string;
  url: string | null;
  selected?: boolean;
}

const VISION_ANALYSIS_PROMPT = `Analyze this mobile app screen design in detail and return a comprehensive JSON analysis.

Screen Context:
- Screen Type: {type}
- Screen Name: {name}
- App Category: {category}
- Design Style: {style}

Provide comprehensive analysis in the following structure:

1. VISUAL LAYOUT & COMPONENTS
- List all UI components in hierarchy (header, content sections, footer)
- Describe layout patterns (stack, grid, flex)
- Note spacing and alignment system
- Identify typography scale usage
- Map color usage to semantic meanings

2. INTERACTIONS & BEHAVIOR
- List all interactive elements (buttons, inputs, tabs, etc.)
- Describe expected user actions and flows
- Note state changes (pressed, focused, loading, error)
- Identify animations or transitions needed

3. DATA REQUIREMENTS
- What data needs to be displayed (list all data fields)
- Suggest API endpoint structure
- Note data transformations needed
- Describe loading and empty states

4. ACCESSIBILITY & RESPONSIVENESS
- Verify touch target sizes (minimum 44x44pt)
- Suggest accessibility labels for screen readers
- Note color contrast issues if any
- Describe responsive behavior for different screen sizes
- Platform-specific considerations (iOS vs Android vs Web)

Return ONLY valid JSON in this exact structure (no markdown, no code blocks):
{
  "visualLayout": {
    "components": [{"name": "string", "type": "string", "description": "string", "children": []}],
    "spacing": "string describing padding/margin patterns",
    "typography": ["list of text styles used"],
    "colors": ["list of colors and their semantic use"]
  },
  "interactions": {
    "buttons": [{"label": "string", "action": "string", "state": "string"}],
    "forms": [{"name": "string", "fields": [{"name": "string", "type": "string", "validation": "string"}]}],
    "navigation": [{"type": "tab|link|gesture|back", "label": "string", "destination": "string"}],
    "animations": ["list of transitions/animations"]
  },
  "dataRequirements": {
    "displayedData": [{"name": "string", "type": "string", "description": "string", "source": "string"}],
    "apiEndpoints": ["suggested endpoint paths"],
    "stateManagement": ["local state needs"],
    "loadingStates": ["skeleton, spinner patterns"]
  },
  "accessibility": {
    "touchTargets": ["compliance notes"],
    "labels": ["screen reader labels"],
    "contrast": ["WCAG notes"],
    "responsive": {
      "breakpoints": ["list of breakpoints"],
      "strategy": "responsive strategy description",
      "platformSpecific": ["platform-specific notes"]
    }
  },
  "implementationNotes": "overall implementation guidance"
}`;

/**
 * Analyzes a single screen design using Claude's vision API
 */
export async function analyzeScreen(
  imageUrl: string,
  metadata: ScreenMetadata
): Promise<ScreenAnalysis> {
  try {
    logger.info(`Analyzing screen: ${metadata.name} (${metadata.screenId})`);

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Build the analysis prompt with metadata
    const prompt = VISION_ANALYSIS_PROMPT
      .replace('{type}', metadata.type || 'Unknown')
      .replace('{name}', metadata.name || 'Unnamed Screen')
      .replace('{category}', metadata.appCategory || 'General')
      .replace('{style}', metadata.style || 'Modern');

    // Call Claude vision API
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'url',
                url: imageUrl,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    // Extract the response text
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse JSON response
    let analysisData;
    try {
      // Try to extract JSON from response (in case it's wrapped in markdown)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : responseText;
      analysisData = JSON.parse(jsonText);
    } catch (parseError) {
      logger.error('Failed to parse vision API response as JSON:', parseError);
      throw new Error('Invalid JSON response from vision API');
    }

    // Construct ScreenAnalysis object
    const analysis: ScreenAnalysis = {
      screenId: metadata.screenId,
      visualLayout: analysisData.visualLayout || {
        components: [],
        spacing: '',
        typography: [],
        colors: [],
      },
      interactions: analysisData.interactions || {
        buttons: [],
        forms: [],
        navigation: [],
        animations: [],
      },
      dataRequirements: analysisData.dataRequirements || {
        displayedData: [],
        apiEndpoints: [],
        stateManagement: [],
        loadingStates: [],
      },
      accessibility: analysisData.accessibility || {
        touchTargets: [],
        labels: [],
        contrast: [],
        responsive: {
          breakpoints: [],
          strategy: '',
          platformSpecific: [],
        },
      },
      implementationNotes: analysisData.implementationNotes || '',
    };

    logger.info(`Successfully analyzed screen: ${metadata.name}`);
    return analysis;
  } catch (error) {
    logger.error(`Failed to analyze screen ${metadata.name}:`, error);
    throw error;
  }
}

/**
 * Analyzes multiple screens in parallel
 */
export async function analyzeMultipleScreens(
  screens: GeneratedScreen[],
  additionalMetadata?: Partial<ScreenMetadata>
): Promise<Map<string, ScreenAnalysis>> {
  logger.info(`Analyzing ${screens.length} screens in parallel`);

  const analysisPromises = screens
    .filter((screen) => screen.url) // Only analyze screens with URLs
    .map(async (screen) => {
      try {
        const metadata: ScreenMetadata = {
          screenId: screen.screenId,
          type: screen.type,
          name: screen.name,
          ...additionalMetadata,
        };

        const analysis = await analyzeScreen(screen.url!, metadata);
        return { screenId: screen.screenId, analysis };
      } catch (error) {
        logger.error(`Failed to analyze screen ${screen.screenId}:`, error);
        return { screenId: screen.screenId, analysis: null };
      }
    });

  const results = await Promise.all(analysisPromises);

  // Build map of screenId -> analysis
  const analysisMap = new Map<string, ScreenAnalysis>();
  results.forEach(({ screenId, analysis }) => {
    if (analysis) {
      analysisMap.set(screenId, analysis);
    }
  });

  logger.info(`Successfully analyzed ${analysisMap.size} out of ${screens.length} screens`);
  return analysisMap;
}
