import { Template, waitForURL } from 'e2b';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Path to the Golden Template
const templateDir = path.resolve(__dirname, '../../templates/af-expo-template-v4');
const tempTarPath = path.resolve(__dirname, 'template.tar.gz');

// Create a tarball of the template directory, excluding node_modules and .git
// We use -C to change directory so the files are at the root of the archive
try {
    execSync(`tar -czf "${tempTarPath}" --exclude node_modules --exclude .git -C "${templateDir}" .`);
} catch (e) {
    console.error('Failed to create tarball:', e);
    process.exit(1);
}

// Read the tarball
const tarContent = fs.readFileSync(tempTarPath);
const tarBase64 = Buffer.from(tarContent).toString('base64');

// Clean up temp file
fs.unlinkSync(tempTarPath);

// Initialize template
let t = Template()
    .fromNodeImage()
    .setWorkdir("/home/user");

// Chunk the tarball to avoid ARG_MAX issues
const chunkSize = 100 * 1024; // 100KB chunks
for (let i = 0; i < tarBase64.length; i += chunkSize) {
    const chunk = tarBase64.substring(i, i + chunkSize);
    const op = i === 0 ? '>' : '>>';
    t = t.runCmd(`echo "${chunk}" ${op} template.tar.gz.b64`);
}

export const template = t
    .runCmd('base64 -d template.tar.gz.b64 > template.tar.gz')
    .runCmd('tar -xzf template.tar.gz')
    .runCmd('rm template.tar.gz template.tar.gz.b64')
    // Install global tools first
    .runCmd("sudo npm install -g pnpm @expo/ngrok")
    // Install dependencies using pnpm
    .runCmd("pnpm install")
    // Create utils directory and inject supabase.ts (It should be in the tarball now, but overwriting is fine if we updated it locally)
    // Actually, if we updated utils/supabase.ts in the source template (Step 797), it IS in the tarball. 
    // We can remove the manual injection steps if we are sure.
    // Let's keep the manual mkdir just in case but remove the echo if we trust the tarball.
    // To be safe and since I updated utils/supabase.ts LOCALLY in the template, the tarball has it.
    .setStartCmd("EXPO_NO_TELEMETRY=1 npx expo start --web --port 8081", waitForURL("http://localhost:8081"));


//     curl -X POST http://localhost:5173/api/e2b/execute \
//   -H "Content-Type: application/json" \
//   -d '{"command": "npx expo --version", "template": "0xcsz5virqvvmgjmqqam"}'