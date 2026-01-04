import ignore from 'ignore';
import type { ProviderInfo } from '~/types/model';
import type { Template } from '~/types/template';
import { STARTER_TEMPLATES } from './constants';

const starterTemplateSelectionPrompt = (templates: Template[]) => `
You are an experienced developer who helps people choose the best starter template for their projects.

IMPORTANT: This platform is EXCLUSIVELY for building Mobile Applications using Expo.
IMPORTANT: Regardless of whether the user asks for a website, dashboard, or app, you MUST generate a Mobile App (which runs on web via Expo).
IMPORTANT: ALWAYS choose 'Expo App' unless it is a trivial script request.
IMPORTANT: NEVER choose Vite, Next.js, or Astro.

Available templates:
<template>
  <name>blank</name>
  <description>Empty starter for simple scripts and trivial tasks that don't require a full template setup</description>
  <tags>basic, script</tags>
</template>
${templates
    .map(
      (template) => `
<template>
  <name>${template.name}</name>
  <description>${template.description}</description>
  ${template.tags ? `<tags>${template.tags.join(', ')}</tags>` : ''}
</template>
`,
    )
    .join('\n')}

Response Format:
<selection>
  <templateName>{selected template name}</templateName>
  <title>{a proper title for the project}</title>
</selection>

Examples:

<example>
User: I need to build a todo app
Response:
<selection>
  <templateName>Expo App</templateName>
  <title>Mobile Todo App</title>
</selection>
</example>

<example>
User: Create a landing page for my business
Response:
<selection>
  <templateName>Vite React</templateName>
  <title>Business Landing Page</title>
</selection>
</example>

<example>
User: Write a script to generate numbers from 1 to 100
Response:
<selection>
  <templateName>blank</templateName>
  <title>script to generate numbers from 1 to 100</title>
</selection>
</example>

<example>
User: Webbrowser code
Response:
<selection>
  <templateName>Expo App</templateName>
  <title>Expo Web Browser</title>
</selection>
</example>

Instructions:
1. For trivial tasks and simple scripts, always recommend the blank template
2. For mobile apps or general "app" requests, recommend 'Expo App'
3. For web applications, recommend suitable Vite templates
4. Follow the exact XML format
5. Consider both technical requirements and tags
6. If no perfect match exists, recommend the closest option

Important: Provide only the selection tags in your response, no additional text.
MOST IMPORTANT: YOU DONT HAVE TIME TO THINK JUST START RESPONDING BASED ON HUNCH 
`;

const templates: Template[] = STARTER_TEMPLATES.filter((t) => !t.name.includes('shadcn'));

const parseSelectedTemplate = (llmOutput: string): { template: string; title: string } | null => {
  try {
    if (!llmOutput) {
      return null;
    }

    // Extract content between <templateName> tags
    const templateNameMatch = llmOutput.match(/<templateName>(.*?)<\/templateName>/);
    const titleMatch = llmOutput.match(/<title>(.*?)<\/title>/);

    if (!templateNameMatch) {
      return null;
    }

    return { template: templateNameMatch[1].trim(), title: titleMatch?.[1].trim() || 'Untitled Project' };
  } catch (error) {
    console.error('Error parsing template selection:', error);
    return null;
  }
};

export const selectStarterTemplate = async (options: { message: string; model: string; provider: ProviderInfo }) => {
  const { message, model, provider } = options;
  const requestBody = {
    message,
    model,
    provider,
    system: starterTemplateSelectionPrompt(templates),
  };
  const response = await fetch('/api/llmcall', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });
  const respJson: { text: string } = await response.json();
  console.log(respJson);

  const { text } = respJson;
  const selectedTemplate = parseSelectedTemplate(text);

  if (selectedTemplate) {
    return selectedTemplate;
  } else {
    console.log('No template selected, using blank template');

    return {
      template: 'blank',
      title: '',
    };
  }
};

const getLocalTemplateContent = async (
  localPath: string,
): Promise<{ name: string; path: string; content: string }[]> => {
  try {
    // Fetch from local template API endpoint
    const response = await fetch(`/api/local-template?path=${encodeURIComponent(localPath)}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const files = (await response.json()) as any;

    return files;
  } catch (error) {
    console.error('Error fetching local template contents:', error);
    throw error;
  }
};

const getGitHubRepoContent = async (repoName: string): Promise<{ name: string; path: string; content: string }[]> => {
  try {
    // Instead of directly fetching from GitHub, use our own API endpoint as a proxy
    const response = await fetch(`/api/github-template?repo=${encodeURIComponent(repoName)}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Our API will return the files in the format we need
    const files = (await response.json()) as any;

    return files;
  } catch (error) {
    console.error('Error fetching release contents:', error);
    throw error;
  }
};

export async function getTemplates(templateName: string, title?: string) {
  const template = STARTER_TEMPLATES.find((t) => t.name == templateName);

  if (!template) {
    return null;
  }

  // Check if template is local or from GitHub
  let files;

  if (template.localPath) {
    files = await getLocalTemplateContent(template.localPath);
  } else if (template.githubRepo) {
    files = await getGitHubRepoContent(template.githubRepo);
  } else {
    throw new Error('Template must have either localPath or githubRepo');
  }

  // NOTE: package.json modification now happens server-side in api.local-template.ts
  // This ensures the --tunnel flags are added before files reach the client
  // The modification is done in /app/routes/api.local-template.ts for Expo templates

  let filteredFiles = files;

  /*
   * ignoring common unwanted files
   * exclude    .git
   */
  filteredFiles = filteredFiles.filter((x) => x.path.startsWith('.git') == false);

  /*
   * exclude    lock files
   * WE NOW INCLUDE LOCK FILES FOR IMPROVED INSTALL TIMES
   */
  {
    /*
     *const comminLockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
     *filteredFiles = filteredFiles.filter((x) => comminLockFiles.includes(x.name) == false);
     */
  }

  // exclude    .bolt
  filteredFiles = filteredFiles.filter((x) => x.path.startsWith('.bolt') == false);

  // check for ignore file in .bolt folder
  const templateIgnoreFile = files.find((x) => x.path.startsWith('.bolt') && x.name == 'ignore');

  const filesToImport = {
    files: filteredFiles,
    ignoreFile: [] as typeof filteredFiles,
  };

  if (templateIgnoreFile) {
    // redacting files specified in ignore file
    const ignorepatterns = templateIgnoreFile.content.split('\n').map((x) => x.trim());
    const ig = ignore().add(ignorepatterns);

    // filteredFiles = filteredFiles.filter(x => !ig.ignores(x.path))
    const ignoredFiles = filteredFiles.filter((x) => ig.ignores(x.path));

    filesToImport.files = filteredFiles;
    filesToImport.ignoreFile = ignoredFiles;
  }

  const assistantMessage = `Initializing your project with the required files using the ${template.name} template.
<afArtifact id="imported-files" title="${title || 'Create initial files'}" type="bundled">
${filesToImport.files
      .map(
        (file: any) =>
          `<afAction type="file" filePath="${file.path}"${file.encoding ? ` encoding="${file.encoding}"` : ''}>
${file.content}
</afAction>`,
      )
      .join('\n')}
</afArtifact>
`;
  let userMessage = ``;
  const templatePromptFile = files.filter((x) => x.path.startsWith('.bolt')).find((x) => x.name == 'prompt');

  if (templatePromptFile) {
    userMessage = `
TEMPLATE INSTRUCTIONS:
${templatePromptFile.content}

---
`;
  }

  if (filesToImport.ignoreFile.length > 0) {
    userMessage =
      userMessage +
      `
STRICT FILE ACCESS RULES - READ CAREFULLY:

The following files are READ-ONLY and must never be modified:
${filesToImport.ignoreFile.map((file) => `- ${file.path}`).join('\n')}

Permitted actions:
✓ Import these files as dependencies
✓ Read from these files
✓ Reference these files

Strictly forbidden actions:
❌ Modify any content within these files
❌ Delete these files
❌ Rename these files
❌ Move these files
❌ Create new versions of these files
❌ Suggest changes to these files

Any attempt to modify these protected files will result in immediate termination of the operation.

If you need to make changes to functionality, create new files instead of modifying the protected ones listed above.
---
`;
  }

  userMessage += `
---
Template import complete. The files above have been imported from the template.

⚠️ EXPO TEMPLATE - PRE-CONFIGURED FOR E2B:
The package.json has been automatically configured with required scripts:
- "dev": "EXPO_NO_TELEMETRY=1 npx expo start --tunnel"
- "start": "EXPO_NO_TELEMETRY=1 npx expo start --tunnel"

These scripts are ALREADY CORRECT - DO NOT modify or remove them.
The --tunnel flag is required for E2B sandboxes to work properly.

NEXT STEPS:
1. Review the template files above - these are now in your project
2. Modify ONLY the files that need changes based on your requirements
3. Follow the environment-specific instructions in your system prompt for:
   - Package.json is already configured correctly
   - Dependency installation sequence
   - Project startup commands

DO NOT:
- Rewrite files that don't need changes
- Modify the package.json scripts section
- Skip the dependency installation step
- Ignore environment-specific requirements

Now continue with my original request, applying any necessary environment-specific modifications.
`;

  return {
    assistantMessage,
    userMessage,
  };
}
