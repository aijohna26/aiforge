import webpack from 'webpack';
import path from 'path';
import { createHash } from 'crypto';

interface CompilerOptions {
    projectId: string;
    files: Array<{ path: string; content: string }>;
    entry: string;
}

export class BundleCompiler {
    private static cache = new Map<string, string>();

    static async compile(options: CompilerOptions): Promise<string> {
        const { projectId, files, entry } = options;

        // Check cache first
        const cacheKey = this.getCacheKey(files);
        const cached = this.cache.get(cacheKey);
        if (cached) {
            console.log(`[Compiler] Cache hit for ${projectId}`);
            return cached;
        }

        console.log(`[Compiler] Compiling bundle for ${projectId}...`);

        // Create in-memory filesystem
        const fileMap = new Map<string, string>();
        files.forEach(f => {
            fileMap.set(f.path, f.content);
        });

        // Webpack configuration
        const config: webpack.Configuration = {
            mode: 'development',
            entry: {
                main: entry,
            },
            output: {
                path: '/dist',
                filename: 'bundle.js',
            },
            module: {
                rules: [
                    {
                        test: /\.(js|jsx|ts|tsx)$/,
                        use: {
                            loader: 'babel-loader',
                            options: {
                                presets: [
                                    '@babel/preset-react',
                                    '@babel/preset-typescript',
                                ],
                            },
                        },
                    },
                ],
            },
            resolve: {
                extensions: ['.js', '.jsx', '.ts', '.tsx'],
                alias: {
                    'react-native$': 'react-native-web',
                },
            },
            plugins: [],
        };

        // Compile using webpack
        const compiler = webpack(config);

        return new Promise((resolve, reject) => {
            // Use in-memory FS
            const memoryFs = new Map<string, string>();

            compiler.inputFileSystem = {
                readFile: (filePath: string, callback: any) => {
                    const content = fileMap.get(filePath);
                    if (content) {
                        callback(null, Buffer.from(content));
                    } else {
                        callback(new Error('File not found'));
                    }
                },
            } as any;

            compiler.outputFileSystem = {
                writeFile: (filePath: string, content: any, callback: any) => {
                    memoryFs.set(filePath, content.toString());
                    callback(null);
                },
            } as any;

            compiler.run((err, stats) => {
                if (err) {
                    console.error('[Compiler] Compilation failed:', err);
                    reject(err);
                    return;
                }

                if (stats?.hasErrors()) {
                    const errors = stats.toJson().errors;
                    console.error('[Compiler] Compilation errors:', errors);
                    reject(new Error(errors?.[0]?.message || 'Compilation failed'));
                    return;
                }

                // Get compiled bundle
                const bundleJs = memoryFs.get('/dist/bundle.js');
                if (!bundleJs) {
                    reject(new Error('Bundle not generated'));
                    return;
                }

                // Generate HTML wrapper
                const html = this.generateHTML(bundleJs);

                // Cache result
                this.cache.set(cacheKey, html);
                console.log(`[Compiler] Compilation complete for ${projectId}`);

                resolve(html);
            });
        });
    }

    private static generateHTML(bundleJs: string): string {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>App Preview</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        #root { width: 100%; height: 100vh; }
    </style>
</head>
<body>
    <div id="root"></div>
    <script>${bundleJs}</script>
</body>
</html>
        `.trim();
    }

    private static getCacheKey(files: Array<{ path: string; content: string }>): string {
        const hash = createHash('md5');
        files.forEach(f => {
            hash.update(f.path + f.content);
        });
        return hash.digest('hex');
    }

    static clearCache() {
        this.cache.clear();
    }
}
