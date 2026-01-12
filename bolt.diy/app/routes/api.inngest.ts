import { serve } from 'inngest/remix';
import { inngest } from '~/lib/inngest/client';

import { functions } from '~/lib/inngest/functions';

const handler = serve({
  client: inngest,
  functions,
});

export const loader = handler;
export const action = handler;
