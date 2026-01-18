# Deploying PulseForge to Vercel

This guide will help you deploy PulseForge to Vercel.

## Prerequisites

1. A GitHub account
2. A Vercel account (sign up at [vercel.com](https://vercel.com))
3. API keys for the following services:
   - **Perigon API** (News API) - Get from [perigon.io](https://www.perigon.io/products/signals)
   - **Google Gemini API** - Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - (Optional) Other API keys as needed

## Deployment Steps

### Method 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Import project to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Project"
   - Select your GitHub repository
   - Vercel will auto-detect it's a Next.js project

3. **Configure Environment Variables**
   In the "Environment Variables" section, add:
   
   ```
   NEWS_API_KEY=your-perigon-api-key-here
   GEMINI_API_KEY=your-gemini-api-key-here
   ```
   
   Or add them in Vercel dashboard after importing:
   - Go to Project Settings → Environment Variables
   - Add each variable for Production, Preview, and Development

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete
   - Your app will be live at `https://your-project-name.vercel.app`

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N** (for first deployment)
   - Project name? (Enter a name or press Enter for default)
   - Directory? **./** (press Enter)
   - Override settings? **N** (press Enter)

4. **Add Environment Variables**
   ```bash
   vercel env add NEWS_API_KEY
   vercel env add GEMINI_API_KEY
   ```
   
   Enter the values when prompted. Make sure to add them for Production, Preview, and Development.

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Environment Variables

Add these environment variables in Vercel:

| Variable | Description | Required | Where to Get |
|----------|-------------|----------|--------------|
| `NEWS_API_KEY` | Perigon API key for news | Yes | [perigon.io](https://www.perigon.io/products/signals) |
| `GEMINI_API_KEY` | Google Gemini API key | Yes | [Google AI Studio](https://makersuite.google.com/app/apikey) |

### How to Add Environment Variables in Vercel Dashboard

1. Go to your project on Vercel
2. Click **Settings** → **Environment Variables**
3. Click **Add New**
4. Enter the variable name and value
5. Select environments (Production, Preview, Development)
6. Click **Save**
7. **Important**: Redeploy your project after adding new environment variables

## Post-Deployment

After deployment:

1. **Test the deployment**
   - Visit your Vercel URL
   - Test key features (market browsing, AI brief, news)
   - Check API routes are working

2. **Custom Domain (Optional)**
   - Go to Project Settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

3. **Monitor Performance**
   - Check Vercel Analytics
   - Monitor API usage and costs
   - Set up error tracking if needed

## Troubleshooting

### Build Fails

- **Check environment variables**: Make sure all required env vars are set in Vercel
- **Check build logs**: Go to Deployments → Click on failed deployment → View logs
- **TypeScript errors**: Run `npm run build` locally to catch errors before deploying

### API Routes Not Working

- Verify environment variables are set correctly
- Check API rate limits
- Review server logs in Vercel dashboard

### Environment Variables Not Loading

- Make sure variables are added for the correct environment (Production/Preview/Development)
- Redeploy after adding new environment variables
- Check variable names match exactly (case-sensitive)

## Vercel Configuration

Vercel auto-detects Next.js projects, but you can customize with `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

The default configuration works out of the box, so `vercel.json` is optional.

## Continuous Deployment

Once connected to GitHub, Vercel automatically:
- Deploys on every push to `main` branch (Production)
- Creates preview deployments for pull requests
- Runs builds and tests automatically

## Need Help?

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- Check build logs in Vercel dashboard for specific errors
