# Content OS

A full-stack content planning and AI-powered scripting platform for short-form video creators. Manage your content pipeline from idea to publish — with AI that writes in your voice.

## Features

- **Dashboard** — At-a-glance stats (total cards, in-progress, scheduled today) with platform filtering (All / Instagram / YouTube)
- **Kanban Board** — Drag-and-drop cards across columns: Idea → Scripted → Filming → Editing → Scheduled → Published
- **Calendar View** — Month-based grid showing scheduled content; click any day to add a new card
- **AI Pipeline** — Four-tab workflow powered by Google Gemini:
  - **Scraper** — Pull trending topics from Instagram Reels & YouTube Shorts via Apify
  - **Validator** — Score scraped ideas for virality, relevance, and feasibility
  - **Script Writer** — Generate scripts trained on your voice samples
  - **Hook Generator** — Create multiple hook options with confidence scores
  - **Full Pipeline** — Run all four stages in one click with streaming progress
- **Scripts Library** — Browse and search all AI-generated scripts
- **Voice Samples** — Add, edit, and delete writing samples so the AI matches your tone
- **Settings** — Account info and voice sample management
- **Auth** — Google OAuth via Supabase with protected routes and middleware
- **Dark Mode** — Full dark theme with HSL design tokens
- **Responsive** — Mobile-friendly layout with collapsible sidebar

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v3 + shadcn/ui |
| Database | Supabase (Postgres + Auth + RLS) |
| AI | Google Gemini 1.5 Pro |
| Scraping | Apify (Instagram Reels & YouTube Shorts actors) |
| Drag & Drop | @hello-pangea/dnd |
| Date Utils | date-fns |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- A Supabase project
- A Google Gemini API key
- An Apify account (for scraping)

### Installation

```bash
git clone <your-repo-url>
cd content-os
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
APIFY_API_TOKEN=your-apify-token
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `GEMINI_API_KEY` | Google AI Studio API key for Gemini 1.5 Pro |
| `APIFY_API_TOKEN` | Apify platform token for running scraper actors |

### Database Setup

Run the migration in your Supabase SQL editor:

```bash
# Copy the contents of supabase/migration.sql into the Supabase SQL editor and execute
```

This creates three tables: `content_cards`, `ai_runs`, and `voice_samples` with Row Level Security policies.

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login` to authenticate with Google.

### Building for Production

```bash
npm run build
npm start
```

## Deployment (Vercel)

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.local` to the Vercel project settings
4. Configure the Supabase redirect URL: add `https://your-domain.vercel.app/auth/callback` to your Supabase Auth settings under **Redirect URLs**
5. Deploy

## AI Pipeline Usage

### Individual Tabs

1. **Scraper** — Enter a niche keyword, pick a platform, run the scraper. Results show trending topics with engagement stats.
2. **Validator** — Select a previous scrape run, validate ideas. Each idea gets scored on virality, relevance, and feasibility.
3. **Script Writer** — Enter a topic, optionally select voice samples and tone notes, generate a script.
4. **Hook Generator** — Enter a topic (optionally paste script context), generate multiple hooks ranked by confidence.

### Full Pipeline

Enter a topic and click **Run Full Pipeline**. The system will:
1. Generate a script based on the topic
2. Generate hooks for the script
3. Recommend the best hook

You can then create a content card directly from the result.

## Database Schema

```
content_cards
├── id (uuid, PK)
├── user_id (uuid, FK → auth.users)
├── title (text)
├── platform ('instagram' | 'youtube')
├── status ('idea' | 'scripted' | 'filming' | 'editing' | 'scheduled' | 'published')
├── priority ('low' | 'medium' | 'high')
├── scheduled_date (date, nullable)
├── script (text, nullable)
├── hook (text, nullable)
├── notes (text, nullable)
├── checklist (jsonb)
├── created_at (timestamptz)
└── updated_at (timestamptz)

ai_runs
├── id (uuid, PK)
├── user_id (uuid, FK → auth.users)
├── run_type ('scrape' | 'validate' | 'script' | 'hooks' | 'full')
├── input (jsonb)
├── output (jsonb)
└── created_at (timestamptz)

voice_samples
├── id (uuid, PK)
├── user_id (uuid, FK → auth.users)
├── title (text)
├── content (text)
└── created_at (timestamptz)
```

All tables have RLS policies scoped to `auth.uid()`.

## License

MIT
