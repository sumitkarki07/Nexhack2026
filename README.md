# PulseForge

**Real-Time Polymarket Strategy & Research Tool**

PulseForge is a production-ready web application for prediction market traders and researchers. It provides unique capabilities for building multi-market strategies, scanning for market inefficiencies, and generating AI-powered research briefs using **live data from Polymarket**.

![PulseForge Screenshot](https://via.placeholder.com/800x400?text=PulseForge+Live+Demo)

## 🔴 Live Polymarket Data

This app fetches **real-time data** directly from Polymarket's public APIs:

- **[Gamma API](https://gamma-api.polymarket.com)** - Market discovery, metadata, prices, and events
- **[CLOB API](https://clob.polymarket.com)** - Orderbook depth, current prices
- **No mock data** - All market data is fetched live from Polymarket
- **Optimized Performance** - Smart caching, request deduplication, and pagination for fast load times

Based on the official [Polymarket API Documentation](https://docs.polymarket.com/quickstart/overview).

## 🎯 Key Features

### 1. **Markets Explorer**
- Browse **live** Polymarket data with real-time updates
- Advanced search and category filtering (Politics, Crypto, Sports, Pop Culture, Business, Science, World)
- **Trending markets** detection based on volume, price change, volatility, and recency
- Sorting by Volume, Recent, Volatility, Change, or Trending
- Optimized pagination - fetches only what you need
- Fast response times (< 800ms first load, < 200ms cached)

### 2. **User Authentication & Profiles**
- Sign In / Sign Up with email and password
- Guest mode for quick access
- User profiles with customizable interests
- Personalized market recommendations based on interests
- Theme preferences (Light/Dark/System)

### 3. **Strategy Builder with Payoff Surface**
- Build multi-market positions and visualize payoff curves
- Payoff surfaces (probability × time-to-resolution)
- Time-value discounting for opportunity cost analysis
- Interactive position management

### 4. **Market Cluster Builder**
- Select multiple related markets for analysis
- Visual feedback for selected markets
- Build clusters for inefficiency scanning
- Analyze relationships between markets

### 5. **Inefficiency Scanner**
- Detect constraint violations across market clusters:
  - **Sum-to-one violations** for mutually exclusive outcomes
  - **Threshold consistency checks** (P(X>100k) should ≤ P(X>80k))
  - **Arbitrage bundle detection**
- Real-time scanning with configurable thresholds

### 6. **AI-Powered Research**
- **Google Gemini AI** integration for market analysis
- Structured research briefs with:
  - Market overview and key metrics
  - Resolution checklists
  - Key variables and factors
  - Scenario analysis
  - Counter-arguments
  - Related news and analysis (real news from NewsAPI)
- Dynamic tense adjustment based on market resolution status
- Automatic research generation when opening a market

### 7. **Settings & Customization**
- Theme switching (Light/Dark/System)
- Auto-refresh preferences
- Notification settings
- Price alerts configuration
- Cache management
- Developer options

### 8. **Modern UI/UX**
- Animated splash screen on app load
- Smooth transitions and animations (Framer Motion)
- Responsive design (mobile-friendly)
- Dark/Light mode support
- Toast notifications
- Loading states and skeletons

## 🚀 Quick Start

```bash
# Clone and navigate to the project
cd Nexhack2026

# Install dependencies
npm install

# Copy environment file and add your API keys
cp env.example .env.local
# Edit .env.local and add:
#   GEMINI_API_KEY=your_key_here (for AI research)
#   NEWS_API_KEY=your_key_here (for real news articles)

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔑 Environment Variables

Create a `.env.local` file based on `env.example`:

```env
# Required for AI research briefs
# Get one at https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Required for real news articles in research
# Get one at https://newsapi.org/
NEWS_API_KEY=your_news_api_key_here

# Polymarket API URLs (uses defaults if not set)
POLYMARKET_GAMMA_URL=https://gamma-api.polymarket.com
POLYMARKET_CLOB_URL=https://clob.polymarket.com
```

**Note:** 
- The app works without a Gemini API key, but AI research features will be limited
- The app works without a NewsAPI key, but research will not include related news articles
- Market data is **always fetched live** from Polymarket

## 📡 Polymarket API Integration

PulseForge uses the following Polymarket API endpoints:

| Feature | API | Endpoint | Docs |
|---------|-----|----------|------|
| Market List | Gamma | `GET /markets?active=true&closed=false` | [Fetching Data](https://docs.polymarket.com/quickstart/fetching-data) |
| Market Detail | Gamma | `GET /markets/{id}` | [Market Details](https://docs.polymarket.com/quickstart/fetching-data#get-market-details) |
| Price History | Gamma | `GET /prices?market={id}` | [Timeseries](https://docs.polymarket.com/developers/CLOB/timeseries) |
| Current Price | CLOB | `GET /price?token_id={id}&side=buy` | [Current Price](https://docs.polymarket.com/quickstart/fetching-data#get-current-price) |
| Orderbook | CLOB | `GET /book?token_id={id}` | [Orderbook](https://docs.polymarket.com/quickstart/fetching-data#get-orderbook-depth) |
| Categories | Gamma | `GET /tags` | [Tags](https://docs.polymarket.com/developers/gamma/tags) |

### Performance Optimizations

- **Smart Caching**: In-memory cache with TTL and stale-while-revalidate
- **Request Deduplication**: Single-flight pattern prevents duplicate API calls
- **Pagination**: Fetches only the requested page of markets
- **Concurrency Limits**: Controlled parallel requests to prevent rate limiting
- **Background Refresh**: Non-blocking cache updates

## 🎬 Demo Script

### 1. Authentication & Onboarding (20 sec)
- Splash screen with animated logo
- Sign up or continue as guest
- Select interests (Politics, Crypto, Sports, etc.)
- See personalized market recommendations

### 2. Explore Live Markets (15 sec)
- Browse markets with live data
- Use category filters (Politics, Crypto, Sports, etc.)
- Try the "Trending" filter to see hot markets
- Search for specific markets
- Sort by Volume, Recent, Volatility, Change, or Trending

### 3. Build a Market Cluster (20 sec)
- Click "Build Cluster" button
- Click on multiple markets to add them to the cluster
- See visual feedback (highlighted borders, checkmarks)
- Click "Scan for Inefficiencies"
- View detected violations (sum-to-one, threshold consistency, arbitrage)

### 4. Analyze Payoff Surface (25 sec)
- Click into a market detail page
- Go to Strategy tab
- Add position (YES on underpriced market)
- Click "Analyze Payoff Surface"
- Show the payoff curve and heatmap
- Adjust the discount rate slider to show time-value impact

### 5. Generate AI Research Brief (20 sec)
- Click "Research" button on any market
- View automatically generated AI analysis
- See structured sections: Overview, Key Variables, Scenarios, Counter-Arguments
- Click on related news articles (real sources from NewsAPI)
- Copy insights for your own analysis

### 6. Customize Settings (10 sec)
- Click user profile → Settings
- Switch between Light/Dark/System themes
- Configure auto-refresh, notifications, and alerts
- Clear cache if needed

## 🏗 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with CSS variables for theming
- **Charts:** Recharts
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **AI:** Google Gemini API
- **News:** NewsAPI
- **Validation:** Zod
- **Testing:** Vitest
- **State Management:** React Context API
- **Storage:** LocalStorage (for demo purposes)

## 📁 Project Structure

```
Nexhack2026/
├── app/                    # Next.js App Router pages
│   ├── api/               # Server-side API routes
│   │   ├── markets/       # Optimized market fetching with caching
│   │   ├── market/[id]/   # Market detail + history + orderbook
│   │   ├── gemini/        # Gemini AI integration
│   │   ├── research/      # AI research generation
│   │   ├── scanner/       # Inefficiency scanner
│   │   └── polymarket/    # Polymarket API proxy
│   ├── market/[id]/       # Market detail page
│   ├── research/          # Research drafts page
│   ├── about/             # About page
│   ├── privacy/           # Privacy policy
│   ├── terms/             # Terms of service
│   └── help/              # Help and tutorials
├── components/
│   ├── auth/              # Authentication components
│   │   ├── AuthScreen.tsx      # Sign In/Sign Up/Guest screen
│   │   ├── AuthGuard.tsx       # Route protection
│   │   ├── AuthModal.tsx       # Auth modal (legacy)
│   │   └── ProfileSetupModal.tsx # Interest selection
│   ├── ui/                # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── SettingsModal.tsx
│   │   └── ...
│   ├── layout/            # Header, Footer, SplashScreen
│   ├── markets/           # Market cards, grid, search, category pills
│   ├── charts/            # Price chart, payoff visualizations
│   ├── strategy/          # Strategy builder
│   ├── scanner/           # Inefficiency scanner
│   ├── research/          # Gemini brief, research modal
│   └── insights/          # Market insights components
├── lib/
│   ├── polymarket/        # API client for Gamma & CLOB APIs
│   │   ├── client.ts      # Main API client with caching
│   │   ├── cache.ts       # Cache implementation
│   │   ├── simulator.ts  # Market simulation
│   │   └── types.ts       # Type definitions
│   ├── gemini/            # Gemini API client
│   ├── news/              # NewsAPI client
│   └── math/              # Payoff, discounting, scanner logic
├── context/               # React contexts
│   ├── AuthContext.tsx    # Authentication state
│   ├── ThemeContext.tsx   # Theme management
│   └── StrategyContext.tsx # Strategy state
├── hooks/                 # Custom React hooks
│   ├── useMarkets.ts      # Market fetching hook
│   ├── useMarketDetail.ts # Market detail hook
│   └── useLocalStorage.ts # LocalStorage hook
├── types/                 # TypeScript types
└── __tests__/             # Unit tests
```

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Run tests once
npm run test:run
```

## ⚡ Performance Features

### Caching Strategy
- **In-memory cache** with configurable TTL
- **Stale-while-revalidate** for instant responses
- **Request deduplication** prevents duplicate API calls
- **Background refresh** updates cache without blocking

### API Optimization
- **Pagination**: Only fetches requested page of markets
- **Concurrency limits**: Prevents rate limiting
- **Timeout handling**: Graceful error recovery
- **Retry logic**: Automatic retries for failed requests

### Performance Targets
- First request: < 800ms (excluding cold start)
- Cached requests: < 200ms
- Search requests: No full dataset crawling

## ⚠️ Known Limitations

1. **Read-only:** No wallet connection or trade execution - this is a research tool only.

2. **Rate Limits:** Polymarket APIs may rate limit requests. The app caches responses and implements concurrency limits to minimize API calls.

3. **Network Required:** App requires internet connection to fetch live data from Polymarket.

4. **Gemini Rate Limits:** Free tier has rate limits. The app handles this gracefully with retries and error messages.

5. **NewsAPI Rate Limits:** Free tier has limited requests per day. The app gracefully handles missing news.

6. **LocalStorage:** User authentication and preferences are stored in localStorage (demo purposes). For production, use a proper backend.

7. **Mobile UX:** Optimized for desktop; mobile is functional but some features work better on larger screens.

## 🔧 API Error Handling

If Polymarket APIs are unavailable:
- The app shows an error message with retry option
- Links to Polymarket API documentation for troubleshooting
- Cached data is used when available
- Graceful degradation for missing features

## 🎨 Design System

### Color Palette
- **Background:** `#09090b` (dark) / `#ffffff` (light)
- **Surfaces:** `#18181b` (dark) / `#f9fafb` (light)
- **Borders:** `#27272a` (dark) / `#e5e7eb` (light)
- **Text Primary:** `#fafafa` (dark) / `#111827` (light)
- **Text Secondary:** `#a1a1aa` (dark) / `#6b7280` (light)
- **Bullish/Yes:** `#2563eb` → `#3b82f6`
- **Bearish/No:** `#ea580c` → `#f97316`
- **Success:** `#22c55e`
- **Warning:** `#eab308`

### Theme Support
- **Light Mode:** Clean, bright interface
- **Dark Mode:** Default, easy on the eyes
- **System:** Automatically follows OS preference

## 📜 Disclaimer

**This is a demo research tool. Not financial advice.**

All predictions are based on market data and AI analysis which may be inaccurate. Do not make financial decisions based solely on this tool. Always conduct your own research.

## 🏆 Built For

NexHacks 2026 Hackathon targeting:
- Polymarket sponsor track
- Google Gemini AI integration
- Real-time data processing
- Modern web technologies

Tag: `#nexhacks`

## 📚 Resources

- [Polymarket API Docs](https://docs.polymarket.com/quickstart/overview)
- [Polymarket Developer Quickstart](https://docs.polymarket.com/quickstart/fetching-data)
- [Gamma API Reference](https://docs.polymarket.com/developers/gamma/overview)
- [CLOB API Reference](https://docs.polymarket.com/developers/CLOB/introduction)
- [Google Gemini API](https://ai.google.dev/)
- [NewsAPI Documentation](https://newsapi.org/docs)

## 🚧 Roadmap

- [ ] Push notifications (coming soon)
- [ ] Advanced portfolio tracking
- [ ] Social features (share strategies, follow traders)
- [ ] Mobile app (React Native)
- [ ] Backend integration for persistent user data
- [ ] Advanced analytics and insights
- [ ] Export research briefs as PDF

---

Made with ☕ and AI assistance for NexHacks 2026
