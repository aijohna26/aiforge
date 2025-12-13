/**
 * File Tracker - Tracks which files the AI and user have accessed
 * Uses LRU (Least Recently Used) strategy to determine most relevant files
 */

import { PREWARM_PATHS, isPrewarmPath } from './prewarmPaths';

export interface FileAccess {
  path: string;
  timestamp: number;
  type: 'read' | 'write' | 'edit';
  source: 'ai' | 'user';
  priority: number; // Higher = more important
}

export class FileTracker {
  private accessLog: Map<string, FileAccess> = new Map();
  private maxFiles: number;
  private maxCacheAge: number; // milliseconds

  constructor(options: { maxFiles?: number; maxCacheAge?: number } = {}) {
    this.maxFiles = options.maxFiles || 16;
    this.maxCacheAge = options.maxCacheAge || 60 * 60 * 1000; // 1 hour default
  }

  /**
   * Record file access
   */
  recordAccess(access: Omit<FileAccess, 'timestamp' | 'priority'>): void {
    const priority = this.calculatePriority(access);

    this.accessLog.set(access.path, {
      ...access,
      timestamp: Date.now(),
      priority,
    });
  }

  /**
   * Calculate priority for a file access
   * Higher priority = more likely to be included in context
   */
  private calculatePriority(access: Omit<FileAccess, 'timestamp' | 'priority'>): number {
    let priority = 0;

    // Base priority by type
    if (access.type === 'write') priority += 30;
    else if (access.type === 'edit') priority += 20;
    else if (access.type === 'read') priority += 10;

    // Source priority
    if (access.source === 'ai') priority += 15;
    else if (access.source === 'user') priority += 25;

    // Prewarm paths get highest priority
    if (isPrewarmPath(access.path)) priority += 100;

    return priority;
  }

  /**
   * Get most relevant files for context
   * Priority order:
   * 1. Prewarm paths (always included)
   * 2. Recently written by AI or user
   * 3. Recently edited by user
   * 4. Recently read by AI
   */
  getRelevantFiles(allPaths: string[]): string[] {
    // Clean up old entries
    this.cleanup();

    // Always include prewarm paths that exist
    const prewarmFiles = PREWARM_PATHS.filter(prewarmPath =>
      allPaths.some(path => path.endsWith(prewarmPath))
    );

    // Get all other accessed files
    const accessedFiles = Array.from(this.accessLog.entries())
      .filter(([path]) => !isPrewarmPath(path))
      .map(([path, access]) => ({ path, ...access }));

    // Sort by priority (descending) then by timestamp (recent first)
    accessedFiles.sort((a, b) => {
      // First by priority
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      // Then by recency
      return b.timestamp - a.timestamp;
    });

    // Take top files up to max (minus prewarm files)
    const remaining = this.maxFiles - prewarmFiles.length;
    const topFiles = accessedFiles
      .slice(0, remaining)
      .map(access => access.path);

    return [...prewarmFiles, ...topFiles];
  }

  /**
   * Get file access info
   */
  getAccessInfo(path: string): FileAccess | undefined {
    return this.accessLog.get(path);
  }

  /**
   * Check if file was recently accessed
   */
  wasRecentlyAccessed(path: string, maxAge: number = this.maxCacheAge): boolean {
    const access = this.accessLog.get(path);
    if (!access) return false;

    return Date.now() - access.timestamp < maxAge;
  }

  /**
   * Get all accessed paths
   */
  getAllAccessedPaths(): string[] {
    return Array.from(this.accessLog.keys());
  }

  /**
   * Clear old accesses (older than maxCacheAge)
   */
  cleanup(): void {
    const cutoffTime = Date.now() - this.maxCacheAge;

    for (const [path, access] of this.accessLog.entries()) {
      // Never remove prewarm paths
      if (isPrewarmPath(path)) continue;

      if (access.timestamp < cutoffTime) {
        this.accessLog.delete(path);
      }
    }
  }

  /**
   * Clear all tracked files
   */
  clear(): void {
    this.accessLog.clear();
  }

  /**
   * Get statistics about tracked files
   */
  getStats(): {
    totalTracked: number;
    byType: Record<string, number>;
    bySource: Record<string, number>;
    prewarmCount: number;
  } {
    const accesses = Array.from(this.accessLog.values());

    return {
      totalTracked: accesses.length,
      byType: {
        read: accesses.filter(a => a.type === 'read').length,
        write: accesses.filter(a => a.type === 'write').length,
        edit: accesses.filter(a => a.type === 'edit').length,
      },
      bySource: {
        ai: accesses.filter(a => a.source === 'ai').length,
        user: accesses.filter(a => a.source === 'user').length,
      },
      prewarmCount: accesses.filter(a => isPrewarmPath(a.path)).length,
    };
  }

  /**
   * Export state for debugging
   */
  exportState(): FileAccess[] {
    return Array.from(this.accessLog.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Import state (e.g., from saved session)
   */
  importState(accesses: FileAccess[]): void {
    this.accessLog.clear();
    for (const access of accesses) {
      this.accessLog.set(access.path, access);
    }
  }
}

/**
 * Global file tracker instance per project
 */
const fileTrackers = new Map<string, FileTracker>();

/**
 * Get or create file tracker for a project
 */
export function getFileTracker(projectId: string): FileTracker {
  if (!fileTrackers.has(projectId)) {
    fileTrackers.set(projectId, new FileTracker());
  }
  return fileTrackers.get(projectId)!;
}

/**
 * Remove file tracker for a project (cleanup)
 */
export function removeFileTracker(projectId: string): void {
  fileTrackers.delete(projectId);
}
