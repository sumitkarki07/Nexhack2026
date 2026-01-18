/**
 * News Search Client
 * Fetches relevant news articles for market research
 */

import { Market } from '@/types';

export interface NewsArticle {
  title: string;
  description: string;
  source: string;
  url: string;
  publishedAt: string;
  relevanceScore: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface NewsSearchResult {
  articles: NewsArticle[];
  searchQuery: string;
  totalResults: number;
  searchedAt: number;
}

// News API configuration
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const NEWS_API_URL = 'https://newsapi.org/v2';

/**
 * Extract search keywords from market question
 */
export function extractSearchTerms(question: string): string[] {
  // Remove common words and extract key terms
  const stopWords = new Set([
    'will', 'the', 'be', 'a', 'an', 'is', 'are', 'was', 'were', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'shall', 'should', 'may', 'might',
    'must', 'can', 'could', 'would', 'of', 'at', 'by', 'for', 'with', 'about',
    'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above',
    'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under',
    'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
    'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
    'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
    'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'this', 'that',
    'these', 'those', 'what', 'which', 'who', 'whom', 'it', 'its', 'they', 'them',
    'their', 'he', 'she', 'him', 'her', 'his', 'hers', 'we', 'us', 'our', 'ours',
    'you', 'your', 'yours', 'i', 'me', 'my', 'mine', 'win', 'lose', 'happen',
    'occur', 'take', 'place', 'become', 'get', 'make', 'go', 'come', 'see', 'know',
    'think', 'say', 'tell', 'ask', 'use', 'find', 'give', 'want', 'need', 'try',
    'leave', 'call', 'feel', 'keep', 'let', 'begin', 'seem', 'help', 'show', 'hear',
    'play', 'run', 'move', 'live', 'believe', 'hold', 'bring', 'happen', 'write',
    'provide', 'sit', 'stand', 'lose', 'pay', 'meet', 'include', 'continue', 'set',
    'learn', 'change', 'lead', 'understand', 'watch', 'follow', 'stop', 'create',
    'speak', 'read', 'allow', 'add', 'spend', 'grow', 'open', 'walk', 'offer', 'yes', 'no'
  ]);

  // Extract words, remove punctuation and filter
  const words = question
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

  // Get unique terms, prioritize proper nouns and numbers
  const uniqueTerms = [...new Set(words)];
  
  // Also extract any quoted phrases or proper nouns from original
  const properNouns = question.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [];
  const numbers = question.match(/\$?\d+(?:,\d{3})*(?:\.\d+)?[kKmMbB]?/g) || [];
  
  return [...new Set([...properNouns, ...numbers, ...uniqueTerms])].slice(0, 5);
}

/**
 * Build search query from market data
 */
export function buildSearchQuery(market: Market): string {
  const terms = extractSearchTerms(market.question);
  
  // Add category context
  const categoryTerms: Record<string, string[]> = {
    politics: ['election', 'political'],
    crypto: ['cryptocurrency', 'bitcoin'],
    sports: ['sports', 'game'],
    economy: ['economic', 'market'],
    world: ['international', 'global'],
  };
  
  const categoryContext = categoryTerms[market.category]?.[0] || '';
  
  // Build query string
  const query = terms.slice(0, 3).join(' ');
  return categoryContext ? `${query} ${categoryContext}` : query;
}

/**
 * Analyze sentiment of text (simple heuristic)
 */
function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const positiveWords = ['gain', 'rise', 'win', 'success', 'growth', 'increase', 'positive', 'bullish', 'rally', 'surge', 'boost', 'improve', 'strong'];
  const negativeWords = ['loss', 'fall', 'lose', 'failure', 'decline', 'decrease', 'negative', 'bearish', 'crash', 'drop', 'risk', 'concern', 'weak', 'fear'];
  
  const lowerText = text.toLowerCase();
  let score = 0;
  
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) score++;
  });
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) score--;
  });
  
  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}

/**
 * Fetch news from NewsAPI.org
 */
async function fetchFromNewsAPI(query: string): Promise<NewsArticle[]> {
  if (!NEWS_API_KEY) {
    console.log('[News] No NEWS_API_KEY configured');
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: query,
      language: 'en',
      sortBy: 'relevancy',
      pageSize: '10',
      apiKey: NEWS_API_KEY,
    });

    const response = await fetch(`${NEWS_API_URL}/everything?${params}`, {
      headers: { 'User-Agent': 'PulseForge/1.0' },
    });

    if (!response.ok) {
      console.error('[News] NewsAPI error:', response.status);
      return [];
    }

    const data = await response.json();
    
    if (!data.articles || !Array.isArray(data.articles)) {
      return [];
    }

    return data.articles
      .filter((article: { url?: string; title?: string }) => {
        // Only include articles with valid URLs and titles
        return article.url && 
               article.url.startsWith('http') && 
               article.title && 
               article.title.trim() !== '';
      })
      .map((article: {
        title?: string;
        description?: string;
        source?: { name?: string };
        url?: string;
        publishedAt?: string;
      }, index: number) => ({
        title: article.title || 'Untitled',
        description: article.description || '',
        source: article.source?.name || 'Unknown Source',
        url: article.url || '',
        publishedAt: article.publishedAt || new Date().toISOString(),
        relevanceScore: Math.max(0.5, 1 - index * 0.1),
        sentiment: analyzeSentiment((article.title || '') + ' ' + (article.description || '')),
      }));
  } catch (error) {
    console.error('[News] Fetch error:', error);
    return [];
  }
}

/**
 * Search for news related to a market
 * Only returns real news articles from NewsAPI - no fake/generated news
 */
export async function searchNews(market: Market): Promise<NewsSearchResult> {
  const query = buildSearchQuery(market);
  console.log('[News] Searching for real news:', query);

  // Only fetch from NewsAPI - no fake news fallback
  const articles = await fetchFromNewsAPI(query);

  // Filter out articles without valid URLs
  const validArticles = articles.filter(article => 
    article.url && 
    article.url !== '#' && 
    (article.url.startsWith('http://') || article.url.startsWith('https://'))
  );

  if (validArticles.length === 0 && articles.length > 0) {
    console.warn('[News] All articles filtered out - no valid URLs found');
  }

  if (articles.length === 0) {
    console.log('[News] No news articles found. Please configure NEWS_API_KEY to get real news sources.');
  } else {
    console.log(`[News] Found ${validArticles.length} valid news articles with real sources`);
  }

  return {
    articles: validArticles.slice(0, 10), // Return up to 10 articles
    searchQuery: query,
    totalResults: validArticles.length,
    searchedAt: Date.now(),
  };
}

/**
 * Get news summary for AI prompt enhancement
 */
export function formatNewsForPrompt(news: NewsSearchResult): string {
  if (news.articles.length === 0) {
    return 'No recent news articles found.';
  }

  const summaries = news.articles.slice(0, 3).map((article, i) => 
    `${i + 1}. "${article.title}" (${article.source}, ${new Date(article.publishedAt).toLocaleDateString()}) - Sentiment: ${article.sentiment}`
  );

  return `Recent relevant news:\n${summaries.join('\n')}`;
}
