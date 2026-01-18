# PulseForge

**Real-Time Polymarket Strategy & Research Tool**

PulseForge is a production-ready web application for prediction market traders and researchers. It provides unique capabilities for building multi-market strategies, scanning for market inefficiencies, and generating AI-powered research briefs using **live data from Polymarket**.

![PulseForge Screenshot](https://via.placeholder.com/800x400?text=PulseForge+Live+Demo)

## 🔴 Live Polymarket Data

This app fetches **real-time data** directly from Polymarket's public APIs:

- **[Gamma API](https://gamma-api.polymarket.com)** - Market discovery, metadata, prices, and events
- **[CLOB API](https://clob.polymarket.com)** - Orderbook depth, current prices
- **No mock data** - All market data is fetched live from Polymarket

Based on the official [Polymarket API Documentation](https://docs.polymarket.com/quickstart/overview).

## 🎯 What It Does

1. **Markets Explorer** - Browse **live** Polymarket data with search, category filters, and sorting by volume, recency, volatility, or price change.

2. **Strategy Builder with Payoff Surface** - Build multi-market positions and visualize payoff curves AND payoff surfaces (probability × time-to-resolution). Includes time-value discounting for opportunity cost analysis.

3. **Inefficiency Scanner** - Detect constraint violations across market clusters:
   - Sum-to-one violations for mutually exclusive outcomes
   - Threshold consistency checks (P(X>100k) should ≤ P(X>80k))
   - Arbitrage bundle detection

4. **Gemini AI Briefs** - Generate structured, evidence-backed market analysis with resolution checklists, key variables, scenario analysis, and debate prompts.

5. **Seda Post Composer** - Create formatted posts optimized for engagement and debate, ready to copy with the required `#nexhacks` tag.

## 🚀 Quick Start

```bash
# Clone and navigate to the project
cd pulseforge

# Install dependencies
npm install

# Copy environment file and add your Gemini API key (optional)
cp env.example .env.local
# Edit .env.local and add GEMINI_API_KEY=your_key_here

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔑 Environment Variables

Create a `.env.local` file based on `env.example`:

```env
# Optional: For AI briefs (get one at https://makersuite.google.com/app/apikey)
GEMINI_API_KEY=your_gemini_api_key_here

# Polymarket API URLs (uses defaults if not set)
POLYMARKET_GAMMA_URL=https://gamma-api.polymarket.com
POLYMARKET_CLOB_URL=https://clob.polymarket.com
```

**Note:** The app works without a Gemini API key (uses mock briefs for AI features). Market data is **always fetched live** from Polymarket.

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

## 🎬 Demo Script (90 seconds)

### 1. Explore Live Markets (15 sec)
- Open the app and see the **LIVE** badge indicating real-time data
- Use search to find "Bitcoin" markets
- Show that these are actual Polymarket markets with live prices

### 2. Build a Market Cluster (20 sec)
- Click "Build Cluster" button
- Add 3 related Bitcoin threshold markets
- Click "Scan for Inefficiencies"
- Show the scanner detecting threshold inconsistency

### 3. Analyze Payoff Surface (25 sec)
- Click into a market detail page
- Go to Strategy tab
- Add position (YES on underpriced market)
- Click "Analyze Payoff Surface"
- Show the payoff curve and heatmap
- Adjust the discount rate slider to show time-value impact

### 4. Generate AI Brief (15 sec)
- Switch to "AI Brief" tab
- Click "Generate Brief"
- Show the structured analysis with resolution checklist, key variables, and debate prompts

### 5. Create Seda Post (15 sec)
- Switch to "Seda" tab
- Enter a thesis
- Click "Copy to Clipboard"
- Show the formatted post with `#nexhacks` tag

## 🏗 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **AI:** Google Gemini API
- **Validation:** Zod
- **Testing:** Vitest

## 📁 Project Structure

```
pulseforge/
├── app/                    # Next.js App Router pages
│   ├── api/               # Server-side API routes
│   │   ├── markets/       # Fetches from Gamma API
│   │   ├── market/[id]/   # Market detail + history + orderbook
│   │   ├── gemini/        # Gemini AI integration
│   │   └── scanner/       # Inefficiency scanner
│   ├── market/[id]/       # Market detail page
│   └── research/          # Research drafts page
├── components/
│   ├── ui/                # Reusable UI components
│   ├── layout/            # Header, Footer
│   ├── markets/           # Market cards, grid, search
│   ├── charts/            # Price chart, payoff visualizations
│   ├── strategy/          # Strategy builder
│   ├── scanner/           # Inefficiency scanner
│   └── research/          # Gemini brief, Seda composer
├── lib/
│   ├── polymarket/        # API client for Gamma & CLOB APIs
│   ├── gemini/            # Gemini API client
│   └── math/              # Payoff, discounting, scanner logic
├── types/                 # TypeScript types
├── hooks/                 # Custom React hooks
├── context/               # React contexts
└── __tests__/             # Unit tests
```

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Run tests once
npm run test:run
```

## ⚠️ Known Limitations

1. **Read-only:** No wallet connection or trade execution - this is a research tool only.

2. **Rate Limits:** Polymarket APIs may rate limit requests. The app caches responses to minimize API calls.

3. **Network Required:** App requires internet connection to fetch live data from Polymarket.

4. **Gemini Rate Limits:** Free tier has rate limits. The app handles this gracefully with retries and mock fallback.

5. **Mobile UX:** Optimized for desktop; mobile is functional but some features work better on larger screens.

## 🔧 API Error Handling

If Polymarket APIs are unavailable:
- The app shows an error message with retry option
- Links to Polymarket API documentation for troubleshooting
- Cached data is used when available

## 🎨 Design System

- **Background:** #09090b
- **Surfaces:** #18181b
- **Borders:** #27272a
- **Text Primary:** #fafafa
- **Text Secondary:** #a1a1aa
- **Bullish/Yes:** #2563eb → #3b82f6
- **Bearish/No:** #ea580c → #f97316
- **Success:** #22c55e
- **Warning:** #eab308

## 📜 Disclaimer

**This is a demo research tool. Not financial advice.**

All predictions are based on market data and AI analysis which may be inaccurate. Do not make financial decisions based solely on this tool.

## 🏆 Built For

NexHacks Hackathon targeting:
- Polymarket sponsor track
- Seda sponsor track
- Gemini AI integration

Tag: `#nexhacks`

## 📚 Resources

- [Polymarket API Docs](https://docs.polymarket.com/quickstart/overview)
- [Polymarket Developer Quickstart](https://docs.polymarket.com/quickstart/fetching-data)
- [Gamma API Reference](https://docs.polymarket.com/developers/gamma/overview)
- [CLOB API Reference](https://docs.polymarket.com/developers/CLOB/introduction)

---

Made with ☕ and Claude
