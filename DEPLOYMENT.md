# Content OS — Deployment Guide

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- A Vercel account (free tier works)
- A Google Gemini API key
- An Apify API token

---

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **Anon Key** from Settings → API
3. Note your **Service Role Key** from Settings → API (keep this secret!)

### Run the SQL Migration

1. Go to **SQL Editor** in your Supabase dashboard
2. Paste the contents of `supabase/migration.sql`
3. Click **Run** to create all tables, RLS policies, and indexes

---

## 2. Enable Google OAuth in Supabase

1. In your Supabase dashboard, go to **Authentication → Providers**
2. Enable **Google**
3. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
   - Create a new OAuth 2.0 Client ID
   - Set **Authorized redirect URIs** to:
     - `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`
   - Copy the **Client ID** and **Client Secret**
4. Paste the Client ID and Secret back into Supabase Google provider settings
5. Set the **Redirect URL** in Supabase Auth settings:
   - For local dev: `http://localhost:3000/auth/callback`
   - For production: `https://your-domain.vercel.app/auth/callback`

---

## 3. Get a Google Gemini API Key

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Sign in with your Google account
3. Click **Get API Key** → **Create API key**
4. Copy the generated key
5. This will be your `GEMINI_API_KEY` (free tier available)

---

## 4. Get an Apify API Token

1. Go to [apify.com](https://apify.com) and create an account
2. Navigate to **Settings → Integrations**
3. Copy your **Personal API Token**
4. This will be your `APIFY_API_TOKEN`

---

## 5. Local Development

```bash
# Clone the repo
cd content-os

# Install dependencies
npm install

# Create .env.local file with your keys
cp .env.local.example .env.local
# Edit .env.local and fill in:
# NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
# SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
# GEMINI_API_KEY=AIza...
# APIFY_API_TOKEN=apify_api_...

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## 6. Deploy to Vercel

### Option A: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add GEMINI_API_KEY
vercel env add APIFY_API_TOKEN

# Redeploy with env vars
vercel --prod
```

### Option B: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Import your Git repository
3. Add all environment variables in the project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `APIFY_API_TOKEN`
4. Deploy

---

## 7. Set Supabase Redirect URL for Production

After deploying to Vercel:

1. Go to Supabase Dashboard → **Authentication → URL Configuration**
2. Set **Site URL** to: `https://your-app.vercel.app`
3. Add to **Redirect URLs**:
   - `https://your-app.vercel.app/auth/callback`
4. Go to Google Cloud Console and add:
   - `https://<your-supabase-ref>.supabase.co/auth/v1/callback` to Authorized Redirect URIs (if not already added)

---

## Environment Variables Reference

| Variable | Description | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Supabase Dashboard → Settings → API |
| `GEMINI_API_KEY` | Google Gemini API key | aistudio.google.com → Get API Key |
| `APIFY_API_TOKEN` | Apify scraping API token | apify.com → Settings → Integrations |

---

## Architecture

```
Frontend (Vercel)          Backend (Supabase)
┌──────────────┐          ┌──────────────────┐
│  Next.js App │ ──────── │  PostgreSQL DB    │
│  App Router  │          │  + RLS Policies   │
│  Tailwind    │          │  + Auth (Google)  │
│  shadcn/ui   │          └──────────────────┘
└──────┬───────┘
       │
       │ API Routes
       ▼
┌──────────────┐          ┌──────────────────┐
│  /api/pipe-  │ ──────── │  Google Gemini   │
│  line/*      │          │  (Gemini 1.5 Pro)│
│              │ ──────── │  Apify API       │
│              │          │  (Scrapers)      │
└──────────────┘          └──────────────────┘
```
