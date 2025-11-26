// File-based store for preview sessions that persists across hot reloads
// In production, this should be replaced with Redis or a database

import fs from "fs";
import path from "path";

interface PreviewEntry {
  code: string;
  name: string;
  expiresAt: number;
}

const CACHE_DIR = path.join(process.cwd(), ".preview-cache");

// Ensure cache directory exists
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function getFilePath(id: string): string {
  return path.join(CACHE_DIR, `${id}.json`);
}

class PreviewStore {
  constructor() {
    ensureCacheDir();
    // Clean up expired entries on startup
    this.cleanup();
  }

  private cleanup() {
    try {
      const files = fs.readdirSync(CACHE_DIR);
      const now = Date.now();

      for (const file of files) {
        if (!file.endsWith(".json")) continue;

        const filePath = path.join(CACHE_DIR, file);
        try {
          const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
          if (data.expiresAt < now) {
            fs.unlinkSync(filePath);
          }
        } catch {
          // Remove corrupted files
          fs.unlinkSync(filePath);
        }
      }
    } catch {
      // Ignore cleanup errors
    }
  }

  set(id: string, entry: PreviewEntry) {
    ensureCacheDir();
    const filePath = getFilePath(id);
    fs.writeFileSync(filePath, JSON.stringify(entry), "utf-8");
  }

  get(id: string): PreviewEntry | undefined {
    const filePath = getFilePath(id);

    if (!fs.existsSync(filePath)) {
      return undefined;
    }

    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as PreviewEntry;

      // Check if expired
      if (data.expiresAt < Date.now()) {
        fs.unlinkSync(filePath);
        return undefined;
      }

      return data;
    } catch {
      return undefined;
    }
  }

  delete(id: string) {
    const filePath = getFilePath(id);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  has(id: string): boolean {
    return this.get(id) !== undefined;
  }
}

// Singleton instance
export const previewStore = new PreviewStore();
