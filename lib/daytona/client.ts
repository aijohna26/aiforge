import { Daytona } from '@daytonaio/sdk';

/**
 * Daytona client singleton
 * Configured using environment variables:
 * - DAYTONA_API_KEY (required)
 * - DAYTONA_API_URL (optional, defaults to https://app.daytona.io/api)
 * - DAYTONA_TARGET (optional, defaults to organization default region)
 */
export const daytonaClient = new Daytona({
    apiKey: process.env.DAYTONA_API_KEY,
    apiUrl: process.env.DAYTONA_API_URL || 'https://app.daytona.io/api',
    target: process.env.DAYTONA_TARGET || 'us',
});
