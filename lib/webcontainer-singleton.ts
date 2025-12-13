import { WebContainer } from '@webcontainer/api';

// Global singleton WebContainer (like bolt.diy)
let globalWebContainer: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

export async function getWebContainer(): Promise<WebContainer> {
  if (globalWebContainer) {
    return globalWebContainer;
  }

  if (bootPromise) {
    return bootPromise;
  }

  console.log('[WebContainer] Booting global instance...');
  bootPromise = WebContainer.boot({
    coep: 'credentialless',
    workdirName: 'project', // Match bolt.diy's setup
  });

  globalWebContainer = await bootPromise;
  console.log('[WebContainer] Global instance ready');

  return globalWebContainer;
}

export function getWebContainerSync(): WebContainer | null {
  return globalWebContainer;
}
