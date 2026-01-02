import { serve } from 'inngest/remix';
import { inngest } from '~/lib/inngest/client';

import { imageGeneration } from '~/lib/inngest/functions/image-generation';
import { screenGeneration } from '~/lib/inngest/functions/screen-generation';
import { screenshotExport } from '~/lib/inngest/functions/screenshot-export';

const handler = serve({
  client: inngest,
  functions: [imageGeneration, screenGeneration, screenshotExport],
});

export const loader = handler;
export const action = handler;
