import { WebContainer } from '@webcontainer/api';

interface WebContainerContext {
  loaded: boolean;
}

export const webcontainerContext: WebContainerContext = {
  loaded: false,
};

// Create a promise that resolves to WebContainer or never resolves (for SSR)
let resolveWebContainer: ((wc: WebContainer) => void) | null = null;

export let webcontainer: Promise<WebContainer> = new Promise((resolve) => {
  resolveWebContainer = resolve;
});

// Boot WebContainer on client side
if (typeof window !== 'undefined') {
  Promise.resolve()
    .then(() => {
      console.log('[WebContainer] Booting...');
      return WebContainer.boot({
        coep: 'credentialless',
        forwardPreviewErrors: true, // Enable error forwarding from iframes (bolt.diy)
      });
    })
    .then(async (wc) => {
      webcontainerContext.loaded = true;
      console.log('[WebContainer] Ready');

      // Log all port events for debugging (bolt.diy approach)
      wc.on('server-ready', (port, url) => {
        console.log('[WebContainer] server-ready event:', { port, url });
      });

      wc.on('port', (port, type, url) => {
        console.log('[WebContainer] port event:', { port, type, url });
      });

      if (resolveWebContainer) {
        resolveWebContainer(wc);
      }
      return wc;
    })
    .catch((err) => {
      console.error('[WebContainer] Failed to boot:', err);
    });
}
