// Bundle cache for storing project bundles
// In production, this should be Redis or similar

interface BundleData {
    html: string;
    timestamp: number;
    ttl: number; // Time to live in ms
}

class BundleCache {
    private cache = new Map<string, BundleData>();
    private readonly DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes

    set(projectId: string, html: string, ttl: number = this.DEFAULT_TTL) {
        this.cache.set(projectId, {
            html,
            timestamp: Date.now(),
            ttl,
        });

        // Clean up expired bundles
        this.cleanup();
    }

    get(projectId: string): string | null {
        const data = this.cache.get(projectId);

        if (!data) {
            return null;
        }

        // Check if expired
        if (Date.now() - data.timestamp > data.ttl) {
            this.cache.delete(projectId);
            return null;
        }

        return data.html;
    }

    delete(projectId: string) {
        this.cache.delete(projectId);
    }

    private cleanup() {
        const now = Date.now();
        for (const [projectId, data] of this.cache.entries()) {
            if (now - data.timestamp > data.ttl) {
                this.cache.delete(projectId);
            }
        }
    }

    getStats() {
        return {
            size: this.cache.size,
            projects: Array.from(this.cache.keys()),
        };
    }
}

export const bundleCache = new BundleCache();
