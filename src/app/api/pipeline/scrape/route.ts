import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { scrapeInstagramReels, scrapeYouTubeShorts } from '@/lib/apify/scraper';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { keywords, platforms, dateRange, competitors, saveOnly, results: savedResults } = body;

    // saveOnly mode: persist existing results to history without re-scraping
    if (saveOnly && Array.isArray(savedResults)) {
      await supabase.from('ai_runs').insert({
        user_id: user.id,
        run_type: 'scrape',
        topic: (keywords || []).join(', '),
        output: { results: savedResults },
      });
      return NextResponse.json({ saved: true });
    }

    const results: {
      platform: string;
      title: string;
      views: number;
      likes: number;
      comments: number;
      er: number;
      date: string;
      viral: boolean;
    }[] = [];

    // Scrape Instagram
    if (platforms?.instagram) {
      try {
        const igData = await scrapeInstagramReels(keywords || [], competitors || []);
        for (const item of igData.items) {
          const views = Number(item.videoViewCount || item.videoPlayCount || 0);
          const likes = Number(item.likesCount || 0);
          const comments = Number(item.commentsCount || 0);
          const er = views > 0 ? ((likes + comments) / views) * 100 : 0;

          results.push({
            platform: 'Instagram',
            title: String(item.caption || item.shortCode || '').slice(0, 150),
            views,
            likes,
            comments,
            er: Math.round(er * 10) / 10,
            date: String(item.timestamp || item.takenAtTimestamp || ''),
            viral: er > 5 || views > 100000,
          });
        }
      } catch (err) {
        console.error('Instagram scrape error:', err);
      }
    }

    // Scrape YouTube
    if (platforms?.youtube) {
      try {
        const ytData = await scrapeYouTubeShorts(keywords || []);
        for (const item of ytData.items) {
          const views = Number(item.viewCount || item.views || 0);
          const likes = Number(item.likes || item.likeCount || 0);
          const comments = Number(item.commentsCount || item.commentCount || 0);
          const er = views > 0 ? ((likes + comments) / views) * 100 : 0;

          results.push({
            platform: 'YouTube',
            title: String(item.title || '').slice(0, 150),
            views,
            likes,
            comments,
            er: Math.round(er * 10) / 10,
            date: String(item.date || item.uploadDate || ''),
            viral: er > 5 || views > 100000,
          });
        }
      } catch (err) {
        console.error('YouTube scrape error:', err);
      }
    }

    // Save to ai_runs
    await supabase.from('ai_runs').insert({
      user_id: user.id,
      run_type: 'scrape',
      topic: (keywords || []).join(', '),
      output: { results, dateRange, platforms },
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Scrape error:', error);
    return NextResponse.json(
      { error: 'Failed to run scraper' },
      { status: 500 }
    );
  }
}
