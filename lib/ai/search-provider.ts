// Search Provider Interface for Market Research Agent
// Supports multiple search APIs (Tavily, Perplexity, SerpAPI)

export interface SearchResult {
    title: string;
    url: string;
    snippet: string;
    publishedDate?: string;
    score?: number;
}

export interface ImageResult {
    url: string;
    title: string;
    source: string;
    width?: number;
    height?: number;
}

export interface AppStoreData {
    appId: string;
    name: string;
    developer: string;
    rating: number;
    reviewCount: number;
    price: number;
    category: string;
    description: string;
    screenshots: string[];
    features: string[];
}

export interface SearchProvider {
    search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
    searchImages(query: string): Promise<ImageResult[]>;
    searchAppStore(query: string, platform: 'ios' | 'android'): Promise<AppStoreData[]>;
}

export interface SearchOptions {
    maxResults?: number;
    includeImages?: boolean;
    searchDepth?: 'basic' | 'advanced';
    dateRange?: 'day' | 'week' | 'month' | 'year' | 'all';
}

// Tavily Search Provider (Best for research)
class TavilySearchProvider implements SearchProvider {
    private apiKey: string;
    private baseUrl = 'https://api.tavily.com';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
        const response = await fetch(`${this.baseUrl}/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                api_key: this.apiKey,
                query,
                search_depth: options.searchDepth || 'advanced',
                max_results: options.maxResults || 10,
                include_images: options.includeImages || false,
            }),
        });

        if (!response.ok) {
            throw new Error(`Tavily search failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.results.map((result: any) => ({
            title: result.title,
            url: result.url,
            snippet: result.content,
            publishedDate: result.published_date,
            score: result.score,
        }));
    }

    async searchImages(query: string): Promise<ImageResult[]> {
        const response = await fetch(`${this.baseUrl}/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                api_key: this.apiKey,
                query,
                search_depth: 'basic',
                include_images: true,
                max_results: 5,
            }),
        });

        if (!response.ok) {
            throw new Error(`Tavily image search failed: ${response.statusText}`);
        }

        const data = await response.json();
        return (data.images || []).map((img: any) => ({
            url: img.url,
            title: img.description || query,
            source: img.source || '',
        }));
    }

    async searchAppStore(query: string, platform: 'ios' | 'android'): Promise<AppStoreData[]> {
        // Use web search to find app store pages
        const searchQuery = `${query} ${platform === 'ios' ? 'app store' : 'google play'} app`;
        const results = await this.search(searchQuery, { maxResults: 5 });

        // Filter for app store URLs
        const appStoreUrls = results.filter(r =>
            platform === 'ios'
                ? r.url.includes('apps.apple.com')
                : r.url.includes('play.google.com')
        );

        // TODO: Scrape app store data from URLs
        // For now, return basic data from search results
        return appStoreUrls.map(result => ({
            appId: this.extractAppId(result.url, platform),
            name: result.title.split('-')[0].trim(),
            developer: '',
            rating: 0,
            reviewCount: 0,
            price: 0,
            category: '',
            description: result.snippet,
            screenshots: [],
            features: [],
        }));
    }

    private extractAppId(url: string, platform: 'ios' | 'android'): string {
        if (platform === 'ios') {
            const match = url.match(/id(\d+)/);
            return match ? match[1] : '';
        } else {
            const match = url.match(/id=([^&]+)/);
            return match ? match[1] : '';
        }
    }
}

// Factory function to get search provider
export function getSearchProvider(): SearchProvider {
    const tavilyKey = process.env.TAVILY_API_KEY;

    if (!tavilyKey) {
        throw new Error('TAVILY_API_KEY environment variable is required');
    }

    return new TavilySearchProvider(tavilyKey);
}
