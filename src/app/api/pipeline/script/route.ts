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

    const { topic, voiceSamples, toneNotes } = await request.json();

    const voiceContext = voiceSamples && voiceSamples.length > 0
      ? `Here are examples of the creator's writing style and voice:\n\n${voiceSamples
          .map((s: string, i: number) => `--- Voice Sample ${i + 1} ---\n${s}`)
          .join('\n\n')}`
      : 'No voice samples provided. Use a natural, conversational tone.';

    const systemPrompt = `You are a short-form video script writer for Instagram Reels and YouTube Shorts.
You write scripts that are punchy, engaging, and optimized for retention.

${voiceContext}

${toneNotes ? `Additional tone notes from the creator: ${toneNotes}` : ''}

RULES:
- Structure: [BEAT 1] → [BEAT 2] → [BEAT 3] → [CTA]
- Each beat: 2-3 sentences maximum
- CTA must be comment-trigger style (ask a question, invite opinion)
- Do NOT include a hook — that's handled separately
- Language: English
- Match the creator's vocabulary, sentence structure, and energy from the voice samples
- Keep it speakable — write for speaking, not reading
- Total script should be under 60 seconds when spoken aloud

Output the script with clear beat labels. No additional commentary.`;

    const userMessage = `Write a short-form video script about: ${topic}`;

    const script = await callGemini(systemPrompt, userMessage);

    // Save to ai_runs
    await supabase.from('ai_runs').insert({
      user_id: user.id,
      run_type: 'script',
      topic,
      output: { script },
    });

    return NextResponse.json({ script });
  } catch (error) {
    console.error('Script error:', error);
    return NextResponse.json(
      { error: 'Failed to generate script' },
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

    const { topic, script, hook } = await request.json();

    const { data, error } = await supabase
      .from('content_cards')
      .insert({
        user_id: user.id,
        title: topic,
        platform: 'instagram',
        status: 'scripted',
        script,
        hook: hook || null,
        priority: 'normal',
        checklist: {
          script_written: true,
          hook_chosen: !!hook,
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
    console.error('Save card error:', error);
    return NextResponse.json(
      { error: 'Failed to save card' },
      { status: 500 }
    );
  }
}
