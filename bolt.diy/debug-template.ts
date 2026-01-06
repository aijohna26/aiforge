
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

const BINARY_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp', '.ttf', '.woff', '.woff2', '.eot', '.otf'];

function isBinaryFile(filename: string): boolean {
    return BINARY_EXTENSIONS.some(ext => filename.toLowerCase().endsWith(ext));
}

async function getFilesRecursively(dir: string, baseDir: string = dir): Promise<{ name: string; path: string; content: string; encoding?: 'base64' }[]> {
    const files: { name: string; path: string; content: string; encoding?: 'base64' }[] = [];
    const entries = await readdir(dir, { withFileTypes: true });
    const skipDirs = ['node_modules', '.git', '.expo', 'dist', 'build', '.next', '.cache'];

    for (const entry of entries) {
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
                if (isBinaryFile(entry.name)) {
                    // skip content for debug
                    files.push({ name: entry.name, path: relativePath, content: '(binary)', encoding: 'base64' });
                } else {
                    // skip content for debug
                    files.push({ name: entry.name, path: relativePath, content: '(text)' });
                }
            } catch (error) {
                console.error(`Error reading file ${fullPath}:`, error);
            }
        }
    }
    return files;
}

// Main
(async () => {
    const templatePath = 'templates/af-expo-template';
    const templateDir = join(process.cwd(), templatePath);
    console.log(`Scanning: ${templateDir}`);
    const files = await getFilesRecursively(templateDir);
    console.log('Files found:');
    files.forEach(f => console.log(`- ${f.path}`));

    const pkg = files.find(f => f.path === 'package.json');
    if (pkg) {
        console.log('✅ package.json FOUND');
    } else {
        console.log('❌ package.json NOT FOUND');
    }
})();
