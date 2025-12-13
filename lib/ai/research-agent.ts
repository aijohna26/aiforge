// Market Research Agent
// Orchestrates multi-LLM research pipeline for app idea validation

import { getSearchProvider, type SearchResult, type AppStoreData } from './search-provider';
import { getAIProvider } from './factory';

export interface ResearchRequest {
    appIdea: string;
    userId: string;
}

export interface MarketAnalysis {
    marketSize: string;
    growthRate: string;
    targetAudience: string;
    trends: string[];
}

export interface Competitor {
    name: string;
    appId: string;
    platform: 'ios' | 'android';
    rating: number;
    reviewCount: number;
    price: number;
    screenshots: string[];
    strengths: string[];
    weaknesses: string[];
    keyFeatures: string[];
}

export interface GapAnalysis {
    unmetNeeds: string[];
    opportunities: string[];
    differentiationStrategies: string[];
}

export interface MonetizationInsights {
    commonModels: string[];
    averagePricing: string;
    userWillingnessToPay: string;
}

export interface RiskAssessment {
    saturationLevel: 'low' | 'medium' | 'high';
    barriersToEntry: string[];
    regulatoryConsiderations: string[];
}

export interface Recommendations {
    uniqueValueProposition: string;
    mustHaveFeatures: string[];
    goToMarketStrategy: string;
}

export interface ReportImage {
    url: string;
    caption: string;
    type: 'screenshot' | 'chart' | 'diagram';
}

export interface ResearchReport {
    id: string;
    appIdea: string;
    opportunityScore: number; // 0-10
    summary: string;
    marketAnalysis: MarketAnalysis;
    competitors: Competitor[];
    gapAnalysis: GapAnalysis;
    monetization: MonetizationInsights;
    risks: RiskAssessment;
    recommendations: Recommendations;
    images: ReportImage[];
    createdAt: Date;
}

export interface ResearchProgress {
    stage: 'searching' | 'analyzing' | 'generating';
    message: string;
    progress: number; // 0-100
}

export class ResearchAgent {
    private searchProvider = getSearchProvider();
    private aiProvider = getAIProvider();

    async conductResearch(
        request: ResearchRequest,
        onProgress?: (progress: ResearchProgress) => void
    ): Promise<ResearchReport> {
        const reportId = crypto.randomUUID();

        try {
            // Stage 1: Search for competitors (0-30%)
            onProgress?.({
                stage: 'searching',
                message: 'Searching for competitors and market data...',
                progress: 10,
            });

            const competitors = await this.searchCompetitors(request.appIdea);

            onProgress?.({
                stage: 'searching',
                message: `Found ${competitors.length} competitors`,
                progress: 30,
            });

            // Stage 2: Analyze market (30-60%)
            onProgress?.({
                stage: 'analyzing',
                message: 'Analyzing market trends and opportunities...',
                progress: 40,
            });

            const marketAnalysis = await this.analyzeMarket(request.appIdea, competitors);

            onProgress?.({
                stage: 'analyzing',
                message: 'Identifying gaps and opportunities...',
                progress: 60,
            });

            // Stage 3: Generate report (60-100%)
            onProgress?.({
                stage: 'generating',
                message: 'Generating comprehensive report...',
                progress: 80,
            });

            const report = await this.generateReport({
                id: reportId,
                appIdea: request.appIdea,
                competitors,
                marketAnalysis,
            });

            onProgress?.({
                stage: 'generating',
                message: 'Report complete!',
                progress: 100,
            });

            return report;
        } catch (error) {
            console.error('[ResearchAgent] Error:', error);
            throw error;
        }
    }

    private async searchCompetitors(appIdea: string): Promise<Competitor[]> {
        // Search for competitor apps
        const searchQuery = `${appIdea} mobile app competitors features reviews`;
        const searchResults = await this.searchProvider.search(searchQuery, {
            maxResults: 10,
            searchDepth: 'advanced',
        });

        // Extract app store data
        const iosApps = await this.searchProvider.searchAppStore(appIdea, 'ios');
        const androidApps = await this.searchProvider.searchAppStore(appIdea, 'android');

        // Use AI to analyze and structure competitor data
        const competitorAnalysis = await this.analyzeCompetitorData(
            searchResults,
            [...iosApps, ...androidApps]
        );

        return competitorAnalysis.slice(0, 5); // Top 5 competitors
    }

    private async analyzeCompetitorData(
        searchResults: SearchResult[],
        appStoreData: AppStoreData[]
    ): Promise<Competitor[]> {
        const prompt = `Analyze these competitor apps and extract structured data:

Search Results:
${searchResults.map(r => `- ${r.title}: ${r.snippet}`).join('\n')}

App Store Data:
${appStoreData.map(app => `- ${app.name} (${app.rating}⭐, ${app.reviewCount} reviews): ${app.description}`).join('\n')}

For each competitor, identify:
1. Key strengths (what they do well)
2. Key weaknesses (common user complaints)
3. Core features
4. Pricing model

Return as JSON array of competitors.`;

        const response = await this.aiProvider.generateText({
            prompt,
            systemPrompt: 'You are a market research analyst. Extract structured competitor data.',
            maxTokens: 4000,
        });

        // Parse AI response into Competitor objects
        try {
            const parsed = JSON.parse(response);
            return parsed.map((comp: any, index: number) => ({
                name: comp.name || `Competitor ${index + 1}`,
                appId: appStoreData[index]?.appId || '',
                platform: (appStoreData[index] ? 'ios' : 'android') as 'ios' | 'android',
                rating: comp.rating || appStoreData[index]?.rating || 0,
                reviewCount: comp.reviewCount || appStoreData[index]?.reviewCount || 0,
                price: comp.price || appStoreData[index]?.price || 0,
                screenshots: appStoreData[index]?.screenshots || [],
                strengths: comp.strengths || [],
                weaknesses: comp.weaknesses || [],
                keyFeatures: comp.features || appStoreData[index]?.features || [],
            }));
        } catch (error) {
            console.error('[ResearchAgent] Failed to parse competitor data:', error);
            return [];
        }
    }

    private async analyzeMarket(
        appIdea: string,
        competitors: Competitor[]
    ): Promise<MarketAnalysis> {
        const prompt = `Analyze the market for this app idea: "${appIdea}"

Competitors found:
${competitors.map(c => `- ${c.name} (${c.rating}⭐, ${c.reviewCount} reviews)`).join('\n')}

Provide:
1. Estimated market size and growth rate
2. Target audience demographics
3. Current market trends
4. Market saturation level

Return as JSON.`;

        const response = await this.aiProvider.generateText({
            prompt,
            systemPrompt: 'You are a market research analyst specializing in mobile apps.',
            maxTokens: 2000,
        });

        try {
            return JSON.parse(response);
        } catch (error) {
            console.error('[ResearchAgent] Failed to parse market analysis:', error);
            return {
                marketSize: 'Unknown',
                growthRate: 'Unknown',
                targetAudience: 'Unknown',
                trends: [],
            };
        }
    }

    private async generateReport(data: {
        id: string;
        appIdea: string;
        competitors: Competitor[];
        marketAnalysis: MarketAnalysis;
    }): Promise<ResearchReport> {
        const prompt = `Generate a comprehensive market research report for: "${data.appIdea}"

Market Analysis:
${JSON.stringify(data.marketAnalysis, null, 2)}

Competitors (${data.competitors.length}):
${data.competitors.map(c => `- ${c.name}: ${c.strengths.join(', ')}`).join('\n')}

Provide:
1. Opportunity score (0-10)
2. Executive summary (2-3 sentences)
3. Gap analysis (unmet needs, opportunities)
4. Monetization insights
5. Risk assessment
6. Recommendations (unique value prop, must-have features, go-to-market)

Return as JSON matching the ResearchReport structure.`;

        const response = await this.aiProvider.generateText({
            prompt,
            systemPrompt: 'You are a senior product strategist creating market research reports.',
            maxTokens: 4000,
        });

        try {
            const parsed = JSON.parse(response);
            return {
                id: data.id,
                appIdea: data.appIdea,
                opportunityScore: parsed.opportunityScore || 5,
                summary: parsed.summary || '',
                marketAnalysis: data.marketAnalysis,
                competitors: data.competitors,
                gapAnalysis: parsed.gapAnalysis || { unmetNeeds: [], opportunities: [], differentiationStrategies: [] },
                monetization: parsed.monetization || { commonModels: [], averagePricing: '', userWillingnessToPay: '' },
                risks: parsed.risks || { saturationLevel: 'medium', barriersToEntry: [], regulatoryConsiderations: [] },
                recommendations: parsed.recommendations || { uniqueValueProposition: '', mustHaveFeatures: [], goToMarketStrategy: '' },
                images: [], // TODO: Add screenshot capture
                createdAt: new Date(),
            };
        } catch (error) {
            console.error('[ResearchAgent] Failed to parse report:', error);
            throw new Error('Failed to generate research report');
        }
    }
}

// Singleton instance
export const researchAgent = new ResearchAgent();
