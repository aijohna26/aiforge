import { atom } from 'nanostores';
import { createClient } from '~/lib/supabase/browser';
import { workbenchStore } from './workbench';
import { toast } from 'react-toastify';

const supabase = createClient();

export const isSaving = atom(false);
export const lastSavedAt = atom<string | null>(null);

/**
 * Saves the current state of files (from workbenchStore) to Supabase.
 * @param message - The AI Message object (id, role, content/parts)
 * @param projectId - The Project ID (optional)
 */
export async function saveCurrentFragment(message: any, projectId?: string) {
    if (!supabase) return;

    isSaving.set(true);

    try {
        const filesMap = workbenchStore.files.get();
        const simpleFiles: Record<string, string> = {};

        // Convert internal FileDirent map to simple JSON { path: content }
        for (const [path, dirent] of Object.entries(filesMap)) {
            // Cast to any to avoid "Property content does not exist on Dirent" if type is vague
            const d = dirent as any;
            if (d?.type === 'file' && !d.isBinary && typeof d.content === 'string') {
                simpleFiles[path] = d.content;
            }
        }

        // 1. Ensure Message exists in DB
        if (message && message.id) {
            // Extract content safely (AI SDK 6.0 support)
            let content = '';
            if (typeof message.content === 'string') {
                content = message.content;
            } else if (Array.isArray(message.parts)) {
                content = message.parts.map((p: any) => p.text || '').join('');
            } else {
                content = JSON.stringify(message.content || '');
            }

            const { error: msgError } = await supabase.from('messages').upsert({
                id: message.id,
                role: message.role || 'assistant',
                content: content
            });

            if (msgError) {
                console.warn('[CodePersistence] Failed to upsert message:', msgError);
            }
        }

        // 2. Insert into Supabase 'fragments'
        const { error } = await supabase.from('fragments').insert({
            message_id: message?.id || undefined,
            project_id: projectId || undefined,
            files: simpleFiles,
        });

        if (error) {
            throw error;
        }

        lastSavedAt.set(new Date().toISOString());
        console.log('[CodePersistence] Saved fragment successfully.');

    } catch (error) {
        console.error('[CodePersistence] Failed to save fragment:', error);
    } finally {
        isSaving.set(false);
    }
}

/**
 * Loads the LATEST fragment for a given project ID.
 * @param projectId 
 */
export async function loadLatestFragment(projectId: string) {
    if (!supabase) return;

    try {
        const { data, error } = await supabase
            .from('fragments')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            if (error.code !== 'PGRST116') {
                console.error('[CodePersistence] Error fetching fragment:', error);
            }
            return;
        }

        if (data && data.files) {
            console.log('[CodePersistence] Loading fragment:', data.id);

            const filesValues = data.files as Record<string, string>;

            // Load into Workbench
            for (const [filePath, content] of Object.entries(filesValues)) {
                const exists = workbenchStore.files.get()[filePath];
                const d = exists as any;
                if (!d || d.content !== content) {
                    await workbenchStore.createFile(filePath, content);
                }
            }


            // toast.success('Restored saved code from database.');

            // Auto-start dev server (fire and forget)
            const terminal = workbenchStore.boltTerminal;
            if (terminal) {
                terminal.ready().then(async () => {
                    try {
                        // 1. Force-write critical configuration files
                        const babelConfig = `module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};`;
                        await workbenchStore.createFile('/babel.config.js', babelConfig);

                        const tsconfig = `{
  "compilerOptions": {
    "allowSyntheticDefaultImports": true,
    "jsx": "react-native",
    "lib": ["dom", "esnext"],
    "moduleResolution": "node",
    "noEmit": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "strict": true,
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts"
  ],
  "extends": "expo/tsconfig.base"
}`;
                        await workbenchStore.createFile('/tsconfig.json', tsconfig);

                        const metroConfig = `const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
module.exports = config;`;
                        await workbenchStore.createFile('/metro.config.js', metroConfig);

                        // 2. Ensure package.json has necessary devDependencies
                        const filesMap = workbenchStore.files.get();
                        const findFile = (name: string) => Object.keys(filesMap).find(p => p === name || p === '/' + name);
                        const packageJsonPath = findFile('package.json');

                        if (packageJsonPath) {
                            const packageJsonContent = (filesMap[packageJsonPath] as any).content;
                            try {
                                const pkg = JSON.parse(packageJsonContent);
                                if (!pkg.devDependencies) pkg.devDependencies = {};

                                // Ensure critical dependencies are present and compatible with Expo 52+
                                let modified = false;

                                // Fix: Align versions with Expo 52/54 standard
                                if (!pkg.devDependencies['babel-preset-expo'] || pkg.devDependencies['babel-preset-expo'] !== '~54.0.0') {
                                    console.log('[CodePersistence] Fixing babel-preset-expo dependency');
                                    pkg.devDependencies['babel-preset-expo'] = '~54.0.0';
                                    modified = true;
                                }

                                if (!pkg.devDependencies['typescript']) {
                                    pkg.devDependencies['typescript'] = '^5.3.3';
                                    modified = true;
                                }

                                // Fix: Ensure babel core deps are present
                                if (!pkg.devDependencies['@babel/core']) {
                                    pkg.devDependencies['@babel/core'] = '^7.20.0';
                                    modified = true;
                                }
                                if (!pkg.devDependencies['@babel/preset-react']) {
                                    pkg.devDependencies['@babel/preset-react'] = '^7.18.6';
                                    modified = true;
                                }

                                // Ensure 'expo' is present in dependencies
                                if (!pkg.dependencies) pkg.dependencies = {};
                                if (!pkg.dependencies['expo']) {
                                    pkg.dependencies['expo'] = '~54.0.31';
                                    modified = true;
                                }

                                if (modified) {
                                    await workbenchStore.createFile(packageJsonPath, JSON.stringify(pkg, null, 2));
                                }
                            } catch (e) {
                                console.warn('[CodePersistence] Failed to parse/update package.json', e);
                            }
                        }

                    } catch (e) {
                        console.warn('[CodePersistence] Auto-fix failed', e);
                    }

                    // Nuclear clean and start using npx to ensure local binaries are used
                    terminal.executeCommand('auto-start-' + Date.now(), 'rm -rf node_modules pnpm-lock.yaml package-lock.json yarn.lock && npm install && npx expo start --web --clear');
                });
            }
        }

        // Fix: Switch to code view and select main file so editor isn't empty
        console.log('[CodePersistence] Switching to Code view after restore');
        workbenchStore.currentView.set('code');

        const filesMap = workbenchStore.files.get();
        const mainFile = Object.keys(filesMap).find(p =>
            p.endsWith('app/index.tsx') ||
            p.endsWith('app/index.js') ||
            p.endsWith('App.tsx') ||
            p.endsWith('index.ts')
        );

        if (mainFile) {
            console.log('[CodePersistence] Selecting main file:', mainFile);
            workbenchStore.setSelectedFile(mainFile);
        }
    }

    catch (error) {
        console.error('[CodePersistence] Failed to load fragment:', error);
    }
}
