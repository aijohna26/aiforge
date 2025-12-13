# Market Research Agent - Setup Guide

## Overview

The Market Research Agent is the first step in AppForge's product development pipeline. It analyzes app ideas, researches competitors, and generates comprehensive market reports with actionable insights.

---

## Prerequisites

1. **Tavily API Key** (required for web search)
   - Sign up at https://tavily.com
   - Get your API key from the dashboard

2. **Supabase Database** (for storing reports)
   - Run the migration: `supabase/migrations/20241204_research_reports.sql`

---

## Environment Variables

Add to your `.env.local`:

```bash
# Market Research Agent
TAVILY_API_KEY=tvly-xxxxxxxxxxxxx
```

---

## Database Migration

Run the migration to create the `research_reports` table:

```bash
# If using Supabase CLI
supabase db push

# Or apply manually in Supabase dashboard
```

---

## Usage

### API Endpoint

```typescript
POST /api/research
Body: { appIdea: string }

Response (Server-Sent Events):
{
  type: "progress",
  stage: "searching" | "analyzing" | "generating",
  message: string,
  progress: number // 0-100
}

{
  type: "complete",
  report: ResearchReport
}
```

### Example

```typescript
const response = await fetch('/api/research', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ appIdea: 'Fitness tracking app for runners' })
});

const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const text = new TextDecoder().decode(value);
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      
      if (data.type === 'progress') {
        console.log(`${data.message} (${data.progress}%)`);
      } else if (data.type === 'complete') {
        console.log('Report:', data.report);
      }
    }
  }
}
```

---

## Research Report Structure

```typescript
interface ResearchReport {
  id: string;
  appIdea: string;
  opportunityScore: number; // 0-10
  summary: string;
  
  marketAnalysis: {
    marketSize: string;
    growthRate: string;
    targetAudience: string;
    trends: string[];
  };
  
  competitors: Array<{
    name: string;
    rating: number;
    reviewCount: number;
    strengths: string[];
    weaknesses: string[];
    keyFeatures: string[];
  }>;
  
  gapAnalysis: {
    unmetNeeds: string[];
    opportunities: string[];
    differentiationStrategies: string[];
  };
  
  monetization: {
    commonModels: string[];
    averagePricing: string;
    userWillingnessToPay: string;
  };
  
  risks: {
    saturationLevel: 'low' | 'medium' | 'high';
    barriersToEntry: string[];
    regulatoryConsiderations: string[];
  };
  
  recommendations: {
    uniqueValueProposition: string;
    mustHaveFeatures: string[];
    goToMarketStrategy: string;
  };
  
  images: Array<{
    url: string;
    caption: string;
    type: 'screenshot' | 'chart' | 'diagram';
  }>;
  
  createdAt: Date;
}
```

---

## Architecture

The Research Agent uses a multi-stage pipeline:

1. **Search Stage** (0-30%)
   - Searches web for competitors using Tavily
   - Finds app store data
   - Collects user reviews

2. **Analysis Stage** (30-60%)
   - Analyzes market trends
   - Identifies gaps and opportunities
   - Evaluates monetization potential

3. **Generation Stage** (60-100%)
   - Synthesizes findings
   - Generates structured report
   - Calculates opportunity score

---

## Next Steps

After generating a research report, users can:

1. **Proceed to Step 2**: Requirements & Feature Definition
2. **Refine Idea**: Adjust based on insights and re-research
3. **Save for Later**: Store report for future reference

---

## Cost Estimation

Per research report:
- Tavily API: ~$0.10
- AI Provider (Claude): ~$0.50
- **Total: ~$0.60 per report**

---

## Troubleshooting

### "TAVILY_API_KEY environment variable is required"
- Make sure you've added `TAVILY_API_KEY` to `.env.local`
- Restart your dev server after adding env vars

### "Failed to generate research report"
- Check Tavily API key is valid
- Ensure AI provider (Claude/OpenAI) is configured
- Check logs for specific error messages

### Research takes too long
- Normal research time: 30-60 seconds
- If >2 minutes, check network connection
- Verify Tavily API rate limits

