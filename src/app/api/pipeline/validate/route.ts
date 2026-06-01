import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callGemini } from '@/lib/gemini/client';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { runId } = await request.json();

    // Get the scraper run data
    const { data: run, error } = await supabase
      .from('ai_runs')
      .select('*')
      .eq('id', runId)
      .eq('user_id', user.id)
      .single();

    if (error || !run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    const scraperResults = run.output?.results || [];

    const systemPrompt = `You are a content trend analyst for short-form video (Instagram Reels and YouTube Shorts).
You will receive scraped social media post data. Your job is to:

1. Score each post using: Views (40%) + Engagement Rate (35%) + Comments (25%)
2. Filter out posts with: under 10K views, under 2% engagement rate, or older than 30 days
3. Cluster remaining posts by topic
4. Return a JSON object (no markdown, no code fences) with:
   - "recommendation": one recommended topic for the next reel with a clear reason (string)
   - "topTopics": array of top 5 topics ranked by average views, each with "topic" (string) and "avgViews" (number)
   - "topFormats": array of top 3 content formats by engagement, each with "format" (string) and "shares" (number)
   - "repeatSignals": array of strings — topics appearing 3+ times in the data
   - "sustainedTrends": array of strings — topics that appear consistently across the dataset

Return ONLY valid JSON.`;

    const userMessage = `Here is the scraped data from social media:\n\n${JSON.stringify(scraperResults, null, 2)}`;

    const response = await callGemini(systemPrompt, userMessage);

    let output;
    try {
      // Try to parse, handling potential markdown code fences
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      output = JSON.parse(cleaned);
    } catch {
      output = {
        recommendation: response,
        topTopics: [],
        topFormats: [],
        repeatSignals: [],
        sustainedTrends: [],
      };
    }

    // Save to ai_runs
    await supabase.from('ai_runs').insert({
      user_id: user.id,
      run_type: 'validate',
      topic: run.topic || 'Validation',
      output,
    });

    return NextResponse.json({ output });
  } catch (error) {
    console.error('Validate error:', error);
    return NextResponse.json(
      { error: 'Failed to run validator' },
      { status: 500 }
    );
  }
}
