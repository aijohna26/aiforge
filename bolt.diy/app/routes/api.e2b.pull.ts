import { json } from '@remix-run/cloudflare';
import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { Sandbox } from '@e2b/code-interpreter';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  const apiKey = process.env.E2B_API_KEY;

  if (!apiKey) {
    return json({ error: 'E2B_API_KEY not configured on server' }, { status: 500 });
  }

  let sandboxId: string | undefined;

  try {
    const body = await request.json();
    sandboxId = body?.sandboxId;
  } catch (error) {
    console.error('[E2B Pull] Invalid JSON payload', error);
    return json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!sandboxId) {
    return json({ error: 'sandboxId is required' }, { status: 400 });
  }

  try {
    const sandbox = await Sandbox.connect(sandboxId, { apiKey, timeoutMs: 5 * 60 * 1000 });
    const archivePath = `/tmp/appforge-pull-${Date.now()}.tar.gz`;
    const tarCommand = [
      'cd /home/user',
      `tar --exclude='node_modules' --exclude='.git' --exclude='.expo' --exclude='.cache' --exclude='.e2b' -czf ${archivePath} .`,
    ].join(' && ');

    await sandbox.commands.run(tarCommand);
    const buffer = await sandbox.files.downloadFile(archivePath);
    await sandbox.commands.run(`rm -f ${archivePath}`);

    return json({
      sandboxId,
      archive: buffer.toString('base64'),
    });
  } catch (error) {
    console.error('[E2B Pull] Failed to pull files', error);
    return json(
      {
        error: error instanceof Error ? error.message : 'Failed to pull files from sandbox',
      },
      { status: 500 },
    );
  }
}
