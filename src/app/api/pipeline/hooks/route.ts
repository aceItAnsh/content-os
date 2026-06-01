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

    const { topic, script } = await request.json();

    const systemPrompt = `You are a hook generator for short-form video content (Instagram Reels and YouTube Shorts).
You must generate exactly 5 hooks using these specific patterns:

1. Aspirational — shows the better version (e.g., "Your content should look like this")
2. Pain point — names a frustration the viewer feels right now
3. Exclusivity — insider knowledge feel (e.g., "Most creators don't know this")
4. Time/Money — specific number, specific result
5. Curiosity gap — unanswerable without watching

RULES:
- Each hook: maximum 2 lines
- Each hook must be speakable in under 4 seconds
- Language: English
- Each hook should feel natural and conversational

Return ONLY a JSON array (no markdown, no code fences) with exactly 5 objects, each having:
- "text": the hook text (string)
- "pattern": the pattern name used (string: "Aspirational", "Pain point", "Exclusivity", "Time/Money", or "Curiosity gap")
- "confidence": confidence score from 1-10 (number)
- "matchedReel": a brief description of what kind of viral reel this hook style matches (string)`;

    const userMessage = `Generate 5 hooks for this topic: ${topic}${
      script ? `\n\nHere's the script for context:\n${script}` : ''
    }`;

    const response = await callGemini(systemPrompt, userMessage);

    let hooks;
    try {
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      hooks = JSON.parse(cleaned);
    } catch {
      hooks = [
        {
          text: response.slice(0, 100),
          pattern: 'General',
          confidence: 5,
          matchedReel: 'N/A',
        },
      ];
    }

    // Save to ai_runs
    await supabase.from('ai_runs').insert({
      user_id: user.id,
      run_type: 'hooks',
      topic,
      output: { hooks },
    });

    return NextResponse.json({ hooks });
  } catch (error) {
    console.error('Hooks error:', error);
    return NextResponse.json(
      { error: 'Failed to generate hooks' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { hook, topic } = await request.json();

    // Find the most recent card with this topic, or create one
    const { data: existingCards } = await supabase
      .from('content_cards')
      .select('*')
      .eq('user_id', user.id)
      .ilike('title', `%${topic}%`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (existingCards && existingCards.length > 0) {
      const { data, error } = await supabase
        .from('content_cards')
        .update({
          hook,
          checklist: { ...existingCards[0].checklist, hook_chosen: true },
        })
        .eq('id', existingCards[0].id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ card: data });
    }

    // Create new card with hook
    const { data, error } = await supabase
      .from('content_cards')
      .insert({
        user_id: user.id,
        title: topic,
        platform: 'instagram',
        status: 'idea',
        hook,
        priority: 'normal',
        checklist: {
          script_written: false,
          hook_chosen: true,
          filmed: false,
          edited: false,
          caption_ready: false,
          posted: false,
        },
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ card: data });
  } catch (error) {
    console.error('Save hook error:', error);
    return NextResponse.json(
      { error: 'Failed to save hook' },
      { status: 500 }
    );
  }
}
