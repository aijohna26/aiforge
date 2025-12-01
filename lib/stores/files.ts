import type { PathWatcherEvent, WebContainer } from '@webcontainer/api';
import { map, type MapStore } from 'nanostores';

const utf8TextDecoder = new TextDecoder('utf8', { fatal: true });

export interface File {
    type: 'file';
    content: string;
    isBinary: boolean;
}

export interface Folder {
    type: 'folder';
}

type Dirent = File | Folder;

export type FileMap = Record<string, Dirent | undefined>;

export class FilesStore {
    #webcontainer: Promise<WebContainer>;
    #size = 0;

    /**
     * Map of files that matches the state of WebContainer.
     */
    files: MapStore<FileMap> = map({});

    get filesCount() {
        return this.#size;
    }

    constructor(webcontainerPromise: Promise<WebContainer>) {
        this.#webcontainer = webcontainerPromise;
        this.#init();
    }

    getFile(filePath: string) {
        const dirent = this.files.get()[filePath];

        if (!dirent || dirent.type !== 'file') {
            return undefined;
        }

        return dirent;
    }

    async saveFile(filePath: string, content: string) {
        const webcontainer = await this.#webcontainer;

        try {
            await webcontainer.fs.writeFile(filePath, content);

            // Immediately update the file in the store
            this.files.setKey(filePath, {
                type: 'file',
                content,
                isBinary: false,
            });

            console.log('[FilesStore] File saved:', filePath);
        } catch (error) {
            console.error('[FilesStore] Failed to save file:', filePath, error);
            throw error;
        }
    }

    async createFile(filePath: string, content: string | Uint8Array = '') {
        const webcontainer = await this.#webcontainer;

        try {
            const dirPath = filePath.split('/').slice(0, -1).join('/');

            if (dirPath && dirPath !== '.') {
                await webcontainer.fs.mkdir(dirPath, { recursive: true });
            }

            const isBinary = content instanceof Uint8Array;

            if (isBinary) {
                await webcontainer.fs.writeFile(filePath, Buffer.from(content));

                const base64Content = Buffer.from(content).toString('base64');
                this.files.setKey(filePath, {
                    type: 'file',
                    content: base64Content,
                    isBinary: true,
                });
            } else {
                const contentToWrite = (content as string).length === 0 ? ' ' : content;
                await webcontainer.fs.writeFile(filePath, contentToWrite);

                this.files.setKey(filePath, {
                    type: 'file',
                    content: content as string,
                    isBinary: false,
                });
            }

            console.log('[FilesStore] File created:', filePath);
            return true;
        } catch (error) {
            console.error('[FilesStore] Failed to create file:', filePath, error);
            throw error;
        }
    }

    async deleteFile(filePath: string) {
        const webcontainer = await this.#webcontainer;

        try {
            await webcontainer.fs.rm(filePath);
            this.files.setKey(filePath, undefined);
            this.#size--;

            console.log('[FilesStore] File deleted:', filePath);
            return true;
        } catch (error) {
            console.error('[FilesStore] Failed to delete file:', filePath, error);
            throw error;
        }
    }

    async #init() {
        // File watcher requires internal API which we don't have access to
        // Instead, we rely on explicit file writes updating the store
        console.log('[FilesStore] Initialized (manual sync mode)');
    }

    #processEvents(events: PathWatcherEvent[]) {
        // Placeholder - not used without internal API
        // File updates happen via saveFile/createFile methods
    }

    #decodeFileContent(buffer?: Uint8Array) {
        if (!buffer || buffer.byteLength === 0) {
            return '';
        }

        try {
            return utf8TextDecoder.decode(buffer);
        } catch (error) {
            return '';
        }
    }

    #isBinaryFile(buffer?: Uint8Array): boolean {
        if (!buffer || buffer.byteLength === 0) {
            return false;
        }

        // Simple binary detection - check for null bytes
        for (let i = 0; i < Math.min(buffer.byteLength, 8000); i++) {
            if (buffer[i] === 0) {
                return true;
            }
        }

        return false;
    }
}
