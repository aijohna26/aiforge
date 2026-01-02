import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { getJob } from '~/lib/inngest/db';

export async function loader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const jobId = url.searchParams.get('id');

    if (!jobId) {
        return json({ error: 'Job ID is required' }, { status: 400 });
    }

    const job = await getJob(jobId);

    if (!job) {
        return json({ error: 'Job not found' }, { status: 404 });
    }

    return json(job);
}
