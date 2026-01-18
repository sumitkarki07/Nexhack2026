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

// Perigon API configuration
const PERIGON_API_KEY = process.env.NEWS_API_KEY; // Using NEWS_API_KEY env var for backwards compatibility
const PERIGON_API_URL = 'https://api.perigon.io/v1';

// Credible financial/business news sources that impact markets
const CREDIBLE_SOURCES = new Set([
  // Major financial news
  'bloomberg', 'reuters', 'financial times', 'wall street journal', 'wsj', 'cnbc', 'marketwatch',
  'yahoo finance', 'forbes', 'fortune', 'business insider', 'the economist',
  // Business wires
  'associated press', 'ap news', 'pr newswire', 'business wire',
  // Specialized financial
  'barron\'s', 'morningstar', 'seeking alpha', 'zerohedge', 'the motley fool',
  'financial express', 'livemint', 'mint', 'economic times', 'business standard',
  // Tech business
  'techcrunch', 'the information', 'the verge', 'ars technica',
  // Government/Policy
  'federal reserve', 'sec', 'treasury department', 'white house',
  // International
  'ft.com', 'bbc', 'guardian business', 'ft business', 'afp',
  // Financial domains
  'financialexpress', 'livemint', 'mint', 'bloomberg.com', 'reuters.com', 'wsj.com',
  'cnbc.com', 'marketwatch.com', 'forbes.com', 'fortune.com',
]);

// Keywords that indicate market-moving news
const MARKET_MOVING_KEYWORDS = new Set([
  'earnings', 'revenue', 'profit', 'guidance', 'forecast', 'outlook', 'beat', 'miss',
  'interest rate', 'fed', 'federal reserve', 'inflation', 'cpi', 'gdp', 'unemployment',
  'merger', 'acquisition', 'deal', 'takeover', 'ipo', 'public offering',
  'policy', 'regulation', 'tariff', 'trade war', 'sanctions',
  'ceo', 'executive', 'resignation', 'appointment', 'layoff', 'restructuring',
  'lawsuit', 'settlement', 'fda approval', 'regulatory approval',
  'breakthrough', 'announcement', 'report', 'data', 'metrics',
  'quarterly', 'annual', 'financial results', 'stock', 'share price',
  'dividend', 'buyback', 'split', 'crash', 'rally', 'surge', 'plunge',
]);

// Keywords to exclude (opinion pieces, fluff, rumors)
const EXCLUDE_KEYWORDS = new Set([
  'opinion', 'editorial', 'column', 'guest', 'rumor', 'speculation', 'might', 'could',
  'clickbait', 'viral', 'trending on', 'you won\'t believe', 'shocking',
]);

// Low-quality domains to filter out
const LOW_QUALITY_DOMAINS = new Set([
  'medium.com', 'reddit.com', 'twitter.com', 'facebook.com', 'linkedin.com',
  'quora.com', 'yahoo.com/movies', 'buzzfeed', 'gawker', 'clickhole',
]);

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
  const uniqueTerms = Array.from(new Set(words));
  
  // Also extract any quoted phrases or proper nouns from original
  const properNouns = question.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [];
  const numbers = question.match(/\$?\d+(?:,\d{3})*(?:\.\d+)?[kKmMbB]?/g) || [];
  
  return Array.from(new Set([...properNouns, ...numbers, ...uniqueTerms])).slice(0, 5);
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
 * Check if source is credible
 */
function isCredibleSource(source: string | undefined, domain: string | undefined, categories?: Array<{name: string}>): boolean {
  if (!source && !domain) return false;
  
  const sourceLower = (source || '').toLowerCase();
  const domainLower = (domain || '').toLowerCase();
  
  // Check against low-quality domains first
  const lowQualityArray = Array.from(LOW_QUALITY_DOMAINS);
  for (const lowDomain of lowQualityArray) {
    if (domainLower.includes(lowDomain) || sourceLower.includes(lowDomain)) {
      return false;
    }
  }
  
  // Check if it's a credible source
  const credibleArray = Array.from(CREDIBLE_SOURCES);
  for (const credible of credibleArray) {
    if (sourceLower.includes(credible) || domainLower.includes(credible)) {
      return true;
    }
  }
  
  // If article is categorized as Finance/Business/Economy, allow it (less strict)
  if (categories && Array.isArray(categories)) {
    const categoryNames = categories.map(c => c.name.toLowerCase());
    if (categoryNames.some(cat => 
      cat === 'finance' || cat === 'business' || cat === 'economy' || 
      cat.includes('financial') || cat.includes('economic')
    )) {
      // Allow if it's a legitimate business/finance domain
      if (domainLower.includes('.com') || domainLower.includes('.co.uk') || domainLower.includes('.net')) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Check if article contains market-moving keywords
 */
function hasMarketMovingContent(title: string, description: string): number {
  const text = `${title} ${description}`.toLowerCase();
  
  // Count market-moving keywords
  let score = 0;
  const keywordArray = Array.from(MARKET_MOVING_KEYWORDS);
  for (const keyword of keywordArray) {
    if (text.includes(keyword)) {
      score += 1;
    }
  }
  
  // Check for exclusion keywords
  const excludeArray = Array.from(EXCLUDE_KEYWORDS);
  for (const exclude of excludeArray) {
    if (text.includes(exclude)) {
      return -1; // Exclude if it's opinion/fluff
    }
  }
  
  return score;
}

/**
 * Calculate market impact score (0-1)
 */
function calculateMarketImpactScore(
  article: { 
    title?: string; 
    description?: string; 
    source?: { name?: string; domain?: string };
    categories?: Array<{name: string}>;
  }
): number {
  const title = article.title || '';
  const description = article.description || '';
  const sourceName = article.source?.name || '';
  const domain = article.source?.domain || '';
  const categories = article.categories || [];
  
  let score = 0;
  
  // Source credibility (50% weight) - now more lenient
  if (isCredibleSource(sourceName, domain, categories)) {
    score += 0.5;
  } else {
    return 0; // Only include credible sources
  }
  
  // Market-moving keywords (30% weight)
  const keywordScore = hasMarketMovingContent(title, description);
  if (keywordScore < 0) {
    return 0; // Exclude opinion pieces
  }
  // Even if no keywords, still allow if from credible source (less strict)
  // Give some credit for keyword matches, but don't require them
  if (keywordScore > 0) {
    score += Math.min(0.3, keywordScore * 0.1);
  } else {
    // If no keywords but credible source with Finance/Business category, still allow
    score += 0.1; // Small boost to keep it in results
  }
  
  // Title/description quality (20% weight)
  if (title.length > 20 && description.length > 50) {
    score += 0.2;
  } else if (title.length > 10) {
    score += 0.1;
  }
  
  return Math.min(1.0, score);
}

/**
 * Analyze sentiment of text (simple heuristic)
 */
function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const positiveWords = ['gain', 'rise', 'win', 'success', 'growth', 'increase', 'positive', 'bullish', 'rally', 'surge', 'boost', 'improve', 'strong', 'beat', 'exceed'];
  const negativeWords = ['loss', 'fall', 'lose', 'failure', 'decline', 'decrease', 'negative', 'bearish', 'crash', 'drop', 'risk', 'concern', 'weak', 'fear', 'miss', 'plunge'];
  
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
 * Fetch news from Perigon API
 * Docs: https://docs.perigon.io/docs/getting-started
 * Only returns credible, market-moving news
 */
async function fetchFromPerigonAPI(query: string, marketCategory?: string): Promise<NewsArticle[]> {
  if (!PERIGON_API_KEY) {
    console.log('[News] No NEWS_API_KEY (Perigon) configured');
    return [];
  }

  try {
    // Build enhanced query with market-moving keywords
    const enhancedQuery = query;
    
    // Map categories to Perigon topics/categories
    const categoryMap: Record<string, string> = {
      politics: 'politics,policy',
      crypto: 'cryptocurrency,finance',
      sports: 'sports',
      economy: 'economy,finance,business',
      world: 'world,politics',
      business: 'business,finance,economy',
    };
    
    const topics = marketCategory && categoryMap[marketCategory] 
      ? categoryMap[marketCategory] 
      : 'business,finance,economy'; // Default to financial news

    // Build params - Perigon might not support all parameters
    const params = new URLSearchParams({
      q: enhancedQuery,
      sortBy: 'date',
      size: '20', // Fetch more to filter down
      language: 'en',
    });
    
    // Add category if it's a simple category (not comma-separated)
    // Note: Perigon might reject this parameter, so we'll let the retry handle it
    // if (marketCategory && ['business', 'finance', 'economy'].includes(marketCategory)) {
    //   params.append('category', 'Business');
    // }
    
    // Add date filter (last 7 days) - use YYYY-MM-DD format
    // Note: Only add if we're not getting 422 errors
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const dateStr = sevenDaysAgo.toISOString().split('T')[0]; // YYYY-MM-DD format
      params.append('from', dateStr);
    } catch (e) {
      console.warn('[News] Date calculation error, skipping date filter:', e);
    }

    let response = await fetch(`${PERIGON_API_URL}/articles/all?${params}`, {
      headers: {
        'x-api-key': PERIGON_API_KEY,
        'User-Agent': 'PulseForge/1.0',
      },
    });

    // If 422 (validation error), try with minimal parameters
    if (!response.ok && response.status === 422) {
      const errorText = await response.text();
      console.error('[News] Perigon API 422 error:', errorText);
      console.log('[News] Retrying with minimal parameters (removing date/category filters)...');
      
      const minimalParams = new URLSearchParams({
        q: enhancedQuery,
        size: '20',
        sortBy: 'date',
        language: 'en',
      });
      
      response = await fetch(`${PERIGON_API_URL}/articles/all?${minimalParams}`, {
        headers: {
          'x-api-key': PERIGON_API_KEY,
          'User-Agent': 'PulseForge/1.0',
        },
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[News] Perigon API error:', response.status, errorText);
      return [];
    }

    const data = await response.json();
    
    // Perigon returns articles in an 'articles' array (check both for safety)
    const articles = data.articles || data.results || [];
    
    if (!Array.isArray(articles)) {
      console.warn('[News] Unexpected response format from Perigon API:', Object.keys(data));
      return [];
    }

    console.log(`[News] Received ${articles.length} articles from Perigon API`);

    // Filter and score articles for market impact
    const scoredArticles = articles
      .filter((article: { 
        url?: string; 
        title?: string; 
        source?: { name?: string; domain?: string };
        categories?: Array<{name: string}>;
      }) => {
        // Only include articles with valid URLs and titles
        if (!article.url || !article.url.startsWith('http') || !article.title || !article.title.trim()) {
          return false;
        }
        
        // Only include credible sources with market-moving content
        const impactScore = calculateMarketImpactScore(article);
        if (impactScore > 0) {
          console.log(`[News] Including article: ${article.title?.substring(0, 50)}... (score: ${impactScore.toFixed(2)})`);
        }
        return impactScore > 0;
      })
      .map((article: {
        title?: string;
        description?: string;
        source?: { name?: string; domain?: string };
        categories?: Array<{name: string}>;
        url?: string;
        articleUrl?: string;
        publishedAt?: string;
        pubDate?: string;
      }) => {
        const impactScore = calculateMarketImpactScore(article);
        const keywordScore = hasMarketMovingContent(article.title || '', article.description || '');
        
        return {
          title: article.title || 'Untitled',
          description: article.description || '',
          source: article.source?.name || article.source?.domain || 'Unknown Source',
          url: article.url || article.articleUrl || '',
          publishedAt: article.publishedAt || article.pubDate || new Date().toISOString(),
          relevanceScore: impactScore, // Use market impact score
          sentiment: analyzeSentiment((article.title || '') + ' ' + (article.description || '')),
          _keywordScore: keywordScore, // Internal for sorting
          _impactScore: impactScore, // Internal for sorting
        };
      })
      // Sort by market impact score (highest first)
      .sort((a: NewsArticle & { _keywordScore: number; _impactScore: number }, 
             b: NewsArticle & { _keywordScore: number; _impactScore: number }) => {
        if (b._impactScore !== a._impactScore) {
          return b._impactScore - a._impactScore;
        }
        return b._keywordScore - a._keywordScore;
      })
      // Remove internal fields and return as NewsArticle
      .map(({ _keywordScore, _impactScore, ...article }): NewsArticle => article);

    return scoredArticles;
  } catch (error) {
    console.error('[News] Perigon fetch error:', error);
    return [];
  }
}

/**
 * Search for news related to a market
 * Fetches only credible, market-moving news from Perigon API
 */
export async function searchNews(market: Market): Promise<NewsSearchResult> {
  const query = buildSearchQuery(market);
  console.log('[News] Searching for credible market-moving news via Perigon:', query);

  // Fetch from Perigon API with category filtering
  const articles = await fetchFromPerigonAPI(query, market.category);

  // Additional validation - ensure URLs are valid (relaxed threshold)
  const validArticles = articles.filter(article => 
    article.url && 
    article.url !== '#' && 
    (article.url.startsWith('http://') || article.url.startsWith('https://')) &&
    article.relevanceScore > 0.3 // Lower threshold to allow more articles
  );

  if (validArticles.length === 0 && articles.length > 0) {
    console.warn('[News] All articles filtered out - only showing credible, market-moving news');
  }

  if (validArticles.length === 0) {
    console.log('[News] No credible market-moving news found. Only showing news from established sources that impact markets.');
  } else {
    console.log(`[News] Found ${validArticles.length} credible market-moving articles (filtered from ${articles.length} total)`);
  }

  return {
    articles: validArticles.slice(0, 10), // Return top 10 market-moving articles
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
