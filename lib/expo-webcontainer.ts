import { WebContainer } from '@webcontainer/api';
import type { FileSystemTree } from '@webcontainer/api';

export interface ExpoQRCode {
  url: string;
  qrCode: string; // ASCII QR code from Expo CLI
}

export class ExpoWebContainer {
  private static globalContainer: WebContainer | null = null;
  private static globalInitPromise: Promise<WebContainer> | null = null;
  private container: WebContainer | null = null;
  private initPromise: Promise<WebContainer> | null = null;
  private expoProcess: any = null; // Store the Expo process for cleanup

  async boot(): Promise<WebContainer> {
    // Use global singleton to ensure only one WebContainer instance across the app
    if (ExpoWebContainer.globalContainer) {
      this.container = ExpoWebContainer.globalContainer;
      return this.container;
    }

    if (ExpoWebContainer.globalInitPromise) {
      this.container = await ExpoWebContainer.globalInitPromise;
      return this.container;
    }

    ExpoWebContainer.globalInitPromise = WebContainer.boot();
    this.container = await ExpoWebContainer.globalInitPromise;
    ExpoWebContainer.globalContainer = this.container;
    return this.container;
  }

  async writeFiles(files: Record<string, { type: string; content: string }>, onProgress?: (file: string) => void) {
    const container = await this.boot();

    // Write files individually like bolt.diy (faster than mounting)
    for (const [path, file] of Object.entries(files)) {
      if (file.type !== 'file') continue;

      // Remove leading slash if present
      const relativePath = path.startsWith('/') ? path.slice(1) : path;

      // Create directory structure
      const dirPath = relativePath.split('/').slice(0, -1).join('/');
      if (dirPath) {
        try {
          await container.fs.mkdir(dirPath, { recursive: true });
        } catch (error) {
          // Directory might already exist
        }
      }

      // Write file
      await container.fs.writeFile(relativePath, file.content);
      onProgress?.(relativePath);
    }

    console.log('[ExpoWebContainer] Files written');
  }

  async installDependencies(onOutput: (data: string) => void): Promise<void> {
    const container = await this.boot();
    const process = await container.spawn('npm', ['install']);

    process.output.pipeTo(
      new WritableStream({
        write(data) {
          onOutput(data);
        },
      })
    );

    const exitCode = await process.exit;
    if (exitCode !== 0) {
      throw new Error(`npm install failed with exit code ${exitCode}`);
    }
  }

  async startExpo(onOutput: (data: string) => void, onQRCode: (qr: ExpoQRCode) => void) {
    const container = await this.boot();

    console.log('[ExpoWebContainer] Starting Expo with tunnel (like bolt.diy)...');

    // Run expo start with --tunnel (let Expo auto-select port to avoid conflicts)
    const process = await container.spawn('npx', ['expo', 'start', '--tunnel']);

    let buffer = '';
    const expoUrlRegex = /(exp:\/\/[^\s]+)/; // Same regex as bolt.diy

    process.output.pipeTo(
      new WritableStream({
        write(data) {
          const output = data.toString();
          onOutput(output);

          // Accumulate output in buffer (like bolt.diy does)
          buffer += output;

          // Extract Expo URL from buffer
          const expoUrlMatch = buffer.match(expoUrlRegex);

          if (expoUrlMatch) {
            // Clean URL by removing ANSI escape codes (like bolt.diy)
            const cleanUrl = expoUrlMatch[1]
              .replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')
              .replace(/[^\x20-\x7E]+$/g, '');

            console.log('[ExpoWebContainer] Detected Expo URL:', cleanUrl);

            onQRCode({
              url: cleanUrl,
              qrCode: '', // We'll generate QR code in React component
            });

            // Remove everything up to and including the URL from the buffer
            buffer = buffer.slice(buffer.indexOf(expoUrlMatch[1]) + expoUrlMatch[1].length);
          }

          // Prevent buffer from growing too large
          if (buffer.length > 2048) {
            buffer = buffer.slice(-2048);
          }
        },
      })
    );

    // Store the process for cleanup
    this.expoProcess = process;
    return process;
  }

  async stopExpo() {
    if (this.expoProcess) {
      try {
        console.log('[ExpoWebContainer] Killing Expo process...');
        await this.expoProcess.kill();
        this.expoProcess = null;
        console.log('[ExpoWebContainer] Expo process killed');
      } catch (error) {
        console.error('[ExpoWebContainer] Failed to kill Expo process:', error);
      }
    }
  }

  async writeFile(path: string, content: string) {
    const container = await this.boot();
    await container.fs.writeFile(path, content);
  }

  async teardown() {
    if (ExpoWebContainer.globalContainer) {
      await ExpoWebContainer.globalContainer.teardown();
      ExpoWebContainer.globalContainer = null;
      ExpoWebContainer.globalInitPromise = null;
      this.container = null;
      this.initPromise = null;
    }
  }
}
