import { json } from '@remix-run/cloudflare';
import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { Sandbox } from '@e2b/code-interpreter';

export async function loader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const sandboxId = url.searchParams.get('sandboxId');
    const apiKey = process.env.E2B_API_KEY;

    if (!sandboxId) {
        return json({ error: 'Sandbox ID required' }, { status: 400 });
    }

    if (!apiKey) {
        return json({ error: 'Configuration error' }, { status: 500 });
    }

    try {
        // Connect to existing sandbox
        const sandbox = await Sandbox.connect(sandboxId, { apiKey });

        // Read the log file we created
        // We use cat instead of files.read to handle non-existent files gracefully via exit code
        const logs = await sandbox.commands.run('cat /home/user/app.log');

        return json({
            logs: logs.stdout || logs.stderr || 'No logs found.',
            lastUpdated: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Failed to fetch logs:', error);

        // Return friendly error
        if (error.message?.includes('not running') || error.message?.includes('not found')) {
            return json({ logs: 'Sandbox is no longer running.' });
        }

        return json({ error: 'Failed to fetch logs', details: error.message }, { status: 500 });
    }
}
