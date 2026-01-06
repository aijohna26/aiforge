import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

// Binary file extensions that need base64 encoding
const BINARY_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp', '.ttf', '.woff', '.woff2', '.eot', '.otf'];

function isBinaryFile(filename: string): boolean {
  return BINARY_EXTENSIONS.some(ext => filename.toLowerCase().endsWith(ext));
}

async function getFilesRecursively(dir: string, baseDir: string = dir): Promise<{ name: string; path: string; content: string; encoding?: 'base64' }[]> {
  const files: { name: string; path: string; content: string; encoding?: 'base64' }[] = [];

  const entries = await readdir(dir, { withFileTypes: true });

  // Directories to skip
  const skipDirs = ['node_modules', '.git', '.expo', 'dist', 'build', '.next', '.cache'];

  for (const entry of entries) {
    // Skip excluded directories
    if (entry.isDirectory() && skipDirs.includes(entry.name)) {
      continue;
    }

    const fullPath = join(dir, entry.name);
    const relativePath = fullPath.substring(baseDir.length + 1);

    if (entry.isDirectory()) {
      const subFiles = await getFilesRecursively(fullPath, baseDir);
      files.push(...subFiles);
    } else {
      try {
        // Check if file is binary
        if (isBinaryFile(entry.name)) {
          const buffer = await readFile(fullPath);
          files.push({
            name: entry.name,
            path: relativePath,
            content: buffer.toString('base64'),
            encoding: 'base64',
          });
        } else {
          const content = await readFile(fullPath, 'utf-8');
          files.push({
            name: entry.name,
            path: relativePath,
            content,
          });
        }
      } catch (error) {
        console.error(`Error reading file ${fullPath}:`, error);
      }
    }
  }

  return files;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const templatePath = url.searchParams.get('path');

  if (!templatePath) {
    return json({ error: 'Template path is required' }, { status: 400 });
  }

  // Security: Only allow templates from the templates directory
  if (!templatePath.startsWith('templates/')) {
    return json({ error: 'Invalid template path' }, { status: 403 });
  }

  try {
    // Read all files from the local template directory
    const templateDir = join(process.cwd(), templatePath);
    let files = await getFilesRecursively(templateDir);

    // CRITICAL: Modify package.json for Expo templates to add --tunnel flag
    // This must happen server-side before files are sent to client
    if (templatePath.includes('expo-template')) {
      const packageJsonFile = files.find((f) => f.name === 'package.json' && f.path === 'package.json');

      if (packageJsonFile) {
        try {
          const pkg = JSON.parse(packageJsonFile.content);

          // Add --web --port 8081 flags to Expo scripts (required for E2B web preview)
          // We use web mode because E2B proxies port 8081, making it reliable (unlike tunnel)
          const E2B_FLAGS = 'EXPO_NO_TELEMETRY=1 npx expo start --web --port 8081';

          if (pkg.scripts) {
            // Force dev and start scripts to use the robust E2B command
            pkg.scripts.dev = E2B_FLAGS;
            pkg.scripts.start = E2B_FLAGS;
          }

          // Update the file content with modified package.json
          packageJsonFile.content = JSON.stringify(pkg, null, 2);
          console.log('✅ [SERVER] Modified package.json for Expo: added --web --port 8081 flags');
        } catch (error) {
          console.error('Failed to modify package.json for Expo:', error);
        }
      }
    }

    return json(files);
  } catch (error) {
    console.error('Error loading local template:', error);
    return json({ error: 'Failed to load template' }, { status: 500 });
  }
}
