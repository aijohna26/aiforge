import fs from 'fs';
import path from 'path';

export async function loadBoltExpoTemplate() {
  const templatePath = path.join(process.cwd(), 'templates/af-expo-template');
  const files: Record<string, { type: string; content: string }> = {};

  // Read all files recursively
  function readDir(dir: string, baseDir: string = dir) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const relativePath = '/' + path.relative(baseDir, fullPath);

      // Skip node_modules, .git, etc
      if (item.startsWith('.') || item === 'node_modules') continue;

      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        readDir(fullPath, baseDir);
      } else if (stats.isFile()) {
        // For binary files (images), store as base64
        const isBinary = /\.(png|jpg|jpeg|gif|ico|bmp|webp)$/i.test(item);
        let content: string;

        if (isBinary) {
          // Read binary files as base64
          const buffer = fs.readFileSync(fullPath);
          content = `data:image/${path.extname(fullPath).slice(1)};base64,${buffer.toString('base64')}`;
        } else {
          content = fs.readFileSync(fullPath, 'utf-8');
        }

        // Modify package.json to only include web-compatible dependencies
        if (relativePath === '/package.json') {
          const pkg = JSON.parse(content);

          // Keep original Expo 54 dependencies but simplify for web
          const webPackage = {
            name: pkg.name,
            main: pkg.main,
            version: pkg.version,
            private: pkg.private,
            scripts: {
              start: 'expo start --tunnel',
              web: 'expo start --web',
            },
            dependencies: {
              // Use template's Expo 54 versions
              'expo': pkg.dependencies.expo,
              'expo-router': pkg.dependencies['expo-router'],
              'expo-status-bar': pkg.dependencies['expo-status-bar'],
              'expo-constants': pkg.dependencies['expo-constants'],
              'expo-linking': pkg.dependencies['expo-linking'],
              'react': pkg.dependencies.react,
              'react-dom': pkg.dependencies['react-dom'],
              'react-native': pkg.dependencies['react-native'],
              'react-native-web': pkg.dependencies['react-native-web'],
              'react-native-safe-area-context': pkg.dependencies['react-native-safe-area-context'],
              'react-native-screens': pkg.dependencies['react-native-screens'],
            },
            devDependencies: pkg.devDependencies,
          };

          content = JSON.stringify(webPackage, null, 2);
        }

        // Modify app.json to remove native plugins and disable new architecture
        if (relativePath === '/app.json') {
          const appConfig = JSON.parse(content);

          // Simplify plugins and disable new architecture for WebContainer
          if (appConfig.expo) {
            appConfig.expo.plugins = ['expo-router']; // Only keep expo-router
            // Explicitly disable new architecture to avoid TurboModule errors
            appConfig.expo.newArchEnabled = false;
          }

          content = JSON.stringify(appConfig, null, 2);
        }

        // Fix tsconfig.json to not extend expo/tsconfig.base (doesn't exist in WebContainer)
        if (relativePath === '/tsconfig.json') {
          const tsConfig = JSON.parse(content);

          // Replace with standalone config
          const webTsConfig = {
            compilerOptions: {
              target: 'esnext',
              lib: ['dom', 'esnext'],
              jsx: 'react-native',
              module: 'esnext',
              moduleResolution: 'node',
              resolveJsonModule: true,
              allowSyntheticDefaultImports: true,
              esModuleInterop: true,
              strict: true,
              skipLibCheck: true,
              paths: tsConfig.compilerOptions?.paths || { '@/*': ['./*'] },
            },
            include: tsConfig.include || ['**/*.ts', '**/*.tsx'],
            exclude: ['node_modules'],
          };

          content = JSON.stringify(webTsConfig, null, 2);
        }

        // Strip lucide-react-native imports from .tsx/.ts files
        if (relativePath.endsWith('.tsx') || relativePath.endsWith('.ts')) {
          // Remove lucide imports and replace icons with simple Text
          content = content.replace(/import\s+\{[^}]*\}\s+from\s+['"]lucide-react-native['"];?\s*/g, '');
          content = content.replace(/import\s+.*\s+from\s+['"]lucide-react-native['"];?\s*/g, '');

          // Remove useFrameworkReady hook import and usage
          content = content.replace(/import\s+\{[^}]*useFrameworkReady[^}]*\}\s+from\s+['"]@\/hooks\/useFrameworkReady['"];?\s*/g, '');
          content = content.replace(/\s*useFrameworkReady\(\);?\s*/g, '');

          // Replace common lucide icon usage with Text component
          content = content.replace(/<(Home|Settings|User|Search|Menu|Plus|Minus|X|Check|ChevronRight|ChevronLeft|ChevronUp|ChevronDown)([^>]*?)\/>/g, '<Text>Icon</Text>');
          content = content.replace(/<(Home|Settings|User|Search|Menu|Plus|Minus|X|Check|ChevronRight|ChevronLeft|ChevronUp|ChevronDown)([^>]*?)>.*?<\/\1>/g, '<Text>Icon</Text>');
        }

        files[relativePath] = {
          type: 'file',
          content,
        };
      }
    }
  }

  readDir(templatePath);

  return files;
}
