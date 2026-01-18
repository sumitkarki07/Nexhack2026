import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fetchMarketDetail, fetchMarketHistory, getPolymarketUrl } from '@/lib/polymarket/client';
import { searchNews, formatNewsForPrompt, NewsArticle, NewsSearchResult } from '@/lib/news';
import { verifyMarketResearch, VerificationResult } from '@/lib/seda';
import { Market, PricePoint } from '@/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Allow up to 30 seconds for AI processing

const requestSchema = z.object({
  marketId: z.string(),
  market: z.object({
    id: z.string(),
    question: z.string(),
    category: z.string(),
    outcomes: z.array(z.object({
      price: z.number(),
      name: z.string(),
    })),
    volume: z.number().optional(),
    liquidity: z.number().optional(),
    endDate: z.string(),
    slug: z.string().optional(),
    description: z.string().optional(),
  }).optional(), // Allow passing market data to avoid refetch
});

interface ResearchResult {
  summary: string;
  whatIsThisBet: string;
  keyPoints: string[];
  riskLevel: 'low' | 'medium' | 'high';
  riskExplanation: string;
  confidence: number;
  confidenceExplanation: string;
  sources: { name: string; type: string; url?: string }[];
  prosAndCons: {
    pros: string[];
    cons: string[];
  };
  keyDates: string[];
  marketSentiment: string;
  recommendation: string;
  beginnerExplanation: string;
  newsArticles: NewsArticle[];
  newsSummary: string;
}

/**
 * Build a comprehensive prompt for Gemini to analyze the market
 */
function buildResearchPrompt(market: Market, priceHistory: PricePoint[], newsResult: NewsSearchResult): string {
  const yesPrice = market.outcomes[0]?.price || 0.5;
  const noPrice = market.outcomes[1]?.price || 0.5;
  const priceChange = market.outcomes[0]?.priceChange24h || 0;
  
  // Calculate price trend from history
  let trendDescription = 'stable';
  if (priceHistory.length >= 2) {
    const oldPrice = priceHistory[0].price;
    const newPrice = priceHistory[priceHistory.length - 1].price;
    const change = newPrice - oldPrice;
    if (change > 0.05) trendDescription = 'trending up significantly';
    else if (change > 0.02) trendDescription = 'trending up slightly';
    else if (change < -0.05) trendDescription = 'trending down significantly';
    else if (change < -0.02) trendDescription = 'trending down slightly';
  }

  const daysToEnd = Math.max(0, Math.ceil((new Date(market.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return `You are a prediction market research analyst helping users understand betting markets. Analyze the following market and provide comprehensive research.

MARKET INFORMATION:
- Question: "${market.question}"
- Category: ${market.category}
- Current YES Price: ${(yesPrice * 100).toFixed(1)}% (meaning the market thinks there's a ${(yesPrice * 100).toFixed(0)}% chance of YES)
- Current NO Price: ${(noPrice * 100).toFixed(1)}%
- 24h Price Change: ${priceChange > 0 ? '+' : ''}${(priceChange * 100).toFixed(1)}%
- Price Trend: ${trendDescription}
- Trading Volume: $${market.volume?.toLocaleString() || 'Unknown'}
- Liquidity: $${market.liquidity?.toLocaleString() || 'Unknown'}
- Days Until Resolution: ${daysToEnd}
- End Date: ${new Date(market.endDate).toLocaleDateString()}
${market.description ? `- Description: ${market.description}` : ''}

RECENT NEWS & CONTEXT:
${formatNewsForPrompt(newsResult)}

Provide your analysis in the following JSON format (respond ONLY with valid JSON, no markdown):

{
  "summary": "A 2-3 sentence overview of this market and its current state",
  "whatIsThisBet": "Explain in simple terms what this bet is about, as if explaining to someone who has never heard of prediction markets",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3", "Key point 4"],
  "riskLevel": "low" | "medium" | "high",
  "riskExplanation": "Why this risk level - consider odds, time to resolution, and market factors",
  "confidence": 0-100,
  "confidenceExplanation": "Explanation of confidence in this analysis",
  "prosAndCons": {
    "pros": ["Reason to consider betting YES", "Another reason", "Third reason"],
    "cons": ["Risk or reason for caution", "Another risk", "Third concern"]
  },
  "keyDates": ["Important date 1 and why", "Important date 2 and why"],
  "marketSentiment": "Describe what the current price tells us about market sentiment",
  "recommendation": "Balanced advice for someone considering this market - not financial advice, but educational guidance",
  "beginnerExplanation": "A very simple 1-2 sentence explanation a complete beginner could understand"
}

Important guidelines:
- Be objective and balanced
- Don't provide financial advice, but educate
- Consider both sides of the outcome
- Highlight key risks
- Make it accessible to beginners
- Base analysis on the market data provided`;
}

/**
 * Parse Gemini response into structured result
 */
function parseGeminiResponse(text: string, market: Market, newsResult: NewsSearchResult): ResearchResult {
  // Try to extract JSON from response
  let jsonText = text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonText = jsonMatch[0];
  }

  try {
    const parsed = JSON.parse(jsonText);
    
    // Build sources list including news
    const sources = [
      { name: 'Polymarket Live Data', type: 'market', url: getPolymarketUrl(market) },
      { name: 'Price History Analysis', type: 'analysis' },
      { name: 'AI Market Analysis', type: 'ai' },
    ];
    
    // Add news sources
    newsResult.articles.slice(0, 3).forEach(article => {
      sources.push({ name: article.source, type: 'news', url: article.url });
    });

    return {
      summary: parsed.summary || 'Analysis not available',
      whatIsThisBet: parsed.whatIsThisBet || `This market asks: "${market.question}"`,
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
      riskLevel: ['low', 'medium', 'high'].includes(parsed.riskLevel) ? parsed.riskLevel : 'medium',
      riskExplanation: parsed.riskExplanation || 'Risk assessment not available',
      confidence: typeof parsed.confidence === 'number' ? Math.min(100, Math.max(0, parsed.confidence)) : 50,
      confidenceExplanation: parsed.confidenceExplanation || 'Confidence based on available data',
      sources,
      prosAndCons: {
        pros: Array.isArray(parsed.prosAndCons?.pros) ? parsed.prosAndCons.pros : [],
        cons: Array.isArray(parsed.prosAndCons?.cons) ? parsed.prosAndCons.cons : [],
      },
      keyDates: Array.isArray(parsed.keyDates) ? parsed.keyDates : [],
      marketSentiment: parsed.marketSentiment || 'Sentiment analysis not available',
      recommendation: parsed.recommendation || 'Do your own research before making any decisions',
      beginnerExplanation: parsed.beginnerExplanation || `This is a prediction market about: ${market.question}`,
      newsArticles: newsResult.articles,
      newsSummary: newsResult.articles.length > 0 
        ? `Found ${newsResult.articles.length} relevant news articles about this topic.`
        : 'No recent news articles found.',
    };
  } catch (error) {
    console.error('[Research] Failed to parse Gemini response:', error);
    // Return fallback result
    return generateFallbackResult(market, newsResult);
  }
}

/**
 * Generate fallback result when AI is unavailable
 */
function generateFallbackResult(market: Market, newsResult?: NewsSearchResult): ResearchResult {
  const yesPrice = market.outcomes[0]?.price || 0.5;
  const daysToEnd = Math.max(0, Math.ceil((new Date(market.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  
  // Build sources including news
  const sources = [
    { name: 'Polymarket Live Data', type: 'market', url: getPolymarketUrl(market) },
    { name: 'Price History', type: 'analysis' },
  ];
  
  if (newsResult) {
    newsResult.articles.slice(0, 3).forEach(article => {
      sources.push({ name: article.source, type: 'news', url: article.url });
    });
  }
  
  return {
    summary: `This market asks "${market.question}" and is currently priced at ${(yesPrice * 100).toFixed(0)}% YES. The market has $${(market.volume || 0).toLocaleString()} in trading volume.`,
    whatIsThisBet: `You're betting on whether "${market.question}" will happen. If you buy YES and it happens, you win. If you buy NO and it doesn't happen, you win.`,
    keyPoints: [
      `Current market price: ${(yesPrice * 100).toFixed(0)}% chance of YES`,
      `Trading volume: $${(market.volume || 0).toLocaleString()}`,
      `Resolution in ${daysToEnd} days`,
      `Category: ${market.category}`,
    ],
    riskLevel: yesPrice > 0.8 || yesPrice < 0.2 ? 'high' : yesPrice > 0.65 || yesPrice < 0.35 ? 'medium' : 'low',
    riskExplanation: yesPrice > 0.8 || yesPrice < 0.2 
      ? 'Extreme odds mean limited upside potential and higher risk of unexpected outcomes'
      : 'Moderate odds suggest reasonable uncertainty in the outcome',
    confidence: 60,
    confidenceExplanation: 'Based on market data analysis without AI enhancement',
    sources,
    prosAndCons: {
      pros: [
        market.volume > 50000 ? 'High liquidity - easy to enter and exit positions' : 'Growing market interest',
        'Clear resolution criteria',
        'Active trading indicates market efficiency',
      ],
      cons: [
        'Prediction markets carry inherent risk',
        'External events could shift odds rapidly',
        'Past performance doesn\'t guarantee future results',
      ],
    },
    keyDates: [
      `Resolution date: ${new Date(market.endDate).toLocaleDateString()}`,
    ],
    marketSentiment: `The market currently favors ${yesPrice > 0.5 ? 'YES' : 'NO'} at ${(Math.max(yesPrice, 1 - yesPrice) * 100).toFixed(0)}%`,
    recommendation: 'Always do your own research and never bet more than you can afford to lose. Consider the time value of money and opportunity cost.',
    beginnerExplanation: `People are betting on whether "${market.question}" - currently ${(yesPrice * 100).toFixed(0)}% think it will happen.`,
    newsArticles: newsResult?.articles || [],
    newsSummary: newsResult && newsResult.articles.length > 0 
      ? `Found ${newsResult.articles.length} relevant news articles about this topic.`
      : 'No recent news articles found.',
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // More lenient parsing - catch schema errors but continue
    let marketId: string;
    let providedMarket: any = undefined;
    
    try {
      const parsed = requestSchema.parse(body);
      marketId = parsed.marketId;
      providedMarket = parsed.market;
    } catch (schemaError) {
      console.error('[Research] Schema validation error:', schemaError);
      // Fallback: try to get marketId directly
      if (body.marketId) {
        marketId = body.marketId;
        providedMarket = body.market; // Try to use even if schema doesn't match
      } else {
        throw new Error('Missing marketId in request');
      }
    }

    console.log('[Research] Starting research for market:', marketId);

    // Step 1: Use provided market data or fetch from API
    let market: Market | null = null;
    
    // If market data is provided, use it (avoids unnecessary API call)
    if (providedMarket && providedMarket.id && providedMarket.question) {
      try {
        console.log('[Research] Using provided market data');
        market = {
          id: providedMarket.id || marketId,
          question: providedMarket.question,
          category: providedMarket.category || 'other',
          outcomes: Array.isArray(providedMarket.outcomes) 
            ? providedMarket.outcomes.map((o: any, i: number) => ({
                id: o.id || `${providedMarket.id || marketId}-${i}`,
                name: o.name || (i === 0 ? 'Yes' : 'No'),
                price: typeof o.price === 'number' ? o.price : 0.5,
                priceChange24h: o.priceChange24h || 0,
              }))
            : [
                { id: `${providedMarket.id || marketId}-0`, name: 'Yes', price: 0.5, priceChange24h: 0 },
                { id: `${providedMarket.id || marketId}-1`, name: 'No', price: 0.5, priceChange24h: 0 },
              ],
          volume: typeof providedMarket.volume === 'number' ? providedMarket.volume : 0,
          liquidity: typeof providedMarket.liquidity === 'number' ? providedMarket.liquidity : 0,
          endDate: providedMarket.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          slug: providedMarket.slug || '',
          description: providedMarket.description || '',
          active: providedMarket.active !== undefined ? providedMarket.active : true,
          closed: providedMarket.closed !== undefined ? providedMarket.closed : false,
          resolved: providedMarket.resolved !== undefined ? providedMarket.resolved : false,
          createdAt: providedMarket.createdAt || new Date().toISOString(),
          updatedAt: providedMarket.updatedAt || new Date().toISOString(),
        };
        console.log('[Research] Successfully transformed provided market data');
      } catch (transformError) {
        console.error('[Research] Failed to transform provided market data:', transformError);
        // Fall through to fetch from API
        market = null;
      }
    }
    
    if (!market) {
      // Try to fetch from API
      try {
        market = await fetchMarketDetail(marketId);
      } catch (error) {
        console.error('[Research] Failed to fetch market detail:', error);
        // Continue with error - we'll handle it below
      }

      if (!market) {
        console.error('[Research] Market not found:', marketId);
        return NextResponse.json(
          { 
            success: false,
            error: `Unable to fetch live data for this market. The market may no longer exist or the API is temporarily unavailable. Please try again later.`,
            message: 'Market not found or unavailable'
          },
          { status: 404 }
        );
      }
    }
    
    if (!market) {
      console.error('[Research] No market data available after all attempts');
      return NextResponse.json(
        { 
          success: false,
          error: `Unable to process research for this market. Please ensure the market exists and try again.`,
          message: 'Market data unavailable'
        },
        { status: 400 }
      );
    }

    // Step 2: Fetch price history (continue even if it fails)
    let priceHistory: PricePoint[] = [];
    try {
      priceHistory = await fetchMarketHistory(marketId, '7D');
      console.log(`[Research] Fetched ${priceHistory.length} price history points`);
    } catch (error) {
      console.error('[Research] Failed to fetch price history:', error);
      // Continue without price history - it's not critical
      priceHistory = [];
    }

    // Step 3: Search for relevant news (continue even if it fails)
    console.log('[Research] Searching for relevant news...');
    let newsResult: NewsSearchResult;
    try {
      newsResult = await searchNews(market);
      console.log(`[Research] Found ${newsResult.articles.length} news articles`);
    } catch (error) {
      console.error('[Research] Failed to search news:', error);
      // Continue with empty news results
      newsResult = { articles: [], query: market.question, totalResults: 0 };
    }

    // Step 4: Generate AI analysis
    let result: ResearchResult;

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        console.log('[Research] Generating AI analysis with Gemini...');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = buildResearchPrompt(market, priceHistory, newsResult);
        const genResult = await model.generateContent(prompt);
        const response = await genResult.response;
        const text = response.text();

        result = parseGeminiResponse(text, market, newsResult);
        console.log('[Research] AI analysis complete');
      } catch (aiError) {
        console.error('[Research] AI analysis failed:', aiError);
        result = generateFallbackResult(market, newsResult);
      }
    } else {
      console.log('[Research] No API key, using fallback analysis');
      result = generateFallbackResult(market, newsResult);
    }

    // Step 5: Run Seda verification (continue even if it fails)
    console.log('[Research] Running Seda verification...');
    let verification: VerificationResult;
    try {
      verification = await verifyMarketResearch(market, newsResult.articles);
      console.log(`[Research] Verification complete: ${verification.overallStatus}`);
    } catch (error) {
      console.error('[Research] Failed to verify:', error);
      // Continue with unverified status
      verification = {
        overallStatus: 'unverified',
        verifiedSources: [],
        flaggedClaims: [],
        summary: 'Verification unavailable',
      };
    }

    return NextResponse.json({
      success: true,
      market: {
        id: market.id,
        question: market.question,
        category: market.category,
        yesPrice: market.outcomes[0]?.price || 0.5,
        noPrice: market.outcomes[1]?.price || 0.5,
        volume: market.volume,
        liquidity: market.liquidity,
        endDate: market.endDate,
        slug: market.slug,
      },
      research: result,
      verification,
      generatedAt: Date.now(),
    });
  } catch (error) {
    console.error('[Research] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate research', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
