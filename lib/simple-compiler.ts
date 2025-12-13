import { transform } from '@babel/standalone';
import { createHash } from 'crypto';

interface CompileOptions {
    files: Array<{ path: string; content: string }>;
}

export class SimpleCompiler {
    private static cache = new Map<string, string>();

    static compile(options: CompileOptions): string {
        const { files } = options;

        // Check cache
        const cacheKey = this.getCacheKey(files);
        const cached = this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }

        // Find entry point - be flexible
        let entry = files.find(f =>
            f.path === 'App.tsx' ||
            f.path === 'App.js' ||
            f.path === 'index.tsx' ||
            f.path === 'index.js'
        );

        // Fallback: find ANY tsx/jsx/js file
        if (!entry) {
            entry = files.find(f =>
                f.path.endsWith('.tsx') ||
                f.path.endsWith('.jsx') ||
                f.path.endsWith('.js')
            );
        }

        if (!entry) {
            throw new Error('No React component file found (.tsx, .jsx, or .js)');
        }

        console.log(`[Compiler] Using entry file: ${entry.path}`);

        // Transpile with Babel
        let transpiledCode = '';
        try {
            const result = transform(entry.content, {
                presets: ['react', 'typescript'],
                filename: entry.path,
            });
            transpiledCode = result.code || '';
        } catch (error) {
            console.error('[Compiler] Babel transpilation failed:', error);
            throw new Error('Transpilation failed');
        }

        // Generate HTML
        const html = this.generateHTML(transpiledCode);

        // Cache
        this.cache.set(cacheKey, html);

        return html;
    }

    private static generateHTML(code: string): string {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>App Preview</title>
    <script crossorigin src="https://unpkg.com/react@19/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@19/umd/react-dom.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-native-web@0.21.2/dist/index.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            overflow: hidden;
        }
        #root { width: 100%; height: 100vh; }
    </style>
</head>
<body>
    <div id="root"></div>
    <script>
        try {
            ${code}
            
            // Render App
            const AppRegistry = window.ReactNativeWeb.AppRegistry;
            const rootTag = document.getElementById('root');
            
            if (typeof App !== 'undefined') {
                AppRegistry.registerComponent('App', () => App);
                AppRegistry.runApplication('App', { rootTag });
            } else {
                rootTag.innerHTML = '<div style="padding: 20px; color: red;">Error: App component not found</div>';
            }
        } catch (error) {
            console.error('Runtime error:', error);
            document.getElementById('root').innerHTML = 
                '<div style="padding: 20px; color: red;">Runtime Error: ' + error.message + '</div>';
        }
    </script>
</body>
</html>
        `.trim();
    }

    private static getCacheKey(files: Array<{ path: string; content: string }>): string {
        const hash = createHash('md5');
        files.forEach(f => hash.update(f.path + f.content));
        return hash.digest('hex');
    }
}
