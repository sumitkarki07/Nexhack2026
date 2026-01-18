import { NextRequest, NextResponse } from 'next/server';
import { fetchMarketDetail } from '@/lib/polymarket/client';
import { searchNews } from '@/lib/news/client';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const marketId = decodeURIComponent(params.id);

    // Fetch market detail first
    const market = await fetchMarketDetail(marketId);

    if (!market) {
      return NextResponse.json(
        { error: 'Market not found' },
        { status: 404 }
      );
    }

    // Fetch news related to this market
    console.log('[API] Fetching news for market:', market.id, market.question, market.category);
    const newsResult = await searchNews(market);
    console.log('[API] News result:', { 
      articlesCount: newsResult.articles.length, 
      totalResults: newsResult.totalResults,
      searchQuery: newsResult.searchQuery 
    });

    return NextResponse.json({
      market: {
        id: market.id,
        question: market.question,
        category: market.category,
      },
      news: newsResult.articles,
      searchQuery: newsResult.searchQuery,
      totalResults: newsResult.totalResults,
      fetchedAt: Date.now(),
    });
  } catch (error) {
    console.error('[API] Market news error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[API] Error details:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to fetch news', message: errorMessage },
      { status: 500 }
    );
  }
}

